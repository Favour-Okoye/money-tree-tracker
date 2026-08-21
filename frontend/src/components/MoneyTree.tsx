import type React from "react";

export const TREE_STAGES = [
  { min: 0, name: "Seed", emoji: "🫘" },
  { min: 100, name: "Sprout", emoji: "🌱" },
  { min: 300, name: "Sapling", emoji: "🪴" },
  { min: 750, name: "Young Tree", emoji: "🌳" },
  { min: 1500, name: "Money Tree", emoji: "💰" },
  { min: 3000, name: "Golden Tree", emoji: "✨" },
  { min: 6000, name: "Orchard", emoji: "🌳🌳" },
] as const;

export function stageForXp(xp: number, financiallyFree = false): number {
  if (financiallyFree) return TREE_STAGES.length - 1; // the Orchard is earned by freedom, not XP
  let stage = 0;
  for (let i = 0; i < TREE_STAGES.length; i++) if (xp >= TREE_STAGES[i].min) stage = i;
  return stage;
}

function Coin({ x, y, r = 11 }: { x: number; y: number; r?: number }) {
  return (
    <g className="coin" style={{ animationDelay: `${-((x * 7) % 23) / 10}s` }}>
      <circle cx={x} cy={y} r={r} fill="#fbbf24" stroke="#b45309" strokeWidth="2.5" />
      <text
        x={x}
        y={y + r * 0.42}
        textAnchor="middle"
        fontSize={r * 1.15}
        fontWeight="bold"
        fill="#92400e"
      >
        €
      </text>
    </g>
  );
}

function SmallTree({ x, golden }: { x: number; golden: boolean }) {
  return (
    <g>
      <path d={`M${x - 3} 158 L${x + 3} 158 L${x + 1} 132 L${x - 1} 132 Z`} fill="#8a5a2b" />
      <circle className="leaf" cx={x} cy={124} r={17} fill={golden ? "#fbbf24" : "#22c55e"} />
      <circle className="leaf" cx={x - 11} cy={131} r={11} fill={golden ? "#f59e0b" : "#2fd06b"} />
      <circle className="leaf" cx={x + 11} cy={131} r={11} fill={golden ? "#fcd34d" : "#1fae52"} />
    </g>
  );
}

/** The mascot. Grows through 7 stages as lifetime XP accumulates. */
export function MoneyTree({ xp, free = false }: { xp: number; free?: boolean }) {
  const stage = stageForXp(xp, free);
  const golden = stage >= 5;
  const canopyMain = golden ? "#facc15" : "#22c55e";
  const canopyLight = golden ? "#fde047" : "#34d873";
  const canopyDark = golden ? "#eab308" : "#1fae52";
  const amp = [6, 10, 6, 4.5, 4, 4, 3][stage] ?? 4;
  const sway = { className: "tree-sway", style: { ["--amp" as string]: amp } as React.CSSProperties };

  return (
    <svg key={stage} viewBox="0 0 200 175" className="tree-pop mx-auto w-52">
      {/* ground */}
      <ellipse cx="100" cy="160" rx="78" ry="12" fill="#d9f2e0" />
      <ellipse cx="100" cy="158" rx="60" ry="8" fill="#b9e8c8" />

      {stage === 0 && (
        <g>
          <ellipse cx="100" cy="150" rx="14" ry="7" fill="#8a5a2b" />
          <g className="seed-bob">
            <ellipse cx="100" cy="146" rx="7" ry="9" fill="#a16207" />
            <path d="M96 142 q4 -7 8 0" stroke="#78350f" strokeWidth="1.5" fill="none" />
          </g>
          <path className="twinkle" d="M128 118 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#fde68a" />
          <path className="twinkle" style={{ animationDelay: "-0.9s" }} d="M70 128 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#fde68a" />
        </g>
      )}

      {stage === 1 && (
        <g {...sway}>
          <path d="M100 152 C100 140 100 132 100 124" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M100 132 C88 128 84 116 88 110 C98 112 102 122 100 132" fill="#22c55e" />
          <path d="M100 126 C112 122 116 110 112 104 C102 106 98 116 100 126" fill="#34d873" />
        </g>
      )}

      {stage === 2 && (
        <g {...sway}>
          <path d="M96 155 L104 155 L102 118 L98 118 Z" fill="#8a5a2b" />
          <circle className="leaf" cx="100" cy="102" r="26" fill={canopyMain} />
          <circle className="leaf" cx="83" cy="112" r="16" fill={canopyLight} />
          <circle className="leaf" cx="117" cy="112" r="16" fill={canopyDark} />
        </g>
      )}

      {stage >= 3 && stage <= 5 && (
        <g {...sway}>
          <path d="M93 158 C93 132 90 118 85 104 L100 96 L115 104 C110 118 107 132 107 158 Z" fill="#8a5a2b" />
          <circle className="leaf" cx="100" cy="78" r={stage >= 4 ? 42 : 36} fill={canopyMain} />
          <circle className="leaf" cx="70" cy="94" r={stage >= 4 ? 27 : 22} fill={canopyLight} />
          <circle className="leaf" cx="130" cy="94" r={stage >= 4 ? 27 : 22} fill={canopyDark} />
          <circle className="leaf" cx="100" cy="58" r={stage >= 4 ? 28 : 23} fill={canopyLight} />
          {stage >= 4 && (
            <>
              <Coin x={78} y={80} />
              <Coin x={124} y={72} />
              <Coin x={102} y={102} />
            </>
          )}
          {stage >= 5 && (
            <>
              <Coin x={58} y={100} r={9} />
              <Coin x={142} y={98} r={9} />
              <path className="twinkle" d="M146 34 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#fef3c7" />
              <path className="twinkle" style={{ animationDelay: "-0.7s" }} d="M52 44 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#fef3c7" />
            </>
          )}
        </g>
      )}

      {stage === 6 && (
        <g {...sway}>
          <path d="M94 158 C94 134 91 122 86 110 L100 102 L114 110 C109 122 106 134 106 158 Z" fill="#8a5a2b" />
          <circle className="leaf" cx="100" cy="84" r="36" fill={canopyMain} />
          <circle className="leaf" cx="74" cy="98" r="22" fill={canopyLight} />
          <circle className="leaf" cx="126" cy="98" r="22" fill={canopyDark} />
          <circle className="leaf" cx="100" cy="64" r="24" fill={canopyLight} />
          <Coin x={82} y={86} />
          <Coin x={120} y={78} />
          <Coin x={101} y={104} r={9} />
          <SmallTree x={38} golden />
          <SmallTree x={162} golden />
          <path className="twinkle" d="M148 30 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#fef3c7" />
        </g>
      )}
    </svg>
  );
}
