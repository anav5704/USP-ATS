import type { JobInput } from "@/lib/jobs/job-schema";

export const JOB_TEMPLATE_FIELDS = [
  "description",
  "jobType",
  "gpaMin",
  "hourlyPay",
  "hours",
  "skills",
] as const satisfies readonly (keyof JobInput)[];

export type JobTemplateField = (typeof JOB_TEMPLATE_FIELDS)[number];
export type JobTemplateDefaults = Pick<JobInput, JobTemplateField>;
export type JobTemplateValues = Partial<JobTemplateDefaults>;

type TemplateArchetype = Omit<JobTemplateDefaults, "description">;

const ARCHETYPES = {
  academicSupport: {
    jobType: "Part Time", gpaMin: 3.5, hourlyPay: 15, hours: 10,
    skills: ["Communication", "Presentation Skills", "Time Management"],
  },
  research: {
    jobType: "Part Time", gpaMin: 3.7, hourlyPay: 18, hours: 15,
    skills: ["Research Methods", "Data Analysis", "Technical Writing"],
  },
  administration: {
    jobType: "Part Time", gpaMin: 3, hourlyPay: 12, hours: 15,
    skills: ["Organization", "Communication", "Microsoft Word"],
  },
  technical: {
    jobType: "Part Time", gpaMin: 3.2, hourlyPay: 15, hours: 15,
    skills: ["Problem Solving", "Documentation", "Communication"],
  },
  officer: {
    jobType: "Full Time", gpaMin: 3.2, hourlyPay: 18, hours: 40,
    skills: ["Organization", "Communication", "Decision Making"],
  },
  volunteer: {
    jobType: "Volunteer", gpaMin: 0, hourlyPay: 0, hours: 8,
    skills: ["Teamwork", "Communication", "Initiative"],
  },
  lecturer: {
    jobType: "Full Time", gpaMin: 4, hourlyPay: 30, hours: 40,
    skills: ["Presentation Skills", "Research Methods", "Technical Writing"],
  },
  coordinator: {
    jobType: "Full Time", gpaMin: 3.3, hourlyPay: 22, hours: 40,
    skills: ["Project Management", "Organization", "Communication"],
  },
  manager: {
    jobType: "Full Time", gpaMin: 3.5, hourlyPay: 28, hours: 40,
    skills: ["Leadership", "Decision Making", "Project Management"],
  },
  service: {
    jobType: "Part Time", gpaMin: 3, hourlyPay: 12, hours: 15,
    skills: ["Customer Service", "Organization", "Communication"],
  },
  internship: {
    jobType: "Internship", gpaMin: 3, hourlyPay: 10, hours: 20,
    skills: ["Teamwork", "Communication", "Initiative"],
  },
  specialist: {
    jobType: "Full Time", gpaMin: 3.5, hourlyPay: 22, hours: 40,
    skills: ["Training and Development", "Communication", "Problem Solving"],
  },
} as const satisfies Record<string, TemplateArchetype>;

function template(description: string, defaults: TemplateArchetype): JobTemplateDefaults {
  if (defaults.jobType === "Volunteer" && defaults.hourlyPay !== 0) {
    throw new Error("Volunteer job templates must have an hourly pay of 0");
  }
  if (defaults.jobType !== "Volunteer" && defaults.hourlyPay <= 0) {
    throw new Error("Non-volunteer job templates must have a positive hourly pay");
  }
  return { description, ...defaults };
}

