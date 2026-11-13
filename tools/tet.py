"""
Nhạc mùa lễ cho Dreamers Coffee – tự sáng tác + tự tổng hợp (không dùng mẫu âm thanh / bài hát có bản quyền).
  tet-lan-ve-pho   "Lân về phố"   – Tết Nguyên Đán: trống lân, chiêng, não bạt + sáo trúc, đàn tranh (điệu Bắc, ngũ cung)
  tet-xuan-sum-vay "Xuân sum vầy" – Tết Nguyên Đán: đàn tranh, đàn bầu, sáo, mõ & phách – êm, ấm cúng ngày Tết
  newyear-dem-nguoc "Đếm ngược"   – Tết Tây: nhạc tiệc countdown (kick 4/4, vỗ tay, synth, arp, chuông)

Chạy:  python3 tet.py OUT_DIR [id ...]
"""
import sys, os, math
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bossa import SR, Bus, reverb_ir, write_wav, midi_hz, tranh, bass, kick as soft_kick  # noqa: E402

rng = np.random.default_rng(2027)
IR_L, IR_R = reverb_ir(2.4, seed=11), reverb_ir(2.4, seed=12)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


# ---------------- nhạc cụ dân tộc ----------------
def dan_bau(freq, dur, vel, bend=-1.0):
    """Đàn bầu: tiếng bồi âm trong vắt, vào nốt bằng cách nắn cần (luyến từ nửa cung), rung sâu ở cuối nốt."""
    n = int(SR * (dur + 0.6))
    t = np.arange(n) / SR
    glide = 2 ** ((bend * np.exp(-t / 0.07)) / 12)
    vib = 1 + 0.012 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.35) / 0.4, 0, 1)
    ph = 2 * np.pi * freq * np.cumsum(glide * vib) / SR
    s = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    env = np.clip(t / 0.012, 0, 1) * np.exp(-t / 1.6) * np.where(t > dur, np.exp(-(t - dur) / 0.15), 1.0)
    return s * env * vel


def sao(freq, dur, vel):
    """Sáo trúc: hơi thở rõ, rung hơi nhanh, đầu nốt có tiếng "phì"."""
    n = int(SR * (dur + 0.3))
    t = np.arange(n) / SR
    vib = 1 + 0.007 * np.sin(2 * np.pi * 5.8 * t) * np.clip((t - 0.15) / 0.25, 0, 1)
    ph = 2 * np.pi * freq * np.cumsum(vib) / SR
    s = np.sin(ph) + 0.12 * np.sin(2 * ph) + 0.04 * np.sin(3 * ph)
    breath = bp(rng.normal(0, 1, n), freq * 1.2, min(freq * 5, 15000)) * 0.13
    chiff = bp(rng.normal(0, 1, n), 2000, 7000) * np.exp(-t / 0.02) * 0.25
    a = np.clip(t / 0.04, 0, 1)
    rel = np.where(t > dur, np.exp(-(t - dur) / 0.07), 1.0)
    return (s + breath + chiff) * a * rel * vel


def trong_lan(vel, low=True):
    """Trống lân: mặt trống to, ù trầm + tiếng da căng."""
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f0 = 95 if low else 170
    f = f0 + f0 * 0.6 * np.exp(-t / 0.025)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.22 if low else 0.1))
    skin = bp(rng.normal(0, 1, n), 300, 1800) * np.exp(-t / 0.03) * 0.5
    return (body + skin) * vel


def go_tang(vel):
    """Gõ tang trống (vành gỗ) – tiếng "cắc"."""
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    s = 0.7 * np.sin(2 * np.pi * 1300 * t) * np.exp(-t / 0.012) + bp(rng.normal(0, 1, n), 1500, 5000) * np.exp(-t / 0.008)
    return s * vel


