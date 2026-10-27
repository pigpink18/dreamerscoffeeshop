// Gửi / tải bảng xếp hạng online qua Supabase REST (không cần thư viện). Tắt nếu chưa cấu hình.
import { reactive } from 'vue'
import { save } from './store'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './onlineConfig'

const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || SUPABASE_URL
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || SUPABASE_ANON_KEY
export const onlineEnabled = !!(URL_ && KEY)

export interface BoardRow { player_id: string; name: string; score: number; day: number; stars: number; premise: number }
export const board = reactive({ rows: [] as BoardRow[], loading: false, error: '', at: 0 })

const headers = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' })
export const myNick = () => save.meta.online.nick || `${save.player} #${save.playerId.slice(0, 4).toUpperCase()}`

export async function submitScore() {
  if (!onlineEnabled || !navigator.onLine) return
  const o = save.meta.online
  try {
    const r = await fetch(`${URL_}/rest/v1/rpc/submit_score`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ p_id: save.playerId, p_token: o.token, p_name: myNick().slice(0, 24), p_score: Math.round(o.career), p_day: save.day, p_stars: Math.round(save.reputation / 2) / 10, p_premise: save.meta.premise }),
    })
    if (r.ok) o.lastDay = save.day
  } catch { /* offline: gửi lại lần sau */ }
}

export async function loadBoard() {
  if (!onlineEnabled) return
  board.loading = true
  board.error = ''
  try {
    const r = await fetch(`${URL_}/rest/v1/leaderboard?select=player_id,name,score,day,stars,premise&order=score.desc&limit=50`, { headers: headers() })
    if (!r.ok) throw new Error(String(r.status))
    board.rows = await r.json()
    board.at = Date.now()
  } catch {
    board.error = 'Không tải được bảng xếp hạng (mất mạng?)'
  } finally {
    board.loading = false
  }
}
