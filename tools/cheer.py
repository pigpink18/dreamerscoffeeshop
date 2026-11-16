"""
Nhạc nền quán kiểu VUI TƯƠI cho Dreamers Coffee – tự sáng tác + tự tổng hợp (không dùng mẫu có bản quyền).
Ukulele gảy nhịp nảy, bass tung tăng, chuông lấp lánh, vỗ tay nhẹ, giai điệu huýt sáo / marimba. Giọng trưởng.
  cheer-nang-som   "Nắng sớm"   – C trưởng, 118 bpm, huýt sáo
  cheer-dap-xe     "Đạp xe"     – G trưởng, 126 bpm, marimba
  cheer-banh-ngot  "Bánh ngọt"  – F trưởng, 112 bpm, glockenspiel + huýt sáo

Chạy:  python3 cheer.py OUT_DIR [id ...]
"""
import sys, os
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bossa import SR, Bus, write_wav, midi_hz, bass  # noqa: E402
from tet import finalize, lp, bp, hp, glock, clap, hat, rng  # noqa: E402


# ---------------- nhạc cụ ----------------
def uke(freq, dur, vel):
    """Ukulele: dây nylon ngắn, sáng, tắt nhanh."""
    n = int(SR * (dur + 0.5))
    t = np.arange(n) / SR
    s = np.zeros(n)
    for h in range(1, 9):
        s += (1 / h ** 1.3) * np.sin(2 * np.pi * freq * h * t + rng.random() * 6) * np.exp(-t * (3.2 + 2.2 * h))
    k = int(0.004 * SR)
    s[:k] += rng.normal(0, 0.2, k)
    return s * np.clip(t / 0.002, 0, 1) * np.where(t > dur, np.exp(-(t - dur) / 0.05), 1.0) * vel


def whistle(freq, dur, vel):
    """Huýt sáo: sine trong, vibrato nhẹ, chút hơi gió, vào nốt hơi trượt lên."""
    n = int(SR * (dur + 0.15))
    t = np.arange(n) / SR
    glide = 2 ** ((-0.4 * np.exp(-t / 0.03)) / 12)
    vib = 1 + 0.008 * np.sin(2 * np.pi * 6.2 * t) * np.clip((t - 0.12) / 0.2, 0, 1)
    ph = 2 * np.pi * freq * np.cumsum(glide * vib) / SR
    s = np.sin(ph) + 0.05 * np.sin(2 * ph)
    air = bp(rng.normal(0, 1, n), freq * 0.9, min(freq * 3, 15000)) * 0.06
    a = np.clip(t / 0.025, 0, 1)
    rel = np.where(t > dur, np.exp(-(t - dur) / 0.04), 1.0)
    return (s + air) * a * rel * vel


def marimba(freq, dur, vel):
    n = int(SR * 0.9)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.35) + 0.5 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / 0.05)
    return s * np.clip(t / 0.002, 0, 1) * vel


def soft_kick(vel):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f = 55 + 70 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15) * vel


def tamb(vel):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    s = hp(rng.normal(0, 1, n), 6000) * np.exp(-t / 0.03)
    for f in (6500, 8200):
        s += 0.15 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.04)
    return s * vel


# ---------------- hoà âm ----------------
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11, 'Bb': 10, 'Eb': 3}


def triad(sym):
    """'C', 'Am', 'F', 'G7', 'Dm', 'Em', 'Bb' → (gốc, [nốt hợp âm quanh C4])"""
    m7 = sym.endswith('7')
    s = sym[:-1] if m7 else sym
    minor = s.endswith('m')
    root = NOTE[s[:-1] if minor else s]
    ints = [0, 3 if minor else 4, 7] + ([10] if m7 else [])
    notes = sorted(60 + ((root + i - 0) % 12) for i in ints)
    return root, notes


