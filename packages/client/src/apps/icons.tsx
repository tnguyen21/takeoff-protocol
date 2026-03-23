
import {
  Newspaper,
  Mail,
  Table,
  Activity,
  Lock,
  TrendingUp,
  Eye,
  Target,
  BookOpen,
  PenTool,
  StickyNote,
  Cpu,
  type LucideIcon,
} from "lucide-react";

// All icons use a uniform muted style — no brand colors
const BRAND_COLORS: Record<string, string> = {};

// SVG icon components
function SlackIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  );
}

function SignalIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
      <path d="M12.012 0C5.42 0 0 5.372 0 12.012c0 2.42.715 4.67 1.945 6.56L.723 23.112l4.68-1.21A11.98 11.98 0 0 0 12.012 24c6.6 0 12-5.4 12-11.988C24.012 5.4 18.612 0 12.012 0zm0 22.032a10.04 10.04 0 0 1-4.92-1.3l-.36-.215-3.48.9.93-3.39-.24-.36A10.12 10.12 0 0 1 1.98 12.012C1.98 6.468 6.468 1.98 12.012 1.98c5.544 0 10.02 4.488 10.02 10.032 0 5.544-4.488 10.02-10.02 10.02zm5.4-7.416c-.3-.156-1.8-.9-2.076-1.008-.276-.096-.48-.156-.696.156-.204.3-.84.996-1.02 1.2-.192.204-.372.228-.672.072-.3-.156-1.272-.48-2.424-1.536-.9-.804-1.5-1.8-1.68-2.1-.18-.3-.02-.456.132-.612.132-.132.3-.348.444-.528.156-.18.204-.3.312-.516.096-.204.06-.384-.024-.54-.084-.156-.696-1.68-.96-2.292-.252-.612-.516-.528-.696-.54l-.6-.012c-.204 0-.54.06-.828.324-.276.264-1.056 1.032-1.056 2.52 0 1.488 1.08 2.928 1.236 3.132.156.204 2.124 3.252 5.16 4.548.72.312 1.284.492 1.728.636.732.228 1.392.2 1.92.12.588-.084 1.8-.744 2.052-1.476.264-.732.264-1.356.18-1.476-.084-.12-.3-.18-.6-.324z"/>
    </svg>
  );
}

function XTwitterIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function WandBIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.8C6.255 22.8 1.2 17.745 1.2 12S6.255 1.2 12 1.2s10.8 5.055 10.8 10.8-5.055 10.8-10.8 10.8z"/>
      <path d="M5.5 8.5h2v7h-2zM9.5 6.5h2v11h-2zM13.5 9.5h2v5h-2z"/>
    </svg>
  );
}

// ── ComputeApp nav icons ──

export const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
);

export const ClustersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="2" width="14" height="3" rx="1" />
    <rect x="1" y="6.5" width="14" height="3" rx="1" />
    <rect x="1" y="11" width="14" height="3" rx="1" />
  </svg>
);

export const JobsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="3" y="3" width="10" height="1.5" rx="0.5" />
    <rect x="3" y="7" width="10" height="1.5" rx="0.5" />
    <rect x="3" y="11" width="6" height="1.5" rx="0.5" />
  </svg>
);

export const StorageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <ellipse cx="8" cy="4" rx="6" ry="2" />
    <path d="M2 4v4c0 1.1 2.7 2 6 2s6-.9 6-2V4" opacity="0.7" />
    <path d="M2 8v4c0 1.1 2.7 2 6 2s6-.9 6-2V8" opacity="0.45" />
  </svg>
);

export const AlertsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1.5 L14 12.5 H2 Z" />
    <rect x="7.25" y="5.5" width="1.5" height="4" rx="0.5" fill="#0d0d0d" />
    <circle cx="8" cy="11" r="0.85" fill="#0d0d0d" />
  </svg>
);

export const BillingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="3" width="14" height="10" rx="1.5" />
    <rect x="1" y="6" width="14" height="2.5" fill="#0d0d0d" opacity="0.6" />
    <rect x="3" y="9.5" width="3" height="1.5" rx="0.3" fill="#0d0d0d" opacity="0.6" />
  </svg>
);

// ── TwitterApp nav icons ──

export function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill={active ? "white" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function TwitterMailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" className="inline-block ml-0.5 text-blue-400" fill="currentColor">
      <circle cx="12" cy="12" r="11" fill="#1d9bf0" />
      <polyline points="7,12 10.5,15.5 17,9" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Map AppId to Lucide icons (for generic apps)
const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  news: Newspaper,
  email: Mail,
  sheets: Table,
  gamestate: Activity,
  security: Lock,
  bloomberg: TrendingUp,
  intel: Eye,
  military: Target,
  arxiv: BookOpen,
  substack: PenTool,
  memo: StickyNote,
  compute: Cpu,
};

// Brand icon components
const BRAND_ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  slack: SlackIcon,
  signal: SignalIcon,
  twitter: XTwitterIcon,
  wandb: WandBIcon,
};

// React component for rendering app icons
interface AppIconProps {
  appId: string;
  size?: number;
  className?: string;
  color?: string;
}

export function AppIcon({ appId, size = 24, className = "", color }: AppIconProps) {
  const BrandComponent = BRAND_ICON_COMPONENTS[appId];
  
  if (BrandComponent) {
    const brandColor = color || BRAND_COLORS[appId] || "currentColor";
    return (
      <div
        style={{ 
          width: size, 
          height: size, 
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        className={className}
      >
        <BrandComponent 
          style={{ width: size, height: size, color: brandColor }} 
        />
      </div>
    );
  }
  
  // Lucide icon fallback
  const LucideComponent = LUCIDE_ICON_MAP[appId];
  if (LucideComponent) {
    return <LucideComponent size={size} strokeWidth={1.5} className={className} color={color} />;
  }
  
  // Fallback to square
  return <span style={{ fontSize: size }}>□</span>;
}
