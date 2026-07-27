/**
 * PMN ERP Platform - Sidebar Component
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  MessageSquare,
  Phone,
  FileText,
  GraduationCap,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
  { name: 'Leads', href: '/crm/leads', icon: Users },
  { name: 'Tasks', href: '/crm/tasks', icon: CheckSquare },
  { name: 'Follow-ups', href: '/crm/follow-ups', icon: Calendar },
  { name: 'Reports', href: '/crm/reports', icon: BarChart3 },
];

const modules = [
  { name: 'CRM', href: '/crm', icon: Users, active: true },
  { name: 'Academics', href: '#', icon: GraduationCap, disabled: true },
  { name: 'Students', href: '#', icon: Building2, disabled: true },
  { name: 'Finance', href: '#', icon: FileText, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 flex flex-col">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <Link href="/crm" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-white font-semibold text-lg">PMN ERP</span>
        </Link>
      </div>

      {/* Module Selector */}
      <div className="px-4 py-4 border-b border-gray-800">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Module
        </p>
        <div className="space-y-1">
          {modules.map((module) => (
            <Link
              key={module.name}
              href={module.disabled ? '#' : module.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                module.active
                  ? 'bg-blue-600 text-white'
                  : module.disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <module.icon className="h-5 w-5" />
              {module.name}
              {module.disabled && (
                <span className="ml-auto text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          CRM
        </p>
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.name);

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                  onClick={hasChildren ? () => toggleExpand(item.name) : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                  {hasChildren && (
                    <ChevronDown
                      className={cn(
                        'ml-auto h-4 w-4 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  )}
                </Link>
                {hasChildren && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children?.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                          pathname === child.href
                            ? 'text-white'
                            : 'text-gray-500 hover:text-white'
                        )}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Settings */}
      <div className="px-4 py-4 border-t border-gray-800">
        <Link
          href="/crm/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
