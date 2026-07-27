/**
 * PMN ERP Platform - Lead Table Component
 */

'use client';

import { Badge, getStatusBadgeVariant, getPriorityBadgeVariant } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate, formatRelativeTime, formatPhone, capitalize } from '@/lib/utils';
import { Phone, Mail, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Lead {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string | null;
  leadSource: string;
  interestedCourse?: string | null;
  status: string;
  stage: string;
  priority?: string | null;
  city?: string | null;
  createdAt: Date | string;
  nextFollowUpAt?: Date | string | null;
  assignedUser?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
}

interface LeadTableProps {
  leads: Lead[];
  onView?: (lead: Lead) => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  compact?: boolean;
}

export function LeadTable({ leads, onView, onEdit, onDelete, compact = false }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No leads found</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={lead.fullName} size="sm" />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{lead.fullName}</p>
                <p className="text-sm text-gray-500 truncate">
                  {lead.interestedCourse ?? lead.leadSource}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(lead.status)}>
                {capitalize(lead.status.replace('_', ' '))}
              </Badge>
              <Link href={`/crm/leads/${lead.id}`}>
                <Button variant="ghost" size="sm" className="p-1">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Lead
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source / Course
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assigned To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Next Follow-up
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <Avatar name={lead.fullName} size="sm" />
                  <div>
                    <div className="font-medium text-gray-900">{lead.fullName}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="h-3 w-3" />
                      {formatPhone(lead.mobileNumber)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{lead.interestedCourse ?? '-'}</div>
                <div className="text-sm text-gray-500">{capitalize(lead.leadSource)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  <Badge variant={getStatusBadgeVariant(lead.status)}>
                    {capitalize(lead.status.replace('_', ' '))}
                  </Badge>
                  {lead.priority && lead.priority !== 'normal' && (
                    <Badge variant={getPriorityBadgeVariant(lead.priority)} size="sm">
                      {capitalize(lead.priority)}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {lead.assignedUser ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={lead.assignedUser.name} src={lead.assignedUser.avatar} size="sm" />
                    <span className="text-sm text-gray-900">{lead.assignedUser.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatRelativeTime(lead.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/crm/leads/${lead.id}`}>
                    <Button variant="ghost" size="sm" className="p-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  {onEdit && (
                    <Button variant="ghost" size="sm" className="p-2" onClick={() => onEdit(lead)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="sm" className="p-2 text-red-600" onClick={() => onDelete(lead)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
