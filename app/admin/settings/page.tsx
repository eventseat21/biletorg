export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Ayarlar</h1>
      <p className="text-gray-600 mb-8">
        Platform genel ayarları bu ekranda toplanacak. Şu an yalnızca yer tutucu.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-950 text-sm mb-6">
        <p className="font-medium mb-1">Tüm site sayfalarını admin’den düzenlemek</p>
        <p>
          Teknik olarak “zor” değil ama bir <strong>içerik yönetim sistemi (CMS)</strong> veya
          sayfa başına veritabanı / dosya tabanlı şablonlar gerekir. Şu an sayfalar kodda
          (Next.js bileşenleri) duruyor; her değişiklik deploy içerir. İleride taslak sayfaları
          veritabanında tutup yalnız admin’e düzenleme ekranı açılabilir; ayrıca hazır
          headless CMS (Contentful, Sanity vb.) entegre edilebilir. İsterseniz hangi sayfaların
          sık değişeceğine göre en hafif çözümü birlikte seçebiliriz.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-600 text-sm">
        <ul className="list-disc pl-5 space-y-2">
          <li>Komisyon oranı: ortam değişkeni <code className="bg-gray-100 px-1 rounded">PLATFORM_COMMISSION_PERCENTAGE</code></li>
          <li>E-posta (SMTP): <code className="bg-gray-100 px-1 rounded">SMTP_*</code> değişkenleri</li>
          <li>NextAuth: <code className="bg-gray-100 px-1 rounded">NEXTAUTH_URL</code> ve{' '}
            <code className="bg-gray-100 px-1 rounded">NEXTAUTH_SECRET</code> Vercel’de tanımlı olmalı</li>
        </ul>
      </div>
    </div>
  )
}
