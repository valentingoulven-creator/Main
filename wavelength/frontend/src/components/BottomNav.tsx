import { Music2, Map, Radio } from 'lucide-react';

type Tab = 'nearby' | 'map' | 'discover';

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
  accentColor: string;
  discoverCount: number;
}

const TABS = [
  { id: 'nearby'   as Tab, icon: Music2, label: 'Proximité' },
  { id: 'map'      as Tab, icon: Map,    label: 'Carte'     },
  { id: 'discover' as Tab, icon: Radio,  label: 'Découvrir' },
];

export default function BottomNav({ active, onChange, accentColor, discoverCount }: Props) {
  return (
    <nav
      className="flex items-center justify-around flex-shrink-0 border-t"
      style={{
        background: 'rgba(13,13,26,0.97)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
        paddingTop: 6,
        minHeight: 56,
      }}
    >
      {TABS.map(({ id, icon: Icon, label }) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className="flex-1 flex flex-col items-center gap-1 py-1 relative transition-all active:scale-90"
            style={{ minWidth: 44, minHeight: 44 }}>
            <div className="relative">
              <Icon
                className="w-6 h-6 transition-colors"
                style={{ color: isActive ? accentColor : 'rgba(255,255,255,0.35)' }}
              />
              {id === 'discover' && discoverCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full text-white font-black flex items-center justify-center bg-red-500"
                  style={{ fontSize: 9 }}>
                  {discoverCount > 9 ? '9+' : discoverCount}
                </span>
              )}
            </div>
            <span
              className="text-xs font-semibold transition-colors leading-none"
              style={{ color: isActive ? accentColor : 'rgba(255,255,255,0.3)', fontSize: 10 }}>
              {label}
            </span>
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                style={{ background: accentColor }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
