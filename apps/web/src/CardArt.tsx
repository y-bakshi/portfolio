import { useId } from 'react';

const turns = (n: number) => Array.from({ length: n }, (_, i) => (360 / n) * i);

export type CardKind = 'eye' | 'shield' | 'compass' | 'page' | 'cat';

/** The emblem inside the medallion, drawn around (0, 0) within a radius of about 52. */
function Emblem({ kind }: { kind: CardKind }) {
  if (kind === 'eye') {
    // an all-seeing eye with rays around it
    return (
      <g>
        {turns(24).map((a, i) => (
          <path
            key={a}
            d={`M0 -32V${i % 2 ? -44 : -52}`}
            strokeWidth={i % 2 ? 1 : 1.6}
            transform={`rotate(${a})`}
          />
        ))}
        <path d="M-27 0Q0 -24 27 0Q0 24 -27 0Z" className="plate" strokeWidth="1.7" />
        <path d="M-22 -17Q0 -32 22 -17" strokeWidth="1.1" />
        {[-16, -8, 0, 8, 16].map((x) => (
          <path key={x} d={`M${x} ${-17 - (16 - Math.abs(x)) / 4}l${x / 5} -4`} strokeWidth="0.9" />
        ))}
        <circle r="10" strokeWidth="1.3" />
        <circle r="5.5" fill="currentColor" />
        <circle cx="-2" cy="-2" r="1.6" className="plate" stroke="none" />
      </g>
    );
  }
  if (kind === 'shield') {
    // a shield, with a second line inside it and a four-point star
    return (
      <g>
        <path
          d="M-34 -30Q-12 -30 0 -42Q12 -30 34 -30V2C34 28 14 42 0 50C-14 42 -34 28 -34 2Z"
          className="plate"
          strokeWidth="1.8"
        />
        <path
          d="M-28 -24Q-10 -24 0 -34Q10 -24 28 -24V2C28 24 12 36 0 43C-12 36 -28 24 -28 2Z"
          strokeWidth="0.9"
        />
        <path d="M0 -22L5 -3L24 0L5 3L0 22L-5 3L-24 0L-5 -3Z" strokeWidth="1.3" />
        <circle r="2.2" fill="currentColor" />
        <path d="M-16 -14l3 3M16 -14l-3 3M-16 14l3 -3M16 14l-3 -3" strokeWidth="0.9" />
      </g>
    );
  }
  if (kind === 'compass') {
    // a compass rose with a check mark in the middle
    const pts = Array.from({ length: 16 }, (_, k) => {
      const r = k % 4 === 0 ? 50 : k % 2 === 0 ? 32 : 11;
      const t = (k * 22.5 * Math.PI) / 180;
      return `${(Math.sin(t) * r).toFixed(1)},${(-Math.cos(t) * r).toFixed(1)}`;
    }).join(' ');
    return (
      <g>
        <circle r="38" strokeWidth="0.9" strokeDasharray="0.1 3" />
        {turns(24).map((a) => (
          <path key={a} d="M0 -53V-57" strokeWidth="1" transform={`rotate(${a})`} />
        ))}
        <polygon points={pts} className="plate" strokeWidth="1.5" />
        <path d="M0 -50V0M0 50V0M-50 0H0M50 0H0" strokeWidth="0.8" />
        <circle r="9" className="plate" strokeWidth="1.4" />
        <path d="M-4 0.5L-1 3.5L4.5 -3" strokeWidth="1.8" />
      </g>
    );
  }
  if (kind === 'page') {
    // a résumé page with a folded corner and a quill across it
    return (
      <g>
        <path d="M-27 -40H13L27 -26V40H-27Z" className="plate" strokeWidth="1.7" />
        <path d="M13 -40V-26H27" strokeWidth="1.2" />
        <path d="M-18 -26H2" strokeWidth="2.2" />
        <path d="M-18 -14H18M-18 -6H18M-18 2H10M-18 10H18M-18 18H6" strokeWidth="1" />
        <g transform="translate(18 6) rotate(32)">
          <path
            d="M0 -46C16 -34 16 -6 0 20C-13 0 -13 -30 0 -46Z"
            className="plate"
            strokeWidth="1.3"
          />
          <path d="M0 -44V30" strokeWidth="1.1" />
          <path
            d="M0 -30l7 5M0 -22l8 5M0 -14l8 5M0 -6l7 5M0 -30l-7 5M0 -22l-8 5M0 -14l-8 5M0 -6l-7 5"
            strokeWidth="0.7"
          />
          <path d="M0 30L-2.5 36L0 34L2.5 36Z" fill="currentColor" />
        </g>
      </g>
    );
  }
  // a cat's face with whiskers
  return (
    <g>
      <path
        d="M-30 -6L-27 -40L-9 -26Q0 -29 9 -26L27 -40L30 -6Q35 14 14 28Q0 34 -14 28Q-35 14 -30 -6Z"
        className="plate"
        strokeWidth="1.8"
      />
      <path d="M-24 -30L-12 -23M24 -30L12 -23" strokeWidth="1" />
      {[-14, 14].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="-4" rx="6" ry="7" strokeWidth="1.3" />
          <path d={`M${x} -9V1`} strokeWidth="2.2" />
        </g>
      ))}
      <path d="M-3.5 7H3.5L0 11.5Z" fill="currentColor" />
      <path d="M0 11.5V16M0 16Q-5 20 -10 16M0 16Q5 20 10 16" strokeWidth="1.2" />
      <path d="M-20 9L-48 4M-20 13L-48 15M20 9L48 4M20 13L48 15" strokeWidth="1" />
    </g>
  );
}

