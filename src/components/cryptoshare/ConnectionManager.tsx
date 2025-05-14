
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Link2, ShieldAlert, ClipboardCopy, ClipboardCheck, Info, UserPlus, AlertTriangle, RotateCcw, VenetianMask } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PeerConnectionState } from '@/types/cryptoshare';

interface ConnectionManagerProps {
  currentConnectionState: PeerConnectionState;
  onStartInitiator: () => void;
  onProcessOfferAndCreateAnswer: (offerSdp: string) => void;
  onAcceptAnswer: (answerSdp: string) => void;
  onAddRemoteIceCandidate: (candidateJson: string) => void;
  onDisconnect: () => void;
  localSdpOffer: string | null;
  localSdpAnswer: string | null;
  localIceCandidates: RTCIceCandidateInit[];
}

type UIStep = 
  | 'select_role'
  | 'initiator_show_offer'          // Initiator: Offer is generated, show it. Wait for user to paste Answer.
  | 'initiator_paste_answer'        // Initiator: Offer shown, waiting for Answer SDP input.
  | 'guest_paste_offer'             // Guest: Waiting for Offer SDP input.
  | 'guest_show_answer'             // Guest: Answer is generated, show it. Wait for Initiator to process.
  | 'exchange_ice'                  // Both: SDPs exchanged, now exchanging ICE candidates.
  | 'connected_display'
  | 'failed_display';

