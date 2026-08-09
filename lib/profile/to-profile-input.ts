import type { ProfileInput } from "@/lib/profile/profile-schema";

export type ProfileModel = {
  gpa: string | number | null;
  skills: string | null;
  degrees: string[];
  education: { institution: string; program: string | null }[];
  projects: { name: string; description: string | null; link: string | null }[];
};

export function toProfileInput(profile: ProfileModel): ProfileInput {
  return {
    gpa: profile.gpa == null ? (undefined as unknown as number) : Number(profile.gpa),
    skills: profile.skills ?? "",
    degrees: profile.degrees,
    education: profile.education.map((entry) => ({
      institution: entry.institution,
      program: entry.program ?? "",
    })),
    projects: profile.projects.map((project) => ({
      name: project.name,
      description: project.description ?? "",
      link: project.link ?? "",
    })),
  };
}
