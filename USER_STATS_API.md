# Kullanıcı İstatistikleri API Dokümantasyonu

## Genel Bakış

Kullanıcı profil sayfasındaki istatistikler artık gerçek verilerle çalışıyor. Backend'de yeni bir endpoint oluşturuldu ve frontend bununla entegre edildi.

## Backend API

### Endpoint

```
GET /api/v1/users/me/stats
```

### Authentication

Bearer Token gereklidir (JWT)

### Response

```typescript
{
  totalPosts: number;           // Kullanıcının oluşturduğu toplam ilan sayısı
  activePosts: number;          // Aktif (ACTIVE) durumdaki ilan sayısı
  totalApplications: number;    // Kullanıcının yaptığı toplam başvuru sayısı
  acceptedApplications: number; // Kabul edilen başvuru sayısı
  favoritedBy: number;          // Kullanıcının ilanlarını favorilere ekleyen benzersiz kullanıcı sayısı
  incomingApplications: number; // Kullanıcının ilanlarına gelen toplam başvuru sayısı
}
```

### Örnek Response

```json
{
  "totalPosts": 12,
  "activePosts": 5,
  "totalApplications": 28,
  "acceptedApplications": 15,
  "favoritedBy": 34,
  "incomingApplications": 42
}
```

## Backend Implementation

### Dosyalar

1. **backend/src/users/dto/user-stats.dto.ts** (YENİ)
   - UserStatsDto interface tanımı
   - Swagger documentation

2. **backend/src/users/users.service.ts** (GÜNCELLENDİ)
   - `getUserStats(userId: string)` metodu eklendi
   - Post, Application, Favorite repository'leri eklendi
   - İstatistik hesaplamaları

3. **backend/src/users/users.controller.ts** (GÜNCELLENDİ)
   - `GET /users/me/stats` endpoint'i eklendi
   - JWT authentication
   - Swagger documentation

4. **backend/src/users/users.module.ts** (GÜNCELLENDİ)
   - Post, Application, Favorite entity'leri TypeORM'e eklendi

### İstatistik Hesaplamaları

#### 1. Total Posts
```typescript
const totalPosts = await this.postRepository.count({
    where: { created_by: userId },
});
```
Kullanıcının oluşturduğu tüm ilanlar (durum fark etmeksizin).

#### 2. Active Posts
```typescript
const activePosts = await this.postRepository.count({
    where: {
        created_by: userId,
        status: PostStatus.ACTIVE,
    },
});
```
Sadece ACTIVE durumdaki ilanlar.

#### 3. Total Applications
```typescript
const totalApplications = await this.applicationRepository.count({
    where: { applicant_id: userId },
});
```
Kullanıcının başka ilanlarına yaptığı tüm başvurular.

#### 4. Accepted Applications
```typescript
const acceptedApplications = await this.applicationRepository.count({
    where: {
        applicant_id: userId,
        status: ApplicationStatus.ACCEPTED,
    },
});
```
Kabul edilen başvurular.

#### 5. Favorited By
```typescript
const result = await this.favoriteRepository
    .createQueryBuilder('favorite')
    .select('COUNT(DISTINCT favorite.user_id)', 'count')
    .where('favorite.post_id IN (:...postIds)', { postIds })
    .getRawOne();
favoritedBy = parseInt(result.count) || 0;
```
Kullanıcının ilanlarını favorilere ekleyen benzersiz kullanıcı sayısı.

#### 6. Incoming Applications
```typescript
incomingApplications = await this.applicationRepository.count({
    where: postIds.map(postId => ({ post_id: postId })),
});
```
Kullanıcının ilanlarına gelen toplam başvuru sayısı.

## Frontend Implementation

### Değişiklikler

**frontend/app/profile/page.tsx**

```typescript
const fetchStats = async () => {
    setLoadingStats(true);
    try {
        const response = await api.get('/users/me/stats');
        setStats(response.data);
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Fallback to empty stats if API fails
        const mockStats: UserStats = {
            totalPosts: 0,
            activePosts: 0,
            totalApplications: 0,
            acceptedApplications: 0,
            favoritedBy: 0,
        };
        setStats(mockStats);
    } finally {
        setLoadingStats(false);
    }
};
```

### Kullanım

1. Kullanıcı profil sayfasına gider
2. "İstatistikler" sekmesine tıklar
3. `fetchStats()` fonksiyonu otomatik çağrılır
4. API'den gerçek veriler gelir
5. İstatistik kartları güncellenir

## İstatistik Kartları

### 1. Toplam İlan (Mavi)
- **Değer**: `stats.totalPosts`
- **Alt Bilgi**: `stats.activePosts` aktif
- **İkon**: 📝

### 2. Kabul Edilen Başvuru (Yeşil)
- **Değer**: `stats.acceptedApplications`
- **Alt Bilgi**: `stats.totalApplications` toplam başvuru
- **İkon**: ✅

### 3. Favori Ekleyen (Mor)
- **Değer**: `stats.favoritedBy`
- **Alt Bilgi**: Popülerlik göstergesi
- **İkon**: ❤️

