import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { soundEngine } from '../../services/soundEngine';
import { 
  GraduationCap, 
  Keyboard, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Award, 
  RotateCcw, 
  Play, 
  Map, 
  ShoppingBag, 
  Compass, 
  Layers, 
  Leaf,
  LayoutDashboard,
  HelpCircle,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSeriousTheme, isOrganicTheme } from '../../utils/theme';
import { Stepper, Step, BorderGlow } from '../ReactBits';

interface FingerZone {
  name: string;
  hand: 'Left' | 'Right';
  finger: string;
  color: string;
  bgLight: string;
  borderCol: string;
  keys: string[];
}

const FINGER_ZONES: FingerZone[] = [
  { name: 'Left Pinky', hand: 'Left', finger: 'Pinky', color: 'text-purple-400', bgLight: 'bg-purple-500/20', borderCol: 'border-purple-400/40', keys: ['1', 'Q', 'A', 'Z', 'Tab', 'CapsLock', 'Shift'] },
  { name: 'Left Ring', hand: 'Left', finger: 'Ring', color: 'text-blue-400', bgLight: 'bg-blue-500/20', borderCol: 'border-blue-400/40', keys: ['2', 'W', 'S', 'X'] },
  { name: 'Left Middle', hand: 'Left', finger: 'Middle', color: 'text-cyan-400', bgLight: 'bg-cyan-500/20', borderCol: 'border-cyan-400/40', keys: ['3', 'E', 'D', 'C'] },
  { name: 'Left Index', hand: 'Left', finger: 'Index', color: 'text-emerald-400', bgLight: 'bg-emerald-500/20', borderCol: 'border-emerald-400/40', keys: ['4', '5', 'R', 'T', 'F', 'G', 'V', 'B'] },
  { name: 'Right Index', hand: 'Right', finger: 'Index', color: 'text-amber-400', bgLight: 'bg-amber-500/20', borderCol: 'border-amber-400/40', keys: ['6', '7', 'Y', 'U', 'H', 'J', 'N', 'M'] },
  { name: 'Right Middle', hand: 'Right', finger: 'Middle', color: 'text-orange-400', bgLight: 'bg-orange-500/20', borderCol: 'border-orange-400/40', keys: ['8', 'I', 'K', ','] },
  { name: 'Right Ring', hand: 'Right', finger: 'Ring', color: 'text-rose-400', bgLight: 'bg-rose-500/20', borderCol: 'border-rose-400/40', keys: ['9', 'O', 'L', '.'] },
  { name: 'Right Pinky', hand: 'Right', finger: 'Pinky', color: 'text-pink-400', bgLight: 'bg-pink-500/20', borderCol: 'border-pink-400/40', keys: ['0', '-', '=', 'P', '[', ']', ';', "'", '/', 'Enter', 'Backspace'] },
  { name: 'Thumbs', hand: 'Left', finger: 'Thumb', color: 'text-teal-300', bgLight: 'bg-teal-500/20', borderCol: 'border-teal-400/40', keys: ['Spacebar'] },
];

const DRILL_STAGES = [
  { id: 1, name: 'Stage 1: Index Anchors (F & J)', text: 'f j f j fj jf ff jj' },
  { id: 2, name: 'Stage 2: Middle Reach (D & K)', text: 'd k d k dk kd dd kk' },
  { id: 3, name: 'Stage 3: Ring Control (S & L)', text: 's l s l sl ls ss ll' },
  { id: 4, name: 'Stage 4: Pinky Precision (A & ;)', text: 'a ; a ; a; ;a aa ;;' },
  { id: 5, name: 'Stage 5: Full Home Row Flow', text: 'asdf jkl; asdf jkl; fjdk slgh' },
];

