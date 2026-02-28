# Affiliate Link Ekleme Sorunu - Çözüm

## 🔴 Sorun
Admin panelinde yeni affiliate link eklerken sayfa boş kalıyor veya link kaydedilmiyor.

## 🔍 Olası Nedenler

### 1. Admin Girişi Yapılmamış
**Belirti**: API 401 Unauthorized hatası veriyor
**Çözüm**: Admin olarak giriş yap

```
Email: meofeat@gmail.com
Şifre: admin123
```

### 2. Backend Çalışmıyor
**Belirti**: API'ye ulaşılamıyor
**Kontrol**:
```bash
curl http://localhost:3001/api/v1/affiliates/featured
```

**Çözüm**: Backend'i başlat
```bash
cd backend
npm run start:dev
```

### 3. Form Validasyonu Hatası
**Belirti**: "Lütfen tüm zorunlu alanları doldurun" mesajı
**Çözüm**: Zorunlu alanları doldur:
- Link Adı *
- Affiliate URL *
- Kısa Kod *

### 4. Kısa Kod Zaten Kullanılıyor
**Belirti**: "Affiliate link oluşturulamadı" hatası
**Çözüm**: Farklı bir kısa kod kullan (unique olmalı)

### 5. CORS Hatası
**Belirti**: Console'da CORS hatası
**Çözüm**: Backend .env dosyasında CORS_ORIGIN kontrol et

## ✅ Adım Adım Test

### 1. Backend Kontrolü
```bash
# Backend çalışıyor mu?
curl http://localhost:3001/api/v1/affiliates/featured

# Beklenen: JSON array (boş veya dolu)
# Hata: Connection refused → Backend başlat
```

### 2. Admin Girişi
```bash
# 1. http://localhost:3003/login adresine git
# 2. Email: meofeat@gmail.com
# 3. Şifre: admin123
# 4. Giriş yap
```

### 3. Token Kontrolü
```bash
# Browser console'da:
localStorage.getItem('access_token')

# Beklenen: JWT token string
# Hata: null → Tekrar giriş yap
```

### 4. API Test (Token ile)
```bash
# Token'ı al (browser console'dan)
TOKEN="your_token_here"

# Admin endpoint'i test et
curl http://localhost:3001/api/v1/affiliates/admin/links \
  -H "Authorization: Bearer $TOKEN"

# Beklenen: {"links": [...], "total": 12}
# Hata: 401 → Token geçersiz, tekrar giriş yap
```

### 5. Yeni Link Ekleme Testi
```bash
# Token ile POST isteği
curl -X POST http://localhost:3001/api/v1/affiliates/admin/links \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Ürün",
    "url": "https://example.com/product",
    "short_code": "test-product-123",
    "provider": "AMAZON",
    "category": "GAMING_GEAR",
    "commission_rate": 5,
    "price": "₺299.99",
    "is_active": true
  }'

# Beklenen: Yeni oluşturulan link objesi
# Hata: 400 → Validation hatası
# Hata: 409 → short_code zaten kullanılıyor
```

## 🛠️ Hata Ayıklama

### Browser Console'da Kontrol Et

1. **Network Tab**
   - POST isteği gidiyor mu?
   - Status code nedir? (200, 401, 400, 500?)
   - Response ne döndürüyor?

2. **Console Tab**
   - JavaScript hatası var mı?
   - API hatası var mı?
   - CORS hatası var mı?

3. **Application Tab**
   - localStorage'da access_token var mı?
   - Token geçerli mi?

### Backend Loglarını Kontrol Et

```bash
# Backend terminal'inde hataları gör
# Veya:
cd backend
npm run start:dev
```

Logları izle:
- POST /api/v1/affiliates/admin/links isteği geliyor mu?
- Hangi hata döndürülüyor?
- Database hatası var mı?

## 📋 Doğru Form Doldurma

### Minimum Gerekli Alanlar

