# Dinamik Sayfa Sistemi

## ✅ Tamamlandı!

Artık tüm sayfalar admin panelinden yönetiliyor ve sitede dinamik olarak görünüyor!

## 🎯 Nasıl Çalışıyor?

### 1. Admin Panelinden Sayfa Düzenleme
1. Admin Panel → **Sayfalar**
2. Düzenlemek istediğin sayfayı seç (örn: Hakkımızda)
3. İçeriği düzenle
4. Kaydet
5. Sitede `/about` adresine git
6. Değişiklikler anında görünür!

### 2. Dinamik Route
- **Route**: `frontend/app/[slug]/page.tsx`
- **Çalışma**: URL'deki slug'a göre veritabanından sayfa çeker
- **Örnek**: 
  - `/about` → `slug: "about"` → Veritabanından "about" sayfası
  - `/contact` → `slug: "contact"` → Veritabanından "contact" sayfası
  - `/privacy` → `slug: "privacy"` → Veritabanından "privacy" sayfası

### 3. Mevcut Sayfalar
Veritabanında 5 sayfa var:
- `/about` - Hakkımızda
- `/contact` - İletişim
- `/privacy` - Gizlilik Politikası
- `/terms` - Kullanım Şartları
- `/help` - Yardım Merkezi

## 📝 Sayfa Düzenleme

### Admin Panelinden
1. **Başlık**: Sayfa başlığı
2. **Slug**: URL'de görünecek kısım (örn: `about`)
3. **İçerik**: HTML destekli içerik
4. **Özet**: Kısa açıklama
5. **Meta Başlık**: SEO için
6. **Meta Açıklama**: SEO için
7. **Durum**: 
   - `PUBLISHED` - Yayında (sitede görünür)
   - `DRAFT` - Taslak (sitede görünmez)
   - `ARCHIVED` - Arşiv (sitede görünmez)

### HTML İçerik Desteği
Sayfa içeriğinde HTML kullanabilirsin:

```html
<h1>Ana Başlık</h1>
<h2>Alt Başlık</h2>
<p>Paragraf metni</p>
<ul>
  <li>Liste öğesi 1</li>
  <li>Liste öğesi 2</li>
</ul>
<a href="/link">Link</a>
<strong>Kalın metin</strong>
<em>İtalik metin</em>
```

## 🎨 Sayfa Görünümü

### Özellikler
- ✅ Responsive tasarım
- ✅ Dark theme
- ✅ Prose styling (güzel tipografi)
- ✅ Görüntülenme sayısı
- ✅ Güncelleme tarihi
- ✅ SEO meta tags
- ✅ 404 sayfası

### Stil Özellikleri
- Başlıklar: Beyaz, bold
- Paragraflar: Açık gri, okunabilir
- Linkler: Mor, hover efekti
- Kod blokları: Dark background, syntax highlight
- Tablolar: Border, hover efekti
- Blockquote: Sol border, italik

## 🔄 Sayfa Güncelleme Akışı

### Senaryo: "Hakkımızda" Sayfasını Güncelle

1. **Admin Panel'e Git**
   - http://localhost:3003/admin/content/pages

2. **"Hakkımızda" Sayfasını Bul**
   - Slug: `about`
   - Düzenle butonuna tıkla

3. **İçeriği Güncelle**
   ```html
   <h1>Squadbul Hakkında</h1>
   <p>PUBG Mobile için Türkiye'nin en büyük klan ve oyuncu eşleştirme platformu.</p>
   
   <h2>Misyonumuz</h2>
   <p>En iyi takım arkadaşlarını bulmana yardımcı olmak!</p>
   
   <h2>Vizyonumuz</h2>
   <p>Türkiye'nin #1 PUBG Mobile platformu olmak.</p>
   ```

4. **Kaydet**

5. **Siteye Git**
   - http://localhost:3003/about
   - Değişiklikler anında görünür!

## 📊 Görüntülenme Sayısı

Her sayfa ziyaret edildiğinde:
- Veritabanında `view_count` otomatik artar
- Sayfa üstünde görüntülenme sayısı gösterilir
- Admin panelinde istatistik olarak görünür

