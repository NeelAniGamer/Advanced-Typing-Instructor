import math, struct, wave, subprocess, os

SAMPLE_RATE = 44100
DURATION = 30.0
NUM_SAMPLES = int(SAMPLE_RATE * DURATION)
BPM = 116.0
BEAT_LEN = 60.0 / BPM
SIXTEENTH = BEAT_LEN / 4.0

left_channel = [0.0] * NUM_SAMPLES
right_channel = [0.0] * NUM_SAMPLES

def add_sample(t_idx, l, r):
    if 0 <= t_idx < NUM_SAMPLES:
        left_channel[t_idx] += l
        right_channel[t_idx] += r

# 1. Kick Drum
def hit_kick(start_time, velocity=1.0):
    start_idx = int(start_time * SAMPLE_RATE)
    kick_len = int(0.35 * SAMPLE_RATE)
    for i in range(kick_len):
        t = i / SAMPLE_RATE
        freq = 130.0 * math.exp(-t * 28.0) + 45.0
        phase = 2.0 * math.pi * freq * t
        env = math.exp(-t * 12.0) * velocity
        val = math.sin(phase) * env * 0.8
        # Add subtle click
        click = (1.0 - i / 500.0) if i < 500 else 0.0
        val += click * 0.3 * velocity
        add_sample(start_idx + i, val, val)

# 2. Snare Drum
import random
rng = random.Random(42)

def hit_snare(start_time, velocity=1.0):
    start_idx = int(start_time * SAMPLE_RATE)
    snare_len = int(0.25 * SAMPLE_RATE)
    for i in range(snare_len):
        t = i / SAMPLE_RATE
        tone = math.sin(2.0 * math.pi * 185.0 * t) * math.exp(-t * 22.0) * 0.4
        noise = (rng.random() * 2.0 - 1.0) * math.exp(-t * 18.0) * 0.6
        val = (tone + noise) * velocity * 0.65
        add_sample(start_idx + i, val * 0.95, val * 1.05)

# 3. Hi-Hat
def hit_hat(start_time, open_hat=False, velocity=0.5):
    start_idx = int(start_time * SAMPLE_RATE)
    hat_len = int((0.25 if open_hat else 0.06) * SAMPLE_RATE)
    decay = 12.0 if open_hat else 45.0
    for i in range(hat_len):
        t = i / SAMPLE_RATE
        noise = (rng.random() * 2.0 - 1.0) * math.exp(-t * decay) * velocity * 0.3
        add_sample(start_idx + i, noise * 0.8, noise * 1.2)

# 4. Crash Cymbal
def hit_crash(start_time, velocity=0.7):
    start_idx = int(start_time * SAMPLE_RATE)
    crash_len = int(1.8 * SAMPLE_RATE)
    for i in range(crash_len):
        t = i / SAMPLE_RATE
        noise = (rng.random() * 2.0 - 1.0) * math.exp(-t * 3.5) * velocity * 0.45
        add_sample(start_idx + i, noise * 1.1, noise * 0.9)

# 5. Funk Bass
def note_freq(semitones_from_a4):
    return 440.0 * (2.0 ** (semitones_from_a4 / 12.0))

# E1 = -33, G1 = -30, A1 = -28, B1 = -26, D2 = -23, E2 = -21, G2 = -18, A2 = -16
def play_bass(start_time, duration, semitones, velocity=0.7, slap=False):
    start_idx = int(start_time * SAMPLE_RATE)
    dur_idx = int(duration * SAMPLE_RATE)
    base_freq = note_freq(semitones)
    for i in range(dur_idx):
        t = i / SAMPLE_RATE
        freq = base_freq
        if slap and i < 800:
            freq *= 1.0 + (1.0 - i / 800.0) * 0.3
        phase = 2.0 * math.pi * freq * t
        # Blend punchy sine + saw for funky tone
        sine = math.sin(phase)
        saw = (2.0 * ((freq * t) % 1.0) - 1.0) * 0.4
        env = math.exp(-t * (6.0 if not slap else 9.0)) * velocity
        val = (sine + saw) * env * 0.65
        add_sample(start_idx + i, val * 1.05, val * 0.95)

# 6. Funky Clavinet Chord Chops
# Em7 = E, G, B, D
CHORD_EM7 = [-21, -18, -14, -11]
CHORD_A7 = [-20, -17, -13, -10]

def play_chord(start_time, chord, duration=0.1, velocity=0.35):
    start_idx = int(start_time * SAMPLE_RATE)
    dur_idx = int(duration * SAMPLE_RATE)
    for semi in chord:
        freq = note_freq(semi + 12) # Octave higher
        for i in range(dur_idx):
            t = i / SAMPLE_RATE
            phase = 2.0 * math.pi * freq * t
            # Clavinet sound: pulse wave with filter sweep
            pulse = 1.0 if (freq * t) % 1.0 < 0.25 else -1.0
            filter_env = math.exp(-t * 25.0)
            env = math.exp(-t * 15.0) * velocity * 0.22
            val = pulse * filter_env * env
            add_sample(start_idx + i, val * 0.85, val * 1.15)

