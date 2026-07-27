/**
 * PMN ERP Platform - Database Schema
 * 
 * Defines all database tables using Drizzle ORM.
 * Tables are organized by module for maintainability.
 */

import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const leadStatusEnum = pgEnum('lead_status', [
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

export const leadStageEnum = pgEnum('lead_stage', [
  'stage_1', // Basic info
  'stage_2', // Qualification
  'stage_3', // Career details
  'stage_4', // Admission readiness
]);

export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]);

export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'normal',
  'high',
  'urgent',
]);

export const communicationTypeEnum = pgEnum('communication_type', [
  'call',
  'email',
  'sms',
  'whatsapp',
  'meeting',
  'note',
]);

export const communicationDirectionEnum = pgEnum('communication_direction', [
  'inbound',
  'outbound',
]);

export const activityTypeEnum = pgEnum('activity_type', [
  'lead_created',
  'lead_updated',
  'lead_assigned',
  'status_changed',
  'stage_changed',
  'task_created',
  'task_completed',
  'note_added',
  'communication_logged',
  'follow_up_scheduled',
  'document_uploaded',
]);

// ============================================================================
// SYSTEM TABLES
// ============================================================================

/**
 * Users table - Stores all platform users
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  passwordHash: text('password_hash'),
  googleId: varchar('google_id', { length: 255 }),
  roles: jsonb('roles').$type<string[]>().default([]).notNull(),
  permissions: jsonb('permissions').$type<string[]>().default([]).notNull(),
  department: varchar('department', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_google_id_idx').on(table.googleId),
]);

/**
 * Sessions table - For authentication sessions
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_token_idx').on(table.token),
]);

/**
 * Audit logs table - Track all changes
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  userId: uuid('user_id').references(() => users.id),
  module: varchar('module', { length: 50 }).notNull(),
  changes: jsonb('changes').$type<{ field: string; oldValue: unknown; newValue: unknown }[]>().default([]).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => [
  index('audit_logs_resource_idx').on(table.resource, table.resourceId),
  index('audit_logs_user_id_idx').on(table.userId),
  index('audit_logs_timestamp_idx').on(table.timestamp),
]);

/**
 * Notifications table
 */
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  module: varchar('module', { length: 50 }).notNull(),
  actionUrl: text('action_url'),
  isRead: boolean('is_read').default(false).notNull(),
  priority: varchar('priority', { length: 20 }).default('normal').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
  index('notifications_is_read_idx').on(table.isRead),
]);

/**
 * Configuration table - Runtime configuration storage
 */
export const configurations = pgTable('configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: jsonb('value').notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  description: text('description'),
  isSecret: boolean('is_secret').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('configurations_key_idx').on(table.key),
  index('configurations_module_idx').on(table.module),
]);

/**
 * Events table - Event sourcing storage
 */
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 100 }).notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  correlationId: uuid('correlation_id'),
  causationId: uuid('causation_id'),
  payload: jsonb('payload').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => [
  index('events_type_idx').on(table.type),
  index('events_source_idx').on(table.source),
  index('events_timestamp_idx').on(table.timestamp),
  index('events_correlation_id_idx').on(table.correlationId),
]);

// ============================================================================
// CRM MODULE TABLES
// ============================================================================

/**
 * Leads table - Core CRM entity
 * Implements progressive data collection across 4 stages
 */
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Stage 1 - Lead Capture (Required minimal info)
  fullName: varchar('full_name', { length: 255 }).notNull(),
  mobileNumber: varchar('mobile_number', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  leadSource: varchar('lead_source', { length: 50 }).notNull(),
  interestedCourse: varchar('interested_course', { length: 100 }),
  preferredLanguage: varchar('preferred_language', { length: 20 }).default('english'),
  city: varchar('city', { length: 100 }),
  consentToContact: boolean('consent_to_contact').default(true).notNull(),
  
  // Stage 2 - Qualification
  qualification: varchar('qualification', { length: 100 }),
  pcmBackground: boolean('pcm_background'),
  passingYear: integer('passing_year'),
  preferredBatch: varchar('preferred_batch', { length: 50 }),
  modePreference: varchar('mode_preference', { length: 20 }), // online/offline
  budgetRange: varchar('budget_range', { length: 50 }),
  parentAvailability: boolean('parent_availability'),
  
  // Stage 3 - Career Details
  careerGoal: text('career_goal'),
  sponsorshipInterest: boolean('sponsorship_interest'),
  passportStatus: varchar('passport_status', { length: 50 }),
  previousImuAttempt: boolean('previous_imu_attempt'),
  medicalAwareness: boolean('medical_awareness'),
  decisionMaker: varchar('decision_maker', { length: 100 }),
  
  // Stage 4 - Admission Readiness
  documentsAvailable: jsonb('documents_available').$type<string[]>().default([]),
  feeDiscussionDone: boolean('fee_discussion_done'),
  feeAmountDiscussed: varchar('fee_amount_discussed', { length: 100 }), // Manual entry - for reference only
  scholarshipInterest: boolean('scholarship_interest'),
  parentCounsellingDone: boolean('parent_counselling_done'),
  admissionProbability: integer('admission_probability'), // 0-100
  joiningMonth: varchar('joining_month', { length: 20 }),
  
  // Lead Management
  status: leadStatusEnum('status').default('new').notNull(),
  stage: leadStageEnum('stage').default('stage_1').notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  score: integer('score').default(0),
  priority: varchar('priority', { length: 20 }).default('normal'),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  // Follow-up
  lastContactedAt: timestamp('last_contacted_at'),
  nextFollowUpAt: timestamp('next_follow_up_at'),
  followUpCount: integer('follow_up_count').default(0),
  
  // Conversion
  convertedAt: timestamp('converted_at'),
  lostReason: text('lost_reason'),
  
  // Additional
  notes: text('notes'),
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('leads_status_idx').on(table.status),
  index('leads_stage_idx').on(table.stage),
  index('leads_assigned_to_idx').on(table.assignedTo),
  index('leads_lead_source_idx').on(table.leadSource),
  index('leads_mobile_number_idx').on(table.mobileNumber),
  index('leads_next_follow_up_idx').on(table.nextFollowUpAt),
  index('leads_created_at_idx').on(table.createdAt),
  uniqueIndex('leads_mobile_unique_idx').on(table.mobileNumber),
]);

