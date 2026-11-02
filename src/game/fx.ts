// Hiệu ứng "đã tay" bằng DOM (chạy được cả trên iPhone – nơi không có rung):
//  tiền xu bay về ô tiền, hạt lấp lánh, chớp sáng màn hình, chữ lớn bật lên.
// Dùng Web Animations API, phần tử tự xoá khi chạy xong. Tắt được trong Cài đặt.
import { reactive, watch } from 'vue'

const KEY = 'dreamers-fx'
export const fxPrefs = reactive({ on: true })
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s.on === 'boolean') fxPrefs.on = s.on } catch { /* bỏ qua */ }
watch(fxPrefs, () => { try { localStorage.setItem(KEY, JSON.stringify(fxPrefs)) } catch { /* bỏ qua */ } })

export interface Pt { x: number; y: number }

function layer(): HTMLElement {
  let el = document.getElementById('fx-layer')
  if (!el) {
    el = document.createElement('div')
    el.id = 'fx-layer'
    document.body.appendChild(el)
  }
  return el
}
function spawn(cls: string, at: Pt, html = ''): HTMLElement {
  const el = document.createElement('div')
  el.className = cls
  el.style.left = `${at.x}px`
  el.style.top = `${at.y}px`
  if (html) el.innerHTML = html
  layer().appendChild(el)
  return el
}
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/** Tâm của phần tử (vd. ô tiền trên thanh trên cùng) */
export function centerOf(sel: string): Pt | null {
  const el = document.querySelector(sel)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/** n đồng xu bung ra rồi bay vòng cung về ô tiền; mỗi đồng chạm đích làm ô tiền nảy lên */
export function coinsFly(from: Pt, n = 4) {
  if (!fxPrefs.on) return
  const to = centerOf('.topbar .money')
  if (!to) return
  for (let i = 0; i < n; i++) {
    const el = spawn('fx-coin', from)
    const sx = rnd(-26, 26), sy = rnd(-34, -12)
    const dx = to.x - from.x, dy = to.y - from.y
    const delay = i * 55
    const a = el.animate([
      { transform: 'translate(-50%,-50%) scale(0.4)', opacity: 0 },
      { transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(1.15)`, opacity: 1, offset: 0.22 },
      { transform: `translate(calc(-50% + ${sx + dx * 0.45}px), calc(-50% + ${Math.min(sy, dy) - 30}px)) scale(1)`, opacity: 1, offset: 0.6 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.6)`, opacity: 0.9 },
    ], { duration: 720, delay, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'both' })
    a.onfinish = () => { el.remove(); window.dispatchEvent(new CustomEvent('fx:coin')) }
  }
}

const SPARK = ['#fff3b0', '#ffd77a', '#ff9aa8', '#9ff0be', '#ffffff']
/** Hạt lấp lánh bung tròn quanh 1 điểm */
export function sparkle(at: Pt, n = 14, colors = SPARK, spread = 46) {
  if (!fxPrefs.on) return
  for (let i = 0; i < n; i++) {
    const el = spawn('fx-spark', at)
    el.style.background = colors[i % colors.length]
    const ang = (i / n) * Math.PI * 2 + rnd(-0.3, 0.3)
    const d = rnd(spread * 0.5, spread)
    const s = rnd(0.7, 1.5)
    const a = el.animate([
      { transform: `translate(-50%,-50%) scale(${s})`, opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * d}px), calc(-50% + ${Math.sin(ang) * d + 10}px)) scale(0)`, opacity: 0.2 },
    ], { duration: rnd(450, 750), easing: 'cubic-bezier(.15,.7,.4,1)' })
    a.onfinish = () => el.remove()
  }
}

/** Chớp sáng nhẹ cả màn hình (pha chuẩn, combo mốc 5/10, vượt cao điểm) */
export function flash(color = 'rgba(255, 236, 170, 0.45)') {
  if (!fxPrefs.on) return
  const el = spawn('fx-flash', { x: 0, y: 0 })
  el.style.background = color
  el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out' }).onfinish = () => el.remove()
}

/** Chữ lớn bật lên rồi bay lên (vd. "COMBO x5", "VỠ COMBO!") – kind = class màu */
export function popText(text: string, at: Pt, kind = 'gold') {
  const el = spawn(`fx-pop ${kind}`, at)
  el.textContent = text
  const a = el.animate([
    { transform: 'translate(-50%,-50%) scale(0.3) rotate(-8deg)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1.25) rotate(3deg)', opacity: 1, offset: 0.18 },
    { transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 1, offset: 0.35 },
    { transform: 'translate(-50%,-120%) scale(1)', opacity: 0 },
  ], { duration: 1100, easing: 'ease-out' })
  a.onfinish = () => el.remove()
}
