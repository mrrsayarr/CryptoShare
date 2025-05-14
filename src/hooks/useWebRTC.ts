
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PeerConnectionState, FileMetadata, FileChunk, SupabaseIceCandidatePayload, SupabaseAnswerPayload, WebRTCSession } from '@/types/cryptoshare';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // {
  //   urls: 'turn:your-turn-server.com:port',
  //   username: 'your-username',
  //   credential: 'your-password',
  // },
];
const DATA_CHANNEL_LABEL = 'cryptoshare-data-channel';
const SUPABASE_SESSIONS_TABLE = 'webrtc_sessions';


interface WebRTCHookProps {
  onMessageReceived?: (message: { text: string; sender: 'peer'; timestamp: Date }) => void;
  onDataSnippetReceived?: (data: { content: string; type: 'received'; timestamp: Date }) => void;
  onFileMetadataReceived?: (metadata: FileMetadata & { fromPeer: boolean }) => void;
  onFileApproved?: (fileId: string) => void;
  onFileRejected?: (fileId: string) => void;
  onFileChunkReceived?: (chunk: FileChunk) => void;
  onConnectionStateChange?: (state: PeerConnectionState, details?: string | { sessionKey?: string }) => void;
}

export function useWebRTC({
  onMessageReceived,
  onDataSnippetReceived,
  onFileMetadataReceived,
  onFileApproved,
  onFileRejected,
  onFileChunkReceived,
  onConnectionStateChange,
}: WebRTCHookProps) {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const supabaseChannelRef = useRef<RealtimeChannel | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  const [currentWebRTCState, setCurrentWebRTCState] = useState<PeerConnectionState>('disconnected');
  const webRTCStateRef = useRef(currentWebRTCState);

  useEffect(() => {
    webRTCStateRef.current = currentWebRTCState;
  }, [currentWebRTCState]);

  const updateState = useCallback((newState: PeerConnectionState, details?: string | { sessionKey?: string }) => {
    console.log(`useWebRTC: State changing from ${webRTCStateRef.current} to ${newState}. Details:`, details);
    setCurrentWebRTCState(newState);
    onConnectionStateChange?.(newState, details);
  }, [onConnectionStateChange]);

  const disconnectCleanup = useCallback((notifyParent: boolean = true, reason?: string) => {
    console.log("useWebRTC: disconnectCleanup called.", reason);
    if (supabaseChannelRef.current) {
      supabase.removeChannel(supabaseChannelRef.current)
        .then(status => console.log("useWebRTC: Supabase channel removal status:", status))
        .catch(err => console.error("useWebRTC: Error removing Supabase channel:", err));
      supabaseChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.ondatachannel = null;
      if (peerConnectionRef.current.signalingState !== 'closed') {
        peerConnectionRef.current.close();
      }
      peerConnectionRef.current = null;
      console.log("useWebRTC: PeerConnection closed and cleaned.");
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
      console.log("useWebRTC: DataChannel closed and cleaned.");
    }
    currentSessionIdRef.current = null;
    if (notifyParent && webRTCStateRef.current !== 'disconnected') {
        updateState('disconnected', reason || 'Connection closed or reset.');
    } else if (!notifyParent && webRTCStateRef.current !== 'disconnected') {
        setCurrentWebRTCState('disconnected');
    }
  }, [updateState]); // supabase removed as direct dependency

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
    dc.onclose = () => console.log('useWebRTC: Data channel closed.');
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

  const createPeerConnection = useCallback((sessionId: string, role: 'initiator' | 'guest') => {
    if(peerConnectionRef.current || dataChannelRef.current || supabaseChannelRef.current) {
        console.log("useWebRTC: Cleaning up existing connection before creating a new one.");
        disconnectCleanup(false);
    }
    currentSessionIdRef.current = sessionId;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && supabaseChannelRef.current && currentSessionIdRef.current) {
        console.log("useWebRTC: Local ICE Candidate generated:", event.candidate.candidate?.substring(0, 30) + "...");
        const payload: SupabaseIceCandidatePayload = {
            type: 'ICE_CANDIDATE',
            candidate: event.candidate.toJSON(),
            from: role
        };
        supabaseChannelRef.current.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: payload,
        }).catch(err => console.error("useWebRTC: Error sending ICE candidate via Supabase:", err));
      } else if (!event.candidate) {
        console.log("useWebRTC: All local ICE candidates have been gathered.");
      }
    };

    pc.oniceconnectionstatechange = () => {
      const currentPc = peerConnectionRef.current;
      if (!currentPc) return;
      console.log('useWebRTC: ICE connection state change:', currentPc.iceConnectionState);
      if (currentPc.iceConnectionState === 'failed') {
         updateState('failed', 'ICE connection failed. Check NAT/Firewall or consider TURN server.');
      } else if (currentPc.iceConnectionState === 'disconnected' && webRTCStateRef.current === 'connected') {
         updateState('disconnected', 'ICE connection disconnected.');
      }
    };

    pc.onconnectionstatechange = () => {
      const currentPc = peerConnectionRef.current;
      if (!currentPc) return;
      const newPcState = currentPc.connectionState;
      console.log(`useWebRTC: Native PC state change: ${newPcState}. App state: ${webRTCStateRef.current}`);

      switch (newPcState) {
        case 'connecting':
          if (webRTCStateRef.current !== 'connecting' && webRTCStateRef.current !== 'connected') {
             updateState('connecting', 'PeerConnection trying to connect.');
          }
          break;
        case 'connected':
          if (dataChannelRef.current?.readyState === 'open') {
            updateState('connected', 'PeerConnection connected and DataChannel open.');
          } else if (webRTCStateRef.current !== 'connected') {
            console.log("useWebRTC: PeerConnection connected, waiting for DataChannel to open.");
          }
          break;
        case 'failed':
          if (webRTCStateRef.current !== 'failed') updateState('failed', 'PeerConnection failed.');
          break;
        case 'disconnected':
        case 'closed':
          if (webRTCStateRef.current !== 'disconnected' && webRTCStateRef.current !== 'failed') {
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
  }, [disconnectCleanup, setupDataChannelEvents, updateState]);


  const createSession = useCallback(async () => {
    if (webRTCStateRef.current !== 'disconnected') {
      console.log("useWebRTC: createSession called while not disconnected. Current state:", webRTCStateRef.current, "Cleaning up first.");
      disconnectCleanup(true, 'Resetting before creating new session.');
      // Short delay to allow cleanup and state propagation
      await new Promise(resolve => setTimeout(resolve, 250));
      if (webRTCStateRef.current !== 'disconnected') {
        console.warn("useWebRTC: State did not reset to disconnected after cleanup. Aborting createSession. Current state:", webRTCStateRef.current);
        updateState('failed', 'Failed to reset state before creating new session.');
        return;
      }
    }
    updateState('creating_session');
    const sessionKey = Math.random().toString(36).substring(2, 10).toUpperCase();

    const pc = createPeerConnection(sessionKey, 'initiator');
    if (!pc) {
        updateState('failed', 'Failed to initialize PeerConnection for initiator.');
        return;
    }
    const dc = pc.createDataChannel(DATA_CHANNEL_LABEL);
    setupDataChannelEvents(dc);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // IMPORTANT: Check Supabase RLS policies for 'webrtc_sessions' table
      // if inserts are failing silently or with vague errors.
      // Anon key needs INSERT permission.
      const { error: insertError } = await supabase
        .from(SUPABASE_SESSIONS_TABLE)
        .insert([{ id: sessionKey, offer_sdp: offer, status: 'waiting_for_guest' }]);

      if (insertError) {
        console.error("useWebRTC: Raw Supabase insertError object:", insertError);
        const stringifiedError = JSON.stringify(insertError, Object.getOwnPropertyNames(insertError));
        console.error("useWebRTC: Stringified Supabase insertError:", stringifiedError);
        const message = insertError.message || "Unknown Supabase insert error";
        const code = (insertError as any).code || "N/A";
        const details = (insertError as any).details || "N/A";
        throw new Error(`Supabase insert error: ${message} (Code: ${code}) Details: ${details}. Full error: ${stringifiedError}`);
      }

      const channel = supabase.channel(`session-${sessionKey}`);
      supabaseChannelRef.current = channel;

      channel
        .on('broadcast', { event: 'answer' }, async ({ payload }: { payload: SupabaseAnswerPayload }) => {
            console.log('useWebRTC: Initiator received answer via broadcast:', payload.sdp.type);
            if (pc.signalingState === 'have-local-offer' || pc.signalingState === 'stable') {
                await pc.setRemoteDescription(payload.sdp);
                updateState('connecting', 'Answer received, ICE negotiation continuing.');
            } else {
                console.warn(`useWebRTC: Initiator received answer in unexpected state: ${pc.signalingState}`);
            }
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: { payload: SupabaseIceCandidatePayload }) => {
            if (payload.from === 'guest' && pc.remoteDescription && pc.signalingState !== 'closed') {
                console.log('useWebRTC: Initiator received ICE candidate from guest:', payload.candidate.candidate?.substring(0,30) + "...");
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } catch (e: any) {
                    console.warn('useWebRTC: Initiator error adding remote ICE candidate:', e.message || e.toString(), payload.candidate);
                }
            }
        })
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`useWebRTC: Initiator subscribed to Supabase channel: session-${sessionKey}`);
                updateState('waiting_for_peer', { sessionKey });
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('useWebRTC: Initiator Supabase channel error:', err);
                const errorDetail = err ? `${err.message} (Code: ${ (err as any).code || 'N/A'})` : 'Unknown Supabase channel error';
                updateState('failed', `Supabase channel error: ${errorDetail}`);
                disconnectCleanup();
            }
        });

    } catch (error: any) {
      console.error('useWebRTC: Initiator - Error during createSession:', error);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error('Error toString():', error && typeof error.toString === 'function' ? error.toString() : 'N/A');

      const errorMessage = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      const errorCode = error.code || 'N/A';
      updateState('failed', `Error creating session: ${errorMessage} (Code: ${errorCode})`);
      disconnectCleanup();
    }
  }, [createPeerConnection, setupDataChannelEvents, updateState, disconnectCleanup]);

  const joinSession = useCallback(async (sessionKey: string) => {
    if (webRTCStateRef.current !== 'disconnected') {
        console.log("useWebRTC: joinSession called while not disconnected. Current state:", webRTCStateRef.current, "Cleaning up first.");
        disconnectCleanup(true, 'Resetting before joining session.');
        await new Promise(resolve => setTimeout(resolve, 250));
         if (webRTCStateRef.current !== 'disconnected') {
            console.warn("useWebRTC: State did not reset to disconnected after cleanup. Aborting joinSession. Current state:", webRTCStateRef.current);
            updateState('failed', 'Failed to reset state before joining session.');
            return;
        }
    }
    updateState('joining_session');

    try {
      // IMPORTANT: Check Supabase RLS policies for 'webrtc_sessions' table
      // if selects are failing or returning no data. Anon key needs SELECT permission.
      const { data, error: fetchError } = await supabase
        .from(SUPABASE_SESSIONS_TABLE)
        .select('offer_sdp')
        .eq('id', sessionKey)
        .single<Pick<WebRTCSession, 'offer_sdp'>>();

      if (fetchError) {
        console.error("useWebRTC: Raw Supabase fetchError object:", fetchError);
        const stringifiedError = JSON.stringify(fetchError, Object.getOwnPropertyNames(fetchError));
        console.error("useWebRTC: Stringified Supabase fetchError:", stringifiedError);
        const message = fetchError.message || "Unknown Supabase fetch error";
        const code = (fetchError as any).code || "N/A";
        const details = (fetchError as any).details || "N/A";
        throw new Error(`Supabase fetch error: ${message} (Code: ${code}) Details: ${details}. Full error: ${stringifiedError}`);
      }
      if (!data || !data.offer_sdp) {
        throw new Error('Session not found or no offer SDP in Supabase.');
      }

      const offerSdp = data.offer_sdp;
      const pc = createPeerConnection(sessionKey, 'guest');
      if (!pc) {
        updateState('failed', 'Failed to initialize PeerConnection for guest.');
        return;
      }

      const channel = supabase.channel(`session-${sessionKey}`);
      supabaseChannelRef.current = channel;

      channel
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: { payload: SupabaseIceCandidatePayload }) => {
            if (payload.from === 'initiator' && pc.remoteDescription && pc.signalingState !== 'closed') {
                 console.log('useWebRTC: Guest received ICE candidate from initiator:', payload.candidate.candidate?.substring(0,30) + "...");
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } catch (e:any) {
                    console.warn('useWebRTC: Guest error adding remote ICE candidate:', e.message || e.toString(), payload.candidate);
                }
            }
        })
        .subscribe(async (status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`useWebRTC: Guest subscribed to Supabase channel: session-${sessionKey}`);

                await pc.setRemoteDescription(offerSdp);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                const answerPayload: SupabaseAnswerPayload = { type: 'ANSWER', sdp: answer };
                const sendStatus = await channel.send({
                    type: 'broadcast',
                    event: 'answer',
                    payload: answerPayload,
                });

                if (sendStatus !== 'ok') {
                    console.error('useWebRTC: Guest failed to broadcast answer:', sendStatus);
                    updateState('failed', 'Failed to send answer to initiator.');
                    disconnectCleanup();
                    return;
                }
                console.log("useWebRTC: Guest sent answer to initiator via broadcast.");
                updateState('connecting', 'Answer sent, ICE negotiation continuing.');

                // Optionally update the session table with the answer, though broadcast is primary for speed.
                // Check RLS policies for UPDATE if this fails.
                const { error: updateError } = await supabase
                    .from(SUPABASE_SESSIONS_TABLE)
                    .update({ answer_sdp: answer, status: 'guest_joined' })
                    .eq('id', sessionKey);

                if (updateError) console.warn("useWebRTC: Guest failed to update session table with answer:", updateError);

            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('useWebRTC: Guest Supabase channel error:', err);
                const errorDetail = err ? `${err.message} (Code: ${ (err as any).code || 'N/A'})` : 'Unknown Supabase channel error';
                updateState('failed', `Supabase channel error: ${errorDetail}`);
                disconnectCleanup();
            }
        });

    } catch (error: any) {
      console.error('useWebRTC: Guest - Error during joinSession:', error);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error('Error toString():', error && typeof error.toString === 'function' ? error.toString() : 'N/A');
      const errorMessage = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      const errorCode = error.code || 'N/A';
      updateState('failed', `Error joining session: ${errorMessage} (Code: ${errorCode})`);
      disconnectCleanup();
    }
  }, [createPeerConnection, updateState, disconnectCleanup]);

  useEffect(() => {
    return () => {
      console.log("useWebRTC: Hook unmounting. Calling disconnectCleanup.");
      disconnectCleanup(false);
    };
  }, [disconnectCleanup]);

  const sendGenericData = useCallback((type: string, payload: any) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify({ type, payload }));
      } catch (error: any) {
        console.error(`useWebRTC: Error sending ${type}:`, error);
        // Optionally, update state to reflect send error, or use toast
      }
    } else {
      console.warn(`useWebRTC: Cannot send ${type}, data channel not open. DC State: ${dataChannelRef.current?.readyState}, PC State: ${peerConnectionRef.current?.connectionState}`);
      // Optionally, notify user or retry, or use toast
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
    sendGenericData('file_chunk', chunk);
  }, [sendGenericData]);

  return {
    createSession,
    joinSession,
    disconnect,
    sendChatMessage,
    sendDataSnippet,
    sendFileMetadata,
    sendFileApproval,
    sendFileChunk,
    currentWebRTCState,
  };
}