def song(bpm, chords, melody, lead, lead_gain, extra_glock=False):
    """chords: hợp âm mỗi ô nhịp (16 ô, lặp 2 lần). melody: [(midi|None, phách)] cho 16 ô (64 phách)."""
    beat = 60 / bpm
    bars = len(chords) * 2
    L = bars * 4 * beat
    n = int((L + 3) * SR)
    dry, wet = Bus(n), Bus(n)
    bar = lambda b: b * 4 * beat
    for b in range(bars):
        root, notes = triad(chords[b % len(chords)])
        # ukulele: xuống – xuống lên – lên xuống lên (nhịp vui)
        for (bb, down, v) in [(0, True, 0.9), (1, True, 0.6), (1.5, False, 0.5), (2.5, False, 0.55), (3, True, 0.7), (3.5, False, 0.5)]:
            order = notes + [notes[0] + 12]
            order = order if down else order[::-1]
            for i, m in enumerate(order):
                s = uke(midi_hz(m), beat * 0.45, v)
                tt = bar(b) + bb * beat + i * 0.009
                dry.add(s, tt, pan=-0.3, gain=0.075)
                wet.add(s, tt, pan=-0.3, gain=0.025)
        # bass tung tăng: gốc – năm – gốc – lướt lên
        bm = 36 + root if root < 8 else 24 + root
        for bb, m, d in ((0, bm, 0.9), (1.5, bm + 7, 0.4), (2, bm, 0.9), (3, bm + 12, 0.35), (3.5, bm + 7, 0.35)):
            dry.add(bass(midi_hz(m), d * beat, 0.85), bar(b) + bb * beat, gain=0.34)
        # trống nhẹ: kick 1 & 3, vỗ tay 2 & 4, tambourine móc
        if b >= 1:
            for bb in (0, 2):
                dry.add(soft_kick(0.9), bar(b) + bb * beat, gain=0.22)
            for bb in (1, 3):
                c = clap(0.6)
                dry.add(c, bar(b) + bb * beat, gain=0.07, pan=0.1)
                wet.add(c, bar(b) + bb * beat, gain=0.03)
            for k in range(8):
                dry.add(tamb(0.7 if k % 2 else 0.35), bar(b) + k * beat / 2, gain=0.035, pan=0.45)
        # chuông lấp lánh cuối mỗi 2 ô nhịp
        if b % 2 == 1 or extra_glock:
            for j, m in enumerate([notes[0] + 24, notes[1] + 24, notes[2] + 24]):
                g = glock(midi_hz(m), 0.6)
                tt = bar(b) + (3 + j / 3) * beat
                dry.add(g, tt, pan=0.35, gain=0.04)
                wet.add(g, tt, gain=0.05)
    # giai điệu: lần 1 nhẹ, lần 2 rõ hơn (+ bè quãng 3 bằng chuông)
    assert abs(sum(d for _, d in melody) - len(chords) * 4) < 1e-6, sum(d for _, d in melody)
    for rep in range(2):
        bt = rep * len(chords) * 4
        for m, d in melody:
            if m is not None:
                tt = bt * beat + rng.normal(0, 0.004)
                s = lead(midi_hz(m), d * beat * 0.9, 0.85 if d >= 1 else 0.7)
                g = lead_gain * (0.85 if rep == 0 else 1)
                dry.add(s, tt, pan=0.08, gain=g)
                wet.add(s, tt, pan=0.08, gain=g * 0.45)
                if rep == 1 and d >= 1:
                    gg = glock(midi_hz(m + 12), 0.45)
                    dry.add(gg, tt, pan=-0.25, gain=0.03)
            bt += d
    return finalize(dry, wet, L, n, rev=0.55, bright=12500), L


# ---------------- 3 bài ----------------
C5, D5, E5, F5, G5, A5, B5, C6, D6, E6 = 72, 74, 76, 77, 79, 81, 83, 84, 86, 88
A4, B4, G4 = 69, 71, 67


def nang_som():
    ch = ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G7', 'F', 'G', 'Em', 'Am', 'F', 'G7', 'C', 'C']
    mel = [(E5, .5), (G5, .5), (C6, 1), (B5, .5), (A5, .5), (G5, 1),
           (A5, .5), (G5, .5), (E5, 1), (C5, 2),
           (F5, .5), (A5, .5), (C6, 1), (A5, .5), (G5, .5), (F5, 1),
           (G5, 3), (None, 1),
           (E5, .5), (G5, .5), (C6, 1), (D6, .5), (C6, .5), (A5, 1),
           (A5, .5), (C6, .5), (A5, 1), (E5, 2),
           (F5, .5), (E5, .5), (D5, 1), (E5, .5), (F5, .5), (A5, 1),
           (G5, 3), (None, 1),
           (A5, 1), (C6, .5), (A5, .5), (G5, 1), (F5, 1),
           (G5, 1), (A5, .5), (G5, .5), (E5, 2),
           (E5, .5), (G5, .5), (B5, 1), (A5, 1), (G5, 1),
           (A5, 2), (C6, 2),
           (A5, .5), (G5, .5), (F5, 1), (A5, 1), (C6, 1),
           (B5, .5), (C6, .5), (D6, 1), (B5, 1), (G5, 1),
           (C6, 3), (None, 1),
           (None, 4)]
    return song(118, ch, mel, whistle, 0.2)


