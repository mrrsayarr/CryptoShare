
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertTriangle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Info className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">About Cryptoshare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-left">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">How to Use Cryptoshare (English)</h2>
            <p className="mb-2">
              Cryptoshare is a peer-to-peer (P2P) application designed for secure transfer of files, data, and messages. It uses WebRTC to establish a direct connection between users. Connection details (Offers, Answers, ICE Candidates) are exchanged manually by users copying and pasting text between their browsers. All transfers are end-to-end encrypted through the WebRTC data channel.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">1. Establishing a Secure Connection (Manual Signaling)</h3>
            <p className="mb-1">
              To start sharing, you and your peer need to establish a secure P2P connection by manually exchanging connection information:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li><strong>Choose Roles</strong>: One user must choose "Initiate New Session" and the other "Join Existing Session" on the main page.</li>
              <li><strong>Initiator - Step 1: Generate & Share Offer</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                    <li>The Initiator clicks "Initiate New Session".</li>
                    <li>The application will generate an "Offer SDP". This text block will appear in a textarea.</li>
                    <li>The Initiator must copy this entire Offer SDP text and securely send it to the Guest (e.g., via a secure messaging app, email).</li>
                </ul>
              </li>
              <li><strong>Guest - Step 1: Paste Offer & Generate Answer</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                    <li>The Guest clicks "Join Existing Session".</li>
                    <li>The Guest pastes the Initiator's Offer SDP into the designated textarea and clicks "Process Offer & Generate Answer".</li>
                    <li>The application will generate an "Answer SDP". This text block will appear.</li>
                    <li>The Guest must copy this entire Answer SDP text and securely send it back to the Initiator.</li>
                </ul>
              </li>
              <li><strong>Initiator - Step 2: Paste Answer</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                    <li>The Initiator pastes the Guest's Answer SDP into the designated textarea and clicks "Process Answer & Start ICE".</li>
                </ul>
              </li>
              <li><strong>Both Users - Step 3: Exchange ICE Candidates</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                    <li>After processing the Answer (for Initiator) or generating the Answer (for Guest), both users' applications will start generating "ICE Candidates". These are small pieces of text information that help browsers find each other over the internet.</li>
                    <li>ICE candidates may appear incrementally in a textarea labeled "Your ICE Candidates".</li>
                    <li>Each user must copy ALL lines of their ICE candidates and send them to the other user.</li>
                    <li>Each user must paste the ICE candidates received from their peer into the textarea labeled "Peer's ICE Candidates" and click "Add Peer's Candidates". This step might need to be repeated if new candidates are generated.</li>
                </ul>
              </li>
               <li><strong>Connection</strong>: If all information is exchanged correctly, the connection status will change to "Connected". This may take a few moments.</li>
            </ul>
            <p>
              Once connected, you'll see the status change to &quot;Connected&quot; and tabs for File Transfer, Data Transfer, and Messaging will become available. The connection is directly between your and your peer&apos;s browser.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
                <strong>Note on Key Strength Tool:</strong> The "Check Key Strength / Get Suggestions" button on the connection card is for a separate "Password Tool" (accessible via navbar) and is not directly part of this manual WebRTC connection process. The "Generate Secure Key" button is also a remnant of a previous connection method and is not used in the current manual flow.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">2. Using the Features</h3>
            <p className="mb-1">
              Once connected, you can use the following P2P features:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-2">
              <li>
                <strong>File Transfer</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li><strong>Sending</strong>: Click &quot;Choose File&quot;, select the file (up to 500MB), and click &quot;Send File&quot;. Your peer will receive a request to approve the transfer. Once they approve, the file will be sent directly.</li>
                  <li><strong>Receiving</strong>: When your peer initiates a file transfer, it will appear in your &quot;Transfer Activity&quot; list with &quot;Approve&quot; and &quot;Reject&quot; buttons. Click &quot;Approve&quot; to start receiving the file directly from your peer. The file will be automatically downloaded once completed.</li>
                </ul>
              </li>
              <li>
                <strong>Data Transfer</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Enter any short text or JSON data into the textarea.</li>
                  <li>Click &quot;Send Data&quot;. The data will be sent directly to your peer and appear in their &quot;Data Log&quot;. Your sent data will also appear in your log.</li>
                </ul>
              </li>
              <li>
                <strong>Messaging</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Type your message in the input field at the bottom of the chat window.</li>
                  <li>Press Enter or click the send button. Your message is sent directly to your peer and appears in their chat window and yours.</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">3. Password Strength Analyzer</h3>
            <p className="mb-1">
              Navigate to the &quot;Password Tool&quot; page using the link in the navbar. This tool is independent of the P2P connection.
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li>Enter any password you&apos;d like to analyze into the input field.</li>
              <li>Click &quot;Get Suggestions&quot;.</li>
              <li>The AI will provide suggestions for stronger alternatives and explain why they are more secure.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">4. Security & Connectivity</h3>
            <p>
              All data transfers (files, data snippets, messages) within Cryptoshare are end-to-end encrypted using the inherent security of WebRTC (DTLS). The manual exchange of SDP and ICE candidates is for connection setup; the actual data does not pass through any central server. The security of the initial SDP/ICE exchange depends on how users share this information.
            </p>
             <div className="mt-3 p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            <strong>Connectivity Note (STUN/TURN Servers):</strong><br />
                            WebRTC uses STUN servers (like the one Cryptoshare is configured with) to help discover your public IP address and facilitate direct P2P connections. However, sometimes, due to restrictive network configurations (like complex NATs or firewalls), STUN alone might not be enough.
                            In such cases, a TURN server is required to relay the traffic. If you experience persistent connection failures (e.g., "ICE failed" or status stuck on "Connecting"), it might be due to your network environment.
                            Cryptoshare is prepared to use TURN servers if they are configured, but it does not provide one. For reliable connections across all network types, using a publicly available or self-hosted TURN server might be necessary.
                        </p>
                    </div>
                </div>
            </div>
            
            <h3 className="text-xl font-semibold mt-4 mb-2">5. Disconnecting</h3>
            <p>
              To end the session, either user can click the &quot;Disconnect&quot; or "Reset Connection Process" button. This will close the P2P connection. Refreshing the page or closing the browser tab will also terminate the connection.
            </p>
          </section>

          <hr className="my-8 border-border" />

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">Cryptoshare Nasıl Kullanılır? (Türkçe)</h2>
            <p className="mb-2">
             Cryptoshare, dosyaların, verilerin ve mesajların güvenli bir şekilde aktarılması için tasarlanmış bir eşler arası (P2P) uygulamasıdır. Kullanıcılar arasında doğrudan bağlantı kurmak için WebRTC teknolojisini kullanır. Bağlantı detayları (Teklifler, Yanıtlar, ICE Adayları) kullanıcılar tarafından tarayıcıları arasında metin kopyalayıp yapıştırılarak manuel olarak değiş tokuş edilir. Tüm aktarımlar WebRTC veri kanalı aracılığıyla uçtan uca şifrelenir.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">1. Güvenli Bağlantı Kurma (Manuel Sinyalleşme)</h3>
            <p className="mb-1">
              Paylaşıma başlamak için sizin ve eşinizin bağlantı bilgilerini manuel olarak değiş tokuş ederek güvenli bir P2P bağlantısı kurması gerekir:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li><strong>Rolleri Seçin</strong>: Bir kullanıcı ana sayfada "Yeni Oturum Başlat"ı, diğeri ise "Mevcut Oturuma Katıl"ı seçmelidir.</li>
              <li><strong>Başlatıcı - Adım 1: Teklif Oluştur ve Paylaş</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                    <li>Başlatıcı, "Yeni Oturum Başlat" düğmesine tıklar.</li>
                    <li>Uygulama bir "Teklif SDP'si" oluşturacaktır. Bu metin bloğu bir metin alanında görünecektir.</li>
                    <li>Başlatıcı, bu Teklif SDP metninin tamamını kopyalamalı ve güvenli bir şekilde Misafir'e göndermelidir (örneğin, güvenli bir mesajlaşma uygulaması, e-posta yoluyla).</li>
                </ul>
              </li>
              <li><strong>Misafir - Adım 1: Teklifi Yapıştır ve Yanıt Oluştur</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                    <li>Misafir, "Mevcut Oturuma Katıl" düğmesine tıklar.</li>
                    <li>Misafir, Başlatıcı'nın Teklif SDP'sini ilgili metin alanına yapıştırır ve "Teklifi İşle ve Yanıt Oluştur" düğmesine tıklar.</li>
                    <li>Uygulama bir "Yanıt SDP'si" oluşturacaktır. Bu metin bloğu görünecektir.</li>
                    <li>Misafir, bu Yanıt SDP metninin tamamını kopyalamalı ve güvenli bir şekilde Başlatıcı'ya geri göndermelidir.</li>
                </ul>
              </li>
              <li><strong>Başlatıcı - Adım 2: Yanıtı Yapıştır</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                    <li>Başlatıcı, Misafir'in Yanıt SDP'sini ilgili metin alanına yapıştırır ve "Yanıtı İşle ve ICE'yi Başlat" düğmesine tıklar.</li>
                </ul>
              </li>
              <li><strong>Her İki Kullanıcı - Adım 3: ICE Adaylarını Değiş Tokuş Et</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                    <li>Yanıtı işledikten sonra (Başlatıcı için) veya Yanıtı oluşturduktan sonra (Misafir için), her iki kullanıcının uygulaması da "ICE Adayları" üretmeye başlayacaktır. Bunlar, tarayıcıların internet üzerinden birbirlerini bulmalarına yardımcı olan küçük metin bilgi parçalarıdır.</li>
                    <li>ICE adayları, "ICE Adaylarınız" etiketli bir metin alanında artımlı olarak görünebilir.</li>
                    <li>Her kullanıcı, TÜM ICE adaylarını kopyalamalı ve diğer kullanıcıya göndermelidir.</li>
                    <li>Her kullanıcı, eşinden aldığı ICE adaylarını "Eşin ICE Adayları" etiketli metin alanına yapıştırmalı ve "Eşin Adaylarını Ekle" düğmesine tıklamalıdır. Yeni adaylar üretilirse bu adımın tekrarlanması gerekebilir.</li>
                </ul>
              </li>
               <li><strong>Bağlantı</strong>: Tüm bilgiler doğru bir şekilde değiş tokuş edilirse, bağlantı durumu "Bağlandı" olarak değişecektir. Bu birkaç dakika sürebilir.</li>
            </ul>
            <p>
             Bağlantı kurulduğunda, durumun &quot;Bağlandı&quot; olarak değiştiğini göreceksiniz ve Dosya Aktarımı, Veri Aktarımı ve Mesajlaşma sekmeleri kullanılabilir hale gelecektir. Bağlantı doğrudan sizin ve eşinizin tarayıcısı arasındadır.
            </p>
             <p className="mt-2 text-sm text-muted-foreground">
                <strong>Not:</strong> Bağlantı kartındaki "Anahtar Gücünü Kontrol Et / Öneri Al" düğmesi, gezinme çubuğundan erişilebilen ayrı bir "Şifre Aracı" içindir ve bu manuel WebRTC bağlantı sürecinin doğrudan bir parçası değildir. "Güvenli Anahtar Oluştur" düğmesi de önceki bir bağlantı yönteminden kalmadır ve mevcut manuel akışta kullanılmaz.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">2. Özellikleri Kullanma</h3>
            <p className="mb-1">
              Bağlantı kurulduktan sonra aşağıdaki P2P özelliklerini kullanabilirsiniz:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-2">
              <li>
                <strong>Dosya Aktarımı</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li><strong>Gönderme</strong>: &quot;Dosya Seç&quot;e tıklayın, dosyayı seçin (en fazla 500MB) ve &quot;Dosya Gönder&quot;e tıklayın. Eşiniz aktarımı onaylamak için bir istek alacaktır. Onayladıktan sonra dosya doğrudan gönderilecektir.</li>
                  <li><strong>Alma</strong>: Eşiniz bir dosya aktarımı başlattığında, &quot;Aktarım Etkinliği&quot; listenizde &quot;Onayla&quot; ve &quot;Reddet&quot; düğmeleriyle görünecektir. Dosyayı doğrudan eşinizden almaya başlamak için &quot;Onayla&quot;ya tıklayın. Dosya tamamlandığında otomatik olarak indirilecektir.</li>
                </ul>
              </li>
              <li>
                <strong>Veri Aktarımı</strong>:
                 <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Metin alanına kısa metin veya JSON verisi girin.</li>
                  <li>&quot;Veri Gönder&quot;e tıklayın. Veri doğrudan eşinize gönderilecek ve onların &quot;Veri Günlüğü&quot;nde görünecektir. Gönderdiğiniz veri sizin günlüğünüzde de görünecektir.</li>
                </ul>
              </li>
              <li>
                <strong>Mesajlaşma</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Mesajınızı sohbet penceresinin altındaki giriş alanına yazın.</li>
                  <li>Enter tuşuna basın veya gönder düğmesine tıklayın. Mesajınız doğrudan eşinize gönderilir ve onların ve sizin sohbet pencerenizde görünür.</li>
                </ul>
              </li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-4 mb-2">3. Şifre Gücü Analizcisi</h3>
            <p className="mb-1">
              Gezinme çubuğundaki bağlantıyı kullanarak &quot;Şifre Aracı&quot; sayfasına gidin. Bu araç P2P bağlantısından bağımsızdır.
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li>Analiz etmek istediğiniz herhangi bir şifreyi giriş alanına girin.</li>
              <li>&quot;Öneri Al&quot;a tıklayın.</li>
              <li>Yapay zeka, daha güçlü alternatifler için öneriler sunacak ve neden daha güvenli olduklarını açıklayacaktır.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">4. Güvenlik ve Bağlanabilirlik</h3>
            <p>
             Cryptoshare içindeki tüm veri aktarımları (dosyalar, veri parçacıkları, mesajlar) WebRTC'nin doğal güvenliği (DTLS) kullanılarak uçtan uca şifrelenir. SDP ve ICE adaylarının manuel olarak değiş tokuşu bağlantı kurulumu içindir; gerçek veriler herhangi bir merkezi sunucudan geçmez. İlk SDP/ICE değişiminin güvenliği, kullanıcıların bu bilgiyi nasıl paylaştığına bağlıdır.
            </p>
            <div className="mt-3 p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            <strong>Bağlanabilirlik Notu (STUN/TURN Sunucuları):</strong><br />
                            WebRTC, genel IP adresinizi keşfetmeye ve doğrudan P2P bağlantılarını kolaylaştırmaya yardımcı olmak için STUN sunucularını (Cryptoshare'in yapılandırıldığı gibi) kullanır. Ancak bazen, kısıtlayıcı ağ yapılandırmaları (karmaşık NAT'lar veya güvenlik duvarları gibi) nedeniyle STUN tek başına yeterli olmayabilir.
                            Bu gibi durumlarda, trafiği yönlendirmek için bir TURN sunucusu gerekir. Kalıcı bağlantı hataları (örneğin, "ICE failed" veya durumun "Bağlanıyor"da takılı kalması) yaşıyorsanız, bu durum ağ ortamınızdan kaynaklanıyor olabilir.
                            Cryptoshare, yapılandırılmışlarsa TURN sunucularını kullanmaya hazırdır, ancak kendisi bir tane sağlamaz. Tüm ağ türlerinde güvenilir bağlantılar için, halka açık veya kendi barındırdığınız bir TURN sunucusunu kullanmak gerekebilir.
                        </p>
                    </div>
                </div>
            </div>
            
            <h3 className="text-xl font-semibold mt-4 mb-2">5. Bağlantıyı Kesme</h3>
            <p>
              Oturumu sonlandırmak için, her iki kullanıcı da &quot;Bağlantıyı Kes&quot; veya "Bağlantı Sürecini Sıfırla" düğmesine tıklayabilir. Bu, P2P bağlantısını kapatacaktır. Sayfayı yenilemek veya tarayıcı sekmesini kapatmak da bağlantıyı sonlandıracaktır.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

    