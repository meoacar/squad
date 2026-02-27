# Bildirim Sistemi Dokümantasyonu

## Genel Bakış

Squadbul platformunda bildirim sistemi tam olarak çalışır durumdadır. Kullanıcılar başvuru durumları, boost işlemleri ve premium üyelik güncellemeleri hakkında bildirim alabilirler.

## Teknik Detaylar

### Backend (NestJS)

**Endpoint:** `http://localhost:3001/api/v1/notifications`

**Mevcut API Endpoints:**
- `GET /notifications` - Kullanıcının tüm bildirimlerini getirir (son 50 bildirim)
- `GET /notifications/unread-count` - Okunmamış bildirim sayısını döner
- `PATCH /notifications/:id/read` - Belirli bir bildirimi okundu olarak işaretler
- `PATCH /notifications/read-all` - Tüm bildirimleri okundu olarak işaretler

**Bildirim Tipleri:**
- `APPLICATION_RECEIVED` - İlana yeni başvuru geldiğinde
- `APPLICATION_ACCEPTED` - Başvuru kabul edildiğinde
- `APPLICATION_REJECTED` - Başvuru reddedildiğinde
- `POST_BOOSTED` - İlan boost edildiğinde
- `PREMIUM_EXPIRING` - Premium üyelik süresi dolmak üzereyken
- `POST_EXPIRING` - İlan süresi dolmak üzereyken

**Veritabanı:**
- Tablo: `notifications`
- Kolonlar: `id`, `user_id`, `type`, `payload` (JSONB), `read_at`, `created_at`
- Foreign Key: `user_id` → `users(id)` (CASCADE DELETE)

### Frontend (Next.js)

**Sayfa:** `http://localhost:3003/notifications`

**Özellikler:**
1. ✅ Bildirim listesi görüntüleme
2. ✅ Okunmamış bildirim sayacı
3. ✅ Tek tek okundu işaretleme
4. ✅ Tümünü okundu işaretleme
5. ✅ Bildirim tiplerine göre özel ikonlar ve mesajlar
6. ✅ İlgili sayfalara yönlendirme linkleri
7. ✅ Responsive tasarım
8. ✅ Loading skeleton
9. ✅ Boş durum gösterimi

**Navbar Entegrasyonu:**
- Desktop: Bildirim ikonu + dinamik sayaç badge'i
- Mobile: Bildirim menü öğesi + dinamik sayaç badge'i
- Otomatik güncelleme: Her 30 saniyede bir okunmamış bildirim sayısı kontrol edilir

## Kullanım

### Kullanıcı Perspektifi

1. Giriş yaptıktan sonra navbar'da bildirim ikonu görünür
2. Okunmamış bildirim varsa kırmızı badge ile sayı gösterilir
3. Bildirim ikonuna tıklayarak `/notifications` sayfasına gidilir
4. Bildirimler en yeniden eskiye doğru sıralanır
5. Okunmamış bildirimler mor arka plan ile vurgulanır
6. Bir bildirime tıklandığında otomatik okundu işaretlenir
7. "Tümünü Okundu İşaretle" butonu ile tüm bildirimler okundu yapılabilir

### Geliştirici Perspektifi

**Yeni Bildirim Oluşturma:**

```typescript
// Backend - NotificationsService kullanımı
await this.notificationsService.create({
    user_id: userId,
    type: NotificationType.APPLICATION_RECEIVED,
    payload: {
        post_id: postId,
        post_title: postTitle,
        application_id: applicationId
    }
});
```

**Frontend - API Kullanımı:**

```typescript
// Bildirimleri getir
const response = await api.get('/notifications');

// Okunmamış sayısını getir
const response = await api.get('/notifications/unread-count');

// Okundu işaretle
await api.patch(`/notifications/${id}/read`);

// Tümünü okundu işaretle
await api.patch('/notifications/read-all');
```

## Test Verileri

Test kullanıcısı (`test_user` - ID: `55facbe4-0a0c-41e8-91a4-38a2032bb314`) için örnek bildirimler oluşturulmuştur:

- 4 okunmamış bildirim
- 2 okunmuş bildirim
- Farklı bildirim tipleri (APPLICATION_RECEIVED, POST_BOOSTED, PREMIUM_EXPIRING, vb.)

Test bildirimleri eklemek için:
```bash
psql -h localhost -p 5433 -U postgres -d squadbul -f backend/test-notifications.sql
```

## Güvenlik

- ✅ JWT Authentication zorunlu
- ✅ Kullanıcılar sadece kendi bildirimlerini görebilir
- ✅ Kullanıcılar sadece kendi bildirimlerini okundu işaretleyebilir
- ✅ CORS yapılandırması aktif

## Performans

- Backend: Son 50 bildirim ile sınırlı
- Frontend: 30 saniyede bir otomatik güncelleme
- Veritabanı: `user_id` ve `read_at` kolonlarında index mevcut

## Gelecek Geliştirmeler

1. 🔄 Real-time bildirimler (WebSocket/SSE)
2. 🔔 Push notifications (PWA)
3. 📧 Email bildirimleri
4. 🔕 Bildirim tercihleri (hangi tipleri almak istediğini seçme)
5. 📱 Bildirim sesleri
6. 🗑️ Bildirim silme özelliği
7. 📊 Bildirim istatistikleri
8. 🔍 Bildirim filtreleme ve arama

## Sorun Giderme

### Bildirimler görünmüyor
1. Backend'in çalıştığından emin olun: `http://localhost:3001/api/v1/notifications`
2. Kullanıcının giriş yapmış olduğundan emin olun
3. Browser console'da hata kontrolü yapın
4. Veritabanında bildirim olup olmadığını kontrol edin

### Sayaç güncellenmiyor
1. Browser console'da network tab'ı kontrol edin
2. 30 saniye bekleyin (otomatik güncelleme periyodu)
3. Sayfayı yenileyin
4. LocalStorage'da token'ın geçerli olduğundan emin olun

### 401 Unauthorized hatası
1. Token'ın süresi dolmuş olabilir - yeniden giriş yapın
2. LocalStorage'da `access_token` kontrolü yapın
3. Backend JWT yapılandırmasını kontrol edin

## Durum

✅ **Sistem Aktif ve Çalışıyor**

- Backend API: ✅ Çalışıyor
- Frontend UI: ✅ Çalışıyor
- Veritabanı: ✅ Tablo mevcut ve yapılandırılmış
- Navbar Entegrasyonu: ✅ Dinamik sayaç eklendi
- Test Verileri: ✅ Mevcut
