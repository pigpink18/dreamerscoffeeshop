// Âm thanh: hiệu ứng tự tổng hợp bằng Web Audio + nhạc nền CC0 (Abstraction / Tallbeard Studios)
import { reactive, watch } from 'vue'
import { isXmasSeason } from './season'
import { L } from './i18n'

const KEY = 'dreamers-audio'
// Nhạc nền trong quán: 5 vòng bossa nova nhẹ nhàng sáng tác riêng cho game (tools/bossa.py), phát luân phiên.
// Nhạc khi boss tới: mặc định "Hồi hộp nhẹ" (tools/bossa.py, giọng thứ + tích tắc) hoặc "Out of Time" — Abstraction / Tallbeard (CC0, kịch tính)
export type TrackId = 'lastXmas' | 'feliz' | 'somMai' | 'muaPhun' | 'hemNho' | 'chieuHien' | 'lyDenDa' | 'boss' | 'bossSoft' | 'report'
export type TrackChoice = Exclude<TrackId, 'boss' | 'bossSoft' | 'report'> | 'auto'
export type BossMusic = 'soft' | 'drama' | 'off'
export const BOSS_MUSIC_LIST: { id: BossMusic; name: string; desc: string }[] = [
  { id: 'soft', name: L('Hồi hộp nhẹ', 'Light suspense'), desc: L('Bossa giọng thứ, nhanh hơn chút, có tiếng tích tắc', 'Minor-key bossa, a bit faster, with a ticking clock') },
  { id: 'drama', name: L('Kịch tính', 'Dramatic'), desc: L('Out of Time – chiptune dồn dập', 'Out of Time – driving chiptune') },
  { id: 'off', name: L('Giữ nhạc quán', 'Keep café music'), desc: L('Không đổi nhạc khi boss tới', "Don't switch music when the boss shows up") },
]
const BOSS_GAIN: Partial<Record<TrackId, number>> = { bossSoft: 0.85, boss: 0.6, report: 1.4, lastXmas: 2.2, feliz: 1.8 } // cân bằng với nhạc quán
const isBossTrack = (id: TrackId) => id === 'boss' || id === 'bossSoft'
export const MUSIC_FILES: Record<TrackId, string> = {
  lastXmas: 'BOSSANOVAPOPLastChristmas', // file do chủ game thêm
  feliz: 'BOSSANOVAFelizNavidad', // file do chủ game thêm
  somMai: 'bossa-som-mai',
  muaPhun: 'bossa-mua-phun',
  hemNho: 'bossa-hem-nho',
  chieuHien: 'bossa-chieu-hien',
  lyDenDa: 'bossa-ly-den-da',
  boss: 'boss-out-of-time', // nhạc kịch tính (tuỳ chọn)
  bossSoft: 'boss-hoi-hop', // nhạc boss mặc định: hồi hộp vừa phải
  report: 'mappy', // nhạc màn tổng kết cuối ngày – file thật chọn trong Cài đặt (audio.reportTrack)
}
/** Thứ tự phát luân phiên */
const ALL_TRACKS: TrackId[] = ['lastXmas', 'feliz', 'somMai', 'muaPhun', 'hemNho', 'chieuHien', 'lyDenDa']
/** nhạc Giáng Sinh chỉ phát trong mùa Noel (season.ts) */
const XMAS_TRACKS: TrackId[] = ['lastXmas', 'feliz']
const PLAYLIST: TrackId[] = isXmasSeason() ? ALL_TRACKS : ALL_TRACKS.filter((t) => !XMAS_TRACKS.includes(t))
/** Mỗi bài lặp mấy vòng (~1 phút/vòng) rồi chuyển bài kế tiếp */
const LOOPS_PER_TRACK = 2
const ALL_TRACK_LIST: { id: TrackChoice; name: string; icon: string; desc: string }[] = [
  { id: 'auto', name: L('Phát luân phiên', 'Shuffle all'), icon: '', desc: isXmasSeason() ? L('7 bài bossa nova lần lượt, mở đầu bằng 2 bài Giáng sinh', '7 bossa nova tunes in turn, starting with 2 Christmas songs') : L('5 bài bossa nova lần lượt', '5 bossa nova tunes in turn') },
  { id: 'lastXmas', name: 'Last Christmas (bossa)', icon: '', desc: L('Bossa pop Giáng sinh', 'Christmas bossa pop') },
  { id: 'feliz', name: 'Feliz Navidad (bossa)', icon: '', desc: L('Bossa Giáng sinh vui tươi', 'Cheerful Christmas bossa') },
  { id: 'somMai', name: L('Sớm mai', 'Early Morning'), icon: '', desc: L('Bossa sáng sớm, sáo nhẹ', 'Morning bossa, soft flute') },
  { id: 'muaPhun', name: L('Mưa phùn', 'Drizzle'), icon: '', desc: L('Chậm, vibraphone êm', 'Slow, mellow vibraphone') },
  { id: 'hemNho', name: L('Hẻm nhỏ', 'Little Alley'), icon: '', desc: L('Rhodes ấm, hơi jazz', 'Warm Rhodes, a little jazzy') },
  { id: 'chieuHien', name: L('Chiều hiên', 'Porch Afternoon'), icon: '', desc: L('Thong thả buổi chiều', 'A lazy afternoon') },
  { id: 'lyDenDa', name: L('Ly đen đá', 'Iced Black Coffee'), icon: '', desc: L('Giọng thứ, hơi hoài niệm', 'Minor key, a bit nostalgic') },
]
/** nhạc màn tổng kết cuối ngày (chọn trong Cài đặt) – các file trong public/assets/music */
export const REPORT_TRACKS: { file: string; name: string }[] = [
  { file: 'penguin-town', name: 'Penguin Town' },
  { file: 'rabbit-town', name: 'Rabbit Town' },
  { file: 'three-red-hearts', name: 'Three Red Hearts' },
  { file: 'puzzle-pieces', name: 'Puzzle Pieces' },
  { file: 'sanctuary', name: 'Sanctuary' },
  { file: 'mappy', name: L('Mappy (cũ)', 'Mappy (classic)') },
]
export const TRACK_LIST = ALL_TRACK_LIST.filter((t) => t.id === 'auto' || PLAYLIST.includes(t.id))
export const audio = reactive({ music: true, sfx: true, volume: 0.7, unlocked: false, track: 'auto' as TrackChoice, playing: '' as TrackId | '', bossMusic: 'off' as BossMusic, reportTrack: 'penguin-town' }) // không đổi nhạc & không kêu báo khi boss tới
try {
  const s = JSON.parse(localStorage.getItem(KEY) || 'null')
  if (s) { audio.music = !!s.music; audio.sfx = !!s.sfx; if (typeof s.volume === 'number') audio.volume = Math.min(1, Math.max(0, s.volume)); if (s.track === 'auto' || (s.track in MUSIC_FILES && !isBossTrack(s.track) && s.track !== 'report')) audio.track = s.track; if (REPORT_TRACKS.some((r) => r.file === s.reportTrack)) audio.reportTrack = s.reportTrack }
} catch { /* bỏ qua */ }
/** Âm lượng tổng: thanh trượt 0..1 -> mức thật (mặc định 0.7 ≈ nhỏ vừa phải) */
function masterLevel() { return 0.6 * audio.volume * audio.volume + 0.05 * audio.volume }
watch(() => audio.volume, () => {
  try { localStorage.setItem(KEY, JSON.stringify({ music: audio.music, sfx: audio.sfx, track: audio.track, volume: audio.volume, bossMusic: audio.bossMusic, reportTrack: audio.reportTrack })) } catch { /* bỏ qua */ }
  if (ctx) master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, 0.05)
})
watch(() => [audio.music, audio.sfx, audio.track, audio.bossMusic, audio.reportTrack], () => {
  try { localStorage.setItem(KEY, JSON.stringify({ music: audio.music, sfx: audio.sfx, track: audio.track, volume: audio.volume, bossMusic: audio.bossMusic, reportTrack: audio.reportTrack })) } catch { /* bỏ qua */ }
  if (audio.music) startMusic(); else stopMusic()
})

