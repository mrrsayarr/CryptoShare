
# Cryptoshare - Güvenli P2P Aktarım

Cryptoshare, kullanıcıların tarayıcıları arasında doğrudan dosya, veri parçacıkları ve mesajların güvenli bir şekilde aktarılması için tasarlanmış bir eşler arası (P2P) uygulamasıdır. Doğrudan P2P iletişimi için WebRTC'yi ve ilk sinyalizasyon (bağlantı kurulumu) süreci için Supabase'i kullanır. Tüm aktarımlar WebRTC veri kanalı (DTLS) aracılığıyla uçtan uca şifrelenir.

## Temel Özellikler

*   **Eşler Arası (P2P) İletişim**: WebRTC kullanarak kullanıcılar arasında doğrudan bağlantı kurar, veri aktarımı için sunucu müdahalesini en aza indirir.
*   **Uçtan Uca Şifreleme**: Tüm dosyalar, veriler ve mesajlar, WebRTC veri kanallarının doğal bir parçası olan DTLS kullanılarak aktarım sırasında şifrelenir.
*   **Dosya Aktarımı**: Eş onay mekanizmasıyla dosyaları (en fazla 500MB) güvenli bir şekilde gönderin ve alın.
*   **Veri Parçacığı Aktarımı**: Kısa metin veya JSON verilerini hızla gönderin.
*   **Gerçek Zamanlı Mesajlaşma**: Bağlı olduğunuz eşinizle güvenli bir şekilde sohbet edin.
*   **Sinyalizasyon için Supabase**: P2P bağlantısını kurmak için bağlantı meta verilerinin (teklifler, yanıtlar, ICE adayları) değişimi için Supabase Gerçek Zamanlı Veritabanı ve Yayın (Broadcast) özelliklerini kullanır.
*   **Basit Bağlantı Akışı**: Bir oturum başlatarak benzersiz bir anahtar alın, bunu eşinizle paylaşın ve eşiniz kolayca oturumunuza katılsın.
*   **Açık ve Koyu Mod**: Kullanıcı tercihi için tema desteği.

## Teknoloji Yığını

*   **Frontend**: Next.js (App Router), React, TypeScript
*   **UI**: ShadCN UI Bileşenleri, Tailwind CSS
*   **Sinyalizasyon**: Supabase (Oturum başlatma için Gerçek Zamanlı Veritabanı, SDP/ICE değişimi için Gerçek Zamanlı Yayın)
*   **P2P İletişimi**: WebRTC (RTCPeerConnection, RTCDataChannel)

## Kurulum ve Yükleme

Cryptoshare'i yerel olarak kurmak ve çalıştırmak için şu adımları izleyin:

**1. Depoyu Klonlayın:**

```bash
git clone https://github.com/mrrsayarr/CryptoShare.git
cd cryptoshare
```

**2. Bağımlılıkları Yükleyin:**

npm kullanarak:
```bash
npm install
```
Veya yarn kullanarak:
```bash
yarn install
```

**3. Supabase Kurulumu:**

