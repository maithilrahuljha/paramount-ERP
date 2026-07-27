/**
 * PMN ERP Platform - Leads List Page
 */

'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { LeadTable } from '@/components/crm/lead-table';
import { LeadForm } from '@/components/crm/lead-form';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { buildQueryString, formatNumber } from '@/lib/utils';

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

interface LeadsResponse {
  success: boolean;
  data: Lead[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'counselling', label: 'Counselling' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'admission_ready', label: 'Admission Ready' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

const sourceOptions = [
  { value: '', label: 'All Sources' },
  { value: 'website', label: 'Website' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'referral', label: 'Referral' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [leadSource, setLeadSource] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        search: search || undefined,
        status: status || undefined,
        leadSource: leadSource || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      
      const response = await fetch(`/api/crm/leads${buildQueryString(params)}`);
      const data: LeadsResponse = await response.json();
      
      if (data.success) {
        setLeads(data.data);
        setTotal(data.meta.total);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, status, leadSource]);

  const handleSearch = () => {
    setPage(1);
    fetchLeads();
  };

  const handleCreateLead = async (data: object) => {
    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setShowForm(false);
        fetchLeads();
      } else {
        const error = await response.json();
        alert(error.error?.message ?? 'Failed to create lead');
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
      alert('Failed to create lead');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setLeadSource('');
    setPage(1);
  };

  const hasActiveFilters = search || status || leadSource;

  return (
    <>
      <Header title="Leads" />
      <main className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
            <Button variant="outline" onClick={fetchLeads}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
              />
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="info" size="sm" className="ml-2">
                  Active
                </Badge>
              )}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="w-48">
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    options={statusOptions}
                  />
                </div>
                <div className="w-48">
                  <Select
                    label="Source"
                    value={leadSource}
                    onChange={(e) => { setLeadSource(e.target.value); setPage(1); }}
                    options={sourceOptions}
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters} className="text-gray-500">
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lead Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 bg-black/50">
              <div className="w-full max-w-2xl">
                <LeadForm
                  onSubmit={handleCreateLead}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <LeadTable leads={leads} />
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {formatNumber(total)} leads
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