let ctx: AudioContext | null = null
let master: GainNode, sfxBus: GainNode, musicBus: GainNode
let noiseBuf: AudioBuffer

function init() {
  if (ctx) return ctx
  const AC = window.AudioContext || (window as any).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain(); master.gain.value = masterLevel()
  // limiter chống rè tiếng
  const lim = ctx.createDynamicsCompressor()
  lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.1
  master.connect(lim); lim.connect(ctx.destination)
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.4; sfxBus.connect(master)
  musicBus = ctx.createGain(); musicBus.gain.value = 0
  musicBus.connect(master)
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return ctx
}

/** Gọi trong sự kiện chạm đầu tiên (trình duyệt yêu cầu tương tác trước khi phát âm thanh) */
export function unlockAudio() {
  const c = init()
  if (!c) return
  if (c.state === 'suspended') c.resume()
  if (!audio.unlocked) {
    audio.unlocked = true
    if (audio.music) startMusic()
  }
}

// Tạm dừng âm thanh khi ẩn app
document.addEventListener('visibilitychange', () => {
  if (!ctx) return
  if (document.hidden) ctx.suspend(); else if (audio.unlocked) ctx.resume()
})

// ---------- Khối dựng âm ----------

function tone(freq: number, t: number, dur: number, opts: { type?: OscillatorType; vol?: number; to?: number; attack?: number; bus?: GainNode; filter?: number; vib?: number; release?: number } = {}) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = opts.type ?? 'sine'
  o.frequency.setValueAtTime(freq, t)
  if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur)
  const a = opts.attack ?? 0.005
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(opts.vol ?? 0.3, t + a)
  if (opts.release) { g.gain.setValueAtTime(opts.vol ?? 0.3, t + Math.max(a, dur - opts.release)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur) }
  else g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  if (opts.vib) {
    const l = c.createOscillator(); const lg = c.createGain()
    l.frequency.value = 5.2; lg.gain.value = freq * opts.vib
    l.connect(lg); lg.connect(o.frequency); l.start(t + 0.12); l.stop(t + dur + 0.05)
  }
  let node: AudioNode = o
  if (opts.filter) {
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.filter
    o.connect(f); node = f
  }
  node.connect(g); g.connect(opts.bus ?? sfxBus)
  o.start(t); o.stop(t + dur + 0.05)
}

