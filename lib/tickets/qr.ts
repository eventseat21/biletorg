import QRCode from 'qrcode'

/**
 * QR yükü kapı okuyucusunun kabul ettiği bilet kodudur (lib/checkin/scan.ts tireleri yok sayar).
 * Farklı bir biçim yazılırsa telefon kamerasıyla okunan kod panelde "bulunamadı" verir.
 */
export function ticketQrPayload(code: string): string {
  return code.trim().toUpperCase()
}

export async function ticketQrSvg(code: string): Promise<string> {
  return QRCode.toString(ticketQrPayload(code), {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    width: 168,
    color: { dark: '#111827', light: '#ffffff' },
  })
}

export async function ticketQrPng(code: string): Promise<Buffer> {
  return QRCode.toBuffer(ticketQrPayload(code), {
    type: 'png',
    margin: 2,
    errorCorrectionLevel: 'M',
    width: 320,
  })
}
