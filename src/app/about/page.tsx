
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
              Cryptoshare is a peer-to-peer (P2P) application designed for secure transfer of files, data, and messages. It uses WebRTC to establish a direct connection between users and Firebase Realtime Database for signaling (to help peers find each other). All transfers are end-to-end encrypted through the WebRTC data channel.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">1. Establishing a Secure Connection</h3>
            <p className="mb-1">
              To start sharing, you and your peer need to establish a secure P2P connection:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li><strong>Enter or Generate a Session Key</strong>: On the main page, one user can either type a custom session key or click "Generate Secure Key" to create a strong, random key.</li>
              <li><strong>Share the Key Securely</strong>: Share this exact session key with your peer through a secure out-of-band channel (e.g., a secure messaging app, verbally). Both users must use the IDENTICAL key.</li>
              <li><strong>Both Connect</strong>: Both users must enter the <em>same</em> session key into the "Session Key" field and click "Connect". The application will then use Firebase to help your browsers find each other and establish a direct WebRTC connection.</li>
              <li><strong>Check Key Strength (Optional)</strong>: If you're using a custom key, it's recommended to use the "Check Key Strength / Get Suggestions" button. This uses an AI model to analyze your key and suggest improvements.</li>
            </ul>
            <p>
              Once connected, you'll see the status change to &quot;Connected&quot; and tabs for File Transfer, Data Transfer, and Messaging will become available. The connection is directly between your and your peer&apos;s browser.
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

            <h3 className="text-xl font-semibold mt-4 mb-2">4. Security</h3>
            <p>
              All data transfers (files, data snippets, messages) within Cryptoshare are end-to-end encrypted using the inherent security of WebRTC (DTLS). The session key is used to uniquely identify your P2P session for signaling purposes via Firebase, allowing peers to find each other. Firebase itself does not see the content of your transferred data.
            </p>
            
            <h3 className="text-xl font-semibold mt-4 mb-2">5. Disconnecting</h3>
            <p>
              To end the session, either user can click the &quot;Disconnect&quot; button. This will close the P2P connection. Refreshing the page or closing the browser tab will also terminate the connection.
            </p>
          </section>

          <hr className="my-8 border-border" />

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">Cryptoshare Nasıl Kullanılır? (Türkçe)</h2>
            <p className="mb-2">
             Cryptoshare, dosyaların, verilerin ve mesajların güvenli bir şekilde aktarılması için tasarlanmış bir eşler arası (P2P) uygulamasıdır. Kullanıcılar arasında doğrudan bağlantı kurmak için WebRTC teknolojisini ve eşlerin birbirini bulmasına yardımcı olmak için Firebase Gerçek Zamanlı Veritabanı'nı sinyalizasyon amacıyla kullanır. Tüm aktarımlar WebRTC veri kanalı aracılığıyla uçtan uca şifrelenir.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">1. Güvenli Bağlantı Kurma</h3>
            <p className="mb-1">
              Paylaşıma başlamak için sizin ve eşinizin güvenli bir P2P bağlantısı kurması gerekir:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li><strong>Oturum Anahtarı Girin veya Oluşturun</strong>: Ana sayfada, bir kullanıcı özel bir oturum anahtarı yazabilir veya güçlü, rastgele bir anahtar oluşturmak için "Güvenli Anahtar Oluştur" düğmesine tıklayabilir.</li>
              <li><strong>Anahtarı Güvenli Bir Şekilde Paylaşın</strong>: Bu oturum anahtarını eşinizle güvenli bir bant dışı kanal aracılığıyla (örneğin, güvenli bir mesajlaşma uygulaması, sözlü olarak) paylaşın. Her iki kullanıcı da AYNI anahtarı kullanmalıdır.</li>
              <li><strong>Her İki Kullanıcı da Bağlanır</strong>: Her iki kullanıcı da <em>aynı</em> oturum anahtarını "Oturum Anahtarı" alanına girmeli ve "Bağlan" düğmesine tıklamalıdır. Uygulama daha sonra Firebase'i kullanarak tarayıcılarınızın birbirini bulmasına ve doğrudan bir WebRTC bağlantısı kurmasına yardımcı olacaktır.</li>
              <li><strong>Anahtar Gücünü Kontrol Edin (İsteğe Bağlı)</strong>: Özel bir anahtar kullanıyorsanız, "Anahtar Gücünü Kontrol Et / Öneri Al" düğmesini kullanmanız önerilir. Bu, anahtarınızı analiz etmek ve iyileştirmeler önermek için bir yapay zeka modeli kullanır.</li>
            </ul>
            <p>
             Bağlantı kurulduğunda, durumun &quot;Bağlandı&quot; olarak değiştiğini göreceksiniz ve Dosya Aktarımı, Veri Aktarımı ve Mesajlaşma sekmeleri kullanılabilir hale gelecektir. Bağlantı doğrudan sizin ve eşinizin tarayıcısı arasındadır.
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

            <h3 className="text-xl font-semibold mt-4 mb-2">4. Güvenlik</h3>
            <p>
             Cryptoshare içindeki tüm veri aktarımları (dosyalar, veri parçacıkları, mesajlar) WebRTC'nin doğal güvenliği (DTLS) kullanılarak uçtan uca şifrelenir. Oturum anahtarı, eşlerin birbirini bulmasını sağlayan Firebase aracılığıyla P2P oturumunuzu sinyalizasyon amacıyla benzersiz bir şekilde tanımlamak için kullanılır. Firebase'in kendisi aktarılan verilerinizin içeriğini görmez.
            </p>
            
            <h3 className="text-xl font-semibold mt-4 mb-2">5. Bağlantıyı Kesme</h3>
            <p>
              Oturumu sonlandırmak için, her iki kullanıcı da &quot;Bağlantıyı Kes&quot; düğmesine tıklayabilir. Bu, P2P bağlantısını kapatacaktır. Sayfayı yenilemek veya tarayıcı sekmesini kapatmak da bağlantıyı sonlandıracaktır.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
