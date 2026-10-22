export type FaqRole = "admin" | "member";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

export const COMMON_FAQ_COUNT = 6;

export const ADMIN_FAQS: readonly FaqItem[] = [
  {
    id: "admin-create-job",
    question: "How do I create a new job posting?",
    answer:
      'From the Job Postings page, select "Create New Job". Complete the required job information, including the job title, description, department, job type, campus or centre, requirements, pay or volunteer benefit, and application deadline. Submit the posting for approval when it is ready. Another administrator must approve it before it becomes active and visible to members.',
    keywords: ["create", "new", "job", "posting", "publish", "vacancy", "approval"],
  },
  {
    id: "admin-edit-job",
    question: "Can I edit an existing job posting?",
    answer:
      'Yes. Select "Modify" beside the job posting you want to update. Your changes are submitted as a modification request and take effect after another administrator approves them. Editing a posting does not recalculate existing applicant AI scores.',
    keywords: ["edit", "modify", "update", "job", "posting", "approval"],
  },
  {
    id: "admin-archive-job",
    question: "What happens when I archive a job posting?",
    answer:
      "Archiving removes the posting from active opportunities and prevents new applications. The posting and its associated applications, applicant details, scores and approval history are preserved for Administrators. An archived posting can later be unarchived. If its application deadline has not passed, it can be restored to Active status directly. If its deadline has already passed, a new future deadline must be provided and approved by another Administrator before the posting becomes Active again.",
    keywords: ["delete", "archive", "archived", "remove", "applications", "history"],
  },
  {
    id: "admin-view-applicants",
    question: "How do I view applicants for a job?",
    answer:
      "Open the relevant job posting's applicant list by selecting its applicant count. From there, you can review the members who have applied and open an applicant's details for profile, application, and scoring information.",
    keywords: ["applicant", "applicants", "applications", "view", "member", "profile"],
  },
  {
    id: "admin-application-statuses",
    question: "What do the application statuses mean?",
    answer:
      "Application statuses indicate where an applicant currently sits in the recruitment process. The supported statuses are Applied, Shortlisted, Accepted, Declined, and Withdrawn.",
    keywords: ["status", "applied", "shortlisted", "accepted", "declined", "withdrawn", "application"],
  },
  {
    id: "admin-ai-scoring",
    question: "How does AI applicant scoring work?",
    answer:
      "After an application is submitted, the system asynchronously evaluates the member's profile and cover letter against the job requirements. It provides a match score, eligibility result, fit reasoning, and missing requirements to administrators. The score supports recruitment decisions and does not replace administrator judgment.",
    keywords: ["AI", "score", "scoring", "recommendation", "applicant", "assessment", "ranking"],
  },
  {
    id: "admin-job-visibility",
    question: "When does a newly created job become visible to members?",
    answer:
      "A newly created posting is submitted for approval. It becomes active and appears in the member Job Feed only after a different administrator approves it, provided its application deadline has not passed.",
    keywords: ["visible", "publish", "active", "member", "job feed", "posting", "approval"],
  },
  {
    id: "admin-multiple-campuses",
    question: "Can a job posting be available at more than one campus or centre?",
    answer:
      "Yes. Multiple campuses or centres can be selected when configuring a job posting.",
    keywords: ["campus", "centre", "location", "multiple"],
  },
  {
    id: "admin-deadline",
    question: "What happens when a job reaches its application deadline?",
    answer:
      "Once the application deadline has passed, the posting is automatically Archived and Members can no longer submit new applications. An Administrator may later attempt to unarchive the posting, but a new future application deadline must be provided and approved by another Administrator before the posting can become Active again.",
    keywords: ["deadline", "close", "closed", "application", "expiry"],
  },
  {
    id: "admin-job-status",
    question: "Can I change the status of a job posting?",
    answer:
      "You can archive an active posting from its status control. Archived jobs remain available to administrators for historical and application records, but they are not treated as active opportunities. The current interface does not provide an option to reactivate an archived posting.",
    keywords: ["status", "active", "archived", "archive", "posting", "reactivate"],
  },
  {
    id: "admin-applicant-information",
    question: "What information can I see about an applicant?",
    answer:
      "Administrators can review the applicant information available through the member's profile, including contact and campus information, biography, academic qualifications and GPA, skills, supporting documents, certificates, links, and application details.",
    keywords: ["applicant", "profile", "academic", "skills", "information", "documents"],
  },
  {
    id: "admin-edit-after-applications",
    question: "What happens if I edit a job after members have already applied?",
    answer:
      "The proposed changes take effect after another administrator approves the modification. Existing applications and their previously generated AI scores are not automatically recalculated.",
    keywords: ["edit", "existing", "application", "AI", "score", "recalculate", "approval"],
  },
  {
    id: "admin-job-templates",
    question: "What are the job title templates?",
    answer:
      "Job title templates provide predefined information for common USP roles. Selecting a template automatically populates relevant job information, which you can then edit before submitting the posting for approval.",
    keywords: ["template", "title", "autofill", "predefined", "job"],
  },
  {
    id: "admin-modify-template",
    question: "Can I modify information filled in by a job template?",
    answer:
      "Yes. Template information is a starting point. You can edit the populated fields to suit the specific position before submitting the job for approval.",
    keywords: ["template", "modify", "edit", "autofill"],
  },
  {
    id: "admin-volunteer",
    question: "How are volunteer positions handled?",
    answer:
      "Volunteer positions can be created with an hourly pay of zero. The posting can also describe a benefit or perk provided with the volunteer opportunity.",
    keywords: ["volunteer", "unpaid", "benefit", "pay", "salary"],
  },
  {
    id: "admin-search-jobs",
    question: "How do I search for a job posting?",
    answer:
      "Use the search field on the Job Postings page to find postings by title, department, or campus.",
    keywords: ["search", "find", "job", "title", "department", "campus"],
  },
  {
    id: "admin-filter-jobs",
    question: "How do I filter job postings?",
    answer:
      'Select "Filters" on the Job Postings page to narrow postings by job type, campus or centre, GPA requirement, qualification, skills, or status.',
    keywords: ["filter", "filters", "search", "job", "posting", "status", "skills", "GPA"],
  },
  {
    id: "admin-permanent-delete",
    question: "Can I permanently delete a job posting?",
    answer:
      "No. The current system archives postings instead of permanently deleting them. This preserves associated applications, applicant details, scores and approval history. Archived postings can also be restored through the Unarchive functionality where required.",
    keywords: ["delete", "permanent", "archive", "applicant", "application", "history"],
  },
  {
    id: "admin-theme",
    question: "How do I switch between light and dark mode?",
    answer:
      'Use the "Display" switch in the sidebar. Your selected theme is applied throughout the system, including pages, forms, dialogs, and other interface components.',
    keywords: ["display", "theme", "dark", "light", "mode", "appearance"],
  },
  {
    id: "admin-sign-out",
    question: "How do I sign out?",
    answer:
      'Select "Sign Out" at the bottom of the sidebar to end your current session.',
    keywords: ["sign out", "logout", "log out", "exit", "session"],
  },
];

