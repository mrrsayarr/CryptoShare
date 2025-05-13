
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MessageSquare, Send, User, Bot } from 'lucide-react';
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
    <Card className="shadow-lg flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center text-xl"><MessageSquare className="mr-2 h-6 w-6 text-primary" /> Secure Messaging</CardTitle>
        <CardDescription>Chat securely with your connected peer.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden flex flex-col">
        <ScrollArea className="flex-grow pr-4" viewportRef={scrollAreaViewportRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end space-x-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'peer' && <Bot className="h-6 w-6 text-primary self-start flex-shrink-0" />}
                <div
                  className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <p className="text-sm break-words">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-right'}`}>
                    {formatTimestamp(new Date(msg.timestamp))}
                  </p>
                </div>
                 {msg.sender === 'user' && <User className="h-6 w-6 text-accent self-start flex-shrink-0" />}
              </div>
            ))}
             {messages.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No messages yet. Start the conversation!</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <form onSubmit={handleFormSubmit} className="flex w-full space-x-2 items-center">
          <Input
            type="text"
            placeholder="Type your message..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            className="flex-grow bg-background border-border focus:ring-primary"
          />
          <Button type="submit" size="icon" disabled={!currentMessage.trim()}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
