
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SendHorizonal, History, ArrowUpCircle, ArrowDownCircle, ClipboardCopy, ClipboardCheck, Loader2 } from 'lucide-react';
import type { DataSnippet } from '@/types/cryptoshare';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataTransferProps {
  onSendData: (content: string) => void;
  dataSnippets: DataSnippet[];
}

export function DataTransfer({ onSendData, dataSnippets }: DataTransferProps) {
  const [dataToSend, setDataToSend] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendDataClick = () => {
    if (!dataToSend.trim()) {
      toast({ title: 'Empty Data', description: 'Cannot send empty data.', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    onSendData(dataToSend);
    // setDataToSend(''); // Keep data in textarea until successful send confirmed by parent state if desired, or clear immediately
    
    setTimeout(() => { 
        setIsSending(false);
        // Toast for sent data is now handled by the parent page (CryptosharePage) upon successful transmission
        // to avoid premature success messages if send fails at WebRTC level.
        // For immediate UI feedback that action was taken:
        setDataToSend(''); 
        toast({ title: 'Data Queued', description: 'Your data has been queued for sending.' });
    }, 300); 
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleCopyData = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedSnippetId(id);
      toast({ title: 'Copied to Clipboard!', description: 'Data snippet copied.' });
      setTimeout(() => setCopiedSnippetId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy data: ', err);
      toast({ title: 'Copy Failed', description: 'Could not copy data to clipboard.', variant: 'destructive' });
    });
  };

  return (
    <Card className="shadow-xl border-border/60 flex flex-col">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center text-xl font-semibold"><SendHorizonal className="mr-3 h-7 w-7 text-primary" /> Secure Data Transfer</CardTitle>
        <CardDescription className="text-sm text-muted-foreground pt-1">Send short, encrypted text or JSON data quickly to your peer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6 flex-grow">
        <div className="space-y-3">
          <Textarea
            placeholder="Enter text or JSON data here... (Max ~256KB)"
            value={dataToSend}
            onChange={(e) => setDataToSend(e.target.value)}
            rows={5}
            className="bg-background border-input focus:ring-primary focus:border-primary text-base p-3 rounded-md shadow-sm resize-none"
            disabled={isSending}
          />
          <Button onClick={handleSendDataClick} disabled={isSending || !dataToSend.trim()} className="w-full text-base py-3" size="lg">
            {isSending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <SendHorizonal className="mr-2 h-5 w-5" />}
            Send Data
          </Button>
        </div>

        {dataSnippets.length > 0 && (
          <div className="space-y-3 pt-4 flex flex-col flex-grow min-h-0">
            <h3 className="font-semibold text-lg flex items-center text-foreground border-b border-border pb-2 mb-3"><History className="mr-2 h-5 w-5 text-primary" /> Data Log <span className="text-xs text-muted-foreground ml-1">(Last 10)</span></h3>
            <ScrollArea className="flex-grow rounded-md border border-border bg-muted/20 p-1">
              <div className="space-y-4 p-3">
                {dataSnippets.map((data) => (
                  <div 
                    key={data.id} 
                    className={`flex flex-col w-full ${
                      data.type === 'sent' 
                        ? 'items-end' 
                        : 'items-start'
                    }`}
                  >
                    <div 
                      className={`relative group p-3 rounded-lg shadow-md text-sm break-words max-w-[85%] ${
                        data.type === 'sent' 
                          ? 'bg-primary/15 border-primary/30 rounded-br-none' 
                          : 'bg-secondary/30 border-secondary/50 rounded-bl-none'
                      }`}
                    >
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                              onClick={() => handleCopyData(data.content, data.id)}
                              aria-label="Copy data snippet"
                            >
                              {copiedSnippetId === data.id ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy to clipboard</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <pre className="whitespace-pre-wrap text-foreground py-1 font-sans">{data.content}</pre>
                      <div className={`flex items-center text-xs mt-1.5 ${data.type === 'sent' ? 'text-primary/90 justify-end' : 'text-secondary-foreground/80 justify-start'}`}>
                        {data.type === 'sent' ? 
                          <ArrowUpCircle className="inline h-3.5 w-3.5 mr-1.5 flex-shrink-0"/> : 
                          <ArrowDownCircle className="inline h-3.5 w-3.5 mr-1.5 flex-shrink-0"/>
                        }
                        {formatTimestamp(new Date(data.timestamp))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        {dataSnippets.length === 0 && (
           <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 h-full">
                <SendHorizonal className="w-12 h-12 sm:w-16 sm:w-16 mb-3 sm:mb-4 text-muted-foreground/60" />
                <p className="text-base sm:text-lg font-medium">No data snippets yet.</p>
                <p className="text-xs sm:text-sm">Send or receive data to see it logged here.</p>
            </div>
        )}
      </CardContent>
       <CardFooter className="border-t border-border/50 pt-4 mt-auto">
        <p className="text-xs text-muted-foreground text-center w-full">Data is end-to-end encrypted via WebRTC.</p>
      </CardFooter>
    </Card>
  );
}

