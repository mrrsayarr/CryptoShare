
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionManager } from '@/components/cryptoshare/ConnectionManager';
import { FileTransfer } from '@/components/cryptoshare/FileTransfer';
import { DataTransfer } from '@/components/cryptoshare/DataTransfer';
import { Messaging } from '@/components/cryptoshare/Messaging';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileUp, Send, MessageCircle } from 'lucide-react';
import { useWebRTC } from '@/hooks/useWebRTC';
import type { 
  PeerConnectionState, 
  ChatMessage, 
  DataSnippet, 
  FileMetadata, 
  FileChunk
} from '@/types/cryptoshare';
import type { TransferActivityFile } from '@/types/cryptoshare';
import { useToast } from "@/hooks/use-toast";

export default function CryptosharePage() {
  // This state is now directly driven by useWebRTC's currentWebRTCState
  const [webRTCStateFromHook, setWebRTCStateFromHook] = useState<PeerConnectionState>('disconnected');
  
  const [localSdpOfferForDisplay, setLocalSdpOfferForDisplay] = useState<string | null>(null);
  const [localSdpAnswerForDisplay, setLocalSdpAnswerForDisplay] = useState<string | null>(null);
  const [localIceCandidatesForDisplay, setLocalIceCandidatesForDisplay] = useState<RTCIceCandidateInit[]>([]);
  
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [dataSnippets, setDataSnippets] = useState<DataSnippet[]>([]);
  const [fileActivities, setFileActivities] = useState<TransferActivityFile[]>([]);
  const receivedFileChunks = useRef<Record<string, ArrayBuffer[]>>({});

  const webRTCStateRef = useRef(webRTCStateFromHook);
  useEffect(() => {
    webRTCStateRef.current = webRTCStateFromHook;
  }, [webRTCStateFromHook]);

  const handleConnectionStateChange = useCallback((newState: PeerConnectionState, details?: string) => {
    console.log(`CryptosharePage: Received connection state change from hook: ${newState}, Details: ${details}`);
    setWebRTCStateFromHook(newState); // Update our local copy of the state

    if (newState === 'failed') {
        toast({ title: "Bağlantı Başarısız Oldu", description: details || "P2P bağlantısı kurulamadı.", variant: "destructive"});
    }
    if (newState === 'disconnected' && ['connected', 'connecting', 'offer_generated', 'answer_generated'].includes(webRTCStateRef.current)) { 
        toast({ title: "Bağlantı Kesildi", description: details || "P2P bağlantısı kapandı."});
    }
    
    if (newState === 'disconnected' || newState === 'failed') {
        setLocalSdpOfferForDisplay(null);
        setLocalSdpAnswerForDisplay(null);
        setLocalIceCandidatesForDisplay([]);
        // Optionally reset chat/data/file states here if desired on full disconnect/fail
        // setChatMessages([]);
        // setDataSnippets([]);
        // setFileActivities([]);
        // receivedFileChunks.current = {};
    }
  }, [toast]); // webRTCStateRef is implicitly handled by its own effect

  const handleMessageReceived = useCallback((message: { text: string; sender: 'peer'; timestamp: Date }) => {
    setChatMessages(prev => [...prev, { ...message, id: `msg-${Date.now()}-${Math.random()}` }]);
  }, []);

  const handleDataSnippetReceived = useCallback((snippet: { content: string; type: 'received'; timestamp: Date }) => {
    setDataSnippets(prev => [{ ...snippet, id: `data-${Date.now()}-${Math.random()}` }, ...prev].slice(0, 10));
    toast({ title: "Veri Alındı", description: "Bir veri parçacığı alındı." });
  }, [toast]);

  const handleFileMetadataReceived = useCallback((metadata: FileMetadata & { fromPeer: boolean }) => {
    setFileActivities(prev => [{
      id: metadata.id,
      name: metadata.name,
      size: metadata.size,
      status: 'pending_approval',
      type: 'incoming',
      fromPeer: true,
      progress: 0,
    }, ...prev].slice(0, 5));
    toast({ title: "Gelen Dosya", description: `Dosya alma isteği: ${metadata.name}` });
  }, [toast]);

  const handleFileApprovedByPeer = useCallback((fileId: string) => {
    setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'outgoing' ? { ...f, status: 'transferring' } : f));
     toast({ title: "Dosya Onaylandı", description: "Eşiniz dosya aktarımınızı onayladı." });
  }, [toast]);

  const handleFileRejectedByPeer = useCallback((fileId: string) => {
    setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'outgoing' ? { ...f, status: 'rejected' } : f));
    toast({ title: "Dosya Reddedildi", description: "Eşiniz dosya aktarımınızı reddetti.", variant: "destructive" });
  }, [toast]);
  
  const handleFileChunkReceived = useCallback((chunk: FileChunk) => {
    setFileActivities(prevActivities => {
      return prevActivities.map(activity => {
        if (activity.id === chunk.fileId && activity.type === 'incoming' && activity.status !== 'transferred') {
          if (!receivedFileChunks.current[chunk.fileId]) {
            receivedFileChunks.current[chunk.fileId] = [];
          }
          let bufferData: ArrayBuffer;
          if (typeof chunk.data === 'string') { 
             try {
                const binaryString = window.atob(chunk.data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
                bufferData = bytes.buffer;
             } catch (e) {
                console.error("Error decoding base64 chunk data:", e);
                toast({ title: "Dosya Aktarım Hatası", description: `${activity.name} için veri bloğu çözülürken hata oluştu.`, variant: "destructive" });
                return { ...activity, status: 'error' };
             }
          } else { 
            bufferData = chunk.data; 
          }

          receivedFileChunks.current[chunk.fileId][chunk.chunkNumber] = bufferData;
          const newProgress = Math.round(((chunk.chunkNumber + 1) / chunk.totalChunks) * 100);

          if (chunk.isLast) {
            const fileBlobs = receivedFileChunks.current[chunk.fileId]
                .filter(buffer => buffer) 
                .map(buffer => new Blob([buffer]));
            
            const fullFileBlob = new Blob(fileBlobs, {type: activity.name.endsWith('.txt') ? 'text/plain' : activity.name.endsWith('.json') ? 'application/json' : undefined}); 
            
            const url = URL.createObjectURL(fullFileBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = activity.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            delete receivedFileChunks.current[chunk.fileId];
            toast({ title: "Dosya Alındı", description: `${activity.name} indirildi.` });
            return { ...activity, progress: 100, status: 'transferred' };
          }
          return { ...activity, progress: newProgress, status: 'transferring' };
        }
        return activity;
      });
    });
  }, [toast]);

  const handleLocalSdpReady = useCallback((type: 'offer' | 'answer', sdp: string) => {
    if (type === 'offer') {
      console.log("CryptosharePage: Local Offer SDP Ready for display.");
      setLocalSdpOfferForDisplay(sdp);
      setLocalSdpAnswerForDisplay(null); 
      setLocalIceCandidatesForDisplay([]); // Clear previous ICE when new offer is generated
    } else {
      console.log("CryptosharePage: Local Answer SDP Ready for display.");
      setLocalSdpAnswerForDisplay(sdp);
      setLocalIceCandidatesForDisplay([]); // Clear previous ICE when new answer is generated
    }
  }, []);

  const handleLocalIceCandidateReady = useCallback((candidate: RTCIceCandidateInit) => {
    console.log("CryptosharePage: Local ICE Candidate Ready for display.");
    setLocalIceCandidatesForDisplay(prev => [...prev, candidate]);
  }, []);

  const webRTC = useWebRTC({
    onConnectionStateChange: handleConnectionStateChange,
    onMessageReceived: handleMessageReceived,
    onDataSnippetReceived: handleDataSnippetReceived,
    onFileMetadataReceived: handleFileMetadataReceived,
    onFileApproved: handleFileApprovedByPeer, 
    onFileRejected: handleFileRejectedByPeer, 
    onFileChunkReceived: handleFileChunkReceived,
    onLocalSdpReady: handleLocalSdpReady,
    onLocalIceCandidateReady: handleLocalIceCandidateReady,
  });

  useEffect(() => {
    setMounted(true);
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (['connected', 'connecting', 'offer_generated', 'answer_generated'].includes(webRTCStateRef.current)) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (['connected', 'connecting', 'offer_generated', 'answer_generated'].includes(webRTCStateRef.current)) {
        console.log(`CryptosharePage: Cleanup on unmount/navigation. Current state: ${webRTCStateRef.current}. Disconnecting WebRTC.`);
        webRTC.disconnect(); 
      }
    };
  }, [webRTC.disconnect]); // Only depend on the stable disconnect function


  const handleStartInitiator = useCallback(() => {
    console.log("CryptosharePage: User wants to start Initiator Session.");
    setLocalSdpOfferForDisplay(null); 
    setLocalSdpAnswerForDisplay(null);
    setLocalIceCandidatesForDisplay([]);
    receivedFileChunks.current = {}; 
    webRTC.startInitiatorSession();
  }, [webRTC]);

  const handleProcessOfferAndCreateAnswer = useCallback((offerSdp: string) => {
    console.log("CryptosharePage: User wants to process Offer and Create Answer.");
    setLocalSdpOfferForDisplay(null); 
    setLocalSdpAnswerForDisplay(null);
    setLocalIceCandidatesForDisplay([]);
    receivedFileChunks.current = {};
    webRTC.startGuestSessionAndCreateAnswer(offerSdp);
  }, [webRTC]);
  
  const handleAcceptAnswer = useCallback((answerSdp: string) => {
    console.log("CryptosharePage: User wants to accept Answer.");
    webRTC.acceptAnswer(answerSdp);
  }, [webRTC]);

  const handleAddRemoteIceCandidate = useCallback((candidateJson: string) => {
     try {
        console.log("CryptosharePage: User wants to add Remote ICE Candidate.");
        const candidate = JSON.parse(candidateJson) as RTCIceCandidateInit;
        webRTC.addRemoteIceCandidate(candidate);
     } catch (e) {
        toast({ title: "Geçersiz ICE Adayı", description: "Sağlanan ICE adayı geçerli JSON değildi.", variant: "destructive"});
        console.error("Error parsing ICE candidate JSON:", e);
     }
  }, [webRTC, toast]);

  const handleDisconnectFromManager = useCallback(() => {
    console.log("CryptosharePage: User initiated disconnect from ConnectionManager.");
    webRTC.disconnect(); 
  }, [webRTC]);

  const sendChatMessage = useCallback((text: string) => {
    webRTC.sendChatMessage(text);
    setChatMessages(prev => [...prev, { id: `msg-local-${Date.now()}-${Math.random()}`, text, sender: 'user', timestamp: new Date() }]);
  }, [webRTC]);

  const sendDataSnippet = useCallback((content: string) => {
    webRTC.sendDataSnippet(content);
    setDataSnippets(prev => [{ id: `data-local-${Date.now()}-${Math.random()}`, content, type: 'sent', timestamp: new Date() }, ...prev].slice(0, 10));
  }, [webRTC]);

  const sendFile = useCallback((file: File) => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;
    const metadata: Omit<FileMetadata, 'fromPeer'> = { id: fileId, name: file.name, size: file.size, type: file.type };
    
    setFileActivities(prev => [{
      id: fileId,
      name: file.name,
      size: file.size,
      status: 'waiting_approval', 
      type: 'outgoing',
      progress: 0,
      file: file, 
    }, ...prev].slice(0,5));
    
    webRTC.sendFileMetadata(metadata);
  }, [webRTC]);

  const approveOrRejectIncomingFile = useCallback((fileId: string, approved: boolean) => { 
     webRTC.sendFileApproval(fileId, approved);
     if (approved) {
        setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'incoming' ? {...f, status: 'transferring'} : f));
     } else {
        setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'incoming' ? {...f, status: 'rejected'} : f));
     }
  }, [webRTC]);

  useEffect(() => {
    fileActivities.forEach(activity => {
      if (activity.type === 'outgoing' && activity.status === 'transferring' && activity.file && activity.progress === 0) { 
        const file = activity.file;
        const CHUNK_SIZE = 64 * 1024; 
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let chunkNumber = 0;
        const reader = new FileReader();
        
        console.log(`CryptosharePage: Starting to send chunks for file ${activity.name}, ID: ${activity.id}`);

        function readNextChunk() {
          if (chunkNumber >= totalChunks || webRTCStateRef.current !== 'connected') {
            if (webRTCStateRef.current !== 'connected' && chunkNumber < totalChunks) {
                console.warn(`CryptosharePage: File transfer for ${activity.name} interrupted due to disconnect.`);
                setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, status: 'error', progress: undefined} : f)); 
            }
            return;
          }
          const offset = chunkNumber * CHUNK_SIZE;
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          reader.readAsArrayBuffer(slice);
        }

        reader.onload = (e) => {
          if (e.target?.result && webRTCStateRef.current === 'connected') {
            const chunkData = e.target.result as ArrayBuffer;
            const base64ChunkData = btoa(new Uint8Array(chunkData).reduce((data, byte) => data + String.fromCharCode(byte), ''));

            webRTC.sendFileChunk({
              fileId: activity.id,
              chunkNumber,
              totalChunks,
              data: base64ChunkData,
              isLast: chunkNumber === totalChunks - 1,
            });
            
            const progress = Math.round(((chunkNumber + 1) / totalChunks) * 100);
            setFileActivities(prev => prev.map(f => {
                if (f.id === activity.id) {
                    const isLastChunkSent = chunkNumber === totalChunks - 1;
                    return {...f, progress, status: isLastChunkSent ? 'transferred' : 'transferring'};
                }
                return f;
            }));
            
            chunkNumber++;
            if (chunkNumber < totalChunks) {
              setTimeout(readNextChunk, 10); 
            } else if (chunkNumber === totalChunks) {
                toast({title: "Dosya Gönderildi", description: `${activity.name} başarıyla gönderildi.`});
            }
          } else if (webRTCStateRef.current !== 'connected') {
             console.warn(`CryptosharePage: File transfer for ${activity.name} (onload) interrupted due to disconnect.`);
             setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, status: 'error', progress: undefined} : f));
          }
        };
        reader.onerror = (error) => {
            console.error("Error reading file chunk:", error);
            setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, status: 'error'} : f));
            toast({title: "Dosya Gönderme Hatası", description: `${activity.name} gönderilirken hata oluştu.`, variant: "destructive"});
        };
        readNextChunk();
      }
    });
  }, [fileActivities, webRTC, toast]); // webRTCStateFromHook (via webRTCStateRef) is implicitly handled


  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Cryptoshare Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="flex flex-row items-center space-x-3 pb-4">
          <Shield className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-bold">Güvenli P2P Bağlantısı</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectionManager
            currentConnectionState={webRTCStateFromHook} 
            onStartInitiator={handleStartInitiator}
            onProcessOfferAndCreateAnswer={handleProcessOfferAndCreateAnswer}
            onAcceptAnswer={handleAcceptAnswer}
            onAddRemoteIceCandidate={handleAddRemoteIceCandidate}
            onDisconnect={handleDisconnectFromManager} 
            localSdpOffer={localSdpOfferForDisplay}
            localSdpAnswer={localSdpAnswerForDisplay}
            localIceCandidates={localIceCandidatesForDisplay}
          />
        </CardContent>
      </Card>

      {webRTCStateFromHook === 'connected' && (
        <Tabs defaultValue="file-transfer" className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border shadow-sm">
            <TabsTrigger value="file-transfer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileUp className="mr-2 h-5 w-5" /> Dosya Aktarımı
            </TabsTrigger>
            <TabsTrigger value="data-transfer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Send className="mr-2 h-5 w-5" /> Veri Aktarımı
            </TabsTrigger>
            <TabsTrigger value="messaging" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageCircle className="mr-2 h-5 w-5" /> Mesajlaşma
            </TabsTrigger>
          </TabsList>
          <TabsContent value="file-transfer">
            <FileTransfer 
              onSendFile={sendFile} 
              fileActivities={fileActivities}
              onFileAction={approveOrRejectIncomingFile} 
            />
          </TabsContent>
          <TabsContent value="data-transfer">
            <DataTransfer 
              onSendData={sendDataSnippet}
              dataSnippets={dataSnippets}
            />
          </TabsContent>
          <TabsContent value="messaging">
            <Messaging 
              onSendMessage={sendChatMessage}
              messages={chatMessages}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