function noise(t: number, dur: number, opts: { type?: BiquadFilterType; freq?: number; to?: number; q?: number; vol?: number; bus?: GainNode; attack?: number } = {}) {
  const c = ctx!
  const s = c.createBufferSource(); s.buffer = noiseBuf
  const f = c.createBiquadFilter(); f.type = opts.type ?? 'bandpass'; f.Q.value = opts.q ?? 1
  f.frequency.setValueAtTime(opts.freq ?? 1000, t)
  if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(opts.vol ?? 0.3, t + (opts.attack ?? 0.01))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(f); f.connect(g); g.connect(opts.bus ?? sfxBus)
  s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05)
}

/** 1 đồng xu kim loại chạm nhau: các hoạ âm lệch (không hài hoà) tắt nhanh + tiếng "tách" ngắn */
function coinClink(t: number, f: number, vol: number) {
  tone(f, t, 0.32, { vol: vol * 0.55 })
  tone(f * 2.76, t, 0.2, { vol: vol * 0.32 })
  tone(f * 5.4, t, 0.1, { vol: vol * 0.16 })
  tone(f * 1.51, t, 0.24, { vol: vol * 0.22 })
  noise(t, 0.035, { type: 'highpass', freq: 5000, vol: vol * 0.9, attack: 0.002 })
}
/** vài đồng xu rơi leng keng vào khay (mua hàng / trả tiền) */
function coinJingle(t: number) {
  const hits = [0, 0.055, 0.1, 0.17, 0.26]
  hits.forEach((d, i) => coinClink(t + d + Math.random() * 0.015, 2300 + Math.random() * 900, 0.2 * (1 - i * 0.13)))
}

