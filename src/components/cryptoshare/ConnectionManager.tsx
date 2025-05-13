
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Link2, Zap, ShieldAlert, Copy, Check } from 'lucide-react';
import { suggestStrongerPasswords } from '@/app/password-strength/actions';
import type { SuggestStrongerPasswordsOutput } from '@/app/password-strength/actions';

interface ConnectionManagerProps {
  isConnected: boolean;
  onConnect: (sessionKey: string) => void;
  onDisconnect: () => void;
  initialSessionKey: string;
}

export function ConnectionManager({
  isConnected,
  onConnect,
  onDisconnect,
  initialSessionKey,
}: ConnectionManagerProps) {
  const [currentSessionKey, setCurrentSessionKey] = useState(initialSessionKey);
  const [isLoading, setIsLoading] = useState(false); // General loading for connect/disconnect/strength check
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [passwordSuggestions, setPasswordSuggestions] = useState<SuggestStrongerPasswordsOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // If parent changes initialSessionKey (e.g. on full disconnect and reset from parent)
    setCurrentSessionKey(initialSessionKey);
  }, [initialSessionKey]);

  const handleConnectClick = () => {
    if (!currentSessionKey) {
      toast({
        title: 'Error',
        description: 'Session key cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    onConnect(currentSessionKey);
    // setIsLoading(false) will be handled by parent via isConnected prop changing connectionState
  };

  const handleDisconnectClick = () => {
    setIsLoading(true);
    onDisconnect();
     // setIsLoading(false) will be handled by parent via isConnected prop changing connectionState
  };

  const generateKey = () => {
    setIsGeneratingKey(true);
    // Key generation logic, should be cryptographically strong in a real app
    setTimeout(() => { // Simulating async generation
      const newKey = Array(32).fill(null).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      setCurrentSessionKey(newKey);
      setIsGeneratingKey(false);
      setShowSuggestions(false);
      setPasswordSuggestions(null);
      toast({
        title: 'Key Generated',
        description: 'A new session key has been generated.',
      });
    }, 300);
  };

  const checkPasswordStrength = useCallback(async () => {
    if (!currentSessionKey || currentSessionKey.length < 6) { // GenAI might need some length
      toast({ title: "Weak Key", description: "Key is too short to analyze. Minimum 6 characters.", variant: "destructive"});
      setPasswordSuggestions(null);
      setShowSuggestions(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await suggestStrongerPasswords({ password: currentSessionKey });
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
  }, [currentSessionKey, toast]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(currentSessionKey).then(() => {
      setCopied(true);
      toast({ title: "Copied!", description: "Session key copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      toast({ title: "Error", description: "Failed to copy key.", variant: "destructive" });
    });
  };
  
  // Effect to turn off general loading when isConnected changes (driven by parent)
  useEffect(() => {
    setIsLoading(false);
  }, [isConnected]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="session-key" className="text-foreground/80">Session Key</Label>
        <div className="flex space-x-2">
          <Input
            id="session-key"
            type="text"
            placeholder="Enter or generate a session key"
            value={currentSessionKey}
            onChange={(e) => {
              setCurrentSessionKey(e.target.value);
              setShowSuggestions(false);
              setPasswordSuggestions(null);
            }}
            disabled={isConnected || isLoading || isGeneratingKey}
            className="bg-background border-border focus:ring-primary"
          />
          {currentSessionKey && !isConnected && (
             <Button variant="ghost" size="icon" onClick={handleCopyKey} title="Copy key" disabled={isLoading || isGeneratingKey}>
              {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {!isConnected && (
          <p className="text-xs text-muted-foreground pt-1">
            To connect: 1. One user generates/enters a key. 2. Share key securely. 3. Both enter same key & click 'Connect'.
          </p>
        )}

         {!isConnected && currentSessionKey && currentSessionKey.length > 0 && (
            <Button onClick={checkPasswordStrength} variant="outline" className="w-full mt-2" disabled={isLoading || isGeneratingKey}>
              {isLoading && !isGeneratingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
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
        <Button onClick={generateKey} variant="outline" className="w-full" disabled={isConnected || isLoading || isGeneratingKey}>
          {isGeneratingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Generate Secure Key
        </Button>
        {isConnected ? (
          <Button onClick={handleDisconnectClick} variant="destructive" className="w-full" disabled={isLoading && !isGeneratingKey}>
            {isLoading && !isGeneratingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
            Disconnect
          </Button>
        ) : (
          <Button onClick={handleConnectClick} className="w-full" disabled={isLoading || isGeneratingKey || !currentSessionKey}>
            {isLoading && !isGeneratingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
            Connect
          </Button>
        )}
      </div>

      <div className="text-center text-sm pt-2">
        Status: {isLoading && !isGeneratingKey ? (
          <span className="text-yellow-500 font-semibold">Processing...</span>
        ) : isConnected ? (
          <span className="text-green-500 font-semibold">Connected</span>
        ) : (
          <span className="text-red-500 font-semibold">Disconnected</span>
        )}
      </div>
    </div>
  );
}
