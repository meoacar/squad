# Affiliate Sistemi - Hızlı Başlangıç 🚀

## 3 Adımda Başla

### 1️⃣ Backend'i Başlat

```bash
cd backend
npm run start:dev
```

Backend `http://localhost:3001` adresinde çalışacak.

### 2️⃣ Örnek Affiliate Linkler Ekle

```bash
cd backend
npm run seed:affiliates
```

Bu komut 12 adet örnek affiliate link ekler:
- ✅ 6 UC paketi (60, 325, 660, 1800, 3850, 8100 UC)
- ✅ 4 gaming ürünü (mouse, kulaklık, klavye, powerbank)
- ✅ 2 VPN servisi (NordVPN, ExpressVPN)

### 3️⃣ Frontend'i Başlat

```bash
cd frontend
npm run dev
```

Frontend `http://localhost:3003` adresinde çalışacak.

## ✅ Test Et

### Admin Panel
1. Admin olarak giriş yap
2. Sol menüden **"Affiliate"** sekmesine tıkla
3. İstatistikleri gör:
   - Toplam tıklama
   - Dönüşüm sayısı
   - Dönüşüm oranı
   - Toplam gelir
4. Affiliate linklerini yönet:
   - Yeni link ekle
   - Mevcut linkleri düzenle
   - Test link butonuyla test et

### Blog Sayfası
1. `http://localhost:3003/blog` adresine git
2. Sağ sidebar'da widget'ları gör:
   - 💎 UC Satın Al widget'ı
   - 🎮 Gaming Ürünleri widget'ı
3. Herhangi bir blog yazısına tıkla
4. Detay sayfasında da aynı widget'ları gör

### Affiliate Link Test
1. Admin panelinde bir linkin yanındaki **"Test Link"** (🔗) butonuna tıkla
2. Yeni sekmede affiliate URL'e yönlendirileceksin
3. Backend'de click otomatik kaydedilecek
4. Admin paneline dön ve tıklama sayısının arttığını gör

## 📊 Özellikler

### Otomatik Tracking
- Her tıklama kaydedilir (IP, user agent, referrer)
- Kullanıcı giriş yaptıysa user ID kaydedilir
- Click count otomatik artar

### Widget'lar
- Kategoriye göre filtreleme
- Responsive tasarım
- Hover efektleri
- Rating ve fiyat gösterimi

### Admin Panel
- Link CRUD operasyonları
- Gerçek zamanlı istatistikler
- Filtreleme ve pagination
- Aktif/pasif toggle

## 🔗 Önemli URL'ler

### Frontend
- Blog: `http://localhost:3003/blog`
- Admin Affiliate: `http://localhost:3003/admin/affiliates`

### Backend API
- Redirect: `http://localhost:3001/api/v1/affiliates/go/:shortCode`
- Featured: `http://localhost:3001/api/v1/affiliates/featured`
- Admin: `http://localhost:3001/api/v1/affiliates/admin/*`

## 💡 İpuçları

### Yeni Affiliate Link Eklemek
1. Admin panelinde **"Yeni Link"** butonuna tıkla
2. Formu doldur:
   - Ürün adı
   - Affiliate URL
   - Kısa kod (örn: `gaming-mouse-2`)
   - Provider (Amazon, Codashop, vb.)
   - Kategori
   - Komisyon oranı
   - Fiyat
   - Görsel URL
3. **"Oluştur"** butonuna tıkla

### Widget'ları Özelleştirmek

```tsx
// UC Widget (sabit paketler)
<UCPurchaseWidget />

// Affiliate Widget (özelleştirilebilir)
<AffiliateWidget 
  category="gaming-gear"  // Kategori filtresi
  limit={6}               // Gösterilecek ürün sayısı
  title="🎮 Önerilen Ürünler"  // Başlık
/>
```

### Kısa Kod Formatı
- UC paketleri: `uc-60`, `uc-325`, `uc-660`
- Gaming ürünleri: `gaming-mouse-1`, `gaming-headset-1`
- VPN: `vpn-nord-2y`, `vpn-express-1y`

## 🎯 Gelir Takibi

### İstatistikler
Admin panelinde 4 ana metrik:
1. **Toplam Tıklama**: Kaç kişi linke tıkladı
2. **Dönüşüm**: Kaç kişi satın aldı
3. **Dönüşüm Oranı**: Tıklama/Dönüşüm yüzdesi
4. **Toplam Gelir**: Kazanılan komisyon

### Conversion Ekleme (Manuel)
Affiliate provider'dan conversion bildirimi geldiğinde:
1. Admin panelinde conversions endpoint'ini kullan
2. Veya API'ye POST isteği gönder:

```bash
POST /affiliates/admin/conversions
{
  "link_id": "uuid",
  "user_id": "uuid",  # opsiyonel
  "amount": 99.99,
  "commission": 4.99,
  "status": "approved"
}
```

## 🐛 Sorun Giderme

### Backend başlamıyor
- PostgreSQL çalışıyor mu kontrol et
- `.env` dosyası var mı kontrol et
- `npm install` çalıştırdın mı?

### Widget'lar görünmüyor
- Backend çalışıyor mu?
- API URL doğru mu? (`NEXT_PUBLIC_API_URL`)
- Console'da hata var mı?

### Affiliate linkler çalışmıyor
- Seed script çalıştırıldı mı?
- Database'de linkler var mı?
- Short code doğru mu?

## 📚 Daha Fazla Bilgi

Detaylı dokümantasyon için:
- `AFFILIATE_REVENUE_STRATEGY.md` - Strateji ve gelir modeli
- `AFFILIATE_SYSTEM_COMPLETED.md` - Teknik detaylar

---

**Hazır! Artık affiliate sisteminiz çalışıyor! 🎉**
