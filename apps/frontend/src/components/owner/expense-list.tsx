'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Input } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { cn } from '@property-os/ui';
import { Search, DollarSign, Calendar, Building2, MoreVertical, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@property-os/ui';
import type { Expense } from '@/lib/hooks/owner-hooks';

interface ExpenseListProps {
  expenses: Expense[] | undefined;
  isLoading: boolean;
  showUpcoming?: boolean;
  className?: string;
}

interface ExpenseRowProps {
  expense: Expense;
  showUpcoming?: boolean;
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    utilities: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    insurance: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    taxes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    management: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    marketing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    repairs: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  return colors[category.toLowerCase()] || colors.other;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'overdue':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

function ExpenseRow({ expense, showUpcoming }: ExpenseRowProps) {
  const date = new Date(expense.date);
  const isUpcoming = showUpcoming && date > new Date();
  const daysUntilDue = isUpcoming ? Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className={cn(
      'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
      isUpcoming && daysUntilDue <= 7 && 'bg-yellow-50 dark:bg-yellow-900/10'
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {expense.description}
              </p>
              <span className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
                getCategoryColor(expense.category)
              )}>
                {expense.category}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>{expense.propertyName}</span>
              </div>
              {expense.vendor && (
                <div className="flex items-center gap-1">
                  <span>•</span>
                  <span>{expense.vendor}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ${expense.amount.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>{date.toLocaleDateString()}</span>
            {isUpcoming && daysUntilDue > 0 && (
              <span className={cn(
                'font-medium',
                daysUntilDue <= 7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'
              )}>
                ({daysUntilDue} days)
              </span>
            )}
          </div>
        </div>

        <span className={cn(
          'px-2 py-1 text-xs font-medium rounded-full',
          getStatusColor(expense.status)
        )}>
          {expense.status}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit Expense</DropdownMenuItem>
            <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 dark:text-red-400">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function ExpenseList({ expenses, isLoading, showUpcoming = false, className }: ExpenseListProps) {
  const totalAmount = expenses ? expenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>
              {showUpcoming ? 'Upcoming Expenses' : 'Expense History'}
            </CardTitle>
            <CardDescription>
              {showUpcoming
                ? 'Track upcoming expenses and payments'
                : 'View and manage all property expenses'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button asChild>
              <span>Add Expense</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search expenses..."
              className="pl-9"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="taxes">Taxes</SelectItem>
              <SelectItem value="management">Management</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="repairs">Repairs</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        {expenses && expenses.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total {showUpcoming ? 'Upcoming' : ''} Expenses
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ${totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-1">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : expenses && expenses.length > 0 ? (
            expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} showUpcoming={showUpcoming} />
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <svg
                className="h-12 w-12 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p className="text-center">No expenses found</p>
              <Button variant="link" className="mt-2">Add your first expense</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExpenseList;