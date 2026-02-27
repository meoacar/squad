# Footer Hatası Düzeltmesi

## Yapılan Değişiklik

Footer component'inde `@/lib/api` import'u yerine doğrudan `axios` kullanıldı.

### Sebep
`@/lib/api` modülü authentication token'ı otomatik ekliyor, ancak public endpoint'ler için bu gerekli değil ve bazen sorun çıkarabiliyor.

### Çözüm
```typescript
// Önce
import { api } from '@/lib/api';
const response = await api.get('/menu-items?location=FOOTER');

// Sonra
import axios from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const response = await axios.get(`${API_URL}/menu-items?location=FOOTER`);
```

## Test

1. Sayfayı yenile (hard refresh: Cmd+Shift+R)
2. Footer'ın düzgün yüklendiğini kontrol et
3. Console'da hata olmamalı

## Alternatif Çözüm (Eğer Hala Hata Alırsan)

Footer'ı geçici olarak static yap:

```typescript
// frontend/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
    // Hardcoded menüler - dinamik özellik geçici olarak devre dışı
    return (
        <footer className="...">
            {/* Mevcut hardcoded menüler */}
        </footer>
    );
}
```

Daha sonra dinamik özelliği tekrar ekleyebiliriz.
