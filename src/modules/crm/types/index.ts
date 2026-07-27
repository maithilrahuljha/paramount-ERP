/**
 * PMN ERP Platform - CRM Module Types
 * 
 * Type definitions specific to the CRM module.
 */

import type { Lead, Task, FollowUp, LeadActivity, LeadCommunication, LeadNote, CounsellingSession } from '@/db/schema';

// ============================================================================
// Lead Types
// ============================================================================

export type LeadStatus = 
  | 'new'
  | 'assigned'
  | 'contacted'
  | 'qualified'
  | 'counselling'
  | 'follow_up'
  | 'admission_ready'
  | 'converted'
  | 'lost'
  | 'archived';

export type LeadStage = 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4';

export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Stage 1 - Lead Capture (Minimal friction)
 */
export interface LeadCaptureStage1 {
  fullName: string;
  mobileNumber: string;
  leadSource: string;
  interestedCourse?: string;
  preferredLanguage?: string;
  city?: string;
  consentToContact: boolean;
}

/**
 * Stage 2 - Qualification
 */
export interface LeadQualificationStage2 {
  qualification?: string;
  pcmBackground?: boolean;
  passingYear?: number;
  preferredBatch?: string;
  modePreference?: 'online' | 'offline' | 'hybrid';
  budgetRange?: string;
  parentAvailability?: boolean;
}

/**
 * Stage 3 - Career Details
 */
export interface LeadCareerStage3 {
  careerGoal?: string;
  sponsorshipInterest?: boolean;
  passportStatus?: string;
  previousImuAttempt?: boolean;
  medicalAwareness?: boolean;
  decisionMaker?: string;
}

/**
 * Stage 4 - Admission Readiness
 * Note: Fee details are for REFERENCE ONLY.
 * Actual billing is handled separately in Razorpay.
 */
export interface LeadAdmissionStage4 {
  documentsAvailable?: string[];
  feeDiscussionDone?: boolean;
  feeAmountDiscussed?: string; // Manual entry - reference only, not for billing
  scholarshipInterest?: boolean;
  parentCounsellingDone?: boolean;
  admissionProbability?: number;
  joiningMonth?: string;
}

/**
 * Complete lead creation input
 */
export interface CreateLeadInput extends LeadCaptureStage1 {
  email?: string;
  notes?: string;
  assignedTo?: string;
}

/**
 * Lead update input
 */
export interface UpdateLeadInput extends Partial<LeadCaptureStage1>, 
  Partial<LeadQualificationStage2>,
  Partial<LeadCareerStage3>,
  Partial<LeadAdmissionStage4> {
  status?: LeadStatus;
  stage?: LeadStage;
  assignedTo?: string;
  priority?: LeadPriority;
  tags?: string[];
  nextFollowUpAt?: Date;
  notes?: string;
  lostReason?: string;
}

/**
 * Lead with relations
 */
export interface LeadWithRelations extends Omit<Lead, 'notes'> {
  notes: string | null; // Original notes field
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  activities?: LeadActivity[];
  communications?: LeadCommunication[];
  leadNotes?: LeadNote[];
  tasks?: Task[];
  followUps?: FollowUp[];
  counsellingSessions?: CounsellingSession[];
  _count?: {
    activities: number;
    communications: number;
    notes: number;
    tasks: number;
    followUps: number;
  };
}

/**
 * Lead filters
 */
export interface LeadFilters {
  status?: LeadStatus | LeadStatus[];
  stage?: LeadStage | LeadStage[];
  leadSource?: string | string[];
  assignedTo?: string;
  interestedCourse?: string;
  city?: string;
  priority?: LeadPriority;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  nextFollowUpBefore?: Date;
  search?: string;
}

/**
 * Lead sort options
 */
export interface LeadSortOptions {
  field: 'createdAt' | 'updatedAt' | 'fullName' | 'status' | 'nextFollowUpAt' | 'score';
  direction: 'asc' | 'desc';
}