## 🔐 Durum Yönetimi

### PUBLISHED (Yayında)
- Sitede görünür
- Herkes erişebilir
- SEO indexlenir

### DRAFT (Taslak)
- Sitede görünmez
- 404 hatası verir
- Admin panelinde görünür

### ARCHIVED (Arşiv)
- Sitede görünmez
- 404 hatası verir
- Admin panelinde görünür

## 🚀 Yeni Sayfa Ekleme

### Örnek: "SSS" Sayfası Ekle

1. **Admin Panel → Sayfalar → Yeni Sayfa**

2. **Form Doldur**:
   ```
   Başlık: Sık Sorulan Sorular
   Slug: faq
   İçerik:
   <h1>Sık Sorulan Sorular</h1>
   
   <h2>Nasıl üye olabilirim?</h2>
   <p>Kayıt ol butonuna tıklayarak...</p>
   
   <h2>Premium üyelik nedir?</h2>
   <p>Premium üyelik ile...</p>
   
   Durum: Yayında
   ```

3. **Kaydet**

4. **Menüye Ekle**:
   - Admin Panel → Menüler → FOOTER
   - Yeni Menü Öğesi
   - Etiket: "SSS"
   - URL: "/faq"
   - Kaydet

5. **Sonuç**:
   - Sayfa: http://localhost:3003/faq
   - Footer'da "SSS" linki görünür

## 🎯 SEO Optimizasyonu

### Meta Tags
Her sayfa için:
- `<title>` - Meta başlık veya sayfa başlığı
- `<meta name="description">` - Meta açıklama veya özet
- Otomatik oluşturulan metadata

### Örnek
```typescript
// Admin panelde:
Meta Başlık: "Hakkımızda - Squadbul | PUBG Mobile Platformu"
Meta Açıklama: "Squadbul, PUBG Mobile için Türkiye'nin en büyük klan ve oyuncu eşleştirme platformudur."

// HTML'de:
<title>Hakkımızda - Squadbul | PUBG Mobile Platformu</title>
<meta name="description" content="Squadbul, PUBG Mobile için...">
```

## 🔧 Teknik Detaylar

### API Endpoint
```
GET /api/v1/pages/:slug
```

**Response**:
```json
{
  "id": "uuid",
  "slug": "about",
  "title": "Hakkımızda",
  "content": "<h1>...</h1>",
  "excerpt": "Kısa açıklama",
  "meta_title": "SEO başlık",
  "meta_description": "SEO açıklama",
  "status": "PUBLISHED",
  "view_count": 123,
  "created_at": "2026-02-26T...",
  "updated_at": "2026-02-26T..."
}
```

### Server-Side Rendering
- Next.js App Router kullanılıyor
- Server component (SSR)
- Her istek için fresh data
- SEO friendly

### 404 Handling
- Sayfa bulunamazsa `notFound()` çağrılır
- Custom 404 sayfası gösterilir
- Kullanıcı dostu hata mesajı

## 💡 İpuçları

1. **HTML Güvenliği**: `dangerouslySetInnerHTML` kullanılıyor, güvenilir içerik gir
2. **Slug Benzersiz**: Her slug unique olmalı
3. **SEO**: Meta başlık ve açıklama mutlaka doldur
4. **İçerik**: HTML etiketlerini doğru kapat
5. **Test**: Kaydettikten sonra mutlaka sitede kontrol et

## 🎉 Özet

Artık:
- ✅ Tüm sayfalar dinamik
- ✅ Admin panelinden düzenlenebilir
- ✅ Değişiklikler anında görünür
- ✅ SEO optimized
- ✅ Görüntülenme sayısı takibi
- ✅ Durum yönetimi (yayın/taslak/arşiv)
- ✅ 404 sayfası
- ✅ Responsive tasarım

**Test Et**:
1. http://localhost:3003/about
2. http://localhost:3003/contact
3. http://localhost:3003/privacy
4. http://localhost:3003/terms
5. http://localhost:3003/help

Hepsi çalışıyor! 🚀
