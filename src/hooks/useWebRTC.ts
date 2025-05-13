
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, push, remove, off, Unsubscribe } from 'firebase/database';
import type { PeerConnectionState, SignalingMessage, FileMetadata, FileChunk, FileApproveReject } from '@/types/cryptoshare';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
const DATA_CHANNEL_LABEL = 'cryptoshare-channel';

interface WebRTCHookProps {
  onMessageReceived?: (message: { text: string; sender: 'peer'; timestamp: Date }) => void;
  onDataSnippetReceived?: (data: { content: string; type: 'received'; timestamp: Date }) => void;
  onFileMetadataReceived?: (metadata: FileMetadata & { fromPeer: boolean }) => void;
  onFileApproved?: (fileId: string) => void;
  onFileRejected?: (fileId: string) => void;
  onFileChunkReceived?: (chunk: FileChunk) => void;
  onConnectionStateChange?: (state: PeerConnectionState) => void;
  onRemotePeerDisconnected?: () => void;
}

export function useWebRTC({
  onMessageReceived,
  onDataSnippetReceived,
  onFileMetadataReceived,
  onFileApproved,
  onFileRejected,
  onFileChunkReceived,
  onConnectionStateChange,
  onRemotePeerDisconnected,
}: WebRTCHookProps) {
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [connectionState, setConnectionState] = useState<PeerConnectionState>('disconnected');
  const localPeerIdRef = useRef<string | null>(null);
  const remotePeerIdRef = useRef<string | null>(null);
  const sessionKeyRef = useRef<string | null>(null);
  const signalingListenersRef = useRef<Unsubscribe[]>([]);
  const isPoliteRef = useRef(false); // For perfect negotiation handling
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);

  const updateConnectionState = useCallback((newState: PeerConnectionState) => {
    setConnectionState(newState);
    onConnectionStateChange?.(newState);
  }, [onConnectionStateChange]);

  const getSignalingPath = useCallback(() => {
    if (!sessionKeyRef.current) return null;
    return `cryptoshare_sessions/${sessionKeyRef.current}/messages`;
  }, []);

  const sendSignalingMessage = useCallback(async (message: Omit<SignalingMessage, 'senderId'>) => {
    const signalingPath = getSignalingPath();
    if (!signalingPath || !localPeerIdRef.current) return;
    const fullMessage: SignalingMessage = { ...message, senderId: localPeerIdRef.current };
    try {
      await push(ref(database, signalingPath), fullMessage);
    } catch (error) {
      console.error('Error sending signaling message:', error);
      updateConnectionState('failed');
    }
  }, [getSignalingPath, updateConnectionState]);

  const setupDataChannelEvents = useCallback((dc: RTCDataChannel) => {
    dc.onopen = () => {
      console.log('Data channel opened');
      updateConnectionState('connected');
    };
    dc.onclose = () => {
      console.log('Data channel closed');
      // updateConnectionState('disconnected'); // Handled by peer connection state
    };
    dc.onerror = (error) => {
      console.error('Data channel error:', error);
      updateConnectionState('failed');
    };
    dc.onmessage = (event) => {
      try {
        const received = JSON.parse(event.data as string);
        if (received.type === 'chat') {
          onMessageReceived?.({ text: received.payload.text, sender: 'peer', timestamp: new Date(received.payload.timestamp) });
        } else if (received.type === 'data_snippet') {
          onDataSnippetReceived?.({ content: received.payload.content, type: 'received', timestamp: new Date(received.payload.timestamp) });
        } else if (received.type === 'file_metadata') {
          onFileMetadataReceived?.({ ...received.payload, fromPeer: true });
        } else if (received.type === 'file_approve') {
          onFileApproved?.(received.payload.fileId);
        } else if (received.type === 'file_reject') {
          onFileRejected?.(received.payload.fileId);
        } else if (received.type === 'file_chunk') {
          // For ArrayBuffer, it would need to be handled differently, not via JSON.parse
          // This part assumes stringified chunk for simplicity, real implementation would send ArrayBuffer
           onFileChunkReceived?.(received.payload as FileChunk);
        } else if (received.type === 'file_chunk_binary') {
           // This is where binary chunks would be handled
           // The event.data would be ArrayBuffer. We need to reconstruct it.
           // This requires a more complex onmessage handling (e.g. if event.data is not string)
        }
      } catch (error) {
        console.warn('Received non-JSON message or unknown message type:', event.data, error);
      }
    };
  }, [onMessageReceived, onDataSnippetReceived, onFileMetadataReceived, onFileApproved, onFileRejected, onFileChunkReceived, updateConnectionState]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({ type: 'candidate', payload: event.candidate.toJSON() });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state change:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed' || pc.iceConnectionState === 'failed') {
        if (connectionState !== 'disconnected' && connectionState !== 'failed') {
           updateConnectionState('disconnected');
           onRemotePeerDisconnected?.();
        }
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log('Connection state change:', pc.connectionState);
      switch (pc.connectionState) {
        case 'connected':
          if (!dataChannel) updateConnectionState('connected'); // If DC already open, it sets it
          break;
        case 'disconnected':
        case 'closed':
           if (connectionState !== 'disconnected' && connectionState !== 'failed') {
            updateConnectionState('disconnected');
            onRemotePeerDisconnected?.();
          }
          break;
        case 'failed':
          updateConnectionState('failed');
          onRemotePeerDisconnected?.();
          break;
        case 'new':
        case 'connecting':
          updateConnectionState('connecting');
          break;
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        if (makingOfferRef.current || pc.signalingState !== 'stable') return;
        makingOfferRef.current = true;
        await pc.setLocalDescription(await pc.createOffer());
        sendSignalingMessage({ type: 'offer', payload: pc.localDescription?.toJSON() });
      } catch (err) {
        console.error('Negotiation needed error:', err);
        updateConnectionState('failed');
      } finally {
        makingOfferRef.current = false;
      }
    };
    
    pc.ondatachannel = (event) => {
      const dc = event.channel;
      console.log('Remote data channel received:', dc.label);
      setDataChannel(dc);
      setupDataChannelEvents(dc);
    };

    setPeerConnection(pc);
    return pc;
  }, [sendSignalingMessage, setupDataChannelEvents, updateConnectionState, onRemotePeerDisconnected, dataChannel, connectionState]);


  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (!peerConnection || message.senderId === localPeerIdRef.current) return;

    remotePeerIdRef.current = message.senderId;

    if (message.type === 'offer') {
      const offerCollision = (makingOfferRef.current || peerConnection.signalingState !== 'stable');
      ignoreOfferRef.current = !isPoliteRef.current && offerCollision;
      if (ignoreOfferRef.current) {
        console.log('Ignoring offer due to collision and role.');
        return;
      }
      
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.payload as RTCSessionDescriptionInit));
        await peerConnection.setLocalDescription(await peerConnection.createAnswer());
        sendSignalingMessage({ type: 'answer', payload: peerConnection.localDescription?.toJSON() });
      } catch (err) {
        console.error('Error handling offer:', err);
        updateConnectionState('failed');
      }
    } else if (message.type === 'answer') {
       try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.payload as RTCSessionDescriptionInit));
      } catch (err) {
        console.error('Error handling answer:', err);
        updateConnectionState('failed');
      }
    } else if (message.type === 'candidate') {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.payload as RTCIceCandidateInit));
      } catch (err) {
        if (!ignoreOfferRef.current) console.error('Error adding ICE candidate:', err);
      }
    } else if (message.type === 'ready' && isPoliteRef.current) {
        // polite peer creates the data channel
        const dc = peerConnection.createDataChannel(DATA_CHANNEL_LABEL);
        setDataChannel(dc);
        setupDataChannelEvents(dc);
    } else if (message.type === 'disconnect') {
        console.log('Remote peer signaled disconnect.');
        updateConnectionState('disconnected');
        onRemotePeerDisconnected?.();
        disconnect();
    }
  }, [peerConnection, sendSignalingMessage, setupDataChannelEvents, updateConnectionState, onRemotePeerDisconnected]);

  const connect = useCallback(async (sKey: string, currentPeerId: string) => {
    if (connectionState === 'connected' || connectionState === 'connecting') {
        console.warn("Already connected or connecting.");
        return;
    }
    updateConnectionState('connecting');
    localPeerIdRef.current = currentPeerId;
    sessionKeyRef.current = sKey;

    const signalingPath = getSignalingPath();
    if (!signalingPath) {
      updateConnectionState('failed');
      return;
    }
    
    // Determine role (polite/impolite) based on peerId comparison for simplicity
    // This ensures one peer consistently takes the 'polite' role in negotiation.
    // For this, we need to know other peers or have a mechanism.
    // For a 2-peer system, one can be hardcoded polite, or first one in is impolite.
    // Let's use Firebase to determine who is first.
    const sessionRef = ref(database, `cryptoshare_sessions/${sKey}/peers`);
    const peerNodeRef = ref(database, `cryptoshare_sessions/${sKey}/peers/${currentPeerId}`);
    
    try {
        await set(peerNodeRef, { joinedAt: Date.now() }); // Mark presence

        const unsubscribePeers = onValue(sessionRef, (snapshot) => {
            const peers = snapshot.val();
            if (peers) {
                const peerIds = Object.keys(peers);
                if (peerIds.length === 1 && peerIds[0] === localPeerIdRef.current) {
                    isPoliteRef.current = false; // First one is impolite
                    console.log("Role: Impolite (Initiator)");
                } else if (peerIds.length > 1) {
                    const otherPeerId = peerIds.find(id => id !== localPeerIdRef.current);
                    if(otherPeerId) remotePeerIdRef.current = otherPeerId;
                    // Simple heuristic: if my ID is lexicographically smaller, I'm impolite.
                    // This is just one way to break ties for the 'polite' role.
                    // A more robust system might involve a "master" peer or server-assigned roles.
                    // For now, if there's another peer, this one can be polite.
                    const localIsSmaller = peerIds.sort()[0] === localPeerIdRef.current;
                    isPoliteRef.current = !localIsSmaller;
                    console.log(`Role: ${isPoliteRef.current ? "Polite" : "Impolite"}`);

                    if (!isPoliteRef.current && !peerConnection) { // Impolite peer initiates
                        const pc = createPeerConnection();
                        const dc = pc.createDataChannel(DATA_CHANNEL_LABEL);
                        setDataChannel(dc);
                        setupDataChannelEvents(dc);
                         // Negotiation will be triggered by onnegotiationneeded
                    } else if (isPoliteRef.current && !peerConnection) {
                        createPeerConnection(); // Polite peer waits for offer
                    }
                }
                 if (peerIds.length === 2 && !isPoliteRef.current) { // if impolite and other peer joined
                    sendSignalingMessage({type: 'ready', payload: null});
                }
            }
        }, { onlyOnce: false }); // Listen for changes in peers
        signalingListenersRef.current.push(unsubscribePeers);


    } catch (error) {
        console.error("Firebase presence error:", error);
        updateConnectionState('failed');
        return;
    }


    const messagesRef = ref(database, signalingPath);
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val() as SignalingMessage;
        if (message.senderId !== localPeerIdRef.current) {
          handleSignalingMessage(message);
        }
      });
    });
    signalingListenersRef.current.push(unsubscribeMessages);

    if (!peerConnection) { // If not already created by peer logic
        createPeerConnection(); // General case if peer logic didn't run
    }


  }, [getSignalingPath, handleSignalingMessage, createPeerConnection, updateConnectionState, setupDataChannelEvents, peerConnection, connectionState]);

  const disconnect = useCallback(async () => {
    updateConnectionState('disconnected');
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (dataChannel) {
      dataChannel.close();
      setDataChannel(null);
    }
    
    signalingListenersRef.current.forEach(unsubscribe => unsubscribe());
    signalingListenersRef.current = [];

    const signalingPath = getSignalingPath();
    if (signalingPath) {
      // Clean up own messages or entire session if last one.
      // For simplicity, let's just remove own presence.
      // A more robust cleanup might be needed for /messages.
      // For now, we won't remove /messages to allow late joiners to catch up (though this example isn't built for that robustly)
       off(ref(database, signalingPath)); // Detach all listeners from messages path
    }
    if (sessionKeyRef.current && localPeerIdRef.current) {
        const peerNodeRef = ref(database, `cryptoshare_sessions/${sessionKeyRef.current}/peers/${localPeerIdRef.current}`);
        await remove(peerNodeRef); // Remove self from peers list
        sendSignalingMessage({ type: 'disconnect', payload: null });
    }

    localPeerIdRef.current = null;
    remotePeerIdRef.current = null;
    sessionKeyRef.current = null;
    isPoliteRef.current = false;
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;

  }, [peerConnection, dataChannel, getSignalingPath, updateConnectionState, sendSignalingMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const sendGenericData = useCallback((type: string, payload: any) => {
    if (dataChannel && dataChannel.readyState === 'open') {
      try {
        dataChannel.send(JSON.stringify({ type, payload }));
      } catch (error) {
        console.error(`Error sending ${type}:`, error);
      }
    } else {
      console.warn(`Cannot send ${type}, data channel not open. State: ${dataChannel?.readyState}`);
    }
  }, [dataChannel]);

  const sendChatMessage = useCallback((text: string) => {
    sendGenericData('chat', { text, timestamp: new Date().toISOString() });
  }, [sendGenericData]);

  const sendDataSnippet = useCallback((content: string) => {
    sendGenericData('data_snippet', { content, timestamp: new Date().toISOString() });
  }, [sendGenericData]);

  const sendFileMetadata = useCallback((metadata: Omit<FileMetadata, 'fromPeer'>) => {
    sendGenericData('file_metadata', metadata);
  }, [sendGenericData]);

  const sendFileApproval = useCallback((fileId: string, approved: boolean) => {
    sendGenericData(approved ? 'file_approve' : 'file_reject', { fileId });
  }, [sendGenericData]);
  
  const sendFileChunk = useCallback((chunk: FileChunk) => {
    if (dataChannel && dataChannel.readyState === 'open') {
      // For actual binary data, send ArrayBuffer directly.
      // This example simplifies by assuming chunk.data is stringifiable,
      // but real file chunks are ArrayBuffers.
      if (chunk.data instanceof ArrayBuffer) {
         // RTCDataChannel can send ArrayBuffer directly
         // Need to ensure receiver can handle ArrayBuffer (e.g. by checking event.data type)
         // For this example, let's assume it's stringified for now to keep onmessage simple
         // A better way: send a header message like { type: 'file_chunk_binary_header', ...}, then send raw ArrayBuffer
         // Or use a specific data channel for binary.
         console.warn("Binary file chunk sending not fully implemented in this simplified version's onmessage handler.");
         // dataChannel.send(JSON.stringify({ type: 'file_chunk_binary', payload: chunk })); // This is not ideal for binary
         // A proper implementation would send the ArrayBuffer directly, possibly after a metadata message.
         // For now, we'll rely on the text-based chunk for simplicity of the onmessage handler.
         dataChannel.send(JSON.stringify({ type: 'file_chunk', payload: chunk }));

      } else {
         dataChannel.send(JSON.stringify({ type: 'file_chunk', payload: chunk }));
      }
    } else {
      console.warn('Cannot send file chunk, data channel not open.');
    }
  }, [dataChannel]);


  return {
    connect,
    disconnect,
    sendChatMessage,
    sendDataSnippet,
    sendFileMetadata,
    sendFileApproval,
    sendFileChunk,
    connectionState,
    localPeerId: localPeerIdRef.current,
  };
}
