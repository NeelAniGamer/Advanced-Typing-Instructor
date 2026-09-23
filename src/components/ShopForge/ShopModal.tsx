import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { ShopItem, SwitchProfile } from '../../types/game';
import { soundEngine } from '../../services/soundEngine';
import { 
  ShoppingBag, 
  Gem, 
  Sparkles, 
  Check, 
  Lock, 
  ArrowLeft, 
  Zap, 
  Key, 
  Volume2, 
  Palette, 
  Layers, 
  ShieldCheck, 
  CheckCircle2,
  Search,
  Wand2,
  X,
  VolumeX,
  Flame,
  Clock,
  Shield,
  Eye,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ExtendedShopItem extends ShopItem {
  profile?: SwitchProfile;
}

export interface EnchantmentRecipe {
  id: string;
  name: string;
  desc: string;
  cost: number;
  req1Id: string;
  req1Name: string;
  req2Id: string;
  req2Name: string;
  icon: string;
  effectDesc: string;
}

export const FORGE_RECIPES: EnchantmentRecipe[] = [
  {
    id: 'forge-temporal-aegis',
    name: 'Temporal Aegis Core',
    desc: 'Fuses Aegis Shield and Chronos Dilator into a supreme defensive artifact. Absorbs 4 typos per session and slows rival Ghost speed by 15%.',
    cost: 1200,
    req1Id: 'booster-aegis-shield',
    req1Name: 'Aegis Typo Shield Core',
    req2Id: 'booster-chronos',
    req2Name: 'Chronos Time Dilator',
    icon: '🛡️⏳',
    effectDesc: '4 Typo Absorptions + 15% Ghost Dilation'
  },
  {
    id: 'forge-vampiric-piercer',
    name: 'Vampiric Piercer Matrix',
    desc: 'Fuses Boss Piercer with Emerald Alchemist. Deals 38 HP/word to bosses and siphons +5 Emeralds on every correct hit during boss battles.',
    cost: 1500,
    req1Id: 'booster-boss-piercer',
    req1Name: 'Boss Piercer Core',
    req2Id: 'booster-emerald',
    req2Name: 'Emerald Alchemist Core',
    icon: '⚔️💎',
    effectDesc: '38 HP/Word Boss Dmg + Emerald Siphon'
  },
  {
    id: 'forge-hyperdrive-scanner',
    name: 'Hyperdrive Quantum Scanner',
    desc: 'Fuses Quantum Lookahead Scanner with Adrenaline Hyperdrive. Highlights next 4 upcoming words and ignites sessions with an instant +15 streak headstart.',
    cost: 1800,
    req1Id: 'booster-lookahead',
    req1Name: 'Quantum Lookahead Scanner',
    req2Id: 'booster-adrenaline',
    req2Name: 'Adrenaline Hyperdrive Starter',
    icon: '👁️🔥',
    effectDesc: '4 Word Lookahead + 15 Streak Headstart'
  },
  {
    id: 'forge-tranquil-overdrive',
    name: 'Tranquil Overdrive Engine',
    desc: 'Fuses Serenity Stress Nullifier with Overdrive Velocity Matrix. Completely eliminates test anxiety, grants +50% Speed Burst gems, and provides a 1-tier combo cushion.',
    cost: 2200,
    req1Id: 'booster-zen-anti-stress',
    req1Name: 'Serenity Stress Nullifier',
    req2Id: 'booster-overdrive-matrix',
    req2Name: 'Overdrive Velocity Matrix',
    icon: '🌸⚡',
    effectDesc: 'Zero Anxiety + 50% Speed Gems + Combo Cushion'
  },
  {
    id: 'forge-neuro-conqueror',
    name: 'Neuro-Cadence Master Core',
    desc: 'Fuses Rhythm Cadence Metronome with Neuro Weak-Spot Amplifier. Triples gems on weak-spot words and establishes subconscious rhythmic typing cadence.',
    cost: 2400,
    req1Id: 'booster-cadence-metronome',
    req1Name: 'Rhythm Cadence Metronome',
    req2Id: 'booster-weak-spot-conqueror',
    req2Name: 'Neuro Weak-Spot Amplifier',
    icon: '🎯⏱️',
    effectDesc: '3x Weak-Spot Gems + Rhythmic Flow'
  }
];

export const ALL_SHOP_ITEMS: ExtendedShopItem[] = [
  // LEVEL PROGRESSION BOOSTERS & ARTIFACTS
  {
    id: 'booster-zen-anti-stress',
    name: 'Serenity Stress Nullifier',
    desc: 'Completely eliminates typing test anxiety. Softens error buzzers to gentle water droplets, removes harsh red screen flashes, and maintains calm focus.',
    cost: 450,
    lvl: 1,
    category: 'booster',
    icon: '🌸',
    effectDesc: 'Zero Stress Audio & No Red Flashes'
  },
  {
    id: 'booster-cadence-metronome',
    name: 'Rhythm Cadence Metronome',
    desc: 'Guides finger cadence with audio-visual pulse intervals to prevent micro-hesitations. Awards +25% Speed Gems on fluid rhythmic typing.',
    cost: 650,
    lvl: 2,
    category: 'booster',
    icon: '⏱️',
    effectDesc: '+25% Speed Gems on Cadence'
  },
  {
    id: 'booster-flow-stabilizer',
    name: 'Zenith Flow Stabilizer',
    desc: 'Locks hand kinematics into an effortless glide. Words completed in rapid duration grant an enhanced +50% Speed Burst gem payout.',
    cost: 850,
    lvl: 3,
    category: 'booster',
    icon: '🌊',
    effectDesc: '+50% Speed Burst Gem Rewards'
  },
  {
    id: 'booster-mistake-buffer',
    name: 'Graceful Backspace Buffer',
    desc: 'Makes editing completely stress-free. Rapid backspace corrections immediately restore your clean word status and gem multiplier.',
    cost: 700,
    lvl: 2,
    category: 'booster',
    icon: '🔄',
    effectDesc: 'Backspace Restores Clean Gems'
  },
  {
    id: 'booster-weak-spot-conqueror',
    name: 'Neuro Weak-Spot Amplifier',
    desc: 'Supercharges neuroplasticity. Doubles the gem payout whenever typing words containing your AI-detected weak keys.',
    cost: 950,
    lvl: 4,
    category: 'booster',
    icon: '🎯',
    effectDesc: '2x Gems on AI Weak Keys'
  },
  {
    id: 'booster-overdrive-matrix',
    name: 'Overdrive Velocity Matrix',
    desc: 'Overclocks typing reflex circuits. Words typed in under 1.5 seconds ignite an instant +15 velocity combo burst with radiant trail.',
    cost: 1100,
    lvl: 5,
    category: 'booster',
    icon: '🚀',
    effectDesc: 'Instant +15 Combo on Fast Words'
  },
  {
    id: 'booster-lucky-gem-magnet',
    name: 'Fortune Gem Magnet',
    desc: 'Attracts hidden emerald clusters. Grants a 25% chance on completed words to trigger 2x or 3x Lucky Emerald drops with festive sparkles.',
    cost: 1000,
    lvl: 3,
    category: 'booster',
    icon: '🧲',
    effectDesc: '25% Chance of 2x-3x Gem Cascades'
  },
  {
    id: 'booster-streak-guardian',
    name: 'Eternal Flame Streak Guardian',
    desc: 'Protects hard-earned momentum. On a mistake, your combo multiplier never drops to zero—it merely cushions down one tier so you stay in the groove.',
    cost: 1250,
    lvl: 6,
    category: 'booster',
    icon: '🔥🛡️',
    effectDesc: 'Cushions Combos by 1 Tier (Never 0)'
  },
  {
    id: 'booster-aegis-shield',
    name: 'Aegis Typo Shield Core',
    desc: 'Absorbs up to 3 typos every session without breaking streak, velocity, or combo multiplier. Essential for flawless level passes.',
    cost: 350,
    lvl: 1,
    category: 'booster',
    icon: '🛡️',
    effectDesc: '3 Typo Absorptions / Run'
  },
  {
    id: 'booster-boss-piercer',
    name: 'Boss Piercer Core',
    desc: 'Infuses keystrokes with plasma charge. Doubles boss damage from 15 HP to 30 HP per word to crush milestone boss guardians.',
    cost: 600,
    lvl: 3,
    category: 'booster',
    icon: '⚔️',
    effectDesc: '2x Boss Damage (30 HP/Word)'
  },
  {
    id: 'booster-chronos',
    name: 'Chronos Time Dilator',
    desc: 'Distorts temporal flow against the Shadow Typist, slowing rival ghost velocity by 10% for easier level victories.',
    cost: 850,
    lvl: 5,
    category: 'booster',
    icon: '⏳',
    effectDesc: '-10% Ghost Pacing Velocity'
  },
  {
    id: 'booster-lookahead',
    name: 'Quantum Lookahead Scanner',
    desc: 'Projects the next 3 pending words in glowing radiant neon to sharpen reading-ahead and peripheral touch typing vision.',
    cost: 500,
    lvl: 2,
    category: 'booster',
    icon: '👁️',
    effectDesc: 'Highlights Next 3 Words'
  },
  {
    id: 'booster-emerald',
    name: 'Emerald Alchemist Core',
    desc: 'Synthesizes crystalline energy from accuracy. Grants +50% bonus Emerald rewards on completed typing sessions.',
    cost: 1200,
    lvl: 7,
    category: 'booster',
    icon: '💎',
    effectDesc: '+50% Emerald Earnings'
  },
  {
    id: 'booster-adrenaline',
    name: 'Adrenaline Hyperdrive Starter',
    desc: 'Overclocks typing sessions with an immediate +10 streak headstart, activating instant combo multipliers.',
    cost: 1500,
    lvl: 10,
    category: 'booster',
    icon: '🔥',
    effectDesc: '+10 Keystroke Streak Headstart'
  },
  {
    id: 'booster-overclock-wpm',
    name: 'Overclock WPM Accelerator',
    desc: 'Overclocks internal keystroke sampling algorithms to award +10% bonus calculated WPM and burst speed amplification during practice runs.',
    cost: 1400,
    lvl: 6,
    category: 'booster',
    icon: '⚡',
    effectDesc: '+10% Calculated WPM Boost'
  },
  {
    id: 'booster-zenith-focus',
    name: 'Zenith Focus Aura',
    desc: 'Shields peripheral concentration by applying a soft ambient dimming overlay to surrounding UI distractions while typing.',
    cost: 950,
    lvl: 4,
    category: 'booster',
    icon: '🧘',
    effectDesc: 'Ambient Focus UI Dimming'
  },

  // CONSUMABLE PASSES & RECHARGES
  {
    id: 'token-quantum-leap',
    name: 'Quantum Leap Key',
    desc: 'Bypasses temporal barriers. Instantly unlocks the next locked level without needing to grind prior stages.',
    cost: 750,
    lvl: 3,
    category: 'consumable',
    icon: '🗝️',
    effectDesc: 'Skip/Unlock 1 Locked Level'
  },
  {
    id: 'consumable-shield-pack',
    name: 'Aegis Shield 3-Pack',
    desc: 'Replenishes 3 extra typo absorption charges for high-stakes speed tests, boss battles, and timed exams.',
    cost: 300,
    lvl: 1,
    category: 'consumable',
    icon: '🔋',
    effectDesc: '+3 Extra Typo Shield Charges'
  },
  {
    id: 'token-streak-insurance',
    name: 'Streak Insurance Token',
    desc: 'Automatic safety net that forgives one missed calendar day without resetting your consecutive login streak or tier perks.',
    cost: 800,
    lvl: 2,
    category: 'consumable',
    icon: '🛡️',
    effectDesc: 'Forgives 1 Missed Streak Day'
  },

  // ACOUSTIC MECHANICAL SWITCHES WITH AUDIO SAMPLES
  {
    id: 'switch-cherry-blue',
    name: 'Cherry MX Blue',
    desc: 'Crisp, clicky tactile mechanical switch with sharp tactile feedback and audible click on actuation.',
    cost: 500,
    lvl: 1,
    category: 'switch',
    icon: '🔵',
    effectDesc: 'Crisp Clicky Acoustics',
    profile: 'cherry-blue'
  },
  {
    id: 'switch-cherry-red',
    name: 'Cherry MX Red',
    desc: 'Smooth linear actuation without tactile bump. Quiet, low-friction keycap bottom-out sound.',
    cost: 650,
    lvl: 3,
    category: 'switch',
    icon: '🔴',
    effectDesc: 'Smooth Linear Acoustics',
    profile: 'cherry-red'
  },
  {
    id: 'switch-topre',
    name: 'Topre Electro-Capacitive',
    desc: 'Iconic rubber dome over conical spring design. Produces the legendary deep muted "thock" acoustic profile.',
    cost: 950,
    lvl: 5,
    category: 'switch',
    icon: '🎹',
    effectDesc: 'Deep Tactile Thock',
    profile: 'topre'
  },
  {
    id: 'switch-holy-panda',
    name: 'Holy Panda Custom',
    desc: 'Enthusiast hybrid tactile switch with a prominent rounded bump and rich, satisfying mechanical bottom-out.',
    cost: 1200,
    lvl: 8,
    category: 'switch',
    icon: '🐼',
    effectDesc: 'Rich Rounded Thock',
    profile: 'holy-panda'
  },
  {
    id: 'switch-model-m',
    name: 'IBM Model M Buckling Spring',
    desc: 'Vintage 1985 classic buckling spring contact with nostalgic spring acoustic resonance and metallic ping.',
    cost: 1500,
    lvl: 12,
    category: 'switch',
    icon: '🏛️',
    effectDesc: 'Vintage Spring Ping',
    profile: 'model-m'
  },
  {
    id: 'switch-hall-effect',
    name: 'Hall Effect Magnetic',
    desc: 'Contactless magnetic sensor switch. High-tech futuristic rapid trigger actuation with electronic pulse sound.',
    cost: 2000,
    lvl: 16,
    category: 'switch',
    icon: '⚡',
    effectDesc: 'Magnetic Rapid Pulse',
    profile: 'hall-effect'
  },

  // KEYCAP THEMES & VISUALS
  {
    id: 'theme-cyberpunk',
    name: 'Cyberpunk Matrix',
    desc: 'Vibrant neon cyan & magenta laser chassis with ambient underglow and radiant accents.',
    cost: 1000,
    lvl: 5,
    category: 'theme',
    icon: '🌃',
    effectDesc: 'Neon Cyber Aesthetic'
  },
  {
    id: 'theme-retro84',
    name: 'Retro 1984 Amber CRT',
    desc: 'Warm vintage amber phosphor glow with authentic 80s terminal computer chassis aura.',
    cost: 1200,
    lvl: 8,
    category: 'theme',
    icon: '📺',
    effectDesc: 'Phosphor Amber Display'
  },
  {
    id: 'theme-dracula',
    name: 'Dracula Nightfall',
    desc: 'Dark gothic obsidian background with electric violet and pastel neon accents.',
    cost: 1800,
    lvl: 12,
    category: 'theme',
    icon: '🧛',
    effectDesc: 'Gothic Obsidian Aura'
  },
  {
    id: 'theme-monokai-pro',
    name: 'Monokai Pro Elite Theme',
    desc: 'Legendary code editor dark palette crafted with high-contrast pastel amber, magenta, and cyan hues for effortless readability.',
    cost: 1600,
    lvl: 10,
    category: 'theme',
    icon: '🎨',
    effectDesc: 'Monokai Pro Dark Palette'
  },
  {
    id: 'visual-diamond-cursor',
    name: 'Diamond Caret',
    desc: 'Glowing diamond cyan cursor pulse effect following each keystroke.',
    cost: 2500,
    lvl: 20,
    isVisual: true,
    category: 'visual',
    icon: '💎',
    effectDesc: 'Diamond Caret Pulse'
  },
  {
    id: 'visual-golden-keycaps',
    name: '24K Royal Golden Keycaps',
    desc: 'Forged in the Royal Foundry. Plated with lustrous 24-karat gold keycap highlights and radiant particle glimmer on every actuation.',
    cost: 3200,
    lvl: 15,
    isVisual: true,
    category: 'visual',
    icon: '✨',
    effectDesc: '24K Gold Keycap Glimmer'
  },
  {
    id: 'visual-trophy-start',
    name: 'Hall of Fame Badge',
    desc: 'Prestige trophy floats alongside your avatar in multiplayer and leaderboards.',
    cost: 3000,
    lvl: 25,
    isVisual: true,
    category: 'visual',
    icon: '🏆',
    effectDesc: 'Avatar Trophy Aura'
  },
  {
    id: 'visual-dragon-egg',
    name: 'Dragon Egg Artifact',
    desc: 'Cosmic dragon egg displayed on the results podium upon level completion.',
    cost: 5000,
    lvl: 50,
    isVisual: true,
    category: 'visual',
    icon: '🥚',
    effectDesc: 'Podium Egg Relic'
  },
  {
    id: 'visual-golden-text',
    name: 'Golden Typeface',
    desc: 'Typing characters transform into gleaming 24K gold typography.',
    cost: 10000,
    lvl: 120,
    isVisual: true,
    category: 'visual',
    icon: '🪙',
    effectDesc: '24K Gold Lettering'
  },
  {
    id: 'visual-crown',
    name: 'Imperial Crown',
    desc: 'Regal crown badge displayed next to your rank tier.',
    cost: 15000,
    lvl: 150,
    isVisual: true,
    category: 'visual',
    icon: '👑',
    effectDesc: 'Imperial Status Sigil'
  }
];

type ShopFilterTab = 'all' | 'booster' | 'consumable' | 'switch' | 'theme' | 'forge';

export const ShopModal: React.FC = () => {
  const { 
    emeralds, 
    level, 
    ownedItems, 
    equippedBoosters, 
    inventory, 
    switchProfile,
    typoShieldsRemaining,
    setSwitchProfile,
    buyShopItem, 
    toggleEquipBooster, 
    setScreen 
  } = useGameStore();

  const [filterTab, setFilterTab] = useState<ShopFilterTab>('booster');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);
  const [testingProfile, setTestingProfile] = useState<SwitchProfile | null>(null);

  const handleBuy = (item: ShopItem) => {
    const success = buyShopItem(item);
    if (success) {
      setPurchaseNotice(`Purchased ${item.name}!`);
      setTimeout(() => setPurchaseNotice(null), 3000);
    }
  };

  const handlePreviewSwitch = (profile: SwitchProfile) => {
    setTestingProfile(profile);
    soundEngine.setProfile(profile);
    soundEngine.playKey(false);
    setTimeout(() => soundEngine.playKey(false), 140);
    setTimeout(() => soundEngine.playKey(true), 280);
    setTimeout(() => {
      soundEngine.setProfile(switchProfile);
      setTestingProfile(null);
    }, 450);
  };

  const handleForge = (recipe: EnchantmentRecipe) => {
    const s = useGameStore.getState();
    const hasReq1 = (s.ownedItems || []).includes(recipe.req1Id);
    const hasReq2 = (s.ownedItems || []).includes(recipe.req2Id);
    const canAfford = s.emeralds >= recipe.cost;
    const alreadyForged = (s.ownedItems || []).includes(recipe.id);

    if (alreadyForged) return;
    if (!hasReq1 || !hasReq2 || !canAfford) return;

    // Deduct emeralds and add forged artifact to owned and equipped
    useGameStore.setState((prev) => ({
      emeralds: prev.emeralds - recipe.cost,
      ownedItems: [...prev.ownedItems, recipe.id],
      equippedBoosters: { ...prev.equippedBoosters, [recipe.id]: true },
    }));

    soundEngine.playHyperdrive();
    soundEngine.playLevelUp();
    useGameStore.getState().savePlayerData();

    setPurchaseNotice(`Forged Legendary Artifact: ${recipe.name}!`);
    setTimeout(() => setPurchaseNotice(null), 3500);
  };

  const filteredItems = useMemo(() => {
    return ALL_SHOP_ITEMS.filter((item) => {
      // Tab filter
      if (filterTab === 'booster' && item.category !== 'booster') return false;
      if (filterTab === 'consumable' && item.category !== 'consumable') return false;
      if (filterTab === 'switch' && item.category !== 'switch') return false;
      if (filterTab === 'theme' && item.category !== 'theme' && item.category !== 'visual') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.desc.toLowerCase().includes(q);
        const matchEffect = (item.effectDesc || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchEffect) return false;
      }

      // Affordable filter
      if (onlyAffordable) {
        if (emeralds < item.cost) return false;
      }

      return true;
    });
  }, [filterTab, searchQuery, onlyAffordable, emeralds]);

  // Active equipped boosters list for Loadout Tray
  const activeBoostersList = useMemo(() => {
    return Object.entries(equippedBoosters)
      .filter(([_, isEquipped]) => isEquipped)
      .map(([id]) => {
        const standard = ALL_SHOP_ITEMS.find((i) => i.id === id);
        if (standard) return { id, name: standard.name, icon: standard.icon };
        const forged = FORGE_RECIPES.find((r) => r.id === id);
        if (forged) return { id, name: forged.name, icon: forged.icon };
        return { id, name: id, icon: '⚡' };
      });
  }, [equippedBoosters]);

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 flex flex-col gap-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-cyan-950/30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen('game')}
            aria-label="Return to Arena"
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
            title="Return to Arena"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5 font-mono">
              <ShoppingBag className="w-3.5 h-3.5" /> The Armory
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white">
              Tactical Loadouts &amp; Hardware Forge
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Equip tactile switch acoustics, precision tools, and tactical loadouts for your practice sessions.
            </p>
          </div>
        </div>

        {/* Currency Display */}
        <div className="flex items-center gap-3">
          {inventory['token-quantum-leap'] > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold">
              <span>🗝️</span>
              <span>{inventory['token-quantum-leap']} Leap Keys</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Gem className="w-4 h-4 text-emerald-400" />
            <span>{emeralds.toLocaleString()} Emeralds</span>
          </div>
        </div>
      </div>

      {/* ACTIVE LOADOUT TRAY (WCAG 2.1 Information Architecture Upgrade) */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Active Loadout Tray:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active Switch */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-300">
            <Volume2 className="w-3 h-3 text-emerald-400" />
            <span>Switch: <strong className="text-white capitalize">{switchProfile}</strong></span>
            <button
              onClick={() => handlePreviewSwitch(switchProfile)}
              aria-label={`Test active ${switchProfile} switch sound`}
              className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
            >
              Test
            </button>
          </div>

          {/* Typo Shield Charges */}
          {typoShieldsRemaining > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300">
              <Shield className="w-3 h-3" />
              <span>Shields: <strong>{typoShieldsRemaining} Left</strong></span>
            </div>
          )}

          {/* Equipped Boosters List */}
          {activeBoostersList.length > 0 ? (
            activeBoostersList.map((b) => (
              <span
                key={b.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-bold"
              >
                <span>{b.icon}</span>
                <span>{b.name}</span>
                <button
                  onClick={() => toggleEquipBooster(b.id)}
                  aria-label={`Unequip ${b.name}`}
                  className="hover:text-red-400 transition-colors ml-0.5"
                  title="Unequip"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-slate-500 italic">No tactical boosters equipped</span>
          )}
        </div>
      </div>

      {/* Floating Purchase Feedback Notification */}
      <AnimatePresence>
        {purchaseNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 self-center shadow-neon-emerald"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{purchaseNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('booster')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              filterTab === 'booster'
                ? 'bg-sky-500/20 border border-sky-400/50 text-sky-300 shadow-sm'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-sky-400" />
            <span>⚡ Tactical Loadouts</span>
          </button>

          <button
            onClick={() => setFilterTab('forge')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 ${
              filterTab === 'forge'
                ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-sm'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4 text-amber-400" />
            <span>✨ Master Forge</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">Crafting</span>
          </button>

          <button
            onClick={() => setFilterTab('consumable')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 ${
              filterTab === 'consumable'
                ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-sm'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>🗝️ Consumables &amp; Keys</span>
          </button>

          <button
            onClick={() => setFilterTab('switch')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              filterTab === 'switch'
                ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow-sm'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>🔊 Acoustic Switches</span>
          </button>

          <button
            onClick={() => setFilterTab('theme')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-purple-400 ${
              filterTab === 'theme'
                ? 'bg-purple-500/20 border border-purple-400/50 text-purple-300 shadow-sm'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span>🎨 Keycap Themes</span>
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-slate-800 border border-white/30 text-white'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Items</span>
          </button>
        </div>

        {/* Quick Search & Affordability Checkbox */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gear..."
              aria-label="Search store items"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAffordable}
              onChange={(e) => setOnlyAffordable(e.target.checked)}
              className="rounded bg-slate-900 border-white/10 text-cyan-400 focus:ring-cyan-400"
            />
            <span className="hidden sm:inline">Affordable</span>
          </label>
        </div>
      </div>

      {/* LEGENDARY FORGE TAB CONTENT */}
      {filterTab === 'forge' ? (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                Alchemical Synthesis Laboratory
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Combine two owned prerequisite artifacts + Emeralds to forge permanent Legendary Cores with fused hybrid powers!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FORGE_RECIPES.map((recipe) => {
              const hasReq1 = (ownedItems || []).includes(recipe.req1Id);
              const hasReq2 = (ownedItems || []).includes(recipe.req2Id);
              const canAfford = emeralds >= recipe.cost;
              const isForged = (ownedItems || []).includes(recipe.id);
              const isEquipped = !!equippedBoosters[recipe.id];

              return (
                <motion.div
                  key={recipe.id}
                  whileHover={{ y: -3 }}
                  className={`glass-panel p-5 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                    isForged
                      ? 'border-amber-400/60 bg-amber-950/20 shadow-neon-amber/20'
                      : hasReq1 && hasReq2
                      ? 'border-cyan-500/40 bg-slate-950/70 hover:border-amber-400'
                      : 'border-white/5 opacity-70 bg-slate-950/40'
                  }`}
                >
                  <div className="absolute top-3 right-3">
                    <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Legendary Synthesis
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner">
                        {recipe.icon}
                      </div>
                      <div className="pr-12">
                        <h4 className="font-display font-bold text-base text-white leading-tight">
                          {recipe.name}
                        </h4>
                        <span className="inline-block text-[11px] font-mono font-bold text-amber-400 mt-0.5">
                          {recipe.effectDesc}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {recipe.desc}
                    </p>

                    {/* Synthesis Ingredients Checklist */}
                    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs font-mono mb-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Synthesis Ingredients:
                      </span>
                      
                      <div className="flex items-center justify-between">
                        <span className={hasReq1 ? 'text-emerald-300' : 'text-slate-500'}>
                          1. {recipe.req1Name}
                        </span>
                        {hasReq1 ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={hasReq2 ? 'text-emerald-300' : 'text-slate-500'}>
                          2. {recipe.req2Name}
                        </span>
                        {hasReq2 ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Forge Action Button */}
                  <div className="pt-3 border-t border-white/5">
                    {isForged ? (
                      <button
                        onClick={() => toggleEquipBooster(recipe.id)}
                        className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                          isEquipped
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-neon-amber font-black'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-slate-950" />
                            <span>Equipped (Active) • Click to Unequip</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>Owned • Click to Equip</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleForge(recipe)}
                        disabled={!hasReq1 || !hasReq2 || !canAfford}
                        className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                          hasReq1 && hasReq2 && canAfford
                            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black shadow-neon-amber hover:opacity-95'
                            : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        {!hasReq1 || !hasReq2
                          ? 'Missing Required Artifacts'
                          : !canAfford
                          ? `Need ${recipe.cost.toLocaleString()} 💎`
                          : `Synthesize (${recipe.cost.toLocaleString()} 💎)`}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* STANDARD ITEMS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isOwned = (ownedItems || []).includes(item.id);
            const isEquipped = item.category === 'booster' && !!equippedBoosters[item.id];
            const isConsumable = item.category === 'consumable';
            const isSwitch = item.category === 'switch';
            const isActiveSwitch = isSwitch && item.profile === switchProfile;
            const consumableStock = isConsumable ? (inventory[item.id] || 0) : 0;
            const isLocked = level < item.lvl;
            const canAfford = emeralds >= item.cost;

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -3 }}
                className={`glass-panel p-5 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                  isActiveSwitch || isEquipped
                    ? 'border-cyan-400/60 bg-cyan-950/25 shadow-neon-cyan/20 ring-1 ring-cyan-400/30'
                    : isOwned
                    ? 'border-emerald-500/40 bg-emerald-950/15'
                    : isLocked
                    ? 'border-white/5 opacity-60 bg-slate-950/40'
                    : 'border-white/10 hover:border-purple-400/40 bg-slate-950/60'
                }`}
              >
                {/* Category Tag Badge */}
                <div className="absolute top-3 right-3">
                  {item.category === 'booster' && (
                    <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      ⚡ Level Booster
                    </span>
                  )}
                  {item.category === 'consumable' && (
                    <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      🗝️ Consumable
                    </span>
                  )}
                  {item.category === 'switch' && (
                    <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      🔊 Acoustic Switch
                    </span>
                  )}
                  {(item.category === 'theme' || item.category === 'visual') && (
                    <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      🎨 Visual
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-13 h-13 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {item.icon}
                    </div>
                    <div className="pr-16">
                      <h3 className="font-display font-bold text-base text-white leading-tight">
                        {item.name}
                      </h3>
                      {item.effectDesc && (
                        <span className="inline-block text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                          {item.effectDesc}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {item.desc}
                  </p>

                  {/* Audio Preview for Acoustic Switches */}
                  {isSwitch && item.profile && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handlePreviewSwitch(item.profile!)}
                        aria-label={`Listen to ${item.name} mechanical switch acoustic preview`}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                          testingProfile === item.profile
                            ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-neon-emerald animate-pulse'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10 hover:border-emerald-400/40'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{testingProfile === item.profile ? 'Listening...' : 'Test Sound Preview'}</span>
                      </button>
                    </div>
                  )}

                  {/* Stock or Level Indicator */}
                  <div className="mt-3 flex items-center justify-between text-xs font-mono">
                    {isConsumable ? (
                      <span className="text-amber-300 font-bold bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
                        In Bag: {consumableStock}
                      </span>
                    ) : isLocked ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-white/5">
                        <Lock className="w-3 h-3" /> Req. Level {item.lvl}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Unlocked at Level {item.lvl}
                      </span>
                    )}

                    {!isOwned && !isConsumable && (
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <Gem className="w-3.5 h-3.5" /> {item.cost.toLocaleString()}
                      </span>
                    )}
                    {isConsumable && (
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <Gem className="w-3.5 h-3.5" /> {item.cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  {/* Booster Equip/Unequip */}
                  {item.category === 'booster' && isOwned ? (
                    <button
                      onClick={() => toggleEquipBooster(item.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                        isEquipped
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-neon-cyan hover:from-cyan-400 hover:to-blue-500'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 hover:border-cyan-400/40'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-cyan-200" />
                          <span>Equipped (Active) • Click to Unequip</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-slate-400" />
                          <span>Owned • Click to Equip</span>
                        </>
                      )}
                    </button>
                  ) : isSwitch && isOwned && item.profile ? (
                    <button
                      onClick={() => setSwitchProfile(item.profile!)}
                      className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                        isActiveSwitch
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-neon-emerald'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 hover:border-emerald-400/40'
                      }`}
                    >
                      {isActiveSwitch ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Active Switch Profile</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-slate-400" />
                          <span>Owned • Set as Active Switch</span>
                        </>
                      )}
                    </button>
                  ) : isConsumable ? (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={isLocked || !canAfford}
                      className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                        isLocked
                          ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-neon-amber'
                          : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      {isLocked
                        ? `Locked (Level ${item.lvl})`
                        : canAfford
                        ? `Buy Stock (${item.cost.toLocaleString()} Emeralds)`
                        : 'Insufficient Emeralds'}
                    </button>
                  ) : isOwned ? (
                    <div className="w-full py-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Unlocked &amp; Active</span>
                    </div>
                  ) : isLocked ? (
                    <button disabled className="w-full py-2 rounded-xl bg-slate-900 text-slate-600 text-xs font-mono font-bold cursor-not-allowed">
                      Locked (Level {item.lvl})
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-neon-purple'
                          : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      {canAfford ? `Purchase (${item.cost.toLocaleString()} 💎)` : 'Insufficient Emeralds'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};
