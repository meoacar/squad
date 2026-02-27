# İçerik Yönetim Sistemi Kullanım Kılavuzu

## 🎯 Genel Bakış

Admin panelinden artık şunları yönetebilirsiniz:
1. **Statik Sayfalar** - Hakkımızda, İletişim, Gizlilik Politikası, vb.
2. **Menü Öğeleri** - Header, Footer ve Sidebar menüleri

## 📄 Sayfa Yönetimi

### Erişim
- Admin Panel → **Sayfalar** menüsü
- URL: `http://localhost:3003/admin/content/pages`

### Özellikler
✅ Sayfa oluşturma, düzenleme, silme
✅ SEO ayarları (meta title, meta description)
✅ Durum yönetimi (Taslak, Yayında, Arşiv)
✅ Görüntülenme sayısı takibi
✅ Slug (URL) yönetimi
✅ İçerik editörü

### Sayfa Alanları
- **Başlık**: Sayfa başlığı
- **Slug**: URL'de görünecek kısım (örn: `/about`, `/contact`)
- **İçerik**: HTML destekli sayfa içeriği
- **Özet**: Kısa açıklama
- **Meta Başlık**: SEO için sayfa başlığı
- **Meta Açıklama**: SEO için sayfa açıklaması
- **Durum**: 
  - `DRAFT` - Taslak (görünmez)
  - `PUBLISHED` - Yayında (görünür)
  - `ARCHIVED` - Arşiv (görünmez)

### Varsayılan Sayfalar
Sistem kurulumunda otomatik oluşturulan sayfalar:
1. **Hakkımızda** (`/about`)
2. **İletişim** (`/contact`)
3. **Gizlilik Politikası** (`/privacy`)
4. **Kullanım Şartları** (`/terms`)
5. **Yardım Merkezi** (`/help`)

## 🔗 Menü Yönetimi

### Erişim
- Admin Panel → **Menüler** menüsü
- URL: `http://localhost:3003/admin/content/menus`

### Menü Konumları
1. **HEADER** - Üst menü (Navbar)
2. **FOOTER** - Alt menü (Footer)
3. **SIDEBAR** - Yan menü (gelecekte kullanılabilir)

### Özellikler
✅ Menü öğesi ekleme, düzenleme, silme
✅ Sıralama (order)
✅ Aktif/Pasif durumu
✅ Yeni sekmede açma seçeneği
✅ İkon desteği
✅ Konum bazlı gruplama

### Menü Öğesi Alanları
- **Etiket**: Menüde görünecek metin
- **URL**: Link adresi (örn: `/posts`, `/about`)
- **Konum**: HEADER, FOOTER veya SIDEBAR
- **Sıra**: Menüdeki sıralama numarası
- **İkon**: Emoji veya ikon (opsiyonel)
- **Aktif**: Menüde görünsün mü?
- **Yeni Sekmede Aç**: Link yeni sekmede açılsın mı?

### Varsayılan Menü Öğeleri

**Header Menü:**
1. İlanlar (`/posts`)
2. Premium (`/premium`)
3. Hakkımızda (`/about`)

**Footer Menü - Platform:**
1. İlanlar (`/posts`)
2. Hakkımızda (`/about`)
3. Premium (`/premium`)
4. Blog (`/blog`)

**Footer Menü - Destek:**
1. Yardım Merkezi (`/help`)
2. İletişim (`/contact`)
3. Gizlilik Politikası (`/privacy`)
4. Kullanım Şartları (`/terms`)

## 🔧 Backend API

### Sayfa Endpoints
```
GET    /api/v1/admin/pages              - Tüm sayfaları listele
GET    /api/v1/admin/pages/:id          - Sayfa detayı
POST   /api/v1/admin/pages              - Yeni sayfa oluştur
PATCH  /api/v1/admin/pages/:id          - Sayfa güncelle
DELETE /api/v1/admin/pages/:id          - Sayfa sil
```

### Menü Endpoints
```
GET    /api/v1/admin/menu-items         - Tüm menü öğelerini listele
GET    /api/v1/admin/menu-items/:id     - Menü öğesi detayı
POST   /api/v1/admin/menu-items         - Yeni menü öğesi oluştur
PATCH  /api/v1/admin/menu-items/:id     - Menü öğesi güncelle
DELETE /api/v1/admin/menu-items/:id     - Menü öğesi sil
POST   /api/v1/admin/menu-items/reorder - Menü öğelerini yeniden sırala
```

