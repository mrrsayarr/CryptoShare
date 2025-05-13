
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
  const iceCandidatesQueueRef = useRef<RTCIceCandidate[]>([]); // Queue candidates received before remote description is set

  const updateConnectionState = useCallback((newState: PeerConnectionState, details?: string) => {
    setConnectionState(newState);
    onConnectionStateChange?.(newState, details);
  }, [onConnectionStateChange]);

  const setupDataChannelEvents = useCallback((dc: RTCDataChannel) => {
    dc.onopen = () => {
      console.log('Data channel opened');
      updateConnectionState('connected');
    };
    dc.onclose = () => {
      console.log('Data channel closed');
      // updateConnectionState('disconnected'); // Usually handled by peer connection state
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
    if (peerConnectionRef.current) {
        console.warn("PeerConnection already exists. Closing existing one.");
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
      console.log('ICE connection state change:', pc.iceConnectionState);
      if (['disconnected', 'closed', 'failed'].includes(pc.iceConnectionState)) {
        if (connectionState !== 'disconnected' && connectionState !== 'failed') {
            updateConnectionState('disconnected', `ICE state: ${pc.iceConnectionState}`);
            onRemotePeerDisconnected?.();
        }
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log('Connection state change:', pc.connectionState);
      switch (pc.connectionState) {
        case 'connected':
          if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
             // Wait for data channel to be open or rely on its onopen
          } else {
             updateConnectionState('connected');
          }
          break;
        case 'disconnected':
        case 'closed':
           if (connectionState !== 'disconnected' && connectionState !== 'failed') {
            updateConnectionState('disconnected', `Connection state: ${pc.connectionState}`);
            onRemotePeerDisconnected?.();
          }
          break;
        case 'failed':
          updateConnectionState('failed', `Connection state: ${pc.connectionState}`);
          onRemotePeerDisconnected?.();
          break;
        case 'new':
        case 'connecting':
          if (connectionState !== 'connecting') updateConnectionState('connecting');
          break;
      }
    };
    
    pc.ondatachannel = (event) => {
      console.log('Remote data channel received:', event.channel.label);
      setupDataChannelEvents(event.channel);
    };
    
    return pc;
  }, [onLocalIceCandidateReady, updateConnectionState, onRemotePeerDisconnected, setupDataChannelEvents, connectionState]);

  const startInitiatorSession = useCallback(async () => {
    if (connectionState !== 'disconnected') {
      console.warn("Cannot start initiator session, already connected or connecting.");
      return;
    }
    updateConnectionState('connecting', 'Initiator starting...');
    const pc = createPeerConnection();
    const dc = pc.createDataChannel(DATA_CHANNEL_LABEL);
    setupDataChannelEvents(dc);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      updateConnectionState('offer_generated', 'Offer SDP generated.');
      onLocalSdpReady?.('offer', offer.sdp || '');
    } catch (error) {
      console.error('Error creating offer:', error);
      updateConnectionState('failed', 'Error creating offer.');
    }
  }, [createPeerConnection, setupDataChannelEvents, updateConnectionState, onLocalSdpReady, connectionState]);

  const startGuestSessionAndCreateAnswer = useCallback(async (offerSdp: string) => {
     if (connectionState !== 'disconnected' && connectionState !== 'awaiting_offer') {
      console.warn("Cannot start guest session, state is not disconnected or awaiting_offer.");
      // return; // Allow if awaiting_offer
    }
    updateConnectionState('connecting', 'Guest processing offer...');
    const pc = createPeerConnection();
    
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
      // Process any queued ICE candidates
      while(iceCandidatesQueueRef.current.length > 0) {
        const candidate = iceCandidatesQueueRef.current.shift();
        if (candidate) await pc.addIceCandidate(candidate);
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      updateConnectionState('answer_generated', 'Answer SDP generated.');
      onLocalSdpReady?.('answer', answer.sdp || '');
    } catch (error) {
      console.error('Error creating answer or setting remote description:', error);
      updateConnectionState('failed', 'Error processing offer or creating answer.');
    }
  }, [createPeerConnection, updateConnectionState, onLocalSdpReady, connectionState]);

  const acceptAnswer = useCallback(async (answerSdp: string) => {
    if (!peerConnectionRef.current || connectionState !== 'offer_generated') {
        console.error("Cannot accept answer: No peer connection or not in 'offer_generated' state.", peerConnectionRef.current, connectionState);
        updateConnectionState('failed', 'Error accepting answer: Invalid state.');
        return;
    }
    updateConnectionState('connecting', 'Processing answer...');
    try {
      await peerConnectionRef.current.setRemoteDescription({ type: 'answer', sdp: answerSdp });
       // Process any queued ICE candidates
      while(iceCandidatesQueueRef.current.length > 0) {
        const candidate = iceCandidatesQueueRef.current.shift();
        if (candidate) await peerConnectionRef.current.addIceCandidate(candidate);
      }
      // Connection should establish now, state will be updated by onconnectionstatechange or ondatachannel.onopen
    } catch (error) {
      console.error('Error setting remote description (answer):', error);
      updateConnectionState('failed', 'Error processing answer.');
    }
  }, [updateConnectionState, connectionState]);

  const addRemoteIceCandidate = useCallback(async (candidateInit: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) {
      console.warn('Peer connection not ready, queuing ICE candidate.');
      iceCandidatesQueueRef.current.push(new RTCIceCandidate(candidateInit));
      return;
    }
    if (!peerConnectionRef.current.remoteDescription) {
        console.warn('Remote description not set, queuing ICE candidate.');
        iceCandidatesQueueRef.current.push(new RTCIceCandidate(candidateInit));
        return;
    }
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidateInit));
    } catch (error) {
      console.error('Error adding remote ICE candidate:', error);
    }
  }, []);
  
  const disconnect = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    iceCandidatesQueueRef.current = [];
    updateConnectionState('disconnected', 'User initiated disconnect.');
  }, [updateConnectionState]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const sendGenericData = useCallback((type: string, payload: any) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify({ type, payload }));
      } catch (error) {
        console.error(`Error sending ${type}:`, error);
      }
    } else {
      console.warn(`Cannot send ${type}, data channel not open. State: ${dataChannelRef.current?.readyState}`);
    }
  }, []);

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
    // Assuming chunk.data is string (base64) for simplicity with JSON
    sendGenericData('file_chunk', chunk);
  }, [sendGenericData]);

  return {
    startInitiatorSession,
    startGuestSessionAndCreateAnswer,
    acceptAnswer,
    addRemoteIceCandidate,
    disconnect,
    sendChatMessage,
    sendDataSnippet,
    sendFileMetadata,
    sendFileApproval,
    sendFileChunk,
    connectionState,
  };
}
