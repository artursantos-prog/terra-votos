export const OUTSIDE_DISPUTE_VISIBILITY_KEY = "fora_da_disputa_visible";

export function isOutsideDisputeVisible(value: boolean | null | undefined): boolean {
  return value === true;
}
