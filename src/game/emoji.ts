// Bỏ emoji khỏi chuỗi hiển thị: game chỉ dùng icon pixel art, không dùng emoji của iOS/Android
const EMOJI = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u{1F3FB}-\u{1F3FF}️‍⃣])/gu
export const noEmoji = (s: string) => String(s ?? '').replace(EMOJI, '').replace(/\s{2,}/g, ' ').replace(/\s+([,.!?…”])/g, '$1').trim()

/** Làm sạch emoji trong mọi chuỗi của dữ liệu thoại/review (bỏ qua các trường icon/face) */
export function scrubDeep(o: unknown): void {
  if (Array.isArray(o)) {
    for (let i = 0; i < o.length; i++) {
      if (typeof o[i] === 'string') o[i] = noEmoji(o[i])
      else scrubDeep(o[i])
    }
  } else if (o && typeof o === 'object') {
    const r = o as Record<string, unknown>
    for (const k of Object.keys(r)) {
      if (k === 'icon' || k === 'face' || k === 'look' || typeof r[k] === 'function') continue
      if (typeof r[k] === 'string') r[k] = noEmoji(r[k] as string)
      else scrubDeep(r[k])
    }
  }
}
