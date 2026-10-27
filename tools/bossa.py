"""
Tổng hợp 5 vòng nhạc bossa nova nhẹ nhàng cho quán Dreamers Coffee (tự sáng tác + tự tổng hợp, không dùng mẫu âm thanh có bản quyền).
Nhạc cụ: guitar nylon (tổng hợp cộng hưởng), Rhodes (FM), contrabass, flute / vibraphone, shaker + rim click + kick nhẹ.
Mỗi bài = vòng hoà âm 16 ô nhịp x 2 lần, xuất ra file lặp liền mạch (đuôi reverb được gói vòng về đầu bài).

Chạy:  python3 bossa.py OUT_DIR
"""
import sys, os, math
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
rng = np.random.default_rng(7)

# ---------------- hoà âm ----------------
NOTE = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
QUAL = {
    'maj7': [0, 4, 7, 11], 'maj9': [0, 4, 7, 11, 14], '69': [0, 4, 7, 9, 14], '6': [0, 4, 7, 9],
    'm7': [0, 3, 7, 10], 'm9': [0, 3, 7, 10, 14], 'm6': [0, 3, 7, 9],
    '7': [0, 4, 7, 10], '9': [0, 4, 7, 10, 14], '13': [0, 4, 10, 14, 21], '7b9': [0, 4, 7, 10, 13],
    'm7b5': [0, 3, 6, 10],
}


def chord(sym):
    root, q = sym.split(':')
    r = NOTE[root]
    return r, [(r + i) % 12 for i in QUAL[q]], QUAL[q]


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------- nhạc cụ ----------------
def env_exp(n, attack, decay_s):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay_s)


def nylon(freq, dur, vel):
    """Guitar dây nylon: cộng hưởng nhiều hoạ âm, hoạ âm cao tắt nhanh hơn, thêm tiếng gảy."""
    n = int(SR * (dur + 1.2))
    t = np.arange(n) / SR
    out = np.zeros(n)
    bright = 0.6 + 0.4 * vel
    for h in range(1, 14):
        f = freq * h * (1 + 0.0004 * h * h)  # hơi lệch hoạ âm như dây thật
        if f > 9000:
            break
        amp = (1 / h ** 1.25) * (bright ** (h - 1)) * (0.85 if h % 2 == 0 else 1)
        dec = 1.6 / (1 + 0.55 * (h - 1)) * (220 / max(freq, 110)) ** 0.3
        out += amp * np.sin(2 * np.pi * f * t + rng.random() * 6.28) * np.exp(-t / dec)
    # tiếng móng tay gảy
    k = int(0.012 * SR)
    out[:k] += rng.normal(0, 0.25, k) * np.linspace(1, 0, k) * vel
    a = np.clip(t / 0.003, 0, 1)
    # tắt tiếng (giảm âm) sau độ dài nốt
    rel = np.where(t > dur, np.exp(-(t - dur) / 0.12), 1.0)
    return out * a * rel * vel


def rhodes(freq, dur, vel):
    """Electric piano kiểu Rhodes bằng FM: tiếng chuông lúc đầu, êm dần."""
    n = int(SR * (dur + 1.0))
    t = np.arange(n) / SR
    idx = (1.6 * vel + 0.4) * np.exp(-t / 0.35) + 0.25
    mod = np.sin(2 * np.pi * freq * t)
    bell = 0.12 * vel * np.sin(2 * np.pi * freq * 14 * t) * np.exp(-t / 0.05)
    car = np.sin(2 * np.pi * freq * t + idx * mod) + bell
    env = env_exp(n, 0.002, 1.6) * np.where(t > dur, np.exp(-(t - dur) / 0.25), 1.0)
    return car * env * vel


def bass(freq, dur, vel):
    """Contrabass gảy ngón: nền ấm, tắt nhanh."""
    n = int(SR * (dur + 0.4))
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) * np.exp(-t / 0.25) + 0.12 * np.sin(6 * np.pi * freq * t) * np.exp(-t / 0.12)
    env = env_exp(n, 0.006, 0.9) * np.where(t > dur, np.exp(-(t - dur) / 0.07), 1.0)
    k = int(0.01 * SR)
    s[:k] += rng.normal(0, 0.15, k) * np.linspace(1, 0, k)
    return s * env * vel


