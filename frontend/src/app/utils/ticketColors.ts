/**
 * Shared Tailwind class maps for ticket status, priority, and nature badges.
 * Import from this file to ensure consistent badge styling across all pages.
 */

import type { TicketNature, TicketStatus } from '../types/entities';

export const ticketStatusColor: Record<TicketStatus, string> = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  IN_TEST: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  DONE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  REJECTED: 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300',
};

export const ticketPriorityColor: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const ticketNatureColor: Record<TicketNature, string> = {
  WORKFLOW: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  FORMULAIRE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  PROGRAMME: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  ENHANCEMENT: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  MODULE: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  REPORT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};
