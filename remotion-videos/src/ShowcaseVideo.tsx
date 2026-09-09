import React from 'react';
import { 
  AbsoluteFill, 
  Sequence, 
  interpolate, 
  spring, 
  useCurrentFrame, 
  useVideoConfig 
} from 'remotion';

// Theme Colors
const C = {
  bg: '#030712',
  cyan: '#00f5ff',
  purple: '#a855f7',
  emerald: '#10b981',
  amber: '#ffd54f',
  blue: '#3b82f6',
  cardBg: 'rgba(15, 23, 42, 0.8)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
};

// Scene 1: Architecture Evolution (0 - 150 frames / 0 - 5s)
const ArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 12 } });
  const cardScale = spring({ frame: frame - 30, fps, config: { damping: 14 } });

  const techBadges = [
    { name: 'React 18 + TSX', color: '#61dafb' },
    { name: 'TailwindCSS v3', color: '#38bdf8' },
    { name: 'Framer Motion', color: '#f43f5e' },
    { name: 'Web Audio Synth', color: '#fbbf24' },
    { name: 'WebSocket Net', color: '#34d399' },
    { name: 'SQLite Storage', color: '#a78bfa' },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        padding: '60px 100px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.1) 0%, transparent 70%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 50px 50px, 50px 50px',
        }}
      />

      <div style={{ textAlign: 'center', scale: `${titleIn}` }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 24px',
            borderRadius: 999,
            backgroundColor: 'rgba(0, 245, 255, 0.15)',
            border: `2px solid ${C.cyan}`,
            color: C.cyan,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 3,
            marginBottom: 20,
          }}
        >
          MAJOR RELEASE OVERHAUL
        </div>

        <h1
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          FROM LEGACY VANILLA JS TO
        </h1>
        <h2
          style={{
            fontSize: 68,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #00f5ff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginTop: 8,
          }}
        >
          HIGH-FIDELITY REACT 18 + TYPESCRIPT
        </h2>

        {/* Tech Stack Badges */}
        {frame >= 30 && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              marginTop: 45,
              flexWrap: 'wrap',
              scale: `${cardScale}`,
            }}
          >
            {techBadges.map((b) => (
              <div
                key={b.name}
                style={{
                  padding: '12px 24px',
                  borderRadius: 16,
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: `2px solid ${b.color}`,
                  color: '#ffffff',
                  fontSize: 20,
                  fontWeight: 800,
                  boxShadow: `0 0 20px ${b.color}40`,
                }}
              >
                {b.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Top HUD & Rank Progression (150 - 300 frames / 5 - 10s)
const HudScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hudSlide = spring({ frame, fps, config: { damping: 14 } });

  const ranks = [
    { title: 'Rubber Dome Trainee', tier: 'Tier I', color: '#a1887f' },
    { title: 'Membrane Typist', tier: 'Tier II', color: '#78909c' },
    { title: 'Mechanical Apprentice', tier: 'Tier III', color: '#64b5f6' },
    { title: 'Cherry MX Adept', tier: 'Tier IV', color: '#ef5350' },
    { title: 'Hall Effect Grandmaster', tier: 'Tier X', color: '#ffd54f' },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        padding: '60px 100px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ color: C.cyan, fontSize: 18, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase' }}>
          CYBER-MECHANICAL GLASSMORPHISM
        </div>
        <h2 style={{ fontSize: 52, fontWeight: 900, color: '#ffffff', marginTop: 6 }}>
          10-Tier Rank Progression & Audio Engine
        </h2>
      </div>

      {/* Simulated Top HUD */}
      <div
        style={{
          width: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '2px solid rgba(0, 245, 255, 0.3)',
          borderRadius: 24,
          padding: '24px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 0 40px rgba(0, 245, 255, 0.2)',
          scale: `${hudSlide}`,
        }}
      >
        {/* Profile / Rank Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: 'rgba(0, 245, 255, 0.1)',
              border: `2px solid ${C.cyan}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            👑
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#ffffff' }}>Champion Typer</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.cyan, backgroundColor: 'rgba(0, 245, 255, 0.15)', padding: '2px 8px', borderRadius: 6 }}>
                LVL 42
              </span>
            </div>
            <div style={{ fontSize: 16, color: C.amber, fontWeight: 800, marginTop: 4 }}>
              Hall Effect Grandmaster • Tier X
            </div>
          </div>
        </div>

        {/* Currency & Streak */}
        <div style={{ display: 'flex', gap: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>💎</span>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>EMERALDS</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.emerald }}>3,450</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🔥</span>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>STREAK</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.amber }}>112</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🔊</span>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>SWITCH SOUND</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.blue }}>Cherry Blue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ranks showcase cards */}
      <div style={{ display: 'flex', gap: 16, width: '100%', marginTop: 35 }}>
        {ranks.map((r, i) => (
          <div
            key={r.title}
            style={{
              flex: 1,
              backgroundColor: 'rgba(11, 15, 25, 0.9)',
              border: `2px solid ${r.color}50`,
              borderRadius: 20,
              padding: 20,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{r.tier}</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', marginTop: 6 }}>{r.title}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: High Precision Typing Arena & Speedometer (300 - 450 frames / 10 - 15s)
const ArenaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wpm = Math.min(156, Math.round(interpolate(frame, [0, 120], [50, 156])));
  const typedCount = Math.min(65, Math.floor(interpolate(frame, [0, 120], [0, 65])));

  const textSample = "Touch typing velocity relies on instant tactile feedback and deep muscle memory.";
  const typed = textSample.slice(0, typedCount);
  const untyped = textSample.slice(typedCount);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        padding: '50px 100px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: 40, width: '100%', alignItems: 'center' }}>
        
        {/* Typing Card (Left 65%) */}
        <div
          style={{
            flex: 2,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '2px solid rgba(0, 245, 255, 0.4)',
            borderRadius: 30,
            padding: 40,
            boxShadow: '0 0 50px rgba(0, 245, 255, 0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 16, fontWeight: 800, color: '#94a3b8' }}>
            <span>ARENA: WORDS MODE</span>
            <span style={{ color: C.emerald }}>ACCURACY: 99.2%</span>
          </div>

          <div style={{ fontSize: 36, fontFamily: 'monospace', lineHeight: 1.6, minHeight: 120 }}>
            <span style={{ color: C.cyan, fontWeight: 800 }}>{typed}</span>
            <span
              style={{
                display: 'inline-block',
                width: 4,
                height: 40,
                backgroundColor: C.cyan,
                verticalAlign: 'middle',
                margin: '0 4px',
                boxShadow: '0 0 16px #00f5ff',
              }}
            />
            <span style={{ color: '#475569' }}>{untyped}</span>
          </div>

          {/* Actuating Virtual Keyboard */}
          <div style={{ marginTop: 30, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 12, letterSpacing: 2 }}>
              ACTUATING KEYBOARD VISUALIZER
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key, idx) => {
                const isActuated = idx === (Math.floor(frame / 8) % 10);
                return (
                  <div
                    key={key}
                    style={{
                      flex: 1,
                      height: 50,
                      borderRadius: 10,
                      backgroundColor: isActuated ? 'rgba(0, 245, 255, 0.25)' : 'rgba(30, 41, 59, 0.8)',
                      border: isActuated ? `2px solid ${C.cyan}` : '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActuated ? '#ffffff' : '#94a3b8',
                      fontWeight: 900,
                      boxShadow: isActuated ? '0 0 20px #00f5ff' : 'none',
                    }}
                  >
                    {key}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Speedometer Card (Right 35%) */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: `2px solid ${C.cyan}`,
            borderRadius: 30,
            padding: '40px 30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 0 45px rgba(0, 245, 255, 0.25)',
          }}
        >
          <div style={{ fontSize: 18, letterSpacing: 3, color: C.cyan, fontWeight: 800 }}>LIVE SPEEDOMETER</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '20px 0' }}>
            <span style={{ fontSize: 96, fontWeight: 900, fontFamily: 'monospace', color: '#ffffff' }}>
              {wpm}
            </span>
            <span style={{ fontSize: 28, fontWeight: 800, color: C.cyan }}>WPM</span>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: '#94a3b8', fontWeight: 700 }}>
              <span>RAW SPEED:</span>
              <span style={{ color: '#ffffff' }}>{wpm + 8} WPM</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: '#94a3b8', fontWeight: 700 }}>
              <span>ERROR COUNT:</span>
              <span style={{ color: C.emerald }}>0 ERRORS</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: '#94a3b8', fontWeight: 700 }}>
              <span>COMBO STREAK:</span>
              <span style={{ color: C.amber }}>{typedCount}🔥</span>
            </div>
          </div>
        </div>

      </div>
    </AbsoluteFill>
  );
};

