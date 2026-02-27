# Admin API Test

## Problem
Frontend'den `/admin/users` endpoint'ine istek gitmiyor. Muhtemelen 403 Forbidden hatası alıyorsun.

## Sebep
Token'ında `is_admin` field'ı yok. Database'de admin yaptık ama token eski.

## Çözüm

### 1. Çıkış Yap ve Tekrar Giriş Yap
1. Sağ üstten "Çıkış" butonuna tıkla
2. Login sayfasına git: http://localhost:3003/login
3. Admin email adresinle giriş yap
4. Şifreni gir
5. Giriş yap

### 2. Admin Paneline Git
http://localhost:3003/admin/users

### 3. Browser Console'u Kontrol Et
Eğer hala hata varsa:
1. F12 veya Cmd+Option+I ile Developer Tools'u aç
2. Console tab'ına git
3. Network tab'ına git
4. `/admin/users` isteğini bul
5. Response'u kontrol et

## Beklenen Sonuç
Kullanıcı listesi görünmeli (şu an sadece sen varsın).

## Manuel Test (Terminal)
Eğer hala çalışmazsa, token'ı manuel test edebiliriz:

```bash
# 1. Login ol ve token al
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ADMIN_EMAIL","password":"ADMIN_PASSWORD"}'

# 2. Token'ı kopyala ve test et
curl http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer SENIN_TOKEN_BURAYA"
```

## Alternatif: LocalStorage'ı Temizle
1. F12 ile Developer Tools'u aç
2. Application tab'ına git
3. Local Storage → http://localhost:3003
4. Sağ tıkla → Clear
5. Sayfayı yenile
6. Tekrar giriş yap
