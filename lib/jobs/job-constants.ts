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
  Laucala: "Laucala Campus", Lautoka: "Lautoka Campus", Labasa: "Labasa Campus",
  Savusavu: "Savusavu Centre", Rarotonga: "Cook Islands Campus",
  "Cook Islands": "Cook Islands Campus", "Port Vila": "Emalus Campus", Emalus: "Emalus Campus",
  Santo: "Santo Centre", Tafea: "Tafea Centre", Malampa: "Malampa Centre", Torba: "Torba Centre",
  Bairiki: "Kiribati Campus", Kiribati: "Kiribati Campus", Majuro: "Marshall Islands Campus",
  "Marshall Islands": "Marshall Islands Campus", Naoero: "Naoero Campus", Nauru: "Naoero Campus",
  Alofi: "Niue Campus", Niue: "Niue Campus", Apia: "Samoa Campus", Samoa: "Samoa Campus",
  Honiara: "Solomon Islands Campus", "Solomon Islands": "Solomon Islands Campus",
  Gizo: "Gizo Centre", Lata: "Lata Centre", Atafu: "Tokelau Campus", Tokelau: "Tokelau Campus",
  "Nuku'alofa": "Tonga Campus", Tonga: "Tonga Campus", "Ha'apai": "Ha'apai Centre",
  "Vava'u": "Vava'u Centre", Funafuti: "Tuvalu Campus", Tuvalu: "Tuvalu Campus",
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
