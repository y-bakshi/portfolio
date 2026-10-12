import { useId } from 'react';

const turns = (n: number) => Array.from({ length: n }, (_, i) => (360 / n) * i);

/** The drawn back of a card: gold line work on the card face, with a ribbon across the middle for the name. */
export function CardArt() {
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
      {[48, 260].map((y) => (
        <g key={y} strokeWidth="1">
          <path d={`M110 ${y - 6}l5 6-5 6-5-6z`} />
          <path d={`M92 ${y}h10M118 ${y}h10`} />
        </g>
      ))}

      {/* the medallion: rings, then a rosette of petals */}
      <g transform="translate(110 154)">
        <circle r="72" className="plate" strokeWidth="1.9" />
        <circle r="67" strokeWidth="1.5" strokeDasharray="0.1 3.6" />
        <circle r="62" strokeWidth="1" />
        {turns(16).map((a) => (
          <ellipse key={a} cy="-46" rx="6.5" ry="15" strokeWidth="0.9" transform={`rotate(${a})`} />
        ))}
        {turns(8).map((a) => (
          <ellipse
            key={a}
            cy="-27"
            rx="5"
            ry="11"
            strokeWidth="0.9"
            transform={`rotate(${a + 22.5})`}
          />
        ))}
        <circle r="15" className="plate" strokeWidth="1.2" />
      </g>

      {/* the ribbon the name sits on, with swallow tails */}
      <path className="plate" d="M14 130H206L197 154L206 178H14L23 154Z" strokeWidth="1.9" />
      <path d="M20 135H200L193 154L200 173H20L27 154Z" strokeWidth="0.8" />
    </svg>
  );
}