# BUILD THE SONG
# 1. Opening Crash + Fill on 0.0s
hit_crash(0.0, 0.9)
hit_kick(0.0, 1.0)

# Bassline pattern (syncopated 2-bar funk loop):
# Bar 1: E1 (beat 1), E1 (16th 3), E2 slap (beat 2), G1 (beat 3), A1 (beat 4.5)
# Bar 2: E1 (beat 1), D2 (beat 2), D#2 (beat 2.5), E2 (beat 3), B1 (beat 4)
bass_pattern = [
    # (rel_beat, duration_beats, note, slap)
    (0.0, 0.5, -33, False),   # E1
    (0.5, 0.4, -33, True),    # E1 slap
    (1.0, 0.6, -21, True),    # E2 slap
    (2.0, 0.8, -30, False),   # G1
    (3.5, 0.5, -28, False),   # A1
    (4.0, 0.5, -33, False),   # E1
    (5.0, 0.5, -23, True),    # D2 slap
    (5.5, 0.5, -22, True),    # D#2
    (6.0, 0.8, -21, True),    # E2 slap
    (7.0, 0.6, -26, False),   # B1
    (7.5, 0.5, -28, False),   # A1
]

total_beats = int(DURATION / BEAT_LEN)
bar_count = int(total_beats / 4)

for bar in range(bar_count):
    bar_start_beat = bar * 4.0
    bar_time = bar_start_beat * BEAT_LEN

    # Drum pattern per bar
    # Kicks on beat 1, beat 2.5, beat 3.25
    hit_kick(bar_time + 0.0 * BEAT_LEN, 1.0)
    hit_kick(bar_time + 1.5 * BEAT_LEN, 0.85)
    hit_kick(bar_time + 2.25 * BEAT_LEN, 0.9)

    # Snares on beat 2 and beat 4
    hit_snare(bar_time + 1.0 * BEAT_LEN, 0.95)
    hit_snare(bar_time + 3.0 * BEAT_LEN, 1.0)

    # 16th-note Hi-hats with swing/accent
    for step in range(16):
        hat_time = bar_time + step * SIXTEENTH
        is_open = (step == 14) # Open hat on upbeat before beat 4
        vel = 0.55 if step % 4 == 2 else 0.35
        if step % 2 == 1: vel *= 0.85
        hit_hat(hat_time, is_open, vel)

    # Clavinet chord stabs on off-beats
    chord = CHORD_EM7 if (bar % 4 < 2) else CHORD_A7
    play_chord(bar_time + 0.75 * BEAT_LEN, chord, 0.12, 0.4)
    play_chord(bar_time + 2.75 * BEAT_LEN, chord, 0.12, 0.45)
    play_chord(bar_time + 3.5 * BEAT_LEN, chord, 0.15, 0.5)

# Place bass notes across all bars
for bar_pair in range(int(bar_count / 2) + 1):
    offset_beats = bar_pair * 8.0
    for rel_b, dur_b, note, slap in bass_pattern:
        b_time = (offset_beats + rel_b) * BEAT_LEN
        if b_time < DURATION - 0.2:
            play_bass(b_time, dur_b * BEAT_LEN, note, 0.75, slap)

# Fade out last 1.5 seconds
fade_start = int((DURATION - 1.5) * SAMPLE_RATE)
for i in range(fade_start, NUM_SAMPLES):
    factor = (NUM_SAMPLES - i) / (NUM_SAMPLES - fade_start)
    left_channel[i] *= factor
    right_channel[i] *= factor

# Normalize and convert to 16-bit PCM
max_val = max(max(abs(x) for x in left_channel), max(abs(x) for x in right_channel), 0.001)
scale = 32000.0 / max_val

wav_path = "assets/bgm/funk_groove.wav"
mp3_path = "assets/bgm/funk_groove.mp3"

with wave.open(wav_path, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    frames = bytearray()
    for i in range(NUM_SAMPLES):
        l = int(max(-32767, min(32767, left_channel[i] * scale)))
        r = int(max(-32767, min(32767, right_channel[i] * scale)))
        frames += struct.pack("<hh", l, r)
    wf.writeframes(frames)

# Convert to MP3 with ffmpeg
cmd = ["ffmpeg", "-y", "-i", wav_path, "-b:a", "192k", mp3_path]
subprocess.run(cmd, check=True)
os.remove(wav_path)
print("Funk track generated successfully at", mp3_path)
