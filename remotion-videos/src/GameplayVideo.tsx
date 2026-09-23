import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

// ============================================================================
// DESIGN TOKENS — Organic Non-AI Palette (matches ati_showcase_pro.py exactly)
// ============================================================================
const C = {
  bgDark:       '#0E1110',
  bgSurface:    '#161B18',
  bgElevated:   '#1F2622',
  borderSubtle: '#2C3730',
  borderFocus:  '#C97D5A',
  linenWhite:   '#FAF8F5',
  sandstone:    '#E6E1DA',
  charcoal:     '#252B28',
  terracotta:   '#C97D5A',
  terraLight:   '#E29370',
  sage:         '#7C8D81',
  sageLight:    '#9EB3A5',
  ochre:        '#EBC078',
  emerald:      '#5EAA7C',
  emeraldGlow:  '#75D29B',
} as const;

// ============================================================================
// SHARED HELPERS
// ============================================================================

// Clamp helper — every interpolate() call uses this to be foolproof
const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Safe spring — guards against negative frame to prevent NaN/Infinity
function safeSpring(frame: number, fps: number, damping = 14): number {
  const f = Math.max(0, frame);
  return spring({ frame: f, fps, config: { damping } });
}

// ============================================================================
// SHARED: ANIMATED BACKGROUND — subtle dot grid + two slow glow orbs
// ============================================================================
const GameplayBackground: React.FC<{ accentHex?: string }> = ({ accentHex = C.terracotta }) => {
  const frame = useCurrentFrame();

  const orb1Y = 400 + Math.sin(frame * 0.018) * 120;
  const orb2Y = 1400 + Math.cos(frame * 0.014) * 150;
  const orb1X = 540 + Math.cos(frame * 0.022) * 200;
  const orb2X = 540 + Math.sin(frame * 0.016) * 180;

  // 6×10 dot grid, purely static positions
  const dots: React.ReactNode[] = [];
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 10; row++) {
      dots.push(
        <div
          key={`${col}-${row}`}
          style={{
            position: 'absolute',
            left: col * 180 + 90,
            top: row * 192 + 96,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: C.borderSubtle,
            opacity: 0.5,
          }}
        />
      );
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDark, overflow: 'hidden' }}>
      {/* Glow orb 1 */}
      <div
        style={{
          position: 'absolute',
          left: orb1X - 300,
          top: orb1Y - 300,
          width: 600,
          height: 600,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${accentHex}55 0%, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      {/* Glow orb 2 */}
      <div
        style={{
          position: 'absolute',
          left: orb2X - 280,
          top: orb2Y - 280,
          width: 560,
          height: 560,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${C.emerald}44 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />
      {/* Dot grid */}
      {dots}
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 1 — LIVE RACE (0–720 frames / 12 s @ 60 fps)
// ============================================================================
const TYPING_WORDS = [
  'advanced', 'typing', 'instructor', 'speed', 'accuracy',
  'practice', 'keyboard', 'rhythm', 'master', 'champion',
  'fingers', 'words', 'letters', 'sentence', 'blitz',
];

const Scene1LiveRace: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // No fade-in from black — background shows immediately, springs handle element entry
  const fadeOut = interpolate(frame, [660, 720], [1, 0], CLAMP);
  const opacity = fadeOut;

  // Animated WPM counter 0 → 148 over first 600 frames
  const liveWpm = Math.floor(interpolate(frame, [0, 600], [0, 148], CLAMP));

  // Screenshot scale pulse (very subtle)
  const imgScale = 1 + Math.sin(frame * 0.04) * 0.012;

  // Badge entry spring
  const badgeSpring = safeSpring(frame - 10, fps, 14);
  const wpmSpring   = safeSpring(frame - 30, fps, 12);
  const accSpring   = safeSpring(frame - 120, fps, 14);

  // Keystroke tiles — 5 tiles, each flashing at different phase
  const tileKeys = ['A', 'S', 'D', 'F', 'J'];

  // Scrolling word row — one word every 40 frames
  const wordIdx   = Math.floor(frame / 40) % TYPING_WORDS.length;
  const wordIdx2  = (wordIdx + 1) % TYPING_WORDS.length;
  const wordIdx3  = (wordIdx + 2) % TYPING_WORDS.length;
  const wordFrac  = (frame % 40) / 40;
  const wordShift = interpolate(wordFrac, [0, 1], [0, -120], CLAMP);

  return (
    <AbsoluteFill style={{ opacity }}>
      <GameplayBackground accentHex={C.terracotta} />

      {/* Top badge row */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: badgeSpring,
          transform: `translateY(${(1 - badgeSpring) * -20}px)`,
        }}
      >
        {/* ATI badge */}
        <div
          style={{
            background: `${C.terracotta}22`,
            border: `1.5px solid ${C.terracotta}`,
            borderRadius: 999,
            padding: '10px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: C.terraLight,
              boxShadow: `0 0 10px ${C.terraLight}`,
            }}
          />
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 22,
              color: C.terraLight,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            ATI GAMEPLAY
          </span>
        </div>

        {/* LIVE indicator */}
        <div
          style={{
            background: `${C.emerald}22`,
            border: `1.5px solid ${C.emerald}`,
            borderRadius: 999,
            padding: '10px 22px',
            fontFamily: 'monospace',
            fontSize: 20,
            fontWeight: 800,
            color: C.emeraldGlow,
          }}
        >
          ● LIVE RACE
        </div>
      </div>

      {/* Main screenshot frame */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 50,
          right: 50,
          height: 680,
          borderRadius: 28,
          overflow: 'hidden',
          border: `2px solid ${C.terracotta}55`,
          boxShadow: `0 30px 80px #00000099, 0 0 40px ${C.terracotta}22`,
          transform: `scale(${imgScale})`,
        }}
      >
        <Img
          src={staticFile('ati_typing_arena.png')}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }}
        />

        {/* Dark overlay at bottom for HUD readability */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 200,
            background: `linear-gradient(to top, ${C.bgDark}ee, transparent)`,
          }}
        />

        {/* In-frame WPM HUD */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: `${C.bgSurface}dd`,
            border: `1px solid ${C.borderFocus}66`,
            borderRadius: 20,
            padding: '16px 28px',
          }}
        >
          <div style={{ opacity: wpmSpring }}>
            <div style={{ fontSize: 16, color: C.sageLight, fontFamily: 'monospace', letterSpacing: 1 }}>
              TYPING SPEED
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 60,
                  fontWeight: 900,
                  color: C.ochre,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                }}
              >
                {liveWpm}
              </span>
              <span style={{ fontSize: 24, color: C.sandstone, fontWeight: 700 }}>WPM</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', opacity: accSpring }}>
            <div style={{ fontSize: 16, color: C.sageLight, fontFamily: 'monospace', letterSpacing: 1 }}>
              ACCURACY
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 900,
                color: C.emeraldGlow,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              99.4%
            </div>
          </div>
        </div>
      </div>

      {/* Keystroke tiles */}
      <div
        style={{
          position: 'absolute',
          top: 920,
          left: 60,
          right: 60,
          display: 'flex',
          gap: 18,
          justifyContent: 'center',
        }}
      >
        {tileKeys.map((key, i) => {
          const phase = (frame * 0.25 + i * 1.3) % (Math.PI * 2);
          const glow = (Math.sin(phase) + 1) / 2;
          const tileSpring = safeSpring(frame - 20 - i * 15, fps, 12);
          return (
            <div
              key={key}
              style={{
                width: 120,
                height: 120,
                borderRadius: 20,
                background: `linear-gradient(135deg, ${C.bgElevated}, ${C.bgSurface})`,
                border: `2px solid ${C.terracotta}${Math.round(40 + glow * 140).toString(16).padStart(2, '0')}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 ${Math.round(glow * 24)}px ${C.terracotta}${Math.round(glow * 80).toString(16).padStart(2, '0')}`,
                opacity: tileSpring,
                transform: `scale(${tileSpring})`,
              }}
            >
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: glow > 0.6 ? C.terraLight : C.sageLight,
                  fontFamily: 'monospace',
                  transition: 'none',
                }}
              >
                {key}
              </span>
              <div
                style={{
                  width: 28,
                  height: 5,
                  borderRadius: 3,
                  marginTop: 6,
                  backgroundColor: i === 0 || i === 4 ? C.terracotta : C.sage,
                  opacity: 0.7,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Scrolling word typing strip */}
      <div
        style={{
          position: 'absolute',
          top: 1080,
          left: 0,
          right: 0,
          overflow: 'hidden',
          height: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 32,
            paddingLeft: 60,
            transform: `translateX(${wordShift}px)`,
          }}
        >
          {[wordIdx, wordIdx2, wordIdx3, (wordIdx3 + 1) % TYPING_WORDS.length].map((wi, i) => (
            <span
              key={`${wi}-${i}`}
              style={{
                fontSize: 36,
                fontWeight: i === 0 ? 900 : 600,
                color: i === 0 ? C.linenWhite : C.sage,
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
                textDecoration: i === 0 ? 'underline' : 'none',
                textDecorationColor: C.terracotta,
                textUnderlineOffset: 6,
              }}
            >
              {TYPING_WORDS[wi]}
            </span>
          ))}
        </div>
      </div>

      {/* Combo streak badge */}
      <div
        style={{
          position: 'absolute',
          top: 1190,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            background: `${C.ochre}22`,
            border: `1.5px solid ${C.ochre}88`,
            borderRadius: 16,
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 28 }}>🔥</span>
          <span
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: C.ochre,
              fontFamily: 'monospace',
            }}
          >
            x{Math.min(68, Math.floor(interpolate(frame, [40, 600], [1, 68], CLAMP)))} STREAK
          </span>
        </div>

        <div
          style={{
            background: `${C.emerald}22`,
            border: `1.5px solid ${C.emerald}88`,
            borderRadius: 16,
            padding: '14px 28px',
            fontFamily: 'monospace',
            fontSize: 26,
            fontWeight: 800,
            color: C.emeraldGlow,
          }}
        >
          +2,400 💎
        </div>
      </div>

      {/* Progress bar strip */}
      <div
        style={{
          position: 'absolute',
          top: 1340,
          left: 60,
          right: 60,
          height: 12,
          borderRadius: 6,
          backgroundColor: C.bgElevated,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${interpolate(frame, [0, 680], [0, 100], CLAMP)}%`,
            borderRadius: 6,
            background: `linear-gradient(90deg, ${C.terracotta}, ${C.ochre})`,
            boxShadow: `0 0 12px ${C.terracotta}`,
          }}
        />
      </div>

      {/* Stat cards grid */}
      <div
        style={{
          position: 'absolute',
          top: 1390,
          left: 60,
          right: 60,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 18,
        }}
      >
        {[
          { label: 'WORDS/MIN', value: `${liveWpm}`, color: C.ochre },
          { label: 'ACCURACY', value: '99.4%', color: C.emeraldGlow },
          { label: 'COMBO', value: `×${Math.min(68, Math.floor(interpolate(frame, [40, 600], [1, 68], CLAMP)))}`, color: C.terraLight },
        ].map(({ label, value, color }, i) => {
          const cardSpring = safeSpring(frame - 60 - i * 25, fps, 14);
          return (
            <div
              key={label}
              style={{
                background: C.bgSurface,
                border: `1px solid ${C.borderSubtle}`,
                borderRadius: 20,
                padding: '22px 16px',
                textAlign: 'center',
                opacity: cardSpring,
                transform: `translateY(${(1 - cardSpring) * 20}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  color: C.sage,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color,
                  fontFamily: 'monospace',
                }}
              >
                {value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom game mode label */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 60,
          right: 60,
          textAlign: 'center',
          fontFamily: 'monospace',
          fontSize: 22,
          color: C.sageLight,
          letterSpacing: 2,
        }}
      >
        ⚡ BLITZ MODE ACTIVATED — 60 SECOND CHALLENGE
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 2 — MULTIPLAYER RACE (660–1320 frames / 11 s)
// ============================================================================
const PLAYERS = [
  { name: 'YOU',      color: C.terracotta, glowColor: C.terraLight, startPct: 0,    endPct: 94  },
  { name: 'BLITZ_99', color: C.emerald,    glowColor: C.emeraldGlow, startPct: 0,   endPct: 78  },
  { name: 'KEYMASTER', color: C.ochre,     glowColor: C.ochre,       startPct: 0,   endPct: 85  },
  { name: 'SWIFTTYP', color: C.sage,       glowColor: C.sageLight,   startPct: 0,   endPct: 61  },
] as const;

const Scene2Multiplayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 30], [0, 1], CLAMP);
  const fadeOut = interpolate(frame, [620, 660], [1, 0], CLAMP);
  const opacity = fadeIn * fadeOut;

  const badgeSpring = safeSpring(frame - 10, fps, 14);

  // Each player bar progresses at a different rate
  const playerProgress = PLAYERS.map((p) =>
    interpolate(frame, [0, 580], [p.startPct, p.endPct], CLAMP)
  );

  // Win burst — "YOU WIN!" appears at frame 500
  const winOpacity = interpolate(frame, [500, 530], [0, 1], CLAMP);
  const winScale   = interpolate(frame, [500, 530], [0.7, 1], CLAMP);

  // Rank badge for "YOU" — shifts from #2 → #1 at frame 320
  const rank = frame < 320 ? '#2' : '#1';

  return (
    <AbsoluteFill style={{ opacity }}>
      <GameplayBackground accentHex={C.emerald} />

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: badgeSpring,
          transform: `translateY(${(1 - badgeSpring) * -20}px)`,
        }}
      >
        <div
          style={{
            background: `${C.emerald}22`,
            border: `1.5px solid ${C.emerald}`,
            borderRadius: 999,
            padding: '10px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22, color: C.emeraldGlow, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>
            🏁 MULTIPLAYER RACE
          </span>
        </div>
        <div
          style={{
            background: `${C.ochre}22`,
            border: `1.5px solid ${C.ochre}88`,
            borderRadius: 999,
            padding: '10px 22px',
            fontFamily: 'monospace',
            fontSize: 20,
            fontWeight: 800,
            color: C.ochre,
          }}
        >
          4 PLAYERS
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          position: 'absolute',
          top: 195,
          left: 60,
          right: 60,
          textAlign: 'center',
          opacity: safeSpring(frame - 25, fps, 16),
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 900,
            margin: 0,
            color: C.linenWhite,
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          Race Against The{' '}
          <span style={{ color: C.terraLight }}>World</span>
        </h1>
        <p style={{ fontSize: 26, color: C.sageLight, marginTop: 12 }}>
          Real-time multiplayer typing battles
        </p>
      </div>

      {/* Race Track */}
      <div
        style={{
          position: 'absolute',
          top: 400,
          left: 60,
          right: 60,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {PLAYERS.map((player, i) => {
          const pct     = playerProgress[i];
          const isYou   = i === 0;
          const pSpring = safeSpring(frame - 15 - i * 20, fps, 14);

          return (
            <div
              key={player.name}
              style={{
                opacity: pSpring,
                transform: `translateX(${(1 - pSpring) * -30}px)`,
              }}
            >
              {/* Player label row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {isYou && (
                    <div
                      style={{
                        background: `${C.terracotta}33`,
                        border: `1px solid ${C.terracotta}`,
                        borderRadius: 8,
                        padding: '3px 12px',
                        fontSize: 16,
                        fontWeight: 800,
                        color: C.terraLight,
                        fontFamily: 'monospace',
                      }}
                    >
                      {rank}
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: isYou ? 28 : 24,
                      fontWeight: isYou ? 900 : 700,
                      color: isYou ? C.linenWhite : C.sandstone,
                      fontFamily: 'monospace',
                    }}
                  >
                    {player.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: player.color,
                    fontFamily: 'monospace',
                  }}
                >
                  {Math.round(pct)}%
                </span>
              </div>

              {/* Progress bar track */}
              <div
                style={{
                  height: isYou ? 24 : 18,
                  borderRadius: 12,
                  backgroundColor: C.bgElevated,
                  overflow: 'hidden',
                  border: isYou ? `1px solid ${C.terracotta}44` : 'none',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 12,
                    background: isYou
                      ? `linear-gradient(90deg, ${C.terracotta}, ${C.ochre})`
                      : player.color,
                    boxShadow: isYou ? `0 0 14px ${C.terracotta}` : 'none',
                  }}
                />
              </div>

              {/* WPM label below bar */}
              <div
                style={{
                  marginTop: 6,
                  fontSize: 16,
                  color: C.sage,
                  fontFamily: 'monospace',
                }}
              >
                {[148, 112, 131, 94][i]} WPM
              </div>
            </div>
          );
        })}
      </div>

      {/* Finish line */}
      <div
        style={{
          position: 'absolute',
          top: 400,
          right: 60,
          width: 3,
          height: 310,
          background: `repeating-linear-gradient(to bottom, ${C.linenWhite} 0px, ${C.linenWhite} 10px, transparent 10px, transparent 20px)`,
          opacity: 0.25,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 372,
          right: 45,
          fontSize: 18,
          color: C.sageLight,
          fontFamily: 'monospace',
          fontWeight: 700,
        }}
      >
        🏁 FINISH
      </div>

      {/* YOU WIN burst */}
      <div
        style={{
          position: 'absolute',
          top: 770,
          left: 60,
          right: 60,
          textAlign: 'center',
          opacity: winOpacity,
          transform: `scale(${winScale})`,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${C.terracotta}33, ${C.ochre}22)`,
            border: `2px solid ${C.ochre}`,
            borderRadius: 28,
            padding: '36px 24px',
            boxShadow: `0 20px 60px #00000088, 0 0 40px ${C.ochre}33`,
          }}
        >
          <div style={{ fontSize: 60, marginBottom: 8 }}>🏆</div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: C.ochre,
              fontFamily: 'monospace',
              letterSpacing: 2,
            }}
          >
            YOU WIN!
          </div>
          <div style={{ fontSize: 28, color: C.linenWhite, marginTop: 10, fontWeight: 700 }}>
            148 WPM · 99.4% Accuracy
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 26,
              color: C.emeraldGlow,
              fontWeight: 800,
              fontFamily: 'monospace',
            }}
          >
            +5,000 💎 EMERALDS
          </div>
        </div>
      </div>

      {/* Live player count */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        {[
          { icon: '👥', label: '2,841 ONLINE' },
          { icon: '⚡', label: 'ULTRA MODE' },
          { icon: '🌍', label: 'GLOBAL' },
        ].map(({ icon, label }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 20,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: C.sageLight,
            }}
          >
            <span style={{ fontSize: 22 }}>{icon}</span>
            {label}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 3 — SVG SPEEDOMETER + QWERTY HEATMAP (1260–1860 frames / 10 s)
// ============================================================================
const QWERTY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
] as const;

// Frequency weight per key (higher = warmer = more terracotta)
const KEY_FREQ: Record<string, number> = {
  E:1,T:0.9,A:0.85,O:0.8,I:0.78,N:0.75,S:0.72,H:0.7,R:0.68,
  D:0.55,L:0.5,C:0.48,U:0.45,M:0.42,W:0.38,F:0.35,G:0.32,
  Y:0.28,P:0.25,B:0.22,V:0.2,K:0.15,J:0.08,X:0.06,Q:0.04,Z:0.03,
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// Blend two hex colors by t ∈ [0,1]
function blendHex(hex1: string, hex2: string, t: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const r = Math.round(lerp(r1, r2, t)).toString(16).padStart(2, '0');
  const g = Math.round(lerp(g1, g2, t)).toString(16).padStart(2, '0');
  const b = Math.round(lerp(b1, b2, t)).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

const Scene3Speedometer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 30], [0, 1], CLAMP);
  const fadeOut = interpolate(frame, [560, 600], [1, 0], CLAMP);
  const opacity = fadeIn * fadeOut;

  // WPM animated 0 → 148 over 420 frames then holds
  const displayWpm = Math.floor(interpolate(frame, [30, 450], [0, 148], CLAMP));

  // Arc sweep angle: 0 → 200 degrees (leaving gap at bottom)
  const arcProgress = interpolate(frame, [30, 450], [0, 1], CLAMP);
  const sweepDeg    = arcProgress * 200;

  // SVG arc helpers (all math, no runtime errors possible)
  const cx = 540;
  const cy = 420;
  const R  = 260;

  // Convert degrees (starting at -210° = 7 o'clock) to SVG path coords
  const toXY = (deg: number) => {
    const rad = ((-210 + deg) * Math.PI) / 180;
    return {
      x: cx + R * Math.cos(rad),
      y: cy + R * Math.sin(rad),
    };
  };

  const arcStart = toXY(0);
  const arcEnd   = toXY(Math.max(0.01, sweepDeg));
  const largeArc = sweepDeg > 180 ? 1 : 0;

  // Needle angle
  const needleRad = ((-210 + sweepDeg) * Math.PI) / 180;
  const needleTip = {
    x: cx + (R - 30) * Math.cos(needleRad),
    y: cy + (R - 30) * Math.sin(needleRad),
  };

  // Heatmap reveal — keys light up staggered
  const heatReveal = interpolate(frame, [120, 500], [0, 1], CLAMP);

  const sectionSpring = safeSpring(frame - 10, fps, 14);
  const heatSpring    = safeSpring(frame - 80, fps, 16);

  return (
    <AbsoluteFill style={{ opacity }}>
      <GameplayBackground accentHex={C.ochre} />

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 60,
          right: 60,
          textAlign: 'center',
          opacity: sectionSpring,
          transform: `translateY(${(1 - sectionSpring) * -20}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: `${C.ochre}22`,
            border: `1.5px solid ${C.ochre}88`,
            borderRadius: 999,
            padding: '10px 28px',
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 22,
              fontWeight: 800,
              color: C.ochre,
              letterSpacing: 2,
            }}
          >
            ⌨ PERFORMANCE ANALYTICS
          </span>
        </div>
        <h1
          style={{
            fontSize: 54,
            fontWeight: 900,
            margin: 0,
            color: C.linenWhite,
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          Your Typing{' '}
          <span style={{ color: C.ochre }}>DNA</span>
        </h1>
      </div>

      {/* SVG Speedometer */}
      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: sectionSpring,
        }}
      >
        <svg width={1080} height={600} style={{ overflow: 'visible' }}>
          {/* Outer track */}
          <path
            d={`M ${toXY(0).x} ${toXY(0).y} A ${R} ${R} 0 1 1 ${toXY(199.9).x} ${toXY(199.9).y}`}
            fill="none"
            stroke={C.bgElevated}
            strokeWidth={28}
            strokeLinecap="round"
          />
          {/* Filled progress arc */}
          <path
            d={`M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`}
            fill="none"
            stroke={`url(#arcGrad)`}
            strokeWidth={28}
            strokeLinecap="round"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={C.terracotta} />
              <stop offset="50%"  stopColor={C.ochre} />
              <stop offset="100%" stopColor={C.emeraldGlow} />
            </linearGradient>
          </defs>
          {/* Glow ring behind arc */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.terracotta} strokeWidth={4} strokeOpacity={0.12} />
          {/* Tick marks */}
          {Array.from({ length: 11 }, (_, ti) => {
            const tickDeg = (ti / 10) * 200;
            const inner = toXY(tickDeg);
            const outerR = R + 18;
            const outerRad = ((-210 + tickDeg) * Math.PI) / 180;
            return (
              <line
                key={ti}
                x1={inner.x}
                y1={inner.y}
                x2={cx + outerR * Math.cos(outerRad)}
                y2={cy + outerR * Math.sin(outerRad)}
                stroke={C.borderFocus}
                strokeWidth={ti % 5 === 0 ? 4 : 2}
                strokeOpacity={0.6}
              />
            );
          })}
          {/* WPM labels: 0, 50, 100, 150 */}
          {[0, 50, 100, 150].map((wpmMark, mi) => {
            const pct    = wpmMark / 150;
            const mDeg   = pct * 200;
            const mRad   = ((-210 + mDeg) * Math.PI) / 180;
            const labelR = R + 52;
            return (
              <text
                key={mi}
                x={cx + labelR * Math.cos(mRad)}
                y={cy + labelR * Math.sin(mRad)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={C.sage}
                fontSize={22}
                fontFamily="monospace"
                fontWeight={700}
              >
                {wpmMark}
              </text>
            );
          })}
          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke={C.terraLight}
            strokeWidth={6}
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx={cx} cy={cy} r={18} fill={C.bgSurface} stroke={C.terracotta} strokeWidth={4} />
          <circle cx={cx} cy={cy} r={8}  fill={C.terraLight} />
          {/* Central WPM display */}
          <text
            x={cx}
            y={cy + 80}
            textAnchor="middle"
            fill={C.ochre}
            fontSize={84}
            fontFamily="monospace"
            fontWeight={900}
          >
            {displayWpm}
          </text>
          <text
            x={cx}
            y={cy + 130}
            textAnchor="middle"
            fill={C.sageLight}
            fontSize={28}
            fontFamily="monospace"
            fontWeight={700}
            letterSpacing={4}
          >
            WPM
          </text>
          {/* Accuracy arc — small ring inside */}
          <text
            x={cx}
            y={cy - 80}
            textAnchor="middle"
            fill={C.emeraldGlow}
            fontSize={36}
            fontFamily="monospace"
            fontWeight={800}
          >
            99.4% ACC
          </text>
        </svg>
      </div>

      {/* QWERTY Heatmap */}
      <div
        style={{
          position: 'absolute',
          top: 900,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          opacity: heatSpring,
          transform: `translateY(${(1 - heatSpring) * 30}px)`,
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: C.sageLight,
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          ⌨ KEYSTROKE HEATMAP
        </div>
        {QWERTY_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 8 }}>
            {row.map((key, ki) => {
              const freq    = KEY_FREQ[key] ?? 0.1;
              const reveal  = Math.max(0, Math.min(1, heatReveal * 3 - (ri * 0.4 + ki * 0.08)));
              const keyColor = blendHex(C.bgElevated, C.terracotta, freq * reveal);
              const textColor = freq > 0.5 ? C.linenWhite : C.sageLight;
              return (
                <div
                  key={key}
                  style={{
                    width: 85,
                    height: 75,
                    borderRadius: 12,
                    backgroundColor: keyColor,
                    border: `1.5px solid ${C.borderSubtle}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.4 + reveal * 0.6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 900,
                      color: textColor,
                      fontFamily: 'monospace',
                    }}
                  >
                    {key}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        {/* Heatmap legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
          }}
        >
          <span style={{ fontSize: 18, color: C.sage, fontFamily: 'monospace' }}>RARELY</span>
          <div
            style={{
              width: 200,
              height: 12,
              borderRadius: 6,
              background: `linear-gradient(90deg, ${C.bgElevated}, ${C.terracotta})`,
            }}
          />
          <span style={{ fontSize: 18, color: C.terraLight, fontFamily: 'monospace' }}>OFTEN</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 4 — ACHIEVEMENTS (1800–2700 frames / 15 s)
// ============================================================================
const ACHIEVEMENTS = [
  { icon: '🔥', title: 'SPEED DEMON',      sub: 'Reach 100+ WPM',        reward: '+1,000 💎', color: C.terracotta },
  { icon: '⚡', title: 'GODSPEED',          sub: 'Reach 148 WPM',         reward: '+3,000 💎', color: C.ochre },
  { icon: '🎯', title: 'PERFECT ACCURACY',  sub: '99.4% in a full race',  reward: '+2,500 💎', color: C.emerald },
  { icon: '🏆', title: 'CHAMPION',          sub: 'Win 10 multiplayer races', reward: '+5,000 💎', color: C.terraLight },
] as const;

const Scene4Achievements: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 30], [0, 1], CLAMP);
  const fadeOut = interpolate(frame, [840, 900], [1, 0], CLAMP);
  const opacity = fadeIn * fadeOut;

  const badgeSpring = safeSpring(frame - 10, fps, 14);

  // One achievement unlocks every 180 frames
  const activeIdx = Math.min(ACHIEVEMENTS.length - 1, Math.floor(frame / 180));

  // Toast slide-in for the current achievement
  const toastProgress = (frame % 180) / 180;
  const toastIn  = interpolate(toastProgress, [0, 0.15], [0, 1], CLAMP);
  const toastOut = interpolate(toastProgress, [0.75, 1.0], [1, 0], CLAMP);
  const toastOp  = toastIn * toastOut;

  const toastX = interpolate(toastProgress, [0, 0.15], [200, 0], CLAMP);

  // Streak counter
  const streak = Math.floor(interpolate(frame, [0, 800], [1, 87], CLAMP));

  // Emerald rain — 8 particles
  const RAIN_SEEDS = [110, 230, 360, 490, 620, 750, 880, 985];

  // Screenshot scale-up
  const imgScale = interpolate(frame, [0, 200], [1.08, 1], CLAMP);

  // XP bar
  const xpPct = interpolate(frame, [0, 800], [12, 92], CLAMP);

  return (
    <AbsoluteFill style={{ opacity }}>
      <GameplayBackground accentHex={C.ochre} />

      {/* Screenshot background (achievements page) */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 50,
          right: 50,
          height: 560,
          borderRadius: 28,
          overflow: 'hidden',
          border: `2px solid ${C.ochre}44`,
          boxShadow: `0 30px 80px #00000099`,
          transform: `scale(${imgScale})`,
        }}
      >
        <Img
          src={staticFile('ati_achievements.png')}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            background: `linear-gradient(to top, ${C.bgDark}ee, transparent)`,
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: badgeSpring,
          transform: `translateY(${(1 - badgeSpring) * -20}px)`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: `${C.ochre}22`,
            border: `1.5px solid ${C.ochre}`,
            borderRadius: 999,
            padding: '10px 28px',
            fontFamily: 'monospace',
            fontSize: 22,
            fontWeight: 800,
            color: C.ochre,
            letterSpacing: 2,
          }}
        >
          🏅 ACHIEVEMENTS
        </div>
        <div
          style={{
            background: `${C.emerald}22`,
            border: `1.5px solid ${C.emerald}`,
            borderRadius: 999,
            padding: '10px 22px',
            fontFamily: 'monospace',
            fontSize: 20,
            fontWeight: 800,
            color: C.emeraldGlow,
          }}
        >
          x{streak} STREAK 🔥
        </div>
      </div>

      {/* Achievement Toast */}
      <div
        style={{
          position: 'absolute',
          top: 790,
          left: 60,
          right: 60,
          opacity: toastOp,
          transform: `translateX(${toastX}px)`,
          zIndex: 20,
        }}
      >
        {(() => {
          const ach = ACHIEVEMENTS[activeIdx];
          return (
            <div
              style={{
                background: `linear-gradient(135deg, ${C.bgSurface}, ${C.bgElevated})`,
                border: `2px solid ${ach.color}`,
                borderRadius: 28,
                padding: '28px 32px',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                boxShadow: `0 20px 60px #00000088, 0 0 30px ${ach.color}44`,
              }}
            >
              <span style={{ fontSize: 60 }}>{ach.icon}</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    color: C.sage,
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    marginBottom: 4,
                  }}
                >
                  ACHIEVEMENT UNLOCKED
                </div>
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 900,
                    color: C.linenWhite,
                    fontFamily: 'monospace',
                  }}
                >
                  {ach.title}
                </div>
                <div style={{ fontSize: 20, color: C.sageLight, marginTop: 4 }}>
                  {ach.sub}
                </div>
              </div>
              <div
                style={{
                  background: `${ach.color}22`,
                  border: `1.5px solid ${ach.color}`,
                  borderRadius: 14,
                  padding: '10px 20px',
                  fontFamily: 'monospace',
                  fontSize: 24,
                  fontWeight: 900,
                  color: ach.color,
                  whiteSpace: 'nowrap',
                }}
              >
                {ach.reward}
              </div>
            </div>
          );
        })()}
      </div>

      {/* XP Progress bar */}
      <div
        style={{
          position: 'absolute',
          top: 980,
          left: 60,
          right: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 20, color: C.sageLight, fontFamily: 'monospace', fontWeight: 700 }}>
            LEVEL 12
          </span>
          <span style={{ fontSize: 20, color: C.ochre, fontFamily: 'monospace', fontWeight: 800 }}>
            {Math.round(xpPct)}% XP
          </span>
        </div>
        <div
          style={{
            height: 16,
            borderRadius: 8,
            backgroundColor: C.bgElevated,
            overflow: 'hidden',
            border: `1px solid ${C.borderSubtle}`,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${xpPct}%`,
              borderRadius: 8,
              background: `linear-gradient(90deg, ${C.terracotta}, ${C.ochre}, ${C.emerald})`,
              boxShadow: `0 0 12px ${C.ochre}66`,
            }}
          />
        </div>
      </div>

      {/* Achievement grid — four unlocked badges */}
      <div
        style={{
          position: 'absolute',
          top: 1060,
          left: 60,
          right: 60,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        {ACHIEVEMENTS.map((ach, i) => {
          const isUnlocked = i <= activeIdx;
          const cardSpring = safeSpring(frame - i * 60, fps, 14);
          return (
            <div
              key={ach.title}
              style={{
                background: isUnlocked ? `${ach.color}18` : C.bgSurface,
                border: `1.5px solid ${isUnlocked ? ach.color : C.borderSubtle}`,
                borderRadius: 20,
                padding: '20px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: cardSpring * (isUnlocked ? 1 : 0.45),
                transform: `scale(${cardSpring})`,
              }}
            >
              <span style={{ fontSize: 34, filter: isUnlocked ? 'none' : 'grayscale(100%)' }}>
                {ach.icon}
              </span>
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: isUnlocked ? C.linenWhite : C.sage,
                    fontFamily: 'monospace',
                  }}
                >
                  {ach.title}
                </div>
                <div style={{ fontSize: 16, color: C.sage, marginTop: 2 }}>{ach.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emerald rain */}
      {RAIN_SEEDS.map((seed, i) => {
        const x    = (seed % 960) + 60;
        const y    = ((frame * 2.5 + seed * 37) % 1400) + 100;
        const size = 14 + (i % 3) * 6;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              fontSize: size,
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          >
            💎
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 5 — CTA (2640–3600 frames / 16 s)
// ============================================================================
const CTA_FEATURES = [
  { icon: '📝', label: 'Words, Sentences\n& Paragraphs' },
  { icon: '🏁', label: 'Live Multiplayer\nRaces' },
  { icon: '🏅', label: 'Achievements\n& Rewards' },
  { icon: '📊', label: 'Performance\nAnalytics' },
  { icon: '🌓', label: 'Dual Themes\nLight & Dark' },
  { icon: '💻', label: 'Works 100%\nOffline' },
] as const;

const CTA_TITLE = 'DOWNLOAD FREE';

const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn  = interpolate(frame, [0, 40], [0, 1], CLAMP);
  const fadeOut = interpolate(frame, [900, 960], [1, 0], CLAMP);
  const opacity = fadeIn * fadeOut;

  const bgReveal  = safeSpring(frame - 5, fps, 18);
  const headSpring = safeSpring(frame - 20, fps, 14);
  const gridSpring = safeSpring(frame - 80, fps, 14);
  const ctaSpring  = safeSpring(frame - 200, fps, 12);

  // Pulsing subscribe ring — repeats every 90 frames
  const ringPhase  = (frame % 90) / 90;
  const ringScale  = interpolate(ringPhase, [0, 1], [1, 1.5], CLAMP);
  const ringOpacity = interpolate(ringPhase, [0, 0.6, 1], [0.6, 0.2, 0], CLAMP);

  // Letter reveal for "DOWNLOAD FREE"
  const lettersRevealed = interpolate(frame, [20, 200], [0, CTA_TITLE.length], CLAMP);

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Warm terracotta gradient background */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(160deg, ${C.bgDark} 0%, #1a120a 50%, #0E1110 100%)`,
          opacity: bgReveal,
        }}
      />

      {/* Large ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 800,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${C.terracotta}33 0%, transparent 70%)`,
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      {/* AVAILABLE NOW badge */}
      <div
        style={{
          position: 'absolute',
          top: 110,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'center',
          opacity: headSpring,
          transform: `translateY(${(1 - headSpring) * -20}px)`,
        }}
      >
        <div
          style={{
            background: `${C.emerald}22`,
            border: `1.5px solid ${C.emerald}`,
            borderRadius: 999,
            padding: '12px 36px',
            fontFamily: 'monospace',
            fontSize: 22,
            fontWeight: 800,
            color: C.emeraldGlow,
            letterSpacing: 2,
          }}
        >
          ✓ AVAILABLE NOW — TOTALLY FREE
        </div>
      </div>

      {/* Letter-reveal title */}
      <div
        style={{
          position: 'absolute',
          top: 210,
          left: 60,
          right: 60,
          textAlign: 'center',
          opacity: headSpring,
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            fontFamily: 'monospace',
            letterSpacing: -2,
            lineHeight: 1,
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 0,
          }}
        >
          {CTA_TITLE.split('').map((char, i) => {
            const revealed = i < lettersRevealed;
            return (
              <span
                key={i}
                style={{
                  color: char === ' ' ? 'transparent' : (i < 8 ? C.linenWhite : C.ochre),
                  opacity: revealed ? 1 : 0,
                  display: 'inline-block',
                  width: char === ' ' ? 28 : 'auto',
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
        <div
          style={{
            fontSize: 30,
            color: C.sageLight,
            marginTop: 16,
            fontWeight: 600,
          }}
        >
          Advanced Typing Instructor v1.4
        </div>
      </div>

      {/* Feature grid */}
      <div
        style={{
          position: 'absolute',
          top: 520,
          left: 60,
          right: 60,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
          opacity: gridSpring,
          transform: `translateY(${(1 - gridSpring) * 30}px)`,
        }}
      >
        {CTA_FEATURES.map(({ icon, label }, i) => {
          const itemSpring = safeSpring(frame - 80 - i * 18, fps, 14);
          return (
            <div
              key={label}
              style={{
                background: C.bgSurface,
                border: `1px solid ${C.borderSubtle}`,
                borderRadius: 20,
                padding: '24px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: itemSpring,
                transform: `scale(${itemSpring})`,
              }}
            >
              <span style={{ fontSize: 36 }}>{icon}</span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.sandstone,
                  whiteSpace: 'pre-line',
                  lineHeight: 1.3,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* CTA button — main */}
      <div
        style={{
          position: 'absolute',
          top: 1160,
          left: 60,
          right: 60,
          opacity: ctaSpring,
          transform: `scale(${ctaSpring})`,
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${C.terracotta}, ${C.terraLight})`,
            borderRadius: 28,
            padding: '36px 24px',
            textAlign: 'center',
            boxShadow: `0 20px 60px ${C.terracotta}55`,
          }}
        >
          <div
            style={{
              fontSize: 46,
              fontWeight: 900,
              color: C.linenWhite,
              fontFamily: 'monospace',
              letterSpacing: 2,
            }}
          >
            PLAY FREE NOW →
          </div>
          <div
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 10,
              fontFamily: 'monospace',
            }}
          >
            advancedlogiclabs.dpdns.org/ATI
          </div>
        </div>
      </div>

      {/* Subscribe nudge */}
      <div
        style={{
          position: 'absolute',
          top: 1380,
          left: 60,
          right: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          opacity: ctaSpring * 0.9,
        }}
      >
        {/* Pulsing ring */}
        <div style={{ position: 'relative', width: 60, height: 60 }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 60,
              height: 60,
              marginTop: -30,
              marginLeft: -30,
              borderRadius: '50%',
              border: `3px solid ${C.terracotta}`,
              transform: `scale(${ringScale})`,
              opacity: ringOpacity,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 40,
              height: 40,
              marginTop: -20,
              marginLeft: -20,
              borderRadius: '50%',
              backgroundColor: C.terracotta,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            🔔
          </div>
        </div>
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: C.linenWhite,
            fontFamily: 'monospace',
          }}
        >
          SUBSCRIBE FOR MORE
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          position: 'absolute',
          top: 1480,
          left: 60,
          right: 60,
          height: 1,
          backgroundColor: C.borderSubtle,
          opacity: 0.6,
        }}
      />

      {/* Bottom stats strip */}
      <div
        style={{
          position: 'absolute',
          top: 1510,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-around',
          opacity: ctaSpring,
        }}
      >
        {[
          { value: '10K+', label: 'DOWNLOADS' },
          { value: '148', label: 'MAX WPM' },
          { value: '100%', label: 'OFFLINE' },
          { value: 'FREE', label: 'ALWAYS' },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: C.ochre,
                fontFamily: 'monospace',
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontSize: 16,
                color: C.sage,
                fontFamily: 'monospace',
                letterSpacing: 1,
                marginTop: 4,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Final tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 60,
          right: 60,
          textAlign: 'center',
          fontFamily: 'monospace',
          fontSize: 24,
          color: C.sageLight,
          fontWeight: 700,
          letterSpacing: 1,
          opacity: ctaSpring,
        }}
      >
        Master your keyboard. Master your mind.
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// ROOT COMPOSITION — ATI Gameplay Showcase
// ============================================================================
export const GameplayComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0E1110' }}>
      {/* Scene 1: Live Race  — 0 to 720 frames (12s) */}
      <Sequence from={0} durationInFrames={720} name="Scene1-LiveRace">
        <Scene1LiveRace />
      </Sequence>

      {/* Scene 2: Multiplayer — 660 to 1320 frames (11s), 60-frame crossfade */}
      <Sequence from={660} durationInFrames={660} name="Scene2-Multiplayer">
        <Scene2Multiplayer />
      </Sequence>

      {/* Scene 3: Speedometer — 1260 to 1860 frames (10s), 60-frame crossfade */}
      <Sequence from={1260} durationInFrames={600} name="Scene3-Speedometer">
        <Scene3Speedometer />
      </Sequence>

      {/* Scene 4: Achievements — 1800 to 2700 frames (15s), 60-frame crossfade */}
      <Sequence from={1800} durationInFrames={900} name="Scene4-Achievements">
        <Scene4Achievements />
      </Sequence>

      {/* Scene 5: CTA — 2640 to 3600 frames (16s), 60-frame crossfade */}
      <Sequence from={2640} durationInFrames={960} name="Scene5-CTA">
        <Scene5CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
