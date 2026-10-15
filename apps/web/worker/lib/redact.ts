/**
 * Redaction for text that is about to be stored. It is deliberately simple: it masks what looks
 * like an email address, a phone number or a long run of digits (account, card or ID numbers), and
 * cuts text to a fixed length. It cannot catch a name or an address written in words, which is why
 * the chat panel also tells visitors what is saved.
 */

/** Longest question that is stored, in characters. */
export const MAX_QUESTION_CHARS = 1000;
/** Longest answer that is stored, in characters. */
export const MAX_ANSWER_CHARS = 4000;

const EMAIL = /[^\s@<>()[\]",;:]+@[^\s@<>()[\]",;:]+\.[a-z]{2,}/gi;
// an international number starts with a plus; a local one is 10 digits in the usual groups, or 7
const PLUS_PHONE = /\+\d[\d\s().-]{7,}\d/g;
const PHONE = /(?<!\d)(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g;
const LOCAL_PHONE = /(?<!\d)\d{3}[.-]\d{4}(?!\d)/g;
// year ranges such as 2023-2025 are not phone numbers, so only unbroken runs count here
const LONG_DIGITS = /\d{8,}/g;

/** Masks emails, phone-like numbers and runs of 8 or more digits. */
export function maskPersonal(text: string): string {
  return text
    .replace(EMAIL, '[email]')
    .replace(PLUS_PHONE, '[phone]')
    .replace(PHONE, '[phone]')
    .replace(LOCAL_PHONE, '[phone]')
    .replace(LONG_DIGITS, '[number]');
}

/** Masks what is personal, tidies whitespace, and caps the length. */
export function redact(text: string, maxChars = MAX_QUESTION_CHARS): string {
  const masked = maskPersonal(text).replace(/\s+/g, ' ').trim();
  return masked.length > maxChars ? `${masked.slice(0, maxChars - 1).trimEnd()}…` : masked;
}
