/**
 * PMN ERP Platform - CRM Configuration API
 * 
 * GET /api/crm/config - Get CRM configuration
 */

import { getConfig } from '@/kernel/config/config-loader';
import { successResponse, internalErrorResponse } from '@/lib/api-response';

interface LeadStatus {
  id: string;
  name: string;
  color: string;
  order: number;
  isInitial?: boolean;
  isFinal?: boolean;
}

interface LeadSource {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

interface Course {
  id: string;
  name: string;
  shortName: string;
  duration: string;
  isActive: boolean;
}

/**
 * GET /api/crm/config
 * Get CRM configuration (statuses, sources, courses, etc.)
 */
export async function GET() {
  try {
    const leadStatuses = getConfig<{ statuses: LeadStatus[] }>('crm.lead_statuses');
    const leadSources = getConfig<{ sources: LeadSource[] }>('crm.lead_sources');
    const courses = getConfig<{ courses: Course[] }>('crm.courses');
    
    const config = {
      leadStatuses: leadStatuses?.statuses ?? [],
      leadSources: leadSources?.sources ?? [],
      courses: courses?.courses ?? [],
      leadPriorities: [
        { id: 'low', name: 'Low', color: '#6B7280' },
        { id: 'normal', name: 'Normal', color: '#3B82F6' },
        { id: 'high', name: 'High', color: '#F59E0B' },
        { id: 'urgent', name: 'Urgent', color: '#EF4444' },
      ],
      leadStages: [
        { id: 'stage_1', name: 'Lead Capture', description: 'Basic contact information' },
        { id: 'stage_2', name: 'Qualification', description: 'Educational background' },
        { id: 'stage_3', name: 'Career Details', description: 'Career goals and readiness' },
        { id: 'stage_4', name: 'Admission Ready', description: 'Documents and fee discussion' },
      ],
      taskTypes: [
        { id: 'call', name: 'Call' },
        { id: 'email', name: 'Email' },
        { id: 'meeting', name: 'Meeting' },
        { id: 'follow_up', name: 'Follow-up' },
        { id: 'document', name: 'Document Collection' },
        { id: 'other', name: 'Other' },
      ],
      communicationTypes: [
        { id: 'call', name: 'Phone Call' },
        { id: 'email', name: 'Email' },
        { id: 'sms', name: 'SMS' },
        { id: 'whatsapp', name: 'WhatsApp' },
        { id: 'meeting', name: 'In-Person Meeting' },
        { id: 'note', name: 'Internal Note' },
      ],
    };
    
    return successResponse(config);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
