# Dinamik Footer ve Menü Sistemi

## ✅ Yapılan Değişiklikler

### 1. Footer Dinamik Hale Getirildi
- Footer component'i artık veritabanından menüleri çekiyor
- Admin panelinden yapılan değişiklikler otomatik olarak sitede görünüyor
- Fallback mekanizması: API başarısız olursa hardcoded menüler gösteriliyor

### 2. Public API Endpoint'leri Eklendi
```
GET /api/v1/menu-items?location=FOOTER  - Footer menülerini getir (public)
GET /api/v1/pages/:slug                  - Sayfa içeriğini getir (public)
```

### 3. Veritabanı Senkronizasyonu
Mevcut menüler zaten veritabanında:
- **HEADER**: 3 menü öğesi (İlanlar, Premium, Hakkımızda)
- **FOOTER**: 8 menü öğesi (Platform + Destek kategorileri)

## 🎯 Nasıl Çalışıyor?

### Admin Panelinde Menü Düzenleme
1. Admin Panel → **Menüler** (`/admin/content/menus`)
2. **FOOTER** sekmesini seç
3. Menü öğelerini düzenle:
   - **Platform kategorisi**: Sıra 1-10 arası
   - **Destek kategorisi**: Sıra 11-20 arası
4. Değişiklikler anında sitede görünür (5 dakika cache)

### Menü Kategorileri
Footer'da 2 kategori var:
- **Platform** (order: 1-10): İlanlar, Hakkımızda, Premium, Blog
- **Destek** (order: 11-20): Yardım Merkezi, İletişim, Gizlilik, Kullanım Şartları

### Yeni Menü Ekleme
1. Admin Panel → Menüler → FOOTER
2. "Yeni Menü Öğesi" butonuna tıkla
3. Formu doldur:
   - **Etiket**: "Kariyer"
   - **URL**: "/careers"
   - **Konum**: FOOTER
   - **Sıra**: 5 (Platform kategorisine eklemek için)
   - **Aktif**: ✓
4. Kaydet
5. Footer'da "Platform" kategorisinde görünür

## 🔄 Cache Mekanizması

Footer menüleri 5 dakika cache'leniyor:
```typescript
staleTime: 5 * 60 * 1000, // 5 minutes
```

Cache'i temizlemek için:
- Sayfayı yenile (hard refresh: Cmd+Shift+R)
- 5 dakika bekle (otomatik yenilenir)

## 🛡️ Güvenlik

### Public Endpoints
- Authentication gerektirmiyor
- Sadece aktif (`is_active: true`) menüler gösteriliyor
- Sadece yayında (`status: PUBLISHED`) sayfalar gösteriliyor

### Admin Endpoints
- JWT authentication gerekli
- Permission kontrolü: `content:read`, `content:write`, `content:delete`
- Audit log kaydı

## 📊 Veritabanı Yapısı

### Menu Items
```sql
SELECT label, url, location, "order", is_active 
FROM menu_items 
WHERE location = 'FOOTER' 
ORDER BY "order";
```

**Mevcut Footer Menüleri:**
| Label | URL | Order | Kategori |
|-------|-----|-------|----------|
| İlanlar | /posts | 1 | Platform |
| Hakkımızda | /about | 2 | Platform |
| Premium | /premium | 3 | Platform |
| Blog | /blog | 4 | Platform |
| Yardım Merkezi | /help | 11 | Destek |
| İletişim | /contact | 12 | Destek |
| Gizlilik Politikası | /privacy | 13 | Destek |
| Kullanım Şartları | /terms | 14 | Destek |

## 🎨 Frontend Entegrasyonu

### Footer Component
```typescript
// Dinamik menü çekme
const { data: menuData } = useQuery({
    queryKey: ['menu-items', 'FOOTER'],
    queryFn: async () => {
        const response = await api.get('/menu-items?location=FOOTER');
        return response.data;
    },
});

// Kategorilere ayırma
const platformItems = footerItems.filter(item => item.order >= 1 && item.order <= 10);
const supportItems = footerItems.filter(item => item.order >= 11 && item.order <= 20);
```

### Fallback Mekanizması
API başarısız olursa veya menü yoksa, hardcoded menüler gösteriliyor:
```typescript
{platformItems.length > 0 ? (
    // Dinamik menüler
) : (
    // Fallback hardcoded menüler
)}
```

## 🚀 Kullanım Senaryoları

### Senaryo 1: Yeni Sayfa ve Menü Ekleme
1. **Sayfa Oluştur**:
   - Admin Panel → Sayfalar → Yeni Sayfa
   - Başlık: "Kariyer"
   - Slug: "careers"
   - İçerik: HTML içerik
   - Durum: Yayında
   - Kaydet

2. **Menü Ekle**:
   - Admin Panel → Menüler → FOOTER
   - Yeni Menü Öğesi
   - Etiket: "Kariyer"
   - URL: "/careers"
   - Sıra: 5
   - Kaydet

3. **Sonuç**: Footer'da "Kariyer" linki görünür, tıklandığında sayfa açılır

### Senaryo 2: Menü Sırasını Değiştirme
1. Admin Panel → Menüler → FOOTER
2. "Premium" menüsünü düzenle
3. Sıra: 1 (en üste taşımak için)
4. Kaydet
5. Footer'da "Premium" en üstte görünür

### Senaryo 3: Menüyü Geçici Gizleme
1. Admin Panel → Menüler → FOOTER
2. "Blog" menüsünün yanındaki göz ikonuna tıkla
3. Menü pasif olur (`is_active: false`)
4. Footer'da "Blog" linki görünmez
5. Tekrar aktif etmek için göz ikonuna tıkla

## 🔧 Troubleshooting

### Menü Değişiklikleri Görünmüyor
- **Sebep**: Cache
- **Çözüm**: Hard refresh (Cmd+Shift+R) veya 5 dakika bekle

### API Hatası
- **Sebep**: Backend çalışmıyor
- **Çözüm**: Fallback menüler gösterilir, backend'i başlat

### Menü Kategorisi Yanlış
- **Sebep**: Order numarası yanlış
- **Çözüm**: 
  - Platform için: 1-10 arası
  - Destek için: 11-20 arası

## 📝 Gelecek Geliştirmeler

- [ ] Navbar'ı da dinamik yap
- [ ] Menü kategorilerini dinamik yap (şu an hardcoded: Platform, Destek)
- [ ] Alt menü desteği (dropdown)
- [ ] Menü ikonları (emoji veya icon library)
- [ ] Menü önizleme
- [ ] Toplu menü işlemleri

## 🎯 Sonuç

Artık footer tamamen dinamik! Admin panelinden:
✅ Menü ekleyebilirsin
✅ Menü düzenleyebilirsin
✅ Menü silebilirsin
✅ Menü sırasını değiştirebilirsin
✅ Menüyü aktif/pasif yapabilirsin

Tüm değişiklikler anında sitede görünür (5 dakika cache ile).
