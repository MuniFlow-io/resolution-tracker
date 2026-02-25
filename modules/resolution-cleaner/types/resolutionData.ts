export type VariableType =
  | "date"
  | "currency"
  | "series"
  | "borrower"
  | "funding_lender"
  | "project_name"
  | "property_address"
  | "bond_counsel"
  | "unit_count"
  | "issuer";

export type GroupId = string;
export type DetectionRulesVersion = string;

export type TermKey =
  | "borrower_name"
  | "lender_name"
  | "bond_counsel_name"
  | "series_name"
  | "unit_count_total"
  | "dated_date"
  | null;

export interface OccurrenceOffset {
  index: number;
  match_text: string;
  start_offset: number;
  end_offset: number;
  context_before: string;
  context_after: string;
}

/** Raw regex output before safety validation/filtering. */
export interface DetectedCandidate {
  type: VariableType;
  raw_value: string;
  match_text: string;
  start_offset: number;
  end_offset: number;
  term_key: TermKey;
  is_locked: boolean;
}

/** Candidate that has passed hard safety filters and carries UI context. */
export interface ValidatedCapture extends DetectedCandidate {
  context_before: string;
  context_after: string;
}

export interface VariableGroup {
  group_id: GroupId;
  type: VariableType;
  detected_value_raw: string;
  occurrences: OccurrenceOffset[];
  occurrence_count: number;
  term_key: TermKey;
  is_locked: boolean;
}

export type OccurrenceStatus = "pending" | "confirmed" | "excluded";
export type GroupAction = "idle" | "previewing" | "replacing" | "done" | "ignored";

export interface OccurrenceState {
  index: number;
  status: OccurrenceStatus;
}

export interface VariableGroupState extends VariableGroup {
  action: GroupAction;
  occurrenceStates: OccurrenceState[];
  replacement_value: string | null;
}

export interface ParseResult {
  fileName: string;
  variableGroups: VariableGroup[];
  rawFileBase64: string;
  previewHtml: string;
}

export interface ConfirmedReplacement {
  group_id: GroupId;
  original_value: string;
  new_value: string;
  confirmed_occurrence_offsets: Array<{ start: number; end: number }>;
  term_key: TermKey;
}

export interface ChangeLogEntry {
  original_value: string;
  new_value: string;
  replacement_count: number;
  term_key: TermKey;
  timestamp: string;
}

export interface ConfirmedTerms {
  borrower_name?: string;
  lender_name?: string;
  bond_counsel_name?: string;
  series_name?: string;
  unit_count_total?: string;
  dated_date?: string;
}

export interface ReplaceResult {
  updatedFileBase64: string;
  changeLog: ChangeLogEntry[];
  confirmedTerms: ConfirmedTerms;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type AppStep = "upload" | "parsing" | "review" | "replacing" | "complete" | "error";

