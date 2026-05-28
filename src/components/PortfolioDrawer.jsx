import React from "react";
import { X, Home, Hotel, Lock } from "lucide-react";

const GROUP_COLORS = {
  pink: 'var(--prop-pink)',
  green: 'var(--prop-green)',
  yellow: 'var(--prop-yellow)',
  blue: 'var(--prop-blue)',
  red: 'var(--prop-red)',
  purple: 'var(--prop-purple)',
  orange: 'var(--prop-orange)',
  utility: 'var(--prop-utility)',
  transport: 'var(--prop-transport)'
};

const TOKEN_COLORS = [
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Grape
  '#f43f5e'  // Rose
];

export default function PortfolioDrawer({ player, properties, currencySymbol, onClose }) {
  if (!player) return null;

  // Filter properties owned by this player
  const playerProperties = properties.filter(p => p.ownerId === player.id);

  // Group by color group or type
  const grouped = playerProperties.reduce((acc, p) => {
    const key = p.type === 'property' ? p.group : p.type;
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});

  // Player token color index
  const pColor = player.color ? `var(--${player.color})` : TOKEN_COLORS[player.token % TOKEN_COLORS.length];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ 
        background: "color-mix(in oklab, var(--ink) 45%, transparent)",
        pointerEvents: "auto"
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full overflow-y-auto p-6 pointer-events-auto"
        style={{ 
          background: "var(--surface)", 
          borderLeft: "3.5px solid var(--ink)", 
          animation: "bubble 0.3s ease-out" 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2" style={{ borderColor: 'var(--ink)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 border-ink"
              style={{ background: pColor, boxShadow: "3px 3px 0 0 var(--ink)" }}
            >
              {player.avatar || '🦊'}
            </div>
            <div>
              <div className="font-display font-black text-xl text-ink leading-tight">{player.name}'s Portfolio</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: "var(--ink-soft)" }}>
                {playerProperties.length} spaces owned · {currencySymbol}{player.balance.toLocaleString()} cash
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-brutal !p-2" style={{ background: "var(--coral)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Empty state */}
        {playerProperties.length === 0 && (
          <div className="brutal p-8 text-center" style={{ background: "var(--surface-2)" }}>
            <div className="text-4xl mb-2">🏚️</div>
            <div className="font-display font-black text-lg text-ink">No properties owned</div>
            <div className="text-xs mt-1 leading-relaxed text-ink-soft opacity-80">
              Land on properties or utilities and purchase them during your turn to start building your empire.
            </div>
          </div>
        )}

        {/* Property cards grouped by color */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="brutal p-4" style={{ background: "var(--surface)" }}>
              {/* Group Name Banner */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="h-3 flex-1 rounded-full border-2 border-ink"
                  style={{ background: GROUP_COLORS[group] || '#718096' }}
                />
                <span className="text-[11px] uppercase tracking-wider font-black text-ink">{group}</span>
              </div>
              
              {/* Items List */}
              <div className="space-y-2">
                {items.map(p => (
                  <div 
                    key={p.id} 
                    className="flex items-center justify-between p-3 rounded-2xl border-2 border-dashed border-ink" 
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-display font-extrabold text-sm text-ink truncate flex items-center gap-1.5">
                        {p.name}
                        {p.isMortgaged && (
                          <span className="chip !text-[9px] !px-1.5 !py-0 bg-[var(--coral)] text-ink">
                            <Lock className="w-2.5 h-2.5" /> MORTGAGED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold mt-0.5" style={{ color: "var(--ink-soft)" }}>
                        Cost: {currencySymbol}{p.cost.toLocaleString()}
                      </div>
                    </div>
                    
                    {/* Houses / Hotels indicators */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {p.hotel ? (
                        <Hotel className="w-5 h-5 fill-current" style={{ color: "var(--coral)" }} strokeWidth={2.5} />
                      ) : (
                        Array.from({ length: p.houses || 0 }).map((_, i) => (
                          <Home key={i} className="w-4.5 h-4.5 fill-current" style={{ color: "var(--mint)" }} strokeWidth={2.5} />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
