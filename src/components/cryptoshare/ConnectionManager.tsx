
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Link2, ShieldAlert, ClipboardCopy, ClipboardCheck, Info, VenetianMask, UserPlus, AlertTriangle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PeerConnectionState } from '@/types/cryptoshare';

interface ConnectionManagerProps {
  currentConnectionState: PeerConnectionState; // Primary driver of UI state
  onStartInitiator: () => void;
  onProcessOfferAndCreateAnswer: (offerSdp: string) => void;
  onAcceptAnswer: (answerSdp: string) => void;
  onAddRemoteIceCandidate: (candidateJson: string) => void;
  onDisconnect: () => void; // User clicks "Disconnect" or "Reset"
  localSdpOffer: string | null; // From parent (CryptosharePage, fed by useWebRTC)
  localSdpAnswer: string | null; // From parent
  localIceCandidates: RTCIceCandidateInit[]; // From parent
}

// 'Role' determines which set of instructions/UI elements are shown
type Role = 'none' | 'initiator' | 'guest';

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
  
  // These are for user input within this component
  const [remoteSdpForInput, setRemoteSdpForInput] = useState(''); 
  const [remoteIceCandidateInput, setRemoteIceCandidateInput] = useState('');
  
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Effect to reset role and inputs when the connection fully disconnects or fails
  useEffect(() => {
    console.log("ConnectionManager: currentConnectionState prop changed to", currentConnectionState);
    if (currentConnectionState === 'disconnected' || currentConnectionState === 'failed') {
      if (role !== 'none') { // Only log/perform state set if actually changing role
        console.log("ConnectionManager: Resetting role to 'none' and clearing inputs due to disconnect/fail. Current role:", role);
        setRole('none');
      }
      // Always clear inputs if disconnected or failed, even if role was already 'none'
      setRemoteSdpForInput('');
      setRemoteIceCandidateInput('');
    }
  }, [currentConnectionState]); // IMPORTANT: Removed 'role' from dependency array

  const localIceCandidatesDisplay = localIceCandidates.map(c => JSON.stringify(c)).join('\n');

  const handleCopy = (text: string | null, id: string) => {
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

  const handleStartInitiatorClick = () => {
    if (currentConnectionState === 'disconnected' || currentConnectionState === 'failed') {
        setRole('initiator');
        setRemoteSdpForInput(''); 
        setRemoteIceCandidateInput('');
        onStartInitiator();
    } else {
        toast({title: "Action Blocked", description: `Cannot initiate. Current state: ${currentConnectionState}. Please reset first.`, variant: "default"});
    }
  };

  const handleStartGuestClick = () => {
    if (currentConnectionState === 'disconnected' || currentConnectionState === 'failed') {
        setRole('guest');
        setRemoteSdpForInput(''); 
        setRemoteIceCandidateInput('');
    } else {
         toast({title: "Action Blocked", description: `Cannot join. Current state: ${currentConnectionState}. Please reset first.`, variant: "default"});
    }
  };
  
  const handleProcessOfferClick = () => {
    if (!remoteSdpForInput.trim()) {
        toast({ title: "Error", description: "Offer SDP cannot be empty.", variant: "destructive" });
        return;
    }
    onProcessOfferAndCreateAnswer(remoteSdpForInput);
  };

  const handleAcceptAnswerClick = () => {
    if (!remoteSdpForInput.trim()) {
        toast({ title: "Error", description: "Answer SDP cannot be empty.", variant: "destructive" });
        return;
    }
    onAcceptAnswer(remoteSdpForInput);
  };

  const handleAddRemoteIceClick = () => {
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
  
  const handleDisconnectOrResetClick = () => {
    onDisconnect(); 
  };

  const isLoading = currentConnectionState === 'connecting';
  const isSessionActive = currentConnectionState === 'connected' || currentConnectionState === 'connecting' || currentConnectionState === 'offer_generated' || currentConnectionState === 'answer_generated';

  const renderRoleSelection = () => (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground">Choose your role to start a P2P connection.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={handleStartInitiatorClick} 
          className="w-full" 
          disabled={isLoading || (currentConnectionState !== 'disconnected' && currentConnectionState !== 'failed')}
        >
          {isLoading && role === 'initiator' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Initiate New Session
        </Button>
        <Button 
          onClick={handleStartGuestClick} 
          variant="outline" 
          className="w-full" 
          disabled={isLoading || (currentConnectionState !== 'disconnected' && currentConnectionState !== 'failed')}
        >
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
      {currentConnectionState === 'connecting' && !localSdpOffer && <p className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Offer...</p>}
      
      {localSdpOffer && (currentConnectionState === 'offer_generated' || currentConnectionState === 'connecting') && (
        <Card>
          <CardHeader><CardTitle>1. Share Your Offer SDP</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="initiator-offer-sdp">Your Offer SDP (copy this and send to Guest):</Label>
            <Textarea id="initiator-offer-sdp" value={localSdpOffer} readOnly rows={5} className="bg-muted/50"/>
            <Button onClick={() => handleCopy(localSdpOffer, 'Offer SDP')} variant="outline" size="sm" className="w-full">
              {copiedStates['Offer SDP'] ? <ClipboardCheck className="mr-2"/> : <ClipboardCopy className="mr-2"/>} Copy Offer
            </Button>
          </CardContent>
        </Card>
      )}

      {localSdpOffer && (currentConnectionState === 'offer_generated' || currentConnectionState === 'connecting') && !currentConnectionState.match(/^(connected|failed)$/) && (
        <Card>
          <CardHeader><CardTitle>2. Paste Guest&apos;s Answer SDP</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="guest-answer-sdp-input">Guest&apos;s Answer SDP (paste here):</Label>
            <Textarea 
                id="guest-answer-sdp-input" 
                value={remoteSdpForInput} 
                onChange={e => setRemoteSdpForInput(e.target.value)} 
                rows={5} 
                placeholder="Paste Answer SDP from Guest here..." 
                disabled={isLoading && currentConnectionState !== 'offer_generated'}
            />
            <Button onClick={handleAcceptAnswerClick} disabled={isLoading || !remoteSdpForInput.trim() || !localSdpOffer} className="w-full">
              {isLoading && currentConnectionState === 'connecting' && !localSdpAnswer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Process Answer & Start ICE
            </Button>
          </CardContent>
        </Card>
      )}
      {(currentConnectionState === 'connecting' || currentConnectionState === 'connected' || currentConnectionState === 'offer_generated' || currentConnectionState === 'answer_generated' ) && localSdpOffer && renderIceExchangeSection()}
    </div>
  );

  const renderGuestSteps = () => (
     <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Guest Steps:</h3>
      {(currentConnectionState === 'disconnected' || currentConnectionState === 'failed' || currentConnectionState === 'connecting') && !localSdpAnswer && (
        <Card>
          <CardHeader><CardTitle>1. Paste Initiator&apos;s Offer SDP</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="initiator-offer-sdp-input-guest">Initiator&apos;s Offer SDP (paste here):</Label>
            <Textarea 
                id="initiator-offer-sdp-input-guest" 
                value={remoteSdpForInput} 
                onChange={e => setRemoteSdpForInput(e.target.value)} 
                rows={5} 
                placeholder="Paste Offer SDP from Initiator here..." 
                disabled={isLoading}
            />
            <Button onClick={handleProcessOfferClick} disabled={isLoading || !remoteSdpForInput.trim()} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Process Offer & Generate Answer
            </Button>
          </CardContent>
        </Card>
      )}
      {currentConnectionState === 'connecting' && !localSdpAnswer && role === 'guest' && <p className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing Offer & Generating Answer...</p>}

      {localSdpAnswer && (currentConnectionState === 'answer_generated' || currentConnectionState === 'connecting') && (
         <Card>
          <CardHeader><CardTitle>2. Share Your Answer SDP</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="guest-answer-sdp-output">Your Answer SDP (copy this and send to Initiator):</Label>
            <Textarea id="guest-answer-sdp-output" value={localSdpAnswer} readOnly rows={5} className="bg-muted/50" />
             <Button onClick={() => handleCopy(localSdpAnswer, 'Answer SDP')} variant="outline" size="sm" className="w-full">
              {copiedStates['Answer SDP'] ? <ClipboardCheck className="mr-2"/> : <ClipboardCopy className="mr-2"/>} Copy Answer
            </Button>
          </CardContent>
        </Card>
      )}
      {(currentConnectionState === 'connecting' || currentConnectionState === 'connected' || currentConnectionState === 'answer_generated') && localSdpAnswer && renderIceExchangeSection()}
    </div>
  );

 const renderIceExchangeSection = () => {
    const showIce = currentConnectionState === 'connecting' || currentConnectionState === 'connected' || 
                    currentConnectionState === 'offer_generated' || currentConnectionState === 'answer_generated';
    
    if (showIce && (localSdpOffer || localSdpAnswer)) { 
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
                        <Textarea 
                            id="remote-ice-candidates" 
                            value={remoteIceCandidateInput} 
                            onChange={e => setRemoteIceCandidateInput(e.target.value)} 
                            rows={5} 
                            placeholder="Paste peer's ICE candidates here..."
                            disabled={currentConnectionState === 'connected' || isLoading}
                        />
                        <Button onClick={handleAddRemoteIceClick} disabled={currentConnectionState === 'connected' || isLoading} className="w-full mt-1">
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
        <Button onClick={handleDisconnectOrResetClick} variant="destructive" className="w-full">
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
        <Button onClick={handleDisconnectOrResetClick} variant="outline" className="w-full">
           <RotateCcw className="mr-2 h-4 w-4" /> Reset and Try Again
        </Button>
    </div>
  );

  const statusText = isLoading ? "Processing..." :
                     currentConnectionState.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const statusColor = currentConnectionState === 'connected' ? 'text-green-500' :
                      currentConnectionState === 'failed' ? 'text-red-500' :
                      isLoading ? 'text-yellow-500' :
                      'text-foreground/80';

  return (
    <div className="space-y-6">
      {role === 'none' && currentConnectionState !== 'connected' && currentConnectionState !== 'failed' && renderRoleSelection()}
      {role === 'initiator' && currentConnectionState !== 'connected' && currentConnectionState !== 'failed' && renderInitiatorSteps()}
      {role === 'guest' && currentConnectionState !== 'connected' && currentConnectionState !== 'failed' && renderGuestSteps()}
      
      {currentConnectionState === 'connected' && renderConnectedState()}
      {currentConnectionState === 'failed' && renderFailedState()}

      {(role !== 'none' && currentConnectionState !== 'connected' && currentConnectionState !== 'failed') && (
         <Button onClick={handleDisconnectOrResetClick} variant="outline" className="w-full mt-4">
            <VenetianMask className="mr-2 h-4 w-4" />
            Reset Connection Process
        </Button>
      )}
      
       <div className="text-center text-sm pt-2 text-muted-foreground">
        Status: <span className={`font-semibold ${statusColor}`}>{statusText}</span>
      </div>
    </div>
  );
}

    