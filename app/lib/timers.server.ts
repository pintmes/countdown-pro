import prisma from "../db.server";

export type TimerType = "flash_sale" | "evergreen" | "daily";
export type TimerPlacement = "announcement_bar" | "product" | "cart";
export type TimerTargetType = "all" | "product" | "collection";

export const TIMER_TYPES: ReadonlyArray<TimerType> = [
  "flash_sale",
  "evergreen",
  "daily",
];
export const TIMER_PLACEMENTS: ReadonlyArray<TimerPlacement> = [
  "announcement_bar",
  "product",
  "cart",
];
export const TIMER_TARGETS: ReadonlyArray<TimerTargetType> = [
  "all",
  "product",
  "collection",
];

export interface TimerInput {
  name: string;
  type: TimerType;
  endsAt: Date | null;
  durationSeconds: number | null;
  placement: TimerPlacement;
  targetType: TimerTargetType;
  targetIds: string[];
  headline: string;
  subtext: string;
  endedText: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  showDays: boolean;
  hideWhenEnded: boolean;
  active: boolean;
}

export interface TimerValidationError {
  field: keyof TimerInput;
  message: string;
}

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function validateTimerInput(input: TimerInput): TimerValidationError[] {
  const errors: TimerValidationError[] = [];

  if (!input.name.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  } else if (input.name.length > 80) {
    errors.push({ field: "name", message: "Name must be 80 characters or fewer" });
  }

  if (!TIMER_TYPES.includes(input.type)) {
    errors.push({ field: "type", message: "Invalid timer type" });
  }

  if (input.type === "flash_sale") {
    if (!input.endsAt) {
      errors.push({ field: "endsAt", message: "End date is required for flash sale timers" });
    } else if (input.endsAt.getTime() <= Date.now()) {
      errors.push({ field: "endsAt", message: "End date must be in the future" });
    }
  }

  if (input.type === "evergreen" || input.type === "daily") {
    if (!input.durationSeconds || input.durationSeconds < 60) {
      errors.push({
        field: "durationSeconds",
        message: "Duration must be at least 1 minute (60 seconds)",
      });
    } else if (input.durationSeconds > 60 * 60 * 24 * 30) {
      errors.push({
        field: "durationSeconds",
        message: "Duration must be 30 days or less",
      });
    }
  }

  if (!TIMER_PLACEMENTS.includes(input.placement)) {
    errors.push({ field: "placement", message: "Invalid placement" });
  }

  if (!TIMER_TARGETS.includes(input.targetType)) {
    errors.push({ field: "targetType", message: "Invalid target type" });
  }

  if (input.targetType !== "all" && input.targetIds.length === 0) {
    errors.push({
      field: "targetIds",
      message: "Select at least one product or collection",
    });
  }

  for (const [field, value] of [
    ["backgroundColor", input.backgroundColor],
    ["textColor", input.textColor],
    ["accentColor", input.accentColor],
  ] as const) {
    if (!HEX_COLOR.test(value)) {
      errors.push({
        field,
        message: `${field} must be a hex color (e.g. #111827)`,
      });
    }
  }

  if (input.headline.length > 120) {
    errors.push({ field: "headline", message: "Headline must be 120 characters or fewer" });
  }
  if (input.subtext.length > 200) {
    errors.push({ field: "subtext", message: "Subtext must be 200 characters or fewer" });
  }
  if (input.endedText.length > 200) {
    errors.push({ field: "endedText", message: "Ended text must be 200 characters or fewer" });
  }

  return errors;
}

export function parseFormToTimerInput(formData: FormData): TimerInput {
  const get = (key: string): string => String(formData.get(key) ?? "").trim();
  const getBool = (key: string): boolean => formData.get(key) === "on" || formData.get(key) === "true";
  const targetIdsRaw = get("targetIds");
  const targetIds = targetIdsRaw
    ? targetIdsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const endsAtRaw = get("endsAt");
  const durationRaw = get("durationSeconds");

  return {
    name: get("name"),
    type: (get("type") || "flash_sale") as TimerType,
    endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
    durationSeconds: durationRaw ? Number.parseInt(durationRaw, 10) : null,
    placement: (get("placement") || "announcement_bar") as TimerPlacement,
    targetType: (get("targetType") || "all") as TimerTargetType,
    targetIds,
    headline: get("headline") || "Hurry! Sale ends in",
    subtext: get("subtext") || "Don't miss out on this deal",
    endedText: get("endedText") || "This offer has ended",
    backgroundColor: get("backgroundColor") || "#111827",
    textColor: get("textColor") || "#FFFFFF",
    accentColor: get("accentColor") || "#F59E0B",
    showDays: getBool("showDays"),
    hideWhenEnded: getBool("hideWhenEnded"),
    active: getBool("active"),
  };
}

