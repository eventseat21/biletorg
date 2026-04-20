# BiletOrg - Etkinlik Bilet Platformu

Eventim Light benzeri, organizatörler için profesyonel bilet yönetim sistemi.

## Özellikler

### Organizatör Paneli
- **Salon Editörü**: Konva.js ile görsel koltuk düzeni tasarlama
- **Etkinlik Yönetimi**: Kolay etkinlik oluşturma ve düzenleme
- **Muhasebe Modülü**: 
  - Toplam gelir takibi
  - Tarihe göre gelir grafiği
  - Etkinlik bazlı gelir raporları
  - Komisyon kesintisi hesaplama (%5 platform ücreti)
  - Ödeme raporları

### Admin Paneli
- Organizatör onaylama/reddetme süreci
- Kullanıcı yönetimi
- Platform istatistikleri

### Müşteri Deneyimi
- Etkinlik listeleme ve arama
- Etkinlik detay sayfası
- Bilet kategorisi seçimi
- Koltuk seçimi (varsa)

## Teknoloji Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **State Management**: Zustand
- **Charts**: Chart.js + react-chartjs-2
- **Canvas**: Konva.js + react-konva

## Kurulum

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarla

`.env.local` dosyasını düzenleyin:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/biletorg?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
PLATFORM_COMMISSION_PERCENTAGE="5"
```

### 3. Veritabanını Kur

```bash
# PostgreSQL veritabanını oluştur
# Ardından:
npx prisma migrate dev
npx prisma db seed
```

### 4. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

## Varsayılan Kullanıcılar

Seed işleminden sonra aşağıdaki hesaplar kullanılabilir:

- **Admin**: `admin@biletorg.com` / `admin123`
- **Organizatör**: `organizer@example.com` / `organizer123`

## Proje Yapısı

```
├── app/
│   ├── api/              # API Routes
│   ├── admin/            # Admin panel
│   ├── events/           # Müşteri etkinlik sayfaları
│   ├── login/            # Giriş sayfası
│   ├── register/         # Kayıt sayfası
│   ├── forgot-password/  # Şifre sıfırlama
│   ├── reset-password/   # Yeni şifre
│   ├── organizer/        # Organizatör paneli
│   └── page.tsx          # Landing page
├── components/           # React bileşenleri
├── lib/                  # Yardımcı fonksiyonlar
├── prisma/
│   ├── schema.prisma     # Veritabanı şeması
│   └── seed.ts           # Örnek veriler
└── types/                # TypeScript tipleri
```

## API Routes

### Auth
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/forgot-password` - Şifre sıfırlama isteği
- `POST /api/auth/reset-password` - Yeni şifre belirleme

### Organizer
- `GET/POST /api/organizer/halls` - Salon listeleme/oluşturma
- `GET /api/organizer/halls/[id]` - Salon detayı
- `POST /api/organizer/halls/[id]/seats` - Koltuk ekleme
- `GET /api/organizer/accounting` - Muhasebe verileri

## Önemli Notlar

1. **Salon Editörü**: Konva.js canvas kullanır, sadece client-side çalışır
2. **Koltuk Ekleme**: Editörde sahneye tıklayarak yeni koltuk ekleyebilirsiniz
3. **Koltuk Silme**: Koltuk üzerinde sağ tıklayarak silebilirsiniz
4. **Komisyon**: Platform varsayılan olarak %5 komisyon alır

## Lisans

MIT
