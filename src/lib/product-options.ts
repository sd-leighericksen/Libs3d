// Product options (configurable choices like "Base colour" / "Keystone colours").
//
// Selections are captured as an immutable snapshot — colour name + hex frozen at
// the moment of choosing — so archiving or renaming a colour later never alters
// a historical cart line or order. `optionsHash` is a deterministic signature of
// the picks, used to keep the same product with different choices as separate
// cart lines.
//
// NOTE: server-only module (imports node:crypto + prisma). Import the *types*
// with `import type` from client components; never the runtime functions.
import crypto from "node:crypto";
import { prisma } from "./db";

export type SelectionSlot = {
  index: number;
  colorId: string;
  colorName: string;
  hex: string;
};

export type OptionSelection = {
  optionId: string;
  label: string;
  type: string;
  slots: SelectionSlot[];
};

/** Form field name for one slot of one option. */
export function optionFieldName(optionId: string, slotIndex: number) {
  return `opt__${optionId}__${slotIndex}`;
}

/** Deterministic signature of a set of selections (empty string when none). */
export function hashSelections(selections: OptionSelection[]): string {
  if (selections.length === 0) return "";
  const normalized = [...selections]
    .sort((a, b) => a.optionId.localeCompare(b.optionId))
    .map(
      (o) =>
        `${o.optionId}:${[...o.slots]
          .sort((a, b) => a.index - b.index)
          .map((s) => `${s.index}=${s.colorId}`)
          .join(",")}`,
    )
    .join("|");
  return crypto.createHash("sha1").update(normalized).digest("hex");
}

/**
 * Read a product's option choices out of submitted form data, validating every
 * pick against the live colour palette. Returns the snapshot + hash to store on
 * the cart line. Throws a friendly error if a required choice is missing or a
 * chosen colour is no longer available.
 */
export async function resolveSelections(
  productId: string,
  formData: FormData,
): Promise<{ selections: OptionSelection[]; optionsHash: string }> {
  const options = await prisma.productOption.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
    include: {
      allowedColors: { where: { available: true, archivedAt: null } },
    },
  });
  if (options.length === 0) return { selections: [], optionsHash: "" };

  const colors = await prisma.colorOption.findMany({
    where: { available: true, archivedAt: null },
  });
  const colorById = new Map(colors.map((c) => [c.id, c]));

  const selections: OptionSelection[] = [];
  for (const option of options) {
    // Allowed set: the option's own list, or the whole available palette.
    const allowedIds =
      option.allowedColors.length > 0
        ? new Set(option.allowedColors.map((c) => c.id))
        : null;

    const slots: SelectionSlot[] = [];
    for (let i = 0; i < option.slots; i++) {
      const raw = formData.get(optionFieldName(option.id, i));
      const colorId = typeof raw === "string" ? raw.trim() : "";
      if (!colorId) {
        if (option.required) {
          const which = option.slots > 1 ? ` (#${i + 1})` : "";
          throw new Error(`Please choose a colour for "${option.label}"${which}.`);
        }
        continue;
      }
      const color = colorById.get(colorId);
      if (!color || (allowedIds && !allowedIds.has(colorId))) {
        throw new Error(`That colour isn't available for "${option.label}" anymore.`);
      }
      slots.push({
        index: i,
        colorId: color.id,
        colorName: color.name,
        hex: color.hex,
      });
    }
    if (slots.length > 0) {
      selections.push({
        optionId: option.id,
        label: option.label,
        type: option.type,
        slots,
      });
    }
  }

  return { selections, optionsHash: hashSelections(selections) };
}

/** Narrow an unknown JSON value (from a Json column) to typed selections. */
export function asSelections(value: unknown): OptionSelection[] {
  if (!Array.isArray(value)) return [];
  return value as OptionSelection[];
}

/** One-line plain-text summary, e.g. "Base colour: Red · Keystones: Red, Blue". */
export function selectionsToText(value: unknown): string {
  const selections = asSelections(value);
  if (selections.length === 0) return "";
  return selections
    .map((o) => `${o.label}: ${o.slots.map((s) => s.colorName).join(", ")}`)
    .join(" · ");
}