// ---------- Hiệu ứng âm thanh ----------
export type Sfx = 'boss' | 'bossWin' | 'bossLose' | 'tap' | 'cup' | 'ice' | 'pour' | 'drip' | 'squeeze' | 'stir' | 'plop' | 'shake' | 'blend' | 'coin' | 'wrong' | 'horn' | 'angry' | 'bell' | 'done' | 'heart' | 'dayEnd' | 'buy' | 'comboBreak' | 'rush' | 'whoosh'

/** Tiếng gõ phím máy đánh chữ cổ khi chữ hiện ra từng chữ (như khách đang nói).
 *  pitch: giọng cao/thấp theo khách → chỉ đổi nhẹ độ "đanh" của tiếng gõ để mỗi khách nghe hơi khác. */
export function talkBlip(pitch = 520) {
  if (!audio.sfx || !ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + 0.005
  const r = Math.min(1.25, Math.max(0.8, pitch / 560)) * (0.94 + Math.random() * 0.12)
  // cần chữ đập vào trục cao su: tiếng "cạch" kim loại đanh
  noise(t, 0.028, { type: 'bandpass', freq: 3400 * r, q: 1.4, vol: 0.16, attack: 0.001 })
  tone(2300 * r, t, 0.014, { type: 'square', vol: 0.025, filter: 5200 })
  // thân máy dội lại: tiếng "cộc" trầm
  tone(170 * r, t + 0.002, 0.04, { type: 'triangle', vol: 0.09, to: 85 })
  noise(t + 0.004, 0.04, { type: 'lowpass', freq: 700, vol: 0.05, attack: 0.002 })
}

/** Tiếng chuông "ting" + kéo trục khi hết dòng (máy đánh chữ về đầu dòng) */
export function typeDing() {
  if (!audio.sfx || !ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + 0.01
  tone(2093, t, 0.55, { type: 'sine', vol: 0.05 })
  tone(4186 * 1.003, t, 0.3, { type: 'sine', vol: 0.015 })
  noise(t + 0.06, 0.16, { type: 'bandpass', freq: 1800, to: 900, q: 2, vol: 0.04, attack: 0.02 })
}

/** Tiếng "tích" đồng hồ khi khách sắp hết kiên nhẫn */
export function tick(urgent = false) {
  if (!audio.sfx || !ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + 0.005
  tone(urgent ? 1500 : 1200, t, 0.03, { vol: urgent ? 0.06 : 0.04, type: 'square', filter: 2500 })
}

/** Tiếng combo: arpeggio cao dần theo độ dài chuỗi (x2, x3… nghe "lên level") */
export function comboSfx(n: number) {
  if (!audio.sfx || !ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + 0.01
  const base = 523.25 * Math.pow(2, Math.min(n - 2, 12) / 12)
  ;[1, 1.26, 1.5, 2].forEach((m, i) => tone(base * m, t + i * 0.045, 0.18, { vol: 0.1, type: 'square', filter: 3200 }))
  if (n % 5 === 0) [2.52, 3].forEach((m, i) => tone(base * m, t + 0.2 + i * 0.06, 0.3, { vol: 0.09, type: 'triangle' }))
}

export function sfx(name: Sfx) {
  if (!audio.sfx || !ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + 0.01
  switch (name) {
    case 'boss':
      if (audio.bossMusic === 'off') break // đã tắt âm báo boss
      // báo boss tới: 2 nốt chuông nhẹ (bản cũ có trống + sawtooth, quá to)
      if (audio.bossMusic === 'drama') {
        tone(220, t, 0.35, { vol: 0.12, type: 'sawtooth', filter: 1000 }); tone(208, t + 0.38, 0.5, { vol: 0.12, type: 'sawtooth', filter: 1000 })
        noise(t, 0.3, { type: 'lowpass', freq: 300, vol: 0.25 })
      } else {
        tone(660, t, 0.25, { vol: 0.1, type: 'triangle' }); tone(523, t + 0.22, 0.4, { vol: 0.1, type: 'triangle' })
      }
      break
    case 'bossWin': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.09, 0.4, { vol: 0.14, type: 'square', filter: 3000 })); break
    case 'bossLose': [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * 0.16, 0.35, { vol: 0.15, type: 'triangle' })); break
    case 'tap': tone(900, t, 0.05, { vol: 0.12, type: 'triangle' }); break
    case 'buy': coinJingle(t); break
    case 'cup': noise(t, 0.08, { freq: 500, q: 2, vol: 0.4 }); tone(220, t, 0.1, { vol: 0.2, type: 'triangle', to: 160 }); break
    case 'ice':
      for (let i = 0; i < 5; i++) {
        const dt = t + i * 0.055 + Math.random() * 0.02
        tone(2400 + Math.random() * 1800, dt, 0.12, { vol: 0.12, type: 'sine' })
        noise(dt, 0.04, { freq: 4000, q: 3, vol: 0.1 })
      }
      break
    case 'pour': noise(t, 0.7, { type: 'bandpass', freq: 700, to: 1600, q: 1.5, vol: 0.35, attack: 0.08 }); break
    case 'drip':
      tone(70, t, 0.5, { vol: 0.08, type: 'sawtooth', filter: 300 })
      for (let i = 0; i < 6; i++) tone(900 + Math.random() * 300, t + i * 0.13, 0.08, { vol: 0.2, to: 1700 })
      noise(t, 0.6, { freq: 1200, q: 1, vol: 0.08, attack: 0.1 })
      break
    case 'squeeze': noise(t, 0.35, { type: 'lowpass', freq: 400, to: 250, vol: 0.4, attack: 0.05 }); tone(140, t, 0.3, { vol: 0.1, to: 110 }); break
    case 'stir':
      for (let i = 0; i < 6; i++) tone(3200 + (i % 2) * 500, t + i * 0.08, 0.06, { vol: 0.09, type: 'triangle' })
      noise(t, 0.5, { freq: 2500, q: 2, vol: 0.06 })
      break
    case 'plop': tone(500, t, 0.12, { vol: 0.25, to: 180 }); break
    case 'shake':
      for (let i = 0; i < 8; i++) { noise(t + i * 0.11, 0.08, { freq: 2600, q: 1.5, vol: 0.18 }); tone(2800 + (i % 2) * 600, t + i * 0.11, 0.05, { vol: 0.06, type: 'triangle' }) }
      break
    case 'blend':
      tone(90, t, 1.0, { vol: 0.12, type: 'sawtooth', filter: 600, to: 140, attack: 0.08 })
      noise(t, 1.0, { type: 'bandpass', freq: 900, to: 1400, q: 0.8, vol: 0.22, attack: 0.1 })
      break
    case 'coin':
      tone(1318, t, 0.12, { vol: 0.18, type: 'square', filter: 3000 })
      tone(1760, t + 0.08, 0.35, { vol: 0.16, type: 'square', filter: 3000 })
      break
    case 'wrong': tone(180, t, 0.18, { vol: 0.2, type: 'sawtooth', filter: 800 }); tone(150, t + 0.12, 0.2, { vol: 0.2, type: 'sawtooth', filter: 800 }); break
    case 'horn': tone(520, t, 0.14, { vol: 0.16, type: 'square', filter: 1800 }); tone(520, t + 0.2, 0.18, { vol: 0.16, type: 'square', filter: 1800 }); break
    case 'angry': tone(400, t, 0.35, { vol: 0.15, type: 'triangle', to: 200 }); break
    case 'bell': tone(1568, t, 0.5, { vol: 0.08 }); tone(2093, t + 0.1, 0.6, { vol: 0.06 }); break
    case 'done': [784, 988, 1175].forEach((f, i) => tone(f, t + i * 0.07, 0.25, { vol: 0.13, type: 'triangle' })); break
    case 'heart': [659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.1, 0.5, { vol: 0.1 })); break
    case 'comboBreak': [660, 494, 370, 277].forEach((f, i) => tone(f, t + i * 0.06, 0.16, { vol: 0.12, type: 'square', filter: 1800 })); noise(t, 0.25, { type: 'highpass', freq: 2500, vol: 0.2 }); break
    case 'rush': // còi báo giờ cao điểm: 2 hồi lên giọng + trống dồn
      [0, 0.28].forEach((d) => { tone(587, t + d, 0.12, { vol: 0.12, type: 'square', filter: 2400 }); tone(880, t + d + 0.12, 0.14, { vol: 0.12, type: 'square', filter: 2400 }) })
      for (let i = 0; i < 4; i++) noise(t + 0.6 + i * 0.09, 0.06, { type: 'lowpass', freq: 220, vol: 0.5 })
      break
    case 'whoosh': noise(t, 0.25, { type: 'bandpass', freq: 600, to: 2400, q: 1.2, vol: 0.25, attack: 0.04 }); break
    case 'dayEnd': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.3, { vol: 0.12, type: 'triangle' })); break
  }
}

