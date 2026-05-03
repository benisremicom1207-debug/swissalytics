/**
 * ID generation — URL-safe, non-sequential, collision-resistant.
 */

import { customAlphabet } from 'nanoid';

// lowercase+digits only to avoid ambiguous glyphs and make URLs tidy
const reportIdAlphabet = '23456789abcdefghijkmnpqrstuvwxyz';

const nanoReportId = customAlphabet(reportIdAlphabet, 12);

export function newReportId(): string {
  return nanoReportId();
}
