# Affiliate Linkleri Nasıl Eklenir?

## 📍 Şu Anda Nerede Görünüyor?

### ✅ Aktif Yerler

1. **Blog Ana Sayfası** (`/blog`)
   - Sağ sidebar'da UC Purchase Widget
   - Sağ sidebar'da Gaming Gear Widget

2. **Blog Detay Sayfası** (`/blog/[category]/[slug]`)
   - Sağ sidebar'da UC Purchase Widget
   - Sağ sidebar'da Gaming Gear Widget

---

## 🎯 Yeni Yerlere Nasıl Eklenir?

### Adım 1: Widget'ları Import Et

```tsx
import { UCPurchaseWidget } from '@/components/UCPurchaseWidget';
import { AffiliateWidget } from '@/components/AffiliateWidget';
```

### Adım 2: Sayfaya Ekle

#### Örnek 1: Ana Sayfaya Eklemek (`frontend/app/page.tsx`)

Hero section'dan sonra, öne çıkan ilanlardan önce:

```tsx
{/* Hero Section */}
<section>
  {/* ... mevcut hero içeriği ... */}
</section>

{/* Affiliate Widgets - YENİ EKLEME */}
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <UCPurchaseWidget />
    <AffiliateWidget 
      category="GAMING_GEAR" 
      limit={4} 
      title="🎮 Gaming Ekipmanları" 
    />
    <AffiliateWidget 
      category="VPN" 
      limit={2} 
      title="🔒 Güvenli Oyun İçin VPN" 
    />
  </div>
</section>

{/* Featured Posts */}
<section>
  {/* ... mevcut öne çıkan ilanlar ... */}
</section>
```

#### Örnek 2: İlanlar Sayfasına Eklemek (`frontend/app/ilanlar/page.tsx`)

Sidebar layout kullanarak:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Ana İçerik - İlanlar */}
  <div className="lg:col-span-3">
    {/* ... mevcut ilan listesi ... */}
  </div>

  {/* Sidebar - Affiliate Widgets */}
  <div className="lg:col-span-1 space-y-6">
    <UCPurchaseWidget />
    <AffiliateWidget 
      category="GAMING_GEAR" 
      limit={4} 
      title="🎮 Gaming Ürünleri" 
    />
  </div>
</div>
```

#### Örnek 3: İlan Detay Sayfasına Eklemek (`frontend/app/ilanlar/[slug]/page.tsx`)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Ana İçerik - İlan Detayı */}
  <div className="lg:col-span-2">
    {/* ... mevcut ilan detayı ... */}
  </div>

  {/* Sidebar - Affiliate Widgets */}
  <div className="lg:col-span-1 space-y-6">
    <UCPurchaseWidget />
    <AffiliateWidget 
      category="GAMING_GEAR" 
      limit={4} 
      title="🎮 Önerilen Ürünler" 
    />
  </div>
</div>
```

---

## 🎨 Widget Çeşitleri ve Kullanımları

### 1. UC Purchase Widget
```tsx
<UCPurchaseWidget />
```
- **Ne gösterir**: 6 UC paketi (60, 325, 660, 1800, 3850, 8100 UC)
- **Özellikler**: Bonus miktarları, fiyatlar, anında teslimat
- **En iyi kullanım**: Her yerde (PUBG Mobile sitesi olduğu için)

### 2. Affiliate Widget - Tüm Kategoriler
```tsx
<AffiliateWidget 
  limit={6} 
  title="🎁 Önerilen Ürünler" 
/>
```
- **Ne gösterir**: Tüm kategorilerden en popüler 6 ürün
- **En iyi kullanım**: Ana sayfa, genel sayfalar

### 3. Affiliate Widget - Gaming Gear
```tsx
<AffiliateWidget 
  category="GAMING_GEAR" 
  limit={4} 
  title="🎮 Gaming Ekipmanları" 
/>
```
- **Ne gösterir**: Mouse, kulaklık, klavye gibi gaming ürünleri
- **En iyi kullanım**: İlan sayfaları, blog yazıları

### 4. Affiliate Widget - VPN
```tsx
<AffiliateWidget 
  category="VPN" 
  limit={2} 
  title="🔒 VPN Servisleri" 
/>
```
- **Ne gösterir**: NordVPN, ExpressVPN gibi VPN servisleri
- **En iyi kullanım**: Blog yazıları, yardım sayfaları

### 5. Affiliate Widget - Accessories
```tsx
<AffiliateWidget 
  category="ACCESSORIES" 
  limit={4} 
  title="📱 Aksesuarlar" 
/>
```
- **Ne gösterir**: Powerbank, kablo gibi aksesuarlar
- **En iyi kullanım**: Her yerde (düşük fiyat, kolay satış)

---

## 📱 Responsive Tasarım

