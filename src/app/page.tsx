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
import type { TransferActivityFile } from '@/types/cryptoshare'; // Ensure this is correctly imported
import { useToast } from "@/hooks/use-toast";

export default function CryptosharePage() {
  const [currentWebRTCState, setCurrentWebRTCState] = useState<PeerConnectionState>('disconnected');
  const [localSdpOfferForDisplay, setLocalSdpOfferForDisplay] = useState<string | null>(null);
  const [localSdpAnswerForDisplay, setLocalSdpAnswerForDisplay] = useState<string | null>(null);
  const [localIceCandidatesForDisplay, setLocalIceCandidatesForDisplay] = useState<RTCIceCandidateInit[]>([]);
  
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [dataSnippets, setDataSnippets] = useState<DataSnippet[]>([]);
  const [fileActivities, setFileActivities] = useState<TransferActivityFile[]>([]);
  const receivedFileChunks = useRef<Record<string, ArrayBuffer[]>>({});


  const handleConnectionStateChange = useCallback((newState: PeerConnectionState, details?: string) => {
    setCurrentWebRTCState(prevState => {
      console.log(`CryptosharePage: WebRTC state changing from ${prevState} to ${newState}. Details: ${details || 'N/A'}`);
      if (newState === 'failed' && prevState !== 'failed') { // Avoid redundant failed toasts
          toast({ title: "Connection Failed", description: details || "Could not establish P2P connection.", variant: "destructive"});
      }
      // Only show "Disconnected" toast if it's a transition from 'connected' or an unexpected disconnect not already covered by 'failed'
      if (newState === 'disconnected' && prevState === 'connected') { 
          toast({ title: "Disconnected", description: details || "P2P connection closed."});
      }
      
      // Reset SDP and ICE display states when disconnected, unless it's a failed state (failed handles its own UI)
      if (newState === 'disconnected' && prevState !== 'failed') {
          setLocalSdpOfferForDisplay(null);
          setLocalSdpAnswerForDisplay(null);
          setLocalIceCandidatesForDisplay([]);
      }
      return newState;
    });
  }, [toast]);

  const handleRemotePeerDisconnected = useCallback(() => {
    // This might be redundant if onConnectionStateChange already handles failed/disconnected toasts
    // toast({ title: "Peer Disconnected", description: "The other peer has disconnected.", variant: "destructive" });
    console.log("CryptosharePage: Peer disconnected callback triggered.");
    // webRTC.disconnect() will be called internally by useWebRTC hook, updating state via handleConnectionStateChange
  }, [/*toast*/]);

  const handleMessageReceived = useCallback((message: { text: string; sender: 'peer'; timestamp: Date }) => {
    setChatMessages(prev => [...prev, { ...message, id: `msg-${Date.now()}` }]);
  }, []);

  const handleDataSnippetReceived = useCallback((snippet: { content: string; type: 'received'; timestamp: Date }) => {
    setDataSnippets(prev => [{ ...snippet, id: `data-${Date.now()}` }, ...prev].slice(0, 10));
    toast({ title: "Data Received", description: "A data snippet was received." });
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
    toast({ title: "Incoming File", description: `Request to receive file: ${metadata.name}` });
  }, [toast]);

  const handleFileApproved = useCallback((fileId: string) => {
    setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'outgoing' ? { ...f, status: 'transferring' } : f));
     toast({ title: "File Approved", description: "Peer approved your file transfer." });
  }, [toast]);

  const handleFileRejected = useCallback((fileId: string) => {
    setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'outgoing' ? { ...f, status: 'rejected' } : f));
    toast({ title: "File Rejected", description: "Peer rejected your file transfer.", variant: "destructive" });
  }, [toast]);
  
  const handleFileChunkReceived = useCallback((chunk: FileChunk) => {
    setFileActivities(prevActivities => {
      return prevActivities.map(activity => {
        if (activity.id === chunk.fileId && activity.type === 'incoming') {
          if (!receivedFileChunks.current[chunk.fileId]) {
            receivedFileChunks.current[chunk.fileId] = [];
          }
          let bufferData: ArrayBuffer;
          if (typeof chunk.data === 'string') {
             try {
                const binaryString = window.atob(chunk.data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                bufferData = bytes.buffer;
             } catch (e) {
                console.error("Error decoding base64 chunk data:", e);
                const encoder = new TextEncoder();
                bufferData = encoder.encode(chunk.data).buffer;
             }
          } else {
            bufferData = chunk.data; 
          }

          receivedFileChunks.current[chunk.fileId][chunk.chunkNumber] = bufferData;

          const newProgress = Math.round(((chunk.chunkNumber + 1) / chunk.totalChunks) * 100);
          if (chunk.isLast) {
            const fileBlobs = receivedFileChunks.current[chunk.fileId].map(buffer => new Blob([buffer]));
            const fullFileBlob = new Blob(fileBlobs, {type: activity.name.endsWith('.txt') ? 'text/plain' : undefined}); // Basic MIME type inference
            
            const url = URL.createObjectURL(fullFileBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = activity.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            delete receivedFileChunks.current[chunk.fileId];
            toast({ title: "File Received", description: `${activity.name} downloaded.` });
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
      console.log("CryptosharePage: Local Offer SDP Ready");
      setLocalSdpOfferForDisplay(sdp);
    } else {
      console.log("CryptosharePage: Local Answer SDP Ready");
      setLocalSdpAnswerForDisplay(sdp);
    }
  }, []);

  const handleLocalIceCandidateReady = useCallback((candidate: RTCIceCandidateInit) => {
    console.log("CryptosharePage: Local ICE Candidate Ready");
    setLocalIceCandidatesForDisplay(prev => [...prev, candidate]);
  }, []);

  const webRTC = useWebRTC({
    onConnectionStateChange: handleConnectionStateChange,
    onRemotePeerDisconnected: handleRemotePeerDisconnected,
    onMessageReceived: handleMessageReceived,
    onDataSnippetReceived: handleDataSnippetReceived,
    onFileMetadataReceived: handleFileMetadataReceived,
    onFileApproved: handleFileApproved,
    onFileRejected: handleFileRejected,
    onFileChunkReceived: handleFileChunkReceived,
    onLocalSdpReady: handleLocalSdpReady,
    onLocalIceCandidateReady: handleLocalIceCandidateReady,
  });

  const { connectionState: rtcStateFromHook, disconnect: rtcDisconnect } = webRTC;

  useEffect(() => {
    setMounted(true);
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (rtcStateFromHook === 'connected' || rtcStateFromHook === 'connecting') {
        event.preventDefault(); 
        event.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (rtcStateFromHook === 'connected' || rtcStateFromHook === 'connecting') {
        console.log("CryptosharePage: Unloading, disconnecting WebRTC.");
        rtcDisconnect();
      }
    };
  }, [rtcStateFromHook, rtcDisconnect]);

  const handleStartInitiator = useCallback(() => {
    console.log("CryptosharePage: Starting Initiator Session.");
    setLocalSdpOfferForDisplay(null); 
    setLocalSdpAnswerForDisplay(null);
    setLocalIceCandidatesForDisplay([]);
    receivedFileChunks.current = {}; 
    webRTC.startInitiatorSession();
  }, [webRTC]);

  const handleProcessOfferAndCreateAnswer = useCallback((offerSdp: string) => {
    console.log("CryptosharePage: Processing Offer and Creating Answer.");
    setLocalSdpOfferForDisplay(null); 
    setLocalSdpAnswerForDisplay(null);
    setLocalIceCandidatesForDisplay([]);
    receivedFileChunks.current = {};
    webRTC.startGuestSessionAndCreateAnswer(offerSdp);
  }, [webRTC]);
  
  const handleAcceptAnswer = useCallback((answerSdp: string) => {
    console.log("CryptosharePage: Accepting Answer.");
    webRTC.acceptAnswer(answerSdp);
  }, [webRTC]);

  const handleAddRemoteIceCandidate = useCallback((candidateJson: string) => {
     try {
        console.log("CryptosharePage: Adding Remote ICE Candidate.");
        const candidate = JSON.parse(candidateJson) as RTCIceCandidateInit; // Basic validation
        webRTC.addRemoteIceCandidate(candidate);
     } catch (e) {
        toast({ title: "Invalid ICE Candidate", description: "The provided ICE candidate was not valid JSON.", variant: "destructive"});
        console.error("Error parsing ICE candidate JSON:", e);
     }
  }, [webRTC, toast]);

  const handleDisconnect = useCallback(() => {
    console.log("CryptosharePage: User initiated disconnect.");
    webRTC.disconnect(); 
    setChatMessages([]);
    setDataSnippets([]);
    setFileActivities([]);
    receivedFileChunks.current = {};
    // SDP and ICE display states are reset by handleConnectionStateChange when newState is 'disconnected'
    setLocalSdpOfferForDisplay(null);
    setLocalSdpAnswerForDisplay(null);
    setLocalIceCandidatesForDisplay([]);
  }, [webRTC]);

  const sendChatMessage = useCallback((text: string) => {
    webRTC.sendChatMessage(text);
    setChatMessages(prev => [...prev, { id: `msg-local-${Date.now()}`, text, sender: 'user', timestamp: new Date() }]);
  }, [webRTC]);

  const sendDataSnippet = useCallback((content: string) => {
    webRTC.sendDataSnippet(content);
    setDataSnippets(prev => [{ id: `data-local-${Date.now()}`, content, type: 'sent', timestamp: new Date() }, ...prev].slice(0, 10));
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

  const approveRejectFile = useCallback((fileId: string, approved: boolean) => {
     webRTC.sendFileApproval(fileId, approved);
     if (approved) {
        setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'incoming' ? {...f, status: 'transferring'} : f));
     } else {
        setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'incoming' ? {...f, status: 'rejected'} : f));
     }
  }, [webRTC]);

  useEffect(() => {
    fileActivities.forEach(activity => {
      if (activity.type === 'outgoing' && activity.status === 'transferring' && activity.file) {
        const file = activity.file;
        const CHUNK_SIZE = 64 * 1024; 
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let chunkNumber = 0;
        const reader = new FileReader();
        
        function readNextChunk() {
          if (chunkNumber >= totalChunks) return;
          const offset = chunkNumber * CHUNK_SIZE;
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          reader.readAsArrayBuffer(slice);
        }

        reader.onload = (e) => {
          if (e.target?.result) {
            const chunkData = e.target.result as ArrayBuffer;
            // Convert ArrayBuffer to Base64 string for sending via JSON
            const base64ChunkData = btoa(
                new Uint8Array(chunkData).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            webRTC.sendFileChunk({
              fileId: activity.id,
              chunkNumber,
              totalChunks,
              data: base64ChunkData, // Send as base64 string
              isLast: chunkNumber === totalChunks - 1,
            });
            
            const progress = Math.round(((chunkNumber + 1) / totalChunks) * 100);
            setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, progress, status: chunkNumber === totalChunks -1 ? 'transferred': 'transferring'} : f));
            
            chunkNumber++;
            if (chunkNumber < totalChunks) {
              // Add a small delay to avoid overwhelming the data channel, especially for large files
              setTimeout(readNextChunk, 10); // Adjust delay as needed
            } else if (chunkNumber === totalChunks) {
                toast({title: "File Sent", description: `${activity.name} sent successfully.`});
            }
          }
        };
        reader.onerror = (error) => {
            console.error("Error reading file chunk:", error);
            setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, status: 'error'} : f));
            toast({title: "File Send Error", description: `Error sending ${activity.name}.`, variant: "destructive"});
        };
        readNextChunk();
      }
    });
  }, [fileActivities, webRTC, toast]);


  if (!mounted) {
    return null; 
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="flex flex-row items-center space-x-3 pb-4">
          <Shield className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-bold">Secure P2P Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectionManager
            currentConnectionState={currentWebRTCState}
            onStartInitiator={handleStartInitiator}
            onProcessOfferAndCreateAnswer={handleProcessOfferAndCreateAnswer}
            onAcceptAnswer={handleAcceptAnswer}
            onAddRemoteIceCandidate={handleAddRemoteIceCandidate}
            onDisconnect={handleDisconnect}
            localSdpOffer={localSdpOfferForDisplay}
            localSdpAnswer={localSdpAnswerForDisplay}
            localIceCandidates={localIceCandidatesForDisplay}
          />
        </CardContent>
      </Card>

      {currentWebRTCState === 'connected' && (
        <Tabs defaultValue="file-transfer" className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border shadow-sm">
            <TabsTrigger value="file-transfer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileUp className="mr-2 h-5 w-5" /> File Transfer
            </TabsTrigger>
            <TabsTrigger value="data-transfer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Send className="mr-2 h-5 w-5" /> Data Transfer
            </TabsTrigger>
            <TabsTrigger value="messaging" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageCircle className="mr-2 h-5 w-5" /> Messaging
            </TabsTrigger>
          </TabsList>
          <TabsContent value="file-transfer">
            <FileTransfer 
              onSendFile={sendFile} 
              fileActivities={fileActivities}
              onFileAction={approveRejectFile}
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