### 4. Başarılı Eşleşme (Turuncu)
- **Değer**: `user.successful_matches`
- **Alt Bilgi**: Başarı oranı hesaplaması
- **İkon**: 🎯
- **Not**: Bu değer User entity'sinden gelir, stats API'den değil

## Performans Özeti

İstatistikler sekmesinde ayrıca:
- İtibar puanı (user.reputation_score)
- Mevcut rütbe (user.tier)
- Uyarı sayısı (user.strike_count)

Bu değerler User entity'sinden gelir.

## Hata Yönetimi

### Backend Hataları
- 401 Unauthorized: Token geçersiz veya eksik
- 500 Internal Server Error: Veritabanı hatası

### Frontend Hata Yönetimi
```typescript
try {
    const response = await api.get('/users/me/stats');
    setStats(response.data);
} catch (error) {
    console.error('Failed to fetch stats:', error);
    // Fallback to empty stats
    setStats({
        totalPosts: 0,
        activePosts: 0,
        totalApplications: 0,
        acceptedApplications: 0,
        favoritedBy: 0,
    });
}
```

## Test

### Manuel Test

1. Backend'i başlat:
```bash
cd backend
npm run start:dev
```

2. Frontend'i başlat:
```bash
cd frontend
npm run dev
```

3. Giriş yap ve profil sayfasına git
4. İstatistikler sekmesine tıkla
5. Gerçek verilerin göründüğünü doğrula

### API Test (cURL)

```bash
# Token al
TOKEN="your_jwt_token_here"

# Stats endpoint'ini test et
curl -X GET http://localhost:3001/api/v1/users/me/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Beklenen Sonuç

```json
{
  "totalPosts": 5,
  "activePosts": 3,
  "totalApplications": 12,
  "acceptedApplications": 7,
  "favoritedBy": 15,
  "incomingApplications": 8
}
```

## Veritabanı Sorguları

İstatistikleri manuel olarak kontrol etmek için:

```sql
-- Kullanıcının toplam ilanları
SELECT COUNT(*) FROM posts WHERE created_by = 'user_id';

-- Aktif ilanlar
SELECT COUNT(*) FROM posts WHERE created_by = 'user_id' AND status = 'ACTIVE';

-- Toplam başvurular
SELECT COUNT(*) FROM applications WHERE applicant_id = 'user_id';

-- Kabul edilen başvurular
SELECT COUNT(*) FROM applications 
WHERE applicant_id = 'user_id' AND status = 'ACCEPTED';

-- Favori ekleyen kullanıcılar
SELECT COUNT(DISTINCT user_id) FROM favorites 
WHERE post_id IN (SELECT id FROM posts WHERE created_by = 'user_id');

-- Gelen başvurular
SELECT COUNT(*) FROM applications 
WHERE post_id IN (SELECT id FROM posts WHERE created_by = 'user_id');
```

## Gelecek İyileştirmeler

### Kısa Vadeli
1. ✅ Cache implementasyonu (Redis)
2. ✅ Pagination (büyük veri setleri için)
3. ✅ Tarih aralığı filtreleme
4. ✅ Grafik verileri (zaman serisi)

### Orta Vadeli
1. 📊 Detaylı analytics dashboard
2. 📈 Trend analizi
3. 🎯 Hedef belirleme ve takip
4. 📱 Real-time güncellemeler (WebSocket)

### Uzun Vadeli
1. 🤖 AI destekli öneriler
2. 📊 Karşılaştırmalı analiz
3. 🏆 Liderlik tablosu
4. 📈 Performans raporları

## Güvenlik

### Yetkilendirme
- Kullanıcılar sadece kendi istatistiklerini görebilir
- JWT token zorunlu
- User ID token'dan alınır (manipülasyon riski yok)

### Rate Limiting
- Endpoint rate limiting uygulanmalı
- Örnek: 100 istek/dakika

### Caching
- İstatistikler 5 dakika cache'lenebilir
- Cache key: `user:stats:{userId}`

## Sorun Giderme

### İstatistikler 0 gösteriyor
1. Kullanıcının gerçekten verisi var mı kontrol et
2. Backend loglarını kontrol et
3. Veritabanı bağlantısını kontrol et

### API 401 hatası veriyor
1. Token'ın geçerli olduğundan emin ol
2. Token'ın expire olmadığını kontrol et
3. Authorization header'ının doğru olduğunu kontrol et

### Yavaş yükleme
1. Veritabanı index'lerini kontrol et
2. Query performansını analiz et
3. Cache implementasyonu ekle

## Özet

✅ **Tamamlanan**
- Backend stats endpoint'i oluşturuldu
- Frontend entegrasyonu yapıldı
- Gerçek verilerle çalışıyor
- Hata yönetimi eklendi
- Dokümantasyon hazırlandı

🔄 **Devam Eden**
- Cache implementasyonu
- Performance optimizasyonu
- Ek istatistikler

## İletişim

Sorular veya öneriler için lütfen iletişime geçin.
