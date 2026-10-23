// Âm thanh: hiệu ứng tự tổng hợp bằng Web Audio + nhạc nền CC0 (Abstraction / Tallbeard Studios)
import { reactive, watch } from 'vue'

const KEY = 'dreamers-audio'
// Nhạc nền trong quán: 5 vòng bossa nova nhẹ nhàng sáng tác riêng cho game (tools/bossa.py), phát luân phiên.
// Nhạc khi boss tới: "Out of Time" — Abstraction / Tallbeard Studios (CC0), file trong public/assets/music
export type TrackId = 'somMai' | 'muaPhun' | 'hemNho' | 'chieuHien' | 'lyDenDa' | 'boss'
export type TrackChoice = Exclude<TrackId, 'boss'> | 'auto'
export const MUSIC_FILES: Record<TrackId, string> = {
  somMai: 'bossa-som-mai',
  muaPhun: 'bossa-mua-phun',
  hemNho: 'bossa-hem-nho',
  chieuHien: 'bossa-chieu-hien',
  lyDenDa: 'bossa-ly-den-da',
  boss: 'boss-out-of-time', // nhạc hồi hộp khi boss tới (giữ nguyên)
}
/** Thứ tự phát luân phiên */
const PLAYLIST: TrackId[] = ['somMai', 'muaPhun', 'hemNho', 'chieuHien', 'lyDenDa']
/** Mỗi bài lặp mấy vòng (~1 phút/vòng) rồi chuyển bài kế tiếp */
const LOOPS_PER_TRACK = 2
export const TRACK_LIST: { id: TrackChoice; name: string; icon: string; desc: string }[] = [
  { id: 'auto', name: 'Phát luân phiên', icon: '', desc: '5 bài bossa nova lần lượt, đổi bài mỗi ~2 phút' },
  { id: 'somMai', name: 'Sớm mai', icon: '', desc: 'Bossa sáng sớm, sáo nhẹ' },
  { id: 'muaPhun', name: 'Mưa phùn', icon: '', desc: 'Chậm, vibraphone êm' },
  { id: 'hemNho', name: 'Hẻm nhỏ', icon: '', desc: 'Rhodes ấm, hơi jazz' },
  { id: 'chieuHien', name: 'Chiều hiên', icon: '', desc: 'Thong thả buổi chiều' },
  { id: 'lyDenDa', name: 'Ly đen đá', icon: '', desc: 'Giọng thứ, hơi hoài niệm' },
]
export const audio = reactive({ music: true, sfx: true, volume: 0.7, unlocked: false, track: 'auto' as TrackChoice, playing: '' as TrackId | '' })
try {
  const s = JSON.parse(localStorage.getItem(KEY) || 'null')
  if (s) { audio.music = !!s.music; audio.sfx = !!s.sfx; if (typeof s.volume === 'number') audio.volume = Math.min(1, Math.max(0, s.volume)); if (s.track === 'auto' || (s.track in MUSIC_FILES && s.track !== 'boss')) audio.track = s.track }
} catch { /* bỏ qua */ }
/** Âm lượng tổng: thanh trượt 0..1 -> mức thật (mặc định 0.7 ≈ nhỏ vừa phải) */
function masterLevel() { return 0.6 * audio.volume * audio.volume + 0.05 * audio.volume }
watch(() => audio.volume, () => {
  try { localStorage.setItem(KEY, JSON.stringify({ music: audio.music, sfx: audio.sfx, track: audio.track, volume: audio.volume })) } catch { /* bỏ qua */ }
  if (ctx) master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, 0.05)
})
watch(() => [audio.music, audio.sfx, audio.track], () => {
  try { localStorage.setItem(KEY, JSON.stringify({ music: audio.music, sfx: audio.sfx, track: audio.track, volume: audio.volume })) } catch { /* bỏ qua */ }
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

// ---------- Hiệu ứng âm thanh ----------
export type Sfx = 'boss' | 'bossWin' | 'bossLose' | 'tap' | 'cup' | 'ice' | 'pour' | 'drip' | 'squeeze' | 'stir' | 'plop' | 'shake' | 'blend' | 'coin' | 'wrong' | 'horn' | 'angry' | 'bell' | 'done' | 'heart' | 'dayEnd' | 'buy'

/** Tiếng "bíp" nhỏ khi chữ hiện ra từng chữ (như khách đang nói). pitch: giọng cao/thấp theo khách */
export function talkBlip(pitch = 520) {
  if (!audio.sfx || !ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + 0.005
  tone(pitch * (0.92 + Math.random() * 0.16), t, 0.04, { vol: 0.035, type: 'square', filter: 1600 })
}

/** Tiếng "tích" đồng hồ khi khách sắp hết kiên nhẫn */
export function tick(urgent = false) {
  if (!audio.sfx || !ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + 0.005
  tone(urgent ? 1500 : 1200, t, 0.03, { vol: urgent ? 0.06 : 0.04, type: 'square', filter: 2500 })
}

export function sfx(name: Sfx) {
  if (!audio.sfx || !ctx || ctx.state !== 'running') return
  const t = ctx.currentTime + 0.01
  switch (name) {
    case 'boss':
      // cảnh báo kịch tính: 2 nốt trầm + tiếng trống
      tone(220, t, 0.35, { vol: 0.2, type: 'sawtooth', filter: 1200 }); tone(208, t + 0.38, 0.5, { vol: 0.2, type: 'sawtooth', filter: 1200 })
      tone(110, t, 0.9, { vol: 0.18, type: 'square', filter: 500 })
      noise(t, 0.4, { type: 'lowpass', freq: 300, vol: 0.5 }); noise(t + 0.38, 0.5, { type: 'lowpass', freq: 250, vol: 0.5 })
      break
    case 'bossWin': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.09, 0.4, { vol: 0.14, type: 'square', filter: 3000 })); break
    case 'bossLose': [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * 0.16, 0.35, { vol: 0.15, type: 'triangle' })); break
    case 'tap': tone(900, t, 0.05, { vol: 0.12, type: 'triangle' }); break
    case 'buy': tone(660, t, 0.08, { vol: 0.15, type: 'triangle' }); tone(990, t + 0.06, 0.1, { vol: 0.12, type: 'triangle' }); break
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
    case 'dayEnd': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.3, { vol: 0.12, type: 'triangle' })); break
  }
}