export const JOB_TEMPLATES = {
  "Teaching Assistant": template("Support teaching activities, prepare learning materials, and assist students during tutorials or practical sessions.", ARCHETYPES.academicSupport),
  "Research Assistant": template("Support academic research through information gathering, data analysis, documentation, and project coordination.", ARCHETYPES.research),
  "Student Research Assistant": template("Assist a research project with literature reviews, data collection, basic analysis, and clear documentation.", ARCHETYPES.research),
  "Data Assistant": template("Support accurate data collection, entry, validation, analysis, and reporting for assigned university activities.", ARCHETYPES.research),
  "Finance Assistant": template("Assist with financial records, reconciliations, spreadsheet updates, and routine finance administration.", ARCHETYPES.administration),
  "Administrative Assistant": template("Provide administrative support through document preparation, record keeping, scheduling, and office coordination.", ARCHETYPES.administration),
  "Project Assistant": template("Support project delivery through scheduling, documentation, progress tracking, and stakeholder communication.", ARCHETYPES.administration),
  "Technical Assistant": template("Provide practical technical support, document issues and solutions, and assist with approved systems and equipment.", ARCHETYPES.technical),
  "Student Officer": template("Support student-facing services, maintain records, respond to enquiries, and coordinate routine student activities.", ARCHETYPES.officer),
  "Finance Officer": template("Maintain financial records, support reporting and reconciliation, and follow approved finance procedures.", ARCHETYPES.officer),
  "Human Resources Officer": template("Support recruitment, staff records, routine HR administration, and clear communication with employees.", ARCHETYPES.officer),
  "Administration Officer": template("Coordinate administrative processes, records, correspondence, scheduling, and general office support.", ARCHETYPES.officer),
  "Finance and Administration Officer": template("Coordinate routine financial processing, records, reporting, and general administrative activities.", ARCHETYPES.officer),
  "Facilities Officer": template("Support facilities operations, service requests, records, inspections, and coordination of maintenance activities.", ARCHETYPES.officer),
  "Project Officer": template("Coordinate project activities, maintain documentation, monitor progress, and communicate with stakeholders.", ARCHETYPES.officer),
  "Research Officer": template("Coordinate research activities, analyse information, prepare reports, and maintain research documentation.", ARCHETYPES.research),
  "Technical Officer": template("Deliver technical support, maintain documentation, troubleshoot issues, and assist with systems or equipment.", ARCHETYPES.technical),
  "Marketing / Communications Officer": template("Create and coordinate clear communications, promotional content, campaigns, and stakeholder updates.", ARCHETYPES.officer),
  "Teaching / Academic Support Officer": template("Coordinate academic support activities, learning resources, student assistance, and related records.", ARCHETYPES.academicSupport),
  Tutor: template("Provide individual or small-group learning support and help students understand course concepts and study practices.", ARCHETYPES.academicSupport),
  Marker: template("Mark assigned coursework against supplied criteria and provide accurate, consistent, and timely feedback.", ARCHETYPES.academicSupport),
  "Lab Demonstrator": template("Assist supervised laboratory sessions, demonstrate standard procedures, and support a safe learning environment.", ARCHETYPES.academicSupport),
  Intern: template("Complete supervised project and team activities while developing practical experience in a professional environment.", ARCHETYPES.internship),
  "Project Partner": template("Work with project stakeholders to coordinate activities, share expertise, and support agreed project outcomes.", ARCHETYPES.coordinator),
  "Student Learning Specialist": template("Develop and deliver learning support that helps students strengthen academic skills and study practices.", ARCHETYPES.specialist),
  "PASS Leader": template("Facilitate peer-assisted study sessions and help students engage with course concepts and effective study strategies.", ARCHETYPES.academicSupport),
  "Peer Tutor": template("Provide approachable peer learning support and help students practise and understand relevant course material.", ARCHETYPES.academicSupport),
  "Peer Mentor": template("Support fellow students through active listening, practical guidance, and referral to appropriate university services.", ARCHETYPES.volunteer),
  "Student Buddy": template("Welcome and support students by sharing practical guidance and helping them connect with campus resources.", ARCHETYPES.volunteer),
  "Student Ambassador": template("Represent the university at approved activities and provide welcoming, accurate information to students and visitors.", ARCHETYPES.volunteer),
  "Orientation Leader": template("Guide new students through orientation activities and provide clear, welcoming information about university services.", ARCHETYPES.volunteer),
  "Campus Tour Guide": template("Lead informative campus tours and answer visitor questions in a welcoming and professional manner.", ARCHETYPES.volunteer),
  "Open Day Volunteer": template("Support open-day activities by welcoming visitors, providing directions, and assisting event teams.", ARCHETYPES.volunteer),
  "Assistant Lecturer": template("Contribute to teaching, assessment, student consultation, course preparation, and relevant academic activities.", ARCHETYPES.lecturer),
  Lecturer: template("Deliver teaching, assessment, student consultation, research, and academic service within the assigned discipline.", ARCHETYPES.lecturer),
  "Senior Lecturer": template("Lead teaching and research activities, support curriculum quality, and contribute experienced academic service.", ARCHETYPES.lecturer),
  Coordinator: template("Coordinate schedules, records, stakeholders, and operational activities to deliver agreed outcomes.", ARCHETYPES.coordinator),
  "Campus Operations Coordinator": template("Coordinate campus services, operational requests, schedules, records, and communication with service teams.", ARCHETYPES.coordinator),
  "Marketing and Communications Coordinator": template("Coordinate communication plans, campaigns, content schedules, approvals, and stakeholder engagement.", ARCHETYPES.coordinator),
  "Project Coordinator": template("Coordinate project schedules, documentation, risks, progress reporting, and stakeholder communication.", ARCHETYPES.coordinator),
  "Estates / Maintenance Coordinator": template("Coordinate maintenance requests, service schedules, contractor communication, records, and follow-up activities.", ARCHETYPES.coordinator),
  Manager: template("Lead assigned operations, people, resources, planning, reporting, and continuous service improvement.", ARCHETYPES.manager),
  "Finance Manager": template("Lead financial planning, controls, reporting, compliance, and the delivery of finance services.", ARCHETYPES.manager),
  "Accounting Manager": template("Lead accounting operations, reconciliations, reporting, controls, and the quality of financial records.", ARCHETYPES.manager),
  "Campus Operations Manager": template("Lead campus operations, service coordination, resources, staff, risk management, and performance reporting.", ARCHETYPES.manager),
  "Security Services Manager": template("Lead security services, operational planning, incident processes, staff coordination, and service standards.", ARCHETYPES.manager),
  "Facilities / Estates Manager": template("Lead facilities and estates services, maintenance planning, resources, compliance, and contractor coordination.", ARCHETYPES.manager),
  "General Manager": template("Provide overall leadership for operations, people, resources, planning, governance, and performance.", ARCHETYPES.manager),
  Supervisor: template("Supervise daily work, allocate tasks, support staff, maintain records, and monitor service standards.", ARCHETYPES.officer),
  "Library Assistant": template("Support library users, circulation, shelving, records, enquiries, and the organisation of library resources.", ARCHETYPES.service),
  "Laboratory Assistant": template("Prepare laboratory materials, maintain records and equipment, and support safe supervised activities.", ARCHETYPES.technical),
  "IT Support Assistant": template("Provide first-line technology support, document issues, assist users, and escalate unresolved problems.", ARCHETYPES.technical),
  "Front Desk Assistant": template("Welcome visitors, respond to enquiries, direct requests, maintain records, and support front-desk operations.", ARCHETYPES.service),
  "Exam Invigilator": template("Support orderly examinations by checking instructions, monitoring rooms, and documenting incidents accurately.", ARCHETYPES.service),
  "Student Advocate": template("Listen to student concerns, provide clear guidance, maintain appropriate records, and support access to services.", ARCHETYPES.service),
  "Social Media Assistant": template("Support approved social content, scheduling, basic design, engagement monitoring, and campaign reporting.", ARCHETYPES.administration),
} as const satisfies Record<string, JobTemplateDefaults>;

