import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address");
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  role: z.enum(["shop", "extra"]),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const citySelectionSchema = z.object({
  slug: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(80),
  countryCode: z.string().trim().length(2),
  timezone: z.string().trim().min(1).max(64),
  lat: z.coerce.number().min(-90).max(90).nullish(),
  lng: z.coerce.number().min(-180).max(180).nullish(),
});

export const shopOnboardingSchema = z.object({
  shopName: z.string().trim().min(2, "Café name is required").max(120),
  address: z.string().trim().min(4, "Address is required").max(240),
});

export const extraOnboardingSchema = z.object({
  bio: z.string().trim().max(600).optional().default(""),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  hourlyRateCents: z.coerce.number().int().min(0).max(500_00).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
});

export const shopProfileSchema = z.object({
  name: z.string().trim().min(2, "Café name is required").max(120),
  address: z.string().trim().min(4, "Address is required").max(240),
  description: z.string().trim().max(1000).optional().default(""),
  website: z.union([z.literal(""), z.string().trim().url("Enter a valid URL")]).default(""),
  phone: z.string().trim().max(32).optional().default(""),
  machines: z
    .array(
      z.object({
        type: z.enum(["espresso_machine", "grinder", "brewer", "roaster", "other"]),
        name: z.string().trim().min(1, "Name the machine").max(80),
      }),
    )
    .max(12)
    .default([]),
  isPublished: z.boolean().default(false),
});

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");

export const availabilityWindowSchema = z.object({
  day: z.coerce.number().int().min(0).max(6),
  start: timeSchema,
  end: timeSchema,
});

export const openingHoursSchema = z
  .array(z.object({ open: timeSchema, close: timeSchema }).nullable())
  .length(7);

export const rateCardSchema = z.object({
  label: z.string().trim().min(1, "Name the rate").max(40),
  cents: z.coerce.number().int().min(0).max(500_00),
});

export const extraProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(600).optional().default(""),
  yearsExperience: z.coerce.number().int().min(0).max(60).nullable(),
  hourlyRateCents: z.coerce.number().int().min(0).max(500_00).nullable(),
  rates: z.array(rateCardSchema).max(6, "Six rates is plenty").default([]),
  signatureDrink: z.string().trim().max(80).optional().default(""),
  instagramHandle: z
    .string()
    .trim()
    .max(31)
    .regex(/^@?[A-Za-z0-9._]*$/, "Just the handle, e.g. tamper.tantrum")
    .transform((handle) => handle.replace(/^@/, ""))
    .optional()
    .default(""),
  skills: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  isAvailable: z.boolean().default(true),
  availability: z
    .object({
      weekly: z.array(availabilityWindowSchema).max(7),
      blackoutDates: z.array(z.string()).max(60),
    })
    .default({ weekly: [], blackoutDates: [] }),
});

export const gigShiftSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Pick an end time"),
});

export const gigSchema = z
  .object({
    kind: z.enum(["shift", "full_time", "part_time"]).default("shift"),
    title: z.string().trim().max(120).optional().default(""),
    description: z.string().trim().min(10, "Describe the role so baristas know what to expect").max(2000),
    shifts: z.array(gigShiftSchema).max(56, "That's more than eight weeks of shifts — split it up").default([]),
    weeklyHours: z.coerce.number().int().min(1).max(60).nullable().default(null),
    payRateCents: z.coerce.number().int().min(100, "Set the pay").max(10_000_00),
    payType: z.enum(["hourly", "flat", "monthly"]),
    requiredSkills: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
    isSos: z.boolean().default(false),
    status: z.enum(["draft", "open", "filled", "closed"]).default("open"),
  })
  .refine((gig) => gig.kind !== "shift" || gig.shifts.length > 0, {
    message: "Add at least one date",
    path: ["shifts"],
  });

export const interestSchema = z.object({
  announcementId: z.string().uuid(),
  message: z.string().trim().max(600).optional().default(""),
});

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string };

export function firstZodError(error: z.ZodError): { message: string; field?: string } {
  const issue = error.issues[0];
  return { message: issue?.message ?? "Invalid input", field: issue?.path.join(".") || undefined };
}
