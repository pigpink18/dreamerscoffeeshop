// Ngôn ngữ + giới tính chủ quán.
// Lưu riêng trong localStorage (không phụ thuộc store → dùng được cả trong data.ts lúc nạp module).
// Đổi ngôn ngữ / giới tính ⇒ tải lại trang, nên mọi chuỗi có thể tính 1 lần lúc nạp module.
import type { Look } from './data'

export type Lang = 'vi' | 'en'
export type Gender = 'f' | 'm'
const KEY = 'dc-profile'

function read(): { lang: Lang; gender: Gender } {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null')
    return { lang: p?.lang === 'en' ? 'en' : 'vi', gender: p?.gender === 'm' ? 'm' : 'f' }
  } catch { return { lang: 'vi', gender: 'f' } }
}
const P = read()
export const LANG: Lang = P.lang
export const GENDER: Gender = P.gender
export const isEn = LANG === 'en'
try { document.documentElement.lang = LANG } catch { /* ssr */ }

/** chọn chuỗi theo ngôn ngữ đang dùng: L('Xin chào', 'Hello') */
export const L = <T = string>(vi: T, en: T): T => (isEn ? en : vi)
/** chọn theo giới tính chủ quán: G('cô', 'anh') */
export const G = <T = string>(f: T, m: T): T => (GENDER === 'm' ? m : f)

/** tên mặc định của chủ quán theo giới tính */
export const DEFAULT_NAME: Record<Gender, string> = { f: 'Yến', m: 'Minh' }

/** ngoại hình chủ quán (áo đổi theo cảnh) */
export function ownerLook(shirt: string, gender: Gender = GENDER): Look {
  return gender === 'm'
    ? { skin: '#efc29e', hair: '#1f1a1c', style: 'short', shirt }
    : { skin: '#f3c9a6', hair: '#1f1a1c', style: 'shoulder', shirt, acc: ['blush'] }
}

/** lưu ngôn ngữ / giới tính; trả về true nếu cần tải lại trang để áp dụng */
export function saveProfile(lang: Lang, gender: Gender): boolean {
  try { localStorage.setItem(KEY, JSON.stringify({ lang, gender })) } catch { /* bỏ qua */ }
  return lang !== LANG || gender !== GENDER
}