// Scene 4: 200-Level Campaign & Boss Battles (450 - 600 frames / 15 - 20s)
const CampaignBossScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bossHp = Math.max(20, Math.round(interpolate(frame, [0, 120], [100, 20])));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        padding: '50px 100px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 35 }}>
        <div style={{ color: '#f87171', fontSize: 18, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' }}>
          200-LEVEL CAMPAIGN & LATENCY BOSSES
        </div>
        <h2 style={{ fontSize: 50, fontWeight: 900, color: '#ffffff', marginTop: 6 }}>
          Level 40/80/120 Milestone Combat Arenas
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 30, width: '100%' }}>
        {/* Boss Card */}
        <div
          style={{
            flex: 1.5,
            backgroundColor: 'rgba(25, 12, 18, 0.9)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 30,
            padding: 35,
            boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 64 }}>👾</span>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#ffffff' }}>THE LATENCY GOLEM</div>
              <div style={{ fontSize: 16, color: '#f87171', fontWeight: 700 }}>Milestone Boss • Level 40</div>
            </div>
          </div>

          {/* Health Bar */}
          <div style={{ marginTop: 25 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#fca5a5', marginBottom: 8 }}>
              <span>BOSS HP</span>
              <span>{bossHp}%</span>
            </div>
            <div style={{ width: '100%', height: 28, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, overflow: 'hidden', padding: 3 }}>
              <div
                style={{
                  width: `${bossHp}%`,
                  height: '100%',
                  borderRadius: 10,
                  background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
                  boxShadow: '0 0 20px #ef4444',
                }}
              />
            </div>
          </div>
        </div>

        {/* 200-Level Chapters Preview */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 30,
            padding: 35,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>5 Massive Chapters</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
            {['1. Home Row Awakening (1-40)', '2. Upper Deck Velocity (41-80)', '3. Punctuation Paradox (81-120)', '4. Symbol & Code Matrix (121-160)', '5. Grandmaster Transcendence (161-200)'].map((ch, idx) => (
              <div key={ch} style={{ fontSize: 15, fontWeight: 700, color: idx === 0 ? C.cyan : '#94a3b8' }}>
                {ch}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Real-Time WebSocket Multiplayer (600 - 750 frames / 20 - 25s)
const MultiplayerShowcaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const racers = [
    { name: 'Champion Typer', avatar: '👑', wpm: 152, rank: 'Grandmaster', progress: Math.min(100, Math.round(interpolate(frame, [0, 120], [25, 100]))), isMe: true },
    { name: 'VelocityKing', avatar: '🏎️', wpm: 134, rank: 'Diamond III', progress: Math.min(85, Math.round(interpolate(frame, [0, 120], [20, 85]))), isMe: false },
    { name: 'NeonRacer', avatar: '⚡', wpm: 118, rank: 'Platinum I', progress: Math.min(70, Math.round(interpolate(frame, [0, 120], [15, 70]))), isMe: false },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        padding: '50px 100px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 35 }}>
        <div style={{ color: C.cyan, fontSize: 18, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' }}>
          SQLITE PERSISTENT PROFILES & LIVE WEBSOCKETS
        </div>
        <h2 style={{ fontSize: 50, fontWeight: 900, color: '#ffffff', marginTop: 6 }}>
          Multiplayer Lobby, Gamer Cards & Live Race Tracks
        </h2>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {racers.map((r) => (
          <div
            key={r.name}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: r.isMe ? `2px solid ${C.cyan}` : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              padding: '20px 30px',
              boxShadow: r.isMe ? '0 0 35px rgba(0, 245, 255, 0.3)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 32 }}>{r.avatar}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff' }}>{r.name}</span>
                    {r.isMe && (
                      <span style={{ fontSize: 12, fontWeight: 800, backgroundColor: 'rgba(0, 245, 255, 0.2)', color: C.cyan, padding: '2px 8px', borderRadius: 4 }}>
                        YOU
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 15, color: C.cyan, fontWeight: 700 }}>{r.rank}</span>
                </div>
              </div>

              <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color: '#ffffff' }}>
                {r.wpm} <span style={{ fontSize: 16, color: '#94a3b8' }}>WPM</span>
              </div>
            </div>

            {/* Race Lane Bar */}
            <div style={{ width: '100%', height: 18, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 9, overflow: 'hidden', padding: 2 }}>
              <div
                style={{
                  width: `${r.progress}%`,
                  height: '100%',
                  borderRadius: 7,
                  backgroundColor: r.isMe ? C.cyan : C.purple,
                  boxShadow: `0 0 15px ${r.isMe ? C.cyan : C.purple}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scene 6: Heatmap & Outro (750 - 900 frames / 25 - 30s)
const HeatmapOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = spring({ frame, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        padding: '60px 100px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 72, scale: `${pulse}`, marginBottom: 15 }}>👑</div>

      <div
        style={{
          display: 'inline-block',
          padding: '10px 28px',
          borderRadius: 999,
          backgroundColor: 'rgba(0, 245, 255, 0.15)',
          border: `2px solid ${C.cyan}`,
          color: C.cyan,
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 4,
          marginBottom: 20,
        }}
      >
        NOW AVAILABLE IN ATI v2.5
      </div>

      <h1 style={{ fontSize: 64, fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
        ADVANCED TYPING INSTRUCTOR
      </h1>
      <h2
        style={{
          fontSize: 68,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #00f5ff, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginTop: 8,
          marginBottom: 40,
        }}
      >
        THE ULTIMATE DESKTOP TYPING ENGINE
      </h2>

      <div
        style={{
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          width: '100%',
          maxWidth: 1100,
        }}
      >
        <div style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
          ⚡ 200 Solo Levels & Bosses
        </div>
        <div style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
          🏎️ WebSocket Multiplayer
        </div>
        <div style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
          🔊 Mechanical Synthesizer
        </div>
        <div style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
          📊 Diagnostic Key Heatmap
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main Showcase Composition Export
export const ShowcaseComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#030712' }}>
      <Sequence from={0} durationInFrames={150} name="Architecture">
        <ArchitectureScene />
      </Sequence>

      <Sequence from={150} durationInFrames={150} name="HudAndRanks">
        <HudScene />
      </Sequence>

      <Sequence from={300} durationInFrames={150} name="TypingArena">
        <ArenaScene />
      </Sequence>

      <Sequence from={450} durationInFrames={150} name="CampaignBoss">
        <CampaignBossScene />
      </Sequence>

      <Sequence from={600} durationInFrames={150} name="Multiplayer">
        <MultiplayerShowcaseScene />
      </Sequence>

      <Sequence from={750} durationInFrames={150} name="Outro">
        <HeatmapOutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
