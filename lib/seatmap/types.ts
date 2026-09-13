// Ortak koltuk haritası tipleri (v3).

export type SeatShape = 'circle' | 'rect'

/** Koltuk çalışma zamanı durumu (veritabanında tutulmaz, anlık gösterim içindir). */
export type SeatStatus = 'available' | 'selected' | 'held' | 'blocked' | 'unavailable'

/** Tek bir koltuk. x,y = kutunun SOL-ÜST köşesi. */
export interface SeatItem {
  id: string
  row: string
  number: string
  x: number
  y: number
  width: number
  height: number
  /** Kategori anahtarı (ör. NORMAL, VIP, CATEGORY_1). */
  type: string
  shape: SeatShape
  rotation: number
  /** Bölge (zone) kimliği. */
  zone?: string | null
  /** Aynı anda seçilip taşınacak blok kimliği. */
  blockId?: string | null
  svgId?: string | null
  status?: SeatStatus
  /** Satılmış/aktif bilete bağlıysa salon editöründe değiştirilemez. */
  locked?: boolean
}

/** Bir koltuk kategorisi (fiyat sınıfı). */
export interface CategoryDef {
  key: string
  label: string
  color: string
  textColor: string
  price?: number
}

/** Koltuk grubu / bölge (ör. "Kuzey Tribün"). */
export interface ZoneDef {
  id: string
  name: string
  color: string
}

/** Salon arka plan görseli ayarları. */
export type BackgroundFit = 'cover' | 'contain' | 'fill' | 'none'

export interface ChartBackground {
  image: string | null
  opacity: number
  fit: BackgroundFit
}

export interface StageSize {
  width: number
  height: number
}

/** Bir salonun tüm koltuk haritası. */
export interface ChartDoc {
  version?: number
  name?: string
  stage: StageSize
  stagePosition?: WorldPoint
  seats: SeatItem[]
  categories: CategoryDef[]
  zones?: ZoneDef[]
  background?: ChartBackground
  createdAt?: string
  updatedAt?: string
}

export interface WorldPoint {
  x: number
  y: number
}

/** Editör araç modu. */
export type EditorTool = 'select' | 'add' | 'erase' | 'paint' | 'pan' | 'row' | 'arc'

/** Yay/daire sıra üretici formu. */
export interface ArcForm {
  rows: number
  seatsPerRow: number
  startRadius: number
  rowGap: number
  startAngleDeg: number
  endAngleDeg: number
  seatWidth: number
  seatHeight: number
  shape: SeatShape
}
