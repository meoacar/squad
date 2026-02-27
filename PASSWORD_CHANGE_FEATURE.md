# Şifre Değiştirme Özelliği Dokümantasyonu

## Genel Bakış

Kullanıcılar artık profil sayfasından şifrelerini değiştirebilirler. Yeni bir "Güvenlik" sekmesi eklendi.

## Backend API

### Endpoint

```
POST /api/v1/auth/change-password
```

### Authentication

Bearer Token gereklidir (JWT)

### Request Body

```typescript
{
  currentPassword: string;  // Mevcut şifre
  newPassword: string;      // Yeni şifre (min. 6 karakter)
}
```

### Response

**Başarılı (200 OK):**
```json
{
  "message": "Şifre başarıyla değiştirildi"
}
```

**Hata (401 Unauthorized):**
```json
{
  "message": "Mevcut şifre hatalı",
  "statusCode": 401
}
```

**Hata (400 Bad Request):**
```json
{
  "message": "Yeni şifre en az 6 karakter olmalıdır",
  "statusCode": 400
}
```

## Backend Implementation

### Yeni Dosyalar

1. **backend/src/auth/dto/change-password.dto.ts**
   ```typescript
   export class ChangePasswordDto {
       currentPassword: string;
       newPassword: string;  // Min 6 karakter
   }
   ```

### Güncellenen Dosyalar

1. **backend/src/auth/auth.controller.ts**
   - `POST /auth/change-password` endpoint'i eklendi
   - JWT authentication
   - Swagger documentation

2. **backend/src/auth/auth.service.ts**
   - `changePassword()` metodu eklendi
   - Mevcut şifre doğrulama
   - Yeni şifre hash'leme
   - Refresh token temizleme (yeniden giriş zorla)

### Güvenlik Özellikleri

1. **Mevcut Şifre Doğrulama**
   ```typescript
   const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
   if (!isPasswordValid) {
       throw new UnauthorizedException('Mevcut şifre hatalı');
   }
   ```

2. **Yeni Şifre Hash'leme**
   ```typescript
   const hashedPassword = await bcrypt.hash(newPassword, 10);
   ```

3. **Refresh Token Temizleme**
   ```typescript
   await this.usersService.update(userId, {
       password: hashedPassword,
       refresh_token: null, // Force re-login
   });
   ```

## Frontend Implementation

### Yeni Sekme: Güvenlik

Profil sayfasına 4. sekme olarak "🔒 Güvenlik" eklendi.

### Form Alanları

1. **🔑 Mevcut Şifre**
   - Type: password
   - Required: true
   - Placeholder: "Mevcut şifrenizi girin"

2. **🆕 Yeni Şifre**
   - Type: password
   - Required: true
   - Min Length: 6
   - Placeholder: "Yeni şifrenizi girin (min. 6 karakter)"

3. **✅ Yeni Şifre (Tekrar)**
   - Type: password
   - Required: true
   - Min Length: 6
   - Placeholder: "Yeni şifrenizi tekrar girin"
   - Validation: Yeni şifre ile eşleşmeli

### Validasyonlar

**Frontend Validasyonları:**
```typescript
// Şifre eşleşme kontrolü
if (newPassword !== confirmPassword) {
    toast.error('Yeni şifreler eşleşmiyor');
    return;
}

// Minimum uzunluk kontrolü
if (newPassword.length < 6) {
    toast.error('Yeni şifre en az 6 karakter olmalıdır');
    return;
}
```

**Gerçek Zamanlı Feedback:**
- Şifreler eşleşmiyorsa kırmızı uyarı mesajı
- Submit butonu disabled (şartlar sağlanmazsa)

### Güvenlik İpuçları

Form içinde kullanıcıya gösterilen ipuçları:
- ✅ En az 6 karakter kullanın
- ✅ Büyük ve küçük harf karışımı kullanın
- ✅ Rakam ve özel karakter ekleyin
- ✅ Kolay tahmin edilebilir şifreler kullanmayın

### UI/UX Özellikleri

1. **Loading State**
   ```typescript
   {changingPassword ? (
       <span>⏳ Değiştiriliyor...</span>
   ) : (
       <span>🔒 Şifreyi Değiştir</span>
   )}
   ```

2. **Toast Notifications**
   - Başarılı: "Şifre başarıyla değiştirildi!"
   - Hata: API'den gelen hata mesajı

3. **Form Reset**
   Başarılı değişiklik sonrası tüm alanlar temizlenir:
   ```typescript
   setCurrentPassword('');
   setNewPassword('');
   setConfirmPassword('');
   ```

4. **Disabled State**
   Submit butonu şu durumlarda disabled:
   - Herhangi bir alan boş
   - Şifreler eşleşmiyor
   - İşlem devam ediyor

## Kullanım Senaryosu

### Adım Adım Kullanım

1. Kullanıcı profil sayfasına gider (`/profile`)
2. "🔒 Güvenlik" sekmesine tıklar
3. Mevcut şifresini girer
4. Yeni şifresini girer (min. 6 karakter)
5. Yeni şifresini tekrar girer (doğrulama)
6. "Şifreyi Değiştir" butonuna tıklar
7. Başarılı mesajı alır
8. Form temizlenir

### Hata Senaryoları

