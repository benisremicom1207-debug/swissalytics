/**
 * ID generation — URL-safe, non-sequential, collision-resistant.
 */

import { customAlphabet } from 'nanoid';

// lowercase+digits only to avoid ambiguous glyphs and make URLs tidy
const reportIdAlphabet = '23456789abcdefghijkmnpqrstuvwxyz';
const shareTokenAlphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

const nanoReportId = customAlphabet(reportIdAlphabet, 12);
const nanoShareToken = customAlphabet(shareTokenAlphabet, 32);

export function newReportId(): string {
  return nanoReportId();
}

export function newShareToken(): string {
  return nanoShareToken();
}
