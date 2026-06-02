import { getSettings } from "./settings";

export async function getCartLimits() {
  const s = await getSettings();
  return {
    maxQtyPerLineItem: s.maxQtyPerLineItem,
    maxDistinctItemsPerOrder: s.maxDistinctItemsPerOrder,
  };
}

export function effectivePerItemMax(
  globalMax: number,
  productMax: number | null | undefined,
) {
  if (productMax == null) return globalMax;
  return Math.min(globalMax, productMax);
}