def chieng(vel, f=170):
    """Chiêng: hoạ âm lệch, ngân dài, hơi tụt cao độ."""
    n = int(3.2 * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for k, (r, a, d) in enumerate([(1, 1, 2.4), (1.48, 0.5, 1.6), (2.13, 0.35, 1.1), (2.94, 0.2, 0.7), (4.1, 0.12, 0.4)]):
        ff = f * r * (1 - 0.01 * (1 - np.exp(-t / 0.5)))
        s += a * np.sin(2 * np.pi * np.cumsum(ff) / SR + k) * np.exp(-t / d)
    hit = bp(rng.normal(0, 1, n), 400, 2500) * np.exp(-t / 0.02) * 0.3
    return (s + hit) * np.clip(t / 0.004, 0, 1) * vel


def nao_bat(vel, open_=True):
    """Não bạt / chũm chọe: tiếng xèng kim loại."""
    n = int((0.9 if open_ else 0.15) * SR)
    t = np.arange(n) / SR
    s = hp(rng.normal(0, 1, n), 3500) * np.exp(-t / (0.35 if open_ else 0.04))
    for f in (3150, 4270, 5610, 7020):
        s += 0.12 * np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / (0.5 if open_ else 0.05))
    return s * vel


def mo(vel, f=820):
    """Mõ gỗ: tiếng "cốc" ấm."""
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.035) + 0.3 * np.sin(2 * np.pi * f * 2.6 * t) * np.exp(-t / 0.01)
    return s * vel


def phach(vel):
    """Phách tre: tiếng "tách" khô."""
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return (bp(rng.normal(0, 1, n), 2500, 8000) * np.exp(-t / 0.006) + 0.4 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.008)) * vel


def dan_day(freq, dur, vel):
    """Bè trầm kiểu đàn đáy (gảy, tắt nhanh) – dùng contrabass sẵn có, sáng hơn chút."""
    return bass(freq, dur, vel)


# ---------------- nhạc cụ tiệc (Tết Tây) ----------------
def saw(ph):
    return 2 * ((ph / (2 * np.pi)) % 1) - 1


def supersaw(freqs, dur, vel, cutoff=3500):
    n = int(SR * (dur + 0.3))
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for d in (-0.012, -0.005, 0, 0.006, 0.013):
            s += saw(2 * np.pi * f * (1 + d) * t + rng.random() * 6)
    s = lp(s / (5 * len(freqs)), cutoff)
    env = np.clip(t / 0.03, 0, 1) * np.where(t > dur, np.exp(-(t - dur) / 0.12), 1.0)
    return s * env * vel


def pluck(freq, dur, vel):
    n = int(SR * (dur + 0.4))
    t = np.arange(n) / SR
    s = np.zeros(n)
    for h in range(1, 12):
        s += (1 / h) * np.sin(2 * np.pi * freq * h * t) * np.exp(-t * (6 + 5 * h))
    return s * np.clip(t / 0.002, 0, 1) * vel


def lead(freq, dur, vel):
    n = int(SR * (dur + 0.25))
    t = np.arange(n) / SR
    vib = 1 + 0.005 * np.sin(2 * np.pi * 6 * t) * np.clip((t - 0.2) / 0.2, 0, 1)
    ph = 2 * np.pi * freq * np.cumsum(vib) / SR
    s = 0.6 * np.sign(np.sin(ph)) * 0.35 + 0.5 * saw(ph) * 0.5 + 0.5 * np.sin(ph)
    s = lp(s, 4200)
    env = np.clip(t / 0.01, 0, 1) * (0.75 + 0.25 * np.exp(-t / 0.15)) * np.where(t > dur, np.exp(-(t - dur) / 0.06), 1.0)
    return s * env * vel


def glock(freq, vel):
    n = int(SR * 1.4)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.2)
    return s * np.exp(-t / 0.45) * vel


def kick4(vel):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t / 0.035)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    s[: int(0.004 * SR)] += 0.4
    return np.tanh(s * 1.4) * vel


def clap(vel):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    env = np.zeros(n)
    for off in (0, 0.011, 0.022):
        i = int(off * SR)
        env[i:] += np.exp(-(t[: n - i]) / (0.012 if off < 0.02 else 0.09))
    return bp(rng.normal(0, 1, n), 900, 5000) * env * vel


