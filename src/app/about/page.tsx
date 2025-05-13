
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

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
              Cryptoshare is a peer-to-peer (P2P) application designed for secure transfer of files, data, and messages. <strong>Important: This application currently simulates (mocks) P2P functionality.</strong> This means that while it demonstrates the user interface and flow of a P2P application, it does not establish a real network connection between different browsers or computers. All interactions are self-contained within your current browser session. All transfers are mock end-to-end encrypted using a shared session key.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">1. Establishing a Secure Connection (Simulated)</h3>
            <p className="mb-1">
              To start sharing, you and your peer would typically establish a secure connection. In this simulation:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li><strong>Enter or Generate a Session Key</strong>: On the main page, one user can either type a custom session key or click "Generate Secure Key" to create a strong, random key.</li>
              <li><strong>Share the Key Securely (Simulated)</strong>: In a real P2P app, you would share this key securely. For this simulation, if you open Cryptoshare in another tab or browser on the <em>same computer</em>, you&apos;d need to manually use the same key.</li>
              <li><strong>Both Connect (Simulated)</strong>: Both users (or browser instances) must enter the <em>same</em> session key into the "Session Key" field and click "Connect".</li>
              <li><strong>Check Key Strength</strong>: If you&apos;re using a custom key, it&apos;s recommended to use the "Check Key Strength / Get Suggestions" button. This uses an AI model to analyze your key and suggest improvements if it&apos;s weak. For generated keys, this step is less critical as they are designed to be strong.</li>
            </ul>
            <p>
              Once connected, you&apos;ll see the status change to &quot;Connected (Mocked)&quot; and tabs for File Transfer, Data Transfer, and Messaging will become available. <strong>Remember, this connection is simulated and does not link across different devices or separate browser instances in a way that allows real-time data exchange between them.</strong>
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">2. Using the Features (Simulated)</h3>
            <p className="mb-1">
              The following features simulate P2P interactions:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-2">
              <li>
                <strong>File Transfer</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li><strong>Sending</strong>: Click &quot;Choose File&quot;, select the file you want to send (up to 500MB), and click &quot;Send File&quot;. You&apos;ll see the progress in the &quot;Transfer Activity&quot; list. (This is a simulation within your browser).</li>
                  <li><strong>Receiving</strong>: When your peer sends you a file (simulated as an event within the app), it will appear in your &quot;Transfer Activity&quot; list with &quot;Approve&quot; and &quot;Reject&quot; buttons. Click &quot;Approve&quot; to simulate downloading the file.</li>
                </ul>
              </li>
              <li>
                <strong>Data Transfer</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Enter any short text or JSON data into the textarea.</li>
                  <li>Click &quot;Send Data&quot;. The data will appear in the &quot;Data Log&quot; (simulated send).</li>
                  <li>Incoming data from your peer (simulated) will also appear in the log.</li>
                </ul>
              </li>
              <li>
                <strong>Messaging</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Type your message in the input field at the bottom of the chat window.</li>
                  <li>Press Enter or click the send button. Your message appears in the chat.</li>
                  <li>Messages from your peer (simulated replies) will appear in the chat log.</li>
                </ul>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">3. Password Strength Analyzer</h3>
            <p className="mb-1">
              Navigate to the &quot;Password Tool&quot; page using the link in the navbar.
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li>Enter any password you&apos;d like to analyze into the input field.</li>
              <li>Click &quot;Get Suggestions&quot;.</li>
              <li>The AI will provide suggestions for stronger alternatives and explain why they are more secure. If your password is already strong, it will let you know.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">4. Security (Simulated)</h3>
            <p>
              All data transfers (files, data snippets, messages) within Cryptoshare are <em>mock</em> end-to-end encrypted using the shared session key. This means that, in a real implementation, only you and your connected peer would be able to decrypt and view the shared information. The &quot;mocked&quot; aspect means this application simulates the behavior but doesn&apos;t implement actual cryptographic operations or real network connections for this demonstration. <strong>Therefore, data sent in one browser will not be received in another, even if they use the same session key.</strong>
            </p>
            <p className="mt-2">
              <strong>For True P2P:</strong> A real-world P2P application like Cryptoshare would require technologies such as WebRTC for direct browser-to-browser connections and a signaling server to help peers find each other and negotiate connections. These components are not implemented in this simulation.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">5. Disconnecting (Simulated)</h3>
            <p>
              To end the session, either user can click the &quot;Disconnect&quot; button in the Connection Manager section. This will reset the simulated connection state within that browser instance.
            </p>
          </section>

          <hr className="my-8 border-border" />

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">Cryptoshare Nasıl Kullanılır? (Türkçe)</h2>
            <p className="mb-2">
              Cryptoshare, dosyaların, verilerin ve mesajların güvenli bir şekilde aktarılması için tasarlanmış bir eşler arası (P2P) uygulamasıdır. <strong>Önemli: Bu uygulama şu anda P2P işlevselliğini simüle etmektedir (sahtedir/mocked).</strong> Bu, bir P2P uygulamasının kullanıcı arayüzünü ve akışını gösterirken, farklı tarayıcılar veya bilgisayarlar arasında gerçek bir ağ bağlantısı kurmadığı anlamına gelir. Tüm etkileşimler mevcut tarayıcı oturumunuzla sınırlıdır. Tüm aktarımlar, paylaşılan bir oturum anahtarı kullanılarak sahte uçtan uca şifrelenir.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">1. Güvenli Bağlantı Kurma (Simüle Edilmiş)</h3>
            <p className="mb-1">
              Paylaşıma başlamak için sizin ve eşinizin normalde güvenli bir bağlantı kurması gerekir. Bu simülasyonda:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li><strong>Oturum Anahtarı Girin veya Oluşturun</strong>: Ana sayfada, bir kullanıcı özel bir oturum anahtarı yazabilir veya güçlü, rastgele bir anahtar oluşturmak için &quot;Güvenli Anahtar Oluştur&quot; düğmesine tıklayabilir.</li>
              <li><strong>Anahtarı Güvenli Bir Şekilde Paylaşın (Simüle Edilmiş)</strong>: Gerçek bir P2P uygulamasında bu anahtarı güvenli bir şekilde paylaşırdınız. Bu simülasyon için, Cryptoshare'i *aynı bilgisayarda* başka bir sekmede veya tarayıcıda açarsanız, aynı anahtarı manuel olarak kullanmanız gerekir.</li>
              <li><strong>Her İki Kullanıcı da Bağlanır (Simüle Edilmiş)</strong>: Her iki kullanıcı (veya tarayıcı örneği) de <em>aynı</em> oturum anahtarını &quot;Oturum Anahtarı&quot; alanına girmeli ve &quot;Bağlan&quot; düğmesine tıklamalıdır.</li>
              <li><strong>Anahtar Gücünü Kontrol Edin</strong>: Özel bir anahtar kullanıyorsanız, &quot;Anahtar Gücünü Kontrol Et / Öneri Al&quot; düğmesini kullanmanız önerilir. Bu, anahtarınızı analiz etmek ve zayıfsa iyileştirmeler önermek için bir yapay zeka modeli kullanır. Oluşturulan anahtarlar için bu adım daha az kritiktir çünkü güçlü olacak şekilde tasarlanmışlardır.</li>
            </ul>
            <p>
              Bağlantı kurulduğunda, durumun &quot;Bağlandı (Sahte)&quot; olarak değiştiğini göreceksiniz ve Dosya Aktarımı, Veri Aktarımı ve Mesajlaşma sekmeleri kullanılabilir hale gelecektir. <strong>Unutmayın, bu bağlantı simüle edilmiştir ve farklı cihazlar veya ayrı tarayıcı örnekleri arasında aralarında gerçek zamanlı veri alışverişine izin verecek şekilde bağlantı kurmaz.</strong>
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">2. Özellikleri Kullanma (Simüle Edilmiş)</h3>
            <p className="mb-1">
              Aşağıdaki özellikler P2P etkileşimlerini simüle eder:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-2">
              <li>
                <strong>Dosya Aktarımı</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li><strong>Gönderme</strong>: &quot;Dosya Seç&quot;e tıklayın, göndermek istediğiniz dosyayı seçin (en fazla 500MB) ve &quot;Dosya Gönder&quot;e tıklayın. İlerlemeyi &quot;Aktarım Etkinliği&quot; listesinde göreceksiniz. (Bu, tarayıcınız içinde bir simülasyondur).</li>
                  <li><strong>Alma</strong>: Eşiniz size bir dosya gönderdiğinde (uygulama içinde bir olay olarak simüle edilir), &quot;Aktarım Etkinliği&quot; listenizde &quot;Onayla&quot; ve &quot;Reddet&quot; düğmeleriyle görünecektir. Dosyayı indirmeyi simüle etmek için &quot;Onayla&quot;ya tıklayın.</li>
                </ul>
              </li>
              <li>
                <strong>Veri Aktarımı</strong>:
                 <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Metin alanına kısa metin veya JSON verisi girin.</li>
                  <li>&quot;Veri Gönder&quot;e tıklayın. Veri, &quot;Veri Günlüğü&quot;nde görünecektir (simüle edilmiş gönderme).</li>
                  <li>Eşinizden gelen veriler (simüle edilmiş) de günlükte görünecektir.</li>
                </ul>
              </li>
              <li>
                <strong>Mesajlaşma</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Mesajınızı sohbet penceresinin altındaki giriş alanına yazın.</li>
                  <li>Enter tuşuna basın veya gönder düğmesine tıklayın. Mesajınız sohbette görünür.</li>
                  <li>Eşinizden gelen mesajlar (simüle edilmiş yanıtlar) sohbet günlüğünde görünecektir.</li>
                </ul>
              </li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-4 mb-2">3. Şifre Gücü Analizcisi</h3>
            <p className="mb-1">
              Gezinme çubuğundaki bağlantıyı kullanarak &quot;Şifre Aracı&quot; sayfasına gidin.
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li>Analiz etmek istediğiniz herhangi bir şifreyi giriş alanına girin.</li>
              <li>&quot;Öneri Al&quot;a tıklayın.</li>
              <li>Yapay zeka, daha güçlü alternatifler için öneriler sunacak ve neden daha güvenli olduklarını açıklayacaktır. Şifreniz zaten güçlüyse, size bildirecektir.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">4. Güvenlik (Simüle Edilmiş)</h3>
            <p>
              Cryptoshare içindeki tüm veri aktarımları (dosyalar, veri parçacıkları, mesajlar) paylaşılan oturum anahtarı kullanılarak <em>sahte</em> uçtan uca şifrelenir. Bu, gerçek bir uygulamada, paylaşılan bilgileri yalnızca sizin ve bağlı eşinizin şifresini çözüp görüntüleyebileceği anlamına gelir. &quot;Sahte&quot; (mocked) özelliği, bu uygulamanın davranışı simüle ettiği ancak bu gösteri için gerçek kriptografik işlemler veya gerçek ağ bağlantıları uygulamadığı anlamına gelir. <strong>Bu nedenle, bir tarayıcıda gönderilen veriler, aynı oturum anahtarını kullansalar bile başka bir tarayıcıda alınmayacaktır.</strong>
            </p>
             <p className="mt-2">
              <strong>Gerçek P2P İçin:</strong> Cryptoshare gibi gerçek dünya bir P2P uygulaması, doğrudan tarayıcıdan tarayıcıya bağlantılar için WebRTC gibi teknolojilere ve eşlerin birbirini bulmasına ve bağlantıları müzakere etmesine yardımcı olmak için bir sinyal sunucusuna ihtiyaç duyar. Bu bileşenler bu simülasyonda uygulanmamıştır.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">5. Bağlantıyı Kesme (Simüle Edilmiş)</h3>
            <p>
              Oturumu sonlandırmak için, her iki kullanıcı da Bağlantı Yöneticisi bölümündeki &quot;Bağlantıyı Kes&quot; düğmesine tıklayabilir. Bu, o tarayıcı örneğindeki simüle edilmiş bağlantı durumunu sıfırlayacaktır.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
