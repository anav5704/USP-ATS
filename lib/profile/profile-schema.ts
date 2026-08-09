import { z } from "zod";

export const educationInputSchema = z.object({
  institution: z
    .string()
    .trim()
    .min(1, "Institution is required")
    .max(200, "Institution name is too long"),
  program: z.string().trim().max(200, "Program name is too long"),
});

export const projectInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(200, "Project name is too long"),
  description: z.string().trim().max(2000, "Description is too long"),
  link: z.union([
    z.string().trim().url("Enter a valid URL").max(2000, "Link is too long"),
    z.literal(""),
  ]),
});

export const profileInputSchema = z.object({
  gpa: z
    .number({ error: "Enter your GPA" })
    .min(0, "GPA must be between 0 and 4.5")
    .max(4.5, "GPA must be between 0 and 4.5"),
  skills: z
    .string()
    .trim()
    .min(1, "Technical skills are required")
    .max(5000, "Skills are too long"),
  degrees: z
    .array(z.string().trim().min(1, "Degree name is required"))
    .min(1, "Add at least one degree")
    .max(20, "Too many degrees"),
  education: z
    .array(educationInputSchema)
    .min(1, "Add at least one education entry")
    .max(20, "Too many education entries"),
  projects: z
    .array(projectInputSchema)
    .max(20, "Too many projects"),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type EducationInput = z.infer<typeof educationInputSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
