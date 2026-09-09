import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { ShopItem } from '../../types/game';
import { ShoppingBag, Gem, Sparkles, Check, Lock, ArrowLeft, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SHOP_ITEMS: ShopItem[] = [
  { id: 'visual-diamond-cursor', name: 'Diamond Caret', desc: 'Glowing diamond cyan cursor pulse effect.', cost: 2500, lvl: 20, isVisual: true, category: 'visual', icon: '💎' },
  { id: 'visual-trophy-start', name: 'Hall of Fame Badge', desc: 'Prestige trophy floats alongside your avatar.', cost: 3000, lvl: 25, isVisual: true, category: 'visual', icon: '🏆' },
  { id: 'visual-dragon-egg', name: 'Dragon Egg Artifact', desc: 'Cosmic dragon egg on the results podium.', cost: 5000, lvl: 50, isVisual: true, category: 'visual', icon: '🥚' },
  { id: 'visual-netherite-kb', name: 'Dark Matter Switchplate', desc: 'Deep-dark radiant glowing mechanical keycaps.', cost: 7500, lvl: 70, isVisual: true, category: 'visual', icon: '⌨️' },
  { id: 'visual-emerald-glow', name: 'Correct-Key Sparkle', desc: 'Emerald green particle burst on every correct key.', cost: 12000, lvl: 90, isVisual: true, category: 'visual', icon: '✨' },
  { id: 'visual-golden-text', name: 'Golden Typeface', desc: 'Typing characters transform into gleaming gold.', cost: 10000, lvl: 120, isVisual: true, category: 'visual', icon: '🪙' },
  { id: 'visual-crown', name: 'Imperial Crown', desc: 'Regal crown badge displayed next to your rank tier.', cost: 15000, lvl: 150, isVisual: true, category: 'visual', icon: '👑' },
  { id: 'visual-enchanted-bg', name: 'Aura Field Matrix', desc: 'Enchanted celestial aura enveloping the arena.', cost: 50000, lvl: 180, isVisual: true, category: 'visual', icon: '🌌' },
  { id: 'visual-hero-totem', name: 'Victory Totem', desc: 'Colossal totem monument on level completion.', cost: 100000, lvl: 200, isVisual: true, category: 'visual', icon: '🗿' },
];

export const ShopModal: React.FC = () => {
  const { emeralds, level, addEmeralds, setScreen } = useGameStore();
  const [ownedItems, setOwnedItems] = useState<string[]>(['visual-diamond-cursor']);
  const [tab, setTab] = useState<'shop' | 'forge'>('shop');

  const handleBuy = (item: ShopItem) => {
    if (emeralds >= item.cost && !ownedItems.includes(item.id)) {
      addEmeralds(-item.cost);
      setOwnedItems([...ownedItems, item.id]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setScreen('game')}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Cyber Emporium &amp; Forge
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white">
              Cosmetic Upgrades &amp; Artifacts
            </h2>
          </div>
        </div>

        {/* Currency Display */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Gem className="w-4 h-4 text-emerald-400" />
          <span>{emeralds.toLocaleString()} Emeralds</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('shop')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tab === 'shop'
              ? 'bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-neon-purple'
              : 'glass-panel text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Visual Cosmetics
        </button>

        <button
          onClick={() => setTab('forge')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            tab === 'forge'
              ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-neon-amber'
              : 'glass-panel text-slate-400 hover:text-white'
          }`}
        >
          <Wand2 className="w-4 h-4" /> Legendary Enchantments
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SHOP_ITEMS.map((item) => {
          const isOwned = ownedItems.includes(item.id);
          const isLocked = level < item.lvl;
          const canAfford = emeralds >= item.cost;

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              className={`glass-panel p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isOwned
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : isLocked
                  ? 'border-white/5 opacity-60'
                  : 'border-white/10 hover:border-purple-400/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  {isOwned ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <Check className="w-3 h-3" /> Unlocked
                    </span>
                  ) : isLocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-white/5">
                      <Lock className="w-3 h-3" /> Req. Lvl {item.lvl}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                      <Gem className="w-3 h-3" /> {item.cost.toLocaleString()}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-base text-white">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                {isOwned ? (
                  <button className="w-full py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold cursor-default">
                    Equipped
                  </button>
                ) : isLocked ? (
                  <button disabled className="w-full py-2 rounded-xl bg-slate-900 text-slate-600 text-xs font-bold cursor-not-allowed">
                    Locked (Level {item.lvl})
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-neon-purple'
                        : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    {canAfford ? 'Purchase' : 'Insufficient Emeralds'}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
