# Affiliate + Reklam Gelir Entegrasyon Stratejisi

## 📊 Gelir Kaynakları

### 1. Affiliate Programları

#### A. Gaming Ürünleri
- **Amazon Associates**
  - Gaming kulaklıklar, mouselar, klavyeler
  - Gaming telefonlar (PUBG Mobile için optimize)
  - Powerbank ve aksesuarlar
  - Komisyon: %3-10

- **AliExpress Affiliate**
  - Uygun fiyatlı gaming aksesuarları
  - Telefon aksesuarları
  - Komisyon: %5-8

#### B. UC (PUBG Mobile Para Birimi)
- **Codashop Affiliate**
  - UC satın alma linkleri
  - Komisyon: %2-5
  
- **Razer Gold**
  - Gaming kredisi satışı
  - Komisyon: %3-7

#### C. Gaming Platformları
- **Discord Nitro**
  - Takım iletişimi için öneriler
  - Komisyon: $5-10 per sale

- **VPN Servisleri** (Düşük ping için)
  - NordVPN, ExpressVPN
  - Komisyon: %30-40

### 2. Reklam Ağları

#### A. Google AdSense
- **Yerleşim Stratejisi:**
  - Blog yazıları içinde (her 3 paragrafta bir)
  - Sidebar'da sticky banner
  - İlan listesi arasında native ads
  - Beklenen gelir: $2-5 CPM

#### B. Ezoic (AdSense alternatifi)
- AI destekli reklam optimizasyonu
- Daha yüksek CPM ($5-15)
- A/B testing otomasyonu

#### C. Direct Ads (Doğrudan Reklamlar)
- Gaming markaları ile doğrudan anlaşmalar
- Banner reklamlar
- Sponsored posts
- Beklenen gelir: $100-500/ay per sponsor

### 3. Sponsored Content

#### A. Blog Sponsorluğu
- Gaming marka incelemeleri
- Turnuva duyuruları
- Ürün tanıtımları
- Fiyat: $50-200 per post

#### B. İlan Sponsorluğu
- Öne çıkan ilanlar (zaten var)
- Boost özelliği (zaten var)
- Turnuva/etkinlik ilanları için özel paketler

## 🛠️ Teknik Implementasyon

### 1. Affiliate Link Yönetimi

#### Database Schema
```sql
CREATE TABLE affiliate_links (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    url TEXT,
    short_code VARCHAR(50) UNIQUE,
    provider VARCHAR(100), -- amazon, aliexpress, codashop
    category VARCHAR(100), -- gaming-gear, uc, vpn
    commission_rate DECIMAL(5,2),
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE affiliate_clicks (
    id UUID PRIMARY KEY,
    link_id UUID REFERENCES affiliate_links(id),
    user_id UUID REFERENCES users(id) NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    clicked_at TIMESTAMP
);

CREATE TABLE affiliate_conversions (
    id UUID PRIMARY KEY,
    link_id UUID REFERENCES affiliate_links(id),
    click_id UUID REFERENCES affiliate_clicks(id),
    user_id UUID REFERENCES users(id) NULL,
    amount DECIMAL(10,2),
    commission DECIMAL(10,2),
    status VARCHAR(50), -- pending, approved, rejected
    converted_at TIMESTAMP
);
```

#### API Endpoints
```typescript
// Affiliate link redirect
GET /aff/:shortCode
- Track click
- Redirect to affiliate URL

// Admin: Affiliate management
GET /admin/affiliates
POST /admin/affiliates
PUT /admin/affiliates/:id
DELETE /admin/affiliates/:id

// Analytics
GET /admin/affiliates/stats
GET /admin/affiliates/:id/performance
```

### 2. Reklam Alanları

#### A. Blog İçi Reklamlar
```typescript
// Blog post component'ine reklam ekleme
<article>
  <p>İçerik paragraf 1...</p>
  <p>İçerik paragraf 2...</p>
  <p>İçerik paragraf 3...</p>
  
  {/* Her 3 paragrafta bir reklam */}
  <AdUnit slot="blog-inline-1" />
  
  <p>İçerik paragraf 4...</p>
  ...
</article>
```

#### B. İlan Listesi Arası Reklamlar
```typescript
// Her 5 ilandan sonra native ad
{posts.map((post, index) => (
  <>
    <PostCard post={post} />
    {(index + 1) % 5 === 0 && (
      <NativeAd slot="post-list-native" />
    )}
  </>
))}
```

#### C. Sidebar Reklamlar
```typescript
// Sticky sidebar ad
<aside className="sticky top-20">
  <AdUnit slot="sidebar-sticky" format="rectangle" />
  
  {/* Affiliate widget */}
  <AffiliateWidget 
    title="Önerilen Ürünler"
    products={recommendedProducts}
  />
</aside>
```

### 3. Affiliate Widget Component

