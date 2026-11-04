import { useId, type CSSProperties } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export type LogoVariant = 'root' | 'quranic' | 'private' | 'kindergarten';

const GLOW: Record<LogoVariant, string> = {
  root: 'rgba(99,102,241,0.45)',
  quranic: 'rgba(245,158,11,0.5)',
  private: 'rgba(99,102,241,0.45)',
  kindergarten: 'rgba(16,185,129,0.45)',
};

interface StarProps {
  x: number;
  y: number;
  r?: number;
  fill?: string;
}

function Sparkle({ x, y, r = 3, fill = '#fde68a' }: StarProps) {
  return (
    <path
      d={`M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`}
      fill={fill}
    />
  );
}

interface EmblemProps {
  variant: LogoVariant;
  uid: string;
}

function Emblem({ variant, uid }: EmblemProps) {
  switch (variant) {
    case 'quranic':
      return (
        <svg viewBox="0 0 100 100" fill="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <radialGradient id={`${uid}bg`} cx="0.35" cy="0.2" r="0.95">
              <stop offset="0" stopColor="#fbbf24" />
              <stop offset="0.45" stopColor="#b45309" />
              <stop offset="1" stopColor="#78350f" />
            </radialGradient>
            <linearGradient id={`${uid}gold`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fffbeb" />
              <stop offset="0.55" stopColor="#fde68a" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
            <clipPath id={`${uid}clip`}><circle cx="50" cy="50" r="50" /></clipPath>
          </defs>
          <g clipPath={`url(#${uid}clip)`}>
            <circle cx="50" cy="50" r="50" fill={`url(#${uid}bg)`} />
            <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(255,251,235,0.25)" strokeWidth="1" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="rgba(255,251,235,0.4)" strokeWidth="1.4" strokeDasharray="4 7"
              strokeLinecap="round"
            >
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="22s" repeatCount="indefinite" />
            </circle>
            <g fill="rgba(255,251,235,0.09)">
              <circle cx="18" cy="22" r="1.6" />
              <circle cx="82" cy="18" r="1.6" />
              <circle cx="24" cy="76" r="1.6" />
              <circle cx="76" cy="80" r="1.6" />
              <circle cx="14" cy="50" r="1.4" />
              <circle cx="86" cy="46" r="1.4" />
            </g>
            {/* minarets */}
            <g fill={`url(#${uid}gold)`}>
              <rect x="21" y="38" width="7" height="26" rx="3" />
              <path d="M21 38 Q24.5 30 28 38 Z" />
              <line x1="24.5" y1="30" x2="24.5" y2="23" stroke="#fde68a" strokeWidth="2" />
              <circle cx="24.5" cy="20.5" r="2" fill="#fde68a" />
              <rect x="73" y="38" width="7" height="26" rx="3" />
              <path d="M73 38 Q76.5 30 80 38 Z" />
              <line x1="76.5" y1="30" x2="76.5" y2="23" stroke="#fde68a" strokeWidth="2" />
              <circle cx="76.5" cy="20.5" r="2" fill="#fde68a" />
            </g>
            {/* crescent + star above dome */}
            <path d="M57 7 A 8 8 0 1 0 64 14 A 6.4 6.4 0 0 1 57 7 Z" fill="#fde68a" />
            <Sparkle x={69} y={9} r={2.4} fill="#fde68a" />
            {/* dome */}
            <path d="M50 14 Q 60 24 60 34 L40 34 Q40 24 50 14 Z" fill={`url(#${uid}gold)`} />
            <path d="M50 24 Q 55 27 55 33 L45 33 Q45 27 50 24 Z" fill="rgba(120,53,15,0.25)" />
            <rect x="40" y="34" width="20" height="4" rx="2" fill="#fde68a" />
            {/* hall */}
            <path d="M50 38 L33 44 V64 H67 V44 Z" fill="rgba(255,251,235,0.92)" />
            <path d="M50 38 L67 44 H33 Z" fill="#fde68a" opacity="0.55" />
            {/* door */}
            <path d="M50 64 V52 Q 56 46 56 52 V64 Z" fill="#92400e" />
            <path d="M44 64 V52 Q 50 46 50 52 V64 Z" fill="#78350f" />
            {/* windows */}
            <path d="M39 48 Q 41 45 43 48 V58 H39 Z" fill="#b45309" />
            <path d="M57 48 Q 59 45 61 48 V58 H57 Z" fill="#b45309" />
            {/* open book */}
            <path d="M50 67 L35 71.5 V76 L50 72.5 L65 76 V71.5 Z" fill="#fff7ed" />
            <path d="M50 67 V72.5" stroke="#b45309" strokeWidth="1.5" />
            <Sparkle x={20} y={16} r={2.2} fill="#fde68a" />
            <Sparkle x={80} y={26} r={2.6} fill="#fde68a" />
            <Sparkle x={30} y={8} r={1.8} fill="#fde68a" />
          </g>
        </svg>
      );
    case 'private':
      return (
        <svg viewBox="0 0 100 100" fill="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <radialGradient id={`${uid}bg`} cx="0.35" cy="0.2" r="0.95">
              <stop offset="0" stopColor="#818cf8" />
              <stop offset="0.45" stopColor="#4f46e5" />
              <stop offset="1" stopColor="#312e81" />
            </radialGradient>
            <linearGradient id={`${uid}light`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#c7d2fe" />
            </linearGradient>
            <clipPath id={`${uid}clip`}><circle cx="50" cy="50" r="50" /></clipPath>
          </defs>
          <g clipPath={`url(#${uid}clip)`}>
            <circle cx="50" cy="50" r="50" fill={`url(#${uid}bg)`} />
            <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(238,242,255,0.2)" strokeWidth="1" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="rgba(238,242,255,0.35)" strokeWidth="1.4" strokeDasharray="3 8"
              strokeLinecap="round"
            >
              <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="20s" repeatCount="indefinite" />
            </circle>
            {/* sun rays behind */}
            <g stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round">
              <line x1="50" y1="8" x2="50" y2="16" />
              <line x1="50" y1="86" x2="50" y2="94" />
              <line x1="14" y1="50" x2="22" y2="50" />
              <line x1="78" y1="50" x2="86" y2="50" />
              <line x1="25" y1="25" x2="30" y2="30" />
              <line x1="70" y1="70" x2="75" y2="75" />
              <line x1="75" y1="25" x2="70" y2="30" />
              <line x1="25" y1="75" x2="30" y2="70" />
            </g>
            <g fill="rgba(238,242,255,0.1)">
              <circle cx="20" cy="18" r="1.5" />
              <circle cx="80" cy="82" r="1.5" />
              <circle cx="84" cy="20" r="1.5" />
              <circle cx="16" cy="80" r="1.5" />
            </g>
            {/* laurel left */}
            <g stroke={`url(#${uid}light)`} strokeWidth="2.2" strokeLinecap="round" opacity="0.95">
              <path d="M24 56 Q 20 44 26 34" fill="none" />
              <path d="M25 47 Q 32 47 31 40" fill="none" />
              <path d="M23 40 Q 29 38 29 32" fill="none" />
              <path d="M26 33 Q 32 34 33 28" fill="none" />
            </g>
            {/* laurel right */}
            <g stroke={`url(#${uid}light)`} strokeWidth="2.2" strokeLinecap="round" opacity="0.95">
              <path d="M76 56 Q 80 44 74 34" fill="none" />
              <path d="M75 47 Q 68 47 69 40" fill="none" />
              <path d="M77 40 Q 71 38 71 32" fill="none" />
              <path d="M74 33 Q 68 34 67 28" fill="none" />
            </g>
            {/* open book */}
            <path d="M50 66 L34 71 V76 L50 72 L66 76 V71 Z" fill={`url(#${uid}light)`} />
            <path d="M50 66 V72" stroke="#4338ca" strokeWidth="1.6" />
            {/* graduation cap */}
            <path d="M50 24 L24 35 L50 46 L76 35 Z" fill="#ffffff" />
            <path d="M34 40.5 V47 C34 50 41 52 50 52 S66 50 66 47 V40.5" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M76 35 V43" stroke="#fde68a" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="76" cy="45" r="2.4" fill="#fde68a" />
            <path d="M50 24 L50 15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <Sparkle x={50} y={10} r={2.6} fill="#fde68a" />
            <Sparkle x={24} y={24} r={2} fill="#e0e7ff" />
            <Sparkle x={76} y={26} r={2} fill="#e0e7ff" />
          </g>
        </svg>
      );
    case 'kindergarten':
      return (
        <svg viewBox="0 0 100 100" fill="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <radialGradient id={`${uid}bg`} cx="0.35" cy="0.2" r="0.95">
              <stop offset="0" stopColor="#34d399" />
              <stop offset="0.45" stopColor="#10b981" />
              <stop offset="1" stopColor="#047857" />
            </radialGradient>
            <linearGradient id={`${uid}pink`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f9a8d4" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
            <clipPath id={`${uid}clip`}><circle cx="50" cy="50" r="50" /></clipPath>
          </defs>
          <g clipPath={`url(#${uid}clip)`}>
            <circle cx="50" cy="50" r="50" fill={`url(#${uid}bg)`} />
            <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(236,253,245,0.25)" strokeWidth="1" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="rgba(236,253,245,0.4)" strokeWidth="1.6" strokeDasharray="6 6"
              strokeLinecap="round"
            >
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="16s" repeatCount="indefinite" />
            </circle>
            {/* rainbow */}
            <path d="M18 62 A 32 32 0 0 1 82 62" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
            <path d="M24 62 A 26 26 0 0 1 76 62" stroke="#fff7ed" strokeWidth="4" strokeLinecap="round" />
            <path d="M30 62 A 20 20 0 0 1 70 62" stroke="#fda4af" strokeWidth="4" strokeLinecap="round" />
            {/* clouds */}
            <g fill="rgba(255,255,255,0.85)">
              <path d="M24 22 a6 6 0 0 1 6 -6 h2 a7 7 0 0 1 13 0 h3 a6 6 0 0 1 0 12 h-24 a5.5 5.5 0 0 1 0 -6 Z" />
            </g>
            {/* sun */}
            <g stroke="#fde68a" strokeWidth="2.6" strokeLinecap="round">
              <line x1="78" y1="24" x2="78" y2="16" />
              <line x1="78" y1="24" x2="86" y2="24" />
              <line x1="88" y1="16" x2="93" y2="11" />
              <line x1="70" y1="16" x2="73" y2="12" />
            </g>
            <circle cx="78" cy="24" r="9.5" fill="#fbbf24" />
            <circle cx="75" cy="22.5" r="1.7" fill="#78350f" />
            <circle cx="81.5" cy="22.5" r="1.7" fill="#78350f" />
            <path d="M74 27.5 A 4 4 0 0 0 82 27.5" stroke="#78350f" strokeWidth="1.7" strokeLinecap="round" />
            {/* balloons */}
            <g>
              <path d="M20 60 C 20 48 28 44 32 44 C 36 44 44 48 44 60 Z" fill={`url(#${uid}pink)`} />
              <path d="M24 59.5 C 24 55 28 51 32 51 C 36 51 40 55 40 59.5 Z" fill="rgba(255,255,255,0.35)" />
              <path d="M32 60 L31 70" stroke="rgba(236,253,245,0.8)" strokeWidth="1.4" />
              <path d="M61 40 C 61 28 69 24 73 24 C 77 24 85 28 85 40 Z" fill="#fcd34d" />
              <path d="M73 40 L72 50" stroke="rgba(236,253,245,0.8)" strokeWidth="1.4" />
              <path d="M40 74 C 40 62 48 58 52 58 C 56 58 64 62 64 74 Z" fill="#a7f3d0" />
              <path d="M52 74 L51 82" stroke="rgba(236,253,245,0.8)" strokeWidth="1.4" />
            </g>
            {/* stars */}
            <Sparkle x={16} y={14} r={3} fill="#fde68a" />
            <Sparkle x={62} y={12} r={2.4} fill="#fde68a" />
            <Sparkle x={46} y={70} r={2.4} fill="#fef3c7" />
            <Sparkle x={86} y={78} r={2.8} fill="#fde68a" />
          </g>
        </svg>
      );
    case 'root':
    default:
      return (
        <svg viewBox="0 0 100 100" fill="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <radialGradient id={`${uid}bg`} cx="0.35" cy="0.2" r="0.95">
              <stop offset="0" stopColor="#a855f7" />
              <stop offset="0.5" stopColor="#6366f1" />
              <stop offset="1" stopColor="#312e81" />
            </radialGradient>
            <linearGradient id={`${uid}globe`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#a5b4fc" />
            </linearGradient>
            <clipPath id={`${uid}clip`}><circle cx="50" cy="50" r="50" /></clipPath>
          </defs>
          <g clipPath={`url(#${uid}clip)`}>
            <circle cx="50" cy="50" r="50" fill={`url(#${uid}bg)`} />
            <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(238,242,255,0.22)" strokeWidth="1" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="rgba(238,242,255,0.38)" strokeWidth="1.4" strokeDasharray="4 7"
              strokeLinecap="round"
            >
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
            </circle>
            <g fill="rgba(238,242,255,0.1)">
              <circle cx="20" cy="24" r="1.6" />
              <circle cx="82" cy="20" r="1.6" />
              <circle cx="18" cy="74" r="1.6" />
              <circle cx="84" cy="70" r="1.6" />
            </g>
            {/* graduation cap */}
            <path d="M50 22 L27 33 L50 44 L73 33 Z" fill="#ffffff" />
            <path d="M37 38.5 V45 C37 47.8 43 49.8 50 49.8 S63 47.8 63 45 V38.5" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M73 33 V41" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="73" cy="43" r="2.2" fill="#fde68a" />
            {/* globe */}
            <circle cx="50" cy="52" r="21" fill={`url(#${uid}globe)`} opacity="0.97" />
            <ellipse cx="50" cy="52" rx="9.5" ry="21" fill="none" stroke="#6366f1" strokeWidth="1.4" opacity="0.75" />
            <ellipse cx="50" cy="52" rx="21" ry="9" fill="none" stroke="#6366f1" strokeWidth="1.4" opacity="0.75" />
            <path d="M50 31 A 21 21 0 0 1 70 47 A 12 12 0 0 0 50 41 A 12 12 0 0 0 30 47 A 21 21 0 0 1 50 31 Z" fill="rgba(99,102,241,0.2)" />
            {/* three tiles */}
            <g>
              <rect x="29" y="78" width="11" height="11" rx="3" fill="rgba(255,255,255,0.95)" />
              <rect x="44.5" y="78" width="11" height="11" rx="3" fill="rgba(255,255,255,0.75)" />
              <rect x="60" y="78" width="11" height="11" rx="3" fill="rgba(255,255,255,0.95)" />
            </g>
            <Sparkle x={32} y={30} r={2.4} fill="#fde68a" />
            <Sparkle x={70} y={26} r={2} fill="#e0e7ff" />
            <Sparkle x={26} y={62} r={2} fill="#e0e7ff" />
          </g>
        </svg>
      );
  }
}

interface SchoolLogoProps {
  variant?: LogoVariant;
  size?: number;
  withTitle?: boolean;
  title?: string;
  subtitle?: string;
  animate?: boolean;
  glow?: boolean;
  titleColor?: string;
  style?: CSSProperties;
}

export default function SchoolLogo({
  variant = 'root',
  size = 40,
  withTitle = false,
  title,
  subtitle,
  animate = true,
  glow = true,
  titleColor,
  style,
}: SchoolLogoProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const logo = (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.38)',
        outline: '1px solid rgba(16,24,40,0.07)',
        outlineOffset: -1,
        boxShadow: glow
          ? `inset 0 1px 0 rgba(255,255,255,0.45), 0 ${size * 0.12}px ${size * 0.32}px -${size * 0.08}px ${GLOW[variant]}, 0 2px 6px rgba(16,24,40,0.14)`
          : 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 3px rgba(16,24,40,0.14)',
      }}
    >
      <Emblem variant={variant} uid={uid} />
    </Box>
  );

  const inner = withTitle ? (
    <Box display="flex" alignItems="center" gap={1.25} sx={style}>
      {logo}
      <Box sx={{ overflow: 'hidden' }}>
        <Typography
          noWrap
          variant="subtitle1"
          fontWeight={700}
          sx={{ lineHeight: 1.25, letterSpacing: '-0.012em', color: titleColor || 'inherit', fontSize: withTitle && size < 36 ? '0.95rem' : undefined }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography noWrap variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4, letterSpacing: '0.01em' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  ) : (
    <Box sx={style}>{logo}</Box>
  );

  if (!animate) return inner;

  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ display: 'inline-block' }}
    >
      {inner}
    </motion.div>
  );
}