def flute(freq, dur, vel):
    n = int(SR * (dur + 0.35))
    t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.0 * t) * np.clip((t - 0.18) / 0.3, 0, 1)
    ph = 2 * np.pi * freq * np.cumsum(vib) / SR
    s = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)
    breath = sosfilt(butter(2, [freq * 1.5, min(freq * 6, 15000)], 'band', fs=SR, output='sos'), rng.normal(0, 1, n)) * 0.08
    a = np.clip(t / 0.07, 0, 1)
    rel = np.where(t > dur, np.exp(-(t - dur) / 0.09), 1.0)
    return (s + breath) * a * rel * vel * (0.92 + 0.08 * np.exp(-t / 0.4))


def vibes(freq, dur, vel):
    n = int(SR * (dur + 1.8))
    t = np.arange(n) / SR
    trem = 1 - 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 5.2 * t))
    s = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 4.0 * t) * np.exp(-t / 0.15) + 0.06 * np.sin(2 * np.pi * freq * 10 * t) * np.exp(-t / 0.03)
    env = env_exp(n, 0.002, 2.2) * np.where(t > dur + 0.6, np.exp(-(t - dur - 0.6) / 0.35), 1.0)
    return s * env * trem * vel


LEADS = {'flute': flute, 'vibes': vibes, 'rhodes': rhodes}


def bp_noise(n, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), rng.normal(0, 1, n))


def shaker(vel):
    n = int(0.07 * SR)
    t = np.arange(n) / SR
    s = bp_noise(n, 5000, 12000) * np.clip(t / 0.008, 0, 1) * np.exp(-t / 0.022)
    return s * vel


def rim(vel):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    s = 0.6 * np.sin(2 * np.pi * 1750 * t) * np.exp(-t / 0.012) + bp_noise(n, 1500, 4500) * np.exp(-t / 0.01) * 0.5
    return s * vel


def kick(vel):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f = 48 + 45 * np.exp(-t / 0.03)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    return s * vel


# ---------------- máy trộn ----------------
class Bus:
    def __init__(self, n):
        self.L = np.zeros(n)
        self.R = np.zeros(n)
        self.n = n

    def add(self, sig, t0, pan=0.0, gain=1.0):
        i = max(0, int(t0 * SR))
        if i >= self.n:
            return
        sig = sig * gain
        j = min(self.n, i + len(sig))
        seg = sig[: j - i]
        lg = math.cos((pan + 1) * math.pi / 4)
        rg = math.sin((pan + 1) * math.pi / 4)
        self.L[i:j] += seg * lg
        self.R[i:j] += seg * rg


def reverb_ir(seconds=2.2, seed=1):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = r.normal(0, 1, n) * np.exp(-t / (seconds / 6.5))
    ir = sosfilt(butter(1, 5500, 'low', fs=SR, output='sos'), ir)
    ir[: int(0.012 * SR)] = 0  # pre-delay
    return ir / np.sqrt(np.sum(ir ** 2))


IR_L, IR_R = reverb_ir(seed=1), reverb_ir(seed=2)


# ---------------- sáng tác ----------------
def voicing(tones_pc, prev, center=62):
    """Chọn 4 nốt hợp âm (không gốc khi có đủ nốt) gần nhau, nối giọng mượt với hợp âm trước."""
    pcs = tones_pc[1:] if len(tones_pc) >= 5 else tones_pc
    pcs = pcs[:4]
    tgt = np.mean(prev) if prev else center
    notes = []
    for pc in pcs:
        cands = [pc + 12 * o for o in range(3, 7)]
        notes.append(min(cands, key=lambda m: abs(m - tgt)))
    notes = sorted(set(notes))
    while max(notes) - min(notes) > 14:  # gom lại cho gọn tay
        hi = max(notes)
        notes.remove(hi)
        notes.append(hi - 12)
        notes = sorted(set(notes))
    while np.mean(notes) > center + 5:
        notes = [m - 12 if m == max(notes) else m for m in notes]
        notes = sorted(notes)
    while np.mean(notes) < center - 5:
        notes = [m + 12 if m == min(notes) else m for m in notes]
        notes = sorted(notes)
    return notes


MOTIFS = [  # (phách bắt đầu, độ dài) trong 2 ô nhịp = 8 phách
    [(0, 1.5), (1.5, 1), (2.5, 1.5), (4, 3)],
    [(0.5, 0.5), (1, 1), (2, 0.5), (2.5, 1.5), (4.5, 0.5), (5, 2.5)],
    [(0, 1), (1, 0.5), (1.5, 2), (4, 0.5), (4.5, 0.5), (5, 1), (6, 1.5)],
    [(1, 1), (2, 1), (3, 1.5), (4.5, 3)],
    [(0, 0.5), (0.5, 0.5), (1, 0.5), (1.5, 2.5), (4.5, 1), (5.5, 2)],
]
FORM = ['A', 'B', 'A', 'C', 'A', 'B', 'D', 'E']