// ---------- Nhạc nền quán (file nhạc CC0, phát lặp liền mạch bằng Web Audio) ----------
const base = import.meta.env.BASE_URL
const canOgg = (() => { try { return new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '' } catch { return false } })()
const buffers: Partial<Record<string, AudioBuffer>> = {}
const loading: Partial<Record<string, Promise<AudioBuffer | null>>> = {}

function loadTrack(id: TrackId): Promise<AudioBuffer | null> {
  const file = id === 'report' ? audio.reportTrack : MUSIC_FILES[id]
  const key = id === 'report' ? `report:${file}` : id
  if (buffers[key]) return Promise.resolve(buffers[key]!)
  if (!loading[key]) {
    const url = `${base}assets/music/${file}.${canOgg ? 'ogg' : 'm4a'}`
    loading[key] = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((ab) => ctx!.decodeAudioData(ab))
      .then((b) => { buffers[key] = b; return b })
      .catch(() => null)
  }
  return loading[key]!
}

// Thời gian trong ngày (0..1) — giữ lại cho các phần khác gọi tới
export function setDayFrac(_f: number) { /* nhạc giờ phát luân phiên, không đổi theo giờ trong ngày */ }
let nextIdx = 0 // luôn bắt đầu từ bài đầu danh sách (2 bài Giáng sinh) rồi đi lần lượt

