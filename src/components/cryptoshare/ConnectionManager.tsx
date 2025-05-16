
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, UserPlus, Link2, ShieldAlert, ClipboardCopy, ClipboardCheck, RotateCcw, Info, ShieldCheckIcon, WifiOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PeerConnectionState } from '@/types/cryptoshare';

const MAX_JOIN_ATTEMPTS = 5;
const JOIN_LOCKOUT_DURATION = 30 * 1000; // 30 seconds

interface ConnectionManagerProps {
  currentConnectionState: PeerConnectionState;
  sessionKey: string | null;
  errorDetails: string | null; // New prop for error details
  onCreateSession: () => void;
  onJoinSession: (sessionKey: string) => void;
  onDisconnect: () => void;
}

export function ConnectionManager({
  currentConnectionState,
  sessionKey,
  errorDetails,
  onCreateSession,
  onJoinSession,
  onDisconnect,
}: ConnectionManagerProps) {
  const [inputSessionKey, setInputSessionKey] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [joinAttempts, setJoinAttempts] = useState(0);
  const [joinDisabledUntil, setJoinDisabledUntil] = useState<number | null>(null);

  useEffect(() => {
    console.log("ConnectionManager: currentConnectionState prop changed to", currentConnectionState);
    if (currentConnectionState === 'disconnected' || currentConnectionState === 'failed') {
      console.log("ConnectionManager: Resetting inputs due to disconnect/fail.");
      setInputSessionKey(''); 
      // If the failure was after a join attempt, handle lockout
      if (currentConnectionState === 'failed' && inputSessionKey) { // Check if inputSessionKey was set (meaning it was a join attempt)
        const newAttempts = joinAttempts + 1;
        setJoinAttempts(newAttempts);
        if (newAttempts >= MAX_JOIN_ATTEMPTS) {
          const lockoutEnds = Date.now() + JOIN_LOCKOUT_DURATION;
          setJoinDisabledUntil(lockoutEnds);
          toast({
            title: "Too Many Failed Attempts",
            description: `Session joining disabled for ${JOIN_LOCKOUT_DURATION / 1000} seconds.`,
            variant: "destructive",
          });
        }
      }
    } else if (currentConnectionState === 'connected') {
      setJoinAttempts(0); // Reset attempts on successful connection
      setJoinDisabledUntil(null);
    }
  }, [currentConnectionState, toast, inputSessionKey]); // Added inputSessionKey to know if failure was from join

   useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (joinDisabledUntil && joinDisabledUntil > Date.now()) {
      timer = setTimeout(() => {
        setJoinDisabledUntil(null);
        setJoinAttempts(0); // Reset attempts after lockout
      }, joinDisabledUntil - Date.now());
    }
    return () => clearTimeout(timer);
  }, [joinDisabledUntil]);


  const handleCopyKey = () => {
    if (sessionKey) {
      navigator.clipboard.writeText(sessionKey).then(() => {
        setCopied(true);
        toast({ title: "Copied!", description: "Session Key copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        toast({ title: "Error", description: "Failed to copy Session Key.", variant: "destructive" });
      });
    }
  };

  const handleJoinClick = () => {
    if (joinDisabledUntil && joinDisabledUntil > Date.now()) {
      toast({ title: "Joining Disabled", description: `Please wait ${Math.ceil((joinDisabledUntil - Date.now())/1000)} more seconds.`, variant: "destructive" });
      return;
    }
    if (!inputSessionKey.trim()) {
      toast({ title: "Error", description: "Please enter a Session Key.", variant: "destructive" });
      return;
    }
    onJoinSession(inputSessionKey.trim());
  };
  
  const isLoading = ['creating_session', 'joining_session', 'connecting'].includes(currentConnectionState);
  const isJoiningDisabledByLockout = joinDisabledUntil !== null && joinDisabledUntil > Date.now();


  const renderInitialActions = () => (
    <div className="space-y-6 text-center">
      <Alert variant="default" className="text-left bg-card border-border shadow-sm">
        <Info className="mr-3 h-5 w-5 shrink-0 text-primary" />
        <AlertTitle className="font-semibold">How to Connect</AlertTitle>
        <AlertDescription className="text-sm">
          One user starts a new session to get a Session Key. Share this key with the other user.
          The other user enters the key to join the session. The connection will be established automatically.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button onClick={() => { setJoinAttempts(0); setJoinDisabledUntil(null); onCreateSession(); }} className="w-full py-3 text-base" disabled={isLoading}>
          {currentConnectionState === 'creating_session' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
          Create New Session
        </Button>
        <Card className="w-full p-4 space-y-3 text-left bg-background/50 border-border/70 rounded-lg shadow">
            <Label htmlFor="session-key-input" className="font-medium text-foreground">Join Existing Session</Label>
            <Input 
                id="session-key-input"
                placeholder="Enter Session Key"
                value={inputSessionKey}
                onChange={(e) => setInputSessionKey(e.target.value)}
                disabled={isLoading || isJoiningDisabledByLockout}
                className="h-11 text-base"
            />
            <Button onClick={handleJoinClick} variant="outline" className="w-full py-3 text-base" disabled={isLoading || !inputSessionKey.trim() || isJoiningDisabledByLockout}>
                {currentConnectionState === 'joining_session' && isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                Join Session
            </Button>
            {isJoiningDisabledByLockout && (
              <p className="text-xs text-destructive text-center">
                Joining temporarily disabled. Please wait {Math.ceil((joinDisabledUntil! - Date.now())/1000)}s.
              </p>
            )}
        </Card>
      </div>
    </div>
  );

  const renderWaitingForPeer = () => (
    <div className="space-y-6 text-center p-4 bg-muted/50 rounded-lg shadow-md">
      <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin"/>
      <p className="text-xl font-semibold text-primary">Waiting for Peer...</p>
      <p className="text-muted-foreground">Share this Session Key with your peer:</p>
      <div className="p-3 bg-background rounded-md font-mono text-lg break-all flex items-center justify-between shadow-inner border border-border">
        <span className="select-all">{sessionKey}</span>
        <Button onClick={handleCopyKey} variant="ghost" size="icon" aria-label="Copy session key">
            {copied ? <ClipboardCheck className="h-6 w-6 text-green-500" /> : <ClipboardCopy className="h-6 w-6 text-muted-foreground hover:text-primary" />}
        </Button>
      </div>
      <Button onClick={onDisconnect} variant="outline" className="w-full mt-4 py-3 text-base"><RotateCcw className="mr-2 h-4 w-4" />Cancel</Button>
    </div>
  );

  const renderConnecting = () => (
     <div className="space-y-6 text-center p-4 bg-muted/50 rounded-lg shadow-md">
        <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin"/>
        <p className="text-xl font-semibold text-primary">Connecting...</p>
        <p className="text-muted-foreground">Establishing secure peer-to-peer connection. Please wait.</p>
         <Button onClick={onDisconnect} variant="outline" className="w-full mt-4 py-3 text-base"><RotateCcw className="mr-2 h-4 w-4" />Cancel</Button>
    </div>
  );
  
  const renderConnectedDisplay = () => (
    <div className="space-y-6 text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg shadow-md">
        <ShieldCheckIcon className="h-16 w-16 text-green-600 mx-auto"/>
        <p className="text-2xl font-bold text-green-700 dark:text-green-500">Securely Connected!</p>
        <p className="text-muted-foreground">You can now use File Transfer, Data Transfer, and Messaging tabs below.</p>
        {sessionKey && <p className="text-xs text-muted-foreground">(Session: {sessionKey})</p>}
        <Button onClick={onDisconnect} variant="destructive" className="w-full py-3 text-base">
            <Link2 className="mr-2 h-5 w-5" /> Disconnect Session
        </Button>
    </div>
  );

  const renderFailedDisplay = () => (
     <div className="space-y-6 text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg shadow-md">
        <WifiOff className="h-16 w-16 text-red-600 mx-auto"/>
        <p className="text-2xl font-bold text-red-700 dark:text-red-500">Connection Failed</p>
        <p className="text-muted-foreground">
          {errorDetails || "Something went wrong. Please ensure the Session Key is correct and try again. If issues persist, check network or firewall settings."}
        </p>
        <Button onClick={() => { setJoinAttempts(0); setJoinDisabledUntil(null); onDisconnect(); }} variant="outline" className="w-full py-3 text-base">
           <RotateCcw className="mr-2 h-5 w-5" /> Reset and Try Again
        </Button>
    </div>
  );
  
  let statusText = currentConnectionState.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const statusColor = currentConnectionState === 'connected' ? 'text-green-600 dark:text-green-500' :
                      currentConnectionState === 'failed' ? 'text-red-600 dark:text-red-500' :
                      isLoading ? 'text-yellow-600 dark:text-yellow-500' :
                      'text-foreground/80';

  return (
    <div className="space-y-6">
      {currentConnectionState === 'disconnected' && renderInitialActions()}
      {currentConnectionState === 'creating_session' && renderConnecting()}
      {currentConnectionState === 'waiting_for_peer' && renderWaitingForPeer()}
      {currentConnectionState === 'joining_session' && renderConnecting()}
      {currentConnectionState === 'connecting' && renderConnecting()}
      {currentConnectionState === 'connected' && renderConnectedDisplay()}
      {currentConnectionState === 'failed' && renderFailedDisplay()}
      
       <div className="text-center text-sm pt-2 text-muted-foreground">
        Status: <span className={`font-semibold ${statusColor}`}>{statusText}</span>
        {isLoading && currentConnectionState === 'joining_session' && sessionKey && (
          <span className="block text-xs">(Attempting to join: {sessionKey})</span>
        )}
      </div>
    </div>
  );
}