/**
 * Lead Activities - Timeline of all lead-related activities
 */
export const leadActivities = pgTable('lead_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  type: activityTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('lead_activities_lead_id_idx').on(table.leadId),
  index('lead_activities_type_idx').on(table.type),
  index('lead_activities_created_at_idx').on(table.createdAt),
]);

/**
 * Lead Communications - Track all communications with leads
 */
export const leadCommunications = pgTable('lead_communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  type: communicationTypeEnum('type').notNull(),
  direction: communicationDirectionEnum('direction').notNull(),
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  duration: integer('duration'), // For calls, in seconds
  outcome: varchar('outcome', { length: 100 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('lead_communications_lead_id_idx').on(table.leadId),
  index('lead_communications_type_idx').on(table.type),
  index('lead_communications_created_at_idx').on(table.createdAt),
]);

/**
 * Lead Notes - Notes attached to leads
 */
export const leadNotes = pgTable('lead_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('lead_notes_lead_id_idx').on(table.leadId),
]);

/**
 * Tasks - Task management for CRM
 */
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  status: taskStatusEnum('status').default('pending').notNull(),
  priority: taskPriorityEnum('priority').default('normal').notNull(),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  // Associations
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  
  // Metadata
  reminderAt: timestamp('reminder_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('tasks_status_idx').on(table.status),
  index('tasks_lead_id_idx').on(table.leadId),
  index('tasks_assigned_to_idx').on(table.assignedTo),
  index('tasks_due_date_idx').on(table.dueDate),
]);

/**
 * Follow-ups - Scheduled follow-ups for leads
 */
export const followUps = pgTable('follow_ups', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // call, email, meeting, etc.
  purpose: text('purpose'),
  notes: text('notes'),
  outcome: text('outcome'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('follow_ups_lead_id_idx').on(table.leadId),
  index('follow_ups_scheduled_at_idx').on(table.scheduledAt),
  index('follow_ups_assigned_to_idx').on(table.assignedTo),
  index('follow_ups_is_completed_idx').on(table.isCompleted),
]);

/**
 * Counselling Sessions - Track counselling sessions
 */
export const counsellingSessions = pgTable('counselling_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration'), // minutes
  mode: varchar('mode', { length: 20 }).notNull(), // online, offline, phone
  location: varchar('location', { length: 255 }),
  meetingLink: text('meeting_link'),
  
  // Session details
  topics: jsonb('topics').$type<string[]>().default([]),
  outcome: text('outcome'),
  nextSteps: text('next_steps'),
  parentAttended: boolean('parent_attended'),
  
  // Status
  status: varchar('status', { length: 50 }).default('scheduled').notNull(),
  completedAt: timestamp('completed_at'),
  
  // Associations
  counsellorId: uuid('counsellor_id').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('counselling_sessions_lead_id_idx').on(table.leadId),
  index('counselling_sessions_scheduled_at_idx').on(table.scheduledAt),
  index('counselling_sessions_counsellor_id_idx').on(table.counsellorId),
]);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  assignedLeads: many(leads, { relationName: 'assignedLeads' }),
  createdLeads: many(leads, { relationName: 'createdLeads' }),
  tasks: many(tasks),
  notifications: many(notifications),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
    relationName: 'assignedLeads',
  }),
  createdByUser: one(users, {
    fields: [leads.createdBy],
    references: [users.id],
    relationName: 'createdLeads',
  }),
  activities: many(leadActivities),
  communications: many(leadCommunications),
  notes: many(leadNotes),
  tasks: many(tasks),
  followUps: many(followUps),
  counsellingSessions: many(counsellingSessions),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
  createdByUser: one(users, {
    fields: [leadActivities.createdBy],
    references: [users.id],
  }),
}));

export const leadCommunicationsRelations = relations(leadCommunications, ({ one }) => ({
  lead: one(leads, {
    fields: [leadCommunications.leadId],
    references: [leads.id],
  }),
  createdByUser: one(users, {
    fields: [leadCommunications.createdBy],
    references: [users.id],
  }),
}));

export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
  lead: one(leads, {
    fields: [leadNotes.leadId],
    references: [leads.id],
  }),
  createdByUser: one(users, {
    fields: [leadNotes.createdBy],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  lead: one(leads, {
    fields: [tasks.leadId],
    references: [leads.id],
  }),
  assignedUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  lead: one(leads, {
    fields: [followUps.leadId],
    references: [leads.id],
  }),
  assignedUser: one(users, {
    fields: [followUps.assignedTo],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [followUps.createdBy],
    references: [users.id],
  }),
}));

export const counsellingSessionsRelations = relations(counsellingSessions, ({ one }) => ({
  lead: one(leads, {
    fields: [counsellingSessions.leadId],
    references: [leads.id],
  }),
  counsellor: one(users, {
    fields: [counsellingSessions.counsellorId],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [counsellingSessions.createdBy],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type LeadCommunication = typeof leadCommunications.$inferSelect;
export type LeadNote = typeof leadNotes.$inferSelect;
export type FollowUp = typeof followUps.$inferSelect;
export type CounsellingSession = typeof counsellingSessions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
