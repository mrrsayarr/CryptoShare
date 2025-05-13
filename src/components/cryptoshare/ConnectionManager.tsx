
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Link2, ShieldAlert, ClipboardCopy, ClipboardCheck, Info, VenetianMask, UserPlus } from 'lucide-react';
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
  | 'guest_awaiting_initiator_ice'
  | 'ice_exchange' // Generic state for both roles after SDPs
  | 'connected'
  | 'connecting'
  | 'failed'
  | 'disconnected';


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
  const [remoteSdp, setRemoteSdp] = useState(''); // For initiator to input answer, or guest to input offer
  const [remoteIceCandidateInput, setRemoteIceCandidateInput] = useState('');
  const [localIceCandidatesDisplay, setLocalIceCandidatesDisplay] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  useEffect(() => {
    if (localSdpOffer && role === 'initiator') {
      setInitiatorOffer(localSdpOffer);
      setSignalingStep('initiator_offer_generated');
      setIsLoading(false);
    }
  }, [localSdpOffer, role]);

  useEffect(() => {
    if (localSdpAnswer && role === 'guest') {
      setGuestAnswer(localSdpAnswer);
      setSignalingStep('guest_answer_generated');
      setIsLoading(false);
    }
  }, [localSdpAnswer, role]);

  useEffect(() => {
     const candidatesJson = localIceCandidates.map(c => JSON.stringify(c)).join('\n');
     setLocalIceCandidatesDisplay(candidatesJson);
  }, [localIceCandidates]);

  useEffect(() => {
    switch (currentConnectionState) {
      case 'connected':
        setSignalingStep('connected');
        setIsLoading(false);
        toast({ title: "Connection Established!", description: "You are now connected to your peer." });
        break;
      case 'connecting':
        setSignalingStep('connecting');
        setIsLoading(true);
        break;
      case 'failed':
        setSignalingStep('failed');
        setIsLoading(false);
        toast({ title: "Connection Failed", variant: "destructive" });
        break;
      case 'disconnected':
        // Only reset to idle if not already in a pre-connection setup phase by user action
        if (signalingStep !== 'initiator_offer_generated' && 
            signalingStep !== 'guest_answer_generated' &&
            signalingStep !== 'guest_awaiting_offer' &&
            signalingStep !== 'initiator_awaiting_answer' &&
            signalingStep !== 'ice_exchange'
            ) {
          setSignalingStep('idle');
        }
        setRole('none'); // Reset role on full disconnect
        setIsLoading(false);
        // Toast for disconnect is usually handled by parent if it's unexpected
        break;
      case 'offer_generated': // Handled by localSdpOffer effect for initiator
        setSignalingStep('initiator_offer_generated');
        setIsLoading(false);
        break;
      case 'answer_generated': // Handled by localSdpAnswer effect for guest
         setSignalingStep('guest_answer_generated');
         setIsLoading(false);
        break;
       case 'awaiting_offer':
         setSignalingStep('guest_awaiting_offer');
         setIsLoading(false);
         break;
        case 'awaiting_answer':
         setSignalingStep('initiator_awaiting_answer');
         setIsLoading(false);
         break;
    }
  }, [currentConnectionState, toast, signalingStep]);


  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      toast({ title: "Copied!", description: `${id} copied to clipboard.` });
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
    }).catch(err => {
      toast({ title: "Error", description: `Failed to copy ${id}.`, variant: "destructive" });
    });
  };

  const handleStartInitiator = () => {
    setRole('initiator');
    setIsLoading(true);
    onStartInitiator();
    setSignalingStep('connecting'); // Or a more specific "generating_offer"
  };

  const handleStartGuest = () => {
    setRole('guest');
    setSignalingStep('guest_awaiting_offer');
  };
  
  const handleProcessOffer = () => {
    if (!remoteSdp.trim()) {
        toast({ title: "Error", description: "Offer SDP cannot be empty.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    onProcessOfferAndCreateAnswer(remoteSdp);
    setSignalingStep('connecting'); // Or "generating_answer"
  };

  const handleAcceptAnswer = () => {
    if (!remoteSdp.trim()) {
        toast({ title: "Error", description: "Answer SDP cannot be empty.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    onAcceptAnswer(remoteSdp);
    setSignalingStep('ice_exchange'); // Move to ICE exchange after answer is accepted
  };

  const handleAddRemoteIce = () => {
    if (!remoteIceCandidateInput.trim()) {
        toast({ title: "Info", description: "No ICE candidate data to add.", variant: "default" });
        return;
    }
    try {
        // Assuming candidates are one JSON object per line
        const candidates = remoteIceCandidateInput.trim().split('\n');
        candidates.forEach(candidateJson => {
            if (candidateJson.trim()) {
                 onAddRemoteIceCandidate(candidateJson.trim());
            }
        });
        toast({ title: "ICE Candidates Submitted", description: "Processing remote ICE candidates."});
        setRemoteIceCandidateInput(''); // Clear after submission
    } catch (e) {
        toast({ title: "Error", description: "Invalid ICE candidate JSON format.", variant: "destructive"});
        console.error("Error parsing ICE candidates:", e);
    }
  };
  
  const handleDisconnectClick = () => {
    setIsLoading(true);
    onDisconnect();
    // Resetting local state for a fresh start
    setRole('none');
    setSignalingStep('idle');
    setInitiatorOffer('');
    setGuestAnswer('');
    setRemoteSdp('');
    setRemoteIceCandidateInput('');
    setLocalIceCandidatesDisplay('');
    // isLoading will be set to false by useEffect on currentConnectionState change to 'disconnected'
  };


  const renderRoleSelection = () => (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground">Choose your role to start a P2P connection.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleStartInitiator} className="w-full" disabled={isLoading}>
          {isLoading && role === 'initiator' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Initiate New Session
        </Button>
        <Button onClick={handleStartGuest} variant="outline" className="w-full" disabled={isLoading}>
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
      {signalingStep === 'connecting' && <p className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Offer...</p>}
      
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

      {(signalingStep === 'initiator_offer_generated' || signalingStep === 'initiator_awaiting_answer') && (
        <Card>
          <CardHeader><CardTitle>2. Paste Guest&apos;s Answer SDP</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="guest-answer-sdp">Guest&apos;s Answer SDP (paste here):</Label>
            <Textarea id="guest-answer-sdp" value={remoteSdp} onChange={e => setRemoteSdp(e.target.value)} rows={5} placeholder="Paste Answer SDP from Guest here..." />
            <Button onClick={handleAcceptAnswer} disabled={isLoading || !remoteSdp.trim()} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
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

      {signalingStep === 'connecting' && role === 'guest' && <p className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Answer...</p>}

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
       {(signalingStep === 'guest_answer_generated' || signalingStep === 'guest_awaiting_initiator_ice' || signalingStep === 'ice_exchange') && renderIceExchangeSection()}
    </div>
  );

  const renderIceExchangeSection = () => (
    (signalingStep === 'ice_exchange' || 
     (role === 'initiator' && signalingStep === 'initiator_awaiting_answer' && remoteSdp.trim()) || // Initiator after processing answer
     (role === 'guest' && signalingStep === 'guest_answer_generated')) && // Guest after generating answer
    <Card>
        <CardHeader>
            <CardTitle>{role === 'initiator' ? '3.' : '3.'} Exchange ICE Candidates</CardTitle>
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
                <Button onClick={handleAddRemoteIce} disabled={isLoading} className="w-full mt-1">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>} Add Peer&apos;s Candidates
                </Button>
            </div>
        </CardContent>
    </Card>
  );
  
  const renderConnectedState = () => (
    <div className="space-y-4 text-center">
        <ShieldAlert className="h-12 w-12 text-green-500 mx-auto"/>
        <p className="text-xl font-semibold text-green-500">Connected!</p>
        <p className="text-muted-foreground">You can now use the File Transfer, Data Transfer, and Messaging tabs.</p>
        <Button onClick={handleDisconnectClick} variant="destructive" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
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
            Try Again
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
         <Button onClick={handleDisconnectClick} variant="outline" className="w-full mt-4" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <VenetianMask className="mr-2 h-4 w-4" />}
            Reset Connection Process
        </Button>
      )}
      
       <div className="text-center text-sm pt-2 text-muted-foreground">
        Status: <span className={`font-semibold ${
            currentConnectionState === 'connected' ? 'text-green-500' :
            currentConnectionState === 'failed' ? 'text-red-500' :
            currentConnectionState === 'connecting' || isLoading ? 'text-yellow-500' :
            'text-foreground/80' 
        }`}>
            {isLoading && signalingStep !== 'connected' && signalingStep !== 'failed' ? "Processing..." : 
             currentConnectionState.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      </div>
    </div>
  );
}
