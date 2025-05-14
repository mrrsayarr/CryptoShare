
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PeerConnectionState, FileMetadata, FileChunk } from '@/types/cryptoshare';

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
  
  const appConnectionStateRef = useRef(connectionState);
  useEffect(() => {
    appConnectionStateRef.current = connectionState;
  }, [connectionState]);

  const updateConnectionState = useCallback((newState: PeerConnectionState, details?: string) => {
    setConnectionState(prevState => {
      if (prevState === newState && !details) return prevState;
      console.log(`useWebRTC: Updating connection state from ${prevState} to ${newState}. Details: ${details || 'N/A'}`);
      onConnectionStateChange?.(newState, details);
      return newState;
    });
  }, [onConnectionStateChange]);

  const disconnectCleanup = useCallback(() => {
    console.log("useWebRTC: disconnectCleanup called");
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.ondatachannel = null;
      if (peerConnectionRef.current.signalingState !== 'closed') {
        console.log("useWebRTC: Closing existing peer connection.");
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
         console.log("useWebRTC: Closing existing data channel.");
        dataChannelRef.current.close();
      }
      dataChannelRef.current = null;
    }
    iceCandidatesQueueRef.current = [];
  }, []);

  const disconnect = useCallback(() => {
    console.log("useWebRTC: disconnect function called.");
    disconnectCleanup();
    updateConnectionState('disconnected', 'User initiated disconnect.');
  }, [disconnectCleanup, updateConnectionState]);
  
  // Removed disconnectRef as it's not needed directly by startInitiatorSession/startGuestSessionAndCreateAnswer in the old way

  const setupDataChannelEvents = useCallback((dc: RTCDataChannel) => {
    dc.onopen = () => {
      console.log('useWebRTC: Data channel opened.');
      if (peerConnectionRef.current?.connectionState === 'connected') {
        updateConnectionState('connected', 'Data channel open and PeerConnection connected.');
      }
    };
    dc.onclose = () => {
      console.log('useWebRTC: Data channel closed.');
      if (appConnectionStateRef.current === 'connected') {
        // updateConnectionState('disconnected', 'Data channel closed unexpectedly.'); // Let PC state change handle this
      }
    };
    dc.onerror = (errorEvent) => {
      const error = errorEvent.error || new Error('Unknown DataChannel error');
      console.error('useWebRTC: Data channel error:', error);
      updateConnectionState('failed', `Data channel error: ${error.message || error.toString()}`);
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
  }, [onMessageReceived, onDataSnippetReceived, onFileMetadataReceived, onFileApproved, onFileRejected, onFileChunkReceived, updateConnectionState]);

  const createPeerConnection = useCallback(() => {
    console.log("useWebRTC: Creating new PeerConnection.");
    disconnectCleanup(); 

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
    };
    
    pc.onconnectionstatechange = () => {
      const currentPc = peerConnectionRef.current;
      if (!currentPc) return;
      const newPcState = currentPc.connectionState;
      console.log('useWebRTC: Native PC state change:', newPcState, "App state:", appConnectionStateRef.current);

      switch (newPcState) {
        case 'connecting':
          // If already in a more specific connecting sub-state, don't overwrite
          if (appConnectionStateRef.current !== 'offer_generated' && appConnectionStateRef.current !== 'answer_generated' && appConnectionStateRef.current !== 'connected') {
            updateConnectionState('connecting', 'PeerConnection trying to connect.');
          }
          break;
        case 'connected':
          if (dataChannelRef.current?.readyState === 'open') {
            updateConnectionState('connected', 'PeerConnection connected and DataChannel open.');
          } else {
             console.log("useWebRTC: PC connected, but DC not open yet. DC state:", dataChannelRef.current?.readyState);
             // updateConnectionState('connecting', 'PeerConnection connected, waiting for DataChannel.'); // Keep as 'connecting' or specific sub-state
          }
          break;
        case 'failed':
          updateConnectionState('failed', `PeerConnection failed.`);
          break;
        case 'disconnected': 
        case 'closed':       
          if (appConnectionStateRef.current !== 'disconnected' && appConnectionStateRef.current !== 'failed') {
            updateConnectionState('disconnected', `PeerConnection ${newPcState}.`);
            onRemotePeerDisconnected?.(); 
          }
          break;
        case 'new':
          break;
      }
    };
    
    pc.ondatachannel = (event) => {
      console.log('useWebRTC: Remote data channel received:', event.channel.label);
      setupDataChannelEvents(event.channel);
    };
    
    return pc;
  }, [disconnectCleanup, onLocalIceCandidateReady, setupDataChannelEvents, updateConnectionState, onRemotePeerDisconnected]);

  const startInitiatorSession = useCallback(async () => {
    console.log("useWebRTC: Initiator - Attempting to start session. Current app state:", appConnectionStateRef.current);
    // ConnectionManager should ensure this is only called when state is 'disconnected' or 'failed'.
    // createPeerConnection() will handle cleanup of any previous state.

    updateConnectionState('connecting', 'Initiator starting session...');
    const pc = createPeerConnection(); 
    const dc = pc.createDataChannel(DATA_CHANNEL_LABEL);
    setupDataChannelEvents(dc);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("useWebRTC: Initiator - Offer created and set as local description.");
      onLocalSdpReady?.('offer', offer.sdp || '');
      updateConnectionState('offer_generated', 'Offer SDP generated.'); 
    } catch (error: any) {
      console.error('useWebRTC: Initiator - Error creating offer:', error);
      updateConnectionState('failed', `Error creating offer: ${error.message || error.toString()}`);
    }
  }, [createPeerConnection, setupDataChannelEvents, updateConnectionState, onLocalSdpReady]);

  const startGuestSessionAndCreateAnswer = useCallback(async (offerSdp: string) => {
    console.log("useWebRTC: Guest - Attempting to process offer. Current app state:", appConnectionStateRef.current);
    // ConnectionManager should ensure this is only called when state is 'disconnected' or 'failed'.
    // createPeerConnection() will handle cleanup.

    updateConnectionState('connecting', 'Guest processing offer...');
    const pc = createPeerConnection();
    
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
      console.log("useWebRTC: Guest - Remote description (offer) set.");
      
      console.log(`useWebRTC: Guest - Processing ${iceCandidatesQueueRef.current.length} queued ICE candidates.`);
      for (const candidate of iceCandidatesQueueRef.current) {
          try {
            await pc.addIceCandidate(candidate);
            console.log("useWebRTC: Guest - Added queued ICE candidate.");
          } catch (e: any) {
            console.warn("useWebRTC: Guest - Error adding queued ICE candidate:", e.message || e.toString());
          }
      }
      iceCandidatesQueueRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("useWebRTC: Guest - Answer created and set as local description.");
      onLocalSdpReady?.('answer', answer.sdp || '');
      updateConnectionState('answer_generated', 'Answer SDP generated.');
    } catch (error: any) {
      console.error('useWebRTC: Guest - Error processing offer or creating answer:', error);
      updateConnectionState('failed', `Error processing offer/creating answer: ${error.message || error.toString()}`);
    }
  }, [createPeerConnection, updateConnectionState, onLocalSdpReady]);

  const acceptAnswer = useCallback(async (answerSdp: string) => {
    const currentPc = peerConnectionRef.current;
    if (!currentPc) {
        console.error("useWebRTC: Initiator - Cannot accept answer, PeerConnection does not exist.");
        updateConnectionState('failed', 'Error accepting answer: No PeerConnection.');
        return;
    }
    if (appConnectionStateRef.current !== 'offer_generated' && appConnectionStateRef.current !== 'connecting') { 
        console.warn(`useWebRTC: Initiator - Cannot accept answer. Invalid state: ${appConnectionStateRef.current}. Expected 'offer_generated' or 'connecting' (after offer).`);
        // Not setting to failed, to allow user retries if they paste answer in slightly wrong state.
        return;
    }
     if (currentPc.remoteDescription) {
      console.warn("useWebRTC: Initiator - Remote description (answer) already set. Ignoring new answer.");
      return;
    }

    // State is already 'connecting' or 'offer_generated', no need to set it again explicitly here for this step.
    // updateConnectionState('connecting', 'Initiator processing answer...'); // This could be too noisy
    try {
      await currentPc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      console.log("useWebRTC: Initiator - Remote description (answer) set.");
      
      console.log(`useWebRTC: Initiator - Processing ${iceCandidatesQueueRef.current.length} queued ICE candidates.`);
      for (const candidate of iceCandidatesQueueRef.current) {
           try {
            await currentPc.addIceCandidate(candidate);
            console.log("useWebRTC: Initiator - Added queued ICE candidate.");
          } catch (e: any) {
            console.warn("useWebRTC: Initiator - Error adding queued ICE candidate:", e.message || e.toString());
          }
      }
      iceCandidatesQueueRef.current = [];
    } catch (error: any) {
      console.error('useWebRTC: Initiator - Error setting remote description (answer):', error);
      updateConnectionState('failed', `Error processing answer: ${error.message || error.toString()}`);
    }
  }, [updateConnectionState]);

  const addRemoteIceCandidate = useCallback(async (candidateInit: RTCIceCandidateInit) => {
    const currentPc = peerConnectionRef.current;
    const candidate = new RTCIceCandidate(candidateInit);

    if (!currentPc) {
      console.warn('useWebRTC: PeerConnection not ready, queuing ICE candidate (no PC).');
      iceCandidatesQueueRef.current.push(candidate);
      return;
    }
    
    if (!currentPc.remoteDescription && currentPc.signalingState !== "stable" && currentPc.signalingState !== "have-local-offer") {
        console.warn('useWebRTC: Remote description not set, queuing ICE candidate for later.');
        iceCandidatesQueueRef.current.push(candidate);
        return;
    }

    try {
      await currentPc.addIceCandidate(candidate);
      console.log("useWebRTC: Remote ICE candidate added successfully.");
    } catch (error: any) {
      console.warn('useWebRTC: Error adding remote ICE candidate:', error.message || error.toString(), candidateInit);
    }
  }, []);
  
  useEffect(() => {
    return () => {
      console.log("useWebRTC: Hook unmounting. Calling disconnectCleanup.");
      disconnectCleanup(); 
    };
  }, [disconnectCleanup]);

  const sendGenericData = useCallback((type: string, payload: any) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify({ type, payload }));
      } catch (error: any) {
        console.error(`useWebRTC: Error sending ${type}:`, error);
        updateConnectionState('failed', `Send error for ${type}: ${error.message || error.toString()}`);
      }
    } else {
      console.warn(`useWebRTC: Cannot send ${type}, data channel not open. DC State: ${dataChannelRef.current?.readyState}, App state: ${appConnectionStateRef.current}`);
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
    disconnect,
    sendChatMessage,
    sendDataSnippet,
    sendFileMetadata,
    sendFileApproval,
    sendFileChunk,
    connectionState, // This is the state managed by useWebRTC and propagated upwards
  };
}
