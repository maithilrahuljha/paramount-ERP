/**
 * PMN ERP Platform - Kernel Type Definitions
 * 
 * Core type definitions for the ERP platform kernel.
 * These types define the contracts for modules, events, and configuration.
 */

// ============================================================================
// Module System Types
// ============================================================================

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies: string[];
  permissions: string[];
  routes: ModuleRoute[];
  events: {
    publishes: string[];
    subscribes: string[];
  };
  widgets: WidgetDefinition[];
  enabled: boolean;
}

export interface ModuleRoute {
  path: string;
  name: string;
  icon?: string;
  permission: string;
  children?: ModuleRoute[];
}

export interface WidgetDefinition {
  id: string;
  name: string;
  component: string;
  defaultSize: 'small' | 'medium' | 'large' | 'full';
  permissions: string[];
  refreshInterval?: number;
}

// ============================================================================
// Event Bus Types
// ============================================================================

export interface ERPEvent<T = unknown> {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  version: string;
  correlationId?: string;
  causationId?: string;
  payload: T;
  metadata: EventMetadata;
}

export interface EventMetadata {
  userId?: string;
  tenantId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

export type EventHandler<T = unknown> = (event: ERPEvent<T>) => Promise<void>;

export interface EventSubscription {
  eventType: string;
  handler: EventHandler;
  moduleId: string;
  priority: number;
}

// ============================================================================
// Authentication & Authorization Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  department?: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: PermissionAction;
  module: string;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'execute';

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ConfigValue<T = unknown> {
  key: string;
  value: T;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  module: string;
  description?: string;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigSchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  required: boolean;
  default?: unknown;
  validation?: string;
  description: string;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  module: string;
  changes: AuditChange[];
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  module: string;
  actionUrl?: string;
  isRead: boolean;
  priority: NotificationPriority;
  createdAt: Date;
  readAt?: Date;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'task' | 'reminder';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: APIMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface APIMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  timestamp: Date;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Integration Types
// ============================================================================

export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  enabled: boolean;
  config: Record<string, unknown>;
  credentials?: Record<string, string>;
  lastSyncAt?: Date;
  status: IntegrationStatus;
}

export type IntegrationType = 
  | 'google_oauth'
  | 'google_gmail'
  | 'google_drive'
  | 'google_calendar'
  | 'google_meet'
  | 'google_sheets'
  | 'smtp'
  | 'sms'
  | 'webhook';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';
