# Ödeme Entegrasyonu Rehberi

Bu proje Türkiye'deki en yaygın ödeme sistemleri olan **İyzico** ve **PayTR** entegrasyonlarını içermektedir.

## Desteklenen Ödeme Sağlayıcıları

### 1. İyzico
- Türkiye'nin en popüler ödeme altyapısı
- 3D Secure desteği
- Taksit seçenekleri (1-9 taksit)
- Sandbox ve Production ortamları

### 2. PayTR
- Türk bankalarıyla doğrudan entegrasyon
- Düşük komisyon oranları
- Hızlı entegrasyon
- Test modu desteği

## Kurulum

### 1. Gerekli Paketler
Tüm gerekli paketler zaten yüklü. Ek paket kurulumuna gerek yok.

### 2. Ortam Değişkenleri

`.env` dosyasına aşağıdaki değişkenleri ekleyin:

```env
# İyzico Ayarları
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# PayTR Ayarları
PAYTR_MERCHANT_ID=your_paytr_merchant_id
PAYTR_MERCHANT_KEY=your_paytr_merchant_key
PAYTR_MERCHANT_SALT=your_paytr_merchant_salt
PAYTR_BASE_URL=https://www.paytr.com
```

### 3. Test Hesapları

#### İyzico Test Hesabı
1. https://sandbox-merchant.iyzipay.com adresinden üye olun
2. API Key ve Secret Key'i alın
3. Test kartları: https://dev.iyzipay.com/tr/test-kartlari

#### PayTR Test Hesabı
1. https://www.paytr.com adresinden üye olun
2. Merchant bilgilerinizi alın
3. `NODE_ENV=development` olduğunda otomatik test modu aktif

## API Kullanımı

### Ödeme Oluşturma

```bash
POST /api/v1/payments?provider=IYZICO
Authorization: Bearer {token}

{
  "type": "PREMIUM",
  "amount": 99.99,
  "currency": "TRY",
  "description": "Premium Üyelik"
}
```

**Yanıt:**
```json
{
  "paymentId": "uuid",
  "paymentUrl": "https://...",
  "token": "payment_token"
}
```

### Ödeme Doğrulama

```bash
GET /api/v1/payments/verify?token={token}&conversationId={id}&provider=IYZICO
```

### Kullanıcının Ödemeleri

```bash
GET /api/v1/payments/my-payments
Authorization: Bearer {token}
```

### Ödeme İadesi

```bash
POST /api/v1/payments/{paymentId}/refund
Authorization: Bearer {token}

{
  "reason": "Kullanıcı talebi"
}
```

## Frontend Entegrasyonu

### React Örneği

```typescript
// Ödeme başlatma
const initiatePayment = async (type: 'PREMIUM' | 'BOOST', provider: 'IYZICO' | 'PAYTR') => {
  try {
    const response = await fetch(`/api/v1/payments?provider=${provider}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        amount: 99.99,
        currency: 'TRY',
        description: 'Premium Üyelik',
      }),
    });

    const data = await response.json();
    
    // Kullanıcıyı ödeme sayfasına yönlendir
    window.location.href = data.paymentUrl;
  } catch (error) {
    console.error('Ödeme başlatılamadı:', error);
  }
};

// Callback sayfası
const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const conversationId = searchParams.get('conversationId');
  const provider = searchParams.get('provider') || 'IYZICO';

  useEffect(() => {
    const verifyPayment = async () => {
      const response = await fetch(
        `/api/v1/payments/verify?token=${token}&conversationId=${conversationId}&provider=${provider}`
      );
      const result = await response.json();
      
      if (result.success) {
        // Başarılı ödeme
        navigate('/payment/success');
      } else {
        // Başarısız ödeme
        navigate('/payment/failed');
      }
    };

    verifyPayment();
  }, []);

  return <div>Ödeme doğrulanıyor...</div>;
};
```

## Webhook Yapılandırması

### PayTR Webhook
PayTR için webhook URL'i:
```
POST https://yourdomain.com/api/v1/payments/callback/paytr
```

Bu URL'i PayTR panel ayarlarınızda tanımlayın.

### İyzico Callback
İyzico callback URL otomatik olarak ödeme oluşturulurken gönderilir:
```
https://yourdomain.com/payment/callback?provider=IYZICO
```

## Güvenlik

1. **API Key'leri Koruyun**: Production ortamında API key'leri asla kodda tutmayın
2. **HTTPS Kullanın**: Tüm ödeme işlemleri HTTPS üzerinden yapılmalı
3. **Webhook Doğrulama**: PayTR webhook'ları hash ile doğrulanır
4. **Rate Limiting**: Ödeme endpoint'leri için rate limiting aktif

## Test Senaryoları

### İyzico Test Kartları

| Kart Numarası | Son Kullanma | CVC | 3D Secure |
|---------------|--------------|-----|-----------|
| 5528790000000008 | 12/30 | 123 | Başarılı |
| 5528790000000016 | 12/30 | 123 | Başarısız |

### PayTR Test Modu
`NODE_ENV=development` olduğunda:
- Gerçek ödeme alınmaz
- Test kartları ile işlem yapılabilir
- Tüm işlemler test modunda çalışır

## Ödeme Akışı

```
1. Kullanıcı ödeme başlatır
   ↓
2. Backend ödeme kaydı oluşturur (PENDING)
   ↓
3. Ödeme sağlayıcısına istek gönderilir
   ↓
4. Kullanıcı ödeme sayfasına yönlendirilir
   ↓
5. Kullanıcı ödeme yapar
   ↓
6. Callback/Webhook ile doğrulama
   ↓
7. Ödeme durumu güncellenir (COMPLETED/FAILED)
   ↓
8. Kullanıcıya sonuç gösterilir
```

## Hata Yönetimi

Tüm hatalar loglara kaydedilir ve kullanıcıya anlamlı mesajlar döner:

- `400 Bad Request`: Geçersiz parametreler
- `404 Not Found`: Ödeme bulunamadı
- `500 Internal Server Error`: Sunucu hatası

## Monitoring

Ödemeler için önemli metrikler:
- Başarılı/başarısız ödeme oranları
- Ortalama ödeme süresi
- Sağlayıcı bazlı performans
- İade oranları

## Destek

Sorun yaşarsanız:
1. Logları kontrol edin
2. Test modunda deneyin
3. API key'lerin doğru olduğundan emin olun
4. Webhook URL'lerini kontrol edin

## Lisans Bilgileri

- İyzico: https://www.iyzico.com
- PayTR: https://www.paytr.com

Her iki sağlayıcı için de ayrı sözleşme ve komisyon oranları geçerlidir.
