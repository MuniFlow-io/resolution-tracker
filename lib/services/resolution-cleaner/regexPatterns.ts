export const LONG_DATE_REGEX =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/gi;

export const NUMERIC_DATE_REGEX = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
export const CURRENCY_REGEX = /\$\d{1,3}(?:,\d{3})+(?!\d)/g;
export const SERIES_HYPHEN_REGEX = /\bSeries\s+\d{4}-[A-Z]{1,3}\b/gi;
export const SERIES_NOHYPHEN_REGEX = /\bSeries\s+\d{4}[A-Z]{1,3}\b/gi;
export const BORROWER_ANCHOR_REGEX =
  /([A-Z][A-Za-z0-9\s,.'&-]{2,120}?)\s*\(\s*the\s+"Borrower"\s*\)/g;
export const FUNDING_LENDER_ANCHOR_REGEX =
  /([A-Z][A-Za-z0-9\s,.'&-]{2,120}?)\s*\(\s*the\s+"Funding Lender"\s*\)/g;
export const BOND_COUNSEL_ANCHOR_REGEX =
  /([A-Z][A-Za-z0-9\s,.'&-]{2,120}?)\s*(?:\(\s*"Bond Counsel"\s*\)|as\s+bond\s+counsel)/gi;
export const UNIT_COUNT_REGEX = /\b(\d+)-unit\b/gi;
export const ISSUER_ANCHOR_REGEX =
  /([A-Z][A-Za-z0-9\s,.'&-]{2,120}?)\s*\(\s*the\s+"(?:City|Issuer)"\s*\)/g;

export const PATTERN_REGISTRY = [
  { type: "date" as const, regex: LONG_DATE_REGEX, term_key: null, is_locked: false },
  { type: "date" as const, regex: NUMERIC_DATE_REGEX, term_key: null, is_locked: false },
  { type: "currency" as const, regex: CURRENCY_REGEX, term_key: null, is_locked: false },
  {
    type: "series" as const,
    regex: SERIES_HYPHEN_REGEX,
    term_key: "series_name" as const,
    is_locked: false,
  },
  {
    type: "series" as const,
    regex: SERIES_NOHYPHEN_REGEX,
    term_key: "series_name" as const,
    is_locked: false,
  },
  {
    type: "borrower" as const,
    regex: BORROWER_ANCHOR_REGEX,
    term_key: "borrower_name" as const,
    is_locked: false,
  },
  {
    type: "funding_lender" as const,
    regex: FUNDING_LENDER_ANCHOR_REGEX,
    term_key: "lender_name" as const,
    is_locked: false,
  },
  {
    type: "bond_counsel" as const,
    regex: BOND_COUNSEL_ANCHOR_REGEX,
    term_key: "bond_counsel_name" as const,
    is_locked: false,
  },
  {
    type: "unit_count" as const,
    regex: UNIT_COUNT_REGEX,
    term_key: "unit_count_total" as const,
    is_locked: false,
  },
  { type: "issuer" as const, regex: ISSUER_ANCHOR_REGEX, term_key: null, is_locked: true },
] as const;