Cryptoshare, sinyalizasyon mekanizması için bir Supabase projesi gerektirir.

   *   **Supabase Projesi Oluşturun**: Eğer yoksa, [supabase.com](https://supabase.com) adresine gidin ve yeni bir proje oluşturun.
   *   **`webrtc_sessions` Tablosunu Oluşturun**:
      Supabase proje panonuzdaki "SQL Editor" bölümüne gidin ve gerekli tabloyu oluşturmak için aşağıdaki SQL sorgusunu çalıştırın:
      ```sql
      CREATE TABLE public.webrtc_sessions (
        id TEXT PRIMARY KEY, -- Bu, oturum_anahtarı (session_key) olacak
        offer_sdp JSONB,
        answer_sdp JSONB,
        status TEXT,         -- Örn: 'waiting_for_guest', 'guest_joined', 'connected'
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ```
   *   **Satır Düzeyinde Güvenlik (RLS) Yapılandırması**:
      RLS büyük olasılıkla varsayılan olarak etkindir. Uygulamanızın (`anon` anahtarını kullanarak) bu tabloyla etkileşime girmesine izin vermek için politikalar oluşturmanız gerekir.
      SQL Düzenleyicisi'nde çalıştırın:
      ```sql
      -- RLS zaten etkin değilse etkinleştirin (genellikle yeni tablolar için varsayılan olarak etkindir)
      -- ALTER TABLE public.webrtc_sessions ENABLE ROW LEVEL SECURITY;

      -- Anonim kullanıcıların oturumları okumasına izin ver (örn. bir teklifi almak için)
      CREATE POLICY "Allow public read access to webrtc_sessions"
      ON public.webrtc_sessions
      FOR SELECT
      TO anon
      USING (true);

      -- Anonim kullanıcıların yeni oturumlar oluşturmasına izin ver (teklifleri eklemek için)
      CREATE POLICY "Allow public insert access to webrtc_sessions"
      ON public.webrtc_sessions
      FOR INSERT
      TO anon
      WITH CHECK (true);

      -- Anonim kullanıcıların oturumları güncellemesine izin ver (örn. misafirin yanıt eklemesi veya başlatıcının durumu güncellemesi için)
      -- Üretim ortamı için bunu daha kısıtlayıcı hale getirmek isteyebilirsiniz (örn. yalnızca belirli alanların belirli roller tarafından veya auth.uid() temelinde güncellenmesine izin verin)
      CREATE POLICY "Allow public update access to webrtc_sessions"
      ON public.webrtc_sessions
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
      ```
      **Not**: Bunlar kurulum kolaylığı için izin veren politikalardır. Bir üretim ortamı için güvenlik gereksinimlerinize göre daha kısıtlayıcı RLS politikaları tanımlamanız gerekir.
   *   **Tablo için Gerçek Zamanlı (Realtime) Özelliğini Etkinleştirin**:
      Supabase panonuzda "Database" -> "Replication" bölümüne gidin. `public.webrtc_sessions` tablosunun listelendiğinden ve Gerçek Zamanlı için etkin olduğundan emin olun. Bu, yanıtların ve ICE adaylarının yayınlanması için kritik öneme sahiptir.

**4. Ortam Değişkenleri:**

   *   Projenizin kök dizininde bir `.env` dosyası oluşturun.
   *   Supabase proje URL'nizi ve Anon Anahtarınızı bu dosyaya ekleyin:
      ```env
      NEXT_PUBLIC_SUPABASE_URL="SUPABASE_URL'İNİZ_BURAYA"
      NEXT_PUBLIC_SUPABASE_ANON_KEY="SUPABASE_ANON_ANAHTARINIZ_BURAYA"
      ```
      `SUPABASE_URL'İNİZ_BURAYA` ve `SUPABASE_ANON_ANAHTARINIZ_BURAYA` kısımlarını Supabase proje ayarlarınızdaki (Proje Ayarları -> API) gerçek kimlik bilgilerinizle değiştirin.

**5. Uygulamayı Çalıştırın:**

```bash
npm run dev
```
Veya yarn kullanarak:
```bash
yarn dev
```
Uygulama şimdi çalışıyor olmalı, genellikle `http://localhost:9002` adresinde.

## Cryptoshare Nasıl Kullanılır?

Bağlantı süreci, ilk bağlantı ayrıntılarının (Teklif/Yanıt SDP'leri ve ICE adayları) değişimi için Supabase tarafından kolaylaştırılır.

**1. Güvenli Bir Bağlantı Kurma:**

   *   **Başlatıcı (Kullanıcı A)**:
      1.  Cryptoshare'i açar.
      2.  "Create New Session" (Yeni Oturum Başlat) düğmesine tıklar.
      3.  Uygulama benzersiz bir "Session Key" (Oturum Anahtarı) oluşturur. Bu anahtar ekranda görüntülenir.
      4.  Başlatıcı, bu Oturum Anahtarını Misafir (Kullanıcı B) ile güvenli bir şekilde paylaşır (örn. güvenli bir mesajlaşma uygulaması, e-posta yoluyla).

   *   **Misafir (Kullanıcı B)**:
      1.  Cryptoshare'i açar.
      2.  Kullanıcı A'dan aldığı Oturum Anahtarını "Enter Session Key" (Oturum Anahtarını Girin) giriş alanına girer.
      3.  "Join Session" (Oturuma Katıl) düğmesine tıklar.

   *   **Otomatik Bağlantı**:
      Oturum Anahtarı doğruysa ve her iki kullanıcı da çevrimiçiyse, Supabase gerekli WebRTC bağlantı bilgilerinin (Teklif, Yanıt ve ICE adayları) değişimini arka planda kolaylaştıracaktır. Bağlantı durumu güncellenecek ve "Securely Connected!" (Güvenli Bir Şekilde Bağlandı!) mesajı gösterildiğinde P2P bağlantısı kurulmuş olacaktır.

**2. Özellikleri Kullanma (Bağlantı Kurulduktan Sonra):**

   *   **File Transfer (Dosya Aktarımı) Sekmesi**:
      *   **Gönderme**: "Choose File" (Dosya Seç) düğmesine tıklayın, dosyayı seçin (en fazla 500MB) ve "Send File" (Dosya Gönder) düğmesine tıklayın. Eşiniz aktarımı onaylamak için bir istek alacaktır. Onayladıktan sonra dosya doğrudan gönderilecektir.
      *   **Alma**: Eşiniz bir dosya aktarımı başlattığında, "Transfer Activity" (Aktarım Etkinliği) listenizde "Approve" (Onayla) ve "Reject" (Reddet) düğmeleriyle görünecektir. Dosyayı doğrudan eşinizden almaya başlamak için "Approve" (Onayla) düğmesine tıklayın. Dosya tamamlandığında otomatik olarak indirilecektir.

   *   **Data Transfer (Veri Aktarımı) Sekmesi**:
      *   Metin alanına kısa metin veya JSON verisi girin.
      *   "Send Data" (Veri Gönder) düğmesine tıklayın. Veri doğrudan eşinize gönderilecek ve onların "Data Log" (Veri Günlüğü) bölümünde görünecektir. Gönderdiğiniz veri sizin günlüğünüzde de görünecektir.

   *   **Messaging (Mesajlaşma) Sekmesi**:
      *   Mesajınızı sohbet penceresinin altındaki giriş alanına yazın.
      *   Enter tuşuna basın veya gönder düğmesine tıklayın. Mesajınız doğrudan eşinize gönderilir ve onların ve sizin sohbet pencerenizde görünür.

**3. Bağlantıyı Kesme:**

   *   Her iki kullanıcı da "Disconnect Session" (Oturumu Kes) düğmesine (veya bağlantı başarısız olduysa "Reset and Try Again" (Sıfırla ve Tekrar Dene) düğmesine) tıklayabilir. Bu, P2P bağlantısını kapatacaktır.
   *   Sayfayı yenilemek veya tarayıcı sekmesini kapatmak da bağlantıyı sonlandıracaktır.

## Güvenlik Notları

*   **Uçtan Uca Şifreleme**: Eşler arasında doğrudan aktarılan tüm veriler (dosyalar, veri parçacıkları, mesajlar), WebRTC'nin standart bir parçası olan DTLS (Datagram Taşıma Katmanı Güvenliği) kullanılarak uçtan uca şifrelenir.
*   **Sinyalizasyon Sunucusu (Supabase)**: Supabase *yalnızca* sinyalizasyon süreci için kullanılır – yani, iki tarayıcının birbirini bulmasına ve doğrudan P2P bağlantısını kurmak için gereken ilk meta verileri değiş tokuş etmesine yardımcı olmak için. Gerçek dosyalarınız, mesajlarınız ve veri parçacıklarınız P2P bağlantısı aktif olduktan sonra aktarım sırasında Supabase sunucularından **geçmez**.
*   **Oturum Anahtarı Güvenliği**: Oturum Anahtarı değişiminin güvenliği kullanıcıların sorumluluğundadır. Güvenilir bir kanal aracılığıyla paylaşın. Anahtar kullanılıp P2P bağlantısı kurulduktan sonra, anahtarın kendisi veri aktarım şifrelemesinde doğrudan yer almaz.

## Bağlanabilirlik (STUN/TURN Sunucuları)

*   **STUN Sunucuları**: Cryptoshare, tarayıcıların genel IP adreslerini keşfetmelerine ve doğrudan P2P bağlantıları kurmaya çalışmalarına yardımcı olmak için genel STUN sunucularını (örn. `stun:stun.l.google.com:19302`) kullanır.
*   **NAT Geçişi**: Çoğu durumda STUN yeterlidir. Ancak, bazı ağ yapılandırmaları (karmaşık NAT'lar veya kısıtlayıcı güvenlik duvarları gibi) doğrudan P2P bağlantılarını engelleyebilir.
*   **TURN Sunucuları**: Kalıcı bağlantı hataları (örn. durumun "Connecting" (Bağlanıyor) veya "Failed" (Başarısız) durumunda takılı kalması ya da tarayıcı konsolunda ICE bağlantı hataları) yaşıyorsanız, bu durum ağ ortamınızdan kaynaklanıyor olabilir. Bu gibi durumlarda, şifrelenmiş WebRTC trafiğini yönlendirmek için bir TURN sunucusu gerekir. Cryptoshare, `ICE_SERVERS` yapılandırmasında ( `src/hooks/useWebRTC.ts` içinde) sağlanırsa TURN sunucularını kullanacak şekilde yapılandırılmıştır, ancak **kendisi bir TURN sunucu hizmeti sağlamaz**. Tüm ağ türlerinde güvenilir bağlantılar için, uygun kimlik bilgilerine sahip halka açık veya kendi kendine barındırılan bir TURN sunucusu kullanmak gerekebilir.
