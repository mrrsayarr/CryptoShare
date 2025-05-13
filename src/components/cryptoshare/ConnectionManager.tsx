"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Link2, Zap, ShieldAlert, Copy, Check } from 'lucide-react';
import { suggestStrongerPasswords } from '@/app/password-strength/actions';
import type { SuggestStrongerPasswordsOutput } from '@/app/password-strength/actions';
// AlertDialog components are not used, so they can be removed if not planned for immediate use.
// For now, keeping them as they might be intended for future features.
/*
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
*/

interface ConnectionManagerProps {
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
  sessionKey: string;
  setSessionKey: (key: string) => void;
}

export function ConnectionManager({
  isConnected,
  setIsConnected,
  sessionKey,
  setSessionKey,
}: ConnectionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [passwordSuggestions, setPasswordSuggestions] = useState<SuggestStrongerPasswordsOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    if (!sessionKey) {
      toast({
        title: 'Error',
        description: 'Session key cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    // Mock connection
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      toast({
        title: 'Connected',
        description: `Successfully connected with key: ${sessionKey.substring(0,8)}... (Mocked)`,
      });
    }, 1500);
  };

  const handleDisconnect = () => {
    setIsLoading(true);
    // Mock disconnection
    setTimeout(() => {
      setIsConnected(false);
      setIsLoading(false);
      // setSessionKey(''); // Optionally clear the key on disconnect
      toast({
        title: 'Disconnected',
        description: 'Connection closed.',
      });
    }, 1000);
  };

  const generateKey = () => {
    setIsGenerating(true);
    // Mock key generation
    setTimeout(() => {
      // A more secure key generation method should be used in a real app
      const newKey = Array(32).fill(null).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      setSessionKey(newKey);
      setIsGenerating(false);
      setShowSuggestions(false); // Hide suggestions if a new key is generated
      setPasswordSuggestions(null);
      toast({
        title: 'Key Generated',
        description: 'A new session key has been generated.',
      });
    }, 500);
  };

  const checkPasswordStrength = useCallback(async () => {
    if (!sessionKey || sessionKey.length < 8) {
      toast({ title: "Weak Key", description: "Key is too short to analyze. Minimum 8 characters.", variant: "destructive"});
      setPasswordSuggestions(null);
      setShowSuggestions(false);
      return;
    }
    setIsLoading(true); // Use a different loading state? Or ensure it's okay to reuse.
    try {
      const result = await suggestStrongerPasswords({ password: sessionKey });
      setPasswordSuggestions(result);
      setShowSuggestions(true);
      if(result.suggestions.length > 0) {
         toast({ title: "Key Strength Analysis", description: "Suggestions available for your custom key."});
      } else {
         toast({ title: "Key Strength Analysis", description: "Your key seems strong, or no specific suggestions were generated."});
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to get key strength suggestions.", variant: "destructive"});
      setPasswordSuggestions(null);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [sessionKey, toast]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(sessionKey).then(() => {
      setCopied(true);
      toast({ title: "Copied!", description: "Session key copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      toast({ title: "Error", description: "Failed to copy key.", variant: "destructive" });
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="session-key" className="text-foreground/80">Session Key</Label>
        <div className="flex space-x-2">
          <Input
            id="session-key"
            type="text" // Consider type="password" if key should be obscured, or allow toggle
            placeholder="Enter or generate a session key"
            value={sessionKey}
            onChange={(e) => {
              setSessionKey(e.target.value);
              setShowSuggestions(false); // Hide suggestions when key changes
              setPasswordSuggestions(null);
            }}
            disabled={isConnected || isLoading}
            className="bg-background border-border focus:ring-primary"
          />
          {sessionKey && !isConnected && (
             <Button variant="ghost" size="icon" onClick={handleCopyKey} title="Copy key" disabled={isLoading}>
              {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {!isConnected && (
          <p className="text-xs text-muted-foreground pt-1">
            To connect with a peer: 1. One user generates or enters a key. 2. Share this exact key securely with your peer. 3. Both users enter the same key above and click 'Connect'.
          </p>
        )}

         {!isConnected && sessionKey && sessionKey.length > 0 && (
            <Button onClick={checkPasswordStrength} variant="outline" className="w-full mt-2" disabled={isLoading || isGenerating}>
              {isLoading && !isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
              Check Key Strength / Get Suggestions
            </Button>
          )}
      </div>

      {showSuggestions && passwordSuggestions && passwordSuggestions.suggestions.length > 0 && !isConnected && (
        <Card className="mt-4 p-4 border rounded-md bg-card text-card-foreground">
          <h4 className="font-semibold mb-2 text-primary">Key Strength Suggestions:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {passwordSuggestions.suggestions.map((suggestion, index) => (
              <li key={index}>
                <code className="bg-background px-1 py-0.5 rounded text-sm">{suggestion}</code> - <span className="text-foreground/70">{passwordSuggestions.reasoning[index]}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
        <Button onClick={generateKey} variant="outline" className="w-full" disabled={isConnected || isLoading || isGenerating}>
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Generate Secure Key
        </Button>
        {isConnected ? (
          <Button onClick={handleDisconnect} variant="destructive" className="w-full" disabled={isLoading && !isGenerating /* Allow disconnect even if strength check is loading */}>
            {isLoading && !isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
            Disconnect
          </Button>
        ) : (
          <Button onClick={handleConnect} className="w-full" disabled={(isLoading && !isGenerating) || !sessionKey}>
            {isLoading && !isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
            Connect
          </Button>
        )}
      </div>

      <div className="text-center text-sm pt-2">
        Status: {isLoading && !isGenerating ? (
          <span className="text-yellow-500 font-semibold">Processing...</span>
        ) : isConnected ? (
          <span className="text-green-500 font-semibold">Connected (Mocked)</span>
        ) : (
          <span className="text-red-500 font-semibold">Disconnected</span>
        )}
      </div>
    </div>
  );
}
