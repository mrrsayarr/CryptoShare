
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Link2, ShieldAlert, ClipboardCopy, ClipboardCheck, Info, VenetianMask, UserPlus, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PeerConnectionState } from '@/types/cryptoshare';

interface ConnectionManagerProps {
  currentConnectionState: PeerConnectionState;
  onStartInitiator: () => void;
  onProcessOfferAndCreateAnswer: (offerSdp: string) => void;
  onAcceptAnswer: (answerSdp: string) => void;
  onAddRemoteIceCandidate: (candidateJson: string) => void;
  onDisconnect: () => void;
  localSdpOffer: string | null;
  localSdpAnswer: string | null;
  localIceCandidates: RTCIceCandidateInit[];
}

type Role = 'none' | 'initiator' | 'guest';
type SignalingStep = 
  | 'idle'
  | 'initiator_offer_generated' 
  | 'initiator_awaiting_answer'
  | 'guest_awaiting_offer'
  | 'guest_answer_generated'
  | 'guest_awaiting_initiator_ice' // Not strictly used as a step, ICE exchange follows answer
  | 'ice_exchange' 
  | 'connected'
  | 'connecting'
  | 'failed'
  | 'disconnected'; // UI state, distinct from currentConnectionState 'disconnected' sometimes


export function ConnectionManager({
  currentConnectionState,
  onStartInitiator,
  onProcessOfferAndCreateAnswer,
  onAcceptAnswer,
  onAddRemoteIceCandidate,
  onDisconnect,
  localSdpOffer,
  localSdpAnswer,
  localIceCandidates,
}: ConnectionManagerProps) {
  const [role, setRole] = useState<Role>('none');
  const [signalingStep, setSignalingStep] = useState<SignalingStep>('idle');
  
  const [initiatorOffer, setInitiatorOffer] = useState('');
  const [guestAnswer, setGuestAnswer] = useState('');
  const [remoteSdp, setRemoteSdp] = useState(''); 
  const [remoteIceCandidateInput, setRemoteIceCandidateInput] = useState('');
  const [localIceCandidatesDisplay, setLocalIceCandidatesDisplay] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  useEffect(() => {
    if (localSdpOffer && role === 'initiator') {
      setInitiatorOffer(localSdpOffer);
      setSignalingStep('initiator_offer_generated');
      setIsLoading(false); // Offer generation part is done
    }
  }, [localSdpOffer, role]);

  useEffect(() => {
    if (localSdpAnswer && role === 'guest') {
      setGuestAnswer(localSdpAnswer);
      setSignalingStep('guest_answer_generated');
      setIsLoading(false); // Answer generation part is done
    }
  }, [localSdpAnswer, role]);

  useEffect(() => {
     const candidatesJson = localIceCandidates.map(c => JSON.stringify(c)).join('\n');
     setLocalIceCandidatesDisplay(candidatesJson);
  }, [localIceCandidates]);

  useEffect(() => {
    console.log("ConnectionManager: currentConnectionState changed to", currentConnectionState, "current signalingStep:", signalingStep, "current role:", role);
    setIsLoading(currentConnectionState === 'connecting');

    switch (currentConnectionState) {
      case 'connected':
        setSignalingStep('connected');
        break;
      case 'failed':
        setSignalingStep('failed');
        // Role remains as is, to show "Try again" in context of initiator/guest
        break;
      case 'disconnected':
        // This means a clean disconnect (either after connection, or explicit user action, or failed then reset)
        setSignalingStep('idle');
        setRole('none'); // Allow starting over
        // Clear local visual states if any persisted
        setInitiatorOffer('');
        setGuestAnswer('');
        setRemoteSdp('');
        setRemoteIceCandidateInput('');
        setLocalIceCandidatesDisplay('');
        break;
      case 'offer_generated':
        // This state comes from useWebRTC. If role is initiator, ConnectionManager's localSdpOffer useEffect will handle UI.
        if (role === 'initiator') setIsLoading(false); // No longer 'connecting' for offer generation
        break;
      case 'answer_generated':
        // This state comes from useWebRTC. If role is guest, ConnectionManager's localSdpAnswer useEffect will handle UI.
        if (role === 'guest') setIsLoading(false); // No longer 'connecting' for answer generation
        break;
      // 'connecting' is handled by setIsLoading above.
      // 'awaiting_offer', 'awaiting_answer' are internal ConnectionManager steps.
    }
  }, [currentConnectionState, role]); // Role is needed to correctly interpret offer/answer_generated side effects


  const handleCopy = (text: string, id: string) => {
    if (!text) {
        toast({ title: "Nothing to Copy", description: `No ${id} data available.`, variant: "default" });
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      toast({ title: "Copied!", description: `${id} copied to clipboard.` });
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
    }).catch(err => {
      toast({ title: "Error", description: `Failed to copy ${id}.`, variant: "destructive" });
    });
  };

  const handleStartInitiator = () => {
    if (signalingStep !== 'idle') return; // Prevent re-initiation if not idle
    setRole('initiator');
    setSignalingStep('connecting'); // Optimistic UI update
    setIsLoading(true);
    onStartInitiator();
  };

  const handleStartGuest = () => {
    if (signalingStep !== 'idle') return; // Prevent re-initiation if not idle
    setRole('guest');
    setSignalingStep('guest_awaiting_offer');
    // setIsLoading(false); // No immediate loading, waiting for user input
  };
  
  const handleProcessOffer = () => {
    if (!remoteSdp.trim()) {
        toast({ title: "Error", description: "Offer SDP cannot be empty.", variant: "destructive" });
        return;
    }
    setSignalingStep('connecting'); // Optimistic UI update
    setIsLoading(true);
    onProcessOfferAndCreateAnswer(remoteSdp);
  };

  const handleAcceptAnswer = () => {
    if (!remoteSdp.trim()) {
        toast({ title: "Error", description: "Answer SDP cannot be empty.", variant: "destructive" });
        return;
    }
    setIsLoading(true); // Will transition to 'connecting' via useWebRTC state change
    onAcceptAnswer(remoteSdp);
    setSignalingStep('ice_exchange'); // Move to ICE exchange after answer is accepted by initiator
  };

  const handleAddRemoteIce = () => {
    if (!remoteIceCandidateInput.trim()) {
        toast({ title: "Info", description: "No ICE candidate data to add.", variant: "default" });
        return;
    }
    try {
        const candidates = remoteIceCandidateInput.trim().split('\n');
        let candidatesAdded = 0;
        candidates.forEach(candidateJson => {
            if (candidateJson.trim()) {
                 onAddRemoteIceCandidate(candidateJson.trim());
                 candidatesAdded++;
            }
        });
        if (candidatesAdded > 0) {
            toast({ title: "ICE Candidates Submitted", description: `Processing ${candidatesAdded} remote ICE candidate(s).`});
        } else {
            toast({ title: "Info", description: "No valid ICE candidate data found to add.", variant: "default" });
        }
        setRemoteIceCandidateInput(''); 
    } catch (e) {
        toast({ title: "Error", description: "Invalid ICE candidate JSON format.", variant: "destructive"});
        console.error("Error parsing ICE candidates:", e);
    }
  };
  
  const handleDisconnectClick = () => {
    onDisconnect(); // This will trigger useWebRTC to change currentConnectionState to 'disconnected'
                    // The useEffect for currentConnectionState will then reset UI to idle.
  };


  const renderRoleSelection = () => (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground">Choose your role to start a P2P connection.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleStartInitiator} className="w-full" disabled={isLoading || signalingStep !== 'idle'}>
          {isLoading && role === 'initiator' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Initiate New Session
        </Button>
        <Button onClick={handleStartGuest} variant="outline" className="w-full" disabled={isLoading || signalingStep !== 'idle'}>
         {isLoading && role === 'guest' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          Join Existing Session
        </Button>
      </div>
      <Alert variant="default" className="text-left">
        <Info className="h-4 w-4" />
        <AlertTitle>How it Works (Manual Signaling)</AlertTitle>
        <AlertDescription>
          One user (Initiator) generates an "Offer". The other (Guest) pastes this Offer and generates an "Answer".
          They exchange these, then exchange "ICE Candidates" to find each other. All data must be copied & pasted manually.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderInitiatorSteps = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Initiator Steps:</h3>
      {signalingStep === 'connecting' && !localSdpOffer && <p className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Offer...</p>}
      
      {signalingStep === 'initiator_offer_generated' && initiatorOffer && (
        <Card>
          <CardHeader><CardTitle>1. Share Your Offer SDP</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="initiator-offer-sdp">Your Offer SDP (copy this and send to Guest):</Label>
            <Textarea id="initiator-offer-sdp" value={initiatorOffer} readOnly rows={5} className="bg-muted/50"/>
            <Button onClick={() => handleCopy(initiatorOffer, 'Offer SDP')} variant="outline" size="sm" className="w-full">
              {copiedStates['Offer SDP'] ? <ClipboardCheck className="mr-2"/> : <ClipboardCopy className="mr-2"/>} Copy Offer
            </Button>
          </CardContent>
        </Card>
      )}

      {(signalingStep === 'initiator_offer_generated' || signalingStep === 'initiator_awaiting_answer' || (signalingStep === 'connecting' && initiatorOffer && !localSdpAnswer)) && (
        <Card>
          <CardHeader><CardTitle>2. Paste Guest&apos;s Answer SDP</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="guest-answer-sdp">Guest&apos;s Answer SDP (paste here):</Label>
            <Textarea id="guest-answer-sdp" value={remoteSdp} onChange={e => setRemoteSdp(e.target.value)} rows={5} placeholder="Paste Answer SDP from Guest here..." />
            <Button onClick={handleAcceptAnswer} disabled={isLoading || !remoteSdp.trim() || !initiatorOffer} className="w-full">
              {isLoading && !localSdpAnswer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Process Answer & Start ICE
            </Button>
          </CardContent>
        </Card>
      )}
      {renderIceExchangeSection()}
    </div>
  );

  const renderGuestSteps = () => (
     <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Guest Steps:</h3>
      {signalingStep === 'guest_awaiting_offer' && (
        <Card>
          <CardHeader><CardTitle>1. Paste Initiator&apos;s Offer SDP</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="initiator-offer-sdp-input">Initiator&apos;s Offer SDP (paste here):</Label>
            <Textarea id="initiator-offer-sdp-input" value={remoteSdp} onChange={e => setRemoteSdp(e.target.value)} rows={5} placeholder="Paste Offer SDP from Initiator here..." />
            <Button onClick={handleProcessOffer} disabled={isLoading || !remoteSdp.trim()} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Process Offer & Generate Answer
            </Button>
          </CardContent>
        </Card>
      )}

      {signalingStep === 'connecting' && role === 'guest' && !guestAnswer && <p className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing Offer & Generating Answer...</p>}

      {signalingStep === 'guest_answer_generated' && guestAnswer && (
         <Card>
          <CardHeader><CardTitle>2. Share Your Answer SDP</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="guest-answer-sdp-output">Your Answer SDP (copy this and send to Initiator):</Label>
            <Textarea id="guest-answer-sdp-output" value={guestAnswer} readOnly rows={5} className="bg-muted/50" />
             <Button onClick={() => handleCopy(guestAnswer, 'Answer SDP')} variant="outline" size="sm" className="w-full">
              {copiedStates['Answer SDP'] ? <ClipboardCheck className="mr-2"/> : <ClipboardCopy className="mr-2"/>} Copy Answer
            </Button>
          </CardContent>
        </Card>
      )}
       {(signalingStep === 'guest_answer_generated' || signalingStep === 'ice_exchange' || (signalingStep === 'connecting' && guestAnswer)) && renderIceExchangeSection()}
    </div>
  );

 const renderIceExchangeSection = () => {
    // Show ICE section if:
    // - Explicitly in 'ice_exchange' step (after initiator accepts answer)
    // - Initiator: offer generated, AND answer processed (remoteSdp was filled and 'Process Answer' clicked)
    // - Guest: answer generated
    const showForInitiatorAfterAnswerProcessed = role === 'initiator' && signalingStep === 'ice_exchange';
    const showForGuestAfterAnswerGenerated = role === 'guest' && localSdpAnswer;


    if (showForInitiatorAfterAnswerProcessed || showForGuestAfterAnswerGenerated) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>3. Exchange ICE Candidates</CardTitle>
                    <CardDescription>Copy your candidates and send to peer. Paste peer&apos;s candidates below. This may take a few moments and multiple exchanges.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="local-ice-candidates">Your ICE Candidates (new candidates may appear, copy all lines):</Label>
                        <Textarea id="local-ice-candidates" value={localIceCandidatesDisplay} readOnly rows={5} className="bg-muted/50 text-xs" placeholder="Your ICE candidates will appear here..."/>
                        <Button onClick={() => handleCopy(localIceCandidatesDisplay, 'Local ICE')} variant="outline" size="sm" className="w-full mt-1" disabled={!localIceCandidatesDisplay.trim()}>
                            {copiedStates['Local ICE'] ? <ClipboardCheck className="mr-2"/> : <ClipboardCopy className="mr-2"/>} Copy My Candidates
                        </Button>
                    </div>
                    <div>
                        <Label htmlFor="remote-ice-candidates">Peer&apos;s ICE Candidates (paste here, one JSON object per line):</Label>
                        <Textarea id="remote-ice-candidates" value={remoteIceCandidateInput} onChange={e => setRemoteIceCandidateInput(e.target.value)} rows={5} placeholder="Paste peer's ICE candidates here..."/>
                        <Button onClick={handleAddRemoteIce} disabled={isLoading || currentConnectionState === 'connected'} className="w-full mt-1">
                            {isLoading && currentConnectionState !== 'connected' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>} Add Peer&apos;s Candidates
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }
    return null;
 };
  
  const renderConnectedState = () => (
    <div className="space-y-4 text-center">
        <ShieldAlert className="h-12 w-12 text-green-500 mx-auto"/>
        <p className="text-xl font-semibold text-green-500">Connected!</p>
        <p className="text-muted-foreground">You can now use the File Transfer, Data Transfer, and Messaging tabs.</p>
        <Button onClick={handleDisconnectClick} variant="destructive" className="w-full">
            <Link2 className="mr-2 h-4 w-4" />
            Disconnect
        </Button>
    </div>
  );

  const renderFailedState = () => (
     <div className="space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto"/>
        <p className="text-xl font-semibold text-red-500">Connection Failed</p>
        <p className="text-muted-foreground">Something went wrong. Please ensure data was copied correctly and try again.</p>
        <Button onClick={handleDisconnectClick} variant="outline" className="w-full">
            Reset and Try Again
        </Button>
    </div>
  );


  return (
    <div className="space-y-6">
      {signalingStep === 'idle' && renderRoleSelection()}
      {role === 'initiator' && signalingStep !== 'idle' && signalingStep !== 'connected' && signalingStep !== 'failed' && renderInitiatorSteps()}
      {role === 'guest' && signalingStep !== 'idle' && signalingStep !== 'connected' && signalingStep !== 'failed' && renderGuestSteps()}
      {signalingStep === 'connected' && renderConnectedState()}
      {signalingStep === 'failed' && renderFailedState()}

      {(signalingStep !== 'idle' && signalingStep !== 'connected' && signalingStep !== 'failed' && role !== 'none') && (
         <Button onClick={handleDisconnectClick} variant="outline" className="w-full mt-4">
            <VenetianMask className="mr-2 h-4 w-4" />
            Reset Connection Process
        </Button>
      )}
      
       <div className="text-center text-sm pt-2 text-muted-foreground">
        Status: <span className={`font-semibold ${
            currentConnectionState === 'connected' ? 'text-green-500' :
            currentConnectionState === 'failed' ? 'text-red-500' :
            isLoading ? 'text-yellow-500' : // isLoading is true when currentConnectionState is 'connecting'
            'text-foreground/80' 
        }`}>
            {isLoading ? "Processing..." : 
             signalingStep === 'failed' ? "Failed" : // Show "Failed" if UI step is failed, even if underlying might be 'disconnected'
             currentConnectionState.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      </div>
    </div>
  );
}

    