## 💾 Veritabanı

### Pages Tablosu
```sql
CREATE TABLE pages (
    id UUID PRIMARY KEY,
    slug VARCHAR UNIQUE,
    title VARCHAR,
    content TEXT,
    excerpt TEXT,
    meta_title TEXT,
    meta_description TEXT,
    status VARCHAR DEFAULT 'DRAFT',
    view_count INTEGER DEFAULT 0,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Menu Items Tablosu
```sql
CREATE TABLE menu_items (
    id UUID PRIMARY KEY,
    label VARCHAR,
    url VARCHAR,
    location VARCHAR DEFAULT 'FOOTER',
    parent_id UUID,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    open_in_new_tab BOOLEAN DEFAULT false,
    icon VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## 🎨 Frontend Entegrasyonu

### Footer Component
Footer component'i artık dinamik menüleri kullanabilir:

```typescript
// Gelecekte eklenecek
const { data: menuItems } = useQuery({
    queryKey: ['menu-items', 'FOOTER'],
    queryFn: async () => {
        const response = await api.get('/menu-items?location=FOOTER');
        return response.data;
    },
});
```

### Sayfa Görüntüleme
Statik sayfalar için dinamik route oluşturulabilir:

```typescript
// frontend/app/[slug]/page.tsx
export default async function Page({ params }: { params: { slug: string } }) {
    const page = await fetch(`/api/v1/pages/${params.slug}`).then(r => r.json());
    return <div dangerouslySetInnerHTML={{ __html: page.content }} />;
}
```

## 🔐 Güvenlik

### Permissions
- `content:read` - Sayfa ve menü okuma
- `content:write` - Sayfa ve menü oluşturma/güncelleme
- `content:delete` - Sayfa ve menü silme

### Audit Log
Tüm işlemler audit log'a kaydedilir:
- `PAGE_CREATED` - Sayfa oluşturuldu
- `PAGE_UPDATED` - Sayfa güncellendi
- `PAGE_DELETED` - Sayfa silindi
- `MENU_ITEM_CREATED` - Menü öğesi oluşturuldu
- `MENU_ITEM_UPDATED` - Menü öğesi güncellendi
- `MENU_ITEM_DELETED` - Menü öğesi silindi
- `MENU_ITEMS_REORDERED` - Menü öğeleri yeniden sıralandı

## 📝 Kullanım Örnekleri

### Yeni Sayfa Ekleme
1. Admin Panel → Sayfalar
2. "Yeni Sayfa" butonuna tıkla
3. Formu doldur:
   - Başlık: "SSS"
   - Slug: "faq"
   - İçerik: HTML içerik
   - Durum: "Yayında"
4. "Oluştur" butonuna tıkla
5. Sayfa `/faq` URL'inde yayına girer

### Menü Öğesi Ekleme
1. Admin Panel → Menüler
2. Konum seç (HEADER veya FOOTER)
3. "Yeni Menü Öğesi" butonuna tıkla
4. Formu doldur:
   - Etiket: "SSS"
   - URL: "/faq"
   - Konum: "FOOTER"
   - Sıra: 15
   - Aktif: ✓
5. "Oluştur" butonuna tıkla
6. Menü öğesi footer'da görünür

### Menü Sıralama
1. Admin Panel → Menüler
2. Konum seç
3. Menü öğelerinin yanındaki sıra numarasını değiştir
4. Veya drag & drop ile sürükle (gelecekte eklenecek)

## 🚀 Gelecek Özellikler

### Planlanan
- [ ] Rich text editor (WYSIWYG)
- [ ] Medya yöneticisi (resim, video upload)
- [ ] Sayfa şablonları
- [ ] Çoklu dil desteği
- [ ] Sayfa versiyonlama
- [ ] Drag & drop menü sıralama
- [ ] Menü hiyerarşisi (alt menüler)
- [ ] Sayfa önizleme
- [ ] Toplu işlemler

## 🎯 Sonuç

Artık admin panelinden:
✅ Footer'daki tüm linkleri düzenleyebilirsiniz
✅ Yeni statik sayfalar oluşturabilirsiniz
✅ Navbar menülerini yönetebilirsiniz
✅ SEO ayarlarını yapabilirsiniz
✅ Sayfa içeriklerini güncelleyebilirsiniz

**Test Etmek İçin:**
1. http://localhost:3003/admin/content/pages - Sayfa yönetimi
2. http://localhost:3003/admin/content/menus - Menü yönetimi
