/**
 * PMN ERP Platform - Stats Card Component
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn, formatNumber, formatPercentage } from '@/lib/utils';
import {
  Users,
  UserPlus,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: 'users' | 'user-plus' | 'check' | 'clock' | 'trending-up';
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const icons: Record<string, LucideIcon> = {
  'users': Users,
  'user-plus': UserPlus,
  'check': CheckCircle,
  'clock': Clock,
  'trending-up': TrendingUp,
};

const colors = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

export function StatsCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatsCardProps) {
  const Icon = icon ? icons[icon] : null;
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.value >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {formatPercentage(Math.abs(trend.value))}
                </span>
                <span className="text-sm text-gray-500">{trend.label}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('p-3 rounded-lg', colors[color])}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