def hat(vel, open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    return hp(rng.normal(0, 1, n), 7000) * np.exp(-t / (0.08 if open_ else 0.015)) * vel


# ---------------- trộn & xuất (lặp liền mạch) ----------------
def finalize(dry, wet, L, n, rev=0.9, bright=11000):
    revL = fftconvolve(wet.L, IR_L)[:n]
    revR = fftconvolve(wet.R, IR_R)[:n]
    Lc = dry.L + revL * rev
    Rc = dry.R + revR * rev
    N = int(L * SR)
    outL, outR = Lc[:N].copy(), Rc[:N].copy()
    tail = n - N
    outL[:tail] += Lc[N:]
    outR[:tail] += Rc[N:]
    st = np.stack([outL, outR])
    pad = int(0.5 * SR)
    ext = np.concatenate([st[:, -pad:], st, st[:, :pad]], axis=1)
    ext = sosfilt(butter(2, 35, 'high', fs=SR, output='sos'), sosfilt(butter(2, bright, 'low', fs=SR, output='sos'), ext, axis=1), axis=1)
    st = ext[:, pad:-pad]
    st = np.tanh(st / (np.max(np.abs(st)) + 1e-9) * 1.1) * 0.85
    return st


def place(bus, notes, beat, inst, gain, pan=0.0, t0=0.0, wet=None, wgain=0.5, grace=False):
    """notes: [(midi|None, beats)] nối tiếp; grace: luyến láy từ nốt trên trước nốt dài (kiểu sáo/đàn tranh)."""
    bt = 0.0
    for m, d in notes:
        if m is not None:
            tt = t0 + bt * beat + rng.normal(0, 0.004)
            if grace and d >= 1:
                g = inst(midi_hz(m + 2), 0.06, 0.5)
                bus.add(g, tt - 0.07, pan=pan, gain=gain * 0.7)
                if wet: wet.add(g, tt - 0.07, pan=pan, gain=gain * wgain * 0.7)
            s = inst(midi_hz(m), d * beat * 0.95, 0.8 if d >= 1 else 0.65)
            bus.add(s, tt, pan=pan, gain=gain)
            if wet: wet.add(s, tt, pan=pan, gain=gain * wgain)
        bt += d
    return bt


# ======================= 1) LÂN VỀ PHỐ =======================
# điệu Bắc trên C: C D F G A (Hò Xự Xang Xê Cống)
C4, D4, F4, G4, A4 = 60, 62, 65, 67, 69
C5, D5, F5, G5, A5, C6, D6 = 72, 74, 77, 79, 81, 84, 86
LAN_A = [(G5, 1), (A5, .5), (G5, .5), (F5, 1), (D5, 1),
         (C5, 1), (D5, .5), (F5, .5), (G5, 2),
         (A5, 1), (C6, 1), (A5, .5), (G5, .5), (F5, 1),
         (G5, 3), (None, 1),
         (F5, 1), (G5, .5), (F5, .5), (D5, 1), (C5, 1),
         (D5, 1), (F5, 1), (D5, .5), (C5, .5), (A4, 1),
         (G4, 1), (A4, .5), (C5, .5), (D5, 1), (F5, 1),
         (C5, 3), (None, 1)]
LAN_B = [(C6, 1.5), (A5, .5), (G5, 1), (A5, 1),
         (F5, 1), (G5, 1), (A5, 2),
         (C6, 1), (D6, 1), (C6, .5), (A5, .5), (G5, 1),
         (A5, 3), (None, 1),
         (G5, .5), (A5, .5), (G5, .5), (F5, .5), (D5, 1), (F5, 1),
         (G5, 1), (A5, 1), (G5, 2),
         (F5, 1), (D5, 1), (C5, 1), (D5, 1),
         (C5, 3), (None, 1)]


def lan_ve_pho():
    bpm = 132
    beat = 60 / bpm
    bars = 36
    L = bars * 4 * beat
    n = int((L + 4) * SR)
    dry, wet = Bus(n), Bus(n)
    bar = lambda b: b * 4 * beat
    # --- trống lân: "tùng tùng cắc tùng" + não bạt xèng ---
    for b in range(bars):
        if b >= 34:  # 2 ô cuối: dồn trống chuẩn bị quay vòng
            for k in range(16):
                dry.add(trong_lan(0.5 + 0.4 * (k / 16), low=k % 2 == 0), bar(b) + k * beat / 4, gain=0.22, pan=-0.1)
            continue
        for (bb, low, v) in [(0, True, 1), (1, True, 0.7), (1.5, False, 0.6), (2.5, True, 0.8), (3, False, 0.6), (3.5, True, 0.5)]:
            s = trong_lan(v, low)
            dry.add(s, bar(b) + bb * beat + rng.normal(0, 0.003), gain=0.26, pan=-0.1)
            wet.add(s, bar(b) + bb * beat, gain=0.05)
        for bb in (0.5, 2):
            dry.add(go_tang(0.6), bar(b) + bb * beat, gain=0.12, pan=0.25)
        for bb in (1, 3):
            s = nao_bat(0.55, open_=bb == 3)
            dry.add(s, bar(b) + bb * beat, gain=0.07, pan=0.45)
            wet.add(s, bar(b) + bb * beat, gain=0.04, pan=0.45)
        if b % 4 == 0:
            s = chieng(0.9)
            dry.add(s, bar(b), gain=0.16, pan=-0.3)
            wet.add(s, bar(b), gain=0.08, pan=-0.3)
    # --- bè trầm gảy: hò – xê (C – G) ---
    for b in range(2, 34):
        root = C4 - 24 if (b // 2) % 4 != 3 else F4 - 24
        for bb, m, d in ((0, root, 1.4), (2, root + 7, 1.4)):
            dry.add(dan_day(midi_hz(m + 12), d * beat, 0.8), bar(b) + bb * beat, gain=0.3)
    # --- giai điệu: sáo A, đàn tranh B (sáo bè), sáo A lần 2 + đàn tranh nhại ---
    place(dry, LAN_A, beat, sao, 0.2, pan=0.1, t0=bar(2), wet=wet, wgain=0.6, grace=True)
    place(dry, LAN_B, beat, tranh, 0.26, pan=-0.15, t0=bar(10), wet=wet, wgain=0.6)
    place(dry, [(m - 12 if m else None, d) for m, d in LAN_B], beat, sao, 0.08, pan=0.25, t0=bar(10), wet=wet)
    place(dry, LAN_A, beat, sao, 0.2, pan=0.1, t0=bar(18), wet=wet, wgain=0.6, grace=True)
    place(dry, [(m - 12 if m else None, d) for m, d in LAN_A], beat, tranh, 0.14, pan=-0.3, t0=bar(18) + beat * 0.5, wet=wet)
    place(dry, LAN_B, beat, sao, 0.2, pan=0.1, t0=bar(26), wet=wet, wgain=0.6, grace=True)
    # đàn tranh rải ngũ cung cuối mỗi câu
    for b in range(5, 34, 4):
        for j, m in enumerate([C5, D5, F5, G5, A5, C6]):
            s = tranh(midi_hz(m), beat * 0.4, 0.4)
            dry.add(s, bar(b) + 3 * beat + j * beat / 6, pan=-0.4 + j * 0.12, gain=0.07)
            wet.add(s, bar(b) + 3 * beat + j * beat / 6, gain=0.06)
    return finalize(dry, wet, L, n, rev=0.8), L


# ======================= 2) XUÂN SUM VẦY =======================
# điệu Bắc trên G: G A C D E
G3, A3 = 55, 57
G4_, A4_, C5_, D5_, E5_, G5_, A5_ = 67, 69, 72, 74, 76, 79, 81
XUAN = [(D5_, 1.5), (E5_, .5), (D5_, 1), (C5_, 1),
        (A4_, 1), (C5_, 1), (D5_, 2),
        (E5_, 1), (G5_, 1), (E5_, .5), (D5_, .5), (C5_, 1),
        (D5_, 4),
        (G5_, 1.5), (E5_, .5), (D5_, 1), (E5_, 1),
        (C5_, 1), (A4_, 1), (G4_, 2),
        (A4_, 1), (C5_, .5), (D5_, .5), (E5_, 1), (D5_, 1),
        (G4_, 4),
        (E5_, 1), (G5_, 1), (A5_, 2),
        (G5_, 1), (E5_, 1), (D5_, 2),
        (E5_, .5), (D5_, .5), (C5_, 1), (A4_, 1), (C5_, 1),
        (D5_, 4),
        (G5_, 1), (A5_, .5), (G5_, .5), (E5_, 1), (D5_, 1),
        (C5_, 1), (D5_, 1), (E5_, 2),
        (D5_, 1), (C5_, .5), (A4_, .5), (G4_, 1), (A4_, 1),
        (G4_, 4)]


def xuan_sum_vay():
    bpm = 92
    beat = 60 / bpm
    bars = 34
    L = bars * 4 * beat
    n = int((L + 4) * SR)
    dry, wet = Bus(n), Bus(n)
    bar = lambda b: b * 4 * beat
    # mõ + phách nhẹ nhàng, chiêng nhỏ đầu mỗi đoạn
    for b in range(bars):
        for bb in (0, 2):
            dry.add(mo(0.7, 760), bar(b) + bb * beat, gain=0.07, pan=0.3)
        for bb in (1, 1.5, 3, 3.5):
            dry.add(phach(0.5), bar(b) + bb * beat, gain=0.05, pan=-0.35)
        if b % 8 == 0:
            s = chieng(0.6, f=140)
            dry.add(s, bar(b), gain=0.09)
            wet.add(s, bar(b), gain=0.07)
    # bè trầm: G – D
    for b in range(1, bars):
        for bb, m in ((0, G3 - 12), (2, G3 - 5)):
            dry.add(dan_day(midi_hz(m + 12), 1.6 * beat, 0.7), bar(b) + bb * beat, gain=0.22)
    # đàn tranh rải đệm (ngũ cung G A C D E) mỗi ô nhịp
    pat = [G4_ - 12, D5_ - 12, G4_, A4_, D5_ - 12, G4_]
    for b in range(1, bars):
        for j, m in enumerate(pat):
            s = tranh(midi_hz(m), beat * 0.6, 0.35)
            tt = bar(b) + j * beat * 2 / 3
            dry.add(s, tt, pan=-0.35, gain=0.06)
            wet.add(s, tt, pan=-0.35, gain=0.05)
    # giai điệu: lần 1 đàn tranh (có sáo đệm nhẹ), lần 2 đàn bầu
    place(dry, XUAN, beat, tranh, 0.26, pan=0.0, t0=bar(1), wet=wet, wgain=0.7, grace=True)
    place(dry, [(m - 12 if m else None, d) for m, d in XUAN[:14]], beat, sao, 0.05, pan=0.3, t0=bar(5), wet=wet)
    place(dry, XUAN, beat, dan_bau, 0.24, pan=0.05, t0=bar(17), wet=wet, wgain=0.8)
    return finalize(dry, wet, L, n, rev=1.0, bright=9500), L


# ======================= 3) ĐẾM NGƯỢC (Tết Tây) =======================
# F – C – Dm – Bb, hook tự sáng tác
F4m, A4m, C5m, D5m, E5m, F5m, G5m, A5m, C6m, D6m = 65, 69, 72, 74, 76, 77, 79, 81, 84, 86
CHORDS = [(53, [65, 69, 72]), (48, [64, 67, 72]), (50, [65, 69, 74]), (46, [65, 70, 74])]  # (bass, pad)
HOOK = [(A5m, .5), (A5m, .5), (C6m, 1), (A5m, .5), (G5m, .5), (F5m, 1),
        (G5m, .5), (G5m, .5), (A5m, 1), (G5m, 1), (E5m, 1),
        (F5m, .5), (F5m, .5), (A5m, 1), (C6m, 1), (D6m, 1),
        (C6m, 2), (A5m, 1), (G5m, 1)]
HOOK2 = HOOK[:12] + [(F5m, .5), (G5m, .5), (A5m, 1), (G5m, 1), (E5m, 1), (F5m, 3), (None, 1)]


def dem_nguoc():
    bpm = 124
    beat = 60 / bpm
    bars = 32
    L = bars * 4 * beat
    n = int((L + 3) * SR)
    dry, wet = Bus(n), Bus(n)
    bar = lambda b: b * 4 * beat
    # pad + bass + nhịp "bơm" theo kick
    for b in range(bars):
        bs, pad = CHORDS[b % 4]
        drop = 28 <= b < 30  # khoảng lặng trước khi quay vòng
        cut = 1800 if b < 4 else 3600
        s = supersaw([midi_hz(m) for m in pad], 4 * beat, 0.5, cutoff=cut)
        pump = np.ones(len(s))
        for k in range(4):
            i = int(k * beat * SR)
            seg = min(len(s) - i, int(beat * SR))
            if seg > 0:
                pump[i:i + seg] = 0.35 + 0.65 * np.clip(np.arange(seg) / (0.18 * SR), 0, 1)
        dry.add(s * pump, bar(b), gain=0.16 if not drop else 0.1, pan=-0.2)
        dry.add(s * pump, bar(b) + 0.012, gain=0.16 if not drop else 0.1, pan=0.2)
        wet.add(s, bar(b), gain=0.04)
        if b >= 4 and not drop:
            for k in range(8):
                dry.add(bass(midi_hz(bs), beat * 0.45, 0.9 if k % 2 == 0 else 0.7), bar(b) + k * beat / 2 + beat / 2, gain=0.3)
        # arp pluck
        if b >= 4:
            arp = pad + [pad[0] + 12, pad[1] + 12]
            for k in range(8):
                m = arp[[0, 1, 2, 3, 2, 1, 4, 2][k]]
                s2 = pluck(midi_hz(m), beat * 0.4, 0.6)
                dry.add(s2, bar(b) + k * beat / 2, pan=0.35 if k % 2 else -0.35, gain=0.06)
                wet.add(s2, bar(b) + k * beat / 2, gain=0.04)
        # trống
        if b >= 4 and not drop:
            for k in range(4):
                dry.add(kick4(0.95), bar(b) + k * beat, gain=0.36)
                dry.add(hat(0.6, open_=True), bar(b) + k * beat + beat / 2, gain=0.05, pan=0.3)
            for k in (1, 3):
                c = clap(0.8)
                dry.add(c, bar(b) + k * beat, gain=0.14)
                wet.add(c, bar(b) + k * beat, gain=0.05)
            for k in range(16):
                dry.add(hat(0.35), bar(b) + k * beat / 4, gain=0.025, pan=-0.3)
    # giai điệu
    for start, hk in ((8, HOOK), (12, HOOK2), (16, HOOK), (20, HOOK2), (24, HOOK), (28, HOOK2)):
        place(dry, hk, beat, lead, 0.13 if start < 16 else 0.15, pan=0.05, t0=bar(start), wet=wet, wgain=0.45)
        if start >= 16:
            place(dry, [(m + 12 if m else None, d) for m, d in hk], beat, lambda f, d, v: glock(f, v), 0.05, pan=0.3, t0=bar(start), wet=wet)
    # đếm ngược: 8 tiếng "bíp" lên giọng ở 2 ô cuối, rồi pháo nổ khi quay vòng
    for k in range(8):
        f = 880 * 2 ** (k / 12)
        tt = bar(30) + k * beat
        nn = int(0.12 * SR)
        t = np.arange(nn) / SR
        s = np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-t / 0.05) * 0.6
        dry.add(lp(s, 5000), tt, gain=0.09, pan=0.0)
        wet.add(lp(s, 5000), tt, gain=0.05)
    rn = int(2 * 4 * beat * SR)  # tiếng gió lên (riser)
    t = np.arange(rn) / SR
    riser = bp(rng.normal(0, 1, rn), 800, 9000) * (t / t[-1]) ** 2
    dry.add(riser, bar(30), gain=0.05)
    for k in range(6):  # pháo hoa lách tách đầu vòng
        tt = beat * (0.2 + k * 0.37)
        nn = int(0.6 * SR)
        t = np.arange(nn) / SR
        s = hp(rng.normal(0, 1, nn), 2500) * np.exp(-t / 0.25) * (rng.random(nn) < 0.08)
        dry.add(s, tt, gain=0.1, pan=rng.uniform(-0.7, 0.7))
        wet.add(s, tt, gain=0.08)
    return finalize(dry, wet, L, n, rev=0.6, bright=13000), L


TRACKS = {
    'tet-lan-ve-pho': lan_ve_pho,
    'tet-xuan-sum-vay': xuan_sum_vay,
    'newyear-dem-nguoc': dem_nguoc,
}

if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for tid in (sys.argv[2:] or list(TRACKS)):
        st, L = TRACKS[tid]()
        write_wav(os.path.join(out, tid + '.wav'), st)
        print(tid, f'{L:.1f}s')
