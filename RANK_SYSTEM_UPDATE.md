# Rütbe Sistemi Güncelleme Dokümantasyonu

## Genel Bakış

PUBG Mobile rütbe sistemi Türkçeleştirildi ve ek rütbeler eklendi. "Tier" terimi "Rütbe" olarak değiştirildi.

## Değişiklikler

### Rütbe Listesi

Eski sistem (8 rütbe):
1. BRONZE → Bronze
2. SILVER → Silver
3. GOLD → Gold
4. PLATINUM → Platinum
5. DIAMOND → Diamond
6. CROWN → Crown
7. ACE → Ace
8. CONQUEROR → Conqueror

Yeni sistem (10 rütbe):
1. BRONZE → 🥉 Bronz
2. SILVER → 🥈 Gümüş
3. GOLD → 🥇 Altın
4. PLATINUM → 💿 Platin
5. DIAMOND → 💎 Elmas
6. CROWN → 👑 Taç
7. ACE → ⭐ As (Ace)
8. ACE_MASTER → 🌟 As Ustası (Ace Master)
9. ACE_DOMINATOR → ✨ As Hakimi (Ace Dominator)
10. CONQUEROR → 🏆 Fatih (Conqueror)

### Eklenen Rütbeler

**ACE_MASTER (As Ustası)**
- Ace ve Conqueror arasında
- Emoji: 🌟
- Ace'den sonraki ilk seviye

**ACE_DOMINATOR (As Hakimi)**
- Ace Master ve Conqueror arasında
- Emoji: ✨
- Conqueror'dan önceki son seviye

## Güncellenen Dosyalar

### Frontend

1. **frontend/app/profile/page.tsx**
   - Rütbe dropdown'u güncellendi (10 seçenek)
   - Rütbe gösterimi Türkçeleştirildi
   - Emoji'ler eklendi
   - "Tier" → "Rütbe" değişikliği

2. **frontend/lib/validations.ts**
   - `tier` enum'una ACE_MASTER ve ACE_DOMINATOR eklendi
   - `tier_requirement` enum'una ACE_MASTER ve ACE_DOMINATOR eklendi

3. **frontend/lib/types.ts**
   - User interface'ine eksik alanlar eklendi:
     - `strike_count: number`
     - `successful_matches: number`
     - `total_applications: number`
     - `email_verified?: boolean`
     - `is_admin?: boolean`
     - `updated_at?: string`
     - `last_login_at?: string`

### Rütbe Gösterimi

#### Profil Sayfası - Sidebar
```typescript
{user.tier === 'BRONZE' ? 'Bronz' :
 user.tier === 'SILVER' ? 'Gümüş' :
 user.tier === 'GOLD' ? 'Altın' :
 user.tier === 'PLATINUM' ? 'Platin' :
 user.tier === 'DIAMOND' ? 'Elmas' :
 user.tier === 'CROWN' ? 'Taç' :
 user.tier === 'ACE' ? 'As (Ace)' :
 user.tier === 'ACE_MASTER' ? 'As Ustası' :
 user.tier === 'ACE_DOMINATOR' ? 'As Hakimi' :
 user.tier === 'CONQUEROR' ? 'Fatih (Conqueror)' : user.tier}
```

#### Profil Sayfası - Dropdown
```html
<option value="BRONZE" className="bg-slate-800">🥉 Bronz</option>
<option value="SILVER" className="bg-slate-800">🥈 Gümüş</option>
<option value="GOLD" className="bg-slate-800">🥇 Altın</option>
<option value="PLATINUM" className="bg-slate-800">💿 Platin</option>
<option value="DIAMOND" className="bg-slate-800">💎 Elmas</option>
<option value="CROWN" className="bg-slate-800">👑 Taç</option>
<option value="ACE" className="bg-slate-800">⭐ As (Ace)</option>
<option value="ACE_MASTER" className="bg-slate-800">🌟 As Ustası (Ace Master)</option>
<option value="ACE_DOMINATOR" className="bg-slate-800">✨ As Hakimi (Ace Dominator)</option>
<option value="CONQUEROR" className="bg-slate-800">🏆 Fatih (Conqueror)</option>
```

## Emoji Eşleştirmeleri

| Rütbe | Emoji | Açıklama |
|-------|-------|----------|
| BRONZE | 🥉 | Bronz madalya |
| SILVER | 🥈 | Gümüş madalya |
| GOLD | 🥇 | Altın madalya |
| PLATINUM | 💿 | Platin disk |
| DIAMOND | 💎 | Elmas |
| CROWN | 👑 | Taç/Kral tacı |
| ACE | ⭐ | Yıldız |
| ACE_MASTER | 🌟 | Parlak yıldız |
| ACE_DOMINATOR | ✨ | Işıltılı yıldızlar |
| CONQUEROR | 🏆 | Kupa/Şampiyonluk kupası |

## Kullanım Örnekleri

### Profil Güncelleme
```typescript
// Kullanıcı profil sayfasında rütbe seçer
const formData = {
    pubg_nickname: "ProPlayer",
    tier: "ACE_MASTER", // Yeni rütbe
    bio: "As Ustası oyuncuyum"
};

await api.patch('/users/me', formData);
```

