import { z } from "zod";

export const gpaFilterSchema = z.string().trim().refine(
  (value) => value === "" || (
    Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 4.5
  ),
  "GPA must be between 0 and 4.5."
);
