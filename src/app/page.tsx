"use client";

import React, { useState, useEffect } from 'react';
import { ConnectionManager } from '@/components/cryptoshare/ConnectionManager';
import { FileTransfer } from '@/components/cryptoshare/FileTransfer';
import { DataTransfer } from '@/components/cryptoshare/DataTransfer';
import { Messaging } from '@/components/cryptoshare/Messaging';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileUp, Send, MessageCircle } from 'lucide-react';

export default function CryptosharePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionKey, setSessionKey] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Avoid hydration mismatch for Tabs default value
  }, []);

  if (!mounted) {
    // Render nothing or a loading indicator on the server / during first client render
    return null; 
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="flex flex-row items-center space-x-3 pb-4">
          <Shield className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl font-bold">Secure Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectionManager
            isConnected={isConnected}
            setIsConnected={setIsConnected}
            sessionKey={sessionKey}
            setSessionKey={setSessionKey}
          />
        </CardContent>
      </Card>

      {isConnected && (
        <Tabs defaultValue="file-transfer" className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border shadow-sm">
            <TabsTrigger value="file-transfer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileUp className="mr-2 h-5 w-5" /> File Transfer
            </TabsTrigger>
            <TabsTrigger value="data-transfer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Send className="mr-2 h-5 w-5" /> Data Transfer
            </TabsTrigger>
            <TabsTrigger value="messaging" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageCircle className="mr-2 h-5 w-5" /> Messaging
            </TabsTrigger>
          </TabsList>
          <TabsContent value="file-transfer">
            <FileTransfer sessionKey={sessionKey} />
          </TabsContent>
          <TabsContent value="data-transfer">
            <DataTransfer sessionKey={sessionKey} />
          </TabsContent>
          <TabsContent value="messaging">
            <Messaging sessionKey={sessionKey} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
