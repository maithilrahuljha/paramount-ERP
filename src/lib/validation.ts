/**
 * PMN ERP Platform - Validation Utilities
 * 
 * Zod schemas for request validation.
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be at most 15 digits')
  .regex(/^[+]?[\d\s-]+$/, 'Invalid phone number format');

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .optional()
  .nullable();

// ============================================================================
// Lead Schemas
// ============================================================================

export const leadStatusSchema = z.enum([
  'new',
  'assigned',
  'contacted',
  'qualified',
  'counselling',
  'follow_up',
  'admission_ready',
  'converted',
  'lost',
  'archived',
]);

export const leadStageSchema = z.enum(['stage_1', 'stage_2', 'stage_3', 'stage_4']);

export const leadPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

// Stage 1 - Lead Capture (Minimal fields)
export const createLeadSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  mobileNumber: phoneSchema,
  leadSource: z.string().min(1, 'Lead source is required'),
  interestedCourse: z.string().optional(),
  preferredLanguage: z.string().default('english'),
  city: z.string().optional(),
  consentToContact: z.boolean().default(true),
  email: emailSchema,
  notes: z.string().optional(),
  assignedTo: uuidSchema.optional(),
});

// Full lead update (all stages)
export const updateLeadSchema = z.object({
  // Stage 1
  fullName: z.string().min(2).max(255).optional(),
  mobileNumber: phoneSchema.optional(),
  email: emailSchema,
  leadSource: z.string().optional(),
  interestedCourse: z.string().optional(),
  preferredLanguage: z.string().optional(),
  city: z.string().optional(),
  consentToContact: z.boolean().optional(),
  
  // Stage 2
  qualification: z.string().optional(),
  pcmBackground: z.boolean().optional(),
  passingYear: z.number().int().min(1980).max(2030).optional(),
  preferredBatch: z.string().optional(),
  modePreference: z.enum(['online', 'offline', 'hybrid']).optional(),
  budgetRange: z.string().optional(),
  parentAvailability: z.boolean().optional(),
  
  // Stage 3
  careerGoal: z.string().optional(),
  sponsorshipInterest: z.boolean().optional(),
  passportStatus: z.string().optional(),
  previousImuAttempt: z.boolean().optional(),
  medicalAwareness: z.boolean().optional(),
  decisionMaker: z.string().optional(),
  
  // Stage 4 - Fee details are for REFERENCE ONLY (billing via Razorpay)
  documentsAvailable: z.array(z.string()).optional(),
  feeDiscussionDone: z.boolean().optional(),
  feeAmountDiscussed: z.string().optional(), // Manual entry - reference only
  scholarshipInterest: z.boolean().optional(),
  parentCounsellingDone: z.boolean().optional(),
  admissionProbability: z.number().int().min(0).max(100).optional(),
  joiningMonth: z.string().optional(),
  
  // Management
  status: leadStatusSchema.optional(),
  stage: leadStageSchema.optional(),
  assignedTo: uuidSchema.nullable().optional(),
  priority: leadPrioritySchema.optional(),
  tags: z.array(z.string()).optional(),
  nextFollowUpAt: z.coerce.date().optional(),
  notes: z.string().optional(),
  lostReason: z.string().optional(),
});

export const leadFiltersSchema = z.object({
  status: z.union([leadStatusSchema, z.array(leadStatusSchema)]).optional(),
  stage: z.union([leadStageSchema, z.array(leadStageSchema)]).optional(),
  leadSource: z.union([z.string(), z.array(z.string())]).optional(),
  assignedTo: uuidSchema.optional(),
  interestedCourse: z.string().optional(),
  city: z.string().optional(),
  priority: leadPrioritySchema.optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  nextFollowUpBefore: z.coerce.date().optional(),
  search: z.string().optional(),
});

export const updateLeadStatusSchema = z.object({
  status: leadStatusSchema,
  reason: z.string().optional(),
});

export const assignLeadSchema = z.object({
  assigneeId: uuidSchema,
});

// ============================================================================
// Task Schemas
// ============================================================================

export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

export const taskPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  type: z.string().min(1, 'Task type is required'),
  priority: taskPrioritySchema.default('normal'),
  dueDate: z.coerce.date().optional(),
  leadId: uuidSchema.optional(),
  assignedTo: uuidSchema.optional(),
  reminderAt: z.coerce.date().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: z.coerce.date().optional(),
  assignedTo: uuidSchema.nullable().optional(),
  reminderAt: z.coerce.date().nullable().optional(),
});

export const taskFiltersSchema = z.object({
  status: z.union([taskStatusSchema, z.array(taskStatusSchema)]).optional(),
  priority: taskPrioritySchema.optional(),
  assignedTo: uuidSchema.optional(),
  leadId: uuidSchema.optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
});

// ============================================================================
// Follow-up Schemas
// ============================================================================

export const createFollowUpSchema = z.object({
  leadId: uuidSchema,
  scheduledAt: z.coerce.date(),
  type: z.string().min(1, 'Follow-up type is required'),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  assignedTo: uuidSchema.optional(),
});

export const updateFollowUpSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  type: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  isCompleted: z.boolean().optional(),
  assignedTo: uuidSchema.nullable().optional(),
});

export const completeFollowUpSchema = z.object({
  outcome: z.string().min(1, 'Outcome is required'),
});

// ============================================================================
// Communication Schemas
// ============================================================================

export const communicationTypeSchema = z.enum([
  'call',
  'email',
  'sms',
  'whatsapp',
  'meeting',
  'note',
]);

export const communicationDirectionSchema = z.enum(['inbound', 'outbound']);

export const logCommunicationSchema = z.object({
  leadId: uuidSchema,
  type: communicationTypeSchema,
  direction: communicationDirectionSchema,
  subject: z.string().optional(),
  content: z.string().optional(),
  duration: z.number().int().min(0).optional(), // seconds
  outcome: z.string().optional(),
});

// ============================================================================
// Note Schemas
// ============================================================================

export const createNoteSchema = z.object({
  leadId: uuidSchema,
  content: z.string().min(1, 'Note content is required'),
  isPinned: z.boolean().default(false),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadFilters = z.infer<typeof leadFiltersSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
export type LogCommunicationInput = z.infer<typeof logCommunicationSchema>;
