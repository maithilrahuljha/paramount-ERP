/**
 * PMN ERP Platform - Configuration Loader
 * 
 * Centralized configuration management with support for:
 * - Environment variables
 * - YAML/JSON configuration files
 * - Database-stored configuration
 * - Runtime configuration updates
 * - Configuration validation
 * - Secret management
 */

import type { ConfigValue, ConfigSchema } from '../types';

// Configuration storage types
interface ConfigStore {
  [key: string]: unknown;
}

interface ConfigDefinition {
  schema: ConfigSchema[];
  values: ConfigStore;
}

// Default configurations
const defaultConfigs: Record<string, ConfigDefinition> = {
  'crm.lead_statuses': {
    schema: [
      { key: 'statuses', type: 'array', required: true, description: 'List of lead statuses' }
    ],
    values: {
      statuses: [
        { id: 'new', name: 'New', color: '#3B82F6', order: 1, isInitial: true },
        { id: 'assigned', name: 'Assigned', color: '#8B5CF6', order: 2 },
        { id: 'contacted', name: 'Contacted', color: '#F59E0B', order: 3 },
        { id: 'qualified', name: 'Qualified', color: '#10B981', order: 4 },
        { id: 'counselling', name: 'Counselling', color: '#6366F1', order: 5 },
        { id: 'follow_up', name: 'Follow-up', color: '#EC4899', order: 6 },
        { id: 'admission_ready', name: 'Admission Ready', color: '#14B8A6', order: 7 },
        { id: 'converted', name: 'Converted', color: '#22C55E', order: 8, isFinal: true },
        { id: 'lost', name: 'Lost', color: '#EF4444', order: 9, isFinal: true },
        { id: 'archived', name: 'Archived', color: '#6B7280', order: 10, isFinal: true },
      ],
      transitions: {
        new: ['assigned', 'contacted', 'lost', 'archived'],
        assigned: ['contacted', 'lost', 'archived'],
        contacted: ['qualified', 'follow_up', 'lost', 'archived'],
        qualified: ['counselling', 'follow_up', 'lost', 'archived'],
        counselling: ['admission_ready', 'follow_up', 'lost', 'archived'],
        follow_up: ['counselling', 'qualified', 'admission_ready', 'lost', 'archived'],
        admission_ready: ['converted', 'follow_up', 'lost', 'archived'],
        converted: ['archived'],
        lost: ['new', 'archived'],
        archived: [],
      },
    },
  },
  'crm.lead_sources': {
    schema: [
      { key: 'sources', type: 'array', required: true, description: 'Lead sources' }
    ],
    values: {
      sources: [
        { id: 'website', name: 'Website', icon: 'globe', isActive: true },
        { id: 'facebook', name: 'Facebook', icon: 'facebook', isActive: true },
        { id: 'instagram', name: 'Instagram', icon: 'instagram', isActive: true },
        { id: 'google_ads', name: 'Google Ads', icon: 'search', isActive: true },
        { id: 'referral', name: 'Referral', icon: 'users', isActive: true },
        { id: 'walk_in', name: 'Walk-in', icon: 'building', isActive: true },
        { id: 'phone_inquiry', name: 'Phone Inquiry', icon: 'phone', isActive: true },
        { id: 'email', name: 'Email', icon: 'mail', isActive: true },
        { id: 'whatsapp', name: 'WhatsApp', icon: 'message-circle', isActive: true },
        { id: 'event', name: 'Event/Seminar', icon: 'calendar', isActive: true },
        { id: 'partner', name: 'Partner', icon: 'handshake', isActive: true },
        { id: 'other', name: 'Other', icon: 'more-horizontal', isActive: true },
      ],
    },
  },
  'crm.courses': {
    schema: [
      { key: 'courses', type: 'array', required: true, description: 'Available courses' }
    ],
    values: {
      courses: [
        { id: 'gp', name: 'GP Rating', shortName: 'GP', duration: '6 months', isActive: true },
        { id: 'eto', name: 'Electro Technical Officer', shortName: 'ETO', duration: '4 years', isActive: true },
        { id: 'bsc_nautical', name: 'B.Sc Nautical Science', shortName: 'B.Sc NS', duration: '3 years', isActive: true },
        { id: 'btech_marine', name: 'B.Tech Marine Engineering', shortName: 'B.Tech ME', duration: '4 years', isActive: true },
        { id: 'dns', name: 'Diploma in Nautical Science', shortName: 'DNS', duration: '1 year', isActive: true },
        { id: 'gme', name: 'Graduate Marine Engineering', shortName: 'GME', duration: '1 year', isActive: true },
      ],
    },
  },
  'crm.automation_rules': {
    schema: [
      { key: 'rules', type: 'array', required: true, description: 'Automation rules' }
    ],
    values: {
      rules: [
        {
          id: 'auto_assign',
          name: 'Auto-assign New Leads',
          trigger: 'lead.created',
          conditions: [{ field: 'status', operator: 'equals', value: 'new' }],
          actions: [{ type: 'assign_round_robin', config: { team: 'counsellors' } }],
          isActive: true,
        },
        {
          id: 'follow_up_reminder',
          name: 'Follow-up Reminder',
          trigger: 'schedule',
          schedule: '0 9 * * *',
          conditions: [
            { field: 'status', operator: 'in', value: ['contacted', 'counselling', 'follow_up'] },
            { field: 'next_follow_up', operator: 'less_than', value: 'now' },
          ],
          actions: [{ type: 'create_task', config: { title: 'Follow-up Required' } }],
          isActive: true,
        },
        {
          id: 'stale_lead_alert',
          name: 'Stale Lead Alert',
          trigger: 'schedule',
          schedule: '0 10 * * *',
          conditions: [
            { field: 'status', operator: 'not_in', value: ['converted', 'lost', 'archived'] },
            { field: 'updated_at', operator: 'older_than', value: '7 days' },
          ],
          actions: [{ type: 'notify', config: { channel: 'email', template: 'stale_lead' } }],
          isActive: true,
        },
      ],
    },
  },
  'crm.notification_rules': {
    schema: [
      { key: 'rules', type: 'array', required: true, description: 'Notification rules' }
    ],
    values: {
      rules: [
        {
          id: 'lead_assigned',
          event: 'lead.assigned',
          channels: ['in_app', 'email'],
          template: 'lead_assigned',
          recipients: ['assignee'],
        },
        {
          id: 'high_value_lead',
          event: 'lead.qualified',
          conditions: [{ field: 'probability', operator: 'greater_than', value: 80 }],
          channels: ['in_app', 'email'],
          template: 'high_value_lead',
          recipients: ['manager', 'assignee'],
        },
        {
          id: 'lead_converted',
          event: 'lead.converted',
          channels: ['in_app'],
          template: 'lead_converted',
          recipients: ['team'],
        },
      ],
    },
  },
  'system.roles': {
    schema: [
      { key: 'roles', type: 'array', required: true, description: 'System roles' }
    ],
    values: {
      roles: [
        {
          id: 'admin',
          name: 'Administrator',
          description: 'Full system access',
          permissions: ['*'],
          isSystem: true,
        },
        {
          id: 'manager',
          name: 'Manager',
          description: 'Department manager',
          permissions: [
            'crm:leads:*',
            'crm:tasks:*',
            'crm:reports:read',
            'crm:analytics:read',
            'crm:team:read',
          ],
          isSystem: true,
        },
        {
          id: 'counsellor',
          name: 'Counsellor',
          description: 'Lead counsellor',
          permissions: [
            'crm:leads:read',
            'crm:leads:update',
            'crm:tasks:*',
            'crm:notes:*',
            'crm:communications:*',
          ],
          isSystem: true,
        },
        {
          id: 'telecaller',
          name: 'Telecaller',
          description: 'Telecalling executive',
          permissions: [
            'crm:leads:read',
            'crm:leads:update:own',
            'crm:tasks:read:own',
            'crm:tasks:update:own',
            'crm:communications:create',
          ],
          isSystem: true,
        },
      ],
    },
  },
  'system.permissions': {
    schema: [
      { key: 'permissions', type: 'array', required: true, description: 'System permissions' }
    ],
    values: {
      permissions: [
        // CRM Permissions
        { id: 'crm:leads:create', name: 'Create Leads', module: 'crm', resource: 'leads', action: 'create' },
        { id: 'crm:leads:read', name: 'View Leads', module: 'crm', resource: 'leads', action: 'read' },
        { id: 'crm:leads:update', name: 'Update Leads', module: 'crm', resource: 'leads', action: 'update' },
        { id: 'crm:leads:delete', name: 'Delete Leads', module: 'crm', resource: 'leads', action: 'delete' },
        { id: 'crm:leads:assign', name: 'Assign Leads', module: 'crm', resource: 'leads', action: 'execute' },
        { id: 'crm:tasks:create', name: 'Create Tasks', module: 'crm', resource: 'tasks', action: 'create' },
        { id: 'crm:tasks:read', name: 'View Tasks', module: 'crm', resource: 'tasks', action: 'read' },
        { id: 'crm:tasks:update', name: 'Update Tasks', module: 'crm', resource: 'tasks', action: 'update' },
        { id: 'crm:tasks:delete', name: 'Delete Tasks', module: 'crm', resource: 'tasks', action: 'delete' },
        { id: 'crm:reports:read', name: 'View Reports', module: 'crm', resource: 'reports', action: 'read' },
        { id: 'crm:analytics:read', name: 'View Analytics', module: 'crm', resource: 'analytics', action: 'read' },
        { id: 'crm:settings:manage', name: 'Manage CRM Settings', module: 'crm', resource: 'settings', action: 'manage' },
        // System Permissions
        { id: 'system:users:manage', name: 'Manage Users', module: 'system', resource: 'users', action: 'manage' },
        { id: 'system:roles:manage', name: 'Manage Roles', module: 'system', resource: 'roles', action: 'manage' },
        { id: 'system:settings:manage', name: 'Manage Settings', module: 'system', resource: 'settings', action: 'manage' },
      ],
    },
  },
};

