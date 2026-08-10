export type DegreeGroup = {
  label: string;
  options: readonly string[];
};

export const USP_DEGREES = [
  {
    label: "Foundation & Certificate Level",
    options: [
      "Foundation Studies (Science/Arts/Commerce pathway) — Pacific TAFE / College of Foundation Studies",
      "Certificate in Computing",
      "Certificate in Information Systems",
      "Certificate in Mathematics",
      "Certificate in Official Statistics",
      "Certificate in Population Studies and Demography",
      "Certificate of Justice",
      "Certificate in Policing",
      "Certificate in Social and Community Work",
    ],
  },
  {
    label: "Diploma Level",
    options: [
      "Diploma in Accounting",
      "Diploma in Economics",
      "Diploma in Official Statistics",
      "Diploma in Population Studies & Demography",
      "Diploma in Computing",
      "Diploma in Information Systems",
      "Diploma in Mathematics",
      "Diploma of Justice",
      "Diploma in Leadership, Governance and Human Rights",
      "Diploma in Police Management",
      "Diploma in Prosecutions",
      "Diploma in Social and Community Work",
    ],
  },
  {
    label: "Bachelor's Degrees",
    options: [
      "Bachelor of Arts (History / Law / Pacific Policing / Politics & International Affairs / Psychology / Social Work / Sociology, etc.)",
      "Bachelor of Commerce (Accounting / Economics / Finance / Official Statistics / Population Studies & Demography)",
      "Bachelor of Science (Biology / Chemistry / Physics / Marine Science / Environmental Science, etc.)",
      "Bachelor of Education (Primary/Secondary)",
      "Bachelor of Laws (LLB)",
      "Bachelor of Arts and Bachelor of Laws (combined)",
      "Bachelor of Commerce and Bachelor of Laws (combined)",
      "Bachelor of Engineering (Civil)",
      "Bachelor of Engineering (Electrical and Electronics)",
      "Bachelor of Engineering (Mechanical)",
      "Bachelor of Software Engineering",
      "Bachelor of Networks and Security",
      "Bachelor of Agriculture",
      "Bachelor of Tourism & Hospitality Management (Tourism Management stream)",
      "Bachelor of Journalism",
    ],
  },
  {
    label: "New for 2026 (STEMP AI / Climate / Language Tech pathways)",
    options: [
      "Bachelor's pathway in Artificial Intelligence (new STEMP suite, 2026)",
      "Climate Change-focused undergraduate pathway (PACE-SD aligned)",
      "Pacific Language Technology / Digitalisation of Pacific Languages programme (SPACE)",
    ],
  },
  {
    label: "Postgraduate Certificates & Diplomas",
    options: [
      "Postgraduate Certificate in Tertiary Teaching",
      "Postgraduate Diploma in Education",
      "Postgraduate Diploma in Arts (Linguistics / Applied Linguistics & English / Literature / Fijian Language Studies / Pacific Studies / Psychology / Social Policy & Administration)",
      "Postgraduate Diploma in Law",
      "Postgraduate Diploma in Information Technology (Information Systems / Computing Science)",
      "Postgraduate Diploma in Science (Mathematics / Physics)",
      "Postgraduate Diploma in Cybersecurity",
      "Professional Certificate in Education Policy & Planning / Heritage Management",
    ],
  },
  {
    label: "Master's Degrees",
    options: [
      "Master of Arts (Education / Journalism / Linguistics / Applied Linguistics / Literature / Pacific Studies)",
      "Master of Education",
      "Master of Laws (LLM)",
      "Master of Commerce in Professional Accounting",
      "Master of Information Systems",
      "Master of Science (Environmental Science / Computing Science / Engineering)",
      "Master of Arts in Mathematics",
    ],
  },
  {
    label: "Doctoral (PhD)",
    options: [
      "Doctor of Philosophy — offered across disciplines including Development Studies, Governance, History, Law, Politics/International Affairs, Psychology, Sociology, Social Policy, Applied Linguistics, Education, Linguistics, Literature, Pacific Studies",
    ],
  },
] as const satisfies readonly DegreeGroup[];