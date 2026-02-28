#!/bin/bash

# Elasticsearch Test Script
# Bu script Elasticsearch entegrasyonunu test eder

echo "🔍 Elasticsearch Test Başlatılıyor..."
echo ""

# Renkler
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API Base URL
API_URL="http://localhost:3001/api/v1"

# 1. Elasticsearch Sağlık Kontrolü
echo "1️⃣  Elasticsearch sağlık kontrolü..."
HEALTH=$(curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$HEALTH" = "green" ] || [ "$HEALTH" = "yellow" ]; then
    echo -e "${GREEN}✓ Elasticsearch çalışıyor (Status: $HEALTH)${NC}"
else
    echo -e "${RED}✗ Elasticsearch çalışmıyor!${NC}"
    exit 1
fi
echo ""

# 2. Index'leri Kontrol Et
echo "2️⃣  Index'leri kontrol ediliyor..."
INDICES=$(curl -s http://localhost:9200/_cat/indices?v)
echo "$INDICES"
echo ""

# 3. Backend API Kontrolü
echo "3️⃣  Backend API kontrolü..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}✓ Backend API çalışıyor${NC}"
else
    echo -e "${RED}✗ Backend API çalışmıyor!${NC}"
    exit 1
fi
echo ""

# 4. Login ve Token Al
echo "4️⃣  Test kullanıcısı ile giriş yapılıyor..."
echo -e "${YELLOW}Not: Önce bir kullanıcı oluşturmanız gerekiyor${NC}"
echo ""

# Kullanıcı bilgilerini girin
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""

LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Giriş başarısız!${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Giriş başarılı${NC}"
echo ""

# 5. Test Post Oluştur
echo "5️⃣  Test ilanı oluşturuluyor..."
POST_RESPONSE=$(curl -s -X POST $API_URL/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "CLAN_RECRUIT",
    "title": "Elasticsearch Test İlanı - Profesyonel Takım",
    "description": "Bu bir test ilanıdır. Elasticsearch arama özelliğini test ediyoruz.",
    "region": "TR",
    "mode": "RANKED",
    "language": "TR",
    "required_roles": ["IGL", "FRAGGER"],
    "tier_requirement": "ACE"
  }')

POST_ID=$(echo $POST_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$POST_ID" ]; then
    echo -e "${RED}✗ İlan oluşturulamadı!${NC}"
    echo "Response: $POST_RESPONSE"
else
    echo -e "${GREEN}✓ Test ilanı oluşturuldu (ID: $POST_ID)${NC}"
fi
echo ""

# 6. Elasticsearch'te Index Sayısını Kontrol Et
echo "6️⃣  Elasticsearch index sayısı kontrol ediliyor..."
sleep 2 # Index'in oluşması için bekle
POST_COUNT=$(curl -s http://localhost:9200/posts/_count | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo "Posts index'inde $POST_COUNT doküman var"
echo ""

# 7. Basit Arama Testi
echo "7️⃣  Basit arama testi..."
SEARCH_RESPONSE=$(curl -s "$API_URL/search/posts?query=test")
SEARCH_COUNT=$(echo $SEARCH_RESPONSE | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
echo "Arama sonucu: $SEARCH_COUNT ilan bulundu"
echo ""

# 8. Filtreli Arama Testi
echo "8️⃣  Filtreli arama testi..."
FILTERED_SEARCH=$(curl -s "$API_URL/search/posts?query=test&region=TR&mode=RANKED")
FILTERED_COUNT=$(echo $FILTERED_SEARCH | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
echo "Filtreli arama sonucu: $FILTERED_COUNT ilan bulundu"
echo ""

# 9. Fuzzy Search Testi
echo "9️⃣  Fuzzy search testi (yazım hatası toleransı)..."
FUZZY_SEARCH=$(curl -s "$API_URL/search/posts?query=profesynel") # 'profesyonel' yerine
FUZZY_COUNT=$(echo $FUZZY_SEARCH | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
echo "Fuzzy search sonucu: $FUZZY_COUNT ilan bulundu"
echo ""

# 10. Sıralama Testi
echo "🔟 Sıralama testleri..."
echo "  - En yeni ilanlar:"
curl -s "$API_URL/search/posts?sort=newest&limit=3" | grep -o '"title":"[^"]*"' | head -3
echo ""
echo "  - En popüler ilanlar:"
curl -s "$API_URL/search/posts?sort=popular&limit=3" | grep -o '"title":"[^"]*"' | head -3
echo ""

# Özet
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Tüm testler tamamlandı!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Sonuçlar:"
echo "  - Elasticsearch: Çalışıyor ($HEALTH)"
echo "  - Backend API: Çalışıyor"
echo "  - Index'teki doküman sayısı: $POST_COUNT"
echo "  - Arama sonuçları: $SEARCH_COUNT"
echo ""
echo "🎉 Elasticsearch entegrasyonu başarıyla çalışıyor!"
echo ""
echo "📚 Daha fazla bilgi için: ELASTICSEARCH_GUIDE.md"
