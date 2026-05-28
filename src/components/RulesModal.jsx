import React, { useState } from "react";
import { X, Dice5, Building2, Home as HomeIcon, Lock, Sparkles } from "lucide-react";

const TABS = [
  { id: "setup", label: "Setup", icon: Dice5, color: "var(--mint)" },
  { id: "rent", label: "Rent & Grouping", icon: Building2, color: "var(--sun)" },
  { id: "houses", label: "Houses / Hotels", icon: HomeIcon, color: "var(--sky)" },
  { id: "jail", label: "Jail & Specials", icon: Lock, color: "var(--coral)" },
  { id: "cards", label: "Chance & Chest", icon: Sparkles, color: "var(--grape)" },
];

const CONTENT = {
  setup: {
    title: "Get on the board",
    rules: [
      "Each player starts with a fixed bank balance (₹25,000 / $1,500).",
      "Roll two dice — doubles let you roll again, but rolling 3 doubles in a row sends you to Jail.",
      "Choose your name, avatar, and pawn color in the lobby.",
      "Collect salary (₹1,500 / $200) every time you pass or land on the START tile.",
    ],
  },
  rent: {
    title: "Color groups & rent",
    rules: [
      "Own all properties of a color group to charge double rent on undeveloped properties.",
      "Rent increases exponentially with house count and hotels.",
      "Mortgaged properties collect no rent until unmortgaged at 110% of mortgage value.",
      "You can click on any tile on the board to view its detailed rent and mortgage stats.",
    ],
  },
  houses: {
    title: "Build your empire",
    rules: [
      "Once you own a full color group, you can build houses/hotels from the property card detail view.",
      "Houses must be built evenly across properties in a group.",
      "Upgrade to a Hotel after building 4 houses on a property (5th house replaces them).",
      "Selling houses returns 50% of the build cost back to your balance.",
    ],
  },
  jail: {
    title: "Jail & special tiles",
    rules: [
      "In Jail: Escape by paying fine (₹500 / $50), using a Get Out of Jail Card, or rolling doubles.",
      "Rest House: You must skip your next turn (miss a turn). When your turn arrives, click Wake Up to end your rest.",
      "Club House: Purchase drinks for everyone! Pay ₹100 to all other active players.",
      "Chance and Community Chest card tiles will draw unexpected items that can completely change your fate.",
    ],
  },
  cards: {
    title: "Chance & Community Chest Deck",
    rules: [
      "🚗 Start Salary: Advance directly to START and collect your salary.",
      "💸 Speeding / Medical Bills: Pay fines and fees ranging from ₹500 to ₹1,500.",
      "🚓 Sent to Jail: Sent straight to jail without passing START.",
      "💎 Jackpot Winnings: Gain interest, dividends, and refunds up to ₹3,000.",
      "🔧 Property Taxes: Pay a repair fee of ₹500 per house and ₹1,500 per hotel.",
      "🎁 Birthday Gifts: Celebrate your birthday and collect ₹500 from every active tycoon.",
      "🚂 Transport Flight: fly to the nearest transport station (pays double rent if owned).",
      "🔓 Escape Card: Draw a 'Get Out of Jail Free' card to keep for later.",
      "💼 Inherited Wealth: Collect inheritance and error refunds up to ₹5,000.",
    ],
  },
};

export default function RulesModal({ open, onClose }) {
  const [tab, setTab] = useState("setup");
  if (!open) return null;

  const content = CONTENT[tab];
  const activeTab = TABS.find(t => t.id === tab);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        background: "color-mix(in oklab, var(--ink) 45%, transparent)", 
        animation: "pop 0.25s ease-out",
        pointerEvents: "auto"
      }}
      onClick={onClose}
    >
      <div
        className="brutal-lg max-w-2xl w-full max-h-[85vh] flex flex-col pointer-events-auto"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2" style={{ borderColor: "var(--ink)" }}>
          <h2 className="font-display font-black text-2xl flex items-center gap-2">📖 Game Rules</h2>
          <button onClick={onClose} className="btn-brutal !p-2" style={{ background: "var(--coral)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-5 flex gap-2 flex-wrap border-b-2" style={{ borderColor: "var(--ink)" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="brutal-tab px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
              style={{
                background: tab === t.id ? t.color : "var(--surface)",
                boxShadow: tab === t.id ? "3px 3px 0 0 var(--ink)" : "none",
                transform: tab === t.id ? "translate(-1px,-1px)" : "none",
              }}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Rules Content list */}
        <div className="p-6 overflow-y-auto flex-1" style={{ animation: "pop 0.25s ease-out" }}>
          <div
            className="inline-block px-3 py-1.5 rounded-xl mb-4 font-display font-black text-sm text-ink"
            style={{ background: activeTab.color, border: "2px solid var(--ink)", boxShadow: "2px 2px 0 0 var(--ink)" }}
          >
            {content.title}
          </div>
          <ul className="space-y-3">
            {content.rules.map((r, i) => (
              <li key={i} className="flex gap-3 items-start brutal p-4" style={{ background: "var(--surface-2)" }}>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-xs flex-shrink-0"
                  style={{ background: activeTab.color, border: "2px solid var(--ink)" }}
                >
                  {i + 1}
                </span>
                <span className="text-xs md:text-sm leading-relaxed pt-0.5 font-semibold text-ink">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
