
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, ShieldCheck, Zap, Users, Network, Lock, FileText, Send, MessageCircle, ListChecks, KeyRound } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex justify-center py-8 px-4">
      <Card className="w-full max-w-4xl shadow-2xl rounded-xl border-border/70 overflow-hidden">
        <CardHeader className="bg-muted/30 p-6 sm:p-8 border-b border-border">
          <div className="flex flex-col items-center text-center space-y-3">
            <Lock className="h-16 w-16 text-primary" />
            <CardTitle className="text-3xl sm:text-4xl font-bold">About Cryptoshare</CardTitle>
            <CardDescription className="text-base sm:text-lg text-muted-foreground max-w-2xl">
              Securely transfer files, data, and messages directly between browsers using WebRTC and Supabase.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-10 text-left">
          
          {/* English Section */}
          <section id="about-en" className="space-y-6">
            <h2 className="flex items-center text-2xl sm:text-3xl font-semibold mb-4 text-primary border-b pb-3">
              <Info className="mr-3 h-7 w-7 flex-shrink-0" /> 
              <span>How to Use Cryptoshare (English)</span>
            </h2>
            <p className="text-lg text-foreground/90 leading-relaxed">
              Cryptoshare enables peer-to-peer (P2P) secure transfer of files, data snippets, and messages. It leverages WebRTC for direct browser-to-browser communication and Supabase for the initial signaling process (connection setup). All transfers are end-to-end encrypted via DTLS, inherent to WebRTC data channels.
            </p>

            <div className="space-y-4">
              <h3 className="flex items-center text-xl sm:text-2xl font-semibold text-foreground">
                <Zap className="mr-2 h-6 w-6 text-primary/80" />
                1. Establishing a Secure Connection
              </h3>
              <p className="text-muted-foreground text-base">
                The connection process uses Supabase to exchange connection details (Offer/Answer SDPs and ICE candidates).
              </p>
              <ul className="list-none space-y-3 pl-2">
                <li className="flex items-start">
                  <KeyRound className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Initiator (User A):</strong>
                    <ol className="list-decimal pl-6 mt-1 space-y-1 text-foreground/80">
                      <li>Opens Cryptoshare and clicks "Create New Session".</li>
                      <li>The app generates a unique "Session Key" and displays it.</li>
                      <li>The Initiator securely shares this Session Key with User B (e.g., via a trusted messaging app).</li>
                    </ol>
                  </div>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Guest (User B):</strong>
                    <ol className="list-decimal pl-6 mt-1 space-y-1 text-foreground/80">
                      <li>Opens Cryptoshare.</li>
                      <li>Enters the Session Key received from User A.</li>
                      <li>Clicks "Join Session".</li>
                    </ol>
                  </div>
                </li>
                 <li className="flex items-start">
                  <ShieldCheck className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Automatic Connection:</strong>
                    <p className="mt-1 text-foreground/80">
                      If the Session Key is correct, Supabase facilitates the background exchange of WebRTC connection info. Once "Securely Connected!" is shown, the P2P link is active.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center text-xl sm:text-2xl font-semibold text-foreground">
                <ListChecks className="mr-2 h-6 w-6 text-primary/80" />
                2. Using the Features (Once Connected)
              </h3>
              <ul className="list-none space-y-3 pl-2">
                <li className="flex items-start">
                  <FileText className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">File Transfer:</strong>
                    <p className="mt-1 text-foreground/80">Send/receive files (up to 500MB) with peer approval. Incoming files download automatically upon completion.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Send className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Data Snippet Transfer:</strong>
                    <p className="mt-1 text-foreground/80">Quickly send short text or JSON data directly to your peer.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Real-time Messaging:</strong>
                    <p className="mt-1 text-foreground/80">Chat securely with your connected peer.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center text-xl sm:text-2xl font-semibold text-foreground">
                <ShieldCheck className="mr-2 h-6 w-6 text-primary/80" />
                3. Security & Connectivity
              </h3>
              <p className="text-foreground/90 leading-relaxed">
                All data (files, snippets, messages) is end-to-end encrypted using DTLS (standard in WebRTC). Supabase is <strong className="font-medium">only</strong> for signaling to establish the P2P link; your actual data <strong className="font-medium">does not</strong> pass through Supabase servers during transfer. The security of the Session Key exchange is user-dependent.
              </p>
              <Alert variant="default" className="bg-muted/40 border-primary/30 shadow-sm">
                <Network className="h-5 w-5 text-primary" />
                <AlertTitle className="font-semibold text-primary">Connectivity Note (STUN/TURN Servers)</AlertTitle>
                <AlertDescription className="text-foreground/80">
                  Cryptoshare uses public STUN servers to help browsers discover each other. For some restrictive networks (complex NATs, firewalls), a TURN server might be required for reliable connections. Cryptoshare is configured to use TURN servers if provided in its setup, but does not provide a TURN service itself. Persistent "ICE failed" errors often indicate the need for a TURN server.
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-2">
              <h3 className="flex items-center text-xl sm:text-2xl font-semibold text-foreground">
                <Zap className="mr-2 h-6 w-6 text-red-500" />
                4. Disconnecting
              </h3>
              <p className="text-foreground/90 leading-relaxed">
                Either user can click "Disconnect Session". Refreshing the page or closing the browser tab also terminates the connection.
              </p>
            </div>
          </section>

          <hr className="my-10 border-border/70" />

          {/* Turkish Section */}
          <section id="about-tr" className="space-y-6">
            <h2 className="flex items-center text-2xl sm:text-3xl font-semibold mb-4 text-primary border-b pb-3">
              <Info className="mr-3 h-7 w-7 flex-shrink-0" /> 
              <span>Cryptoshare Nasıl Kullanılır? (Türkçe)</span>
            </h2>
            <p className="text-lg text-foreground/90 leading-relaxed">
              Cryptoshare, dosyaların, veri parçacıklarının ve mesajların güvenli bir şekilde eşler arası (P2P) aktarılmasına olanak tanır. Tarayıcılar arasında doğrudan iletişim için WebRTC'yi ve ilk bağlantı kurulumu (sinyalizasyon) süreci için Supabase'i kullanır. Tüm aktarımlar, WebRTC veri kanallarının doğal bir özelliği olan DTLS ile uçtan uca şifrelenir.
            </p>

            <div className="space-y-4">
              <h3 className="flex items-center text-xl sm:text-2xl font-semibold text-foreground">
                <Zap className="mr-2 h-6 w-6 text-primary/80" />
                1. Güvenli Bağlantı Kurma
              </h3>
              <p className="text-muted-foreground text-base">
                Bağlantı süreci, bağlantı ayrıntılarının (Teklif/Yanıt SDP'leri ve ICE adayları) değişimi için Supabase tarafından kolaylaştırılır.
              </p>
              <ul className="list-none space-y-3 pl-2">
                 <li className="flex items-start">
                  <KeyRound className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Başlatıcı (Kullanıcı A):</strong>
                    <ol className="list-decimal pl-6 mt-1 space-y-1 text-foreground/80">
                      <li>Cryptoshare'i açar ve "Yeni Oturum Başlat" düğmesine tıklar.</li>
                      <li>Uygulama benzersiz bir "Oturum Anahtarı" oluşturur ve ekranda gösterir.</li>
                      <li>Başlatıcı, bu Oturum Anahtarını Kullanıcı B ile güvenli bir şekilde paylaşır (örn. güvenilir bir mesajlaşma uygulamasıyla).</li>
                    </ol>
                  </div>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Misafir (Kullanıcı B):</strong>
                    <ol className="list-decimal pl-6 mt-1 space-y-1 text-foreground/80">
                      <li>Cryptoshare'i açar.</li>
                      <li>Kullanıcı A'dan aldığı Oturum Anahtarını girer.</li>
                      <li>"Oturuma Katıl" düğmesine tıklar.</li>
                    </ol>
                  </div>
                </li>
                <li className="flex items-start">
                  <ShieldCheck className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Otomatik Bağlantı:</strong>
                    <p className="mt-1 text-foreground/80">
                      Oturum Anahtarı doğruysa, Supabase arka planda WebRTC bağlantı bilgilerinin değişimini sağlar. "Güvenli Bir Şekilde Bağlandı!" mesajı göründüğünde P2P bağlantısı aktif hale gelir.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center text-xl sm:text-2xl font-semibold text-foreground">
                <ListChecks className="mr-2 h-6 w-6 text-primary/80" />
                2. Özellikleri Kullanma (Bağlantı Kurulduktan Sonra)
              </h3>
              <ul className="list-none space-y-3 pl-2">
                <li className="flex items-start">
                  <FileText className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Dosya Aktarımı:</strong>
                    <p className="mt-1 text-foreground/80">Eş onayıyla dosyaları (en fazla 500MB) gönderin/alın. Gelen dosyalar tamamlandığında otomatik olarak indirilir.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Send className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Veri Parçacığı Aktarımı:</strong>
                    <p className="mt-1 text-foreground/80">Kısa metin veya JSON verilerini hızla doğrudan eşinize gönderin.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <strong className="font-medium text-foreground">Gerçek Zamanlı Mesajlaşma:</strong>
                    <p className="mt-1 text-foreground/80">Bağlı olduğunuz eşinizle güvenli bir şekilde sohbet edin.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="flex items-center text-xl sm:text-2xl font-semibold text-foreground">
                <ShieldCheck className="mr-2 h-6 w-6 text-primary/80" />
                3. Güvenlik ve Bağlanabilirlik
              </h3>
              <p className="text-foreground/90 leading-relaxed">
                Tüm veriler (dosyalar, parçacıklar, mesajlar) WebRTC'nin standart bir parçası olan DTLS kullanılarak uçtan uca şifrelenir. Supabase <strong className="font-medium">yalnızca</strong> P2P bağlantısını kurmak için sinyalizasyon amacıyla kullanılır; gerçek verileriniz aktarım sırasında Supabase sunucularından <strong className="font-medium">geçmez</strong>. Oturum Anahtarı değişiminin güvenliği kullanıcıya bağlıdır.
              </p>
              <Alert variant="default" className="bg-muted/40 border-primary/30 shadow-sm">
                <Network className="h-5 w-5 text-primary" />
                <AlertTitle className="font-semibold text-primary">Bağlanabilirlik Notu (STUN/TURN Sunucuları)</AlertTitle>
                <AlertDescription className="text-foreground/80">
                  Cryptoshare, tarayıcıların birbirini bulmasına yardımcı olmak için genel STUN sunucularını kullanır. Bazı kısıtlayıcı ağ yapılandırmaları (karmaşık NAT'lar, güvenlik duvarları) için, güvenilir bağlantılar için bir TURN sunucusu gerekebilir. Cryptoshare, yapılandırmasında sağlanırsa TURN sunucularını kullanacak şekilde ayarlanmıştır, ancak kendisi bir TURN hizmeti sağlamaz. Kalıcı "ICE failed" hataları genellikle bir TURN sunucusuna ihtiyaç duyulduğunu gösterir.
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-2">
              <h3 className="flex items-center text-xl sm:text-2xl font-semibold text-foreground">
                <Zap className="mr-2 h-6 w-6 text-red-500" />
                4. Bağlantıyı Kesme
              </h3>
              <p className="text-foreground/90 leading-relaxed">
                Her iki kullanıcı da "Oturumu Kes" düğmesine tıklayabilir. Sayfayı yenilemek veya tarayıcı sekmesini kapatmak da bağlantıyı sonlandırır.
              </p>
            </div>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}

  