### Desktop (lg ve üzeri)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Ana içerik */}
  </div>
  <div className="lg:col-span-1 space-y-6">
    {/* Affiliate widgets */}
    <UCPurchaseWidget />
    <AffiliateWidget category="GAMING_GEAR" limit={4} />
  </div>
</div>
```

### Tablet (md)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <UCPurchaseWidget />
  <AffiliateWidget category="GAMING_GEAR" limit={4} />
</div>
```

### Mobile (sm ve altı)
```tsx
<div className="space-y-6">
  <UCPurchaseWidget />
  <AffiliateWidget category="GAMING_GEAR" limit={4} />
</div>
```

---

## 🎯 Önerilen Yerleştirme Stratejisi

### Yüksek Öncelikli (Hemen Ekle)

1. **Ana Sayfa** (`/`)
   ```tsx
   // Hero section'dan sonra
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
     <UCPurchaseWidget />
     <AffiliateWidget category="GAMING_GEAR" limit={4} />
     <AffiliateWidget category="VPN" limit={2} />
   </div>
   ```

2. **İlanlar Listesi** (`/ilanlar`)
   ```tsx
   // Sidebar'da
   <div className="space-y-6">
     <UCPurchaseWidget />
     <AffiliateWidget category="GAMING_GEAR" limit={4} />
   </div>
   ```

3. **İlan Detay** (`/ilanlar/[slug]`)
   ```tsx
   // Sidebar'da
   <div className="space-y-6">
     <UCPurchaseWidget />
     <AffiliateWidget category="GAMING_GEAR" limit={4} />
   </div>
   ```

### Orta Öncelikli

4. **Profil Sayfası** (`/profile`)
   ```tsx
   <UCPurchaseWidget />
   ```

5. **Premium Sayfası** (`/premium`)
   ```tsx
   <AffiliateWidget limit={8} title="🎁 Premium Üyeler İçin Özel Fırsatlar" />
   ```

### Düşük Öncelikli

6. **Hakkımızda** (`/about`)
7. **İletişim** (`/contact`)
8. **Yardım** (`/help`)

---

## 💡 İpuçları

### 1. Bağlamsal Yerleştirme
- PUBG içeriği olan sayfalarda → UC Widget
- Ciddi oyuncu profili olan sayfalarda → Gaming Gear
- Güvenlik/performans konularında → VPN

### 2. Çok Fazla Widget Ekleme
- Sayfa başına maksimum 2-3 widget
- Kullanıcı deneyimini bozma
- Sayfa yükleme hızını düşürme

### 3. A/B Testing
- Farklı konumları test et
- Hangi kategoriler daha çok tıklanıyor?
- Hangi sayfalar daha çok dönüşüm sağlıyor?

### 4. Mobil Optimizasyon
- Mobilde widget'ları içerik altına koy
- Çok fazla dikey scroll gerektirme
- Küçük ekranlarda limit'i azalt

---

## 🔧 Hızlı Başlangıç Kodu

### Herhangi Bir Sayfaya Eklemek İçin

1. **Import ekle** (dosyanın en üstüne):
```tsx
import { UCPurchaseWidget } from '@/components/UCPurchaseWidget';
import { AffiliateWidget } from '@/components/AffiliateWidget';
```

2. **Widget'ı ekle** (istediğin yere):
```tsx
{/* Affiliate Widgets */}
<div className="my-8">
  <UCPurchaseWidget />
</div>
```

3. **Kaydet ve test et**:
- Sayfa otomatik yenilenecek
- Widget'lar görünmeli
- Linklere tıklayınca affiliate URL'e yönlenmeli

---

## 📊 Performans Takibi

### Admin Panelinde
1. Admin olarak giriş yap
2. Sol menüden "Affiliate" sekmesine tıkla
3. İstatistikleri gör:
   - Toplam tıklama
   - Dönüşüm oranı
   - Toplam gelir
   - En iyi performans gösteren linkler

### API ile
```bash
# Stats
curl http://localhost:3001/api/v1/affiliates/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Top performers
curl http://localhost:3001/api/v1/affiliates/admin/top-performers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ❓ Sık Sorulan Sorular

### Widget'lar görünmüyor?
- Backend çalışıyor mu? (`http://localhost:3001`)
- Veritabanında veri var mı? (`npm run seed:affiliates`)
- Console'da hata var mı?

### Linkler çalışmıyor?
- Affiliate link'in `is_active` değeri `true` mu?
- Backend'de `/affiliates/go/:shortCode` endpoint'i çalışıyor mu?

### Yeni kategori eklemek istiyorum?
1. `backend/src/affiliates/entities/affiliate-link.entity.ts` dosyasında enum'a ekle
2. Migration oluştur ve çalıştır
3. Admin panelinden yeni link ekle

---

**Güncelleme Tarihi**: 2026-02-28
**Durum**: Kullanıma Hazır
