/**
 * PMN ERP Platform - CRM Layout
 */

import { Sidebar } from '@/components/layout/sidebar';

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        {children}
      </div>
    </div>
  );
}
