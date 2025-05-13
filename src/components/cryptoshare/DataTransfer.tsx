"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SendHorizonal, Inbox, Loader2 } from 'lucide-react';

interface DataTransferProps {
  sessionKey: string; // Used for mock E2EE
}

interface MockData {
  id: string;
  content: string;
  timestamp: Date;
  type: 'sent' | 'received';
}

export function DataTransfer({ sessionKey }: DataTransferProps) {
  const [dataToSend, setDataToSend] = useState('');
  const [receivedData, setReceivedData] = useState<MockData[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Simulate receiving data
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (sessionKey) {
      intervalId = setInterval(() => {
        if (Math.random() < 0.2) { // Randomly simulate incoming data
          const mockIncomingData: MockData = {
            id: `received-${Date.now()}`,
            content: `Mock received data: ${JSON.stringify({ value: Math.random().toString(36).substring(7) })} at ${new Date().toLocaleTimeString()}`,
            timestamp: new Date(),
            type: 'received',
          };
          setReceivedData(prev => [mockIncomingData, ...prev].slice(0, 10)); // Keep last 10
          toast({
            title: 'New Data Received',
            description: 'Encrypted data snippet received.',
          });
        }
      }, 5000 + Math.random() * 3000); // Check for new data every 5-8 seconds
      return () => clearInterval(intervalId);
    }
  }, [sessionKey, toast]);

  const handleSendData = () => {
    if (!dataToSend.trim()) {
      toast({ title: 'Empty Data', description: 'Cannot send empty data.', variant: 'destructive' });
      return;
    }
    if (!sessionKey) {
      toast({ title: 'Error', description: 'Session key is missing. Cannot encrypt data.', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    // Mock sending data
    setTimeout(() => {
      const sentData: MockData = {
        id: `sent-${Date.now()}`,
        content: dataToSend,
        timestamp: new Date(),
        type: 'sent'
      };
      setReceivedData(prev => [sentData, ...prev].slice(0,10)); // Add to display, mimicking echo or sent items
      setDataToSend('');
      setIsSending(false);
      toast({ title: 'Data Sent', description: 'Your encrypted data has been sent (mocked).' });
    }, 1000);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl"><SendHorizonal className="mr-2 h-6 w-6 text-primary" /> Secure Data Transfer</CardTitle>
        <CardDescription>Send short, encrypted text or JSON data quickly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Textarea
            placeholder="Enter text or JSON data here..."
            value={dataToSend}
            onChange={(e) => setDataToSend(e.target.value)}
            rows={4}
            className="bg-background border-border focus:ring-primary"
            disabled={isSending}
          />
        </div>
        <Button onClick={handleSendData} disabled={isSending || !dataToSend.trim()} className="w-full">
          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizonal className="mr-2 h-4 w-4" />}
          Send Data
        </Button>

        {receivedData.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center text-foreground"><Inbox className="mr-2 h-5 w-5 text-primary" /> Data Log (Last 10)</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 rounded-md border p-3 bg-muted/30">
              {receivedData.map((data) => (
                <div key={data.id} className={`p-3 rounded-md shadow-sm ${data.type === 'sent' ? 'bg-primary/10 ml-auto' : 'bg-secondary text-secondary-foreground'}`} style={{maxWidth: '90%'}}>
                  <pre className="whitespace-pre-wrap break-all text-sm">{data.content}</pre>
                  <p className={`text-xs mt-1 ${data.type === 'sent' ? 'text-primary/70 text-right' : 'text-muted-foreground text-right'}`}>
                    {data.type === 'sent' ? 'You sent at ' : 'Received at '} {formatTimestamp(data.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
       <CardFooter>
        <p className="text-xs text-muted-foreground">Data is end-to-end encrypted (mocked using session key).</p>
      </CardFooter>
    </Card>
  );
}