export const JOB_TITLES = Object.keys(JOB_TEMPLATES) as Array<keyof typeof JOB_TEMPLATES>;

const EMPTY_TEMPLATE_VALUES: JobTemplateDefaults = {
  description: "", jobType: undefined as unknown as JobInput["jobType"],
  gpaMin: null, hourlyPay: undefined as unknown as number,
  hours: undefined as unknown as number, skills: [],
};

export function getJobTemplate(title: string): JobTemplateDefaults | undefined {
  return Object.hasOwn(JOB_TEMPLATES, title)
    ? JOB_TEMPLATES[title as keyof typeof JOB_TEMPLATES]
    : undefined;
}

function valuesMatch(current: JobInput[JobTemplateField], previous: JobInput[JobTemplateField] | undefined) {
  return JSON.stringify(current) === JSON.stringify(previous);
}

function isEmpty(value: JobInput[JobTemplateField]) {
  return value === "" || value === null || value === undefined || (Array.isArray(value) && value.length === 0);
}

export function getMatchingJobTemplateValues(
  title: string,
  currentValues: JobTemplateDefaults
) {
  const templateValues = getJobTemplate(title);
  const matching: JobTemplateValues = {};
  if (!templateValues) return matching;

  for (const field of JOB_TEMPLATE_FIELDS) {
    if (valuesMatch(currentValues[field], templateValues[field])) {
      Object.assign(matching, { [field]: templateValues[field] });
    }
  }
  return matching;
}

export function getJobTemplateTransition(
  title: string,
  currentValues: JobTemplateDefaults,
  previousTemplateValues: JobTemplateValues
) {
  const nextTemplate = getJobTemplate(title);
  const updates: JobTemplateValues = {};
  const applied: JobTemplateValues = {};

  for (const field of JOB_TEMPLATE_FIELDS) {
    const current = currentValues[field];
    const previous = previousTemplateValues[field];
    const unchangedFromPrevious = previous !== undefined && valuesMatch(current, previous);
    if (nextTemplate && (field === "jobType" || isEmpty(current) || unchangedFromPrevious)) {
      Object.assign(updates, { [field]: nextTemplate[field] });
      Object.assign(applied, { [field]: nextTemplate[field] });
    } else if (!nextTemplate && unchangedFromPrevious) {
      Object.assign(updates, { [field]: EMPTY_TEMPLATE_VALUES[field] });
    }
  }
  return { updates, applied };
}
