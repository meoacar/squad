# PWA (Progressive Web App) Kurulum Rehberi

## 🎯 Genel Bakış

SquadBul artık tam özellikli bir Progressive Web App (PWA) olarak çalışıyor. Bu, kullanıcıların uygulamayı cihazlarına yükleyebilecekleri ve offline çalışabilecekleri anlamına geliyor.

## ✨ Özellikler

### 1. Offline Çalışma
- Service Worker ile cache yönetimi
- Network First stratejisi (API istekleri için)
- Cache First stratejisi (statik dosyalar için)
- Offline sayfası (`/offline`)

### 2. Ana Ekrana Ekleme
- Otomatik kurulum prompt'ı
- iOS ve Android desteği
- Özelleştirilebilir kurulum deneyimi

### 3. Push Bildirimleri
- Web push notification desteği
- VAPID key entegrasyonu
- Bildirim izni yönetimi

### 4. Uygulama Güncellemeleri
- Otomatik güncelleme kontrolü
- Kullanıcı dostu güncelleme prompt'ı
- Sorunsuz güncelleme deneyimi

### 5. Network Durumu
- Online/Offline durum takibi
- Gerçek zamanlı bağlantı bildirimleri
- Otomatik yeniden bağlanma

## 📦 Kurulum

### 1. İkonları Hazırlayın

PWA için farklı boyutlarda ikonlar gereklidir. Ana logo dosyanızı kullanarak şu boyutlarda ikonlar oluşturun:

```bash
# ImageMagick kullanarak (macOS için: brew install imagemagick)
convert logo.png -resize 72x72 frontend/public/icons/icon-72x72.png
convert logo.png -resize 96x96 frontend/public/icons/icon-96x96.png
convert logo.png -resize 128x128 frontend/public/icons/icon-128x128.png
convert logo.png -resize 144x144 frontend/public/icons/icon-144x144.png
convert logo.png -resize 152x152 frontend/public/icons/icon-152x152.png
convert logo.png -resize 192x192 frontend/public/icons/icon-192x192.png
convert logo.png -resize 384x384 frontend/public/icons/icon-384x384.png
convert logo.png -resize 512x512 frontend/public/icons/icon-512x512.png
```

Alternatif olarak online araçlar kullanabilirsiniz:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### 2. Screenshot'ları Ekleyin (Opsiyonel)

App Store benzeri bir deneyim için:

```bash
mkdir -p frontend/public/screenshots
# Desktop ve mobile screenshot'lar ekleyin
```

### 3. Environment Variables

`.env.local` dosyasına ekleyin:

```env
# Push bildirimleri için VAPID keys (backend'den alınacak)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

## 🚀 Kullanım

### Service Worker'ı Aktifleştirme

Service Worker otomatik olarak kaydedilir. Manuel kontrol için:

```typescript
import { registerServiceWorker } from '@/lib/pwa';

// Component içinde
useEffect(() => {
  registerServiceWorker();
}, []);
```

### PWA Hook Kullanımı

```typescript
import { usePWA } from '@/hooks/usePWA';

function MyComponent() {
  const { 
    registration, 
    isInstalled, 
    notificationPermission, 
    support,
    enableNotifications 
  } = usePWA();

  const handleEnableNotifications = async () => {
    const permission = await enableNotifications();
    if (permission === 'granted') {
      console.log('Bildirimler aktif!');
    }
  };

  return (
    <div>
      {!isInstalled && <p>Uygulamayı yükleyin!</p>}
      {support.pushNotifications && (
        <button onClick={handleEnableNotifications}>
          Bildirimleri Aç
        </button>
      )}
    </div>
  );
}
```

### Kurulum Prompt'ını Özelleştirme

`InstallPrompt` bileşeni otomatik olarak gösterilir. Özelleştirmek için:

```typescript
// components/pwa/InstallPrompt.tsx dosyasını düzenleyin
```

## 🔧 Yapılandırma

### Manifest Dosyası

`frontend/public/manifest.json` dosyasını düzenleyerek:

- Uygulama adını değiştirin
- Tema rengini ayarlayın
- Kısayolları özelleştirin
- Kategorileri güncelleyin

### Service Worker Stratejileri

`frontend/public/sw.js` dosyasında cache stratejilerini özelleştirin:

```javascript
// Cache sürelerini ayarlayın
const CACHE_NAME = 'squadbul-v1';
const RUNTIME_CACHE = 'squadbul-runtime-v1';

// Önbellekte tutulacak dosyaları ekleyin
const STATIC_ASSETS = [
  '/',
  '/offline',
  // Daha fazla ekleyin...
];
```

## 📱 Test Etme

### Chrome DevTools

1. Chrome'da uygulamayı açın
2. DevTools'u açın (F12)
3. "Application" sekmesine gidin
4. Sol menüden kontrol edin:
   - Manifest
   - Service Workers
   - Cache Storage
   - Push Notifications

### Lighthouse

PWA skorunu kontrol edin:

1. DevTools > Lighthouse
2. "Progressive Web App" seçin
3. "Generate report" tıklayın

Hedef: 90+ skor

### Mobile Test

1. Chrome'da `chrome://inspect` açın
2. Mobil cihazınızı bağlayın
3. Uygulamayı test edin

