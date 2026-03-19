// CDE Schema Types matching the actual RadElement API at api3.rsna.org/radelement/v1
// Schema version: ACR-RSNA-CDEs 1.0.0

export type CDEStatus = 'Proposed' | 'Published' | 'Retired';
export type Modality = 'CT' | 'MR' | 'US' | 'XR' | 'PET' | 'NM' | 'MG' | 'FL' | 'DX' | 'CR' | 'PT';
export type IndexSystem = 'RADLEX' | 'SNOMEDCT' | 'LOINC' | 'ACRCOMMON';

export interface IndexCode {
  system: IndexSystem | string;
  code: string;
  display: string;
  url?: string;
  href?: string;
}

export interface Version {
  number: number;
  date: string;
}

export interface StatusWithDate {
  name: CDEStatus;
  date: string;
}

export interface BodyPart {
  name: string;
  index_codes?: IndexCode | IndexCode[];
}

export interface Specialty {
  name: string;
  abbreviation: string;
}

export interface Person {
  name: string;
  email?: string;
  orcid_id?: string;
  twitter_handle?: string;
  url?: string;
  role?: string;
}

export interface Organization {
  name: string;
  abbreviation?: string;
  url?: string;
  comment?: string;
  role?: string;
}

export interface Contributors {
  people?: Person[];
  organizations?: Organization[];
}

export interface HistoryEntry {
  date: string;
  status: CDEStatus;
}

export interface Reference {
  citation: string;
  doi_url?: string;
  pubmed_id?: string;
  url?: string;
}

export interface ElementValue {
  code?: string;
  value: string;
  name: string;
  definition?: string;
  index_codes?: IndexCode[];
}

export interface ValueSet {
  min_cardinality: number;
  max_cardinality: number;
  values: ElementValue[];
}

export interface IntegerValue {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface FloatValue {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface CDEElement {
  id: string;
  parent_set?: string;
  name: string;
  short_name?: string;
  definition: string;
  question?: string;
  instructions?: string;
  synonyms?: string[];
  references?: Reference[];
  schema_version?: string;
  element_version?: Version;
  status?: StatusWithDate | CDEStatus;
  index_codes?: IndexCode[];
  specialties?: Specialty[];
  modality?: Modality[];
  value_set?: ValueSet;
  integer_value?: IntegerValue;
  float_value?: FloatValue;
}

export interface CDESet {
  id: string;
  name: string;
  description: string;
  schema_version?: string;
  set_version?: Version;
  status: StatusWithDate | CDEStatus;
  url?: string;
  index_codes?: IndexCode[];
  body_parts?: BodyPart[];
  contributors?: Contributors;
  history?: HistoryEntry[];
  specialties?: Specialty[];
  modalities?: Modality[];
  elements: CDEElement[];
  references?: Reference[];
}

// List endpoint summaries
export interface CDESetSummary {
  id: string;
  name: string;
  description?: string;
  status: CDEStatus | string;
  statusDate?: string;
  version?: string;
  modality?: string | null;
  downloads?: number;
  specialties?: Array<{ code: string; name: string; short_name?: string }>;
  body_parts?: Array<{ name: string }>;
  index_codes?: IndexCode[];
}

export interface CDEElementSummary {
  id: string;
  parentID?: number | string;
  name?: string;
  shortName?: string;
  definition?: string;
  valueType?: 'valueSet' | 'integer' | 'float';
  status?: CDEStatus | string;
  statusDate?: string;
  version?: string;
  unit?: string;
  specialties?: Array<{ code: string; name: string }>;
  value_set?: Array<{ value: string; name: string; definition?: string }>;
  minCardinality?: number;
  maxCardinality?: number;
  valueMin?: number;
  valueMax?: number;
  stepValue?: number | null;
  downloads?: number;
}

export type ElementType = 'value_set' | 'integer' | 'float';

export function getElementType(el: CDEElement): ElementType {
  if (el.value_set) return 'value_set';
  if (el.integer_value) return 'integer';
  return 'float';
}

export function getStatusName(status: StatusWithDate | CDEStatus | string): CDEStatus {
  if (typeof status === 'object' && status !== null && 'name' in status) {
    return status.name;
  }
  return status as CDEStatus;
}

export type UserRole = 'viewer' | 'author' | 'editor' | 'reviewer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orcid_id?: string;
  organization?: string;
}

export interface Comment {
  id: string;
  setId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  elementId?: string;
  createdAt: string;
  updatedAt?: string;
  resolved?: boolean;
}

export interface Draft {
  id: string;
  set: CDESet;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  submittedForReview?: boolean;
  reviewComments?: Comment[];
}