// ---------- Nhạc nền quán (file nhạc CC0, phát lặp liền mạch bằng Web Audio) ----------
const base = import.meta.env.BASE_URL
const canOgg = (() => { try { return new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '' } catch { return false } })()
const buffers: Partial<Record<TrackId, AudioBuffer>> = {}
const loading: Partial<Record<TrackId, Promise<AudioBuffer | null>>> = {}

function loadTrack(id: TrackId): Promise<AudioBuffer | null> {
  if (buffers[id]) return Promise.resolve(buffers[id]!)
  if (!loading[id]) {
    const url = `${base}assets/music/${MUSIC_FILES[id]}.${canOgg ? 'ogg' : 'm4a'}`
    loading[id] = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((ab) => ctx!.decodeAudioData(ab))
      .then((b) => { buffers[id] = b; return b })
      .catch(() => null)
  }
  return loading[id]!
}

// Thời gian trong ngày (0..1) — giữ lại cho các phần khác gọi tới
export function setDayFrac(_f: number) { /* nhạc giờ phát luân phiên, không đổi theo giờ trong ngày */ }
let nextIdx = Math.floor(Math.random() * PLAYLIST.length) // bắt đầu ở 1 bài ngẫu nhiên rồi đi lần lượt

let current: { id: TrackId; src: AudioBufferSourceNode; gain: GainNode; started: number; dur: number } | null = null
let switching = false
let timer = 0

// Chế độ boss: chuyển sang nhạc kịch tính
let bossMode = false
export function setBossMode(on: boolean) {
  bossMode = on
  if (on && ctx) void loadTrack('boss')
  if (timer) tickMusic()
}

function pickWanted(): TrackId {
  if (bossMode) return 'boss'
  if (audio.track !== 'auto') return audio.track
  // luân phiên: giữ bài đang phát đủ LOOPS_PER_TRACK vòng rồi sang bài kế tiếp trong danh sách
  if (current && PLAYLIST.includes(current.id)) {
    const loops = (ctx!.currentTime - current.started) / current.dur
    if (loops < LOOPS_PER_TRACK - 0.03) return current.id
    return PLAYLIST[(PLAYLIST.indexOf(current.id) + 1) % PLAYLIST.length]
  }
  // vừa hết nhạc boss / mới mở: phát bài tiếp theo trong vòng
  return PLAYLIST[nextIdx % PLAYLIST.length]
}

async function playTrack(id: TrackId) {
  if (!ctx || switching) return
  switching = true
  const buf = await loadTrack(id)
  switching = false
  if (!buf || !audio.music || !timer) return
  const now = ctx.currentTime
  // giảm dần bài cũ
  if (current) {
    const old = current
    old.gain.gain.cancelScheduledValues(now)
    old.gain.gain.setValueAtTime(old.gain.gain.value, now)
    old.gain.gain.linearRampToValueAtTime(0, now + (id === 'boss' ? 0.6 : 1.8))
    try { old.src.stop(now + 2) } catch { /* bỏ qua */ }
  }
  const fade = id === 'boss' ? 0.6 : 1.8
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(id === 'boss' ? 1.25 : 1, now + fade)
  src.connect(g); g.connect(musicBus)
  src.start(now + 0.05)
  current = { id, src, gain: g, started: now, dur: buf.duration }
  if (PLAYLIST.includes(id)) nextIdx = PLAYLIST.indexOf(id) + 1
  audio.playing = id
  // tải trước bài kế tiếp để đổi bài mượt
  if (PLAYLIST.includes(id)) void loadTrack(PLAYLIST[(PLAYLIST.indexOf(id) + 1) % PLAYLIST.length])
  void loadTrack('boss')
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
