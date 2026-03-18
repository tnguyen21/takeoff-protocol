import type React from "react";
import type { AppId, ContentItem } from "@takeoff/shared";

import { SlackApp } from "./SlackApp.js";
import { SignalApp } from "./SignalApp.js";
import { WandBApp } from "./WandBApp.js";
import { NewsApp } from "./NewsApp.js";
import { TwitterApp } from "./TwitterApp.js";
import { EmailApp } from "./EmailApp.js";
import { SheetsApp } from "./SheetsApp.js";
import { GameStateApp } from "./GameStateApp.js";
import { BloombergApp } from "./BloombergApp.js";
import { IntelApp } from "./IntelApp.js";
import { SecurityApp } from "./SecurityApp.js";
import { MilitaryApp } from "./MilitaryApp.js";
import { ArxivApp } from "./ArxivApp.js";
import { SubstackApp } from "./SubstackApp.js";
import { MemoApp } from "./MemoApp.js";
import { ComputeApp } from "./ComputeApp.js";
import { BriefingApp } from "./BriefingApp.js";

export const APP_COMPONENTS: Record<AppId, React.ComponentType<{ content: ContentItem[] }>> = {
  slack: SlackApp,
  signal: SignalApp,
  wandb: WandBApp,
  news: NewsApp,
  twitter: TwitterApp,
  email: EmailApp,
  sheets: SheetsApp,
  gamestate: GameStateApp,
  security: SecurityApp,
  bloomberg: BloombergApp,
  briefing: BriefingApp,
  intel: IntelApp,
  military: MilitaryApp,
  arxiv: ArxivApp,
  substack: SubstackApp,
  memo: MemoApp,
  compute: ComputeApp,
};
