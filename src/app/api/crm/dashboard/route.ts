/**
 * PMN ERP Platform - CRM Dashboard API
 * 
 * GET /api/crm/dashboard - Get dashboard data
 */

import { leadService } from '@/modules/crm/services/lead-service';
import { taskService } from '@/modules/crm/services/task-service';
import { followUpService } from '@/modules/crm/services/follow-up-service';
import { successResponse, internalErrorResponse } from '@/lib/api-response';

/**
 * GET /api/crm/dashboard
 * Get dashboard data including stats, recent leads, tasks, etc.
 */
export async function GET() {
  try {
    // Fetch all dashboard data in parallel
    const [
      leadStats,
      taskStats,
      followUpStats,
      recentLeads,
      todaysTasks,
      overdueFollowUps,
      leadsRequiringFollowUp,
    ] = await Promise.all([
      leadService.getStatistics(),
      taskService.getTaskStats(),
      followUpService.getFollowUpStats(),
      leadService.getLeads({}, { field: 'createdAt', direction: 'desc' }, { page: 1, pageSize: 5 }),
      taskService.getTasksDueToday(),
      followUpService.getOverdueFollowUps(),
      leadService.getLeadsRequiringFollowUp(),
    ]);
    
    const dashboardData = {
      stats: {
        leads: {
          total: leadStats.totalLeads,
          newToday: leadStats.newLeadsToday,
          newThisWeek: leadStats.newLeadsThisWeek,
          newThisMonth: leadStats.newLeadsThisMonth,
          conversionRate: leadStats.conversionRate,
          byStatus: leadStats.byStatus,
          bySource: leadStats.bySource,
        },
        tasks: {
          pending: taskStats.pending,
          inProgress: taskStats.in_progress,
          completed: taskStats.completed,
          overdue: taskStats.overdue,
          dueToday: taskStats.dueToday,
          total: taskStats.total,
        },
        followUps: {
          dueToday: followUpStats.dueToday,
          overdue: followUpStats.overdue,
        },
      },
      recentLeads: recentLeads.data.slice(0, 5),
      todaysTasks: todaysTasks.slice(0, 5),
      overdueFollowUps: overdueFollowUps.slice(0, 5),
      leadsRequiringFollowUp: leadsRequiringFollowUp.slice(0, 5),
      widgets: [
        { id: 'stats_overview', enabled: true, position: 1 },
        { id: 'lead_funnel', enabled: true, position: 2 },
        { id: 'recent_leads', enabled: true, position: 3 },
        { id: 'todays_tasks', enabled: true, position: 4 },
        { id: 'pending_follow_ups', enabled: true, position: 5 },
        { id: 'lead_sources', enabled: true, position: 6 },
      ],
    };
    
    return successResponse(dashboardData);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