def dap_xe():
    G4_, A4_, B4_, D5_, E5_, Fs5, G5_, A5_, B5_, D6_ = 67, 69, 71, 74, 76, 78, 79, 81, 83, 86
    ch = ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'D', 'C', 'D', 'Bm', 'Em', 'C', 'D', 'G', 'G']
    mel = [(B4_, .5), (D5_, .5), (G5_, .5), (B5_, .5), (A5_, 1), (G5_, 1),
           (E5_, .5), (G5_, .5), (B5_, 1), (A5_, 2),
           (G5_, .5), (E5_, .5), (C6, 1), (B5_, .5), (A5_, .5), (G5_, 1),
           (A5_, 3), (None, 1),
           (B4_, .5), (D5_, .5), (G5_, .5), (B5_, .5), (D6_, 1), (B5_, 1),
           (G5_, .5), (B5_, .5), (E6, 1), (D6_, 2),
           (C6, .5), (B5_, .5), (A5_, 1), (Fs5, .5), (G5_, .5), (A5_, 1),
           (D6_, 3), (None, 1),
           (E6, 1), (D6_, .5), (C6, .5), (B5_, 1), (A5_, 1),
           (B5_, 1), (A5_, .5), (G5_, .5), (Fs5, 2),
           (G5_, .5), (A5_, .5), (B5_, 1), (A5_, 1), (G5_, 1),
           (E5_, 2), (G5_, 2),
           (C6, .5), (B5_, .5), (A5_, 1), (G5_, 1), (E5_, 1),
           (Fs5, .5), (G5_, .5), (A5_, 1), (D6_, 1), (C6, 1),
           (B5_, 3), (None, 1),
           (None, 4)]
    return song(126, ch, mel, marimba, 0.26, extra_glock=True)


def banh_ngot():
    F4_, G4_, A4_, Bb4, C5_, D5_, E5_, F5_, G5_, A5_, Bb5, C6_ = 65, 67, 69, 70, 72, 74, 76, 77, 79, 81, 82, 84
    ch = ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Gm', 'C7', 'Bb', 'C', 'Am', 'Dm', 'Bb', 'C7', 'F', 'F']
    mel = [(C5_, .5), (F5_, .5), (A5_, 1), (G5_, .5), (F5_, .5), (A5_, 1),
           (D5_, .5), (F5_, .5), (A5_, 1), (F5_, 2),
           (Bb4, .5), (D5_, .5), (F5_, 1), (D5_, .5), (F5_, .5), (G5_, 1),
           (E5_, 3), (None, 1),
           (C5_, .5), (F5_, .5), (A5_, 1), (C6_, 1), (A5_, 1),
           (A5_, .5), (G5_, .5), (F5_, 1), (D5_, 2),
           (Bb4, .5), (D5_, .5), (G5_, 1), (Bb5, 1), (A5_, 1),
           (G5_, 3), (None, 1),
           (F5_, 1), (G5_, .5), (A5_, .5), (Bb5, 1), (A5_, 1),
           (G5_, 1), (A5_, .5), (G5_, .5), (E5_, 2),
           (E5_, .5), (F5_, .5), (G5_, 1), (A5_, 1), (C6_, 1),
           (A5_, 2), (F5_, 2),
           (D5_, .5), (F5_, .5), (Bb5, 1), (A5_, 1), (G5_, 1),
           (E5_, .5), (F5_, .5), (G5_, 1), (Bb5, 1), (G5_, 1),
           (F5_, 3), (None, 1),
           (None, 4)]
    return song(112, ch, mel, whistle, 0.19, extra_glock=True)


TRACKS = {'cheer-nang-som': nang_som, 'cheer-dap-xe': dap_xe, 'cheer-banh-ngot': banh_ngot}

if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for tid in (sys.argv[2:] or list(TRACKS)):
        st, L = TRACKS[tid]()
        write_wav(os.path.join(out, tid + '.wav'), st)
        print(tid, f'{L:.1f}s')
