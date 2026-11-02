import { customAlphabet } from "nanoid";
import { ALIAS_MAX, ALIAS_MIN, ALIAS_PATTERN, RESERVED_ALIASES } from "./constants";

const random = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 7);

export function generateAlias() {
  return random();
}

export function normalizeAlias(input) {
  const value = String(input ?? "").trim().toLowerCase();
  if (value.length < ALIAS_MIN || value.length > ALIAS_MAX) {
    throw new Error(`Use ${ALIAS_MIN}–${ALIAS_MAX} characters.`);
  }
  if (!ALIAS_PATTERN.test(value)) throw new Error("Use a–z, 0–9, - and _ only.");
  if (RESERVED_ALIASES.has(value)) throw new Error("That alias is reserved.");
  return value;
}

export function validateAlias(input) {
  try {
    normalizeAlias(input);
    return true;
  } catch {
    return false;
  }
}
