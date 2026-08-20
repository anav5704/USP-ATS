import { z } from "zod";
import {
  MAX_UPLOAD_COUNT,
  MAX_UPLOAD_SIZE,
  isSafeStoredName,
} from "@/lib/profile/upload";

const PHONE_PATTERN = /^\+?[0-9][0-9\s()-]{5,19}$/;

export const fileRefSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "File name is required")
    .max(255, "File name is too long"),
  stored: z
    .string()
    .trim()
    .refine(isSafeStoredName, "Invalid stored file name"),
  type: z.string().trim().min(1, "File type is required"),
  size: z
    .number({ error: "File size is required" })
    .int("File size is invalid")
    .positive("File size is invalid")
    .max(MAX_UPLOAD_SIZE, "File is too large"),
});

export const certificateInputSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Certificate name is required")
    .max(200, "Certificate name is too long"),
  organization: z
    .string()
    .trim()
    .min(1, "Organization is required")
    .max(200, "Organization name is too long"),
  url: z.union([
    z.string().trim().url("Enter a valid URL").max(2000, "Link is too long"),
    z.literal(""),
  ]),
  uploadedAt: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00`)), "Enter a valid date"),
  file: fileRefSchema.nullable(),
});

export const socialLinkInputSchema = z.object({
  platform: z
    .string()
    .trim()
    .min(1, "Platform is required")
    .max(50, "Platform name is too long"),
  url: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(2000, "Link is too long"),
});

export const projectLinkInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title is too long"),
  url: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(2000, "Link is too long"),
});

export const profileInputSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .max(30, "Phone number is too long")
      .refine(
        (value) => value === "" || PHONE_PATTERN.test(value),
        "Enter a valid phone number (e.g. +679 323 1000)"
      ),
    bio: z.string().trim().max(500, "Bio is too long"),
    campuses: z
      .array(z.string().trim().min(1, "Campus name is required"))
      .min(1, "Select your campus or centre")
      .max(20, "Too many campuses"),
    title: z.string().trim().max(200, "Title is too long"),
    degreeStatus: z.enum(["in_progress", "completed"]),
    gpa: z
      .number({ error: "Enter your GPA" })
      .min(0, "GPA must be between 0.00 and 4.50")
      .max(4.5, "GPA must be between 0.00 and 4.50")
      .refine(
        (value) => Math.round(value * 100) / 100 === value,
        "GPA can have at most 2 decimal places"
      ),
    skills: z
      .array(z.string().trim().min(1, "Skill name is required"))
      .min(1, "Select at least one skill")
      .max(10, "You can select up to 10 skills"),
    degrees: z
      .array(z.string().trim().min(1, "Degree name is required"))
      .min(1, "Add at least one degree")
      .max(20, "Too many degrees"),
    transcript: fileRefSchema.nullable(),
    certificates: z
      .array(certificateInputSchema)
      .max(MAX_UPLOAD_COUNT, `You can add up to ${MAX_UPLOAD_COUNT} certificates`),
    socialLinks: z
      .array(socialLinkInputSchema)
      .max(20, "Too many social links"),
    projectLinks: z
      .array(projectLinkInputSchema)
      .max(20, "Too many project links"),
  })
  .superRefine((data, ctx) => {
    if (!data.transcript) {
      ctx.addIssue({
        code: "custom",
        path: ["transcript"],
        message: "Transcript is required",
      });
    }
    data.certificates.forEach((entry, index) => {
      if (!entry.file) {
        ctx.addIssue({
          code: "custom",
          path: ["certificates", index, "file"],
          message: "Upload a file",
        });
      }
    });
  });

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type CertificateInput = z.infer<typeof certificateInputSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkInputSchema>;
export type ProjectLinkInput = z.infer<typeof projectLinkInputSchema>;
export type FileRef = z.infer<typeof fileRefSchema>;