
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
  FileChunk,
  TransferActivityFile
} from '@/types/cryptoshare';
import { useToast } from "@/hooks/use-toast";

// Generate a unique ID for the local peer
const generateLocalPeerId = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    let peerId = localStorage.getItem('cryptoshare-peerId');
    if (!peerId) {
      peerId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('cryptoshare-peerId', peerId);
    }
    return peerId;
  }
  return Math.random().toString(36).substring(2, 15); // Fallback for non-browser env or no localStorage
};


export default function CryptosharePage() {
  const [uiIsConnected, setUiIsConnected] = useState(false); // UI representation of connection
  const [sessionKey, setSessionKey] = useState('');
  const [mounted, setMounted] = useState(false);
  const [localPeerId] = useState(generateLocalPeerId());
  const { toast } = useToast();

  // For child components
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [dataSnippets, setDataSnippets] = useState<DataSnippet[]>([]);
  const [fileActivities, setFileActivities] = useState<TransferActivityFile[]>([]);
  const receivedFileChunks = useRef<Record<string, ArrayBuffer[]>>({});


  const handleConnectionStateChange = useCallback((state: PeerConnectionState) => {
    setUiIsConnected(state === 'connected');
    if (state === 'failed') {
        toast({ title: "Connection Failed", description: "Could not establish P2P connection.", variant: "destructive"});
    }
    if (state === 'disconnected') {
        toast({ title: "Disconnected", description: "P2P connection closed."});
    }
  }, [toast]);

  const handleRemotePeerDisconnected = useCallback(() => {
    toast({ title: "Peer Disconnected", description: "The other peer has disconnected.", variant: "destructive" });
    // `disconnect` in useWebRTC will be called, which updates connectionState, triggering above.
  }, [toast]);

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
    // This means the remote peer approved OUR file to be sent.
    setFileActivities(prev => prev.map(f => f.id === fileId && f.type === 'outgoing' ? { ...f, status: 'transferring' } : f));
     toast({ title: "File Approved", description: "Peer approved your file transfer." });
  }, [toast]);

  const handleFileRejected = useCallback((fileId: string) => {
    // This means the remote peer rejected OUR file.
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
          // Assuming chunk.data is ArrayBuffer or can be converted to one.
          let bufferData: ArrayBuffer;
          if (typeof chunk.data === 'string') {
            // This is a placeholder for actual binary data handling.
            // If chunks are sent as base64 strings, they need decoding here.
             try {
                // Attempt to decode base64 string to ArrayBuffer
                const binaryString = window.atob(chunk.data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                bufferData = bytes.buffer;
             } catch (e) {
                console.error("Error decoding base64 chunk data, falling back to TextEncoder:", e);
                // Fallback for non-base64 strings (e.g., if it's plain text)
                const encoder = new TextEncoder();
                bufferData = encoder.encode(chunk.data).buffer;
             }
          } else {
            bufferData = chunk.data; // Already an ArrayBuffer
          }

          receivedFileChunks.current[chunk.fileId][chunk.chunkNumber] = bufferData;

          const newProgress = Math.round(((chunk.chunkNumber + 1) / chunk.totalChunks) * 100);
          let newStatus = activity.status;
          if (chunk.isLast) {
            newStatus = 'transferred';
            // Assemble the file
            const fileBlobs = receivedFileChunks.current[chunk.fileId].map(buffer => new Blob([buffer]));
            const fullFileBlob = new Blob(fileBlobs, {type: activity.name.endsWith('.txt') ? 'text/plain' : undefined}); // Guess MIME, improve this
            
            // Create a URL for download
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
          } else {
            newStatus = 'transferring';
          }
          return { ...activity, progress: newProgress, status: newStatus };
        }
        return activity;
      });
    });
  }, [toast]);


  const webRTC = useWebRTC({
    onConnectionStateChange: handleConnectionStateChange,
    onRemotePeerDisconnected: handleRemotePeerDisconnected,
    onMessageReceived: handleMessageReceived,
    onDataSnippetReceived: handleDataSnippetReceived,
    onFileMetadataReceived: handleFileMetadataReceived,
    onFileApproved: handleFileApproved,
    onFileRejected: handleFileRejected,
    onFileChunkReceived: handleFileChunkReceived,
  });

  useEffect(() => {
    setMounted(true);
     // Add event listener for beforeunload
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (webRTC.connectionState === 'connected' || webRTC.connectionState === 'connecting') {
        // Optionally, you can try to send a disconnect message here if time permits
        // webRTC.disconnect(); // This might not always complete before unload
        
        // Standard way to prompt user, though modern browsers might not show custom message
        event.preventDefault(); // Required for Chrome
        event.returnValue = ''; // Required for older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Ensure disconnect is called when component unmounts or page navigates away
      if (webRTC.connectionState === 'connected' || webRTC.connectionState === 'connecting') {
        webRTC.disconnect();
      }
    };
  }, [webRTC]);

  const handleConnect = useCallback((sKey: string) => {
    setSessionKey(sKey);
    webRTC.connect(sKey, localPeerId);
  }, [webRTC, localPeerId]);

  const handleDisconnect = useCallback(() => {
    webRTC.disconnect();
    // UI is updated via onConnectionStateChange
    setChatMessages([]);
    setDataSnippets([]);
    setFileActivities([]);
    receivedFileChunks.current = {};
  }, [webRTC]);

  // Functions to pass to child components for sending data
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
      status: 'waiting_approval', // Waiting for remote peer to approve
      type: 'outgoing',
      progress: 0,
      file: file, // Store file object for actual sending later
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

  // This effect will trigger sending chunks when a file is approved by remote (status changes to 'transferring')
  // OR when an outgoing file is approved by the remote peer.
  useEffect(() => {
    fileActivities.forEach(activity => {
      if (activity.type === 'outgoing' && activity.status === 'transferring' && activity.file) {
        const file = activity.file;
        const CHUNK_SIZE = 64 * 1024; // 64KB
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
             // Convert ArrayBuffer to base64 string for JSON serialization
            const base64ChunkData = btoa(
                new Uint8Array(chunkData).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            webRTC.sendFileChunk({
              fileId: activity.id,
              chunkNumber,
              totalChunks,
              data: base64ChunkData, // Send base64 string
              isLast: chunkNumber === totalChunks - 1,
            });
            
            // Update UI progress for outgoing file
            const progress = Math.round(((chunkNumber + 1) / totalChunks) * 100);
            setFileActivities(prev => prev.map(f => f.id === activity.id ? {...f, progress, status: chunkNumber === totalChunks -1 ? 'transferred': 'transferring'} : f));
            
            chunkNumber++;
            if (chunkNumber < totalChunks) {
              readNextChunk();
            } else {
                 if (chunkNumber === totalChunks -1 ) { // Check if it was the last chunk
                    toast({title: "File Sent", description: `${activity.name} sent successfully.`});
                 }
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
          <CardTitle className="text-2xl font-bold">Secure Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectionManager
            isConnected={uiIsConnected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            initialSessionKey={sessionKey} // Pass initial to avoid re-render issue
          />
        </CardContent>
      </Card>

      {uiIsConnected && (
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

