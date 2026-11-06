import { z } from "zod";
import { ALIAS_MAX, ALIAS_MIN, MAX_LABEL_LENGTH, MAX_URL_LENGTH, QR_LEVELS, QR_SIZES } from "./constants";

export const styleSchema = z.object({
  fgColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  bgColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  level: z.enum(QR_LEVELS),
  size: z.coerce.number().refine((value) => QR_SIZES.includes(value)),
});

const aliasSchema = z.string().trim().toLowerCase().min(ALIAS_MIN).max(ALIAS_MAX).regex(/^[a-z0-9_-]+$/);
const labelSchema = z.string().trim().max(MAX_LABEL_LENGTH).optional();

export const createQrSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("new"),
    url: z.string().trim().min(1).max(MAX_URL_LENGTH),
    alias: aliasSchema.optional(),
    label: labelSchema,
    style: styleSchema.optional(),
  }),
  z.object({
    mode: z.literal("existing"),
    shorturl: z.string().trim().min(1).max(ALIAS_MAX),
    label: labelSchema,
    style: styleSchema.optional(),
  }),
]);

export const updateQrSchema = z.object({
  url: z.string().trim().min(1).max(MAX_URL_LENGTH).optional(),
  label: z.string().trim().max(MAX_LABEL_LENGTH).nullable().optional(),
  style: styleSchema.partial().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: "Nothing to update." });
