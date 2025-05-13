
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
              Cryptoshare is a peer-to-peer (P2P) application designed for secure transfer of files, data, and messages directly between two users. All transfers are mock end-to-end encrypted using a shared session key.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">1. Establishing a Secure Connection</h3>
            <p className="mb-1">
              To start sharing, you and your peer need to establish a secure connection:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li><strong>Enter or Generate a Session Key</strong>: On the main page, one user can either type a custom session key or click "Generate Secure Key" to create a strong, random key.</li>
              <li><strong>Share the Key Securely</strong>: This is crucial. Share the <em>exact</em> session key with your peer through a secure, out-of-band channel (e.g., a trusted messaging app, verbally).</li>
              <li><strong>Both Connect</strong>: Both users must enter the <em>same</em> session key into the "Session Key" field and click "Connect".</li>
              <li><strong>Check Key Strength</strong>: If you&apos;re using a custom key, it&apos;s recommended to use the "Check Key Strength / Get Suggestions" button. This uses an AI model to analyze your key and suggest improvements if it&apos;s weak. For generated keys, this step is less critical as they are designed to be strong.</li>
            </ul>
            <p>
              Once connected, you&apos;ll see the status change to &quot;Connected (Mocked)&quot; and tabs for File Transfer, Data Transfer, and Messaging will become available.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">2. Using the Features</h3>
            <ul className="list-disc pl-6 space-y-2 mb-2">
              <li>
                <strong>File Transfer</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li><strong>Sending</strong>: Click &quot;Choose File&quot;, select the file you want to send (up to 500MB), and click &quot;Send File&quot;. You&apos;ll see the progress in the &quot;Transfer Activity&quot; list.</li>
                  <li><strong>Receiving</strong>: When your peer sends you a file, it will appear in your &quot;Transfer Activity&quot; list with &quot;Approve&quot; and &quot;Reject&quot; buttons. Click &quot;Approve&quot; to simulate downloading the file.</li>
                </ul>
              </li>
              <li>
                <strong>Data Transfer</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Enter any short text or JSON data into the textarea.</li>
                  <li>Click &quot;Send Data&quot;. The data will appear in the &quot;Data Log&quot;.</li>
                  <li>Incoming data from your peer will also appear in the log.</li>
                </ul>
              </li>
              <li>
                <strong>Messaging</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Type your message in the input field at the bottom of the chat window.</li>
                  <li>Press Enter or click the send button.</li>
                  <li>Messages from you and your peer will appear in the chat log.</li>
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

            <h3 className="text-xl font-semibold mt-4 mb-2">4. Security</h3>
            <p>
              All data transfers (files, data snippets, messages) within Cryptoshare are <em>mock</em> end-to-end encrypted using the shared session key. This means that, in a real implementation, only you and your connected peer would be able to decrypt and view the shared information. The &quot;mocked&quot; aspect means this application simulates the behavior but doesn&apos;t implement actual cryptographic operations for this demonstration.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">5. Disconnecting</h3>
            <p>
              To end the session, either user can click the &quot;Disconnect&quot; button in the Connection Manager section.
            </p>
          </section>

          <hr className="my-8 border-border" />

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">Cryptoshare Nasıl Kullanılır? (Türkçe)</h2>
            <p className="mb-2">
              Cryptoshare, dosyaların, verilerin ve mesajların iki kullanıcı arasında doğrudan güvenli bir şekilde aktarılması için tasarlanmış bir eşler arası (P2P) uygulamasıdır. Tüm aktarımlar, paylaşılan bir oturum anahtarı kullanılarak sahte (mock) uçtan uca şifrelenir.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">1. Güvenli Bağlantı Kurma</h3>
            <p className="mb-1">
              Paylaşıma başlamak için sizin ve eşinizin güvenli bir bağlantı kurması gerekir:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li><strong>Oturum Anahtarı Girin veya Oluşturun</strong>: Ana sayfada, bir kullanıcı özel bir oturum anahtarı yazabilir veya güçlü, rastgele bir anahtar oluşturmak için &quot;Güvenli Anahtar Oluştur&quot; düğmesine tıklayabilir.</li>
              <li><strong>Anahtarı Güvenli Bir Şekilde Paylaşın</strong>: Bu çok önemlidir. <em>Tam</em> oturum anahtarını eşinizle güvenli, bant dışı bir kanal aracılığıyla (örneğin, güvenilir bir mesajlaşma uygulaması, sözlü olarak) paylaşın.</li>
              <li><strong>Her İki Kullanıcı da Bağlanır</strong>: Her iki kullanıcı da <em>aynı</em> oturum anahtarını &quot;Oturum Anahtarı&quot; alanına girmeli ve &quot;Bağlan&quot; düğmesine tıklamalıdır.</li>
              <li><strong>Anahtar Gücünü Kontrol Edin</strong>: Özel bir anahtar kullanıyorsanız, &quot;Anahtar Gücünü Kontrol Et / Öneri Al&quot; düğmesini kullanmanız önerilir. Bu, anahtarınızı analiz etmek ve zayıfsa iyileştirmeler önermek için bir yapay zeka modeli kullanır. Oluşturulan anahtarlar için bu adım daha az kritiktir çünkü güçlü olacak şekilde tasarlanmışlardır.</li>
            </ul>
            <p>
              Bağlantı kurulduğunda, durumun &quot;Bağlandı (Sahte)&quot; olarak değiştiğini göreceksiniz ve Dosya Aktarımı, Veri Aktarımı ve Mesajlaşma sekmeleri kullanılabilir hale gelecektir.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">2. Özellikleri Kullanma</h3>
            <ul className="list-disc pl-6 space-y-2 mb-2">
              <li>
                <strong>Dosya Aktarımı</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li><strong>Gönderme</strong>: &quot;Dosya Seç&quot;e tıklayın, göndermek istediğiniz dosyayı seçin (en fazla 500MB) ve &quot;Dosya Gönder&quot;e tıklayın. İlerlemeyi &quot;Aktarım Etkinliği&quot; listesinde göreceksiniz.</li>
                  <li><strong>Alma</strong>: Eşiniz size bir dosya gönderdiğinde, &quot;Aktarım Etkinliği&quot; listenizde &quot;Onayla&quot; ve &quot;Reddet&quot; düğmeleriyle görünecektir. Dosyayı indirmeyi simüle etmek için &quot;Onayla&quot;ya tıklayın.</li>
                </ul>
              </li>
              <li>
                <strong>Veri Aktarımı</strong>:
                 <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Metin alanına kısa metin veya JSON verisi girin.</li>
                  <li>&quot;Veri Gönder&quot;e tıklayın. Veri, &quot;Veri Günlüğü&quot;nde görünecektir.</li>
                  <li>Eşinizden gelen veriler de günlükte görünecektir.</li>
                </ul>
              </li>
              <li>
                <strong>Mesajlaşma</strong>:
                <ul className="list-circle pl-6 space-y-1 mt-1">
                  <li>Mesajınızı sohbet penceresinin altındaki giriş alanına yazın.</li>
                  <li>Enter tuşuna basın veya gönder düğmesine tıklayın.</li>
                  <li>Sizden ve eşinizden gelen mesajlar sohbet günlüğünde görünecektir.</li>
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

            <h3 className="text-xl font-semibold mt-4 mb-2">4. Güvenlik</h3>
            <p>
              Cryptoshare içindeki tüm veri aktarımları (dosyalar, veri parçacıkları, mesajlar) paylaşılan oturum anahtarı kullanılarak <em>sahte</em> uçtan uca şifrelenir. Bu, gerçek bir uygulamada, paylaşılan bilgileri yalnızca sizin ve bağlı eşinizin şifresini çözüp görüntüleyebileceği anlamına gelir. &quot;Sahte&quot; (mocked) özelliği, bu uygulamanın davranışı simüle ettiği ancak bu gösteri için gerçek kriptografik işlemler uygulamadığı anlamına gelir.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">5. Bağlantıyı Kesme</h3>
            <p>
              Oturumu sonlandırmak için, her iki kullanıcı da Bağlantı Yöneticisi bölümündeki &quot;Bağlantıyı Kes&quot; düğmesine tıklayabilir.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