let current: { id: TrackId; src: AudioBufferSourceNode; gain: GainNode; started: number; dur: number } | null = null
let switching = false
let timer = 0

// Chế độ boss: chuyển sang nhạc kịch tính
let bossMode = false
export function setBossMode(on: boolean) {
  bossMode = on
  if (on && ctx && bossTrack()) void loadTrack(bossTrack()!)
  if (timer) tickMusic()
}

// Màn tổng kết cuối ngày: phát nhạc riêng (lặp) tới khi sang ngày mới
let reportMode = false, gameReport = false, previewing = false
function applyReport(on: boolean) {
  if (reportMode === on) return
  reportMode = on
  // đổi nhạc NGAY khi màn tổng kết hiện (không chờ chu kỳ kiểm tra 1.5 giây)
  if (timer) tickMusic()
}
export function setReportMode(on: boolean) { gameReport = on; applyReport(on || previewing) }
/** Tải sẵn nhạc tổng kết từ đầu ngày để lúc hết ngày phát được ngay, khớp với màn tổng kết */
export function preloadReport() { if (ctx) void loadTrack('report') }
/** Cài đặt: nghe thử nhạc tổng kết vài giây rồi trở lại nhạc quán */
let previewTimer = 0
export function previewReport(file: string) {
  audio.reportTrack = file
  if (!audio.music) return
  clearTimeout(previewTimer)
  applyReport(false) // đổi bài đang thử → phát lại từ đầu bài mới
  previewing = true
  applyReport(true)
  previewTimer = window.setTimeout(() => { previewing = false; applyReport(gameReport) }, 9000)
}
function bossTrack(): TrackId | null { return audio.bossMusic === 'drama' ? 'boss' : audio.bossMusic === 'soft' ? 'bossSoft' : null }
function pickWanted(): TrackId {
  if (reportMode) return 'report'
  if (bossMode && bossTrack()) return bossTrack()!
  if (audio.track !== 'auto' && PLAYLIST.includes(audio.track)) return audio.track // hết mùa Noel: bài Noel đã chọn → về phát luân phiên
  // luân phiên: giữ bài đang phát đủ LOOPS_PER_TRACK vòng rồi sang bài kế tiếp trong danh sách
  if (current && PLAYLIST.includes(current.id)) {
    const loops = (ctx!.currentTime - current.started) / current.dur
    if (loops < LOOPS_PER_TRACK - 0.03) return current.id
    return PLAYLIST[(PLAYLIST.indexOf(current.id) + 1) % PLAYLIST.length]
  }
  // vừa hết nhạc boss / mới mở: phát bài tiếp theo trong vòng
  return PLAYLIST[nextIdx % PLAYLIST.length]
}