class ConfigLoader {
  private static instance: ConfigLoader;
  private configs: Map<string, ConfigStore> = new Map();
  private watchers: Map<string, Set<(value: unknown) => void>> = new Map();

  private constructor() {
    this.loadDefaultConfigs();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Load default configurations
   */
  private loadDefaultConfigs(): void {
    for (const [key, definition] of Object.entries(defaultConfigs)) {
      this.configs.set(key, definition.values);
    }
    console.log('[ConfigLoader] Default configurations loaded');
  }

  /**
   * Get a configuration value
   */
  get<T = unknown>(key: string, defaultValue?: T): T {
    // Check environment variables first (for secrets)
    const envKey = key.toUpperCase().replace(/\./g, '_');
    if (process.env[envKey]) {
      return process.env[envKey] as T;
    }

    // Check nested key
    const parts = key.split('.');
    let current: unknown = null;

    for (let i = 0; i < parts.length; i++) {
      const configKey = parts.slice(0, i + 1).join('.');
      const storedConfig = this.configs.get(configKey);
      
      if (storedConfig) {
        const remainingPath = parts.slice(i + 1);
        current = this.getNestedValue(storedConfig, remainingPath);
        if (current !== undefined) {
          return current as T;
        }
      }
    }

    // Try direct key lookup
    const directValue = this.configs.get(key);
    if (directValue !== undefined) {
      return directValue as T;
    }

    return defaultValue as T;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: ConfigStore, path: string[]): unknown {
    if (path.length === 0) return obj;
    
    let current: unknown = obj;
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return current;
  }

  /**
   * Set a configuration value
   */
  set(key: string, value: unknown): void {
    this.configs.set(key, value as ConfigStore);
    this.notifyWatchers(key, value);
    console.log(`[ConfigLoader] Config updated: ${key}`);
  }

  /**
   * Watch for configuration changes
   */
  watch(key: string, callback: (value: unknown) => void): () => void {
    const watchers = this.watchers.get(key) ?? new Set();
    watchers.add(callback);
    this.watchers.set(key, watchers);

    return () => {
      watchers.delete(callback);
    };
  }

  /**
   * Notify watchers of configuration changes
   */
  private notifyWatchers(key: string, value: unknown): void {
    const watchers = this.watchers.get(key);
    if (watchers) {
      for (const callback of watchers) {
        try {
          callback(value);
        } catch (error) {
          console.error(`[ConfigLoader] Watcher error for ${key}:`, error);
        }
      }
    }
  }

  /**
   * Check if configuration exists
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Get all configurations for a module
   */
  getModuleConfig(moduleId: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const prefix = `${moduleId}.`;

    for (const [key, value] of this.configs.entries()) {
      if (key.startsWith(prefix)) {
        const shortKey = key.substring(prefix.length);
        result[shortKey] = value;
      }
    }

    return result;
  }

  /**
   * Export all configurations (for backup/sync)
   */
  exportAll(): Record<string, ConfigStore> {
    const result: Record<string, ConfigStore> = {};
    for (const [key, value] of this.configs.entries()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Import configurations
   */
  importAll(configs: Record<string, ConfigStore>): void {
    for (const [key, value] of Object.entries(configs)) {
      this.set(key, value);
    }
  }
}

// Export singleton instance
export const configLoader = ConfigLoader.getInstance();

// Export convenience functions
export function getConfig<T = unknown>(key: string, defaultValue?: T): T {
  return configLoader.get<T>(key, defaultValue);
}

export function setConfig(key: string, value: unknown): void {
  configLoader.set(key, value);
}

export function watchConfig(key: string, callback: (value: unknown) => void): () => void {
  return configLoader.watch(key, callback);
}
