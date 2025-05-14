
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, UserPlus, Link2, ShieldAlert, ClipboardCopy, ClipboardCheck, RotateCcw, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PeerConnectionState } from '@/types/cryptoshare';

interface ConnectionManagerProps {
  currentConnectionState: PeerConnectionState;
  sessionKey: string | null;
  onCreateSession: () => void;
  onJoinSession: (sessionKey: string) => void;
  onDisconnect: () => void;
}

export function ConnectionManager({
  currentConnectionState,
  sessionKey,
  onCreateSession,
  onJoinSession,
  onDisconnect,
}: ConnectionManagerProps) {
  const [inputSessionKey, setInputSessionKey] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyKey = () => {
    if (sessionKey) {
      navigator.clipboard.writeText(sessionKey).then(() => {
        setCopied(true);
        toast({ title: "Copied!", description: "Session Key copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        toast({ title: "Error", description: "Failed to copy Session Key.", variant: "destructive" });
      });
    }
  };

  const handleJoinClick = () => {
    if (!inputSessionKey.trim()) {
      toast({ title: "Error", description: "Please enter a Session Key.", variant: "destructive" });
      return;
    }
    onJoinSession(inputSessionKey.trim());
  };
  
  const isLoading = ['creating_session', 'joining_session', 'connecting'].includes(currentConnectionState);

  const renderInitialActions = () => (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground">Start a new session or join an existing one using a Session Key.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={onCreateSession} className="w-full" disabled={isLoading}>
          {currentConnectionState === 'creating_session' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          Yeni Oturum Başlat
        </Button>
        <Card className="w-full p-4 space-y-2 text-left">
            <Label htmlFor="session-key-input">Mevcut Oturuma Katıl</Label>
            <Input 
                id="session-key-input"
                placeholder="Oturum Anahtarını Girin"
                value={inputSessionKey}
                onChange={(e) => setInputSessionKey(e.target.value)}
                disabled={isLoading}
            />
            <Button onClick={handleJoinClick} variant="outline" className="w-full" disabled={isLoading || !inputSessionKey.trim()}>
                {currentConnectionState === 'joining_session' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Katıl
            </Button>
        </Card>
      </div>
       <Alert variant="default" className="text-left">
        <Info className="h-4 w-4" />
        <AlertTitle>Nasıl Çalışır?</AlertTitle>
        <AlertDescription>
          Bir kullanıcı yeni bir oturum başlatır ve bir "Oturum Anahtarı" alır. Bu anahtarı diğer kullanıcıyla paylaşır.
          Diğer kullanıcı bu anahtarı girerek oturuma katılır. Bağlantı arka planda otomatik olarak kurulur.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderWaitingForPeer = () => (
    <div className="space-y-4 text-center">
      <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin"/>
      <p className="text-xl font-semibold text-primary">Misafir Bekleniyor...</p>
      <p className="text-muted-foreground">Oturum Anahtarınız aşağıdadır. Lütfen bunu misafirle paylaşın:</p>
      <div className="p-3 bg-muted rounded-md font-mono text-lg break-all flex items-center justify-between">
        <span>{sessionKey}</span>
        <Button onClick={handleCopyKey} variant="ghost" size="sm">
            {copied ? <ClipboardCheck className="h-5 w-5 text-green-500" /> : <ClipboardCopy className="h-5 w-5" />}
        </Button>
      </div>
      <Button onClick={onDisconnect} variant="outline" className="w-full mt-4"><RotateCcw className="mr-2 h-4 w-4" />İptal Et</Button>
    </div>
  );

  const renderConnecting = () => (
     <div className="space-y-4 text-center">
        <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin"/>
        <p className="text-xl font-semibold text-primary">Bağlanılıyor...</p>
        <p className="text-muted-foreground">Eşle güvenli bağlantı kuruluyor. Lütfen bekleyin.</p>
         <Button onClick={onDisconnect} variant="outline" className="w-full mt-4"><RotateCcw className="mr-2 h-4 w-4" />İptal Et</Button>
    </div>
  );
  
  const renderConnectedDisplay = () => (
    <div className="space-y-4 text-center">
        <ShieldAlert className="h-12 w-12 text-green-500 mx-auto"/>
        <p className="text-xl font-semibold text-green-500">Bağlandı!</p>
        <p className="text-muted-foreground">Artık Dosya Aktarımı, Veri Aktarımı ve Mesajlaşma sekmelerini kullanabilirsiniz.</p>
        <Button onClick={onDisconnect} variant="destructive" className="w-full">
            <Link2 className="mr-2 h-4 w-4" /> Bağlantıyı Kes
        </Button>
    </div>
  );

  const renderFailedDisplay = () => (
     <div className="space-y-4 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto"/> {/* Corrected icon for failed */}
        <p className="text-xl font-semibold text-red-500">Bağlantı Başarısız Oldu</p>
        <p className="text-muted-foreground">Bir şeyler ters gitti. Lütfen anahtarın doğru olduğundan emin olun ve tekrar deneyin. Gerekirse bir TURN sunucusu yapılandırmanız gerekebilir.</p>
        <Button onClick={onDisconnect} variant="outline" className="w-full">
           <RotateCcw className="mr-2 h-4 w-4" /> Sıfırla ve Tekrar Dene
        </Button>
    </div>
  );
  
  let statusText = currentConnectionState.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const statusColor = currentConnectionState === 'connected' ? 'text-green-500' :
                      currentConnectionState === 'failed' ? 'text-red-500' :
                      isLoading ? 'text-yellow-500' :
                      'text-foreground/80';

  return (
    <div className="space-y-6">
      {currentConnectionState === 'disconnected' && renderInitialActions()}
      {currentConnectionState === 'creating_session' && renderConnecting()} {/* Show connecting for creating_session too */}
      {currentConnectionState === 'waiting_for_peer' && renderWaitingForPeer()}
      {currentConnectionState === 'joining_session' && renderConnecting()}
      {currentConnectionState === 'connecting' && renderConnecting()}
      {currentConnectionState === 'connected' && renderConnectedDisplay()}
      {currentConnectionState === 'failed' && renderFailedDisplay()}
      
       <div className="text-center text-sm pt-2 text-muted-foreground">
        Durum: <span className={`font-semibold ${statusColor}`}>{statusText}</span>
        {sessionKey && (currentConnectionState === 'waiting_for_peer' || currentConnectionState === 'connected') && 
         <span className="ml-2 text-xs">(Oturum: {sessionKey})</span>}
      </div>
    </div>
  );
}
