import { customAlphabet } from "nanoid";

// High-entropy public ID: 10 chars, URL-safe alphabet — ~1 quadrillion combos
const nanoidPublic = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  10
);

// Draft token: 32 chars, used as an opaque bearer secret in a cookie
const nanoidToken = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  32
);

export function generatePublicId() {
  return nanoidPublic();
}

export function generateDraftToken() {
  return nanoidToken();
}

export const DRAFT_COOKIE = "cassette_draft_token";
