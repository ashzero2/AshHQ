import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  category: z.string().max(50).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  id: z.string(),
  completedAt: z.coerce.date().nullable().optional(),
});

const EventBaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  color: z.string().optional().default("#3b82f6"),
  allDay: z.boolean().optional().default(false),
});

export const CreateEventSchema = EventBaseSchema.refine((d) => d.endTime > d.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const UpdateEventSchema = EventBaseSchema.partial().extend({
  id: z.string(),
});

export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1).max(50),
  description: z.string().max(500).nullable().optional(),
  date: z.coerce.date(),
});

export const CreateBudgetSchema = z.object({
  category: z.string().min(1).max(50),
  amount: z.number().positive(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

export const CreateHabitSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional().default("✅"),
  color: z.string().optional().default("#10b981"),
  frequency: z.enum(["DAILY", "WEEKLY"]).optional().default("DAILY"),
});

export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional().default(""),
  pinned: z.boolean().optional().default(false),
});

export const UpdateNoteSchema = CreateNoteSchema.partial().extend({
  id: z.string(),
});

export const CreateQuickLinkSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().url(),
  icon: z.string().max(500).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  sortOrder: z.number().default(0),
});

export const UpdateSettingsSchema = z.object({
  aiProvider: z.enum(["OPENAI", "OLLAMA", "GEMINI"]).optional(),
  openaiApiKey: z.string().nullable().optional(),
  openaiModel: z.string().optional(),
  ollamaBaseUrl: z.string().optional(),
  ollamaModel: z.string().optional(),
  geminiApiKey: z.string().nullable().optional(),
  geminiModel: z.string().optional(),
  weatherApiKey: z.string().nullable().optional(),
  weatherCity: z.string().optional(),
  temperatureUnit: z.enum(["C", "F"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export const PinSchema = z.object({
  pin: z.string().min(4).max(20),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;
export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type CreateQuickLinkInput = z.infer<typeof CreateQuickLinkSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
