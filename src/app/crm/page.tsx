/**
 * PMN ERP Platform - CRM Dashboard
 */

import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatsCard } from '@/components/crm/stats-card';
import { LeadTable } from '@/components/crm/lead-table';
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Phone,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, capitalize } from '@/lib/utils';

// Dashboard data fetcher
async function getDashboardData() {
  // In production, this would fetch from the API
  // For now, return mock data
  return {
    stats: {
      leads: {
        total: 1234,
        newToday: 12,
        newThisWeek: 67,
        newThisMonth: 234,
        conversionRate: 23.5,
        byStatus: {
          new: 45,
          assigned: 78,
          contacted: 156,
          qualified: 89,
          counselling: 67,
          follow_up: 123,
          admission_ready: 34,
          converted: 287,
          lost: 355,
          archived: 0,
        },
        bySource: {
          website: 234,
          facebook: 189,
          google_ads: 167,
          referral: 145,
          walk_in: 89,
          whatsapp: 78,
          instagram: 67,
          phone_inquiry: 56,
          event: 45,
          other: 164,
        },
      },
      tasks: {
        pending: 23,
        inProgress: 12,
        completed: 156,
        overdue: 5,
        dueToday: 8,
        total: 196,
      },
      followUps: {
        dueToday: 15,
        overdue: 7,
      },
    },
    recentLeads: [
      {
        id: '1',
        fullName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        email: 'rahul@example.com',
        leadSource: 'website',
        interestedCourse: 'B.Sc Nautical Science',
        status: 'new',
        stage: 'stage_1',
        priority: 'normal',
        city: 'Mumbai',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        assignedUser: null,
      },
      {
        id: '2',
        fullName: 'Priya Patel',
        mobileNumber: '9876543211',
        leadSource: 'facebook',
        interestedCourse: 'GP Rating',
        status: 'contacted',
        stage: 'stage_2',
        priority: 'high',
        city: 'Ahmedabad',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        assignedUser: { id: '1', name: 'Amit Kumar', avatar: null },
      },
      {
        id: '3',
        fullName: 'Vikram Singh',
        mobileNumber: '9876543212',
        leadSource: 'referral',
        interestedCourse: 'B.Tech Marine',
        status: 'qualified',
        stage: 'stage_3',
        priority: 'urgent',
        city: 'Delhi',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        assignedUser: { id: '2', name: 'Priya Verma', avatar: null },
      },
    ],
    todaysTasks: [
      { id: '1', title: 'Follow up with Rahul Sharma', type: 'call', dueDate: new Date(), priority: 'high' },
      { id: '2', title: 'Send course details to Priya', type: 'email', dueDate: new Date(), priority: 'normal' },
      { id: '3', title: 'Schedule counselling session', type: 'meeting', dueDate: new Date(), priority: 'urgent' },
    ],
    overdueFollowUps: [
      { id: '1', leadName: 'Ankit Verma', scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24), type: 'call' },
      { id: '2', leadName: 'Neha Gupta', scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 48), type: 'email' },
    ],
  };
}

export default async function CRMDashboard() {
  const data = await getDashboardData();
  const { stats, recentLeads, todaysTasks, overdueFollowUps } = data;

  return (
    <>
      <Header title="CRM Dashboard" />
      <main className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Leads"
            value={stats.leads.total}
            subtitle={`${stats.leads.newToday} new today`}
            icon="users"
            color="blue"
            trend={{ value: 12.5, label: 'vs last month' }}
          />
          <StatsCard
            title="Conversion Rate"
            value={`${stats.leads.conversionRate}%`}
            subtitle={`${stats.leads.byStatus.converted} converted`}
            icon="trending-up"
            color="green"
            trend={{ value: 3.2, label: 'vs last month' }}
          />
          <StatsCard
            title="Pending Tasks"
            value={stats.tasks.pending}
            subtitle={`${stats.tasks.overdue} overdue`}
            icon="clock"
            color="yellow"
          />
          <StatsCard
            title="Today's Follow-ups"
            value={stats.followUps.dueToday}
            subtitle={`${stats.followUps.overdue} overdue`}
            icon="user-plus"
            color="purple"
          />
        </div>

        {/* Lead Funnel & Lead Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Funnel */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lead Funnel</CardTitle>
              <Link href="/crm/leads">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.leads.byStatus)
                  .filter(([status]) => !['archived'].includes(status))
                  .map(([status, count]) => {
                    const percentage = (count / stats.leads.total) * 100;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className="w-28">
                          <Badge variant={getStatusBadgeVariant(status)} size="sm">
                            {capitalize(status.replace('_', ' '))}
                          </Badge>
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Lead Sources */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lead Sources</CardTitle>
              <Link href="/crm/reports">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View Report <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.leads.bySource)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([source, count]) => {
                    const percentage = (count / stats.leads.total) * 100;
                    return (
                      <div key={source} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-28 capitalize">
                          {source.replace('_', ' ')}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Leads</CardTitle>
              <Link href="/crm/leads">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <LeadTable leads={recentLeads} compact />
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Today&apos;s Tasks</CardTitle>
              <Link href="/crm/tasks">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                      task.priority === 'high' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {task.type === 'call' ? <Phone className="h-4 w-4" /> :
                       task.type === 'meeting' ? <Calendar className="h-4 w-4" /> :
                       <CheckCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-sm text-gray-500 capitalize">{task.type}</p>
                    </div>
                    <Badge variant={
                      task.priority === 'urgent' ? 'danger' :
                      task.priority === 'high' ? 'warning' : 'default'
                    }>
                      {capitalize(task.priority)}
                    </Badge>
                  </div>
                ))}
                {todaysTasks.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No tasks due today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Follow-ups Alert */}
        {overdueFollowUps.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Overdue Follow-ups ({overdueFollowUps.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {overdueFollowUps.map((followUp) => (
                  <div
                    key={followUp.id}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-red-200"
                  >
                    <span className="font-medium text-gray-900">{followUp.leadName}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-red-600">
                      {formatDate(followUp.scheduledAt)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
