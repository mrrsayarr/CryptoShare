
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MessageSquare, Send, User, Smile } from 'lucide-react'; // Replaced Bot with Smile for a friendlier peer icon
import type { ChatMessage } from '@/types/cryptoshare';

interface MessagingProps {
  onSendMessage: (text: string) => void;
  messages: ChatMessage[];
}

export function Messaging({ onSendMessage, messages }: MessagingProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!currentMessage.trim()) return;
    onSendMessage(currentMessage);
    setCurrentMessage('');
  };
  
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="shadow-xl flex flex-col h-[600px] bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center text-xl font-semibold"><MessageSquare className="mr-2 h-6 w-6 text-primary" /> Secure Messaging</CardTitle>
        <CardDescription className="text-sm">Chat securely with your connected peer.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden flex flex-col p-4 md:p-6">
        <ScrollArea className="flex-grow pr-2" viewportRef={scrollAreaViewportRef}>
          <div className="space-y-4 py-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 group ${
                  msg.sender === 'user' ? 'justify-end flex-row-reverse space-x-reverse' : 'justify-start'
                }`}
              >
                {msg.sender === 'peer' && <Smile className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />}
                {msg.sender === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />}
                <div
                  className={`max-w-[75%] md:max-w-[70%] p-3 rounded-xl shadow-md break-words text-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-muted-foreground rounded-bl-sm' 
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1.5 ${msg.sender === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground/80'} text-right`}>
                    {formatTimestamp(new Date(msg.timestamp))}
                  </p>
                </div>
              </div>
            ))}
             {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                <MessageSquare className="w-16 h-16 mb-4 text-border" />
                <p className="text-lg font-medium">No messages yet.</p>
                <p className="text-sm">Start the conversation by typing a message below!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4 border-t border-border bg-background/70 sticky bottom-0">
        <form onSubmit={handleFormSubmit} className="flex w-full space-x-3 items-center">
          <Input
            type="text"
            placeholder="Type your message..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            className="flex-grow bg-input border-border focus:ring-primary focus:ring-2 text-base py-3 px-4 rounded-full h-12"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="rounded-full h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0" disabled={!currentMessage.trim()}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
