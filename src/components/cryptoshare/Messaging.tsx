
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquareText, Send, User, MessageCircle, Bot } from 'lucide-react'; // Added Bot for peer
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
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="shadow-xl flex flex-col h-[600px] max-h-[70vh] bg-card border-border/70 rounded-lg overflow-hidden">
      <CardHeader className="border-b border-border/50 p-4">
        <CardTitle className="flex items-center text-lg sm:text-xl font-semibold">
          <MessageCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Secure Messaging
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground pt-1">Chat securely with your connected peer.</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full" viewportRef={scrollAreaViewportRef}>
          <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full items-end gap-2 sm:gap-3 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'peer' && (
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`flex flex-col max-w-[70%] sm:max-w-[65%] ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-2.5 sm:p-3 rounded-xl shadow-md break-words text-sm sm:text-base ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-secondary text-secondary-foreground rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
                 {msg.sender === 'user' && (
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                <MessageSquareText className="w-12 h-12 sm:w-16 sm:w-16 mb-3 sm:mb-4 text-muted-foreground/60" />
                <p className="text-base sm:text-lg font-medium">No messages yet.</p>
                <p className="text-xs sm:text-sm">Start the conversation by typing a message below!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-3 sm:p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm sticky bottom-0">
        <form onSubmit={handleFormSubmit} className="flex w-full space-x-2 sm:space-x-3 items-center">
          <Input
            type="text"
            placeholder="Type your message..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            className="flex-grow bg-input border-border/80 focus:ring-primary focus:ring-1 text-sm sm:text-base py-2.5 px-3.5 rounded-full h-10 sm:h-11"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 bg-primary hover:bg-primary/90" disabled={!currentMessage.trim()}>
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
