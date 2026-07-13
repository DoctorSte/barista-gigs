import { z } from "zod";
import { PAY_TYPES, SKILLS, USER_ROLES } from "./constants";

export const weeklySlotSchema = z.object({
  day: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const availabilitySchema = z.object({
  weekly: z.array(weeklySlotSchema),
  blackoutDates: z.array(z.string()),
});

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(USER_ROLES),
  displayName: z.string().min(2).max(80),
  citySlug: z.string().min(2),
});

export const shopProfileSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().min(5).max(300),
  machines: z.array(z.string()).min(1),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().max(40).optional(),
  isPublished: z.boolean(),
});

export const extraProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  hourlyRateCents: z.number().int().min(0).optional(),
  currency: z.string().length(3).default("EUR"),
  availability: availabilitySchema,
  skills: z.array(z.enum(SKILLS)).min(1),
  isAvailable: z.boolean(),
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(4000),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  payRateCents: z.number().int().min(0),
  payType: z.enum(PAY_TYPES),
  requiredSkills: z.array(z.enum(SKILLS)),
  status: z.enum(["draft", "open"]),
});

export const interestSchema = z.object({
  announcementId: z.string().uuid(),
  message: z.string().min(10).max(1000),
});

export const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});
