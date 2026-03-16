import { TeamTactic } from "../types";

export type EngineTacticProfile = "standard" | "arcade" | "pro";

const sanitizeCustomPositions = (
  customPositions?: Record<string, { x: number; y: number }>,
): Record<string, { x: number; y: number }> | undefined => {
  if (!customPositions) return undefined;

  const next = Object.entries(customPositions).reduce(
    (acc, [playerId, pos]) => {
      if (!pos) return acc;
      if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return acc;
      acc[playerId] = { x: pos.x, y: pos.y };
      return acc;
    },
    {} as Record<string, { x: number; y: number }>,
  );

  return Object.keys(next).length > 0 ? next : undefined;
};

const sanitizeSlotInstructions = (
  slotInstructions?: Record<number, string>,
): Record<number, string> | undefined => {
  if (!slotInstructions) return undefined;

  const next = Object.entries(slotInstructions).reduce(
    (acc, [slot, instruction]) => {
      if (!instruction) return acc;
      const slotNumber = Number(slot);
      if (!Number.isFinite(slotNumber)) return acc;
      acc[slotNumber] = instruction;
      return acc;
    },
    {} as Record<number, string>,
  );

  return Object.keys(next).length > 0 ? next : undefined;
};

const normalizeTacticPayload = (tactic: TeamTactic): TeamTactic => ({
  ...tactic,
  instructions: tactic.instructions?.filter(Boolean) || undefined,
  customPositions: sanitizeCustomPositions(tactic.customPositions),
  slotInstructions: sanitizeSlotInstructions(tactic.slotInstructions),
});

const mergeInstructions = (
  instructions: string[] | undefined,
  additions: string[],
): string[] | undefined => {
  const next = new Set((instructions || []).filter(Boolean));
  additions.forEach((instruction) => {
    if (instruction) next.add(instruction);
  });
  return next.size > 0 ? Array.from(next) : undefined;
};

const mapAttackPlanForLegacyEngines = (tactic: TeamTactic): TeamTactic => {
  const attackPlan = tactic.attackPlan || "AUTO";
  if (attackPlan === "AUTO") return tactic;

  let next: TeamTactic = { ...tactic };

  if (attackPlan === "WIDE_CROSS") {
    next = {
      ...next,
      instructions: mergeInstructions(next.instructions, ["HitEarlyCrosses"]),
      width: next.width === "Narrow" ? "Balanced" : next.width,
    };
  } else if (attackPlan === "CUTBACK") {
    next = {
      ...next,
      instructions: mergeInstructions(next.instructions, ["WorkBallIntoBox"]),
      width: next.width === "Narrow" ? "Balanced" : next.width,
    };
  } else if (attackPlan === "THIRD_MAN") {
    next = {
      ...next,
      instructions: mergeInstructions(next.instructions, [
        "WorkBallIntoBox",
        "RoamFromPosition",
      ]),
    };
  } else if (attackPlan === "DIRECT_CHANNEL") {
    next = {
      ...next,
      passingStyle:
        next.passingStyle === "LongBall" ? next.passingStyle : "Direct",
      instructions: mergeInstructions(next.instructions, ["RoamFromPosition"]),
    };
  }

  return next;
};

export const adaptTacticForEngine = (
  tactic: TeamTactic,
  profile: EngineTacticProfile,
): TeamTactic => {
  const normalized = normalizeTacticPayload(tactic);

  if (profile === "pro") {
    return {
      ...normalized,
      attackPlan: normalized.attackPlan || "AUTO",
    };
  }

  return mapAttackPlanForLegacyEngines(normalized);
};