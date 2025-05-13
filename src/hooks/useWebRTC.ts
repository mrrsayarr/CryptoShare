
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PeerConnectionState, FileMetadata, FileChunk, FileApproveReject } from '@/types/cryptoshare';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
const DATA_CHANNEL_LABEL = 'cryptoshare-data-channel';

interface WebRTCHookProps {
  onMessageReceived?: (message: { text: string; sender: 'peer'; timestamp: Date }) => void;
  onDataSnippetReceived?: (data: { content: string; type: 'received'; timestamp: Date }) => void;
  onFileMetadataReceived?: (metadata: FileMetadata & { fromPeer: boolean }) => void;
  onFileApproved?: (fileId: string) => void;
  onFileRejected?: (fileId: string) => void;
  onFileChunkReceived?: (chunk: FileChunk) => void;
  onConnectionStateChange?: (state: PeerConnectionState, details?: string) => void;
  onRemotePeerDisconnected?: () => void;
  onLocalSdpReady?: (type: 'offer' | 'answer', sdp: string) => void;
  onLocalIceCandidateReady?: (candidate: RTCIceCandidateInit) => void;
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
  onLocalSdpReady,
  onLocalIceCandidateReady,
}: WebRTCHookProps) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const [connectionState, setConnectionState] = useState<PeerConnectionState>('disconnected');
  const iceCandidatesQueueRef = useRef<RTCIceCandidate[]>([]);

  const updateConnectionState = useCallback((newState: PeerConnectionState, details?: string) => {
    setConnectionState(prevState => {
      if (prevState === newState && !details && newState !== 'connecting') return prevState; 
      onConnectionStateChange?.(newState, details);
      return newState;
    });
  }, [onConnectionStateChange]);

  const disconnectCleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.ondatachannel = null;
      if (peerConnectionRef.current.signalingState !== 'closed') {
        peerConnectionRef.current.close();
      }
      peerConnectionRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.onopen = null;
      dataChannelRef.current.onclose = null;
      dataChannelRef.current.onerror = null;
      dataChannelRef.current.onmessage = null;
      if (dataChannelRef.current.readyState !== 'closed') {
        dataChannelRef.current.close();
      }
      dataChannelRef.current = null;
    }
    iceCandidatesQueueRef.current = [];
  }, []);

  const internalDisconnectHandler = useCallback(() => {
    console.log("internalDisconnectHandler called. Current PC state:", peerConnectionRef.current?.connectionState, "Signaling state:", peerConnectionRef.current?.signalingState);
    disconnectCleanup();
    updateConnectionState('disconnected', 'User initiated disconnect.');
  }, [disconnectCleanup, updateConnectionState]);

  const internalDisconnectHandlerRef = useRef(internalDisconnectHandler);
  useEffect(() => {
    internalDisconnectHandlerRef.current = internalDisconnectHandler;
  }, [internalDisconnectHandler]);


  const setupDataChannelEvents = useCallback((dc: RTCDataChannel) => {
    dc.onopen = () => {
      console.log('Data channel opened');
      if (peerConnectionRef.current && (peerConnectionRef.current.connectionState === 'connected' || peerConnectionRef.current.iceConnectionState === 'connected' || peerConnectionRef.current.iceConnectionState === 'completed')) {
        updateConnectionState('connected', 'Data channel ready');
      }
    };
    dc.onclose = () => {
      console.log('Data channel closed');
      // updateConnectionState('disconnected', 'Data channel closed'); // Let PC state handle primary disconnect
    };
    dc.onerror = (error) => {
      console.error('Data channel error:', error);
      updateConnectionState('failed', 'Data channel error');
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
           onFileChunkReceived?.(received.payload as FileChunk);
        }
      } catch (error) {
        console.warn('Received non-JSON message or unknown message type:', event.data, error);
      }
    };
    dataChannelRef.current = dc;
  }, [onMessageReceived, onDataSnippetReceived, onFileMetadataReceived, onFileApproved, onFileRejected, onFileChunkReceived, updateConnectionState]);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
        console.warn("PeerConnection already exists and not closed. Closing existing one.");
        peerConnectionRef.current.close();
    }
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onLocalIceCandidateReady?.(event.candidate.toJSON());
      }
    };

    pc.oniceconnectionstatechange = () => {
      const currentPc = peerConnectionRef.current;
      if (!currentPc) return;
      console.log('ICE connection state change:', currentPc.iceConnectionState);
      if (currentPc.iceConnectionState === 'failed') {
        updateConnectionState('failed', `ICE state: ${currentPc.iceConnectionState}`);
      } else if (currentPc.iceConnectionState === 'disconnected' || currentPc.iceConnectionState === 'closed') {
         // Delegate to onconnectionstatechange for more unified state management
      }
    };
    
    pc.onconnectionstatechange = () => {
      const currentPc = peerConnectionRef.current;
      if (!currentPc) return;

      const newPcState = currentPc.connectionState;
      console.log('RTC PeerConnection state change:', newPcState);

      switch (newPcState) {
        case 'connected':
          if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
            updateConnectionState('connected', `PeerConnection state: ${newPcState}`);
          }
          break;
        case 'failed':
          updateConnectionState('failed', `PeerConnection state: ${newPcState}`);
          onRemotePeerDisconnected?.();
          break;
        case 'disconnected':
        case 'closed':
          if (currentPc.signalingState === 'closed') {
             updateConnectionState('disconnected', `PeerConnection state: ${newPcState} (Intentional)`);
          } else {
             updateConnectionState('failed', `PeerConnection state: ${newPcState} (Unexpected)`);
             onRemotePeerDisconnected?.();
          }
          break;
        case 'new': 
            updateConnectionState('disconnected', `PeerConnection state: ${newPcState}`);
            break;
        case 'connecting':
           setConnectionState(prevState => {
            if (prevState !== 'connected' && prevState !== 'failed') {
              onConnectionStateChange?.('connecting', `PeerConnection state: ${newPcState}`);
              return 'connecting';
            }
            return prevState;
          });
          break;
      }
    };
    
    pc.ondatachannel = (event) => {
      console.log('Remote data channel received:', event.channel.label);
      setupDataChannelEvents(event.channel);
    };
    
    return pc;
  }, [onLocalIceCandidateReady, updateConnectionState, onRemotePeerDisconnected, setupDataChannelEvents, onConnectionStateChange]);

  const startInitiatorSession = useCallback(async () => {
    if (connectionState !== 'disconnected') {
      console.warn("Cannot start initiator session, not in disconnected state. Current state:", connectionState);
      internalDisconnectHandlerRef.current(); 
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    updateConnectionState('connecting', 'Initiator starting session...');
    const pc = createPeerConnection();
    const dc = pc.createDataChannel(DATA_CHANNEL_LABEL);
    setupDataChannelEvents(dc);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      onLocalSdpReady?.('offer', offer.sdp || '');
      updateConnectionState('offer_generated', 'Offer SDP generated.'); 
    } catch (error) {
      console.error('Error creating offer:', error);
      updateConnectionState('failed', 'Error creating offer.');
    }
  }, [createPeerConnection, setupDataChannelEvents, updateConnectionState, onLocalSdpReady, connectionState]);

  const startGuestSessionAndCreateAnswer = useCallback(async (offerSdp: string) => {
     if (connectionState !== 'disconnected') { 
      console.warn("Cannot start guest session, state is not disconnected. Current state:", connectionState);
      internalDisconnectHandlerRef.current();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    updateConnectionState('connecting', 'Guest processing offer...');
    const pc = createPeerConnection();
    
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
      iceCandidatesQueueRef.current.forEach(async candidate => { 
          if (pc.remoteDescription) await pc.addIceCandidate(candidate);
      });
      iceCandidatesQueueRef.current = []; 
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      onLocalSdpReady?.('answer', answer.sdp || '');
      updateConnectionState('answer_generated', 'Answer SDP generated.');
    } catch (error) {
      console.error('Error creating answer or setting remote description (offer):', error);
      updateConnectionState('failed', 'Error processing offer or creating answer.');
    }
  }, [createPeerConnection, updateConnectionState, onLocalSdpReady, connectionState]);

  const acceptAnswer = useCallback(async (answerSdp: string) => {
    const currentPc = peerConnectionRef.current;
    if (!currentPc || connectionState !== 'offer_generated' || !currentPc.localDescription || currentPc.remoteDescription) {
        console.error("Cannot accept answer: Invalid state or peer connection.", {pcExists: !!currentPc, connectionState, localDesc: !!currentPc?.localDescription, remoteDesc: !!currentPc?.remoteDescription });
        updateConnectionState('failed', 'Error accepting answer: Invalid state.');
        return;
    }
    updateConnectionState('connecting', 'Processing answer...');
    try {
      await currentPc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      iceCandidatesQueueRef.current.forEach(async candidate => {
        if (currentPc.remoteDescription) await currentPc.addIceCandidate(candidate);
      });
      iceCandidatesQueueRef.current = [];
    } catch (error) {
      console.error('Error setting remote description (answer):', error);
      updateConnectionState('failed', 'Error processing answer.');
    }
  }, [updateConnectionState, connectionState]);

  const addRemoteIceCandidate = useCallback(async (candidateInit: RTCIceCandidateInit) => {
    const currentPc = peerConnectionRef.current;
    if (!currentPc) {
      console.warn('Peer connection not ready, queuing ICE candidate (no PC).');
      iceCandidatesQueueRef.current.push(new RTCIceCandidate(candidateInit));
      return;
    }
    if (!currentPc.remoteDescription) {
        console.warn('Remote description not set, queuing ICE candidate.');
        iceCandidatesQueueRef.current.push(new RTCIceCandidate(candidateInit));
        return;
    }
    try {
      await currentPc.addIceCandidate(new RTCIceCandidate(candidateInit));
    } catch (error) {
      if (!error?.toString().includes("Error processing ICE candidate")) { 
        console.error('Error adding remote ICE candidate:', error);
      } else {
        console.log("Benign error adding remote ICE candidate:", error);
      }
    }
  }, []);
  
  useEffect(() => {
    return () => {
      disconnectCleanup(); 
    };
  }, [disconnectCleanup]);

  const sendGenericData = useCallback((type: string, payload: any) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify({ type, payload }));
      } catch (error) {
        console.error(`Error sending ${type}:`, error);
        updateConnectionState('failed', `Send error for ${type}`);
      }
    } else {
      console.warn(`Cannot send ${type}, data channel not open. State: ${dataChannelRef.current?.readyState}`);
    }
  }, [updateConnectionState]);

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
    sendGenericData('file_chunk', chunk);
  }, [sendGenericData]);

  return {
    startInitiatorSession,
    startGuestSessionAndCreateAnswer,
    acceptAnswer,
    addRemoteIceCandidate,
    disconnect: internalDisconnectHandler, // Expose the memoized handler
    sendChatMessage,
    sendDataSnippet,
    sendFileMetadata,
    sendFileApproval,
    sendFileChunk,
    connectionState,
  };
}