### Rütbe Gösterimi
```typescript
// Rütbe emoji'si al
const getRankEmoji = (tier: string) => {
    const emojiMap = {
        'BRONZE': '🥉',
        'SILVER': '🥈',
        'GOLD': '🥇',
        'PLATINUM': '💿',
        'DIAMOND': '💎',
        'CROWN': '👑',
        'ACE': '⭐',
        'ACE_MASTER': '🌟',
        'ACE_DOMINATOR': '✨',
        'CONQUEROR': '🏆'
    };
    return emojiMap[tier] || '🎯';
};

// Rütbe adı al (Türkçe)
const getRankName = (tier: string) => {
    const nameMap = {
        'BRONZE': 'Bronz',
        'SILVER': 'Gümüş',
        'GOLD': 'Altın',
        'PLATINUM': 'Platin',
        'DIAMOND': 'Elmas',
        'CROWN': 'Taç',
        'ACE': 'As (Ace)',
        'ACE_MASTER': 'As Ustası',
        'ACE_DOMINATOR': 'As Hakimi',
        'CONQUEROR': 'Fatih (Conqueror)'
    };
    return nameMap[tier] || tier;
};
```

## Backend Uyumluluğu

### Veritabanı
Backend'de `users` tablosundaki `tier` kolonu `VARCHAR(50)` olarak tanımlı, bu yüzden yeni rütbeler için ek değişiklik gerekmez.

### Enum Güncelleme (Gerekirse)
Eğer backend'de tier enum'u varsa, güncellenmeli:

```typescript
// backend/src/common/enums/tier.enum.ts
export enum Tier {
    BRONZE = 'BRONZE',
    SILVER = 'SILVER',
    GOLD = 'GOLD',
    PLATINUM = 'PLATINUM',
    DIAMOND = 'DIAMOND',
    CROWN = 'CROWN',
    ACE = 'ACE',
    ACE_MASTER = 'ACE_MASTER',        // YENİ
    ACE_DOMINATOR = 'ACE_DOMINATOR',  // YENİ
    CONQUEROR = 'CONQUEROR',
}
```

## Test Senaryoları

### 1. Profil Güncelleme
- [ ] Kullanıcı profil sayfasına gider
- [ ] Rütbe dropdown'unu açar
- [ ] 10 rütbe seçeneğini görür
- [ ] "As Ustası" seçer
- [ ] Formu kaydeder
- [ ] Başarı mesajı alır
- [ ] Sayfa yenilendiğinde seçim korunur

### 2. Rütbe Gösterimi
- [ ] Profil sidebar'ında rütbe emoji ile gösterilir
- [ ] İstatistikler sekmesinde rütbe Türkçe gösterilir
- [ ] PUBG bilgileri kartında rütbe doğru emoji ile gösterilir

### 3. Validasyon
- [ ] Geçersiz rütbe değeri reddedilir
- [ ] Boş rütbe kabul edilir (opsiyonel)
- [ ] Form submit sonrası validasyon çalışır

## Geriye Dönük Uyumluluk

### Mevcut Kullanıcılar
- Eski rütbelere sahip kullanıcılar etkilenmez
- Tüm eski rütbeler yeni sistemde desteklenir
- Gösterim otomatik olarak Türkçeleşir

### Veri Migrasyonu
Gerekli değil - sadece gösterim değişti, veri yapısı aynı.

## Diğer Sayfalar

Aşağıdaki sayfalarda da rütbe gösterimi güncellenmeli:

1. **İlan Oluşturma** (`/ilanlar/olustur`)
   - ✅ Zaten güncellenmiş (10 rütbe mevcut)

2. **İlan Listesi** (`/ilanlar`)
   - Rütbe filtreleri güncellenmeli

3. **İlan Detay** (`/ilanlar/[slug]`)
   - Rütbe gösterimi Türkçeleştirilmeli

4. **Dashboard** (`/dashboard`)
   - Kullanıcı rütbesi Türkçe gösterilmeli

## Dokümantasyon Güncellemeleri

- [x] PROFILE_PAGE_UPGRADE.md - Rütbe bilgileri güncellendi
- [x] PROFILE_FEATURES.md - Rütbe listesi güncellendi
- [x] RANK_SYSTEM_UPDATE.md - Bu dosya oluşturuldu

## Özet

✅ **Tamamlanan Değişiklikler**
- Rütbe sistemi Türkçeleştirildi
- 2 yeni rütbe eklendi (As Ustası, As Hakimi)
- Emoji'ler eklendi
- Profil sayfası güncellendi
- Validasyon şemaları güncellendi
- User type'ı genişletildi

🔄 **Gelecek Çalışmalar**
- Diğer sayfalarda rütbe gösterimlerini güncelle
- Backend enum'larını güncelle (gerekirse)
- Rütbe bazlı filtreleme ekle
- Rütbe istatistikleri ekle

## İletişim

Sorular veya öneriler için lütfen iletişime geçin.