let queued = false
async function playTrack(id: TrackId) {
  if (!ctx) return
  if (switching) { queued = true; return } // đang tải bài khác: xong sẽ kiểm tra lại ngay
  switching = true
  const buf = await loadTrack(id)
  switching = false
  if (queued) { queued = false; const w = pickWanted(); if (w !== id) { void playTrack(w); return } }
  if (!buf || !audio.music || !timer) return
  const now = ctx.currentTime
  // giảm dần bài cũ
  if (current) {
    const old = current
    old.gain.gain.cancelScheduledValues(now)
    old.gain.gain.setValueAtTime(old.gain.gain.value, now)
    old.gain.gain.linearRampToValueAtTime(0, now + (id === 'report' ? 0.12 : old.id === 'report' ? 0.4 : isBossTrack(id) ? 0.8 : 1.8))
    try { old.src.stop(now + 2) } catch { /* bỏ qua */ }
  }
  const fade = id === 'report' ? 0.04 : isBossTrack(id) ? 0.8 : 1.8
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(BOSS_GAIN[id] ?? 1, now + fade)
  src.connect(g); g.connect(musicBus)
  src.start(now + (id === 'report' ? 0.01 : 0.05))
  current = { id, src, gain: g, started: now, dur: buf.duration }
  if (PLAYLIST.includes(id)) nextIdx = PLAYLIST.indexOf(id) + 1
  audio.playing = id
  // tải trước bài kế tiếp để đổi bài mượt
  if (PLAYLIST.includes(id)) void loadTrack(PLAYLIST[(PLAYLIST.indexOf(id) + 1) % PLAYLIST.length])
  if (bossTrack()) void loadTrack(bossTrack()!)
}

function tickMusic() {
  if (!ctx || !audio.music) return
  const want = pickWanted()
  if (!current || current.id !== want) void playTrack(want)
}

export function startMusic() {
  if (!ctx || !audio.unlocked || !audio.music) return
  musicBus.gain.cancelScheduledValues(ctx.currentTime)
  musicBus.gain.setTargetAtTime(0.26, ctx.currentTime, 0.5)
  if (!timer) timer = window.setInterval(tickMusic, 1500)
  tickMusic()
}

export function stopMusic() {
  if (!ctx) return
  if (timer) { clearInterval(timer); timer = 0 }
  audio.playing = ''
  musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
  if (current) {
    const c = current
    current = null
    try { c.src.stop(ctx.currentTime + 0.8) } catch { /* bỏ qua */ }
  }
}
