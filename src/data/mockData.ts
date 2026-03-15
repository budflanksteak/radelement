// Reference data: specialties and modalities for UI filters
// Actual CDE data comes from the live API at api3.rsna.org/radelement/v1

export const SPECIALTIES = [
  { name: 'Abdominal Radiology', abbreviation: 'AB' },
  { name: 'Breast Imaging', abbreviation: 'BR' },
  { name: 'Cardiac Radiology', abbreviation: 'CA' },
  { name: 'Chest Radiology', abbreviation: 'CH' },
  { name: 'Emergency Radiology', abbreviation: 'ER' },
  { name: 'Gastrointestinal Radiology', abbreviation: 'GI' },
  { name: 'Genitourinary Radiology', abbreviation: 'GU' },
  { name: 'Head and Neck', abbreviation: 'HN' },
  { name: 'Interventional Radiology', abbreviation: 'IR' },
  { name: 'Molecular Imaging', abbreviation: 'MI' },
  { name: 'Musculoskeletal Radiology', abbreviation: 'MK' },
  { name: 'Neuroradiology', abbreviation: 'NR' },
  { name: 'Obstetric and Gynecologic Radiology', abbreviation: 'OB' },
  { name: 'Oncologic Imaging', abbreviation: 'OI' },
  { name: 'Pediatric Radiology', abbreviation: 'PD' },
  { name: 'Quality Improvement', abbreviation: 'QI' },
  { name: 'Radiation Safety', abbreviation: 'RS' },
  { name: 'Vascular and Interventional', abbreviation: 'VI' },
];

export const MODALITIES: Array<{ code: string; name: string }> = [
  { code: 'CT', name: 'Computed Tomography' },
  { code: 'MR', name: 'Magnetic Resonance' },
  { code: 'US', name: 'Ultrasound' },
  { code: 'XR', name: 'Radiography' },
  { code: 'PET', name: 'Positron Emission Tomography' },
  { code: 'NM', name: 'Nuclear Medicine' },
  { code: 'MG', name: 'Mammography' },
  { code: 'FL', name: 'Fluoroscopy' },
  { code: 'DX', name: 'Digital Radiography' },
  { code: 'CR', name: 'Computed Radiography' },
  { code: 'PT', name: 'PET-CT' },
];

export const INDEX_SYSTEMS = ['RADLEX', 'SNOMEDCT', 'LOINC', 'ACRCOMMON'];

export const SPECIALTY_COLORS: Record<string, string> = {
  AB: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  OI: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  CA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  CH: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  ER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  GI: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
  GU: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  HN: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  IR: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  MI: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  MK: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
  NR: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  OB: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  PD: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  QI: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  RS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  VI: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
};

export const MODALITY_COLORS: Record<string, string> = {
  CT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  MR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  US: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  XR: 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  PET: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  NM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  MG: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
};

export const STATUS_COLORS: Record<string, string> = {
  Published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Proposed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Retired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
