
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SendHorizonal, Inbox, Loader2, History, ChevronRight, ChevronLeft } from 'lucide-react';
import type { DataSnippet } from '@/types/cryptoshare';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    setDataToSend(''); 
    
    // Simulate network delay for UI feedback and then toast
    // Actual success/failure will be managed by the WebRTC hook's events
    setTimeout(() => { 
        setIsSending(false);
        toast({ title: 'Data Sent', description: 'Your data has been sent to the peer.' });
    }, 300); 
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Card className="shadow-xl border-border/60">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center text-xl font-semibold"><SendHorizonal className="mr-3 h-7 w-7 text-primary" /> Secure Data Transfer</CardTitle>
        <CardDescription className="text-sm text-muted-foreground pt-1">Send short, encrypted text or JSON data quickly to your peer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3">
          <Textarea
            placeholder="Enter text or JSON data here... (Max ~256KB)"
            value={dataToSend}
            onChange={(e) => setDataToSend(e.target.value)}
            rows={5}
            className="bg-background border-input focus:ring-primary focus:border-primary text-base p-3 rounded-md shadow-sm"
            disabled={isSending}
          />
          <Button onClick={handleSendDataClick} disabled={isSending || !dataToSend.trim()} className="w-full text-base py-3" size="lg">
            {isSending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <SendHorizonal className="mr-2 h-5 w-5" />}
            Send Data
          </Button>
        </div>

        {dataSnippets.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="font-semibold text-lg flex items-center text-foreground border-b border-border pb-2 mb-3"><History className="mr-2 h-5 w-5 text-primary" /> Data Log <span className="text-xs text-muted-foreground ml-1">(Last 10)</span></h3>
            <ScrollArea className="h-72 w-full rounded-md border border-border bg-muted/20 p-1">
              <div className="space-y-3 p-3">
                {dataSnippets.map((data) => (
                  <div 
                    key={data.id} 
                    className={`flex flex-col p-3 rounded-lg shadow-md text-sm break-words ${
                      data.type === 'sent' 
                        ? 'bg-primary/10 border-l-4 border-primary items-end ml-auto' 
                        : 'bg-secondary/70 border-r-4 border-secondary-foreground items-start mr-auto'
                    }`} 
                    style={{maxWidth: '85%'}}
                  >
                    <pre className="whitespace-pre-wrap text-foreground py-1">{data.content}</pre>
                    <p className={`text-xs mt-1.5 ${data.type === 'sent' ? 'text-primary/80' : 'text-muted-foreground'}`}>
                      {data.type === 'sent' ? <ChevronRight className="inline h-3 w-3 mr-1"/> : <ChevronLeft className="inline h-3 w-3 mr-1"/>}
                      {formatTimestamp(new Date(data.timestamp))}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
       <CardFooter className="border-t border-border/50 pt-4">
        <p className="text-xs text-muted-foreground text-center w-full">Data is end-to-end encrypted via WebRTC.</p>
      </CardFooter>
    </Card>
  );
}