export async function listTimersForShop(shop: string) {
  return prisma.timer.findMany({
    where: { shop },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listActiveTimersForShop(shop: string) {
  return prisma.timer.findMany({
    where: { shop, active: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTimer(shop: string, id: string) {
  return prisma.timer.findFirst({ where: { id, shop } });
}

export async function createTimer(shop: string, input: TimerInput) {
  return prisma.timer.create({
    data: {
      shop,
      name: input.name,
      type: input.type,
      endsAt: input.endsAt,
      durationSeconds: input.durationSeconds,
      placement: input.placement,
      targetType: input.targetType,
      targetIds: JSON.stringify(input.targetIds),
      headline: input.headline,
      subtext: input.subtext,
      endedText: input.endedText,
      backgroundColor: input.backgroundColor,
      textColor: input.textColor,
      accentColor: input.accentColor,
      showDays: input.showDays,
      hideWhenEnded: input.hideWhenEnded,
      active: input.active,
    },
  });
}

export async function updateTimer(shop: string, id: string, input: TimerInput) {
  return prisma.timer.updateMany({
    where: { id, shop },
    data: {
      name: input.name,
      type: input.type,
      endsAt: input.endsAt,
      durationSeconds: input.durationSeconds,
      placement: input.placement,
      targetType: input.targetType,
      targetIds: JSON.stringify(input.targetIds),
      headline: input.headline,
      subtext: input.subtext,
      endedText: input.endedText,
      backgroundColor: input.backgroundColor,
      textColor: input.textColor,
      accentColor: input.accentColor,
      showDays: input.showDays,
      hideWhenEnded: input.hideWhenEnded,
      active: input.active,
    },
  });
}

export async function deleteTimer(shop: string, id: string) {
  return prisma.timer.deleteMany({ where: { id, shop } });
}

export async function toggleTimer(shop: string, id: string, active: boolean) {
  return prisma.timer.updateMany({
    where: { id, shop },
    data: { active },
  });
}

export async function deleteAllTimersForShop(shop: string) {
  return prisma.timer.deleteMany({ where: { shop } });
}

// Public-facing serialization for the theme app extension. Strips merchant-only
// fields, parses JSON-encoded lists, and converts the date to a Unix epoch in ms
// so the storefront JS can do simple arithmetic without parsing.
export function serializeTimerForStorefront(timer: {
  id: string;
  name: string;
  type: string;
  endsAt: Date | null;
  durationSeconds: number | null;
  placement: string;
  targetType: string;
  targetIds: string;
  headline: string;
  subtext: string;
  endedText: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  showDays: boolean;
  hideWhenEnded: boolean;
}) {
  let parsedTargetIds: string[] = [];
  try {
    const parsed = JSON.parse(timer.targetIds);
    if (Array.isArray(parsed)) {
      parsedTargetIds = parsed.map((v) => String(v));
    }
  } catch {
    parsedTargetIds = [];
  }

  return {
    id: timer.id,
    name: timer.name,
    type: timer.type,
    endsAt: timer.endsAt ? timer.endsAt.getTime() : null,
    durationSeconds: timer.durationSeconds,
    placement: timer.placement,
    targetType: timer.targetType,
    targetIds: parsedTargetIds,
    headline: timer.headline,
    subtext: timer.subtext,
    endedText: timer.endedText,
    backgroundColor: timer.backgroundColor,
    textColor: timer.textColor,
    accentColor: timer.accentColor,
    showDays: timer.showDays,
    hideWhenEnded: timer.hideWhenEnded,
  };
}
