"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, User, Bot } from 'lucide-react'; // Bot icon for mock peer

interface MessagingProps {
  sessionKey: string; // Used for mock E2EE
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'peer';
  timestamp: Date;
}

export function Messaging({ sessionKey }: MessagingProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);


  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  }, [messages]);


  // Simulate receiving messages
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (sessionKey) {
      intervalId = setInterval(() => {
        if (Math.random() < 0.4) { // Randomly simulate incoming message
          const mockReplies = ["Got it!", "Okay.", "Interesting...", "Thanks for sharing.", "Let me check."];
          const randomReply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
          const newMessage: Message = {
            id: `peer-${Date.now()}`,
            text: randomReply,
            sender: 'peer',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, newMessage]);
        }
      }, 7000 + Math.random() * 5000 ); // Peer replies every 7-12 seconds on average
      return () => clearInterval(intervalId);
    }
  }, [sessionKey]);

  const handleSendMessage = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!currentMessage.trim()) return;
    if (!sessionKey) {
      toast({ title: 'Error', description: 'Session key is missing. Cannot encrypt message.', variant: 'destructive' });
      return;
    }

    const newMessage: Message = {
      id: `user-${Date.now()}`,
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    // Mock: In a real app, send this message to the peer
    // toast({ title: 'Message Sent', description: 'Your message has been sent (mocked).' });
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
                    {formatTimestamp(msg.timestamp)}
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
        <form onSubmit={handleSendMessage} className="flex w-full space-x-2 items-center">
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