export function ConnectionManager({
  currentConnectionState,
  onStartInitiator,
  onProcessOfferAndCreateAnswer,
  onAcceptAnswer,
  onAddRemoteIceCandidate,
  onDisconnect,
  localSdpOffer,
  localSdpAnswer,
  localIceCandidates,
}: ConnectionManagerProps) {
  const [uiStep, setUiStep] = useState<UIStep>('select_role');
  const [role, setRole] = useState<'initiator' | 'guest' | null>(null);
  
  const [sdpInput, setSdpInput] = useState(''); 
  const [iceInput, setIceInput] = useState('');
  
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    console.log("ConnectionManager: currentConnectionState prop changed to", currentConnectionState, "current UIStep:", uiStep);
    switch (currentConnectionState) {
      case 'disconnected':
        setRole(null);
        setUiStep('select_role');
        setSdpInput('');
        setIceInput('');
        break;
      case 'offer_generated':
        if (role === 'initiator') {
          setUiStep('initiator_show_offer');
        }
        break;
      case 'answer_generated':
        if (role === 'guest') {
          setUiStep('guest_show_answer');
        }
        break;
      case 'connecting':
        // If SDPs are exchanged and we are 'connecting', it's time for ICE
        if (uiStep === 'initiator_paste_answer' || uiStep === 'guest_show_answer' || uiStep === 'initiator_show_offer') {
             if(localSdpOffer || localSdpAnswer) setUiStep('exchange_ice');
        } else if (uiStep === 'select_role' && (localSdpAnswer || localSdpOffer)) {
            // This can happen if ConnectionManager re-mounts or state is weirdly reset
            // but useWebRTC hook still has an offer/answer. Try to recover UI state.
            console.warn("ConnectionManager: Recovering UI to exchange_ice due to existing SDP while in select_role");
            setUiStep('exchange_ice');
        }
        break;
      case 'connected':
        setUiStep('connected_display');
        break;
      case 'failed':
        setUiStep('failed_display');
        break;
    }
  }, [currentConnectionState, role, localSdpAnswer, localSdpOffer, uiStep]); // Added uiStep to allow recovery logic

  const localIceCandidatesDisplay = localIceCandidates.map(c => JSON.stringify(c)).join('\n');

  const handleCopy = (text: string | null, id: string) => {
    if (!text || !text.trim()) {
        toast({ title: "Nothing to Copy", description: `No ${id} data available.`, variant: "default" });
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      toast({ title: "Copied!", description: `${id} copied to clipboard.` });
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
    }).catch(err => {
      toast({ title: "Error", description: `Failed to copy ${id}.`, variant: "destructive" });
    });
  };

  const handleStartInitiatorClick = () => {
    setRole('initiator');
    onStartInitiator(); 
    // UI step will be updated by useEffect when currentConnectionState becomes 'offer_generated'
  };

  const handleStartGuestClick = () => {
    setRole('guest');
    setUiStep('guest_paste_offer');
  };
  
  const handleGuestSubmitsOffer = () => {
    if (!sdpInput.trim()) {
        toast({ title: "Error", description: "Offer SDP cannot be empty.", variant: "destructive" });
        return;
    }
    onProcessOfferAndCreateAnswer(sdpInput);
    setSdpInput(''); // Clear input
    // UI step will be updated by useEffect when currentConnectionState becomes 'answer_generated'
  };

  const handleInitiatorSubmitsAnswer = () => {
    if (!sdpInput.trim()) {
        toast({ title: "Error", description: "Answer SDP cannot be empty.", variant: "destructive" });
        return;
    }
    onAcceptAnswer(sdpInput); // This will trigger 'connecting' state in useWebRTC
    setSdpInput(''); // Clear input
    setUiStep('exchange_ice'); // Move to ICE exchange UI
  };

  const handleAddRemoteIceClick = () => {
    if (!iceInput.trim()) {
        toast({ title: "Info", description: "No ICE candidate data to add.", variant: "default" });
        return;
    }
    const candidates = iceInput.trim().split('\n');
    let candidatesAdded = 0;
    candidates.forEach(candidateJson => {
        if (candidateJson.trim()) {
            try {
                JSON.parse(candidateJson.trim()); // Validate JSON
                onAddRemoteIceCandidate(candidateJson.trim());
                candidatesAdded++;
            } catch (e) {
                 toast({ title: "Invalid ICE Candidate", description: "Skipping invalid JSON ICE candidate.", variant: "destructive"});
                 console.error("Error parsing ICE candidate JSON:", e, candidateJson);
            }
        }
    });
    if (candidatesAdded > 0) {
        toast({ title: "ICE Candidates Submitted", description: `Processing ${candidatesAdded} remote ICE candidate(s).`});
    } else if (iceInput.trim()){ // if input was not empty but no valid candidates found
        toast({ title: "Info", description: "No valid ICE candidate data found to add.", variant: "default" });
    }
    setIceInput(''); 
  };
  
  const handleResetClick = () => {
    onDisconnect(); 
    // useEffect will set uiStep to 'select_role' and clear role when currentConnectionState becomes 'disconnected'
  };

  const isLoading = currentConnectionState === 'connecting';
  const isProcessingSdp = uiStep === 'initiator_show_offer' && !localSdpOffer ||
                          uiStep === 'guest_show_answer' && !localSdpAnswer;


  const renderSelectRole = () => (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground">P2P bağlantısı başlatmak için rolünüzü seçin.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleStartInitiatorClick} className="w-full" disabled={isLoading}>
          <Zap className="mr-2 h-4 w-4" /> Yeni Oturum Başlat (Başlatıcı)
        </Button>
        <Button onClick={handleStartGuestClick} variant="outline" className="w-full" disabled={isLoading}>
         <UserPlus className="mr-2 h-4 w-4" /> Mevcut Oturuma Katıl (Misafir)
        </Button>
      </div>
      <Alert variant="default" className="text-left">
        <Info className="h-4 w-4" />
        <AlertTitle>Nasıl Çalışır (Manuel Sinyalleşme)</AlertTitle>
        <AlertDescription>
          Bir kullanıcı (Başlatıcı) bir "Teklif (Offer)" oluşturur. Diğeri (Misafir) bu Teklifi yapıştırır ve bir "Yanıt (Answer)" oluşturur.
          Bunları değiş tokuş ederler, ardından birbirlerini bulmak için "ICE Adaylarını (ICE Candidates)" değiş tokuş ederler. Tüm veriler manuel olarak kopyalanıp yapıştırılmalıdır.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderInitiatorShowOffer = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Başlatıcı Adım 1: Teklifinizi Paylaşın</h3>
      {isProcessingSdp && <p className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Teklif oluşturuluyor...</p>}
      {localSdpOffer && (
        <Card>
          <CardHeader><CardTitle>Teklif SDP'niz</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="initiator-offer-sdp">Bu teklifi kopyalayın ve Misafir'e gönderin:</Label>
            <Textarea id="initiator-offer-sdp" value={localSdpOffer} readOnly rows={6} className="bg-muted/50"/>
            <Button onClick={() => handleCopy(localSdpOffer, 'Offer SDP')} variant="outline" size="sm" className="w-full">
              {copiedStates['Offer SDP'] ? <ClipboardCheck className="mr-2"/> : <ClipboardCopy className="mr-2"/>} Teklifi Kopyala
            </Button>
            <Button onClick={() => setUiStep('initiator_paste_answer')} className="w-full mt-2">
                Misafirin Yanıtını Yapıştırmaya Devam Et
            </Button>
          </CardContent>
        </Card>
      )}
       <Button onClick={handleResetClick} variant="outline" className="w-full"><RotateCcw className="mr-2 h-4 w-4" />Sıfırla</Button>
    </div>
  );

  const renderInitiatorPasteAnswer = () => (
     <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Başlatıcı Adım 2: Misafirin Yanıtını Yapıştırın</h3>
        <Card>
            <CardHeader><CardTitle>Misafirin Yanıt SDP'si</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <Label htmlFor="guest-answer-sdp-input">Misafirden aldığınız Yanıt SDP'sini buraya yapıştırın:</Label>
                <Textarea 
                    id="guest-answer-sdp-input" 
                    value={sdpInput} 
                    onChange={e => setSdpInput(e.target.value)} 
                    rows={6} 
                    placeholder="Yanıt SDP'sini buraya yapıştırın..." 
                    disabled={isLoading}
                />
                <Button onClick={handleInitiatorSubmitsAnswer} disabled={isLoading || !sdpInput.trim()} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                Yanıtı İşle ve ICE'ye Başla
                </Button>
            </CardContent>
        </Card>
        <Button onClick={handleResetClick} variant="outline" className="w-full"><RotateCcw className="mr-2 h-4 w-4" />Sıfırla</Button>
     </div>
  );

  const renderGuestPasteOffer = () => (
     <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Misafir Adım 1: Başlatıcının Teklifini Yapıştırın</h3>
        <Card>
          <CardHeader><CardTitle>Başlatıcının Teklif SDP'si</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="initiator-offer-sdp-input-guest">Başlatıcıdan aldığınız Teklif SDP'sini buraya yapıştırın:</Label>
            <Textarea 
                id="initiator-offer-sdp-input-guest" 
                value={sdpInput} 
                onChange={e => setSdpInput(e.target.value)} 
                rows={6} 
                placeholder="Teklif SDP'sini buraya yapıştırın..." 
                disabled={isLoading}
            />
            <Button onClick={handleGuestSubmitsOffer} disabled={isLoading || !sdpInput.trim()} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Teklifi İşle ve Yanıt Oluştur
            </Button>
          </CardContent>
        </Card>
        <Button onClick={handleResetClick} variant="outline" className="w-full"><RotateCcw className="mr-2 h-4 w-4" />Sıfırla</Button>
    </div>
  );

  const renderGuestShowAnswer = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">Misafir Adım 2: Yanıtınızı Paylaşın</h3>
      {isProcessingSdp && <p className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Yanıt oluşturuluyor...</p>}
      {localSdpAnswer && (
         <Card>
          <CardHeader><CardTitle>Yanıt SDP'niz</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="guest-answer-sdp-output">Bu yanıtı kopyalayın ve Başlatıcı'ya gönderin:</Label>
            <Textarea id="guest-answer-sdp-output" value={localSdpAnswer} readOnly rows={6} className="bg-muted/50" />
             <Button onClick={() => handleCopy(localSdpAnswer, 'Answer SDP')} variant="outline" size="sm" className="w-full">
              {copiedStates['Answer SDP'] ? <ClipboardCheck className="mr-2"/> : <ClipboardCopy className="mr-2"/>} Yanıtı Kopyala
            </Button>
            <p className="text-sm text-muted-foreground pt-2">Başlatıcı yanıtınızı işledikten sonra ICE adayı değişimi başlayacaktır.</p>
            {/* Guest doesn't click a button here, they wait for ICE from Initiator after Initiator processes this answer */}
          </CardContent>
        </Card>
      )}
      <Button onClick={handleResetClick} variant="outline" className="w-full"><RotateCcw className="mr-2 h-4 w-4" />Sıfırla</Button>
    </div>
  );

 const renderIceExchange = () => (
    <Card>
        <CardHeader>
            <CardTitle>Adım 3: ICE Adaylarını Değiş Tokuş Edin</CardTitle>
            <CardDescription>Kendi adaylarınızı kopyalayıp eşinize gönderin. Eşinizin adaylarını aşağıdaki alana yapıştırın. Bu işlem biraz zaman alabilir ve birden fazla değişim gerekebilir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Label htmlFor="local-ice-candidates">ICE Adaylarınız (yeni adaylar görünebilir, tüm satırları kopyalayın):</Label>
                <Textarea id="local-ice-candidates" value={localIceCandidatesDisplay || "ICE adayları burada görünecek..."} readOnly rows={5} className="bg-muted/50 text-xs"/>
                <Button onClick={() => handleCopy(localIceCandidatesDisplay, 'Local ICE')} variant="outline" size="sm" className="w-full mt-1" disabled={!localIceCandidatesDisplay.trim()}>
                    {copiedStates['Local ICE'] ? <ClipboardCheck className="mr-2"/> : <ClipboardCopy className="mr-2"/>} Adaylarımı Kopyala
                </Button>
            </div>
            <div>
                <Label htmlFor="remote-ice-candidates">Eşin ICE Adayları (buraya yapıştırın, her JSON nesnesi yeni bir satırda):</Label>
                <Textarea 
                    id="remote-ice-candidates" 
                    value={iceInput} 
                    onChange={e => setIceInput(e.target.value)} 
                    rows={5} 
                    placeholder="Eşin ICE adaylarını buraya yapıştırın..."
                    disabled={isLoading}
                />
                <Button onClick={handleAddRemoteIceClick} disabled={isLoading} className="w-full mt-1">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>} Eşin Adaylarını Ekle
                </Button>
            </div>
             <Button onClick={handleResetClick} variant="outline" className="w-full mt-4"><RotateCcw className="mr-2 h-4 w-4" />Sıfırla</Button>
        </CardContent>
    </Card>
 );
  
  const renderConnectedDisplay = () => (
    <div className="space-y-4 text-center">
        <ShieldAlert className="h-12 w-12 text-green-500 mx-auto"/>
        <p className="text-xl font-semibold text-green-500">Bağlandı!</p>
        <p className="text-muted-foreground">Artık Dosya Aktarımı, Veri Aktarımı ve Mesajlaşma sekmelerini kullanabilirsiniz.</p>
        <Button onClick={handleResetClick} variant="destructive" className="w-full">
            <Link2 className="mr-2 h-4 w-4" /> Bağlantıyı Kes
        </Button>
    </div>
  );

  const renderFailedDisplay = () => (
     <div className="space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto"/>
        <p className="text-xl font-semibold text-red-500">Bağlantı Başarısız Oldu</p>
        <p className="text-muted-foreground">Bir şeyler ters gitti. Lütfen verilerin doğru kopyalandığından emin olun ve tekrar deneyin. Gerekirse bir TURN sunucusu yapılandırmanız gerekebilir.</p>
        <Button onClick={handleResetClick} variant="outline" className="w-full">
           <RotateCcw className="mr-2 h-4 w-4" /> Sıfırla ve Tekrar Dene
        </Button>
    </div>
  );
  
  let statusText = currentConnectionState.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
   if (uiStep === 'initiator_show_offer' && !localSdpOffer) statusText = "Teklif Oluşturuluyor...";
   if (uiStep === 'guest_show_answer' && !localSdpAnswer) statusText = "Yanıt Oluşturuluyor...";
   if (currentConnectionState === 'connecting' && (uiStep === 'initiator_show_offer' || uiStep === 'guest_paste_offer')) statusText = "SDP İşleniyor...";


  const statusColor = currentConnectionState === 'connected' ? 'text-green-500' :
                      currentConnectionState === 'failed' ? 'text-red-500' :
                      isLoading || isProcessingSdp ? 'text-yellow-500' :
                      'text-foreground/80';

  return (
    <div className="space-y-6">
      {uiStep === 'select_role' && renderSelectRole()}
      {uiStep === 'initiator_show_offer' && renderInitiatorShowOffer()}
      {uiStep === 'initiator_paste_answer' && renderInitiatorPasteAnswer()}
      {uiStep === 'guest_paste_offer' && renderGuestPasteOffer()}
      {uiStep === 'guest_show_answer' && renderGuestShowAnswer()}
      {uiStep === 'exchange_ice' && renderIceExchange()}
      
      {uiStep === 'connected_display' && renderConnectedDisplay()}
      {uiStep === 'failed_display' && renderFailedDisplay()}
      
       <div className="text-center text-sm pt-2 text-muted-foreground">
        Durum: <span className={`font-semibold ${statusColor}`}>{statusText}</span>
        {role && <span className="ml-2">({role === 'initiator' ? 'Başlatıcı' : 'Misafir'})</span>}
      </div>
    </div>
  );
}
