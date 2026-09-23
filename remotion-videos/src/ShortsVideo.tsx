import React from 'react';
import { 
  AbsoluteFill, 
  Sequence, 
  interpolate, 
  spring, 
  useCurrentFrame, 
  useVideoConfig 
} from 'remotion';

// ============================================================================
// DESIGN TOKENS & COLOR PALETTE
// ============================================================================
const C = {
  bgDeep: '#07090E',
  bgSurface: 'rgba(15, 23, 42, 0.85)',
  bgElevated: 'rgba(30, 41, 59, 0.88)',
  borderSubtle: 'rgba(255, 255, 255, 0.14)',
  cyan: '#00F5FF',
  cyanGlow: 'rgba(0, 245, 255, 0.45)',
  pink: '#FF2E93',
  pinkGlow: 'rgba(255, 46, 147, 0.45)',
  purple: '#A855F7',
  purpleGlow: 'rgba(168, 85, 247, 0.4)',
  emerald: '#10B981',
  emeraldGlow: 'rgba(16, 185, 129, 0.4)',
  amber: '#F59E0B',
  yellow: '#FACC15',
  red: '#EF4444',
  white: '#F8FAFC',
  slate: '#94A3B8',
  darkSlate: '#64748B',
};

// ============================================================================
// 1. DYNAMIC LIVING BACKGROUND
// ============================================================================
const LivingBackground: React.FC<{ accentColor?: string; gridSpeed?: number }> = ({ 
  accentColor = C.cyan, 
  gridSpeed = 1.0 
}) => {
  const frame = useCurrentFrame();

  // Moving ambient nebula orbs
  const orb1X = 540 + Math.sin(frame * 0.03) * 220;
  const orb1Y = 450 + Math.cos(frame * 0.025) * 180;
  const orb2X = 540 + Math.cos(frame * 0.02) * 250;
  const orb2Y = 1350 + Math.sin(frame * 0.035) * 200;

  // Flowing grid offset
  const gridOffset = (frame * 4 * gridSpeed) % 60;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep, overflow: 'hidden' }}>
      {/* Dynamic Nebula Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          left: orb1X - 350,
          top: orb1Y - 350,
          width: 700,
          height: 700,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          opacity: 0.24,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: orb2X - 350,
          top: orb2Y - 350,
          width: 700,
          height: 700,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${C.purple} 0%, transparent 70%)`,
          opacity: 0.2,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Perspective Grid Floor */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          perspective: 800,
          overflow: 'hidden',
          opacity: 0.55,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -300,
            right: -300,
            top: '10%',
            bottom: -300,
            transform: 'rotateX(55deg)',
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.09) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            backgroundPosition: `0px ${gridOffset}px`,
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 35%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 35%, transparent 95%)',
          }}
        />
      </div>

      {/* Floating Sparks */}
      {Array.from({ length: 24 }).map((_, i) => {
        const seed = i * 47;
        const x = (seed * 19) % 1080;
        const speed = 1.2 + (seed % 3) * 0.8;
        const y = ((1920 - (frame * speed * 3 + seed * 50)) % 2100) - 100;
        const size = 3 + (seed % 4);
        const pOpacity = 0.25 + ((Math.sin(frame * 0.05 + seed) + 1) / 2) * 0.65;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: 999,
              backgroundColor: i % 2 === 0 ? accentColor : C.yellow,
              opacity: pOpacity,
              boxShadow: `0 0 12px ${accentColor}`,
            }}
          />
        );
      })}

      {/* Edge Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 160px rgba(0, 0, 0, 0.85)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// 2. VIRAL MRBEAST/HORMOZI DYNAMIC SUBTITLES COMPONENT
// ============================================================================
interface CaptionWord {
  word: string;
  start: number;
  end: number;
  highlight?: 'yellow' | 'green' | 'red' | 'cyan' | 'pink';
}

interface CaptionPhrase {
  start: number;
  end: number;
  words: CaptionWord[];
}

const ViralCaption: React.FC<{ phrases: CaptionPhrase[]; y?: number }> = ({ phrases, y = 1040 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activePhrase = phrases.find((p) => frame >= p.start && frame <= p.end);
  if (!activePhrase) return null;

  const activeWord = activePhrase.words.find((w) => frame >= w.start && frame <= w.end);
  const wordProgress = activeWord ? frame - activeWord.start : 0;
  const popScale = activeWord ? spring({
    frame: wordProgress,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 240 },
  }) : 1;

  const phraseScale = spring({
    frame: frame - activePhrase.start,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 200 },
  });

  const getHighlightColor = (h?: string) => {
    switch (h) {
      case 'yellow': return C.yellow;
      case 'green': return C.emerald;
      case 'red': return C.red;
      case 'cyan': return C.cyan;
      case 'pink': return C.pink;
      default: return C.white;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 70,
        padding: '0 30px',
        transform: `scale(${phraseScale})`,
      }}
    >
      <div
        style={{
          background: 'rgba(5, 8, 18, 0.94)',
          backdropFilter: 'blur(25px)',
          border: '2px solid rgba(255, 255, 255, 0.22)',
          borderRadius: 26,
          padding: '16px 36px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 245, 255, 0.25)',
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {activePhrase.words.map((w, idx) => {
          const isCurrent = w === activeWord;
          const isPast = frame > w.end;
          const color = getHighlightColor(w.highlight);

          return (
            <span
              key={idx}
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 900,
                fontSize: 54,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: isCurrent ? color : isPast ? '#CBD5E1' : '#64748B',
                transform: isCurrent ? `scale(${popScale * 1.15})` : 'scale(1)',
                textShadow: isCurrent ? `0 0 30px ${color}` : 'none',
                display: 'inline-block',
                transition: 'all 0.08s ease',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 3. MECHANICAL KEYBOARD DECK (ACTUATION MONITOR)
// ============================================================================
const VirtualKeypad: React.FC<{ activeKeys?: string[]; y?: number }> = ({ 
  activeKeys = ['A', 'S', 'D', 'F', 'J', 'K'], 
  y = 1240 
}) => {
  const frame = useCurrentFrame();
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'SPACE'],
  ];

  const activeChar = activeKeys[Math.floor(frame / 6) % activeKeys.length];

  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 40,
        top: y,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
        background: 'rgba(10, 15, 26, 0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: 28,
        padding: '20px 16px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.75)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>🎧</span>
        <span style={{ color: C.cyan, fontSize: 14, fontWeight: 900, letterSpacing: 2.5, fontFamily: 'monospace' }}>
          CHERRY MX BLUE ACTUATION MONITOR
        </span>
      </div>

      {rows.map((row, rIdx) => (
        <div key={rIdx} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {row.map((k) => {
            const isPressed = k === activeChar || (k === 'SPACE' && frame % 10 === 0);
            const isWide = k === 'SPACE';

            return (
              <div
                key={k}
                style={{
                  width: isWide ? 220 : 64,
                  height: 52,
                  borderRadius: 14,
                  background: isPressed
                    ? 'linear-gradient(180deg, #00F5FF, #0284C7)'
                    : 'linear-gradient(180deg, #1E293B, #0F172A)',
                  border: isPressed
                    ? '2px solid #38BDF8'
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: isPressed
                    ? '0 0 22px rgba(0, 245, 255, 0.85), inset 0 2px 4px rgba(255, 255, 255, 0.4)'
                    : '0 4px 10px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  transform: isPressed ? 'translateY(3px) scale(0.96)' : 'translateY(0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isPressed ? '#030712' : '#F1F5F9',
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: isWide ? 14 : 18,
                  transition: 'all 0.08s ease',
                }}
              >
                {k}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// SCENE 1: THE IMPOSSIBLE HOOK (0 - 160 frames / 0s - 5.3s)
// ============================================================================
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hookScale = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 180 },
  });

  const bossWarningPulse = (Math.sin(frame * 0.25) + 1) / 2;
  const hpDrain = interpolate(frame, [50, 150], [10000, 8400], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isLaserFiring = frame >= 70 && frame <= 110;
  const shakeX = isLaserFiring ? Math.sin(frame * 1.5) * 12 : 0;
  const shakeY = isLaserFiring ? Math.cos(frame * 1.7) * 10 : 0;

  const phrases: CaptionPhrase[] = [
    {
      start: 5,
      end: 45,
      words: [
        { word: 'THIS', start: 5, end: 20 },
        { word: 'IS', start: 20, end: 32 },
        { word: 'THE', start: 32, end: 45 },
      ],
    },
    {
      start: 45,
      end: 95,
      words: [
        { word: 'MOST', start: 45, end: 62, highlight: 'yellow' },
        { word: 'AGGRESSIVE', start: 62, end: 95, highlight: 'red' },
      ],
    },
    {
      start: 95,
      end: 155,
      words: [
        { word: 'TYPING', start: 95, end: 125, highlight: 'cyan' },
        { word: 'TEST!', start: 125, end: 155, highlight: 'yellow' },
      ],
    },
  ];

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      <LivingBackground accentColor={C.red} gridSpeed={1.8} />

      {/* TOP ZONE: Warning Pill */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          scale: `${hookScale}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 32px',
            borderRadius: 999,
            background: 'rgba(239, 68, 68, 0.18)',
            border: '2px solid rgba(239, 68, 68, 0.6)',
            boxShadow: `0 0 30px rgba(239, 68, 68, ${bossWarningPulse * 0.7})`,
          }}
        >
          <span style={{ fontSize: 26, transform: 'scale(1.2)' }}>⚠️</span>
          <span
            style={{
              color: '#FCA5A5',
              fontFamily: 'monospace',
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: 4,
            }}
          >
            WARNING: ARCADE COMBAT ACTIVE
          </span>
        </div>
      </div>

      {/* Holographic Boss Golem Container */}
      <div
        style={{
          position: 'absolute',
          top: 230,
          left: 50,
          right: 50,
          background: 'linear-gradient(180deg, rgba(30, 20, 35, 0.94), rgba(15, 10, 25, 0.98))',
          borderRadius: 36,
          border: '2px solid rgba(239, 68, 68, 0.45)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(239, 68, 68, 0.25)',
          padding: '36px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Top Boss Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span style={{ color: '#F87171', fontFamily: 'monospace', fontWeight: 900, fontSize: 17, letterSpacing: 3 }}>
            👾 CHAPTER 1 BOSS: LATENCY GOLEM
          </span>
          <span style={{ color: '#FBBF24', fontFamily: 'monospace', fontWeight: 900, fontSize: 14, background: 'rgba(245, 158, 11, 0.2)', padding: '4px 14px', borderRadius: 8 }}>
            STAGE 40 / 200
          </span>
        </div>

        {/* Huge Boss Skull / Icon with Pulsing Laser Eyes */}
        <div
          style={{
            fontSize: 140,
            margin: '12px 0',
            filter: 'drop-shadow(0 0 40px #EF4444)',
            transform: `scale(${1 + Math.sin(frame * 0.15) * 0.06})`,
          }}
        >
          🤖
        </div>

        {/* Boss HP Bar */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 16, fontFamily: 'monospace' }}>BOSS INTEGRITY</span>
            <span style={{ color: '#EF4444', fontWeight: 900, fontSize: 17, fontFamily: 'monospace' }}>
              {Math.round(hpDrain).toLocaleString()} / 10,000 HP
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 26,
              background: 'rgba(0, 0, 0, 0.8)',
              borderRadius: 999,
              overflow: 'hidden',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${(hpDrain / 10000) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #DC2626, #EF4444, #F87171)',
                boxShadow: '0 0 20px #EF4444',
                transition: 'width 0.1s ease',
              }}
            />
          </div>
        </div>

        {/* Sudden Laser Beam Blasting Downwards */}
        {isLaserFiring && (
          <div
            style={{
              position: 'absolute',
              top: 180,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 44,
              height: 700,
              background: 'linear-gradient(180deg, #FFFFFF 0%, #EF4444 40%, transparent 100%)',
              boxShadow: '0 0 60px #EF4444, 0 0 100px #F87171',
              zIndex: 40,
              borderRadius: 16,
            }}
          />
        )}

        {/* Floating Damage Floaties */}
        {frame >= 60 && (
          <div
            style={{
              position: 'absolute',
              right: 80,
              top: 150,
              transform: `translateY(${-((frame - 60) * 2.5)}px)`,
              opacity: interpolate(frame, [60, 110], [1, 0]),
              color: '#FACC15',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 900,
              fontSize: 34,
              textShadow: '0 0 15px #F59E0B',
            }}
          >
            💥 -1,600 CRIT!
          </div>
        )}
      </div>

      {/* Live Velocity Tachometer Card Preview */}
      <div
        style={{
          position: 'absolute',
          top: 730,
          left: 50,
          right: 50,
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 30,
          border: '2px solid rgba(0, 245, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 35px rgba(0, 245, 255, 0.15)',
          padding: '24px 34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: 'rgba(0, 245, 255, 0.15)',
              border: '1px solid rgba(0, 245, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ color: C.slate, fontSize: 13, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>
              PEAK VELOCITY
            </div>
            <div style={{ color: C.cyan, fontSize: 50, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
              168 <span style={{ fontSize: 20, color: C.slate }}>WPM</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ color: C.slate, fontSize: 13, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>
            ACCURACY
          </div>
          <div style={{ color: C.emerald, fontSize: 46, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
            99.4%
          </div>
        </div>
      </div>

      {/* Combat Status Badges */}
      <div
        style={{
          position: 'absolute',
          top: 910,
          left: 50,
          right: 50,
          display: 'flex',
          gap: 14,
        }}
      >
        <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 16, padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
          <span style={{ color: '#FBBF24', fontSize: 13, fontWeight: 900, fontFamily: 'monospace' }}>⚔️ 1.5X MULTIPLIER</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 16, padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
          <span style={{ color: '#00F5FF', fontSize: 13, fontWeight: 900, fontFamily: 'monospace' }}>🛡️ AEGIS READY</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 16, padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
          <span style={{ color: '#34D399', fontSize: 13, fontWeight: 900, fontFamily: 'monospace' }}>🎯 35% CRIT RATE</span>
        </div>
      </div>

      {/* BOTTOM ZONE: Dynamic Captions & Virtual Keycap Monitor */}
      <ViralCaption phrases={phrases} y={1040} />
      <VirtualKeypad y={1240} activeKeys={['A', 'S', 'D', 'F', 'J', 'K', 'L']} />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 2: COMBAT GAMEPLAY & LASER BARRAGE (Frames 160 - 380 / 5.3s - 12.6s)
// ============================================================================
const Scene2Combat: React.FC = () => {
  const frame = useCurrentFrame();

  const phrases: CaptionPhrase[] = [
    {
      start: 5,
      end: 45,
      words: [
        { word: 'EVERY', start: 5, end: 20 },
        { word: 'WORD', start: 20, end: 45, highlight: 'cyan' },
      ],
    },
    {
      start: 45,
      end: 95,
      words: [
        { word: 'CHARGES', start: 45, end: 72 },
        { word: 'YOUR', start: 72, end: 95 },
      ],
    },
    {
      start: 95,
      end: 160,
      words: [
        { word: 'LASER', start: 95, end: 125, highlight: 'yellow' },
        { word: 'BARRAGE', start: 125, end: 160, highlight: 'green' },
      ],
    },
    {
      start: 160,
      end: 220,
      words: [
        { word: 'MISTAKES', start: 160, end: 188, highlight: 'red' },
        { word: 'RETALIATE!', start: 188, end: 220, highlight: 'red' },
      ],
    },
  ];

  const liveWpm = Math.round(interpolate(frame, [0, 150], [84, 168], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));

  const isPlayerFiring = frame % 16 < 6;

  const isTypoShaking = frame >= 160 && frame <= 205;
  const shakeX = isTypoShaking ? Math.sin(frame * 2.0) * 14 : 0;
  const shakeY = isTypoShaking ? Math.cos(frame * 2.2) * 12 : 0;

  return (
    <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
      <LivingBackground accentColor={C.cyan} gridSpeed={2.2} />

      {/* TOP ZONE: Speedometer Dial & Combo Streak Pill */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 50,
          right: 50,
          display: 'flex',
          gap: 20,
        }}
      >
        {/* Tachometer Card */}
        <div
          style={{
            flex: 1,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(20px)',
            borderRadius: 28,
            border: '2px solid rgba(0, 245, 255, 0.4)',
            padding: '18px 28px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 245, 255, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: C.slate, fontFamily: 'monospace', fontWeight: 800, fontSize: 13, letterSpacing: 2 }}>
              SPEEDOMETER
            </span>
            <span style={{ color: '#22C55E', fontWeight: 900, fontSize: 12, background: 'rgba(34, 197, 94, 0.2)', padding: '3px 8px', borderRadius: 6 }}>
              NITRO ACTIVE ⚡
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 62, fontWeight: 900, fontFamily: 'monospace', color: C.cyan, textShadow: '0 0 20px #00F5FF' }}>
              {liveWpm}
            </span>
            <span style={{ fontSize: 20, color: C.slate, fontWeight: 700 }}>WPM</span>
          </div>
        </div>

        {/* Combo Multiplier Card */}
        <div
          style={{
            width: 320,
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(168, 85, 247, 0.35))',
            backdropFilter: 'blur(20px)',
            borderRadius: 28,
            border: '2px solid rgba(236, 72, 153, 0.5)',
            padding: '18px 24px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), 0 0 35px rgba(236, 72, 153, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: '#F472B6', fontFamily: 'monospace', fontWeight: 900, fontSize: 13, letterSpacing: 2 }}>
            STREAK MULTIPLIER
          </div>
          <div style={{ color: '#FFFFFF', fontSize: 44, fontWeight: 900, textShadow: '0 0 20px #EC4899', marginTop: 2 }}>
            2.0x BOOST 🔥
          </div>
        </div>
      </div>

      {/* CENTER ZONE: REAL-TIME TYPING ARENA COMBAT BOX */}
      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 50,
          right: 50,
          background: 'rgba(11, 17, 32, 0.95)',
          backdropFilter: 'blur(25px)',
          borderRadius: 36,
          border: isTypoShaking ? '3px solid #EF4444' : '2px solid rgba(0, 245, 255, 0.45)',
          boxShadow: isTypoShaking ? '0 0 60px rgba(239, 68, 68, 0.6)' : '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 245, 255, 0.2)',
          padding: 36,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Terminal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#EF4444' }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#F59E0B' }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#10B981' }} />
            <span style={{ color: C.slate, fontFamily: 'monospace', fontWeight: 700, fontSize: 14, marginLeft: 8 }}>
              syntax_laser_barrage.py
            </span>
          </div>
          <span style={{ color: C.cyan, fontFamily: 'monospace', fontWeight: 900, fontSize: 13, background: 'rgba(0, 245, 255, 0.15)', padding: '4px 12px', borderRadius: 8 }}>
            COMBAT ARENA ACTIVE
          </span>
        </div>

        {/* Real Live Typing Flow Words */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 36,
            lineHeight: 1.6,
            fontWeight: 800,
            color: '#F8FAFC',
          }}
        >
          <span style={{ color: '#10B981', textShadow: '0 0 15px rgba(16, 185, 129, 0.6)' }}>
            overclocking neural pathways
          </span>{' '}
          <span style={{ color: C.cyan, borderBottom: '3px solid #00F5FF', paddingBottom: 2, position: 'relative' }}>
            precision velocity
            <span
              style={{
                position: 'absolute',
                right: -6,
                top: 0,
                bottom: 0,
                width: 4,
                backgroundColor: C.cyan,
                boxShadow: '0 0 10px #00F5FF',
              }}
            />
          </span>{' '}
          <span style={{ color: '#475569' }}>
            mastery unlocks legendary status across all dimensions
          </span>
        </div>

        {/* Laser Barrage Projectile shooting upwards */}
        {isPlayerFiring && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 280,
              width: 14,
              height: 400,
              background: 'linear-gradient(0deg, transparent, #00F5FF, #FFFFFF)',
              boxShadow: '0 0 30px #00F5FF, 0 0 50px #38BDF8',
              borderRadius: 8,
            }}
          />
        )}

        {/* Shield Absorb Pulse when typo occurs */}
        {isTypoShaking && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, transparent 80%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                padding: '16px 36px',
                borderRadius: 20,
                background: 'rgba(239, 68, 68, 0.9)',
                color: '#FFFFFF',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 900,
                fontSize: 26,
                boxShadow: '0 0 40px #EF4444',
              }}
            >
              🛡️ AEGIS SHIELD ABSORBED RETALIATION!
            </div>
          </div>
        )}
      </div>

      {/* DUAL RACING LANES (Player vs Ghost Rival) */}
      <div
        style={{
          position: 'absolute',
          top: 720,
          left: 50,
          right: 50,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          borderRadius: 28,
          border: '1px solid rgba(255, 255, 255, 0.14)',
          padding: '20px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Player Lane */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ width: 100, color: C.cyan, fontWeight: 900, fontFamily: 'monospace', fontSize: 16 }}>
            🏎️ YOU
          </span>
          <div style={{ flex: 1, height: 16, background: 'rgba(0,0,0,0.6)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, frame * 0.48)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0284C7, #00F5FF)',
                boxShadow: '0 0 15px #00F5FF',
                borderRadius: 999,
              }}
            />
          </div>
          <span style={{ color: C.cyan, fontWeight: 900, fontFamily: 'monospace', fontSize: 16 }}>
            +24 WPM ⚡
          </span>
        </div>

        {/* Ghost Rival Lane */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ width: 100, color: '#C084FC', fontWeight: 900, fontFamily: 'monospace', fontSize: 16 }}>
            👻 GHOST
          </span>
          <div style={{ flex: 1, height: 16, background: 'rgba(0,0,0,0.6)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(84, frame * 0.38)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #7E22CE, #C084FC)',
                borderRadius: 999,
              }}
            />
          </div>
          <span style={{ color: '#C084FC', fontWeight: 800, fontFamily: 'monospace', fontSize: 15 }}>
            130 WPM
          </span>
        </div>
      </div>

      {/* Real-time telemetry badges */}
      <div
        style={{
          position: 'absolute',
          top: 910,
          left: 50,
          right: 50,
          display: 'flex',
          gap: 14,
        }}
      >
        <div style={{ flex: 1, background: 'rgba(0, 245, 255, 0.12)', borderRadius: 16, padding: '12px 14px', border: '1px solid rgba(0, 245, 255, 0.3)', textAlign: 'center' }}>
          <span style={{ color: '#00F5FF', fontSize: 14, fontWeight: 900, fontFamily: 'monospace' }}>⚡ COMBO 34X</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(16, 185, 129, 0.12)', borderRadius: 16, padding: '12px 14px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
          <span style={{ color: '#10B981', fontSize: 14, fontWeight: 900, fontFamily: 'monospace' }}>🎯 ACCURACY 99.4%</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.12)', borderRadius: 16, padding: '12px 14px', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
          <span style={{ color: '#FBBF24', fontSize: 14, fontWeight: 900, fontFamily: 'monospace' }}>💎 +650 XP</span>
        </div>
      </div>

      {/* BOTTOM ZONE: Captions & Actuating Keyboard */}
      <ViralCaption phrases={phrases} y={1040} />
      <VirtualKeypad y={1240} activeKeys={['S', 'Y', 'N', 'T', 'A', 'X']} />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 3: SOUNDBOARD & 3.0X HYPERDRIVE (Frames 380 - 640 / 12.6s - 21.3s)
// ============================================================================
const Scene3Hyperdrive: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phrases: CaptionPhrase[] = [
    {
      start: 5,
      end: 55,
      words: [
        { word: 'REAL', start: 5, end: 25 },
        { word: 'MECHANICAL', start: 25, end: 55, highlight: 'cyan' },
      ],
    },
    {
      start: 55,
      end: 125,
      words: [
        { word: 'SWITCH', start: 55, end: 85 },
        { word: 'ACOUSTICS', start: 85, end: 125, highlight: 'yellow' },
      ],
    },
    {
      start: 125,
      end: 195,
      words: [
        { word: 'HIT', start: 125, end: 145 },
        { word: '50', start: 145, end: 170, highlight: 'pink' },
        { word: 'STREAK', start: 170, end: 195, highlight: 'yellow' },
      ],
    },
    {
      start: 195,
      end: 260,
      words: [
        { word: '3.0X', start: 195, end: 225, highlight: 'pink' },
        { word: 'HYPERDRIVE!', start: 225, end: 260, highlight: 'pink' },
      ],
    },
  ];

  const hyperdriveActive = frame >= 140;
  const hyperdriveScale = spring({
    frame: frame - 140,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 220 },
  });

  const currentStreak = Math.min(50, Math.floor(interpolate(frame, [0, 140], [28, 50])));

  return (
    <AbsoluteFill>
      <LivingBackground accentColor={hyperdriveActive ? C.pink : C.purple} gridSpeed={2.8} />

      {/* TOP ZONE: ACOUSTIC SWITCH SYNTHESIZER DRAWER */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 50,
          right: 50,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(25px)',
          borderRadius: 36,
          border: '2px solid rgba(168, 85, 247, 0.45)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(168, 85, 247, 0.25)',
          padding: '28px 36px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎛️</span>
            <span style={{ color: '#FFFFFF', fontFamily: 'system-ui', fontWeight: 900, fontSize: 20 }}>
              Mechanical Switch Synthesizer
            </span>
          </div>
          <span style={{ color: C.yellow, fontFamily: 'monospace', fontWeight: 900, fontSize: 13, background: 'rgba(245, 158, 11, 0.2)', padding: '4px 12px', borderRadius: 8 }}>
            WEB AUDIO API ENGINE
          </span>
        </div>

        {/* 3 Authentic Switch Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {/* Cherry Blue */}
          <div
            style={{
              background: 'rgba(0, 245, 255, 0.15)',
              border: '2px solid #00F5FF',
              boxShadow: '0 0 25px rgba(0, 245, 255, 0.35)',
              borderRadius: 20,
              padding: '16px 18px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32 }}>🔵</div>
            <div style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 17, marginTop: 4 }}>Cherry Blue</div>
            <div style={{ color: C.cyan, fontSize: 12, fontWeight: 800, fontFamily: 'monospace' }}>50g CLICKY</div>
          </div>

          {/* Cherry Brown */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 20,
              padding: '16px 18px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32 }}>🟤</div>
            <div style={{ color: '#E2E8F0', fontWeight: 900, fontSize: 17, marginTop: 4 }}>Cherry Brown</div>
            <div style={{ color: '#FBBF24', fontSize: 12, fontWeight: 800, fontFamily: 'monospace' }}>45g TACTILE</div>
          </div>

          {/* Cherry Red */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 20,
              padding: '16px 18px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32 }}>🔴</div>
            <div style={{ color: '#E2E8F0', fontWeight: 900, fontSize: 17, marginTop: 4 }}>Cherry Red</div>
            <div style={{ color: '#F87171', fontSize: 12, fontWeight: 800, fontFamily: 'monospace' }}>45g LINEAR</div>
          </div>
        </div>

        {/* Audio Visualizer Spectrum Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, height: 50, marginTop: 24 }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const barH = 10 + ((Math.sin(frame * 0.4 + i * 0.5) + 1) / 2) * 38;
            return (
              <div
                key={i}
                style={{
                  width: 8,
                  height: barH,
                  borderRadius: 999,
                  background: 'linear-gradient(180deg, #00F5FF, #A855F7)',
                  boxShadow: '0 0 10px rgba(0, 245, 255, 0.5)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* CLIMAX: 3.0X HYPERDRIVE FRENZY OR STREAK CHARGER */}
      {hyperdriveActive ? (
        <div
          style={{
            position: 'absolute',
            top: 570,
            left: 50,
            right: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            scale: `${hyperdriveScale}`,
            zIndex: 60,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #EC4899, #8B5CF6, #06B6D4)',
              padding: '32px 48px',
              borderRadius: 36,
              boxShadow: '0 20px 60px rgba(236, 72, 153, 0.7), 0 0 80px rgba(139, 92, 246, 0.8)',
              border: '3px solid #FFFFFF',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <div style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 900, letterSpacing: 4, fontFamily: 'monospace' }}>
              🔥 50 STREAK UNLOCKED 🔥
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 62, fontWeight: 900, letterSpacing: -1, textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
              3.0x HYPERDRIVE!
            </div>
            <div style={{ color: '#FEE2E2', fontSize: 18, fontWeight: 800, marginTop: 10 }}>
              SPEED ACCELERATION MULTIPLIER ACTIVE
            </div>
          </div>
        </div>
      ) : (
        /* Streak Pre-Charge Meter */
        <div
          style={{
            position: 'absolute',
            top: 590,
            left: 50,
            right: 50,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(20px)',
            borderRadius: 32,
            border: '2px solid rgba(236, 72, 153, 0.4)',
            padding: '28px 36px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ color: '#F472B6', fontFamily: 'monospace', fontWeight: 900, fontSize: 16, letterSpacing: 2 }}>
              ⚡ HYPERDRIVE OVERDRIVE CHARGER
            </span>
            <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 18, fontFamily: 'monospace' }}>
              {currentStreak} / 50 STREAK
            </span>
          </div>
          <div style={{ width: '100%', height: 22, background: 'rgba(0,0,0,0.6)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${(currentStreak / 50) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #8B5CF6, #EC4899)',
                boxShadow: '0 0 20px #EC4899',
                borderRadius: 999,
              }}
            />
          </div>
          <div style={{ color: C.slate, fontSize: 15, fontWeight: 700, marginTop: 14 }}>
            Zero errors unlocks full acoustic & visual hyperdrive frenzy
          </div>
        </div>
      )}

      {/* Acoustic Spectrum Status Chips */}
      <div
        style={{
          position: 'absolute',
          top: 910,
          left: 50,
          right: 50,
          display: 'flex',
          gap: 14,
        }}
      >
        <div style={{ flex: 1, background: 'rgba(0, 245, 255, 0.12)', borderRadius: 16, padding: '12px 14px', border: '1px solid rgba(0, 245, 255, 0.3)', textAlign: 'center' }}>
          <span style={{ color: '#00F5FF', fontSize: 14, fontWeight: 900, fontFamily: 'monospace' }}>🎵 DUAL OSCILLATORS</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(168, 85, 247, 0.12)', borderRadius: 16, padding: '12px 14px', border: '1px solid rgba(168, 85, 247, 0.3)', textAlign: 'center' }}>
          <span style={{ color: '#C084FC', fontSize: 14, fontWeight: 900, fontFamily: 'monospace' }}>🔊 ZERO-LATENCY STEREO</span>
        </div>
      </div>

      {/* BOTTOM ZONE: Captions & Keypad */}
      <ViralCaption phrases={phrases} y={1040} />
      <VirtualKeypad y={1240} activeKeys={['C', 'H', 'E', 'R', 'R', 'Y']} />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 4: 200-LEVEL CAMPAIGN & MULTI-MODE CHALLENGE (Frames 640 - 770 / 21.3s - 25.6s)
// ============================================================================
const Scene4Campaign: React.FC = () => {
  const frame = useCurrentFrame();

  const phrases: CaptionPhrase[] = [
    {
      start: 5,
      end: 58,
      words: [
        { word: '200-STAGE', start: 5, end: 32, highlight: 'yellow' },
        { word: 'CAMPAIGN', start: 32, end: 58, highlight: 'cyan' },
      ],
    },
    {
      start: 58,
      end: 98,
      words: [
        { word: 'DAILY', start: 58, end: 78 },
        { word: 'GAUNTLETS', start: 78, end: 98, highlight: 'green' },
      ],
    },
    {
      start: 98,
      end: 130,
      words: [
        { word: 'ONLINE', start: 98, end: 114, highlight: 'cyan' },
        { word: 'NETPLAY!', start: 114, end: 130, highlight: 'yellow' },
      ],
    },
  ];

  return (
    <AbsoluteFill>
      <LivingBackground accentColor={C.emerald} gridSpeed={1.5} />

      {/* TOP ZONE: 200-LEVEL MAP SHOWCASE */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 50,
          right: 50,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(25px)',
          borderRadius: 36,
          border: '2px solid rgba(16, 185, 129, 0.45)',
          padding: '28px 36px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>🗺️</span>
            <span style={{ color: '#FFFFFF', fontFamily: 'system-ui', fontWeight: 900, fontSize: 22 }}>
              200-Stage Cyber Adventure Map
            </span>
          </div>
          <span style={{ color: C.emerald, fontWeight: 900, fontSize: 14, fontFamily: 'monospace', background: 'rgba(16, 185, 129, 0.2)', padding: '4px 14px', borderRadius: 8 }}>
            5 CHAPTERS
          </span>
        </div>

        {/* Milestone Node Track */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', margin: '24px 20px' }}>
          <div style={{ position: 'absolute', left: 30, right: 30, height: 6, background: 'linear-gradient(90deg, #10B981, #06B6D4, #EF4444)', borderRadius: 999 }} />

          {/* Node 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
            <div style={{ width: 60, height: 60, borderRadius: 999, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 0 20px #10B981' }}>
              ✓
            </div>
            <span style={{ color: '#FFFFFF', fontWeight: 800, marginTop: 8, fontSize: 13 }}>STAGE 1</span>
          </div>

          {/* Node 20 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
            <div style={{ width: 60, height: 60, borderRadius: 999, background: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#FFFFFF', fontWeight: 900, boxShadow: '0 0 20px #0284C7' }}>
              20
            </div>
            <span style={{ color: '#FFFFFF', fontWeight: 800, marginTop: 8, fontSize: 13 }}>STAGE 20</span>
          </div>

          {/* Node 40 (Boss) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
            <div style={{ width: 66, height: 66, borderRadius: 999, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 0 30px #EF4444', border: '3px solid #FFFFFF' }}>
              💀
            </div>
            <span style={{ color: '#EF4444', fontWeight: 900, marginTop: 8, fontSize: 14 }}>BOSS BATTLE</span>
          </div>
        </div>
      </div>

      {/* CENTER ZONE: DAILY CHALLENGE 3-TIER MODAL */}
      <div
        style={{
          position: 'absolute',
          top: 450,
          left: 50,
          right: 50,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(25px)',
          borderRadius: 36,
          border: '2px solid rgba(245, 158, 11, 0.45)',
          padding: '26px 36px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(245, 158, 11, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🏆</span>
            <span style={{ color: '#FFFFFF', fontFamily: 'system-ui', fontWeight: 900, fontSize: 20 }}>
              Daily Stamina Gauntlet
            </span>
          </div>
          <span style={{ color: '#FBBF24', fontWeight: 900, fontSize: 14, fontFamily: 'monospace' }}>
            +2,500 💎 EMERALD REWARD
          </span>
        </div>

        {/* 3 Modes Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 14, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 22 }}>📝</div>
            <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 15, marginTop: 4 }}>Words</div>
            <div style={{ color: C.slate, fontSize: 12 }}>25 VOCAB</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 14, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 22 }}>💬</div>
            <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 15, marginTop: 4 }}>Sentences</div>
            <div style={{ color: C.slate, fontSize: 12 }}>3 PROSE</div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.2)', borderRadius: 18, padding: 14, textAlign: 'center', border: '2px solid #10B981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
            <div style={{ fontSize: 22 }}>📖</div>
            <div style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 15, marginTop: 4 }}>Paragraphs</div>
            <div style={{ color: '#34D399', fontSize: 12, fontWeight: 800 }}>TIER 3 PASS</div>
          </div>
        </div>
      </div>

      {/* LOWER CENTER ZONE: GLOBAL TOURNAMENTS CARD */}
      <div
        style={{
          position: 'absolute',
          top: 730,
          left: 50,
          right: 50,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          borderRadius: 28,
          border: '1px solid rgba(0, 245, 255, 0.35)',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 34 }}>🌐</span>
          <div>
            <div style={{ color: C.cyan, fontWeight: 900, fontFamily: 'monospace', fontSize: 16 }}>
              MULTIPLAYER NETPLAY & TOURNAMENTS
            </div>
            <div style={{ color: C.slate, fontSize: 13, fontWeight: 600 }}>
              Live WebSocket PvP racing with rank badges & anti-cheat
            </div>
          </div>
        </div>
        <span style={{ color: '#10B981', fontWeight: 900, fontSize: 14, fontFamily: 'monospace', background: 'rgba(16, 185, 129, 0.15)', padding: '6px 14px', borderRadius: 10 }}>
          ONLINE
        </span>
      </div>

      {/* Leaderboard sample */}
      <div
        style={{
          position: 'absolute',
          top: 910,
          left: 50,
          right: 50,
          display: 'flex',
          gap: 14,
        }}
      >
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#FACC15', fontWeight: 900 }}>🥇 #1 SpeedDemon</span>
          <span style={{ color: C.cyan, fontFamily: 'monospace', fontWeight: 900 }}>184 WPM</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#E2E8F0', fontWeight: 900 }}>🥈 #2 GhostTyper</span>
          <span style={{ color: C.cyan, fontFamily: 'monospace', fontWeight: 900 }}>162 WPM</span>
        </div>
      </div>

      {/* BOTTOM ZONE: Captions & Keypad */}
      <ViralCaption phrases={phrases} y={1040} />
      <VirtualKeypad y={1240} activeKeys={['P', 'A', 'S', 'S', 'E', 'D']} />
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 5: OUTRO & THE VIRAL CHALLENGE LOOP (Frames 770 - 900 / 25.6s - 30.0s)
// ============================================================================
const Scene5Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phrases: CaptionPhrase[] = [
    {
      start: 5,
      end: 45,
      words: [
        { word: 'CAN', start: 5, end: 20 },
        { word: 'YOU', start: 20, end: 32 },
        { word: 'BEAT', start: 32, end: 45, highlight: 'green' },
      ],
    },
    {
      start: 45,
      end: 90,
      words: [
        { word: '100', start: 45, end: 68, highlight: 'pink' },
        { word: 'WPM?', start: 68, end: 90, highlight: 'cyan' },
      ],
    },
    {
      start: 90,
      end: 130,
      words: [
        { word: 'PLAY', start: 90, end: 110, highlight: 'green' },
        { word: 'FREE NOW!', start: 110, end: 130, highlight: 'yellow' },
      ],
    },
  ];

  const cardScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 190 },
  });

  const cursorProgress = interpolate(frame, [45, 85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cursorX = 350 + cursorProgress * 190;
  const cursorY = 850 - cursorProgress * 260;
  const isClicked = frame >= 85;

  return (
    <AbsoluteFill>
      <LivingBackground accentColor={C.cyan} gridSpeed={1.0} />

      {/* HERO SHOWCASE CARD */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 50,
          right: 50,
          background: 'linear-gradient(180deg, rgba(20, 30, 50, 0.95), rgba(10, 15, 30, 0.98))',
          backdropFilter: 'blur(30px)',
          borderRadius: 44,
          border: '3px solid rgba(0, 245, 255, 0.55)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(0, 245, 255, 0.3)',
          padding: '44px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          scale: `${cardScale}`,
        }}
      >
        {/* App Logo Emblem */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 34,
            background: 'linear-gradient(135deg, #00F5FF, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            boxShadow: '0 0 50px rgba(0, 245, 255, 0.8)',
            marginBottom: 18,
          }}
        >
          ⌨️
        </div>

        {/* Release Version Badge */}
        <div
          style={{
            background: 'rgba(0, 245, 255, 0.18)',
            border: '1px solid rgba(0, 245, 255, 0.5)',
            padding: '6px 20px',
            borderRadius: 999,
            color: C.cyan,
            fontFamily: 'monospace',
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: 3,
            marginBottom: 16,
          }}
        >
          ATI v3.1.0 • WINDOWS DESKTOP
        </div>

        {/* Main Title */}
        <h1
          style={{
            color: '#FFFFFF',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 46,
            fontWeight: 900,
            letterSpacing: -1,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          ADVANCED TYPING INSTRUCTOR
        </h1>

        <p
          style={{
            color: '#94A3B8',
            fontSize: 20,
            fontWeight: 600,
            marginTop: 14,
            marginBottom: 28,
            lineHeight: 1.4,
          }}
        >
          Offline-capable desktop engine with boss fights, Cherry MX sound synthesis, and real-time racing.
        </p>

        {/* Feature Badges */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, width: '100%' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: C.yellow, fontWeight: 900, fontSize: 14 }}>🏆 200 STAGES</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: C.pink, fontWeight: 900, fontSize: 14 }}>🔥 3.0X HYPER</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: C.cyan, fontWeight: 900, fontSize: 14 }}>🎧 CHERRY MX</div>
          </div>
        </div>

        {/* Primary CTA Button with Shockwave Ripple on Click */}
        <div
          style={{
            width: '100%',
            padding: '24px 32px',
            borderRadius: 24,
            background: isClicked
              ? 'linear-gradient(90deg, #10B981, #06B6D4)'
              : 'linear-gradient(90deg, #00F5FF, #0284C7)',
            color: '#030712',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 900,
            fontSize: 26,
            letterSpacing: 1,
            boxShadow: isClicked
              ? '0 0 50px #10B981'
              : '0 0 40px rgba(0, 245, 255, 0.7)',
            transform: isClicked ? 'scale(0.96)' : 'scale(1)',
            transition: 'all 0.1s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
          }}
        >
          <span>🚀</span> PLAY FREE ON WINDOWS
        </div>
      </div>

      {/* Animated Vector Cursor */}
      <div
        style={{
          position: 'absolute',
          left: cursorX,
          top: cursorY,
          pointerEvents: 'none',
          zIndex: 80,
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
        }}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
            fill="#FFFFFF"
            stroke="#030712"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* BOTTOM ZONE: Final Challenge Captions */}
      <ViralCaption phrases={phrases} y={1040} />
      <VirtualKeypad y={1240} activeKeys={['W', 'I', 'N', 'D', 'O', 'W', 'S']} />
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN ROOT COMPOSITION: SEQUENCED 30-SECOND MASTERPIECE (900 FRAMES)
// ============================================================================
export const ShortsComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      {/* Scene 1: The Impossible Hook (0 - 160 frames / 0 - 5.3s) */}
      <Sequence from={0} durationInFrames={160}>
        <Scene1Hook />
      </Sequence>

      {/* Scene 2: Gameplay Combat & Lasers (160 - 380 frames / 5.3s - 12.6s) */}
      <Sequence from={160} durationInFrames={220}>
        <Scene2Combat />
      </Sequence>

      {/* Scene 3: Acoustic Switch Soundboard & 3.0x Hyperdrive (380 - 640 frames / 12.6s - 21.3s) */}
      <Sequence from={380} durationInFrames={260}>
        <Scene3Hyperdrive />
      </Sequence>

      {/* Scene 4: 200-Level Campaign & Daily Challenge (640 - 770 frames / 21.3s - 25.6s) */}
      <Sequence from={640} durationInFrames={130}>
        <Scene4Campaign />
      </Sequence>

      {/* Scene 5: Outro & Viral Challenge Loop (770 - 900 frames / 25.6s - 30.0s) */}
      <Sequence from={770} durationInFrames={130}>
        <Scene5Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