```
Link Adı: Razer DeathAdder V2 Gaming Mouse
Affiliate URL: https://www.amazon.com.tr/dp/B07GBZ4Q68
Kısa Kod: razer-mouse-v2
Provider: Amazon
Kategori: Gaming Ekipmanları
Komisyon Oranı: 5
Aktif: ✓ (checked)
```

### Opsiyonel Alanlar

```
Görsel URL: https://example.com/image.jpg
Açıklama: Yüksek performanslı gaming mouse
Fiyat: ₺899.99
Puan: 4.7
```

## 🎯 Kısa Kod Kuralları

Kısa kod:
- ✅ Küçük harf olmalı
- ✅ Rakam içerebilir
- ✅ Tire (-) içerebilir
- ❌ Boşluk içeremez
- ❌ Özel karakter içeremez
- ❌ Türkçe karakter içeremez
- ❌ Daha önce kullanılmış olmamalı (unique)

**Örnekler**:
- ✅ `razer-mouse-v2`
- ✅ `uc-1800`
- ✅ `gaming-keyboard-2024`
- ❌ `Razer Mouse` (büyük harf ve boşluk)
- ❌ `ürün-123` (Türkçe karakter)
- ❌ `uc-60` (zaten kullanılıyor)

## 🔧 Hızlı Çözümler

### Çözüm 1: Sayfayı Yenile ve Tekrar Dene
```
1. Ctrl+Shift+R (hard refresh)
2. Tekrar giriş yap
3. Formu doldur
4. Kaydet
```

### Çözüm 2: Token'ı Temizle ve Tekrar Giriş Yap
```javascript
// Browser console'da:
localStorage.clear();
// Sonra tekrar giriş yap
```

### Çözüm 3: Backend'i Yeniden Başlat
```bash
# Backend terminal'inde Ctrl+C
# Sonra:
npm run start:dev
```

### Çözüm 4: Farklı Kısa Kod Kullan
```
Eğer "uc-60" kullanıyorsan:
→ "uc-60-yeni" veya "uc-60-v2" dene
```

## 📊 Başarılı Ekleme Sonrası

Başarılı olursa:
1. ✅ "Affiliate link oluşturuldu" toast mesajı görünür
2. ✅ Otomatik olarak `/admin/affiliates` sayfasına yönlendirilirsin
3. ✅ Yeni link listede görünür

## 🐛 Hala Çalışmıyorsa

### Detaylı Log Kontrolü

1. **Backend Console**:
```bash
cd backend
npm run start:dev
# Logları izle
```

2. **Browser Console**:
```javascript
// Network tab'ı aç
// POST isteğine tıkla
// Request payload'ı kontrol et
// Response'u kontrol et
```

3. **Database Kontrolü**:
```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d squadbul -c "
SELECT id, name, short_code, is_active 
FROM affiliate_links 
ORDER BY created_at DESC 
LIMIT 5;
"
```

### Hata Mesajlarına Göre Çözümler

| Hata Mesajı | Neden | Çözüm |
|-------------|-------|-------|
| "Unauthorized" | Token yok/geçersiz | Tekrar giriş yap |
| "Lütfen tüm zorunlu alanları doldurun" | Form eksik | Zorunlu alanları doldur |
| "Affiliate link oluşturulamadı" | Backend hatası | Backend loglarını kontrol et |
| "duplicate key value" | Kısa kod zaten var | Farklı kısa kod kullan |
| "Cannot read property..." | JavaScript hatası | Sayfayı yenile |
| "Network Error" | Backend çalışmıyor | Backend'i başlat |

## 📞 Destek

Hala sorun yaşıyorsan:

1. Backend loglarını paylaş
2. Browser console hatalarını paylaş
3. Hangi adımda takıldığını belirt
4. Ekran görüntüsü ekle

---

**Güncelleme Tarihi**: 2026-02-28
**Durum**: Sorun Giderme Rehberi