**Senaryo 1: Mevcut Şifre Yanlış**
- Kullanıcı: Yanlış mevcut şifre girer
- Sistem: "Mevcut şifre hatalı" hatası gösterir
- Kullanıcı: Doğru şifreyi girer ve tekrar dener

**Senaryo 2: Şifreler Eşleşmiyor**
- Kullanıcı: Farklı şifreler girer
- Sistem: "Şifreler eşleşmiyor" uyarısı gösterir (gerçek zamanlı)
- Submit butonu disabled kalır
- Kullanıcı: Eşleşen şifreler girer

**Senaryo 3: Şifre Çok Kısa**
- Kullanıcı: 5 karakterlik şifre girer
- Sistem: "Yeni şifre en az 6 karakter olmalıdır" hatası gösterir
- Kullanıcı: Daha uzun şifre girer

## Test

### Manuel Test

1. **Başarılı Şifre Değiştirme**
   ```
   1. Login ol (meofeat@gmail.com / admin123)
   2. Profile git
   3. Güvenlik sekmesine tıkla
   4. Mevcut şifre: admin123
   5. Yeni şifre: newpass123
   6. Yeni şifre tekrar: newpass123
   7. Submit
   8. Başarı mesajı görmeli
   9. Logout ol
   10. Yeni şifre ile login ol (newpass123)
   ```

2. **Yanlış Mevcut Şifre**
   ```
   1. Mevcut şifre: wrongpassword
   2. Yeni şifre: newpass123
   3. Submit
   4. "Mevcut şifre hatalı" hatası görmeli
   ```

3. **Şifre Eşleşmiyor**
   ```
   1. Mevcut şifre: admin123
   2. Yeni şifre: newpass123
   3. Yeni şifre tekrar: different123
   4. "Şifreler eşleşmiyor" uyarısı görmeli
   5. Submit butonu disabled olmalı
   ```

### API Test (cURL)

```bash
# Token al
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"meofeat@gmail.com","password":"admin123"}' \
  | jq -r '.access_token')

# Şifre değiştir
curl -X POST http://localhost:3001/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "newpass123"
  }'
```

Beklenen yanıt:
```json
{
  "message": "Şifre başarıyla değiştirildi"
}
```

## Güvenlik Önlemleri

### Backend

1. **JWT Authentication**
   - Endpoint korumalı
   - Sadece giriş yapmış kullanıcılar erişebilir

2. **Mevcut Şifre Doğrulama**
   - Kullanıcı mevcut şifresini bilmek zorunda
   - Brute force koruması (rate limiting)

3. **Şifre Hash'leme**
   - bcrypt ile hash (10 rounds)
   - Plain text şifre asla saklanmaz

4. **Session Invalidation**
   - Refresh token temizlenir
   - Kullanıcı yeniden giriş yapmak zorunda

### Frontend

1. **Client-Side Validation**
   - Minimum uzunluk kontrolü
   - Şifre eşleşme kontrolü
   - Gerçek zamanlı feedback

2. **Secure Input**
   - Type: password (masked input)
   - Autocomplete: off (tarayıcı kaydetmesin)

3. **Error Handling**
   - Kullanıcı dostu hata mesajları
   - Hassas bilgi sızdırma yok

## Gelecek İyileştirmeler

### Kısa Vadeli
1. ✅ Şifre gücü göstergesi (weak/medium/strong)
2. ✅ Şifre gereksinimleri (regex validation)
3. ✅ "Şifreyi Göster" butonu
4. ✅ Son şifre değiştirme tarihi gösterimi

### Orta Vadeli
1. 📧 Email bildirimi (şifre değiştiğinde)
2. 🔐 İki faktörlü doğrulama (2FA)
3. 📱 SMS doğrulama
4. 🔑 Şifre geçmişi (aynı şifre tekrar kullanılmasın)

### Uzun Vadeli
1. 🔒 Passwordless authentication
2. 🎯 Biometric authentication
3. 🔐 Hardware key support (YubiKey)
4. 📊 Güvenlik dashboard

## Sorun Giderme

### "Mevcut şifre hatalı" Hatası
- Mevcut şifrenizi doğru girdiğinizden emin olun
- Caps Lock kapalı olduğundan emin olun
- Şifrenizi unuttuysanız "Şifremi Unuttum" kullanın

### "Şifreler eşleşmiyor" Hatası
- Her iki alana da aynı şifreyi girin
- Boşluk karakteri olmadığından emin olun
- Copy-paste yerine manuel yazın

### Şifre Değişti Ama Giriş Yapamıyorum
- Yeni şifrenizi doğru girdiğinizden emin olun
- Cache temizleyin ve tekrar deneyin
- Şifre değiştirme işleminden sonra logout olup tekrar login olun

## Özet

✅ **Tamamlanan Özellikler**
- Backend şifre değiştirme endpoint'i
- Frontend güvenlik sekmesi
- Form validasyonları
- Hata yönetimi
- Loading states
- Toast notifications
- Güvenlik ipuçları
- Session invalidation

🔄 **Devam Eden**
- Şifre gücü göstergesi
- Email bildirimleri
- 2FA implementasyonu

## İletişim

Sorular veya öneriler için lütfen iletişime geçin.
