# 🔍 Elasticsearch Gelişmiş Arama Sistemi

## 📋 İçindekiler
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [API Endpoint'leri](#api-endpointleri)
- [Özellikler](#özellikler)
- [Test](#test)
- [Production](#production)

## 🚀 Kurulum

### 1. Docker ile Elasticsearch Başlatma

```bash
# Elasticsearch container'ını başlat
docker-compose up -d elasticsearch

# Elasticsearch'ün hazır olduğunu kontrol et
curl http://localhost:9200/_cluster/health
```

### 2. Backend Bağımlılıkları

Bağımlılıklar zaten yüklendi:
```bash
npm install @nestjs/elasticsearch @elastic/elasticsearch --legacy-peer-deps
```

### 3. Environment Variables

`.env` dosyasına eklendi:
```env
ELASTICSEARCH_NODE=http://localhost:9200
```

### 4. Backend'i Başlat

```bash
cd backend
npm run start:dev
```

Backend başladığında Elasticsearch index'leri otomatik oluşturulacak.

## 📚 Kullanım

### Index'leri Oluşturma

Backend başladığında otomatik olarak şu index'ler oluşturulur:
- `posts` - İlanlar için
- `users` - Kullanıcılar için

### Mevcut Verileri İndexleme

Tüm mevcut post'ları Elasticsearch'e indexlemek için:

```bash
# Admin token'ı al
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# Tüm post'ları reindex et
curl -X POST http://localhost:3001/api/v1/search/reindex/posts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Tüm kullanıcıları reindex et
curl -X POST http://localhost:3001/api/v1/search/reindex/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🔌 API Endpoint'leri

### 1. Gelişmiş Post Arama

**Endpoint:** `GET /api/v1/search/posts`

**Query Parameters:**
- `query` - Arama metni (title, description, creator_username'de arar)
- `type` - Post tipi (CLAN_RECRUIT, PLAYER_SEARCH)
- `region` - Bölge (TR, EU, ASIA, etc.)
- `mode` - Oyun modu (RANKED, CLASSIC, etc.)
- `language` - Dil (TR, EN, etc.)
- `role` - Rol (IGL, FRAGGER, SUPPORT, etc.)
- `tier` - Tier (ACE, CONQUEROR, etc.)
- `page` - Sayfa numarası (default: 1)
- `limit` - Sayfa başına sonuç (default: 20, max: 100)
- `sort` - Sıralama (relevance, newest, popular, expiring_soon)

**Örnekler:**

```bash
# Basit arama
curl "http://localhost:3001/api/v1/search/posts?query=clan"

# Filtreli arama
curl "http://localhost:3001/api/v1/search/posts?query=takım&region=TR&mode=RANKED&language=TR"

# Rol bazlı arama
curl "http://localhost:3001/api/v1/search/posts?role=IGL&tier=ACE"

# Popüler ilanlar
curl "http://localhost:3001/api/v1/search/posts?sort=popular&limit=10"

# Fuzzy search (yazım hatalarını tolere eder)
curl "http://localhost:3001/api/v1/search/posts?query=takm" # "takım" bulur
```

### 2. Kullanıcı Arama

**Endpoint:** `GET /api/v1/search/users`

**Query Parameters:**
- `query` - Arama metni (username, bio'da arar)
- `page` - Sayfa numarası
- `limit` - Sayfa başına sonuç

**Örnek:**

```bash
curl "http://localhost:3001/api/v1/search/users?query=pro&page=1&limit=20"
```

### 3. Reindex (Admin Only)

```bash
# Post'ları reindex et
POST /api/v1/search/reindex/posts

# Kullanıcıları reindex et
POST /api/v1/search/reindex/users
```

## ✨ Özellikler

### 1. Türkçe Dil Desteği
- Türkçe stemming (kök bulma)
- Türkçe stop words (gereksiz kelime filtreleme)
- Türkçe karakter desteği (ı, ğ, ü, ş, ö, ç)

### 2. Fuzzy Search
- Yazım hatalarını tolere eder
- "takm" → "takım" bulur
- "klan" → "clan" bulur

### 3. Multi-Field Search
- Title'da arama (3x ağırlık)
- Description'da arama (2x ağırlık)
- Creator username'de arama (1x ağırlık)

### 4. Gelişmiş Filtreleme
- Bölge, mod, dil, rol, tier filtreleri
- Birden fazla filtre kombinasyonu
- Boosted ve featured post'lar öncelikli

### 5. Akıllı Sıralama
- **Relevance:** En alakalı sonuçlar (default)
- **Newest:** En yeni ilanlar
- **Popular:** En çok görüntülenen/başvurulan
- **Expiring Soon:** Süresi dolmak üzere olanlar

### 6. Otomatik İndexleme
- Yeni post oluşturulduğunda → Otomatik index
- Post güncellendiğinde → Otomatik güncelleme
- Post silindiğinde → Otomatik index'ten kaldırma

## 🧪 Test

### 1. Elasticsearch Sağlık Kontrolü

```bash
curl http://localhost:9200/_cluster/health
```

Beklenen yanıt:
```json
{
  "status": "green" veya "yellow",
  "cluster_name": "docker-cluster"
}
```

### 2. Index'leri Kontrol Et

```bash
# Tüm index'leri listele
curl http://localhost:9200/_cat/indices?v

# Posts index'ini kontrol et
curl http://localhost:9200/posts/_count

# Users index'ini kontrol et
curl http://localhost:9200/users/_count
```

### 3. Arama Testi

```bash
# Test post'u oluştur
curl -X POST http://localhost:3001/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "CLAN_RECRUIT",
    "title": "Profesyonel Takım Oyuncu Arıyor",
    "description": "ACE tier ve üzeri oyuncular arıyoruz",
    "region": "TR",
    "mode": "RANKED",
    "language": "TR",
    "required_roles": ["IGL", "FRAGGER"],
    "tier_requirement": "ACE"
  }'

# Arama yap
curl "http://localhost:3001/api/v1/search/posts?query=profesyonel"
curl "http://localhost:3001/api/v1/search/posts?query=takım&region=TR"
curl "http://localhost:3001/api/v1/search/posts?role=IGL&tier=ACE"
```

## 🏭 Production

### 1. Production Docker Compose

`docker-compose.prod.yml` dosyasına Elasticsearch ekleyin:

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
  container_name: squadbul-elasticsearch-prod
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=true
    - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
    - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    - bootstrap.memory_lock=true
  ulimits:
    memlock:
      soft: -1
      hard: -1
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data
  networks:
    - squadbul-network
  restart: unless-stopped
```

### 2. Production Environment Variables

`.env.production` dosyasına ekleyin:

```env
ELASTICSEARCH_NODE=http://elasticsearch:9200
ELASTIC_PASSWORD=your_secure_password
```

### 3. Güvenlik

Production'da mutlaka:
- ✅ Elasticsearch şifre koruması aktif
- ✅ Sadece backend container'ı erişebilir
- ✅ Port'lar dışarıya kapalı
- ✅ SSL/TLS aktif (opsiyonel)

### 4. Performans Optimizasyonu

```yaml
# Daha fazla RAM
ES_JAVA_OPTS=-Xms2g -Xmx2g

# Replica sayısı (cluster için)
number_of_replicas: 1

# Refresh interval (daha az sık güncelleme = daha hızlı)
refresh_interval: 30s
```

### 5. Backup

```bash
# Snapshot repository oluştur
curl -X PUT "localhost:9200/_snapshot/backup_repo" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fs",
    "settings": {
      "location": "/usr/share/elasticsearch/backup"
    }
  }'

# Snapshot al
curl -X PUT "localhost:9200/_snapshot/backup_repo/snapshot_1?wait_for_completion=true"
```

## 📊 Monitoring

### Elasticsearch Metrikleri

```bash
# Cluster stats
curl http://localhost:9200/_cluster/stats?pretty

# Node stats
curl http://localhost:9200/_nodes/stats?pretty

# Index stats
curl http://localhost:9200/posts/_stats?pretty
```

### Kibana (Opsiyonel)

Görsel monitoring için Kibana ekleyebilirsiniz:

```yaml
kibana:
  image: docker.elastic.co/kibana/kibana:8.11.0
  ports:
    - "5601:5601"
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
  depends_on:
    - elasticsearch
```

## 🐛 Troubleshooting

### Elasticsearch başlamıyor

```bash
# Log'ları kontrol et
docker logs squadbul-elasticsearch

# Memory limit hatası alıyorsanız
# docker-compose.yml'de ES_JAVA_OPTS'u azaltın
ES_JAVA_OPTS=-Xms256m -Xmx256m
```

### Index oluşturulmuyor

```bash
# Backend log'larını kontrol et
docker logs squadbul-backend

# Manuel index oluşturma
curl -X PUT "localhost:9200/posts"
```

### Arama sonuç vermiyor

```bash
# Index'te veri var mı kontrol et
curl http://localhost:9200/posts/_count

# Yoksa reindex et
curl -X POST http://localhost:3001/api/v1/search/reindex/posts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🎯 Sonraki Adımlar

1. ✅ Elasticsearch kurulumu tamamlandı
2. ✅ Türkçe analyzer yapılandırıldı
3. ✅ API endpoint'leri hazır
4. ✅ Otomatik indexleme aktif
5. 🔄 Frontend entegrasyonu (isteğe bağlı)
6. 🔄 Production deployment

## 📝 Notlar

- Elasticsearch development'ta 512MB RAM kullanır
- Production'da minimum 1GB önerilir
- Index'ler otomatik oluşturulur
- Yeni post'lar otomatik indexlenir
- Fuzzy search yazım hatalarını tolere eder
- Türkçe karakterler tam desteklenir

## 🤝 Destek

Sorularınız için: support@squadbul.com
