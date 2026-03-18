
import {
  Newspaper,
  Mail,
  Table,
  Activity,
  Lock,
  TrendingUp,
  FileText,
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

// Map AppId to Lucide icons (for generic apps)
const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  news: Newspaper,
  email: Mail,
  sheets: Table,
  gamestate: Activity,
  security: Lock,
  bloomberg: TrendingUp,
  briefing: FileText,
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

function getAppBrandColor(appId: string): string | undefined {
  return BRAND_COLORS[appId];
}

function isBrandIcon(appId: string): boolean {
  return appId in BRAND_ICON_COMPONENTS;
}

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