export const StarterTutorialScreen: React.FC = () => {
  const { setScreen, setLevel, fetchNewBatch, category, mode, uiTheme } = useGameStore();
  const isSerious = isSeriousTheme(category, mode);
  const isOrganic = isOrganicTheme(uiTheme);

  const [viewMode, setViewMode] = useState<'stepper' | 'grid'>('stepper');
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'homerow' | 'rules' | 'systems' | 'drill'>('homerow');
  const [selectedFinger, setSelectedFinger] = useState<string | null>('Left Index');
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; desc: string } | null>(null);

  // Interactive Mini Drill State
  const [drillStage, setDrillStage] = useState(0);
  const [drillInput, setDrillInput] = useState('');
  const [drillErrors, setDrillErrors] = useState(0);
  const [drillComplete, setDrillComplete] = useState(false);
  const drillInputRef = useRef<HTMLInputElement>(null);

  const currentDrill = DRILL_STAGES[drillStage] || DRILL_STAGES[0];
  const targetDrillText = currentDrill.text;

  // Step 1 Tactile Anchor Test State
  const [leftAnchorTested, setLeftAnchorTested] = useState(false);
  const [rightAnchorTested, setRightAnchorTested] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((viewMode === 'stepper' && currentStep === 1) || (viewMode === 'grid' && activeTab === 'homerow')) {
        if (e.key === 'f' || e.key === 'F') {
          soundEngine.playKey(false);
          setLeftAnchorTested(true);
        } else if (e.key === 'j' || e.key === 'J') {
          soundEngine.playKey(false);
          setRightAnchorTested(true);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [viewMode, currentStep, activeTab]);

  useEffect(() => {
    if ((viewMode === 'stepper' && currentStep === 5) || (viewMode === 'grid' && activeTab === 'drill')) {
      drillInputRef.current?.focus();
    }
  }, [viewMode, currentStep, activeTab, drillStage]);

  const handleDrillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (drillComplete) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      setDrillInput((prev) => prev.slice(0, -1));
      soundEngine.playKey(false);
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      const expectedChar = targetDrillText[drillInput.length];
      const isCorrect = e.key === expectedChar;

      soundEngine.playKey(e.key === ' ');

      if (isCorrect) {
        const nextInput = drillInput + e.key;
        setDrillInput(nextInput);

        // Check if current stage completed
        if (nextInput === targetDrillText) {
          soundEngine.playCombo();
          if (drillStage < DRILL_STAGES.length - 1) {
            setTimeout(() => {
              setDrillStage((prev) => prev + 1);
              setDrillInput('');
            }, 300);
          } else {
            soundEngine.playLevelUp();
            setDrillComplete(true);
          }
        }
      } else {
        soundEngine.playError();
        setDrillErrors((prev) => prev + 1);
        setDrillInput((prev) => prev + e.key);
      }
    }
  };

  const resetDrill = () => {
    setDrillStage(0);
    setDrillInput('');
    setDrillErrors(0);
    setDrillComplete(false);
    drillInputRef.current?.focus();
  };

  const handleCompleteAndGoDashboard = () => {
    localStorage.setItem('ati_tutorial_completed', 'true');
    setScreen('dashboard');
  };

  const handleLaunchLevel1 = () => {
    localStorage.setItem('ati_tutorial_completed', 'true');
    setLevel(1);
    fetchNewBatch();
    setScreen('game');
  };

  // ── REUSABLE MODULES ──────────────────────────────────────────────
  const renderHomeRowAnchors = () => (
    <div className="flex flex-col gap-5 py-2">
      <div className="border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-widest font-extrabold text-[#C97D5A]">
            MODULE 1 • TACTILE ANCHORS
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7C8D81]/20 text-[#7C8D81] border border-[#7C8D81]/30">
            Crucial Foundation
          </span>
        </div>
        <h2 className="text-xl font-display font-black text-white mt-1">
          The Physical Home Row Anchors (F &amp; J Bumps)
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Every standard keyboard on Earth has two small raised physical ridges on keys <strong className="text-white">F</strong> and <strong className="text-white">J</strong>. These allow you to align your hands blindly without looking down.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-5 rounded-2xl border flex flex-col gap-3 transition-all ${
          isOrganic ? 'bg-white/90 border-[#E5DFD7] shadow-sm' : 'glass-panel border-cyan-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-2xl border ${
              isOrganic
                ? 'bg-[#7C8D81]/20 text-[#7C8D81] border-[#7C8D81]/40 shadow-sm'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-neon-cyan'
            }`}>
              F
            </div>
            <div>
              <h3 className={`font-display font-bold text-base ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
                Left Hand Anchor (F Key Ridge)
              </h3>
              <p className="text-xs text-slate-400">Rest your left index finger on the physical ridge of key F.</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 text-xs font-mono p-3 rounded-xl border ${
            isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333]' : 'bg-slate-900/70 border-white/5 text-slate-300'
          }`}>
            <span className="font-bold text-purple-400">A</span> (Pinky) • 
            <span className="font-bold text-blue-400"> S</span> (Ring) • 
            <span className="font-bold text-cyan-400"> D</span> (Middle) • 
            <span className="font-bold text-emerald-400"> F</span> (Index)
          </div>
        </div>

        <div className={`p-5 rounded-2xl border flex flex-col gap-3 transition-all ${
          isOrganic ? 'bg-white/90 border-[#E5DFD7] shadow-sm' : 'glass-panel border-amber-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-2xl border ${
              isOrganic
                ? 'bg-[#C97D5A]/20 text-[#C97D5A] border-[#C97D5A]/40 shadow-sm'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-neon-amber'
            }`}>
              J
            </div>
            <div>
              <h3 className={`font-display font-bold text-base ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
                Right Hand Anchor (J Key Ridge)
              </h3>
              <p className="text-xs text-slate-400">Rest your right index finger on the physical ridge of key J.</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 text-xs font-mono p-3 rounded-xl border ${
            isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333]' : 'bg-slate-900/70 border-white/5 text-slate-300'
          }`}>
            <span className="font-bold text-amber-400">J</span> (Index) • 
            <span className="font-bold text-orange-400"> K</span> (Middle) • 
            <span className="font-bold text-rose-400"> L</span> (Ring) • 
            <span className="font-bold text-pink-400"> ;</span> (Pinky)
          </div>
        </div>
      </div>

      {/* Visual Hand & Posture Diagram */}
      <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
        isOrganic ? 'bg-white border-[#E5DFD7] shadow-sm' : 'glass-panel border-cyan-500/20'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-cyan-400">
            <Keyboard className="w-4 h-4" />
            <span>Visual Hand Posture &amp; Home Row Alignment</span>
          </div>
          <span className={`text-[11px] font-mono ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
            Straight wrists • Curved relaxed fingers • Floating palms
          </span>
        </div>

        {/* Keyboard & Hands Visual Layout */}
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-around gap-6 ${
          isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7]' : 'bg-slate-950/80 border-white/5'
        }`}>
          {/* Left Hand Representation */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Left Hand (A-S-D-F)</div>
            <div className="flex items-end gap-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-purple-400">Pinky</span>
                <div className="w-9 h-14 rounded-t-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center font-mono font-bold text-sm text-purple-300">
                  A
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-blue-400">Ring</span>
                <div className="w-9 h-18 rounded-t-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center font-mono font-bold text-sm text-blue-300">
                  S
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-cyan-400">Middle</span>
                <div className="w-9 h-20 rounded-t-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center font-mono font-bold text-sm text-cyan-300">
                  D
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-emerald-400">Index</span>
                <div className="w-9 h-16 rounded-t-full bg-emerald-500/20 border-2 border-emerald-400 flex flex-col items-center justify-center font-mono font-bold text-sm text-emerald-300 relative shadow-neon-cyan">
                  <span>F</span>
                  <div className="w-3 h-0.5 bg-emerald-300 rounded-full mt-0.5" title="Tactile Raised Bump" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 ml-1">
                <span className="text-[10px] font-mono text-teal-300">Thumb</span>
                <div className="w-8 h-10 rounded-t-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center font-mono font-bold text-[10px] text-teal-300">
                  ␣
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400 text-center">
              F key has the <strong className="text-emerald-400">raised tactile ridge</strong>
            </div>
          </div>

          <div className={`hidden md:block w-px h-24 ${isOrganic ? 'bg-[#E5DFD7]' : 'bg-white/10'}`} />

          {/* Right Hand Representation */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Right Hand (J-K-L-;)</div>
            <div className="flex items-end gap-2">
              <div className="flex flex-col items-center gap-1 mr-1">
                <span className="text-[10px] font-mono text-teal-300">Thumb</span>
                <div className="w-8 h-10 rounded-t-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center font-mono font-bold text-[10px] text-teal-300">
                  ␣
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-amber-400">Index</span>
                <div className="w-9 h-16 rounded-t-full bg-amber-500/20 border-2 border-amber-400 flex flex-col items-center justify-center font-mono font-bold text-sm text-amber-300 relative shadow-neon-amber">
                  <span>J</span>
                  <div className="w-3 h-0.5 bg-amber-300 rounded-full mt-0.5" title="Tactile Raised Bump" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-orange-400">Middle</span>
                <div className="w-9 h-20 rounded-t-full bg-orange-500/20 border-2 border-orange-400 flex items-center justify-center font-mono font-bold text-sm text-orange-300">
                  K
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-rose-400">Ring</span>
                <div className="w-9 h-18 rounded-t-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center font-mono font-bold text-sm text-rose-300">
                  L
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-pink-400">Pinky</span>
                <div className="w-9 h-14 rounded-t-full bg-pink-500/20 border-2 border-pink-400 flex items-center justify-center font-mono font-bold text-sm text-pink-300">
                  ;
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400 text-center">
              J key has the <strong className="text-amber-400">raised tactile ridge</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1 Interactive Tactile Placement Test */}
      <div className={`p-5 rounded-2xl border flex flex-col gap-3.5 transition-all ${
        isOrganic ? 'bg-white border-[#E5DFD7] shadow-sm' : 'glass-panel border-cyan-500/20'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C97D5A]" />
            <h4 className={`text-sm font-bold ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
              Interactive Placement Mini-Test: Calibrate Anchors
            </h4>
          </div>
          <span className={`text-[11px] font-mono font-bold ${
            leftAnchorTested && rightAnchorTested ? 'text-emerald-600' : isOrganic ? 'text-[#7C8D81]' : 'text-cyan-400'
          }`}>
            {leftAnchorTested && rightAnchorTested ? '✓ Both Anchors Calibrated!' : 'Tap keys F & J on your keyboard'}
          </span>
        </div>
        <p className={`text-xs ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
          Touch the physical raised bumps on your keyboard. Feel for the ridges, then press <strong className="text-emerald-500">F</strong> with your left index finger, and <strong className="text-amber-500">J</strong> with your right index finger:
        </p>

        <div className="flex items-center justify-center gap-6 py-1">
          <button
            onClick={() => setLeftAnchorTested(true)}
            className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl border transition-all ${
              leftAnchorTested
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 shadow-sm'
                : isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333] hover:border-[#7C8D81]' : 'bg-slate-900 border-white/10 text-white hover:border-cyan-400'
            }`}
          >
            <span className="text-2xl font-black font-mono">F</span>
            <span className="text-[10px] font-bold uppercase">{leftAnchorTested ? '✓ Left Index Set' : 'Press Key F'}</span>
          </button>

          <button
            onClick={() => setRightAnchorTested(true)}
            className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl border transition-all ${
              rightAnchorTested
                ? 'bg-amber-500/20 border-amber-500 text-amber-600 shadow-sm'
                : isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333] hover:border-[#C97D5A]' : 'bg-slate-900 border-white/10 text-white hover:border-amber-400'
            }`}
          >
            <span className="text-2xl font-black font-mono">J</span>
            <span className="text-[10px] font-bold uppercase">{rightAnchorTested ? '✓ Right Index Set' : 'Press Key J'}</span>
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-xl border flex items-center gap-3 ${
        isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#616864]' : 'bg-slate-900/50 border-white/10 text-slate-400'
      }`}>
        <span className="text-xl">💡</span>
        <span className="text-xs">
          <strong>Tactile Muscle Memory Tip:</strong> Never visually verify your hand position. Gently glide your fingers over the keys until you feel the F and J bumps snap into place.
        </span>
      </div>
    </div>
  );

  const renderFingerZoning = () => (
    <div className="flex flex-col gap-4 py-2">
      <div className="border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-widest font-extrabold text-cyan-400">
            MODULE 2 • 10-FINGER TERRITORIES
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Zero Crossing Rule
          </span>
        </div>
        <h2 className="text-xl font-display font-black text-white mt-1">
          Interactive Finger-to-Key Zoning
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Click on any finger below to inspect its strict keyboard territory. Never cross fingers across columns.
        </p>
      </div>

      {/* Finger Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {FINGER_ZONES.map((zone) => {
          const isSelected = selectedFinger === zone.name;
          return (
            <button
              key={zone.name}
              onClick={() => setSelectedFinger(zone.name)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                isSelected
                  ? `${zone.bgLight} ${zone.borderCol} shadow-lg scale-102`
                  : isOrganic
                  ? 'bg-white/80 border-[#E5DFD7] text-[#616864] hover:text-[#333333] hover:border-[#7C8D81]'
                  : 'bg-slate-900/60 border-white/5 hover:border-white/20 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={zone.color}>{zone.name}</span>
                <span className="text-[10px] text-slate-500">{zone.hand}</span>
              </div>
              <div className="text-[11px] font-mono truncate">
                {zone.keys.join(', ')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Finger Inspection Panel */}
      {selectedFinger && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
          isOrganic ? 'bg-white border-[#E5DFD7] shadow-sm' : 'bg-slate-900/80 border-white/10'
        }`}>
          {(() => {
            const z = FINGER_ZONES.find((f) => f.name === selectedFinger) || FINGER_ZONES[0];
            return (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🖐️</span>
                  <div>
                    <div className={`text-sm font-bold ${z.color}`}>Assigned Keys for {z.name}:</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {z.keys.map((k) => (
                        <span key={k} className={`px-2.5 py-1 rounded-lg border font-mono font-black text-xs shadow-sm ${
                          isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333]' : 'bg-slate-950 border-white/20 text-white'
                        }`}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block text-right font-mono text-xs text-slate-400">
                  Always return finger to rest position after actuation.
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );

  const renderFiveRules = () => (
    <div className="flex flex-col gap-4 py-2">
      <div className="border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-widest font-extrabold text-amber-400">
            MODULE 3 • THE 5 GOLDEN RULES
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Mindset &amp; Ergonomics
          </span>
        </div>
        <h2 className="text-xl font-display font-black text-white mt-1">
          Fundamental Laws of Typing Velocity
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          World champions do not type faster by hitting keys harder; they eliminate pauses by obeying these 5 principles.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className={`p-4 rounded-2xl border flex gap-3.5 ${
          isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-cyan-500/20'
        }`}>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center font-bold text-sm shrink-0">
            1
          </div>
          <div>
            <h3 className={`font-display font-bold text-sm ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>Never Look at the Physical Keys</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Trust tactile muscle memory. Looking down forces visual recalculation and causes massive micro-delays.
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex gap-3.5 ${
          isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-amber-500/20'
        }`}>
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
            2
          </div>
          <div>
            <h3 className={`font-display font-bold text-sm ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>Always Anchor Back to F &amp; J</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Whenever you reach for upper or lower rows, fingers must immediately snap back to their home rest position.
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex gap-3.5 ${
          isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-emerald-500/20'
        }`}>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
            3
          </div>
          <div>
            <h3 className={`font-display font-bold text-sm ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>Accuracy First, Speed Follows</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Speed is the effortless byproduct of zero mistakes. A 98% accuracy run at 50 WPM beats a sloppy 75 WPM run.
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex gap-3.5 ${
          isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-purple-500/20'
        }`}>
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
            4
          </div>
          <div>
            <h3 className={`font-display font-bold text-sm ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>Light, Elastic Touch</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Switches actuate at ~2mm. Avoid bottoming out hard. Type lightly and bounce smoothly off keycaps.
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex gap-3.5 sm:col-span-2 ${
          isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-pink-500/20'
        }`}>
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-300 flex items-center justify-center font-bold text-sm shrink-0">
            5
          </div>
          <div>
            <h3 className={`font-display font-bold text-sm ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>Elevated Neutral Wrists</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Resting wrists on desk edges restricts blood flow. Float wrists naturally so fingers pivot with zero friction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemsAndBoosters = () => (
    <div className="flex flex-col gap-4 py-2">
      <div className="border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-widest font-extrabold text-purple-400">
            MODULE 4 • ATI PRO SYSTEMS
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Pacing &amp; Equipment
          </span>
        </div>
        <h2 className="text-xl font-display font-black text-white mt-1">
          Master Continuous Ghost Pacing &amp; Artifacts
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Discover how ATI’s continuous Ghost benchmark and Cyber Emporium boosters propel your progression.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-purple-500/30'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase">
              <span>👻</span> Continuous Ghost Rider
            </div>
            <h4 className={`font-display font-bold text-sm mt-1 ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>Real-Time Pacing</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              The Ghost paces continuously at your target WPM. If you pause, it pulls ahead, creating authentic competitive focus.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-purple-300">
            Modes: Personal Best • Level Target • 100 WPM
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-cyan-500/30'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase">
              <span>⌫</span> Word Backspace
            </div>
            <h4 className={`font-display font-bold text-sm mt-1 ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>Fluid Typo Correction</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Hit Backspace on an empty word to jump back into the previous word, or use Ctrl+Backspace to erase whole words!
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-cyan-300">
            Tip: Click any past word on screen to reposition!
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-amber-500/30'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
              <span>⏱️</span> Sprint Modes
            </div>
            <h4 className={`font-display font-bold text-sm mt-1 ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>Countdown Sprints</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Train with 15s, 30s, 60s &amp; 120s sprint challenges with audio pacing alerts and instant analytics.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-amber-300">
            Available directly on Typing Arena toolbar!
          </div>
        </div>
      </div>

      {/* Interface Tour & Screenshot Showcase */}
      <div className={`p-5 rounded-2xl border flex flex-col gap-4 mt-2 ${
        isOrganic ? 'bg-white border-[#E5DFD7] shadow-sm' : 'glass-panel border-purple-500/20'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-wider text-purple-400">
            <Eye className="w-4 h-4" />
            <span>ATI Visual Interface Tour &amp; Screenshots</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click any image below to zoom &amp; inspect features
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Screenshot 1: Organic Light Dashboard */}
          <div 
            onClick={() => setPreviewImage({
              src: '/screenshots/organic_light_dashboard.png',
              title: 'Command Dashboard (Organic Light)',
              desc: 'High-contrast organic warm linen theme with clear typography, practice level cards, and live telemetry.'
            })}
            className={`group cursor-pointer rounded-xl border overflow-hidden transition-all hover:scale-[1.02] ${
              isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7]' : 'bg-slate-900 border-white/10 hover:border-cyan-500/50'
            }`}
          >
            <div className="relative aspect-video overflow-hidden bg-black/40">
              <img 
                src="/screenshots/organic_light_dashboard.png" 
                alt="Organic Light Dashboard Screenshot" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-white/20">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" /> Click to Zoom
                </span>
              </div>
            </div>
            <div className="p-3">
              <h5 className={`font-display font-bold text-xs ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
                1. Organic Light Dashboard
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                Warm linen aesthetic, dual-theme toggle, and quick launch hub.
              </p>
            </div>
          </div>

          {/* Screenshot 2: Ergonomics & Hand Posture */}
          <div 
            onClick={() => setPreviewImage({
              src: '/screenshots/help_hand_posture_guide.png',
              title: 'Hand Ergonomics & Finger Posture Guide',
              desc: 'Tactile home-row alignment, straight wrists, curved fingers, and strict 10-finger color territory rules.'
            })}
            className={`group cursor-pointer rounded-xl border overflow-hidden transition-all hover:scale-[1.02] ${
              isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7]' : 'bg-slate-900 border-white/10 hover:border-purple-500/50'
            }`}
          >
            <div className="relative aspect-video overflow-hidden bg-black/40">
              <img 
                src="/screenshots/help_hand_posture_guide.png" 
                alt="Hand Ergonomics Screenshot" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-white/20">
                  <Eye className="w-3.5 h-3.5 text-purple-400" /> Click to Zoom
                </span>
              </div>
            </div>
            <div className="p-3">
              <h5 className={`font-display font-bold text-xs ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
                2. Touch Typing Ergonomics
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                Physical F &amp; J bumps, zero-crossing discipline, and relaxed wrist posture.
              </p>
            </div>
          </div>

          {/* Screenshot 3: Level Passing & Rewards */}
          <div 
            onClick={() => setPreviewImage({
              src: '/screenshots/level_passed_results.png',
              title: 'Fair Percentage Accuracy & Emerald Rewards',
              desc: 'Pass levels with 85%+ accuracy without broken link-typing constraints. Earn gems, rank promotions, and unlock badges.'
            })}
            className={`group cursor-pointer rounded-xl border overflow-hidden transition-all hover:scale-[1.02] ${
              isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7]' : 'bg-slate-900 border-white/10 hover:border-emerald-500/50'
            }`}
          >
            <div className="relative aspect-video overflow-hidden bg-black/40">
              <img 
                src="/screenshots/level_passed_results.png" 
                alt="Level Results Screenshot" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-white/20">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" /> Click to Zoom
                </span>
              </div>
            </div>
            <div className="p-3">
              <h5 className={`font-display font-bold text-xs ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
                3. Fair Accuracy Passing
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                85%+ accuracy passing criteria, net WPM telemetry, and emerald vault rewards.
              </p>
            </div>
          </div>

          {/* Screenshot 4: AI Word Synthesizer Pop-up */}
          <div 
            onClick={() => setPreviewImage({
              src: '/screenshots/popup_frosted_blur_bg.png',
              title: 'AI Word Synthesizer with Frosted Backdrop',
              desc: 'High-focus procedural vocabulary generator encased in frosted glass with deep backdrop blur.'
            })}
            className={`group cursor-pointer rounded-xl border overflow-hidden transition-all hover:scale-[1.02] ${
              isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7]' : 'bg-slate-900 border-white/10 hover:border-amber-500/50'
            }`}
          >
            <div className="relative aspect-video overflow-hidden bg-black/40">
              <img 
                src="/screenshots/popup_frosted_blur_bg.png" 
                alt="AI Word Synthesizer Screenshot" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-white/20">
                  <Eye className="w-3.5 h-3.5 text-amber-400" /> Click to Zoom
                </span>
              </div>
            </div>
            <div className="p-3">
              <h5 className={`font-display font-bold text-xs ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
                4. AI Synthesizer &amp; Frosted Glass
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                Frosted blur overlay with custom vocabulary generation on the fly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDrillSandbox = () => (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-3">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> MODULE 5 • HANDS-ON SANDBOX
          </span>
          <h2 className={`font-display font-extrabold text-xl mt-0.5 ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
            {currentDrill.name}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            Stage <span className="text-emerald-400 font-bold">{drillStage + 1}</span> of {DRILL_STAGES.length}
          </span>
          <button
            onClick={resetDrill}
            className={`p-2 rounded-xl border transition-colors ${
              isOrganic ? 'bg-white border-[#E5DFD7] text-[#616864] hover:text-[#333333]' : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Reset Starter Drill"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`w-full h-2.5 rounded-full overflow-hidden border ${
        isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7]' : 'bg-slate-900 border-white/5'
      }`}>
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
          style={{ width: `${((drillStage + (drillInput.length / targetDrillText.length)) / DRILL_STAGES.length) * 100}%` }}
        />
      </div>

      {/* Live Typing Sandbox Canvas */}
      {!drillComplete ? (
        <div 
          onClick={() => drillInputRef.current?.focus()}
          className={`p-6 sm:p-8 rounded-2xl border text-center cursor-text transition-all relative ${
            isOrganic
              ? 'bg-white border-[#E5DFD7] shadow-sm'
              : 'bg-slate-900/90 border-emerald-500/40 shadow-neon-emerald'
          }`}
        >
          <input
            ref={drillInputRef}
            type="text"
            value={drillInput}
            onChange={() => {}}
            onKeyDown={handleDrillKeyDown}
            className="opacity-0 absolute inset-0 w-full h-full cursor-text"
            autoFocus
          />

          <div className="text-xs font-mono text-slate-400 mb-3 uppercase tracking-wider">
            Type the keys exactly as shown (Keep fingers on F &amp; J):
          </div>

          <div className="font-mono text-2xl sm:text-3xl font-bold tracking-widest flex items-center justify-center flex-wrap gap-1">
            {targetDrillText.split('').map((char, i) => {
              const isTyped = i < drillInput.length;
              const isCurrent = i === drillInput.length;
              const typedChar = drillInput[i];
              const isCorrect = typedChar === char;

              let styleClass = isOrganic ? 'text-[#B8C0BF]' : 'text-slate-600';
              if (isTyped) {
                styleClass = isCorrect 
                  ? (isOrganic ? 'text-[#7C8D81] font-black' : 'text-emerald-400 font-black') 
                  : (isOrganic ? 'text-[#C97D5A] font-black underline' : 'text-red-400 font-black underline');
              } else if (isCurrent) {
                styleClass = isOrganic ? 'text-[#333333] border-b-2 border-[#C97D5A] animate-pulse' : 'text-cyan-300 border-b-2 border-cyan-400 animate-pulse';
              }

              return (
                <span key={i} className={`${styleClass} px-0.5`}>
                  {char === ' ' ? '␣' : char}
                </span>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-5 text-xs font-mono text-slate-400">
            <div>Errors: <span className={drillErrors > 0 ? (isOrganic ? 'text-[#C97D5A] font-bold' : 'text-red-400 font-bold') : 'text-emerald-400'}>{drillErrors}</span></div>
            <div>Remaining Stages: <span className="text-white font-bold">{DRILL_STAGES.length - drillStage}</span></div>
          </div>
        </div>
      ) : (
        <div className={`p-8 rounded-2xl border text-center flex flex-col items-center gap-4 ${
          isOrganic ? 'bg-white border-[#7C8D81]/40 shadow-sm' : 'bg-emerald-950/40 border-emerald-400/50 shadow-neon-emerald'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
            isOrganic ? 'bg-[#7C8D81]/20 text-[#7C8D81]' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            🏆
          </div>
          <div>
            <h3 className={`text-xl font-display font-black ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
              All Starter Drill Stages Complete!
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              You’ve proven proper home row anchoring, rhythm control, and muscle memory. You are ready to enter Level 1!
            </p>
          </div>
          <button
            onClick={handleLaunchLevel1}
            className={`px-8 py-3.5 rounded-xl font-display font-black text-sm tracking-wider flex items-center gap-2 hover:scale-105 transition-all shadow-lg ${
              isOrganic ? 'bg-[#C97D5A] text-white shadow-organic-terracotta' : 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black shadow-neon-emerald'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>ENTER LEVEL 1 NOW</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 flex flex-col gap-6 select-none pb-24">
      
      {/* ── ACADEMY HERO HEADER ───────────────────────────────────── */}
      <div className={`glass-panel p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden transition-all ${
        isOrganic
          ? 'border-[#E5DFD7] shadow-organic-card bg-white/95'
          : isSerious
          ? 'border-emerald-500/30 bg-slate-950/80 shadow-[0_0_50px_rgba(16,185,129,0.1)]'
          : 'border-cyan-500/30 bg-slate-950/80 shadow-[0_0_50px_rgba(0,245,255,0.1)]'
      }`}>
        <div className="relative z-10 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border ${
            isOrganic
              ? 'bg-[#7C8D81]/15 border-[#7C8D81]/30 text-[#7C8D81] shadow-sm'
              : 'bg-cyan-500/20 border-cyan-400/40 shadow-neon-cyan'
          }`}>
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 ${
                isOrganic ? 'text-[#C97D5A]' : 'text-cyan-400'
              }`}>
                <HelpCircle className="w-4 h-4" /> Help &amp; Typing Academy
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isOrganic
                  ? 'bg-[#EBC078]/25 text-[#966E1F] border-[#EBC078]/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                Official Manual
              </span>
            </div>
            <h1 className={`font-display font-black text-2xl sm:text-3xl mt-1 ${
              isOrganic ? 'text-[#333333]' : 'text-white'
            }`}>
              Help &amp; Touch Typing Academy
            </h1>
            <p className={`text-xs sm:text-sm max-w-xl mt-1 ${
              isOrganic ? 'text-[#616864]' : 'text-slate-400'
            }`}>
              Master home-row tactile anchors, 10-finger color territories, fluid cadence, and explore all Advanced Typing Instructor game modes.
            </p>
          </div>
        </div>

        {/* Quick Launch CTAs */}
        <div className="relative z-10 flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <button
            onClick={handleCompleteAndGoDashboard}
            className={`w-full sm:w-auto px-4 py-3 rounded-2xl font-display font-bold text-xs tracking-wider border hover:scale-105 transition-all flex items-center justify-center gap-2 ${
              isOrganic
                ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                : 'glass-panel border-rose-500/30 text-rose-300 hover:text-white hover:bg-rose-500/10'
            }`}
            title="Skip this tutorial and proceed directly to the Dashboard"
          >
            <X className="w-4 h-4 text-rose-500" />
            <span>SKIP TUTORIAL</span>
          </button>

          <button
            onClick={handleCompleteAndGoDashboard}
            className={`w-full sm:w-auto px-4 py-3 rounded-2xl font-display font-bold text-xs tracking-wider border hover:scale-105 transition-all flex items-center justify-center gap-2 ${
              isOrganic
                ? 'bg-white border-[#E5DFD7] text-[#333333] hover:border-[#7C8D81]'
                : 'glass-panel border-cyan-500/30 text-cyan-300 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
            <span>GO TO DASHBOARD</span>
          </button>

          <button
            onClick={handleLaunchLevel1}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-display font-black text-xs tracking-wider hover:scale-105 transition-all flex items-center justify-center gap-2 ${
              isOrganic
                ? 'bg-[#C97D5A] text-white shadow-organic-terracotta'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-black shadow-neon-cyan'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START LEVEL 1</span>
          </button>
        </div>
      </div>

      {/* ── MODE SELECTOR: GUIDED STEPPER vs BROWSE BLUEPRINT ───── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border ${
          isOrganic ? 'bg-white border-[#E5DFD7] shadow-sm' : 'bg-slate-900/80 border-white/10'
        }`}>
          <button
            onClick={() => setViewMode('stepper')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'stepper'
                ? isOrganic
                  ? 'bg-[#7C8D81] text-white shadow-organic-sage'
                  : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-neon-cyan'
                : isOrganic
                ? 'text-[#616864] hover:text-[#333333]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Interactive Academy Guide</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? isOrganic
                  ? 'bg-[#7C8D81] text-white shadow-organic-sage'
                  : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-neon-cyan'
                : isOrganic
                ? 'text-[#616864] hover:text-[#333333]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Blueprint Tabs</span>
          </button>
        </div>

        <div className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${
          isOrganic ? 'bg-white border-[#E5DFD7] text-[#7C8D81]' : 'bg-slate-900/60 border-white/10 text-cyan-300'
        }`}>
          {viewMode === 'stepper' ? `Step ${currentStep} of 5 Active` : 'All Reference Modules'}
        </div>
      </div>

      {/* ── VIEW 1: REACT BITS STEPPER FLOW (ENCASED IN BORDERGLOW) ─ */}
      {viewMode === 'stepper' && (
        <BorderGlow
          edgeSensitivity={26}
          glowRadius={40}
          borderRadius={32}
          glowIntensity={1.15}
          coneSpread={30}
          animated={false}
          backgroundColor={isOrganic ? '#FAF8F5' : isSerious ? '#020617' : '#07090e'}
          glowColor={isOrganic ? '140 20 60' : isSerious ? '160 80 50' : '190 100 60'}
          colors={
            isOrganic
              ? ['#7C8D81', '#C97D5A', '#EBC078']
              : isSerious
              ? ['#10b981', '#14b8a6', '#06b6d4']
              : ['#00f5ff', '#b388ff', '#ff1744']
          }
          className={`w-full transition-all duration-400 ${
            isOrganic ? 'shadow-organic-card' : ''
          }`}
        >
          <div className="w-full">
            <Stepper
              initialStep={currentStep}
              onStepChange={(s) => setCurrentStep(s)}
              onFinalStepCompleted={handleLaunchLevel1}
              backButtonText="← Previous Step"
              nextButtonText="Next Step →"
              stepCircleContainerClassName="w-full max-w-5xl"
              contentClassName="px-2"
            >
              {/* STEP 1 */}
              <Step>
                {renderHomeRowAnchors()}
              </Step>

              {/* STEP 2 */}
              <Step>
                {renderFingerZoning()}
              </Step>

              {/* STEP 3 */}
              <Step>
                {renderFiveRules()}
              </Step>

              {/* STEP 4 */}
              <Step>
                {renderSystemsAndBoosters()}
              </Step>

              {/* STEP 5 */}
              <Step>
                {renderDrillSandbox()}
              </Step>
            </Stepper>
          </div>
        </BorderGlow>
      )}

      {/* ── VIEW 2: BLUEPRINT TABS GRID ───────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="flex flex-col gap-6">
          {/* Tab buttons */}
          <div className={`flex items-center gap-2 p-1.5 rounded-2xl border overflow-x-auto ${
            isOrganic ? 'bg-white border-[#E5DFD7]' : 'bg-slate-900/80 border-white/10'
          }`}>
            <button
              onClick={() => setActiveTab('homerow')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'homerow'
                  ? isOrganic ? 'bg-[#7C8D81] text-white shadow-sm' : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-neon-cyan'
                  : isOrganic ? 'text-[#616864] hover:text-[#333333]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>1. Home Row &amp; Anchors</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'rules'
                  ? isOrganic ? 'bg-[#7C8D81] text-white shadow-sm' : 'bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-neon-amber'
                  : isOrganic ? 'text-[#616864] hover:text-[#333333]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>2. 5 Golden Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('systems')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'systems'
                  ? isOrganic ? 'bg-[#7C8D81] text-white shadow-sm' : 'bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-neon-purple'
                  : isOrganic ? 'text-[#616864] hover:text-[#333333]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>3. ATI Pro Systems &amp; Boosters</span>
            </button>

            <button
              onClick={() => setActiveTab('drill')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'drill'
                  ? isOrganic ? 'bg-[#C97D5A] text-white shadow-sm' : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-neon-emerald'
                  : isOrganic ? 'text-[#616864] hover:text-[#333333]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>4. Hands-On Starter Drill</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 'homerow' && (
              <div className="flex flex-col gap-6">
                {renderHomeRowAnchors()}
                {renderFingerZoning()}
              </div>
            )}
            {activeTab === 'rules' && renderFiveRules()}
            {activeTab === 'systems' && renderSystemsAndBoosters()}
            {activeTab === 'drill' && renderDrillSandbox()}
          </motion.div>
        </div>
      )}

      {/* Lightbox / Screenshot Zoom Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`max-w-5xl w-full rounded-2xl border overflow-hidden shadow-2xl flex flex-col ${
                isOrganic ? 'bg-white border-[#E5DFD7]' : 'bg-slate-900 border-white/20'
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <h3 className={`font-display font-bold text-base ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
                    {previewImage.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{previewImage.desc}</p>
                </div>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 bg-black/60 flex items-center justify-center">
                <img
                  src={previewImage.src}
                  alt={previewImage.title}
                  className="w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
