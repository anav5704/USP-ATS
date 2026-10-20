"use client";

import { Button, Modal } from "@heroui/react";
import {
  AwardIcon,
  CalendarDaysIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GraduationCapIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SparklesIcon,
  TriangleAlertIcon,
  UserRoundIcon,
  WrenchIcon,
} from "lucide-react";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { FormModal } from "@/components/ui/form-modal";
import type {
  AdminApplicantListItem,
  AdminApplicantsTablePage,
} from "@/lib/applications/application-schema";
import { JOB_DATE_TIME_ZONE } from "@/lib/jobs/job-dates";

const dateFormatter = new Intl.DateTimeFormat("en-FJ", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: JOB_DATE_TIME_ZONE,
});

function fileSizeLabel(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ApplicantDetailsModal({
  job,
  application,
  isOpen,
  onOpenChange,
}: {
  job: AdminApplicantsTablePage["job"];
  application: AdminApplicantListItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const profile = application.applicant.profile;

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Applicant Details"
      info={{
        title: "Point-in-time snapshot",
        body: "Profile, application and AI assessment are exactly as captured when the student applied. The AI verdict is never recalculated after later profile edits.",
      }}
      size="lg"
    >
      <Modal.Body>
        <div className="space-y-6 pb-2">
            <div className="rounded-2xl border border-border bg-surface-secondary p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <UserRoundIcon className="size-5 text-muted" />
                    <h3 className="text-lg font-semibold text-foreground">
                      {application.applicant.name}
                    </h3>
                  </div>
                  <p className="mt-1 break-words text-sm text-muted">
                    Application for {job.title}
                  </p>
                </div>
                <ApplicationStatusBadge status={application.status} />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                <span className="flex min-w-0 items-start gap-2">
                  <MailIcon className="size-4 shrink-0" />
                  <span className="min-w-0 break-words">
                    {application.applicant.email}
                  </span>
                </span>
                <span className="flex min-w-0 items-start gap-2">
                  <CalendarDaysIcon className="size-4 shrink-0" />
                  <span className="min-w-0">
                    Applied {dateFormatter.format(new Date(application.createdAt))}
                  </span>
                </span>
                <span className="flex min-w-0 items-start gap-2">
                  <MapPinIcon className="size-4 shrink-0" />
                  <span className="min-w-0 break-words">
                    {profile?.campuses.length
                      ? profile.campuses.join(", ")
                      : "Campus/Centre not provided"}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <PhoneIcon className="size-4 shrink-0" />
                  {profile?.phone || "Phone not provided"}
                </span>
              </div>
            </div>

            {!profile ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-6 text-center">
                <CircleAlertIcon className="size-8 text-muted" />
                <p className="mt-3 font-medium text-foreground">
                  Profile information is unavailable
                </p>
                <p className="mt-1 text-sm text-muted">
                  This applicant does not currently have a stored profile.
                </p>
              </div>
            ) : (
              <>
                {profile.bio ? (
                  <section>
                    <h4 className="flex items-center gap-2 font-semibold text-foreground">
                      <UserRoundIcon className="size-4" /> General
                    </h4>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-muted">
                      {profile.bio}
                    </p>
                  </section>
                ) : null}

                <section>
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    <GraduationCapIcon className="size-4" /> Academic
                  </h4>
                  {profile.degrees.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {profile.degrees.map((degree, index) => (
                        <div
                          key={`${degree.name}-${index}`}
                          className="rounded-2xl border border-border p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="break-words font-medium text-foreground">
                                {degree.name}
                              </p>
                              <p className="text-sm text-muted">
                                GPA {degree.gpa.toFixed(2)} / 4.50
                              </p>
                            </div>
                            <a
                              href={degree.document.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-field border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-secondary"
                            >
                              <FileTextIcon className="size-3.5" />
                              {degree.documentType === "DEGREE"
                                ? "Degree document"
                                : "Transcript"}
                              <ExternalLinkIcon className="size-3" />
                            </a>
                          </div>
                          <p className="mt-2 break-all text-xs text-muted">
                            {degree.document.name} ({fileSizeLabel(degree.document.size)})
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted">No degrees provided.</p>
                  )}
                </section>

                <section>
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    <WrenchIcon className="size-4" /> Skills
                  </h4>
                  {profile.skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-surface-secondary px-3 py-1 text-xs text-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted">No skills provided.</p>
                  )}
                </section>

                <section>
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    <AwardIcon className="size-4" /> Certificates
                  </h4>
                  {profile.certificates.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {profile.certificates.map((certificate, index) => (
                        <div
                          key={`${certificate.label}-${index}`}
                          className="rounded-2xl border border-border p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="break-words font-medium text-foreground">
                                {certificate.label}
                              </p>
                              <p className="text-sm text-muted">
                                {certificate.organization || "Organization not provided"}
                              </p>
                            </div>
                            <a
                              href={certificate.file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-field border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-secondary"
                            >
                              <FileTextIcon className="size-3.5" /> View file
                              <ExternalLinkIcon className="size-3" />
                            </a>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                            <span className="break-all">{certificate.file.name}</span>
                            <span>
                              Uploaded {dateFormatter.format(new Date(certificate.uploadedAt))}
                            </span>
                            {certificate.url ? (
                              <a
                                href={certificate.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-foreground underline underline-offset-2"
                              >
                                Credential link
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted">
                      No certificates provided.
                    </p>
                  )}
                </section>

                <section>
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    <LinkIcon className="size-4" /> Links
                  </h4>
                  {profile.socialLinks.length > 0 ||
                  profile.profileLinks.length > 0 ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {profile.socialLinks.map((link, index) => (
                        <a
                          key={`${link.platform}-${index}`}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3 text-sm text-foreground transition-colors hover:bg-surface-secondary"
                        >
                          <span className="min-w-0 break-words">{link.platform}</span>
                          <ExternalLinkIcon className="size-3.5 shrink-0 text-muted" />
                        </a>
                      ))}
                      {profile.profileLinks.map((link, index) => (
                        <a
                          key={`${link.title}-${index}`}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3 text-sm text-foreground transition-colors hover:bg-surface-secondary"
                        >
                          <span className="min-w-0 break-words">{link.title}</span>
                          <ExternalLinkIcon className="size-3.5 shrink-0 text-muted" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted">No links provided.</p>
                  )}
                </section>
              </>
            )}

            <section>
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <FileTextIcon className="size-4" /> Cover Letter
              </h4>
              <div className="mt-3 rounded-2xl border border-dashed border-border bg-surface px-4 py-4">
                <p className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground">
                  {application.coverLetter}
                </p>
              </div>
            </section>

            {application.score?.status === "COMPLETE" ? (
              <section>
                <h4 className="flex items-center gap-2 font-semibold text-foreground">
                  <SparklesIcon className="size-4" /> AI Assessment
                </h4>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    {application.score.eligible ? (
                      <CircleCheckIcon className="size-4 text-success" />
                    ) : (
                      <TriangleAlertIcon className="size-4 text-danger" />
                    )}
                    <span className="font-medium text-foreground">
                      {application.score.eligible
                        ? "Meets the stated requirements"
                        : "Does not meet the stated requirements"}
                    </span>
                  </div>

                  {application.score.qualificationFit ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Qualification fit
                      </p>
                      <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-foreground">
                        {application.score.qualificationFit}
                      </p>
                    </div>
                  ) : null}

                  {application.score.motivationFit ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Motivation fit
                      </p>
                      <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-foreground">
                        {application.score.motivationFit}
                      </p>
                    </div>
                  ) : null}

                  {application.score.missingRequirements.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Missing requirements
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                        {application.score.missingRequirements.map((requirement) => (
                          <li key={requirement}>{requirement}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button.Root variant="ghost" onPress={() => onOpenChange(false)} className="w-full sm:w-auto">
          Close
        </Button.Root>
      </Modal.Footer>
    </FormModal>
  );
}
