# Push Notifications Kurulum Rehberi

## 1. Web Push Paketini Yükleyin

```bash
cd backend
npm install web-push --save
```

## 2. VAPID Keys Oluşturun

```bash
npx web-push generate-vapid-keys
```

Çıktı:
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

Private Key:
UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
=======================================
```

## 3. Environment Variables Ekleyin

### Backend (.env)
```env
# Push Notifications
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
VAPID_PRIVATE_KEY=UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
VAPID_SUBJECT=mailto:admin@squadbul.com
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
```

## 4. Database Migration Oluşturun

```sql
-- create-push-subscriptions-table.sql
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions("userId");
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions("isActive");
```

Çalıştırın:
```bash
psql -U your_user -d your_database -f create-push-subscriptions-table.sql
```

## 5. NotificationsModule'ü App Module'e Ekleyin

```typescript
// backend/src/app.module.ts
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // ... diğer modüller
    NotificationsModule,
  ],
})
export class AppModule {}
```

## 6. Test Edin

### Frontend'de Bildirimleri Aktifleştir

```typescript
import { usePWA } from '@/hooks/usePWA';

function MyComponent() {
  const { enableNotifications } = usePWA();

  const handleEnable = async () => {
    const permission = await enableNotifications();
    if (permission === 'granted') {
      console.log('Bildirimler aktif!');
    }
  };

  return <button onClick={handleEnable}>Bildirimleri Aç</button>;
}
```

### Test Bildirimi Gönder

```bash
# Kullanıcı olarak giriş yapın ve token alın
curl -X POST http://localhost:3001/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Admin Olarak Toplu Bildirim Gönder

```bash
curl -X POST http://localhost:3001/notifications/send \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Yeni Özellik!",
    "body": "SquadBul artık daha hızlı!",
    "url": "/features"
  }'
```

## 7. Kullanım Örnekleri

### Yeni Mesaj Bildirimi

```typescript
// messages.service.ts
async sendMessage(senderId: number, receiverId: number, content: string) {
  // Mesajı kaydet
  const message = await this.messagesRepository.save({
    senderId,
    receiverId,
    content,
  });

  // Alıcıya bildirim gönder
  const sender = await this.usersRepository.findOne({ where: { id: senderId } });
  await this.notificationsService.sendToUser(receiverId, {
    title: 'Yeni Mesaj',
    body: `${sender.username} size bir mesaj gönderdi`,
    url: `/messages/${senderId}`,
  });

  return message;
}
```

### Yeni Başvuru Bildirimi

```typescript
// applications.service.ts
async createApplication(userId: number, postId: number) {
  const application = await this.applicationsRepository.save({
    userId,
    postId,
  });

  // İlan sahibine bildirim gönder
  const post = await this.postsRepository.findOne({ 
    where: { id: postId },
    relations: ['user'],
  });

  const applicant = await this.usersRepository.findOne({ 
    where: { id: userId },
  });

  await this.notificationsService.sendToUser(post.userId, {
    title: 'Yeni Başvuru',
    body: `${applicant.username} ilanınıza başvurdu`,
    url: `/posts/${postId}/applications`,
  });

  return application;
}
```

### Sistem Duyurusu

```typescript
// admin.service.ts
async sendAnnouncement(title: string, body: string) {
  return this.notificationsService.sendNotification({
    title,
    body,
    url: '/announcements',
  });
}
```

## 8. Production Notları

### HTTPS Zorunlu
Push notifications sadece HTTPS üzerinden çalışır (localhost hariç).

### Rate Limiting
Çok fazla bildirim göndermekten kaçının. Rate limiting ekleyin:

```typescript
// notifications.service.ts
private readonly MAX_NOTIFICATIONS_PER_USER_PER_HOUR = 10;

async canSendNotification(userId: number): Promise<boolean> {
  // Redis veya cache kullanarak kontrol edin
  const count = await this.cacheManager.get(`notifications:${userId}`);
  return !count || count < this.MAX_NOTIFICATIONS_PER_USER_PER_HOUR;
}
```

### Error Handling
410 Gone veya 404 Not Found durumunda aboneliği otomatik deaktif edin (zaten yapılmış).

### Queue Kullanımı
Çok sayıda bildirim için queue kullanın:

```typescript
// notifications.processor.ts
@Processor('notifications')
export class NotificationsProcessor {
  @Process('send-bulk')
  async handleBulkNotifications(job: Job) {
    const { userIds, notification } = job.data;
    // Batch olarak gönder
  }
}
```

## 9. Monitoring

### Başarı Oranını İzleyin

```typescript
// notifications.service.ts
async getStats(): Promise<NotificationStats> {
  const total = await this.pushSubscriptionRepository.count();
  const active = await this.pushSubscriptionRepository.count({
    where: { isActive: true },
  });

  return {
    totalSubscriptions: total,
    activeSubscriptions: active,
    inactiveSubscriptions: total - active,
  };
}
```

### Logs

```typescript
this.logger.log(`Notification sent to user ${userId}`);
this.logger.error(`Failed to send notification: ${error.message}`);
```

## 10. Troubleshooting

### Bildirimler Gelmiyor

1. VAPID keys doğru mu?
2. HTTPS kullanılıyor mu?
3. Bildirim izni verildi mi?
4. Service Worker aktif mi?
5. Backend'de web-push paketi yüklü mü?

### Console'da Hata

```javascript
// Frontend console
navigator.serviceWorker.ready.then(reg => {
  console.log('SW ready:', reg);
  reg.pushManager.getSubscription().then(sub => {
    console.log('Current subscription:', sub);
  });
});
```

### Backend Test

```bash
# Aktif abonelikleri kontrol et
psql -U your_user -d your_database -c "SELECT * FROM push_subscriptions WHERE \"isActive\" = true;"
```

## Tamamlandı! 🎉

Artık push notification sisteminiz hazır. Kullanıcılar:
- Bildirim izni verebilir
- Gerçek zamanlı bildirimler alabilir
- Offline bile bildirim alabilir
- Bildirimlere tıklayarak ilgili sayfaya gidebilir
