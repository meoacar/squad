# Admin Giriş Bilgileri

## Mevcut Admin Hesabı

**Email:** meofeat@gmail.com  
**Şifre:** admin123  
**Kullanıcı Adı:** admin

## Giriş URL'leri

- **Frontend Admin Panel:** http://localhost:3003/admin
- **Backend API:** http://localhost:3001/api/v1
- **Login Endpoint:** http://localhost:3001/api/v1/auth/login

## Test Etme

### 1. Web Üzerinden
1. http://localhost:3003/login adresine git
2. Email: `meofeat@gmail.com`
3. Şifre: `admin123`
4. Giriş yap
5. http://localhost:3003/admin adresine git

### 2. API ile (cURL)
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "meofeat@gmail.com",
    "password": "admin123"
  }'
```

Başarılı yanıt:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e009e3b3-cd70-4271-8a7b-64dc16c239cc",
    "username": "admin",
    "email": "meofeat@gmail.com",
    "is_admin": true,
    ...
  }
}
```

## Şifre Doğrulama

Şifrenin doğru olup olmadığını test etmek için:

```bash
node backend/test-admin-password.js
```

Çıktı:
```
Testing password: admin123
Against hash: $2b$10$1ZWKDZajSu6puCdxHsUZNurwQOF3yOCMvw2WXUXFJYglILi79/oXS
Match: true

✅ Password matches! You can login with admin123
```

## Şifre Sıfırlama

Eğer şifreyi değiştirmek isterseniz:

### Yöntem 1: Script ile
```bash
node backend/reset-admin-password.js
```

Bu script yeni bir hash oluşturur ve SQL komutunu verir.

### Yöntem 2: Manuel SQL
```sql
-- Yeni hash oluştur (bcrypt ile)
-- Sonra veritabanında güncelle:
UPDATE users 
SET password = '$2b$10$YENI_HASH_BURAYA' 
WHERE username = 'admin';
```

### Yöntem 3: Doğrudan SQL ile admin123'e sıfırla
```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d squadbul -c "
UPDATE users 
SET password = '\$2b\$10\$1ZWKDZajSu6puCdxHsUZNurwQOF3yOCMvw2WXUXFJYglILi79/oXS' 
WHERE username = 'admin';
"
```

## Veritabanı Kontrolü

Admin kullanıcısını kontrol etmek için:

```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d squadbul -c "
SELECT id, username, email, is_admin, created_at 
FROM users 
WHERE username = 'admin';
"
```

Çıktı:
```
                  id                  | username |       email       | is_admin |         created_at         
--------------------------------------+----------+-------------------+----------+----------------------------
 e009e3b3-cd70-4271-8a7b-64dc16c239cc | admin    | meofeat@gmail.com | t        | 2026-02-24 15:23:45.123456
```

## Admin Rolleri

Admin kullanıcısının rolleri:

```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d squadbul -c "
SELECT ar.role, ar.granted_at 
FROM admin_roles ar 
WHERE ar.user_id = 'e009e3b3-cd70-4271-8a7b-64dc16c239cc';
"
```

## Yeni Admin Oluşturma

### 1. Mevcut Kullanıcıyı Admin Yap
```sql
UPDATE users SET is_admin = true WHERE email = 'user@example.com';
```

### 2. Yeni Admin Kullanıcı Oluştur
```sql
-- Önce kullanıcıyı oluştur (register endpoint'i kullan)
-- Sonra admin yap:
UPDATE users SET is_admin = true WHERE email = 'newadmin@example.com';
```

### 3. Admin Rolü Ekle
```sql
INSERT INTO admin_roles (user_id, role, granted_by)
VALUES (
    'user_id_buraya',
    'SUPER_ADMIN',
    'e009e3b3-cd70-4271-8a7b-64dc16c239cc'
);
```

## Güvenlik Notları

⚠️ **ÖNEMLİ:**
- Production'da mutlaka güçlü bir şifre kullanın
- admin123 sadece development için uygundur
- Şifreleri asla plain text olarak saklamayın
- JWT secret'ları production'da değiştirin
- Rate limiting aktif olduğundan emin olun

## Sorun Giderme

### Giriş Yapamıyorum
1. Backend'in çalıştığından emin olun:
   ```bash
   curl http://localhost:3001/api/v1
   ```

2. Şifreyi test edin:
   ```bash
   node backend/test-admin-password.js
   ```

3. Kullanıcının admin olduğunu kontrol edin:
   ```bash
   PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d squadbul -c "
   SELECT username, email, is_admin FROM users WHERE email = 'meofeat@gmail.com';
   "
   ```

### "Invalid credentials" Hatası
- Email adresini kontrol edin (meofeat@gmail.com)
- Şifrenin doğru olduğundan emin olun (admin123)
- Veritabanında kullanıcının var olduğunu kontrol edin

### "Unauthorized" Hatası
- Token'ın geçerli olduğundan emin olun
- is_admin flag'inin true olduğunu kontrol edin
- Admin guard'ın doğru çalıştığını kontrol edin

## Test Kullanıcıları

Sistemde başka test kullanıcıları da var:

```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d squadbul -c "
SELECT username, email, is_admin FROM users ORDER BY created_at;
"
```

## Özet

✅ **Admin Giriş Bilgileri Doğrulandı**
- Email: meofeat@gmail.com
- Şifre: admin123
- Durum: Aktif ve çalışıyor
- Admin yetkisi: Var (is_admin = true)

Herhangi bir değişiklik yapılmadı, mevcut şifre zaten admin123.
