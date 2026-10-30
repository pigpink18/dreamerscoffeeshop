// Xưng hô của khách: mỗi khách có 1 "giọng" cố định (giới tính + cặp xưng/gọi) từ lúc gọi món tới lúc review,
// để không có chuyện vừa xưng "cô" xong quay sang xưng "em".
//
// Trong câu thoại dùng các mã sau (viết hoa chữ đầu → tự viết hoa):
//   {t}/{T}  khách tự xưng          (anh, chị, em, mình, tôi, cô, chú, bà, ông…)
//   {b}/{B}  khách gọi chủ quán      (em, chị, con, cháu, bạn)
//   {k}/{K}  chủ quán gọi khách      (anh, chị, em, bạn, cô, chú…)
//   {y}/{Y}  chủ quán tự xưng        (em, chị, con, cháu, mình)
//   {nữ|nam} chọn chữ theo giới tính khách (chữ đầu cho nữ, chữ sau cho nam)
import type { ChatTopic } from './data'

export type Gender = 'f' | 'm'
export interface Persona { g: Gender; t: string; b: string; k: string; y: string }

export const xung = {
  anh: (): Persona => ({ g: 'm', t: 'anh', b: 'em', k: 'anh', y: 'em' }),
  chi: (): Persona => ({ g: 'f', t: 'chị', b: 'em', k: 'chị', y: 'em' }),
  em: (g: Gender): Persona => ({ g, t: 'em', b: 'chị', k: 'em', y: 'chị' }),
  minh: (g: Gender): Persona => ({ g, t: 'mình', b: 'bạn', k: 'bạn', y: 'mình' }),
  /** khách nước ngoài nói tiếng Việt kiểu sách vở: tôi – chị */
  toi: (g: Gender): Persona => ({ g, t: 'tôi', b: 'chị', k: g === 'f' ? 'chị' : 'anh', y: 'em' }),
  co: (): Persona => ({ g: 'f', t: 'cô', b: 'con', k: 'cô', y: 'con' }),
  chu: (): Persona => ({ g: 'm', t: 'chú', b: 'con', k: 'chú', y: 'con' }),
  ba: (): Persona => ({ g: 'f', t: 'bà', b: 'con', k: 'bà', y: 'con' }),
  ong: (): Persona => ({ g: 'm', t: 'ông', b: 'cháu', k: 'ông', y: 'cháu' }),
  custom: (g: Gender, t: string, b: string, k: string, y: string): Persona => ({ g, t, b, k, y }),
}
/** giọng mặc định cho bản lưu cũ (khách chưa có giọng) */
export const NEUTRAL: Persona = xung.minh('f')

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function voice(text: string, p: Persona = NEUTRAL): string {
  return text
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, f: string, m: string) => (p.g === 'f' ? f : m))
    .replace(/\{([tbkyTBKY])\}/g, (_, c: string) => {
      const v = p[c.toLowerCase() as 't' | 'b' | 'k' | 'y']
      return c === c.toUpperCase() ? cap(v) : v
    })
}

export function voiceTopic(topic: ChatTopic, p: Persona = NEUTRAL): ChatTopic {
  return { say: voice(topic.say, p), replies: topic.replies.map((r) => ({ ...r, text: voice(r.text, p), answer: voice(r.answer, p) })) }
}
