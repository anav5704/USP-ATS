import { normalizeCampusCentre, USP_CAMPUSES_CENTRES } from "@/lib/jobs/job-constants";

type PhonePlan = {
  country: string;
  callingCode: `+${string}`;
  nationalLengths: readonly number[];
  source: string;
};

// Latest country submissions available in the ITU NNP directory, checked 2026-10-22.
// Subscriber/service numbers only: emergency, operator and other short codes are excluded.
// See phone-number-rules.md for source dates and interpretation of variable lengths.
export const PHONE_PLANS = {
  FJ: { country: "Fiji", callingCode: "+679", nationalLengths: [7], source: "https://www.itu.int/oth/T0202000048/en" },
  CK: { country: "Cook Islands", callingCode: "+682", nationalLengths: [5], source: "https://www.itu.int/oth/T020200002F/en" },
  VU: { country: "Vanuatu", callingCode: "+678", nationalLengths: [5, 6, 7], source: "https://www.itu.int/oth/T02020000E2/en" },
  KI: { country: "Kiribati", callingCode: "+686", nationalLengths: [8], source: "https://www.itu.int/oth/T0202000071/en" },
  MH: { country: "Marshall Islands", callingCode: "+692", nationalLengths: [7], source: "https://www.itu.int/oth/T0202000085/en" },
  NR: { country: "Nauru", callingCode: "+674", nationalLengths: [7], source: "https://www.itu.int/oth/T0202000094/en" },
  NU: { country: "Niue", callingCode: "+683", nationalLengths: [4, 7], source: "https://www.itu.int/oth/T02020000EC/en" },
  WS: { country: "Samoa", callingCode: "+685", nationalLengths: [5, 6, 7], source: "https://www.itu.int/oth/T02020000B4/en" },
  SB: { country: "Solomon Islands", callingCode: "+677", nationalLengths: [5, 7], source: "https://www.itu.int/oth/T02020000BF/en" },
  TK: { country: "Tokelau", callingCode: "+690", nationalLengths: [4, 5, 6, 7], source: "https://www.itu.int/oth/T02020000D2/en" },
  TO: { country: "Tonga", callingCode: "+676", nationalLengths: [5, 7], source: "https://www.itu.int/oth/T02020000D3/en" },
  TV: { country: "Tuvalu", callingCode: "+688", nationalLengths: [5, 6, 7], source: "https://www.itu.int/oth/T02020000D9/en" },
} as const satisfies Record<string, PhonePlan>;

export type PhoneCountry = keyof typeof PHONE_PLANS;
type Campus = (typeof USP_CAMPUSES_CENTRES)[number];

// Keys are checked against the existing canonical list; this is metadata, not a second options list.
export const CAMPUS_COUNTRIES = {
  "Laucala Campus": "FJ",
  "Lautoka Campus": "FJ",
  "Labasa Campus": "FJ",
  "Savusavu Centre": "FJ",
  "Cook Islands Campus": "CK",
  "Emalus Campus": "VU",
  "Santo Centre": "VU",
  "Tafea Centre": "VU",
  "Malampa Centre": "VU",
  "Torba Centre": "VU",
  "Kiribati Campus": "KI",
  "Marshall Islands Campus": "MH",
  "Naoero Campus": "NR",
  "Niue Campus": "NU",
  "Samoa Campus": "WS",
  "Solomon Islands Campus": "SB",
  "Gizo Centre": "SB",
  "Lata Centre": "SB",
  "Tokelau Campus": "TK",
  "Tonga Campus": "TO",
  "Ha'apai Centre": "TO",
  "Vava'u Centre": "TO",
  "Tuvalu Campus": "TV",
} as const satisfies Record<Campus, PhoneCountry>;

export function campusPhoneCountry(campus: string): PhoneCountry | undefined {
  const normalized = normalizeCampusCentre(campus.trim());
  return Object.hasOwn(CAMPUS_COUNTRIES, normalized)
    ? CAMPUS_COUNTRIES[normalized as Campus]
    : undefined;
}

export function resolvePhonePlan(campuses: readonly string[]): PhonePlan | undefined {
  const country = campuses.length ? campusPhoneCountry(campuses[0]) : undefined;
  if (!country || campuses.some((campus) => campusPhoneCountry(campus) !== country)) return undefined;
  return PHONE_PLANS[country];
}

export function phoneLengthMessage(plan: PhonePlan): string {
  const lengths = plan.nationalLengths.join(" or ");
  return `${plan.country} phone numbers must contain ${lengths} digits after ${plan.callingCode}.`;
}

export function validateProfilePhone(phone: string, campuses: readonly string[]): string | undefined {
  if (!campuses.length) return "Select your Campus/Centre before entering a phone number.";
  if (campuses.some((campus) => !campusPhoneCountry(campus))) return "Select a supported USP Campus/Centre.";
  const plan = resolvePhonePlan(campuses);
  if (!plan) return "Select Campus/Centres in the same country for your phone number.";
  if (!phone || phone === plan.callingCode) return;
  if (!phone.startsWith(plan.callingCode)) return `Your ${plan.country} Campus/Centre requires a phone number starting with ${plan.callingCode}.`;
  const national = phone.slice(plan.callingCode.length);
  if (national && !/^[0-9]+$/.test(national)) return "Phone number can contain digits only.";
  if (!plan.nationalLengths.includes(national.length)) return phoneLengthMessage(plan);
}

// A displayed/submitted locked prefix without national digits is an omitted phone.
export function normalizeOptionalPhone(phone: string, campuses: readonly string[]): string {
  return phone === resolvePhonePlan(campuses)?.callingCode ? "" : phone;
}

export function phoneForCampusChange(phone: string, previous: readonly string[], next: readonly string[]): string {
  const before = resolvePhonePlan(previous);
  const after = resolvePhonePlan(next);
  return before && after && before.country === after.country ? phone : "";
}

export function canonicalPhone(national: string, plan: PhonePlan): string {
  return national ? `${plan.callingCode}${national}` : "";
}

export function phoneEditorState(phone: string, campuses: readonly string[]) {
  const plan = resolvePhonePlan(campuses);
  const national = plan && phone.startsWith(plan.callingCode) ? phone.slice(plan.callingCode.length) : "";
  const canDisplay = !!plan && phone.startsWith(plan.callingCode) && /^[0-9]*$/.test(national);
  return {
    plan,
    disabled: !plan,
    national: canDisplay ? national : "",
    legacyValue: phone && !canDisplay ? phone : undefined,
    error: phone ? validateProfilePhone(phone, campuses) : undefined,
    maxLength: plan ? Math.max(...plan.nationalLengths) : undefined,
  };
}

export function acceptsNationalInput(value: string, maxLength: number): boolean {
  return /^[0-9]*$/.test(value) && value.length <= maxLength;
}