// ============================================================================
// Task Types
// ============================================================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CreateTaskInput {
  title: string;
  description?: string;
  type: string;
  priority?: TaskPriority;
  dueDate?: Date;
  leadId?: string;
  assignedTo?: string;
  reminderAt?: Date;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedTo?: string;
  reminderAt?: Date;
}

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
  assignedTo?: string;
  leadId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
}

// ============================================================================
// Follow-up Types
// ============================================================================

export interface CreateFollowUpInput {
  leadId: string;
  scheduledAt: Date;
  type: string;
  purpose?: string;
  notes?: string;
  assignedTo?: string;
}

export interface UpdateFollowUpInput {
  scheduledAt?: Date;
  type?: string;
  purpose?: string;
  notes?: string;
  outcome?: string;
  isCompleted?: boolean;
  assignedTo?: string;
}

export interface FollowUpFilters {
  leadId?: string;
  assignedTo?: string;
  scheduledBefore?: Date;
  scheduledAfter?: Date;
  isCompleted?: boolean;
  type?: string;
}

// ============================================================================
// Communication Types
// ============================================================================

export type CommunicationType = 'call' | 'email' | 'sms' | 'whatsapp' | 'meeting' | 'note';
export type CommunicationDirection = 'inbound' | 'outbound';

export interface LogCommunicationInput {
  leadId: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject?: string;
  content?: string;
  duration?: number;
  outcome?: string;
}

// ============================================================================
// Counselling Session Types
// ============================================================================

export interface CreateCounsellingSessionInput {
  leadId: string;
  scheduledAt: Date;
  duration?: number;
  mode: 'online' | 'offline' | 'phone';
  location?: string;
  meetingLink?: string;
  topics?: string[];
  counsellorId?: string;
}

export interface UpdateCounsellingSessionInput {
  scheduledAt?: Date;
  duration?: number;
  mode?: 'online' | 'offline' | 'phone';
  location?: string;
  meetingLink?: string;
  topics?: string[];
  outcome?: string;
  nextSteps?: string;
  parentAttended?: boolean;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  counsellorId?: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface LeadAnalytics {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsThisWeek: number;
  newLeadsThisMonth: number;
  conversionRate: number;
  averageResponseTime: number; // hours
  byStatus: Record<LeadStatus, number>;
  bySource: Record<string, number>;
  byCourse: Record<string, number>;
  byStage: Record<LeadStage, number>;
  conversionFunnel: {
    stage: string;
    count: number;
    percentage: number;
  }[];
  trendsDaily: {
    date: string;
    newLeads: number;
    conversions: number;
  }[];
}

export interface CounsellorPerformance {
  userId: string;
  name: string;
  totalLeads: number;
  activeLeads: number;
  conversions: number;
  conversionRate: number;
  averageResponseTime: number;
  tasksCompleted: number;
  pendingTasks: number;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  data: unknown;
  refreshInterval?: number;
}

export interface DashboardConfig {
  widgets: {
    id: string;
    enabled: boolean;
    position: number;
    size: 'small' | 'medium' | 'large' | 'full';
  }[];
}

// ============================================================================
// Event Types
// ============================================================================

export interface LeadCreatedEvent {
  leadId: string;
  leadSource: string;
  interestedCourse?: string;
  createdBy?: string;
}

export interface LeadAssignedEvent {
  leadId: string;
  previousAssignee?: string;
  newAssignee: string;
  assignedBy: string;
}

export interface LeadStatusChangedEvent {
  leadId: string;
  previousStatus: LeadStatus;
  newStatus: LeadStatus;
  changedBy: string;
  reason?: string;
}

export interface LeadQualifiedEvent {
  leadId: string;
  qualificationData: LeadQualificationStage2;
  qualifiedBy: string;
}

export interface LeadConvertedEvent {
  leadId: string;
  convertedBy: string;
  conversionData: {
    course: string;
    batch?: string;
    admissionDate?: Date;
  };
}

export interface LeadLostEvent {
  leadId: string;
  reason: string;
  markedBy: string;
}
