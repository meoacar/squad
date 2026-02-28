# 🚀 Elasticsearch Hızlı Başlangıç

## 5 Dakikada Elasticsearch

### 1. Başlat (30 saniye)

```bash
# Elasticsearch container'ını başlat
docker-compose up -d elasticsearch

# Sağlık kontrolü
curl http://localhost:9200/_cluster/health
```

### 2. Backend'i Başlat (1 dakika)

```bash
cd backend
npm run start:dev
```

Backend başladığında index'ler otomatik oluşturulur.

### 3. Test Et (2 dakika)

```bash
# Test script'ini çalıştır
cd backend
./test-elasticsearch.sh
```

### 4. Kullan (1 dakika)

```bash
# Basit arama
curl "http://localhost:3001/api/v1/search/posts?query=takım"

# Filtreli arama
curl "http://localhost:3001/api/v1/search/posts?query=clan&region=TR&mode=RANKED"

# Rol bazlı arama
curl "http://localhost:3001/api/v1/search/posts?role=IGL&tier=ACE"
```

## 🎯 Özellikler

✅ Türkçe dil desteği (ı, ğ, ü, ş, ö, ç)
✅ Fuzzy search (yazım hatası toleransı)
✅ Multi-field search (title, description, username)
✅ Gelişmiş filtreleme (bölge, mod, dil, rol, tier)
✅ Akıllı sıralama (relevance, newest, popular, expiring_soon)
✅ Otomatik indexleme (create, update, delete)

## 📚 API Endpoint'leri

### Arama
```bash
GET /api/v1/search/posts
  ?query=takım
  &type=CLAN_RECRUIT
  &region=TR
  &mode=RANKED
  &language=TR
  &role=IGL
  &tier=ACE
  &page=1
  &limit=20
  &sort=relevance
```

### Kullanıcı Arama
```bash
GET /api/v1/search/users?query=pro
```

### Reindex (Admin)
```bash
POST /api/v1/search/reindex/posts
POST /api/v1/search/reindex/users
```

## 🔧 Troubleshooting

### Elasticsearch başlamıyor?
```bash
docker logs squadbul-elasticsearch
```

### Index yok?
```bash
# Backend'i yeniden başlat (index'ler otomatik oluşur)
npm run start:dev
```

### Arama sonuç vermiyor?
```bash
# Mevcut verileri reindex et
curl -X POST http://localhost:3001/api/v1/search/reindex/posts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📖 Detaylı Dokümantasyon

Daha fazla bilgi için: [ELASTICSEARCH_GUIDE.md](./ELASTICSEARCH_GUIDE.md)

## 🎉 Hazır!

Elasticsearch entegrasyonu tamamlandı. Artık gelişmiş arama özelliklerini kullanabilirsiniz!
