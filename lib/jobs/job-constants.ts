export const USP_CAMPUSES_CENTRES = [
  "Laucala Campus",
  "Lautoka Campus",
  "Labasa Campus",
  "Savusavu Centre",
  "Cook Islands Campus",
  "Emalus Campus",
  "Santo Centre",
  "Tafea Centre",
  "Malampa Centre",
  "Torba Centre",
  "Kiribati Campus",
  "Marshall Islands Campus",
  "Naoero Campus",
  "Niue Campus",
  "Samoa Campus",
  "Solomon Islands Campus",
  "Gizo Centre",
  "Lata Centre",
  "Tokelau Campus",
  "Tonga Campus",
  "Ha'apai Centre",
  "Vava'u Centre",
  "Tuvalu Campus",
] as const;

const LEGACY_CAMPUS_CENTRE_NAMES: Record<string, string> = {
  "Cook Islands": "Cook Islands Campus",
  Emalus: "Emalus Campus",
  Kiribati: "Kiribati Campus",
  Labasa: "Labasa Campus",
  Laucala: "Laucala Campus",
  Lautoka: "Lautoka Campus",
  "Marshall Islands": "Marshall Islands Campus",
  Nauru: "Naoero Campus",
  Niue: "Niue Campus",
  Samoa: "Samoa Campus",
  "Solomon Islands": "Solomon Islands Campus",
  Tokelau: "Tokelau Campus",
  Tonga: "Tonga Campus",
  Tuvalu: "Tuvalu Campus",
};

export function normalizeCampusCentre(value: string) {
  return LEGACY_CAMPUS_CENTRE_NAMES[value] ?? value;
}

export const USP_DEPARTMENTS = [
  "SAFE",
  "SBM",
  "STEMP",
  "SAGEONS",
  "SoLaSS",
  "SPACE",
  "PTAFE",
  "PACE-SD",
] as const;

export const JOB_TYPES = [
  "Internship",
  "Full Time",
  "Part Time",
  "Volunteer",
] as const;
