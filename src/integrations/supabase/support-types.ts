/**
 * Support System Types
 *
 * TypeScript types for the Intelligent Support Hub
 * These types match the database schema defined in database-schema-support-system.sql
 *
 * Once the schema is deployed to Supabase, these should be regenerated
 * using: npx supabase gen types typescript --project-id <project-id>
 */

import { Json } from './types';

// =====================================================
// SUPPORT TICKET TYPES
// =====================================================

export type TicketCategory = 'billing' | 'order_issue' | 'account' | 'technical' | 'compliance' | 'other';
export type TicketPriority = 'critical' | 'high' | 'normal' | 'low';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed';
export type TicketAutoCreatedFrom = 'dispute' | 'protection_claim' | 'fraud_signal' | 'user_submitted' | null;

export interface SupportTicket {
  id: string;

  // Relationships
  user_id: string;
  assigned_admin_id: string | null;
  related_order_id: string | null;
  related_dispute_id: string | null;
  related_listing_id: string | null;

  // Ticket Details
  ticket_number: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  // SLA Tracking
  sla_deadline: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;

  // Metadata
  tags: string[] | null;
  internal_notes: string | null;
  user_satisfaction_rating: number | null;
  user_satisfaction_comment: string | null;

  // Auto-creation tracking
  auto_created: boolean;
  auto_created_from: TicketAutoCreatedFrom;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SupportTicketInsert {
  id?: string;
  user_id: string;
  assigned_admin_id?: string | null;
  related_order_id?: string | null;
  related_dispute_id?: string | null;
  related_listing_id?: string | null;
  ticket_number?: string;
  subject: string;
  category: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  sla_deadline?: string | null;
  first_response_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  tags?: string[] | null;
  internal_notes?: string | null;
  user_satisfaction_rating?: number | null;
  user_satisfaction_comment?: string | null;
  auto_created?: boolean;
  auto_created_from?: TicketAutoCreatedFrom;
  created_at?: string;
  updated_at?: string;
}

export interface SupportTicketUpdate {
  user_id?: string;
  assigned_admin_id?: string | null;
  related_order_id?: string | null;
  related_dispute_id?: string | null;
  related_listing_id?: string | null;
  ticket_number?: string;
  subject?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  sla_deadline?: string | null;
  first_response_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  tags?: string[] | null;
  internal_notes?: string | null;
  user_satisfaction_rating?: number | null;
  user_satisfaction_comment?: string | null;
  auto_created?: boolean;
  auto_created_from?: TicketAutoCreatedFrom;
  updated_at?: string;
}

// =====================================================
// SUPPORT MESSAGE TYPES
// =====================================================

export type MessageSenderType = 'admin' | 'user' | 'system';

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  sender_type: MessageSenderType;
  is_internal: boolean;
  attachment_urls: string[] | null;
  read_by_user: boolean;
  read_by_admin: boolean;
  read_at: string | null;
  created_at: string;
}

export interface SupportMessageInsert {
  id?: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  sender_type: MessageSenderType;
  is_internal?: boolean;
  attachment_urls?: string[] | null;
  read_by_user?: boolean;
  read_by_admin?: boolean;
  read_at?: string | null;
  created_at?: string;
}

export interface SupportMessageUpdate {
  ticket_id?: string;
  sender_id?: string;
  message?: string;
  sender_type?: MessageSenderType;
  is_internal?: boolean;
  attachment_urls?: string[] | null;
  read_by_user?: boolean;
  read_by_admin?: boolean;
  read_at?: string | null;
}