```typescript
// components/AffiliateWidget.tsx
interface Product {
  id: string;
  name: string;
  image: string;
  price: string;
  affiliateLink: string;
  rating: number;
}

export function AffiliateWidget({ products }: { products: Product[] }) {
  return (
    <div className="bg-white/10 rounded-xl p-4">
      <h3 className="text-white font-bold mb-4">
        🎮 Önerilen Gaming Ürünleri
      </h3>
      <div className="space-y-3">
        {products.map(product => (
          <a
            key={product.id}
            href={`/aff/${product.affiliateLink}`}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex gap-3 hover:bg-white/5 p-2 rounded-lg transition"
          >
            <img 
              src={product.image} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                {product.name}
              </p>
              <p className="text-purple-400 font-bold">
                {product.price}
              </p>
              <div className="flex items-center gap-1 text-xs text-yellow-400">
                {'⭐'.repeat(product.rating)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

### 4. UC Satış Entegrasyonu

```typescript
// components/UCPurchaseWidget.tsx
export function UCPurchaseWidget() {
  const packages = [
    { amount: 60, price: '₺7.99', bonus: 0 },
    { amount: 325, price: '₺39.99', bonus: 25 },
    { amount: 660, price: '₺79.99', bonus: 60 },
    { amount: 1800, price: '₺199.99', bonus: 300 },
  ];

  return (
    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6">
      <h3 className="text-white font-bold text-xl mb-4">
        💎 UC Satın Al
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {packages.map(pkg => (
          <a
            key={pkg.amount}
            href={`/aff/uc-${pkg.amount}`}
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition"
          >
            <div className="text-2xl font-bold text-white">
              {pkg.amount} UC
            </div>
            {pkg.bonus > 0 && (
              <div className="text-xs text-green-400">
                +{pkg.bonus} Bonus
              </div>
            )}
            <div className="text-purple-400 font-bold mt-2">
              {pkg.price}
            </div>
          </a>
        ))}
      </div>
      <p className="text-xs text-white/50 mt-4 text-center">
        Güvenli ödeme ile anında teslimat
      </p>
    </div>
  );
}
```

## 📈 Gelir Optimizasyonu Stratejileri

### 1. A/B Testing
- Farklı reklam yerleşimleri test et
- Affiliate widget pozisyonları
- CTA buton metinleri
- Reklam formatları (banner vs native)

### 2. Kullanıcı Segmentasyonu
- **Free Users**: Daha fazla reklam göster
- **Premium Users**: Daha az reklam, daha fazla affiliate
- **High-Value Users**: Özel affiliate deals

### 3. Contextual Targeting
- Blog kategorisine göre affiliate ürünler
- Kullanıcı tier'ına göre ürün önerileri
- Arama sorgularına göre reklamlar

### 4. Seasonal Campaigns
- Black Friday deals
- Yeni sezon başlangıcı
- Turnuva dönemleri
- Bayram kampanyaları

## 💰 Gelir Projeksiyonları

### Aylık Trafik: 50,000 ziyaretçi

#### Reklam Geliri
- AdSense: 50,000 × $3 CPM = $150/ay
- Direct Ads: 2 sponsor × $200 = $400/ay
- **Toplam Reklam: $550/ay**

#### Affiliate Geliri
- UC satışları: 100 conversion × $2 = $200/ay
- Gaming ürünleri: 50 conversion × $10 = $500/ay
- VPN/Servisler: 20 conversion × $15 = $300/ay
- **Toplam Affiliate: $1,000/ay**

#### Premium Abonelikler (Mevcut)
- 100 kullanıcı × $5 = $500/ay

### **Toplam Aylık Gelir: ~$2,050**

### Aylık Trafik: 200,000 ziyaretçi (6 ay sonra)
- Reklam: $2,200/ay
- Affiliate: $4,000/ay
- Premium: $1,500/ay
- **Toplam: ~$7,700/ay**

## 🎯 İlk 3 Ay Aksiyon Planı

### Ay 1: Temel Altyapı
- [ ] Affiliate link tracking sistemi
- [ ] Google AdSense entegrasyonu
- [ ] Temel affiliate widgets
- [ ] Analytics dashboard

### Ay 2: Optimizasyon
- [ ] A/B testing başlat
- [ ] Daha fazla affiliate program ekle
- [ ] Blog içerik stratejisi (SEO)
- [ ] Email marketing başlat

### Ay 3: Ölçeklendirme
- [ ] Direct ad sales başlat
- [ ] Influencer partnerships
- [ ] Sponsored content programı
- [ ] Advanced analytics

## 🔧 Gerekli Araçlar

### Analytics
- Google Analytics 4
- Google Tag Manager
- Hotjar (heatmaps)
- Affiliate tracking software

### Reklam Yönetimi
- Google AdSense
- Ezoic (opsiyonel)
- Ad rotation scripts

### Affiliate Yönetimi
- Custom tracking system
- Bitly/Short.io (link shortening)
- Affiliate dashboard

## ⚖️ Yasal Gereklilikler

### Açıklamalar
- Affiliate link açıklamaları
- Reklam politikası sayfası
- KVKK uyumluluğu
- Cookie consent

### Örnek Açıklama
```
"Bu sayfada yer alan bazı linkler affiliate linkleridir. 
Bu linkler üzerinden yapılan alışverişlerden komisyon 
kazanabiliriz. Bu sizin için ekstra bir maliyet oluşturmaz."
```

## 📊 Başarı Metrikleri

### Takip Edilecek KPI'lar
- Click-through rate (CTR)
- Conversion rate
- Revenue per visitor (RPV)
- Cost per acquisition (CPA)
- Return on ad spend (ROAS)

### Hedefler
- CTR: >2%
- Conversion rate: >1%
- RPV: >$0.04
- Monthly revenue growth: >20%

## 🚀 Hızlı Başlangıç

1. **Google AdSense başvurusu yap** (1-2 hafta onay süresi)
2. **Amazon Associates hesabı aç** (anında başla)
3. **Codashop affiliate programına katıl**
4. **Temel tracking sistemi kur**
5. **İlk affiliate widget'ları ekle**
6. **Blog içeriği üretmeye başla** (SEO için)

---

**Not:** Bu strateji, mevcut premium abonelik sisteminizi tamamlayıcı niteliktedir. 
Kullanıcı deneyimini bozmadan gelir çeşitlendirmesi sağlar.
