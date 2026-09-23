import React from 'react';
import { ListOrdered, AlignLeft, BookOpen, Layers, Code2 } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { isOrganicTheme } from '../../utils/theme';

export interface RaceFormatOption {
  id: string;
  label: string;
  desc: string;
}

export const CURRICULUM_FORMATS: RaceFormatOption[] = [
  { id: 'Words', label: 'Words', desc: 'Quick isolated word drills' },
  { id: 'Lines', label: 'Lines', desc: 'Single-line sentence sprints' },
  { id: 'Paragraphs', label: 'Paragraphs', desc: 'Multi-sentence stamina' },
  { id: 'Pages', label: 'Pages', desc: 'Full-page endurance passages' },
  { id: 'Code', label: 'Code', desc: 'Real code with symbols' },
];

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  Words: <ListOrdered className="w-3.5 h-3.5" />,
  Lines: <AlignLeft className="w-3.5 h-3.5" />,
  Paragraphs: <BookOpen className="w-3.5 h-3.5" />,
  Pages: <Layers className="w-3.5 h-3.5" />,
  Code: <Code2 className="w-3.5 h-3.5" />,
  // Daily-challenge ids map onto the same icons
  words: <ListOrdered className="w-3.5 h-3.5" />,
  sentences: <AlignLeft className="w-3.5 h-3.5" />,
  paragraphs: <BookOpen className="w-3.5 h-3.5" />,
  pages: <Layers className="w-3.5 h-3.5" />,
  code: <Code2 className="w-3.5 h-3.5" />,
};

interface ModeSelectorProps {
  value: string;
  onChange: (id: string) => void;
  options?: RaceFormatOption[];
  label?: string;
}

/**
 * Shared drill-format picker (Words / Lines / Paragraphs / Pages / Code).
 * Used by Multiplayer, AI Words, Daily Challenge, etc. so every game mode
 * trains the full curriculum — not just short word lists.
 */
export const ModeSelector: React.FC<ModeSelectorProps> = ({
  value,
  onChange,
  options = CURRICULUM_FORMATS,
  label = 'Select drill format:',
}) => {
  const { uiTheme } = useGameStore();
  const isOrganic = isOrganicTheme(uiTheme);

  return (
    <div className="flex flex-col gap-2">
      <span
        className={`text-xs font-mono uppercase font-bold tracking-wider ${
          isOrganic ? 'text-[#616864]' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
      <div
        className={`grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 rounded-2xl border ${
          isOrganic
            ? 'bg-white border-[#E5DFD7]'
            : uiTheme === 'organic-dark'
            ? 'bg-[#141716] border-[#2E3531]'
            : 'bg-slate-900/80 border-white/10'
        }`}
      >
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              title={opt.desc}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                active
                  ? isOrganic
                    ? 'bg-[#C97D5A] text-white shadow-sm'
                    : uiTheme === 'organic-dark'
                    ? 'bg-[#D98A66] text-[#141716] shadow-sm font-black'
                    : 'bg-cyan-500 text-black shadow-neon-cyan'
                  : isOrganic
                  ? 'text-[#616864] hover:text-[#333333] hover:bg-black/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {FORMAT_ICONS[opt.id] ?? null}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
