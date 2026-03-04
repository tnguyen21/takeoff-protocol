import type { AppContent, Faction, GameRoom, GeneratedRoundArtifacts, GenerationStatus, NpcTrigger } from "@takeoff/shared";

function ensureGeneratedRounds(room: GameRoom): Partial<Record<number, GeneratedRoundArtifacts>> {
  if (!room.generatedRounds) room.generatedRounds = {};
  return room.generatedRounds;
}

function ensureGenerationStatus(room: GameRoom): Partial<Record<number, GenerationStatus>> {
  if (!room.generationStatus) room.generationStatus = {};
  return room.generationStatus;
}

export function setGeneratedBriefing(
  room: GameRoom,
  round: number,
  briefing: { common: string; factionVariants: Record<Faction, string> },
): void {
  const rounds = ensureGeneratedRounds(room);
  if (!rounds[round]) rounds[round] = {};
  rounds[round]!.briefing = briefing;
}

export function getGeneratedBriefing(
  room: GameRoom,
  round: number,
): { common: string; factionVariants: Record<Faction, string> } | undefined {
  return room.generatedRounds?.[round]?.briefing;
}

export function setGeneratedContent(
  room: GameRoom,
  round: number,
  faction: Faction,
  content: AppContent[],
): void {
  const rounds = ensureGeneratedRounds(room);
  if (!rounds[round]) rounds[round] = {};
  if (!rounds[round]!.content) rounds[round]!.content = {};
  rounds[round]!.content![faction] = content;
}

export function getGeneratedContent(
  room: GameRoom,
  round: number,
  faction: Faction,
): AppContent[] | undefined {
  return room.generatedRounds?.[round]?.content?.[faction];
}

export function setGeneratedNpcTriggers(room: GameRoom, round: number, triggers: NpcTrigger[]): void {
  const rounds = ensureGeneratedRounds(room);
  if (!rounds[round]) rounds[round] = {};
  rounds[round]!.npcTriggers = triggers;
}

export function getGeneratedNpcTriggers(room: GameRoom, round: number): NpcTrigger[] | undefined {
  return room.generatedRounds?.[round]?.npcTriggers;
}

export function setGenerationStatus(room: GameRoom, round: number, status: GenerationStatus): void {
  const statuses = ensureGenerationStatus(room);
  const current = statuses[round];

  // Status is immutable once terminal (ready or failed)
  if (current === "ready" || current === "failed") return;

  statuses[round] = status;
}

export function getGenerationStatus(room: GameRoom, round: number): GenerationStatus | undefined {
  return room.generationStatus?.[round];
}
