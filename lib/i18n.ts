export const LOCALES = ['tr', 'de', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_COOKIE = 'sale-locale'
export const DEFAULT_LOCALE: Locale = 'tr'

type Entry = Record<Locale, string>

export function normalizeLocale(value: unknown): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE
}

export function intlLocale(locale: Locale): string {
  return locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-GB' : 'tr-TR'
}

const copy = {
  tickets: { tr: 'Biletler', de: 'Tickets', en: 'Tickets' },
  venue: { tr: 'Mekân', de: 'Veranstaltungsort', en: 'Venue' },
  venueSoon: { tr: 'Salon bilgisi yakında', de: 'Veranstaltungsort folgt', en: 'Venue to be announced' },
  showOnMap: { tr: 'Haritada göster', de: 'Auf Karte zeigen', en: 'Show on map' },
  date: { tr: 'Tarih', de: 'Datum', en: 'Date' },
  time: { tr: 'Saat', de: 'Uhrzeit', en: 'Time' },
  doors: { tr: 'Kapı açılış', de: 'Einlass', en: 'Doors open' },
  price: { tr: 'Fiyat', de: 'Preis', en: 'Price' },
  description: { tr: 'Etkinlik açıklaması', de: 'Veranstaltungsbeschreibung', en: 'Event description' },
  showMore: { tr: 'Daha fazlasını göster', de: 'Mehr anzeigen', en: 'Show more' },
  showLess: { tr: 'Daha az göster', de: 'Weniger anzeigen', en: 'Show less' },
  shareEvent: { tr: 'Etkinliği paylaş', de: 'Veranstaltung teilen', en: 'Share event' },
  linkCopied: { tr: 'Bağlantı kopyalandı', de: 'Link kopiert', en: 'Link copied' },
  pageLink: { tr: 'Sayfa bağlantısı', de: 'Seitenlink', en: 'Page link' },
  noSalesYet: { tr: 'Bu etkinlik için bilet satışa çıkmadı.', de: 'Für diese Veranstaltung sind noch keine Tickets im Verkauf.', en: 'No tickets on sale for this event yet.' },
  paymentCancelled: {
    tr: 'Ödeme tamamlanmadı. Seçtiğiniz biletler için bekleme süresi dolduğunda satışa geri döner.',
    de: 'Zahlung nicht abgeschlossen. Ihre reservierten Plätze gehen nach Ablauf der Haltezeit wieder in den Verkauf.',
    en: 'Payment not completed. Your seats return to sale once the hold period expires.',
  },
  chooseSeatsOnCom: { tr: 'kurdevents.com’da koltuk seç', de: 'Platz auf kurdevents.com wählen', en: 'Choose seats on kurdevents.com' },
  chooseSeatsOnComHint: {
    tr: 'Koltuk numarası seçerek almak isterseniz satış kurdevents.com üzerinden tamamlanır.',
    de: 'Wenn Sie eine Platznummer wählen möchten, läuft der Verkauf über kurdevents.com.',
    en: 'To pick a seat number, checkout continues on kurdevents.com.',
  },

  ticketCategories: { tr: 'Bilet kategorileri', de: 'Ticketkategorien', en: 'Ticket categories' },
  vatIncluded: { tr: 'Fiyatlara KDV dâhildir.', de: 'Preise inkl. MwSt.', en: 'Prices include VAT.' },
  vatServiceNote: {
    tr: 'KDV dâhil · hizmet bedeli ödeme ekranında eklenir',
    de: 'Inkl. MwSt · Servicegebühr wird auf der Zahlungsseite hinzugefügt',
    en: 'Incl. VAT · service fee added at checkout',
  },
  bySeat: { tr: 'Koltuk seçerek', de: 'Mit Platzwahl', en: 'With seat selection' },
  seatsFree: { tr: '{n} koltuk boş', de: '{n} Plätze frei', en: '{n} seats free' },
  seatsSoldOut: { tr: 'satılacak koltuk kalmadı', de: 'keine Plätze mehr verfügbar', en: 'no seats left' },
  standardPrice: { tr: 'Normal fiyat', de: 'Regularpreis', en: 'Standard price' },
  ticketsLeft: { tr: '{n} bilet kaldı', de: '{n} Tickets verfügbar', en: '{n} tickets left' },
  categorySoldOut: { tr: 'tükenen kategori', de: 'ausverkauft', en: 'sold out' },
  selectedCount: { tr: '{n} seçildi', de: '{n} ausgewählt', en: '{n} selected' },
  seatsSelected: { tr: '{n} koltuk seçildi', de: '{n} Plätze ausgewählt', en: '{n} seats selected' },
  chooseFromMap: { tr: 'Salon planından koltuk seç', de: 'Plätze aus dem Saalplan wählen', en: 'Choose seats from the hall map' },
  decrease: { tr: '{name} adedini azalt', de: 'Anzahl von {name} verringern', en: 'Decrease {name}' },
  increase: { tr: '{name} adedini artır', de: 'Anzahl von {name} erhöhen', en: 'Increase {name}' },
  deliveryNote: {
    tr: 'Biletler ödeme tamamlandığı anda indirilir ve e-posta ile gönderilir; kapıda telefonunuzdaki QR okutulur.',
    de: 'Tickets stehen sofort nach der Zahlung zum Download bereit und werden per E-Mail gesendet; an der Tür wird der QR-Code vom Handy gescannt.',
    en: 'Tickets are available for download and emailed as soon as you pay; scan the QR code on your phone at the door.',
  },
  checkoutFailed: { tr: 'Ödeme sayfası açılamadı.', de: 'Zahlungsseite konnte nicht geöffnet werden.', en: 'Could not open the payment page.' },
  connectionFailed: { tr: 'Bağlantı kurulamadı, tekrar deneyin.', de: 'Verbindung fehlgeschlagen, bitte erneut versuchen.', en: 'Connection failed, please try again.' },
  loginToBuy: {
    tr: 'Bilet almak için giriş yapın. Biletler hesabınıza tanımlanır ve kapıda bu hesapla okutulur.',
    de: 'Bitte anmelden, um Tickets zu kaufen. Die Tickets werden Ihrem Konto zugeordnet und an der Tür mit diesem Konto gescannt.',
    en: 'Please sign in to buy tickets. Tickets are linked to your account and scanned at the door with it.',
  },
  signIn: { tr: 'Giriş yap', de: 'Anmelden', en: 'Sign in' },
  ticketCount: { tr: '{n} bilet', de: '{n} Tickets', en: '{n} tickets' },
  continueToPayment: { tr: 'Ödemeye devam', de: 'Zur Zahlung', en: 'Continue to payment' },

  seatSelection: { tr: 'Koltuk seçimi', de: 'Platzauswahl', en: 'Seat selection' },
  closeSeatMap: { tr: 'Koltuk planını kapat', de: 'Saalplan schließen', en: 'Close seat map' },
  loadingSeatMap: { tr: 'Koltuk planı yükleniyor…', de: 'Saalplan wird geladen…', en: 'Loading seat map…' },
  seatMapFailed: { tr: 'Koltuk planı yüklenemedi.', de: 'Saalplan konnte nicht geladen werden.', en: 'Could not load the seat map.' },
  wholeHall: { tr: 'Tüm salon', de: 'Ganzer Saal', en: 'Whole hall' },
  legendSelected: { tr: 'seçtiğiniz', de: 'Ihre Auswahl', en: 'your selection' },
  legendHeld: { tr: 'sepetinde tutulan', de: 'reserviert (andere)', en: 'held by others' },
  legendSold: { tr: 'satılmış / kapalı', de: 'verkauft / gesperrt', en: 'sold / blocked' },
  mapHint: {
    tr: 'Sürükleyerek gezinin, + / − düğmeleriyle yakınlaştırın.',
    de: 'Ziehen zum Bewegen, mit + / − zoomen.',
    en: 'Drag to move, zoom with + / −.',
  },
  holdHint: {
    tr: 'Haritadan koltuk seçin; seçtiğiniz koltuk ödeme sırasında 15 dakika adınıza tutulur.',
    de: 'Wählen Sie Plätze in der Karte; Ihre Plätze werden 15 Minuten für Sie reserviert.',
    en: 'Pick seats on the map; your seats are held for 15 minutes during checkout.',
  },
  maxSeatsPerOrder: {
    tr: 'Bir siparişte en fazla {n} koltuk seçebilirsiniz.',
    de: 'Maximal {n} Plätze pro Bestellung.',
    en: 'You can select at most {n} seats per order.',
  },
  selectedDone: { tr: '{n} koltuk seçildi · tamam', de: '{n} Plätze ausgewählt · fertig', en: '{n} seats selected · done' },
  stage: { tr: 'SAHNE', de: 'BÜHNE', en: 'STAGE' },

  loginForOrder: { tr: 'Siparişinizi görmek için giriş yapın.', de: 'Bitte anmelden, um Ihre Bestellung zu sehen.', en: 'Please sign in to view your order.' },
  paymentReceived: { tr: 'Ödemeniz alındı, biletleriniz hazır.', de: 'Zahlung eingegangen, Ihre Tickets sind bereit.', en: 'Payment received, your tickets are ready.' },
  orderRefunded: { tr: 'Siparişiniz iade edildi.', de: 'Ihre Bestellung wurde erstattet.', en: 'Your order has been refunded.' },
  orderCancelled: { tr: 'Sipariş iptal edildi.', de: 'Bestellung storniert.', en: 'Order cancelled.' },
  paymentVerifying: { tr: 'Ödemeniz doğrulanıyor…', de: 'Ihre Zahlung wird bestätigt…', en: 'Verifying your payment…' },
  orderNo: { tr: 'Sipariş no', de: 'Bestellnummer', en: 'Order number' },
  refundTransferred: {
    tr: '{amount} tutar {when} geri aktarıldı.',
    de: '{amount} wurde am {when} zurückgezahlt.',
    en: '{amount} was refunded on {when}.',
  },
  refundSoon: { tr: 'kısa süre içinde', de: 'in Kürze', en: 'shortly' },
  refundReason: { tr: 'Sebep: {reason}.', de: 'Grund: {reason}.', en: 'Reason: {reason}.' },
  ticketsInvalidNow: { tr: 'Biletler artık geçerli değil.', de: 'Die Tickets sind nicht mehr gültig.', en: 'The tickets are no longer valid.' },
  autoRefreshNote: {
    tr: 'Bu ekran birkaç saniyede bir kendini yeniler. Ödeme onayı Stripe’tan gelir gelmez biletler burada görünür.',
    de: 'Diese Seite aktualisiert sich alle paar Sekunden. Sobald Stripe die Zahlung bestätigt, erscheinen die Tickets hier.',
    en: 'This page refreshes every few seconds. Tickets appear here as soon as Stripe confirms the payment.',
  },
  seat: { tr: 'Koltuk', de: 'Platz', en: 'Seat' },
  statusActive: { tr: 'kullanılabilir', de: 'gültig', en: 'valid' },
  statusUsed: { tr: 'kullanıldı', de: 'eingelöst', en: 'used' },
  statusEntered: { tr: 'giriş yapıldı', de: 'Einlass erfolgt', en: 'admitted' },
  statusCancelled: { tr: 'iptal', de: 'storniert', en: 'cancelled' },
  statusRefunded: { tr: 'iade edildi', de: 'erstattet', en: 'refunded' },
  statusPending: { tr: 'beklemede', de: 'ausstehend', en: 'pending' },
  doorHint: {
    tr: 'Kapıda yukarıdaki QR kodunu ya da 16 haneli bilet kodunu okutun. Her kod bir kez giriş verir.',
    de: 'Scannen Sie an der Tür den QR-Code oben oder den 16-stelligen Ticketcode. Jeder Code gewährt einmal Einlass.',
    en: 'At the door, scan the QR code above or the 16-character ticket code. Each code admits once.',
  },
  totalPaid: { tr: 'Toplam ödenen', de: 'Gesamtbetrag', en: 'Total paid' },
  backToEvent: { tr: 'Etkinliğe dön', de: 'Zurück zur Veranstaltung', en: 'Back to the event' },
} satisfies Record<string, Entry>

export type CopyKey = keyof typeof copy

export function t(locale: Locale, key: CopyKey): string {
  return copy[key][locale]
}

export function tf(locale: Locale, key: CopyKey, vars: Record<string, string | number>): string {
  return copy[key][locale].replace(/\{(\w+)\}/g, (all, name: string) => String(vars[name] ?? all))
}
