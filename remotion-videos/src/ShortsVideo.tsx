import React from 'react';
import { 
  AbsoluteFill, 
  Sequence, 
  interpolate, 
  spring, 
  useCurrentFrame, 
  useVideoConfig 
} from 'remotion';

// Color Palette
const COLORS = {
  bg: '#030712',
  cyan: '#00f5ff',
  purple: '#a855f7',
  emerald: '#10b981',
  amber: '#ffd54f',
  red: '#ef4444',
  cardBg: 'rgba(15, 23, 42, 0.75)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
};

// Scene 1: The Hook (0 - 90 frames / 0 - 3s)
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });

  const redCrossScale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 10 },
  });

  const nextTextOpacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Background Cyber Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(0, 245, 255, 0.12) 0%, transparent 60%), linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 60px 60px, 60px 60px',
        }}
      />

      {/* Part 1: Boring typing tutors */}
      {frame < 55 && (
        <div style={{ textAlign: 'center', scale: `${titleScale}` }}>
          <div
            style={{
              fontSize: 34,
              letterSpacing: 6,
              color: '#94a3b8',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Tired Of Boring
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 900,
              color: '#f8fafc',
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            TYPING TUTORS?
          </div>

          {frame >= 25 && (
            <div
              style={{
                marginTop: 40,
                scale: `${redCrossScale}`,
                display: 'inline-block',
                padding: '16px 40px',
                borderRadius: 999,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: `3px solid ${COLORS.red}`,
                color: COLORS.red,
                fontSize: 36,
                fontWeight: 900,
                letterSpacing: 3,
                boxShadow: '0 0 40px rgba(239, 68, 68, 0.5)',
              }}
            >
              ❌ SLOW & OUTDATED
            </div>
          )}
        </div>
      )}

      {/* Part 2: Enter ATI 2.5 */}
      {frame >= 50 && (
        <div
          style={{
            textAlign: 'center',
            opacity: nextTextOpacity,
            scale: `${spring({ frame: frame - 50, fps, config: { damping: 12 } })}`,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 30px',
              borderRadius: 999,
              backgroundColor: 'rgba(0, 245, 255, 0.15)',
              border: `2px solid ${COLORS.cyan}`,
              color: COLORS.cyan,
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 4,
              marginBottom: 30,
              boxShadow: '0 0 30px rgba(0, 245, 255, 0.4)',
            }}
          >
            ⚡ NEXT-GEN ENGINE
          </div>

          <div
            style={{
              fontSize: 78,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              textShadow: '0 0 40px rgba(0, 245, 255, 0.5)',
            }}
          >
            ADVANCED TYPING
          </div>
          <div
            style={{
              fontSize: 82,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #00f5ff, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 2,
              marginTop: 10,
            }}
          >
            INSTRUCTOR v2.5
          </div>

          <div
            style={{
              marginTop: 35,
              fontSize: 32,
              color: '#94a3b8',
              fontWeight: 600,
            }}
          >
            Tactile Switches • Live Races • Boss Fights
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Scene 2: Live Typing Arena & Speedometer (90 - 210 frames / 3 - 7s)
const TypingActionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wpm = Math.min(168, Math.round(interpolate(frame, [0, 110], [42, 168], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })));

  const typedChars = Math.min(48, Math.floor(interpolate(frame, [0, 110], [0, 48])));
  const sampleSentence = "Velocity and precision merge into pure keyboard mastery";
  const typedPart = sampleSentence.slice(0, typedChars);
  const untypedPart = sampleSentence.slice(typedChars);

  // Keyboard active key
  const activeKeys = ['C', 'H', 'A', 'M', 'P', 'I', 'O', 'N'];
  const currentKey = activeKeys[Math.floor(frame / 6) % activeKeys.length];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        padding: 50,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: 999,
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.15) 0%, transparent 70%)',
          top: '25%',
        }}
      />

      {/* Speedometer Gauge Card */}
      <div
        style={{
          width: '100%',
          backgroundColor: COLORS.cardBg,
          border: `2px solid ${COLORS.cyan}`,
          borderRadius: 40,
          padding: '40px 30px',
          boxShadow: '0 0 50px rgba(0, 245, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 40,
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 4, color: COLORS.cyan, fontWeight: 800, textTransform: 'uppercase' }}>
          Real-Time Speedometer
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 15 }}>
          <span
            style={{
              fontSize: 130,
              fontWeight: 900,
              fontFamily: 'monospace',
              color: '#ffffff',
              lineHeight: 1,
              textShadow: '0 0 35px rgba(0, 245, 255, 0.6)',
            }}
          >
            {wpm}
          </span>
          <span style={{ fontSize: 36, fontWeight: 800, color: COLORS.cyan }}>WPM</span>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 40, marginTop: 25 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, color: '#94a3b8', fontWeight: 600 }}>ACCURACY</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.emerald }}>99.4%</div>
          </div>
          <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, color: '#94a3b8', fontWeight: 600 }}>SWITCH</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#60a5fa' }}>Cherry Blue</div>
          </div>
          <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, color: '#94a3b8', fontWeight: 600 }}>STREAK</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.amber }}>84🔥</div>
          </div>
        </div>
      </div>

      {/* Typing Arena Stream Card */}
      <div
        style={{
          width: '100%',
          backgroundColor: 'rgba(11, 15, 25, 0.9)',
          border: `2px solid ${COLORS.cardBorder}`,
          borderRadius: 36,
          padding: 40,
          marginBottom: 40,
        }}
      >
        <div style={{ fontSize: 20, color: '#64748b', fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>
          LIVE SPRING CARET STREAM
        </div>
        <div
          style={{
            fontSize: 42,
            fontFamily: 'monospace',
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          <span style={{ color: COLORS.cyan, fontWeight: 800 }}>{typedPart}</span>
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 48,
              backgroundColor: COLORS.cyan,
              verticalAlign: 'middle',
              margin: '0 4px',
              boxShadow: '0 0 15px #00f5ff',
            }}
          />
          <span style={{ color: '#475569' }}>{untypedPart}</span>
        </div>
      </div>

      {/* Actuating Keycaps Preview */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {['Q', 'W', 'E', 'R', 'T', 'Y', 'SPACE'].map((k) => {
          const isPressed = k === currentKey || (k === 'SPACE' && frame % 12 < 4);
          return (
            <div
              key={k}
              style={{
                flex: k === 'SPACE' ? 2.5 : 1,
                height: 75,
                backgroundColor: isPressed ? 'rgba(0, 245, 255, 0.25)' : 'rgba(30, 41, 59, 0.8)',
                border: isPressed ? `2px solid ${COLORS.cyan}` : '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 900,
                color: isPressed ? '#ffffff' : '#94a3b8',
                boxShadow: isPressed ? '0 0 25px rgba(0, 245, 255, 0.6)' : 'none',
                scale: isPressed ? '0.94' : '1',
              }}
            >
              {k}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Milestone Boss Battle (210 - 300 frames / 7 - 10s)
const BossFightScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bossHp = Math.max(15, Math.round(interpolate(frame, [0, 85], [100, 15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })));

  const combo = Math.round(interpolate(frame, [0, 85], [12, 128]));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        padding: 50,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Red Alert Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 40%, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
        }}
      />

      {/* Warning Header */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 30px',
          borderRadius: 999,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          border: `2px solid ${COLORS.red}`,
          color: COLORS.red,
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: 4,
          marginBottom: 30,
          boxShadow: '0 0 35px rgba(239, 68, 68, 0.5)',
        }}
      >
        ⚠️ MILESTONE BOSS BATTLE (LVL 40)
      </div>

      {/* Boss Card */}
      <div
        style={{
          width: '100%',
          backgroundColor: 'rgba(20, 10, 15, 0.85)',
          border: `2px solid rgba(239, 68, 68, 0.5)`,
          borderRadius: 40,
          padding: 40,
          boxShadow: '0 0 60px rgba(239, 68, 68, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 90, marginBottom: 15 }}>👾</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#ffffff', letterSpacing: 1 }}>
          THE LATENCY GOLEM
        </div>
        <div style={{ fontSize: 22, color: '#f87171', fontWeight: 700, marginTop: 4 }}>
          Special Trait: Speed Drain Aura
        </div>

        {/* Boss HP Bar */}
        <div style={{ width: '100%', marginTop: 35 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 800, color: '#fca5a5', marginBottom: 12 }}>
            <span>BOSS INTEGRITY</span>
            <span>{bossHp}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: 36,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 18,
              overflow: 'hidden',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              padding: 4,
            }}
          >
            <div
              style={{
                width: `${bossHp}%`,
                height: '100%',
                borderRadius: 14,
                background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
                boxShadow: '0 0 25px rgba(239, 68, 68, 0.8)',
              }}
            />
          </div>
        </div>

        {/* Combo Multiplier Alert */}
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '16px 36px',
            borderRadius: 24,
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: `2px solid ${COLORS.amber}`,
          }}
        >
          <span style={{ fontSize: 36 }}>⚡</span>
          <span style={{ fontSize: 36, fontWeight: 900, color: COLORS.amber }}>
            {combo}x COMBO HIT!
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Real-Time WebSocket Multiplayer (300 - 390 frames / 10 - 13s)
const MultiplayerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progressP1 = Math.min(100, Math.round(interpolate(frame, [0, 85], [20, 100])));
  const progressP2 = Math.min(84, Math.round(interpolate(frame, [0, 85], [15, 84])));
  const progressP3 = Math.min(68, Math.round(interpolate(frame, [0, 85], [10, 68])));
  const progressP4 = Math.min(52, Math.round(interpolate(frame, [0, 85], [8, 52])));

  const players = [
    { name: 'Champion Typer', avatar: '👑', rank: 'Grandmaster', wpm: 154, progress: progressP1, color: '#00f5ff', isMe: true },
    { name: 'VelocityKing', avatar: '🏎️', rank: 'Diamond III', wpm: 132, progress: progressP2, color: '#a855f7', isMe: false },
    { name: 'NeonRacer', avatar: '⚡', rank: 'Platinum I', wpm: 116, progress: progressP3, color: '#10b981', isMe: false },
    { name: 'MechBot', avatar: '🤖', rank: 'Gold II', wpm: 98, progress: progressP4, color: '#ffd54f', isMe: false },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        padding: 50,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 30px',
          borderRadius: 999,
          backgroundColor: 'rgba(0, 245, 255, 0.15)',
          border: `2px solid ${COLORS.cyan}`,
          color: COLORS.cyan,
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: 4,
          marginBottom: 30,
          boxShadow: '0 0 35px rgba(0, 245, 255, 0.4)',
        }}
      >
        🏁 WEBSOCKET MULTIPLAYER RACE
      </div>

      <div style={{ fontSize: 50, fontWeight: 900, color: '#ffffff', marginBottom: 35, textAlign: 'center' }}>
        Live LAN & Online Racing
      </div>

      {/* Race Lanes */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {players.map((p, idx) => (
          <div
            key={p.name}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: p.isMe ? `2px solid ${COLORS.cyan}` : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 24,
              padding: '24px 28px',
              boxShadow: p.isMe ? '0 0 35px rgba(0, 245, 255, 0.3)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 36 }}>{p.avatar}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: '#ffffff' }}>{p.name}</span>
                    {p.isMe && (
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          backgroundColor: 'rgba(0, 245, 255, 0.25)',
                          color: COLORS.cyan,
                          padding: '3px 10px',
                          borderRadius: 6,
                        }}
                      >
                        YOU
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 18, color: p.color, fontWeight: 700 }}>{p.rank}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: '#ffffff' }}>
                  {p.wpm}
                </span>
                <span style={{ fontSize: 18, color: '#94a3b8', marginLeft: 6 }}>WPM</span>
              </div>
            </div>

            {/* Race Track Bar */}
            <div
              style={{
                width: '100%',
                height: 24,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 12,
                overflow: 'hidden',
                padding: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  width: `${p.progress}%`,
                  height: '100%',
                  borderRadius: 10,
                  backgroundColor: p.color,
                  boxShadow: `0 0 20px ${p.color}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Outro & Call To Action (390 - 450 frames / 13 - 15s)
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = spring({
    frame,
    fps,
    config: { damping: 10 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        padding: 50,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 110, marginBottom: 20, scale: `${pulse}` }}>🏆</div>

      <div
        style={{
          display: 'inline-block',
          padding: '12px 36px',
          borderRadius: 999,
          backgroundColor: 'rgba(255, 213, 79, 0.2)',
          border: `2px solid ${COLORS.amber}`,
          color: COLORS.amber,
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: 4,
          marginBottom: 25,
          boxShadow: '0 0 35px rgba(255, 213, 79, 0.5)',
        }}
      >
        #1 VICTORY ROYALE
      </div>

      <div style={{ fontSize: 72, fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
        ADVANCED TYPING
      </div>
      <div
        style={{
          fontSize: 78,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #00f5ff, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginTop: 10,
          marginBottom: 40,
        }}
      >
        INSTRUCTOR v2.5
      </div>

      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: '2px solid rgba(0, 245, 255, 0.4)',
          borderRadius: 30,
          padding: '30px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '90%',
          boxShadow: '0 0 45px rgba(0, 245, 255, 0.25)',
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>
          ✨ React 18 + TSX + TailwindCSS
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>
          ⚡ Cherry Blue Mechanical Audio Synth
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>
          🏎️ WebSocket Multiplayer & Gamer Cards
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>
          🗺️ 200 Campaign Levels & Boss Battles
        </div>
      </div>

      <div
        style={{
          marginTop: 50,
          fontSize: 34,
          fontWeight: 900,
          color: COLORS.cyan,
          letterSpacing: 2,
        }}
      >
        PLAY & MASTER YOUR SPEED NOW!
      </div>
    </AbsoluteFill>
  );
};

// Main Shorts Composition Export
export const ShortsComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#030712' }}>
      <Sequence from={0} durationInFrames={90} name="Hook">
        <HookScene />
      </Sequence>

      <Sequence from={90} durationInFrames={120} name="TypingAction">
        <TypingActionScene />
      </Sequence>

      <Sequence from={210} durationInFrames={90} name="BossFight">
        <BossFightScene />
      </Sequence>

      <Sequence from={300} durationInFrames={90} name="Multiplayer">
        <MultiplayerScene />
      </Sequence>

      <Sequence from={390} durationInFrames={60} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