def compose(track, seed):
    r = np.random.default_rng(seed)
    bpm = track['bpm']
    beat = 60 / bpm
    prog = track['prog']  # list (chord, beats), tổng 64 phách
    total_beats = sum(b for _, b in prog) * 2
    L = total_beats * beat
    n = int((L + 3.5) * SR)
    dry = Bus(n)   # nhạc cụ khô
    wet = Bus(n)   # gửi vào reverb

    # bảng hợp âm theo phách
    timeline = []
    t = 0
    for rep in range(2):
        for sym, b in prog:
            timeline.append((t, b, sym))
            t += b

    def chord_at(bt):
        for (s, b, sym) in timeline:
            if s <= bt < s + b:
                return sym
        return timeline[-1][2]

    hum = lambda: r.normal(0, 0.006)

    # --- guitar comping kiểu bossa (16 ô 1/16 / ô nhịp) ---
    pat = [[0, 3, 6, 10, 13], [2, 6, 10, 13]]
    prev = None
    voiced = {}
    for bar in range(total_beats // 4):
        for k in pat[bar % 2]:
            bt = bar * 4 + k / 4
            sym = chord_at(bt + 0.01)
            if sym not in voiced or r.random() < 0.08:
                _, pcs, _ = chord(sym)
                voiced[sym] = voicing(pcs, prev)
            v = voiced[sym]
            prev = v
            nxt = [kk for kk in pat[bar % 2] if kk > k]
            dur = ((nxt[0] - k) / 4 if nxt else (16 - k) / 4) * beat * 0.92
            vel = (0.55 if k in (0, 6, 10) else 0.42) * (0.9 + 0.2 * r.random())
            strum = 0.012 * (1 if r.random() < 0.7 else -1)
            for i, m in enumerate(v if strum > 0 else v[::-1]):
                s = nylon(midi_hz(m), dur, vel * (0.85 + 0.15 * i / 3))
                tt = bt * beat + i * abs(strum) + hum()
                dry.add(s, tt, pan=-0.28, gain=0.16)
                wet.add(s, tt, pan=-0.28, gain=0.05)

    # --- contrabass ---
    bass_pat = [(0, 1.5, 'r'), (1.5, 0.5, '5'), (2, 1.5, '5'), (3.5, 0.5, 'r')]
    for bar in range(total_beats // 4):
        for (bb, d, which) in bass_pat:
            bt = bar * 4 + bb
            sym = chord_at(bt + 0.01)
            root, pcs, ints = chord(sym)
            pc = root if which == 'r' else (root + (6 if 6 in ints else 7)) % 12
            m = 28 + ((pc - 4) % 12)  # dải E1..D#2
            if m < 31:
                m += 12
            s = bass(midi_hz(m), d * beat * 0.95, 0.9 if which == 'r' else 0.7)
            dry.add(s, bt * beat + hum(), pan=0.0, gain=0.42)
            wet.add(s, bt * beat, pan=0.0, gain=0.03)

    # --- Rhodes pad nhẹ ở đầu mỗi hợp âm (lần 2 của vòng) ---
    if track.get('pad', True):
        for (s0, b, sym) in timeline:
            if s0 < total_beats / 2 and track['lead'] == 'rhodes':
                continue
            _, pcs, _ = chord(sym)
            v = [m + 12 for m in voicing(pcs, None, center=60)]
            for i, m in enumerate(v):
                sg = rhodes(midi_hz(m), b * beat * 0.9, 0.32)
                dry.add(sg, s0 * beat + 0.02 + i * 0.006, pan=0.35, gain=0.07)
                wet.add(sg, s0 * beat, pan=0.35, gain=0.05)

    # --- giai điệu ---
    lead = LEADS[track['lead']]
    lo, hi = track['range']
    last = (lo + hi) // 2
    steps_by_letter = {}
    rhythm_by_letter = {}
    for half in range(2):
        for p, letter in enumerate(FORM):
            if half == 0 and p == 0 and track.get('intro', True):
                continue  # 2 ô nhịp đầu để guitar dẫn
            if letter == 'E':
                # câu kết: 1 nốt dài nghỉ ngơi
                rhythm = [(0, 3), (4, 0.5), (4.5, 3)] if half == 0 else [(0, 6)]
            else:
                if letter not in rhythm_by_letter:
                    rhythm_by_letter[letter] = MOTIFS[r.integers(len(MOTIFS))]
                    steps_by_letter[letter] = [int(x) for x in r.choice([-2, -1, -1, 1, 1, 2, 3, -3], size=8)]
                rhythm = rhythm_by_letter[letter]
            steps = steps_by_letter.get(letter, [0] * 8)
            base_bt = half * 64 + p * 8
            for i, (st, d) in enumerate(rhythm):
                bt = base_bt + st
                sym = chord_at(bt + 0.01)
                root, pcs, ints = chord(sym)
                tones = set(pcs)
                target = last + steps[i % len(steps)] * 2
                cands = [m for m in range(lo, hi + 1) if m % 12 in tones]
                m = min(cands, key=lambda x: (abs(x - target), r.random()))
                if abs(m - last) > 7:  # tránh nhảy quá xa
                    m = min(cands, key=lambda x: abs(x - last))
                last = m
                vel = 0.55 + 0.25 * r.random() if st % 1 == 0 else 0.5
                sg = lead(midi_hz(m), d * beat * 0.95, vel)
                g = {'flute': 0.17, 'vibes': 0.2, 'rhodes': 0.22}[track['lead']]
                dry.add(sg, bt * beat + hum(), pan=0.08, gain=g)
                wet.add(sg, bt * beat, pan=0.08, gain=g * 0.55)

    # --- trống: shaker 1/16, rim click kiểu bossa, kick nhẹ ---
    rim_pat = [[0, 6, 12], [4, 10]]
    for bar in range(total_beats // 4):
        intro = bar < 2 and track.get('intro', True)
        for k in range(16):
            bt = bar * 4 + k / 4
            acc = [0.35, 0.6, 0.45, 0.85][k % 4]
            if not intro:
                s = shaker(acc * (0.9 + 0.2 * r.random()))
                dry.add(s, bt * beat + hum() * 0.5, pan=0.4, gain=0.05)
        if not intro:
            for k in rim_pat[bar % 2]:
                s = rim(0.7 + 0.2 * r.random())
                dry.add(s, (bar * 4 + k / 4) * beat, pan=-0.15, gain=0.06)
                wet.add(s, (bar * 4 + k / 4) * beat, pan=-0.15, gain=0.04)
            for kb in (0, 2.5, 3):
                dry.add(kick(0.6 if kb == 0 else 0.4), (bar * 4 + kb) * beat, gain=0.22)

    # --- tích tắc kim đồng hồ (chỉ cho nhạc boss nhẹ): hồi hộp nhưng không ồn ---
    if track.get('tick'):
        for bt in range(total_beats * 2):
            n2 = int(0.03 * SR)
            tt = np.arange(n2) / SR
            f = 2600 if bt % 2 == 0 else 2100
            s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.006)
            dry.add(s, bt * beat / 2, pan=0.5 if bt % 2 else -0.5, gain=0.045)

    # --- trộn + reverb + lặp liền mạch ---
    revL = fftconvolve(wet.L, IR_L)[:n]
    revR = fftconvolve(wet.R, IR_R)[:n]
    Lc = dry.L + revL * 0.9
    Rc = dry.R + revR * 0.9
    N = int(L * SR)
    outL = Lc[:N].copy()
    outR = Rc[:N].copy()
    tail = n - N
    outL[:tail] += Lc[N:]
    outR[:tail] += Rc[N:]
    # ấm hơn: cắt bớt treble, lọc rung tần thấp
    sos_lp = butter(2, 9500, 'low', fs=SR, output='sos')
    sos_hp = butter(2, 35, 'high', fs=SR, output='sos')
    st = np.stack([outL, outR])
    # lọc trên tín hiệu nối vòng để không có tiếng "tách" ở chỗ lặp
    pad = int(0.5 * SR)
    ext = np.concatenate([st[:, -pad:], st, st[:, :pad]], axis=1)
    ext = sosfilt(sos_hp, sosfilt(sos_lp, ext, axis=1), axis=1)
    st = ext[:, pad:-pad]
    st = np.tanh(st / (np.max(np.abs(st)) + 1e-9) * 1.1) * 0.85
    return st, L


TRACKS = [
    dict(id='bossa-som-mai', name='Sớm mai', bpm=126, lead='flute', range=(65, 81),
         prog=[('F:maj7', 4), ('F:maj7', 4), ('G:m7', 4), ('C:9', 4), ('A:m7', 4), ('D:7b9', 4), ('G:m7', 4), ('C:13', 4),
               ('F:maj9', 4), ('F:69', 4), ('Bb:maj7', 4), ('Bb:m6', 4), ('A:m7', 4), ('D:7b9', 4), ('G:m7', 2), ('C:9', 2), ('F:maj7', 2), ('C:7b9', 2)]),
    dict(id='bossa-mua-phun', name='Mưa phùn', bpm=116, lead='vibes', range=(64, 81),
         prog=[('D:m9', 4), ('G:13', 4), ('C:maj9', 4), ('C:maj9', 4), ('C:m9', 4), ('F:13', 4), ('Bb:maj7', 4), ('Bb:maj7', 4),
               ('B:m7b5', 4), ('E:7b9', 4), ('A:m9', 4), ('A:7b9', 4), ('D:m9', 4), ('G:13', 4), ('C:maj9', 2), ('A:7b9', 2), ('D:m9', 2), ('G:7b9', 2)]),
    dict(id='bossa-hem-nho', name='Hẻm nhỏ', bpm=132, lead='rhodes', range=(62, 77),
         prog=[('G:maj7', 4), ('G:maj7', 4), ('A:m7', 4), ('D:9', 4), ('B:m7', 4), ('E:7b9', 4), ('A:m7', 4), ('D:13', 4),
               ('C:maj7', 4), ('C:m6', 4), ('B:m7', 4), ('E:7b9', 4), ('A:m7', 4), ('D:9', 4), ('G:maj7', 2), ('E:7b9', 2), ('A:m7', 2), ('D:9', 2)]),
    dict(id='bossa-chieu-hien', name='Chiều hiên', bpm=120, lead='flute', range=(63, 79),
         prog=[('Eb:maj7', 4), ('Ab:maj7', 4), ('F:m9', 4), ('Bb:13', 4), ('G:m7', 4), ('C:7b9', 4), ('F:m9', 4), ('Bb:13', 4),
               ('Eb:maj9', 4), ('Eb:m7', 2), ('Ab:9', 2), ('Db:maj7', 4), ('Db:maj7', 4), ('F:m9', 4), ('Bb:13', 4), ('Eb:maj7', 2), ('C:7b9', 2), ('F:m9', 2), ('Bb:13', 2)]),
    dict(id='bossa-ly-den-da', name='Ly đen đá', bpm=128, lead='vibes', range=(62, 79),
         prog=[('D:m9', 4), ('D:m9', 4), ('E:m7b5', 4), ('A:7b9', 4), ('D:m9', 4), ('D:m9', 4), ('G:m9', 4), ('C:13', 4),
               ('F:maj7', 4), ('Bb:maj7', 4), ('E:m7b5', 4), ('A:7b9', 4), ('D:m9', 4), ('Bb:maj7', 4), ('E:m7b5', 2), ('A:7b9', 2), ('D:m9', 2), ('A:7b9', 2)]),
    # nhạc khi boss tới: giọng thứ, nhanh hơn, bass dồn + tiếng tích tắc – hồi hộp vừa phải
    dict(id='boss-hoi-hop', name='Hồi hộp nhẹ', bpm=138, lead='rhodes', range=(62, 76), tick=True, intro=False,
         prog=[('A:m9', 4), ('A:m9', 4), ('F:maj7', 4), ('E:7b9', 4), ('A:m9', 4), ('D:m9', 4), ('B:m7b5', 4), ('E:7b9', 4),
               ('D:m9', 4), ('G:13', 4), ('C:maj7', 4), ('F:maj7', 4), ('B:m7b5', 4), ('E:7b9', 4), ('A:m9', 2), ('F:maj7', 2), ('B:m7b5', 2), ('E:7b9', 2)]),
]


def write_wav(path, st):
    import wave
    pcm = (np.clip(st.T, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    only = sys.argv[2:] or [t['id'] for t in TRACKS]
    for i, tr in enumerate(TRACKS):
        assert sum(b for _, b in tr['prog']) == 64, (tr['id'], sum(b for _, b in tr['prog']))
        if tr['id'] not in only:
            continue
        st, L = compose(tr, seed=100 + i)
        write_wav(os.path.join(out, tr['id'] + '.wav'), st)
        print(tr['id'], f'{L:.1f}s')