// =====================================================
// CANNED RESPONSE TYPES
// =====================================================

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: TicketCategory;
  shortcode: string | null;
  variables: string[] | null;
  usage_count: number;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CannedResponseInsert {
  id?: string;
  title: string;
  content: string;
  category: TicketCategory;
  shortcode?: string | null;
  variables?: string[] | null;
  usage_count?: number;
  created_by?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CannedResponseUpdate {
  title?: string;
  content?: string;
  category?: TicketCategory;
  shortcode?: string | null;
  variables?: string[] | null;
  usage_count?: number;
  created_by?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

// =====================================================
// KNOWLEDGE BASE TYPES
// =====================================================

export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  keywords: string[] | null;
  related_article_ids: string[] | null;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_by: string | null;
  last_updated_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface KBArticleInsert {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  category: string;
  keywords?: string[] | null;
  related_article_ids?: string[] | null;
  is_published?: boolean;
  is_featured?: boolean;
  view_count?: number;
  helpful_count?: number;
  not_helpful_count?: number;
  created_by?: string | null;
  last_updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
}

export interface KBArticleUpdate {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string | null;
  category?: string;
  keywords?: string[] | null;
  related_article_ids?: string[] | null;
  is_published?: boolean;
  is_featured?: boolean;
  view_count?: number;
  helpful_count?: number;
  not_helpful_count?: number;
  created_by?: string | null;
  last_updated_by?: string | null;
  updated_at?: string;
  published_at?: string | null;
}

// =====================================================
// TICKET ACTIVITY TYPES
// =====================================================

export type ActivityType =
  | 'created'
  | 'assigned'
  | 'status_changed'
  | 'priority_changed'
  | 'message_sent'
  | 'resolved'
  | 'reopened'
  | 'closed';

export interface TicketActivity {
  id: string;
  ticket_id: string;
  actor_id: string | null;
  activity_type: ActivityType;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
}

export interface TicketActivityInsert {
  id?: string;
  ticket_id: string;
  actor_id?: string | null;
  activity_type: ActivityType;
  old_value?: string | null;
  new_value?: string | null;
  description?: string | null;
  created_at?: string;
}

// =====================================================
// SUPPORT METRICS TYPES
// =====================================================

export interface SupportMetricsDaily {
  id: string;
  date: string;
  tickets_created: number;
  tickets_resolved: number;
  tickets_closed: number;
  avg_first_response_minutes: number | null;
  avg_resolution_minutes: number | null;
  sla_met_count: number;
  sla_breached_count: number;
  tickets_by_category: Json;
  tickets_by_priority: Json;
  avg_satisfaction_rating: number | null;
  satisfaction_responses: number;
  tickets_by_admin: Json;
  calculated_at: string;
}

// =====================================================
// ENHANCED TYPES WITH RELATIONS
// =====================================================

export interface SupportTicketWithRelations extends SupportTicket {
  // User info
  user?: {
    id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
  };

  // Assigned admin info
  assigned_admin?: {
    id: string;
    display_name: string;
    email: string;
  } | null;

  // Related records
  order?: {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
  } | null;

  dispute?: {
    id: string;
    title: string;
    status: string;
  } | null;

  listing?: {
    id: string;
    title: string;
    status: string;
  } | null;

  // Message count
  message_count?: number;
  unread_messages?: number;

  // Latest activity
  latest_message?: SupportMessage;
  latest_activity?: TicketActivity;
}

export interface SupportMessageWithSender extends SupportMessage {
  sender?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

// =====================================================
// ANALYTICS TYPES
// =====================================================

export interface SupportAnalytics {
  // Overview stats
  total_open_tickets: number;
  total_in_progress_tickets: number;
  total_waiting_tickets: number;
  tickets_created_today: number;
  tickets_resolved_today: number;

  // Performance metrics
  avg_first_response_time_hours: number;
  avg_resolution_time_hours: number;
  sla_compliance_rate: number;

  // Volume by category
  tickets_by_category: Record<TicketCategory, number>;

  // Volume by priority
  tickets_by_priority: Record<TicketPriority, number>;

  // Satisfaction
  avg_satisfaction_rating: number;
  total_satisfaction_responses: number;

  // Trend data (last 30 days)
  daily_ticket_volume: Array<{
    date: string;
    created: number;
    resolved: number;
  }>;

  // Top performing admins
  admin_performance: Array<{
    admin_id: string;
    admin_name: string;
    tickets_resolved: number;
    avg_resolution_time_hours: number;
    satisfaction_rating: number;
  }>;

  // SLA status
  sla_approaching_deadline: number; // Count of tickets approaching SLA deadline
  sla_breached: number; // Count of tickets that breached SLA
}

// =====================================================
// HELPER TYPES FOR UI COMPONENTS
// =====================================================

export interface TicketFilterOptions {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assigned_to?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  sla_status?: 'on_track' | 'approaching' | 'breached';
}

export interface TicketSortOptions {
  field: 'created_at' | 'updated_at' | 'priority' | 'sla_deadline' | 'status';
  direction: 'asc' | 'desc';
}

export interface CannedResponseVariables {
  user_name?: string;
  order_number?: string;
  order_status?: string;
  admin_name?: string;
  custom_message?: string;
  [key: string]: string | undefined;
}

// =====================================================
// CONSTANTS
// =====================================================

export const TICKET_CATEGORIES: TicketCategory[] = [
  'billing',
  'order_issue',
  'account',
  'technical',
  'compliance',
  'other'
];

export const TICKET_PRIORITIES: TicketPriority[] = [
  'critical',
  'high',
  'normal',
  'low'
];

export const TICKET_STATUSES: TicketStatus[] = [
  'open',
  'in_progress',
  'waiting_on_user',
  'resolved',
  'closed'
];

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  billing: 'Billing & Payments',
  order_issue: 'Order Issues',
  account: 'Account Management',
  technical: 'Technical Support',
  compliance: 'Compliance & Verification',
  other: 'Other'
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  critical: 'Critical',
  high: 'High',
  normal: 'Normal',
  low: 'Low'
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_on_user: 'Waiting on User',
  resolved: 'Resolved',
  closed: 'Closed'
};

export const SLA_HOURS: Record<TicketPriority, number> = {
  critical: 2,
  high: 8,
  normal: 24,
  low: 48
};