/** The drawn back of a card: gold line work on the card face, with a ribbon across the middle for the name. */
export function CardArt({ kind }: { kind: CardKind }) {
  const id = useId();
  return (
    <svg
      className="card-art"
      viewBox="0 0 220 308"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={`${id}-cross`} width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M4.5 2.8v3.4M2.8 4.5h3.4" strokeWidth="0.8" />
        </pattern>
      </defs>

      {/* the frame, with a dotted line inside it */}
      <rect x="7" y="7" width="206" height="294" rx="10" strokeWidth="1.7" />
      <rect
        x="12"
        y="12"
        width="196"
        height="284"
        rx="7"
        strokeWidth="1.3"
        strokeDasharray="0.1 3.4"
      />

      {/* the patterned field behind the medallion */}
      <rect
        x="18"
        y="50"
        width="184"
        height="208"
        stroke="none"
        fill={`url(#${id}-cross)`}
        opacity="0.7"
      />

      {/* a row of diamonds along the top and the bottom, between the corners */}
      {[0, 1, 2, 3, 4, 5, 6].flatMap((i) => {
        const x = 62 + i * 16;
        return [28, 280].map((y) => (
          <path key={`${i}-${y}`} d={`M${x} ${y - 5}l3.5 5-3.5 5-3.5-5z`} strokeWidth="1" />
        ));
      })}
      <path d="M44 28H56M164 28H176M44 280H56M164 280H176" strokeWidth="1" />

      {/* a flower in a small square in the two corners that do not carry the rank */}
      {[
        [172, 16],
        [20, 264],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <rect width="28" height="28" rx="2" strokeWidth="1.3" />
          <rect x="3.5" y="3.5" width="21" height="21" rx="1" strokeWidth="0.7" />
          {[0, 45, 90, 135].map((a) => (
            <ellipse
              key={a}
              cx="14"
              cy="14"
              rx="2.4"
              ry="7"
              strokeWidth="0.9"
              transform={`rotate(${a} 14 14)`}
            />
          ))}
          <circle cx="14" cy="14" r="2" strokeWidth="1" />
        </g>
      ))}

      {/* small fleurons above and below the medallion */}
      {[48, 262].map((y) => (
        <g key={y} strokeWidth="1">
          <path d={`M110 ${y - 6}l5 6-5 6-5-6z`} />
          <path d={`M92 ${y}h10M118 ${y}h10`} />
        </g>
      ))}

      {/* the medallion: three rings around the card's emblem */}
      <g transform="translate(110 128)">
        <circle r="66" className="plate" strokeWidth="1.9" />
        <circle r="61" strokeWidth="1.5" strokeDasharray="0.1 3.6" />
        <circle r="57" strokeWidth="1" />
        <Emblem kind={kind} />
      </g>

      {/* the ribbon the name sits on, with swallow tails */}
      <path className="plate" d="M14 202H206L197 223L206 244H14L23 223Z" strokeWidth="1.9" />
      <path d="M20 207H200L193 223L200 239H20L27 223Z" strokeWidth="0.8" />
    </svg>
  );
}
