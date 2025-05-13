
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SendHorizonal, Inbox, Loader2 } from 'lucide-react';
import type { DataSnippet } from '@/types/cryptoshare';

interface DataTransferProps {
  onSendData: (content: string) => void;
  dataSnippets: DataSnippet[];
}

export function DataTransfer({ onSendData, dataSnippets }: DataTransferProps) {
  const [dataToSend, setDataToSend] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendDataClick = () => {
    if (!dataToSend.trim()) {
      toast({ title: 'Empty Data', description: 'Cannot send empty data.', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    onSendData(dataToSend);
    setDataToSend(''); // Clear input after initiating send
    // Toast for sent data can be handled by parent if needed or by onmessage confirmation
    setTimeout(() => { // Simulate network delay for UI feedback
        setIsSending(false);
        // Assuming send was successful, or parent would show error
        toast({ title: 'Data Sent', description: 'Your data has been sent.' });
    }, 500); 
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
        <Button onClick={handleSendDataClick} disabled={isSending || !dataToSend.trim()} className="w-full">
          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizonal className="mr-2 h-4 w-4" />}
          Send Data
        </Button>

        {dataSnippets.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center text-foreground"><Inbox className="mr-2 h-5 w-5 text-primary" /> Data Log (Last 10)</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 rounded-md border p-3 bg-muted/30">
              {dataSnippets.map((data) => (
                <div key={data.id} className={`p-3 rounded-md shadow-sm ${data.type === 'sent' ? 'bg-primary/10 ml-auto' : 'bg-secondary text-secondary-foreground'}`} style={{maxWidth: '90%'}}>
                  <pre className="whitespace-pre-wrap break-all text-sm">{data.content}</pre>
                  <p className={`text-xs mt-1 ${data.type === 'sent' ? 'text-primary/70 text-right' : 'text-muted-foreground text-right'}`}>
                    {data.type === 'sent' ? 'You sent at ' : 'Received at '} {formatTimestamp(new Date(data.timestamp))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
       <CardFooter>
        <p className="text-xs text-muted-foreground">Data is end-to-end encrypted via WebRTC.</p>
      </CardFooter>
    </Card>
  );
}
