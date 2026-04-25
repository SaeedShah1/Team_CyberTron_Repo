export type UserRole = 'admin' | 'editor' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface Filters {
  search: string;
  role: UserRole | 'all';
  status: UserStatus | 'all';
}

export type ActivityAction = 'created' | 'updated' | 'deleted' | 'login' | 'role_changed' | 'status_changed';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: ActivityAction;
  description: string;
  metadata: Record<string, string>;
  created_at: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  adminCount: number;
  editorCount: number;
  viewerCount: number;
  recentLogins: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export type DateRange = '7d' | '30d' | '90d' | 'all';

// System Monitoring Types
export type MetricType = 'cpu' | 'memory' | 'disk' | 'network' | 'latency' | 'request_time';

export interface SystemMetric {
  id: string;
  metric_type: MetricType;
  value: number;
  unit: string;
  metadata: Record<string, unknown>;
  recorded_at: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export type LogLevel = 'error' | 'warn' | 'info';

export interface ErrorLog {
  id: string;
  level: LogLevel;
  service: string;
  message: string;
  stack_trace: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Product Types
export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  status: ProductStatus;
  sku: string | null;
  stock: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  status: ProductStatus;
  sku: string;
  stock: number;
}

export interface ProductFilters {
  search: string;
  category: string;
  status: ProductStatus | 'all';
  priceMin: string;
  priceMax: string;
}

// Feature Flag Types
export type FeatureCategory = 'core' | 'integration' | 'analytics' | 'experimental';

export interface FeatureFlag {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: FeatureCategory;
  enabled: boolean;
  icon: string;
  config: Record<string, string>;
  required_role: string;
  dependencies: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type AIPromptStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'rejected' | 'archived';

export interface AIPromptConfig {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  current_published_version_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIPromptVersion {
  id: string;
  config_id: string;
  version_number: number;
  prompt_text: string;
  status: AIPromptStatus;
  change_reason: string;
  safety_checklist: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_by: string | null;
  published_at: string | null;
  parent_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIPromptAuditEntry {
  id: string;
  config_id: string | null;
  version_id: string | null;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  reason: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
