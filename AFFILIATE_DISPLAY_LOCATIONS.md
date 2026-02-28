# Affiliate Linklerin Görüntülendiği Yerler

## 📍 Şu Anda Aktif Olan Yerler

### 1. Blog Ana Sayfası (`/blog`)
**Konum**: Sağ sidebar
**Widget'lar**:
- ✅ UC Purchase Widget (6 UC paketi)
- ✅ Affiliate Widget (Gaming Gear kategorisi, 6 ürün)

**Dosya**: `frontend/app/blog/page.tsx`

### 2. Blog Detay Sayfası (`/blog/[category]/[slug]`)
**Konum**: Sağ sidebar
**Widget'lar**:
- ✅ UC Purchase Widget (6 UC paketi)
- ✅ Affiliate Widget (Gaming Gear kategorisi, 6 ürün)

**Dosya**: `frontend/app/blog/[category]/[slug]/page.tsx`

---

## 🎯 Eklenebilecek Yerler

### 1. Ana Sayfa (`/`)
**Önerilen Konum**: Hero section'ın altında veya sidebar
**Önerilen Widget**: UC Purchase Widget + Top Gaming Gear
```tsx
<UCPurchaseWidget />
<AffiliateWidget category="gaming-gear" limit={4} title="🎮 Gaming Ekipmanları" />
```

### 2. İlanlar Sayfası (`/ilanlar` veya `/posts`)
**Önerilen Konum**: Sağ sidebar (blog gibi)
**Önerilen Widget**: UC Purchase Widget + VPN
```tsx
<UCPurchaseWidget />
<AffiliateWidget category="vpn" limit={2} title="🔒 Güvenli Oyun İçin VPN" />
```

### 3. İlan Detay Sayfası (`/ilanlar/[slug]`)
**Önerilen Konum**: Sağ sidebar veya içerik altı
**Önerilen Widget**: UC Purchase Widget + Gaming Gear
```tsx
<UCPurchaseWidget />
<AffiliateWidget category="gaming-gear" limit={4} title="🎮 Oyun Ekipmanları" />
```

### 4. Profil Sayfası (`/profile`)
**Önerilen Konum**: Sidebar veya dashboard widget'ı
**Önerilen Widget**: UC Purchase Widget
```tsx
<UCPurchaseWidget />
```

### 5. Premium Sayfası (`/premium`)
**Önerilen Konum**: Sayfa içeriği arasında
**Önerilen Widget**: Tüm kategoriler
```tsx
<AffiliateWidget limit={8} title="🎁 Önerilen Ürünler" />
```

---

## 🛠️ Widget Kullanımı

### UC Purchase Widget
```tsx
import { UCPurchaseWidget } from '@/components/UCPurchaseWidget';

<UCPurchaseWidget />
```
- Sabit 6 UC paketi gösterir
- Codashop affiliate linkleri
- Bonus miktarlarını gösterir

### Affiliate Widget
```tsx
import { AffiliateWidget } from '@/components/AffiliateWidget';

// Tüm kategoriler
<AffiliateWidget limit={6} title="🎮 Önerilen Ürünler" />

// Sadece Gaming Gear
<AffiliateWidget 
  category="GAMING_GEAR" 
  limit={4} 
  title="🎮 Gaming Ekipmanları" 
/>

// Sadece VPN
<AffiliateWidget 
  category="VPN" 
  limit={2} 
  title="🔒 VPN Servisleri" 
/>

// Sadece UC
<AffiliateWidget 
  category="UC" 
  limit={6} 
  title="⚡ UC Paketleri" 
/>

// Sadece Accessories
<AffiliateWidget 
  category="ACCESSORIES" 
  limit={4} 
  title="📱 Aksesuarlar" 
/>
```

### Kategoriler
- `UC` - UC paketleri
- `GAMING_GEAR` - Gaming mouse, kulaklık, klavye
- `VPN` - VPN servisleri
- `ACCESSORIES` - Powerbank, kablo vb.
- `SOFTWARE` - Yazılımlar
- `OTHER` - Diğer

---

## 📊 Görüntüleme Stratejisi

### Yüksek Trafikli Sayfalar (Öncelikli)
1. ✅ Blog sayfaları (Aktif)
2. 🔲 Ana sayfa
3. 🔲 İlanlar listesi
4. 🔲 İlan detay sayfaları

### Orta Trafikli Sayfalar
5. 🔲 Profil sayfası
6. 🔲 Premium sayfası
7. 🔲 Hakkımızda sayfası

### Düşük Trafikli Sayfalar
8. 🔲 İletişim sayfası
9. 🔲 Yardım sayfası

---

## 💡 Öneriler

### 1. Contextual Placement (Bağlamsal Yerleştirme)
- **İlan sayfalarında**: UC ve Gaming Gear
- **Blog sayfalarında**: Konuyla ilgili ürünler
- **Profil sayfasında**: UC paketleri
- **Premium sayfasında**: Tüm kategoriler

### 2. A/B Testing
- Farklı konumlarda test et
- Tıklama oranlarını ölç
- En iyi performans gösteren yerleri kullan

### 3. Responsive Design
- Mobilde sidebar yerine içerik altına koy
- Tablet'te 2 sütun layout kullan
- Desktop'ta sidebar kullan

### 4. Loading States
- Widget'lar yüklenirken skeleton göster
- Hata durumunda sessizce gizle
- Veri yoksa widget'ı gösterme

---

## 🎨 Örnek Layout

### Blog/İlan Detay Sayfası Layout
```
┌─────────────────────────────────────────────────────┐
│                    Navbar                           │
├─────────────────────────────┬───────────────────────┤
│                             │                       │
│                             │  ┌─────────────────┐  │
│                             │  │ UC Purchase     │  │
│      Ana İçerik             │  │ Widget          │  │
│      (Blog/İlan)            │  └─────────────────┘  │
│                             │                       │
│                             │  ┌─────────────────┐  │
│                             │  │ Affiliate       │  │
│                             │  │ Widget          │  │
│                             │  │ (Gaming Gear)   │  │
│                             │  └─────────────────┘  │
│                             │                       │
└─────────────────────────────┴───────────────────────┘
```

### Ana Sayfa Layout
```
┌─────────────────────────────────────────────────────┐
│                    Navbar                           │
├─────────────────────────────────────────────────────┤
│                  Hero Section                       │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ UC Widget    │  │ Gaming Gear  │  │ VPN      │  │
│  │ (Horizontal) │  │ Widget       │  │ Widget   │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
├─────────────────────────────────────────────────────┤
│                  Diğer İçerik                       │
└─────────────────────────────────────────────────────┘
```

---

## 📈 Gelir Optimizasyonu

### Yüksek Dönüşüm Potansiyeli
1. **UC Widget**: Blog ve ilan sayfalarında (oyuncular zaten PUBG içeriği arıyor)
2. **Gaming Gear**: İlan detay sayfalarında (ciddi oyuncular)
3. **VPN**: Blog yazılarında (güvenlik/performans konuları)

### Orta Dönüşüm Potansiyeli
4. **Accessories**: Tüm sayfalarda (düşük fiyat, kolay karar)
5. **Software**: Premium sayfasında

---

**Güncelleme Tarihi**: 2026-02-28
**Durum**: Aktif ve Genişletilebilir
