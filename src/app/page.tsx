
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionManager } from '@/components/cryptoshare/ConnectionManager';
import { FileTransfer } from '@/components/cryptoshare/FileTransfer';
import { DataTransfer } from '@/components/cryptoshare/DataTransfer';
import { Messaging } from '@/components/cryptoshare/Messaging';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, FileUp, Send, MessageCircle } from 'lucide-react';
import { useWebRTC } from '@/hooks/useWebRTC';
import type {
  PeerConnectionState,
  ChatMessage,
  DataSnippet,
  FileMetadata,
  FileChunk,
  TransferActivityFile
} from '@/types/cryptoshare';
import { useToast } from "@/hooks/use-toast";

export default function CryptosharePage() {
  const [appWebRTCState, setAppWebRTCState] = useState<PeerConnectionState>('disconnected');
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [connectionErrorDetails, setConnectionErrorDetails] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [dataSnippets, setDataSnippets] = useState<DataSnippet[]>([]);
  const [fileActivities, setFileActivities] = useState<TransferActivityFile[]>([]);
  const receivedFileChunks = useRef<Record<string, ArrayBuffer[]>>({});
  const appWebRTCStateRef = useRef(appWebRTCState);

  useEffect(() => {
    appWebRTCStateRef.current = appWebRTCState;
  }, [appWebRTCState]);

  const handleConnectionStateChange = useCallback((newState: PeerConnectionState, details?: string | { sessionKey?: string }) => {
    console.log(`CryptosharePage: Received connection state change from hook: ${newState}, Details:`, details);
    setAppWebRTCState(newState);
    
    let errorMsg: string | null = null;
    if (typeof details === 'string') {
      errorMsg = details;
    } else if (typeof details === 'object' && details !== null && 'sessionKey' in details) {
       setSessionKey(details.sessionKey);
    }

    setConnectionErrorDetails(errorMsg);


    if (newState === 'disconnected' || newState === 'failed') {
      setSessionKey(null); // Clear session key on disconnect or fail
      if (newState === 'failed') {
        toast({ title: "Connection Failed", description: errorMsg || "P2P connection could not be established.", variant: "destructive"});
      } else if (['connected', 'connecting', 'waiting_for_peer', 'creating_session', 'joining_session'].includes(appWebRTCStateRef.current)) {
         toast({ title: "Disconnected", description: errorMsg || "P2P connection closed."});
      }
    }
    
    if (newState === 'connected') {
      toast({ title: "Connected!", description: "Secure P2P connection established.", className: "bg-green-600 text-white dark:bg-green-700 dark:text-primary-foreground" });
      setConnectionErrorDetails(null); // Clear error details on successful connection
    } else if (newState === 'waiting_for_peer' && typeof details === 'object' && details?.sessionKey) {
      setSessionKey(details.sessionKey);
    }


  }, [toast]);

  const handleMessageReceived = useCallback((message: { text: string; sender: 'peer'; timestamp: Date }) => {
    setChatMessages(prev => [...prev, { ...message, id: `msg-${Date.now()}-${Math.random()}` }]);
  }, []);

  const handleDataSnippetReceived = useCallback((snippet: { content: string; type: 'received'; timestamp: Date }) => {
    setDataSnippets(prev => [{ ...snippet, id: `data-${Date.now()}-${Math.random()}` }, ...prev].slice(0, 10));
    toast({ title: "Data Received", description: "A data snippet has been received." });
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
    toast({ title: "Incoming File", description: `File transfer request: ${metadata.name}` });
  }, [toast]);

  const handleFileApprovedByPeer = useCallback((fileId: string) => {
    setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'outgoing' ? { ...f, status: 'transferring' } : f));
     toast({ title: "File Approved", description: "Your peer approved the file transfer." });
  }, [toast]);

  const handleFileRejectedByPeer = useCallback((fileId: string) => {
    setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'outgoing' ? { ...f, status: 'rejected' } : f));
    toast({ title: "File Rejected", description: "Your peer rejected the file transfer.", variant: "destructive" });
  }, [toast]);

  const handleFileChunkReceived = useCallback((chunk: FileChunk) => {
    setFileActivities(prevActivities => {
      return prevActivities.map(activity => {
        if (activity.id === chunk.fileId && activity.type === 'incoming' && activity.status !== 'transferred' && activity.status !== 'error') {
          // Check if already transferred to prevent re-processing (important for preventing multiple auto-downloads)
          if (activity.status === 'transferred') return activity;

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
                toast({ title: "File Transfer Error", description: `Error decoding data chunk for ${activity.name}.`, variant: "destructive" });
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
            
            const mimeType = activity.name.endsWith('.txt') ? 'text/plain' :
                             activity.name.endsWith('.json') ? 'application/json' :
                             (activity as any).type || undefined; // Use actual file type if available
            const fullFileBlob = new Blob(fileBlobs, {type: mimeType});

            const url = URL.createObjectURL(fullFileBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = activity.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            delete receivedFileChunks.current[chunk.fileId];
            toast({ title: "File Received", description: `${activity.name} has been downloaded.` });
            // Store blob for re-download and ensure status is transferred
            return { ...activity, progress: 100, status: 'transferred', blob: fullFileBlob };
          }
          return { ...activity, progress: newProgress, status: 'transferring' };
        }
        return activity;
      });
    });
  }, [toast]);

  const webRTC = useWebRTC({
    onConnectionStateChange: handleConnectionStateChange,
    onMessageReceived: handleMessageReceived,
    onDataSnippetReceived: handleDataSnippetReceived,
    onFileMetadataReceived: handleFileMetadataReceived,
    onFileApproved: handleFileApprovedByPeer,
    onFileRejected: handleFileRejectedByPeer,
    onFileChunkReceived: handleFileChunkReceived,
  });

  const stableDisconnectRef = useRef(webRTC.disconnect);
  useEffect(() => {
    stableDisconnectRef.current = webRTC.disconnect;
  }, [webRTC.disconnect]);

  useEffect(() => {
    setMounted(true);
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (['connected', 'connecting', 'waiting_for_peer', 'creating_session', 'joining_session'].includes(appWebRTCStateRef.current)) {
        event.preventDefault();
        event.returnValue = 'A P2P session is active. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (['connected', 'connecting', 'waiting_for_peer', 'creating_session', 'joining_session', 'guest_joined'].includes(appWebRTCStateRef.current)) {
        console.log(`CryptosharePage: Cleanup on unmount/navigation. Current state: ${appWebRTCStateRef.current}. Disconnecting WebRTC.`);
        stableDisconnectRef.current();
      }
    };
  }, []);


  const handleCreateSession = useCallback(() => {
    if (!webRTC.supabase) {
        // This case is now handled by useWebRTC directly setting state to 'failed'
        // toast({title: "Supabase Error", description: "Supabase client is not configured. Please check .env and restart.", variant: "destructive"});
        // setAppWebRTCState('failed');
        // setConnectionErrorDetails("Supabase client is not configured. Please check .env and restart.");
        // return;
    }
    console.log("CryptosharePage: User wants to create a new session.");
    receivedFileChunks.current = {};
    setChatMessages([]);
    setDataSnippets([]);
    setFileActivities([]);
    webRTC.createSession();
  }, [webRTC]);

  const handleJoinSession = useCallback((key: string) => {
     if (!webRTC.supabase) {
        // This case is now handled by useWebRTC directly setting state to 'failed'
        // toast({title: "Supabase Error", description: "Supabase client is not configured. Please check .env and restart.", variant: "destructive"});
        // setAppWebRTCState('failed');
        // setConnectionErrorDetails("Supabase client is not configured. Please check .env and restart.");
        // return;
    }
    console.log(`CryptosharePage: User wants to join session with key: ${key}`);
    receivedFileChunks.current = {};
    setChatMessages([]);
    setDataSnippets([]);
    setFileActivities([]);
    webRTC.joinSession(key);
  }, [webRTC]);

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
      file: file, // Store the actual file object for sending
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

  const handleRedownloadReceivedFile = useCallback((fileId: string) => {
    const activity = fileActivities.find(f => f.id === fileId && f.type === 'incoming' && f.status === 'transferred' && f.blob);
    if (activity && activity.blob) {
      const url = URL.createObjectURL(activity.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activity.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "File Downloaded", description: `${activity.name} has been downloaded again.` });
    } else {
      toast({ title: "Download Failed", description: "Could not find the file data to re-download.", variant: "destructive" });
    }
  }, [fileActivities, toast]);

  useEffect(() => {
    fileActivities.forEach(activity => {
      if (activity.type === 'outgoing' && activity.status === 'transferring' && activity.file && activity.progress !== 100) {
        const file = activity.file;
        const CHUNK_SIZE = 64 * 1024; // 64KB
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let chunkNumber = Math.floor((activity.progress || 0) / 100 * totalChunks);

        console.log(`CryptosharePage: Starting/Resuming to send chunks for file ${activity.name}, ID: ${activity.id}, starting at chunk ${chunkNumber}`);

        const reader = new FileReader();

        async function readNextChunk() {
          if (chunkNumber >= totalChunks || appWebRTCStateRef.current !== 'connected') {
            if (appWebRTCStateRef.current !== 'connected' && chunkNumber < totalChunks) {
                console.warn(`CryptosharePage: File transfer for ${activity.name} interrupted due to disconnect.`);
                setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, status: 'error', progress: undefined} : f));
            } else if (chunkNumber >= totalChunks && activity.status !== 'transferred') {
                console.log(`CryptosharePage: All chunks for ${activity.name} processed for sending. Marking as transferred.`);
                setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, status: 'transferred', progress: 100} : f));
                toast({title: "File Sent", description: `${activity.name} has been successfully sent.`});
            }
            return;
          }
          const offset = chunkNumber * CHUNK_SIZE;
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          reader.readAsArrayBuffer(slice);
        }

        reader.onload = async (e) => {
          if (e.target?.result && appWebRTCStateRef.current === 'connected') {
            const chunkData = e.target.result as ArrayBuffer;
            const base64ChunkData = btoa(new Uint8Array(chunkData).reduce((data, byte) => data + String.fromCharCode(byte), ''));

            const chunkPayload: FileChunk = {
              fileId: activity.id,
              chunkNumber,
              totalChunks,
              data: base64ChunkData,
              isLast: chunkNumber === totalChunks - 1,
            };

            try {
              await webRTC.sendFileChunk(chunkPayload); // Now awaits the potentially delayed send

              const progress = Math.round(((chunkNumber + 1) / totalChunks) * 100);
              const isLastChunkSent = chunkNumber === totalChunks - 1;

              setFileActivities(prev => prev.map(f => {
                  if (f.id === activity.id) {
                      return {...f, progress, status: isLastChunkSent ? 'transferred' : 'transferring'};
                  }
                  return f;
              }));
              
              if (isLastChunkSent) {
                toast({title: "File Sent", description: `${activity.name} has been successfully sent.`});
              }

              chunkNumber++;
              if (chunkNumber < totalChunks) {
                setTimeout(readNextChunk, 0); 
              }
            } catch (sendError: any) {
              console.error(`Error sending file chunk for ${activity.name}:`, sendError);
              setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, status: 'error'} : f));
              toast({title: "File Send Error", description: `Error sending ${activity.name}: ${sendError.message || sendError.toString()}`, variant: "destructive"});
            }
          } else if (appWebRTCStateRef.current !== 'connected') {
             console.warn(`CryptosharePage: File transfer for ${activity.name} (onload) interrupted due to disconnect.`);
             setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, status: 'error', progress: undefined} : f));
          }
        };
        reader.onerror = (error) => {
            console.error("Error reading file chunk:", error);
            setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, status: 'error'} : f));
            toast({title: "File Send Error", description: `Error reading ${activity.name} for sending.`, variant: "destructive"});
        };
        readNextChunk();
      }
    });
  }, [fileActivities, webRTC, toast]);


  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-muted-foreground animate-pulse">Cryptoshare Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8 py-4 md:py-8">
      <Card className="w-full max-w-2xl shadow-xl border-border/70">
        <CardHeader className="flex flex-row items-center space-x-3 pb-4 border-b border-border/50">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-bold">Secure P2P Connection</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <ConnectionManager
            currentConnectionState={appWebRTCState}
            sessionKey={sessionKey}
            errorDetails={connectionErrorDetails}
            onCreateSession={handleCreateSession}
            onJoinSession={handleJoinSession}
            onDisconnect={handleDisconnectFromManager}
          />
        </CardContent>
      </Card>

      {appWebRTCState === 'connected' && (
        <Tabs defaultValue="file-transfer" className="w-full max-w-2xl">
          <TabsList className="flex w-full bg-card border border-border shadow-md rounded-lg p-1">
            <TabsTrigger value="file-transfer" className="flex-1 py-2 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">
              <FileUp className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> File Transfer
            </TabsTrigger>
            <TabsTrigger value="data-transfer" className="flex-1 py-2 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">
              <Send className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> Data Transfer
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex-1 py-2 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">
              <MessageCircle className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> Messaging
            </TabsTrigger>
          </TabsList>
          <TabsContent value="file-transfer" className="mt-4">
            <FileTransfer
              onSendFile={sendFile}
              fileActivities={fileActivities}
              onFileAction={approveOrRejectIncomingFile}
              onRedownloadReceivedFile={handleRedownloadReceivedFile}
            />
          </TabsContent>
          <TabsContent value="data-transfer" className="mt-4">
            <DataTransfer
              onSendData={sendDataSnippet}
              dataSnippets={dataSnippets}
            />
          </TabsContent>
          <TabsContent value="messaging" className="mt-4">
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
