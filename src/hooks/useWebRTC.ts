
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PeerConnectionState, FileMetadata, FileChunk } from '@/types/cryptoshare';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // {
  //   urls: 'turn:your-turn-server.com:port', // Gerçek bir TURN sunucusuyla değiştirin
  //   username: 'your-username',
  //   credential: 'your-password',
  // },
];
const DATA_CHANNEL_LABEL = 'cryptoshare-data-channel';

interface WebRTCHookProps {
  onMessageReceived?: (message: { text: string; sender: 'peer'; timestamp: Date }) => void;
  onDataSnippetReceived?: (data: { content: string; type: 'received'; timestamp: Date }) => void;
  onFileMetadataReceived?: (metadata: FileMetadata & { fromPeer: boolean }) => void;
  onFileApproved?: (fileId: string) => void;
  onFileRejected?: (fileId: string) => void;
  onFileChunkReceived?: (chunk: FileChunk) => void;
  onConnectionStateChange?: (state: PeerConnectionState, details?: string) => void;
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
  onLocalSdpReady,
  onLocalIceCandidateReady,
}: WebRTCHookProps) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  
  const [currentConnectionState, setCurrentConnectionState] = useState<PeerConnectionState>('disconnected');
  const connectionStateRef = useRef(currentConnectionState); // Ref to hold the latest state

  useEffect(() => {
    connectionStateRef.current = currentConnectionState;
  }, [currentConnectionState]);

  const updateState = useCallback((newState: PeerConnectionState, details?: string) => {
    console.log(`useWebRTC: State changing from ${connectionStateRef.current} to ${newState}. Details: ${details || 'N/A'}`);
    setCurrentConnectionState(newState);
    onConnectionStateChange?.(newState, details);
  }, [onConnectionStateChange]);

  const disconnectCleanup = useCallback((notifyParent: boolean = true, reason?: string) => {
    console.log("useWebRTC: disconnectCleanup called.", reason);
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
    if (notifyParent && connectionStateRef.current !== 'disconnected') {
        updateState('disconnected', reason || 'Connection closed or reset.');
    } else if (!notifyParent && connectionStateRef.current !== 'disconnected') {
        // If not notifying parent, ensure internal state matches disconnected.
        // This path is used when we are about to transition to another state like 'connecting'
        setCurrentConnectionState('disconnected'); 
    }
  }, [updateState]);


  const disconnect = useCallback(() => {
    disconnectCleanup(true, 'User initiated disconnect.');
  }, [disconnectCleanup]);

  const setupDataChannelEvents = useCallback((dc: RTCDataChannel) => {
    dc.onopen = () => {
      console.log('useWebRTC: Data channel opened.');
      if (peerConnectionRef.current?.connectionState === 'connected') {
         updateState('connected', 'Data channel open and PeerConnection connected.');
      }
    };
    dc.onclose = () => {
      console.log('useWebRTC: Data channel closed.');
      // Let PC state change handle overall disconnect state.
    };
    dc.onerror = (errorEvent) => {
      const error = (errorEvent as RTCErrorEvent).error || new Error('Unknown DataChannel error');
      console.error('useWebRTC: Data channel error:', error);
      updateState('failed', `Data channel error: ${error.message || error.toString()}`);
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
        console.warn('useWebRTC: Received non-JSON message or unknown message type:', event.data, error);
      }
    };
    dataChannelRef.current = dc;
  }, [onMessageReceived, onDataSnippetReceived, onFileMetadataReceived, onFileApproved, onFileRejected, onFileChunkReceived, updateState]);

  const createPeerConnection = useCallback(() => {
    disconnectCleanup(false); // Clean up without notifying parent about 'disconnected', as we're creating a new one.
    
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("useWebRTC: Local ICE Candidate generated:", event.candidate);
        onLocalIceCandidateReady?.(event.candidate.toJSON());
      } else {
        console.log("useWebRTC: All local ICE candidates have been gathered.");
      }
    };

    pc.oniceconnectionstatechange = () => { 
      const currentPc = peerConnectionRef.current;
      if (!currentPc) return;
      console.log('useWebRTC: ICE connection state change:', currentPc.iceConnectionState);
      if (currentPc.iceConnectionState === 'failed') {
         updateState('failed', 'ICE connection failed. Check NAT/Firewall or consider TURN server.');
      }
    };
    
    pc.onconnectionstatechange = () => {
      const currentPc = peerConnectionRef.current;
      if (!currentPc) return;
      const newPcState = currentPc.connectionState;
      console.log('useWebRTC: Native PC state change:', newPcState);

      switch (newPcState) {
        case 'connecting':
          // Only transition to 'connecting' if not already in a specific SDP generation phase.
          if (connectionStateRef.current !== 'offer_generated' && connectionStateRef.current !== 'answer_generated') {
            updateState('connecting', 'PeerConnection trying to connect.');
          }
          break;
        case 'connected':
          if (dataChannelRef.current?.readyState === 'open') {
            updateState('connected', 'PeerConnection connected and DataChannel open.');
          } else {
            console.log("useWebRTC: PC connected, but DC not open yet. Waiting for DC open. DC state:", dataChannelRef.current?.readyState);
            // Still consider it 'connecting' until DC is open
            if (connectionStateRef.current !== 'connected') {
                updateState('connecting', 'PeerConnection connected, waiting for DataChannel.');
            }
          }
          break;
        case 'failed':
          if (connectionStateRef.current !== 'failed') { // Avoid redundant 'failed' states
             updateState('failed', 'PeerConnection failed.');
          }
          break;
        case 'disconnected': 
        case 'closed':       
          if (connectionStateRef.current !== 'disconnected' && connectionStateRef.current !== 'failed') {
            updateState('disconnected', `PeerConnection ${newPcState}.`);
          }
          break;
      }
    };
    
    pc.ondatachannel = (event) => {
      console.log('useWebRTC: Remote data channel received:', event.channel.label);
      setupDataChannelEvents(event.channel);
    };
    
    return pc;
  }, [disconnectCleanup, onLocalIceCandidateReady, setupDataChannelEvents, updateState]);

  const startInitiatorSession = useCallback(async () => {
    if (connectionStateRef.current !== 'disconnected') {
      console.warn("useWebRTC: Initiator - Cannot start session, not in disconnected state. Current state:", connectionStateRef.current, "Resetting first.");
      disconnectCleanup(true, 'Resetting before new initiator session.'); // Full disconnect and notify
      // Add a small delay to allow state to propagate if needed, though direct creation should be fine
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    updateState('connecting', 'Initiator starting session...');
    const pc = createPeerConnection(); 
    const dc = pc.createDataChannel(DATA_CHANNEL_LABEL);
    setupDataChannelEvents(dc);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      onLocalSdpReady?.('offer', offer.sdp || '');
      updateState('offer_generated', 'Offer SDP generated.'); 
    } catch (error: any) {
      console.error('useWebRTC: Initiator - Error creating offer:', error);
      updateState('failed', `Error creating offer: ${error.message || error.toString()}`);
    }
  }, [createPeerConnection, setupDataChannelEvents, updateState, onLocalSdpReady, disconnectCleanup]);

  const startGuestSessionAndCreateAnswer = useCallback(async (offerSdp: string) => {
    if (connectionStateRef.current !== 'disconnected') {
        console.warn("useWebRTC: Guest - Cannot start session, not in disconnected state. Current state:", connectionStateRef.current, "Resetting first.");
        disconnectCleanup(true, 'Resetting before new guest session.');
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    updateState('connecting', 'Guest processing offer...');
    const pc = createPeerConnection();
    
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      onLocalSdpReady?.('answer', answer.sdp || '');
      updateState('answer_generated', 'Answer SDP generated.');
    } catch (error: any) {
      console.error('useWebRTC: Guest - Error processing offer or creating answer:', error);
      updateState('failed', `Error processing offer/creating answer: ${error.message || error.toString()}`);
    }
  }, [createPeerConnection, updateState, onLocalSdpReady, disconnectCleanup]);

  const acceptAnswer = useCallback(async (answerSdp: string) => {
    const currentPc = peerConnectionRef.current;
    if (!currentPc) {
        updateState('failed', 'Error accepting answer: No PeerConnection.');
        return;
    }
    if (connectionStateRef.current !== 'offer_generated' && connectionStateRef.current !== 'connecting') { 
        console.warn(`useWebRTC: Initiator - Cannot accept answer. Invalid state: ${connectionStateRef.current}. Expected 'offer_generated' or 'connecting' (after offer).`);
        return;
    }
     if (currentPc.remoteDescription) {
      console.warn("useWebRTC: Initiator - Remote description (answer) already set. Ignoring new answer.");
      return;
    }
    try {
      updateState('connecting', 'Initiator processing answer...');
      await currentPc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      // ICE candidates might start flowing now, state remains 'connecting'
    } catch (error: any) {
      console.error('useWebRTC: Initiator - Error setting remote description (answer):', error);
      updateState('failed', `Error processing answer: ${error.message || error.toString()}`);
    }
  }, [updateState]);

  const addRemoteIceCandidate = useCallback(async (candidateInit: RTCIceCandidateInit) => {
    const currentPc = peerConnectionRef.current;
    if (!currentPc || !currentPc.remoteDescription) {
      console.warn('useWebRTC: PeerConnection not ready or remoteDescription not set, cannot add ICE candidate yet.', candidateInit);
      // Potentially queue if really needed, but manual exchange implies SDP is set first.
      return;
    }
    try {
      const candidate = new RTCIceCandidate(candidateInit);
      await currentPc.addIceCandidate(candidate);
      console.log("useWebRTC: Remote ICE candidate added successfully.");
    } catch (error: any) {
      console.warn('useWebRTC: Error adding remote ICE candidate:', error.message || error.toString(), candidateInit);
    }
  }, []);
  
  useEffect(() => {
    return () => {
      console.log("useWebRTC: Hook unmounting. Calling disconnectCleanup.");
      disconnectCleanup(false); // Cleanup without triggering parent's onConnectionStateChange
    };
  }, [disconnectCleanup]);

  const sendGenericData = useCallback((type: string, payload: any) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify({ type, payload }));
      } catch (error: any) {
        console.error(`useWebRTC: Error sending ${type}:`, error);
        updateState('failed', `Send error for ${type}: ${error.message || error.toString()}`);
      }
    } else {
      console.warn(`useWebRTC: Cannot send ${type}, data channel not open or peer connection not active. DC State: ${dataChannelRef.current?.readyState}, PC State: ${peerConnectionRef.current?.connectionState}`);
    }
  }, [updateState]);

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
    disconnect,
    sendChatMessage,
    sendDataSnippet,
    sendFileMetadata,
    sendFileApproval,
    sendFileChunk,
    currentWebRTCState: currentConnectionState, // Expose the state from the hook
  };
}