export const MEMBER_FAQS: readonly FaqItem[] = [
  {
    id: "member-find-jobs",
    question: "How do I find available jobs?",
    answer:
      'Open "Job Feed" from the sidebar. Available opportunities are organised to help you discover jobs based on factors such as campus or centre and academic relevance, along with other available opportunities.',
    keywords: ["find", "jobs", "job feed", "opportunities", "available"],
  },
  {
    id: "member-apply",
    question: "How do I apply for a job?",
    answer:
      'Select a job from the Job Feed to view its details, then click "Apply Now". Enter your cover letter and click "Submit Application" to submit your application.',
    keywords: ["apply", "application", "job", "cover letter", "submit", "requirements"],
  },
  {
    id: "member-check-status",
    question: "How can I check the status of my application?",
    answer:
      'Open "My Applications" from the sidebar. Your applications and their current recruitment statuses are displayed there.',
    keywords: ["application", "status", "my applications", "submitted", "progress"],
  },
  {
    id: "member-application-statuses",
    question: "What do the application statuses mean?",
    answer:
      "Applied means your application has been received. Shortlisted means it has progressed for further consideration. Accepted means your application was successful, Declined means it was not selected, and Withdrawn means you withdrew it from consideration.",
    keywords: ["status", "applied", "submitted", "shortlisted", "accepted", "declined", "withdrawn"],
  },
  {
    id: "member-withdraw",
    question: "Can I withdraw an application after submitting it?",
    answer:
      "You can withdraw an application while its status is Applied. Once it has been shortlisted, accepted, declined, or already withdrawn, the withdrawal option is no longer available.",
    keywords: ["withdraw", "cancel", "application", "submitted", "applied"],
  },
  {
    id: "member-profile-importance",
    question: "Why is completing my profile important?",
    answer:
      "Your profile contains information used throughout the application and assessment process, including academic details, skills, and supporting information. Keeping it complete and accurate helps administrators properly assess your application.",
    keywords: ["profile", "complete", "academic", "skills", "information"],
  },
  {
    id: "member-feed-groups",
    question: "How are jobs organised in my Job Feed?",
    answer:
      "The Job Feed groups active opportunities into Near You for jobs matching your campus or centre, Matching Qualification for jobs matching your degree, and Other Opportunities for jobs matching neither. Jobs are shown newest first within each group.",
    keywords: ["job feed", "organise", "campus", "academic", "matching", "opportunities", "near"],
  },
  {
    id: "member-search-jobs",
    question: "How do I search for a particular job?",
    answer:
      "Use the search bar at the top of the Job Feed to search available opportunities by job title or description.",
    keywords: ["search", "find", "job", "title", "description"],
  },
  {
    id: "member-filter-jobs",
    question: "Can I filter the jobs displayed in my Job Feed?",
    answer:
      'Yes. Select "Filters" to narrow opportunities by job type, campus or centre, GPA requirement, qualification, or skills.',
    keywords: ["filter", "filters", "job feed", "search", "GPA", "skills", "campus"],
  },
  {
    id: "member-job-details",
    question: "Where can I see the full details of a job?",
    answer:
      "Select the relevant job card from the Job Feed to open its details and review information such as the description, requirements, location, working hours, compensation, and deadline.",
    keywords: ["details", "description", "requirements", "hours", "pay", "deadline", "job"],
  },
  {
    id: "member-late-application",
    question: "Can I apply after the application deadline?",
    answer:
      "No. Applications must be submitted by the job's specified deadline.",
    keywords: ["deadline", "apply", "late", "closed", "application"],
  },
  {
    id: "member-multiple-jobs",
    question: "Can I apply for more than one job?",
    answer:
      "Yes. You can apply for multiple active opportunities while their application periods are open. Listed requirements do not prevent you from submitting an application.",
    keywords: ["multiple", "jobs", "apply", "applications", "requirements"],
  },
  {
    id: "member-edit-application",
    question: "Can I edit an application after submitting it?",
    answer:
      "No. The system does not provide an option to edit a submitted application. Review your cover letter before submitting it.",
    keywords: ["edit", "application", "submitted", "change", "modify", "cover letter"],
  },
  {
    id: "member-update-profile",
    question: "Where can I update my personal and academic information?",
    answer:
      'Open "Profile" from the sidebar. Your profile contains your general information, academic qualifications, skills, certificates, and relevant links supported by the system.',
    keywords: ["profile", "update", "personal", "academic", "skills", "certificates"],
  },
  {
    id: "member-upload-documents",
    question: "Can I upload my transcript or other supporting documents?",
    answer:
      "Yes. Each academic qualification requires a transcript or degree document, and certificates include a supporting file. You can upload these documents through your profile.",
    keywords: ["upload", "transcript", "document", "certificate", "academic", "profile", "degree"],
  },
  {
    id: "member-profile-information",
    question: "What information should I keep updated in my profile?",
    answer:
      "Keep your contact details, campus or centre, biography, academic qualifications and GPA, skills, supporting documents, certificates, and relevant links accurate and current.",
    keywords: ["profile", "update", "GPA", "skills", "campus", "contact", "documents"],
  },
  {
    id: "member-campus-priority",
    question: "Why am I seeing jobs from my campus or centre first?",
    answer:
      "The Near You group contains active opportunities associated with a campus or centre saved in your profile, helping you discover nearby jobs.",
    keywords: ["campus", "centre", "location", "ranking", "job feed", "near"],
  },
  {
    id: "member-qualification-match",
    question: "Why am I seeing jobs related to my academic qualification?",
    answer:
      "The Matching Qualification group uses degree information from your profile to organise opportunities that may match your academic background. A match does not guarantee eligibility or selection.",
    keywords: ["academic", "qualification", "degree", "matching", "job feed", "relevant"],
  },
  {
    id: "member-ai-decision",
    question: "Does the system automatically decide whether I get a job?",
    answer:
      "No. Matching and AI-assisted assessment support the recruitment process. Final recruitment decisions are made by administrators.",
    keywords: ["AI", "decision", "scoring", "accepted", "recruitment", "automatic"],
  },
  {
    id: "member-theme",
    question: "How do I switch between light and dark mode?",
    answer:
      'Use the "Display" switch in the sidebar. The selected theme is applied throughout the system.',
    keywords: ["display", "dark", "light", "theme", "mode", "appearance"],
  },
  {
    id: "member-sign-out",
    question: "How do I sign out?",
    answer:
      'Select "Sign Out" at the bottom of the sidebar to securely end your current session.',
    keywords: ["sign out", "logout", "log out", "exit", "session"],
  },
];

export function getFaqsForRole(role: FaqRole): readonly FaqItem[] {
  return role === "admin" ? ADMIN_FAQS : MEMBER_FAQS;
}