## 🔔 Push Bildirimleri (Backend)

Backend'de push bildirimleri için:

### 1. VAPID Keys Oluşturun

```bash
cd backend
npm install web-push --save
npx web-push generate-vapid-keys
```

### 2. Backend Endpoint'leri

```typescript
// backend/src/notifications/notifications.controller.ts

@Post('subscribe')
async subscribe(@Body() subscription: PushSubscription) {
  // Subscription'ı veritabanına kaydet
  await this.notificationsService.saveSubscription(subscription);
  return { success: true };
}

@Post('send')
async sendNotification(@Body() data: NotificationData) {
  // Tüm abonelere bildirim gönder
  await this.notificationsService.sendToAll(data);
  return { success: true };
}
```

### 3. Bildirim Gönderme

```typescript
import * as webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const payload = JSON.stringify({
  title: 'Yeni Mesaj',
  body: 'Bir kullanıcı size mesaj gönderdi',
  url: '/messages',
});

await webpush.sendNotification(subscription, payload);
```

## 🎨 Özelleştirme

### Tema Rengi

```json
// manifest.json
{
  "theme_color": "#3b82f6",
  "background_color": "#ffffff"
}
```

### Splash Screen (iOS)

```html
<!-- layout.tsx head içinde -->
<link rel="apple-touch-startup-image" href="/splash.png" />
```

### Kısayollar

```json
// manifest.json
{
  "shortcuts": [
    {
      "name": "Yeni İlan",
      "url": "/posts/create",
      "icons": [...]
    }
  ]
}
```

## 📊 Analytics

PWA kullanımını takip edin:

```typescript
// Service Worker'da
self.addEventListener('install', () => {
  // Analytics: SW installed
  fetch('/api/analytics/pwa-install', { method: 'POST' });
});

// App'te
if (isAppInstalled()) {
  // Analytics: App opened from home screen
  fetch('/api/analytics/pwa-launch', { method: 'POST' });
}
```

## 🐛 Sorun Giderme

### Service Worker Güncellenmiyor

```bash
# Cache'i temizle
# Chrome DevTools > Application > Clear storage
```

### Manifest Yüklenmiyor

```bash
# Headers'ı kontrol edin
curl -I https://your-domain.com/manifest.json
```

### Push Bildirimleri Çalışmıyor

1. HTTPS kullanıldığından emin olun
2. VAPID keys'in doğru olduğunu kontrol edin
3. Bildirim izninin verildiğini kontrol edin

## 🚀 Production Deployment

### 1. Build

```bash
cd frontend
npm run build
```

### 2. HTTPS Zorunlu

PWA özellikleri HTTPS gerektirir. Nginx yapılandırması:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL sertifikaları
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Service Worker için özel header
    location /sw.js {
        add_header Cache-Control "public, max-age=0, must-revalidate";
        add_header Service-Worker-Allowed "/";
    }

    # Manifest için cache
    location /manifest.json {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 3. CDN Yapılandırması

Service Worker ve Manifest dosyalarını CDN'den servis etmeyin veya özel cache kuralları ekleyin.

## 📈 Performans İpuçları

1. **Kritik Dosyaları Önbellekle**: Sık kullanılan sayfaları STATIC_ASSETS'e ekleyin
2. **Cache Stratejisini Optimize Et**: API istekleri için uygun strateji seçin
3. **Background Sync Kullan**: Offline işlemleri senkronize edin
4. **Lazy Loading**: Büyük dosyaları lazy load edin

## 🔐 Güvenlik

1. **HTTPS Zorunlu**: PWA özellikleri sadece HTTPS'de çalışır
2. **CSP Headers**: Content Security Policy ekleyin
3. **Scope Kontrolü**: Service Worker scope'unu sınırlayın

## 📚 Kaynaklar

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox](https://developers.google.com/web/tools/workbox)

## ✅ Checklist

- [ ] İkonlar oluşturuldu (8 boyut)
- [ ] Manifest.json yapılandırıldı
- [ ] Service Worker test edildi
- [ ] Offline sayfası çalışıyor
- [ ] Push bildirimleri aktif (opsiyonel)
- [ ] Lighthouse skoru 90+
- [ ] HTTPS aktif
- [ ] Mobile'da test edildi
- [ ] iOS Safari'de test edildi
- [ ] Android Chrome'da test edildi

## 🎉 Sonuç

PWA implementasyonu tamamlandı! Kullanıcılar artık:
- Uygulamayı ana ekrana ekleyebilir
- Offline çalışabilir
- Push bildirimleri alabilir
- Daha hızlı bir deneyim yaşayabilir
