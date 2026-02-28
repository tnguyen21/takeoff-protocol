import type { AppId } from "@takeoff/shared";
import {
  MessageSquare,
  Shield,
  LineChart,
  Newspaper,
  AtSign,
  Mail,
  Table,
  Activity,
  Lock,
  TrendingUp,
  FileText,
  MessageCircle,
  Eye,
  Target,
  BookOpen,
  PenTool,
  StickyNote,
  Cpu,
  type LucideIcon,
} from "lucide-react";

export const APP_ICON_MAP: Record<AppId, LucideIcon> = {
  slack: MessageSquare,
  signal: Shield,
  wandb: LineChart,
  news: Newspaper,
  twitter: AtSign,
  email: Mail,
  sheets: Table,
  gamestate: Activity,
  security: Lock,
  bloomberg: TrendingUp,
  briefing: FileText,
  wechat: MessageCircle,
  intel: Eye,
  military: Target,
  arxiv: BookOpen,
  substack: PenTool,
  memo: StickyNote,
  compute: Cpu,
};

export function getAppIcon(appId: string): LucideIcon | undefined {
  return APP_ICON_MAP[appId as AppId];
}
