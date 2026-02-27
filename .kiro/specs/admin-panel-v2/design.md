# Admin Panel v2 - Teknik Tasarım Dokümanı

## 1. Mimari Genel Bakış

### 1.1 Sistem Mimarisi
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  User Mgmt   │  │  Content Mod │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Reports    │  │   Payments   │  │  System Mon  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTPS / REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Admin Module │  │  Auth Module │  │  User Module │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Post Module │  │Report Module │  │ Audit Module │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐      ┌──────▼──────┐
        │   PostgreSQL   │      │    Redis    │
        │   (Database)   │      │   (Cache)   │
        └────────────────┘      └─────────────┘
```

### 1.2 Teknoloji Stack

**Backend**:
- NestJS 10+
- TypeORM
- PostgreSQL 16+
- Redis 7+
- Bull (job queue)
- JWT authentication

**Frontend**:
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Shadcn/ui
- React Query
- Recharts
- Zustand (state management)

---

## 2. Database Tasarımı

### 2.1 Yeni Tablolar

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```


#### admin_roles
```sql
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- SUPER_ADMIN, ADMIN, MODERATOR, VIEWER
  permissions JSONB,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_roles_user ON admin_roles(user_id);
CREATE INDEX idx_admin_roles_role ON admin_roles(role);
```

#### system_metrics
```sql
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL,
  metric_value NUMERIC,
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX idx_system_metrics_recorded ON system_metrics(recorded_at DESC);
```

#### daily_stats
```sql
CREATE TABLE daily_stats (
  date DATE PRIMARY KEY,
  total_users INTEGER,
  new_users INTEGER,
  active_users INTEGER,
  total_posts INTEGER,
  new_posts INTEGER,
  total_applications INTEGER,
  new_applications INTEGER,
  premium_users INTEGER,
  revenue NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_stats_date ON daily_stats(date DESC);
```

### 2.2 Mevcut Tablolara Eklemeler

#### users tablosu
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

CREATE INDEX idx_users_suspended ON users(suspended_until);
CREATE INDEX idx_users_banned ON users(banned_at);
CREATE INDEX idx_users_last_activity ON users(last_activity_at DESC);
```

#### posts tablosu
```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS admin_notes TEXT;

CREATE INDEX idx_posts_deleted ON posts(deleted_at);
```

#### reports tablosu
```sql
ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

CREATE INDEX idx_reports_priority ON reports(priority DESC);
CREATE INDEX idx_reports_assigned ON reports(assigned_to);
```

---

## 3. Backend API Tasarımı

### 3.1 Admin Module Yapısı

```
backend/src/admin/
├── admin.module.ts
├── admin.controller.ts
├── admin.service.ts
├── dto/
│   ├── suspend-user.dto.ts
│   ├── ban-user.dto.ts
│   ├── update-post.dto.ts
│   ├── resolve-report.dto.ts
│   └── filter-query.dto.ts
├── entities/
│   ├── audit-log.entity.ts
│   ├── admin-role.entity.ts
│   └── system-metric.entity.ts
└── services/
    ├── analytics.service.ts
    ├── audit.service.ts
    └── metrics.service.ts
```

### 3.2 API Endpoints

#### Dashboard & Analytics
```typescript
GET    /api/v1/admin/dashboard/stats
GET    /api/v1/admin/dashboard/charts
GET    /api/v1/admin/dashboard/activities
GET    /api/v1/admin/analytics/users
GET    /api/v1/admin/analytics/posts
GET    /api/v1/admin/analytics/revenue
GET    /api/v1/admin/analytics/reports
```


#### User Management
```typescript
GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id
POST   /api/v1/admin/users/:id/suspend
POST   /api/v1/admin/users/:id/ban
DELETE /api/v1/admin/users/:id/ban
POST   /api/v1/admin/users/:id/premium
DELETE /api/v1/admin/users/:id/premium
POST   /api/v1/admin/users/:id/notes
GET    /api/v1/admin/users/:id/activity
GET    /api/v1/admin/users/:id/posts
GET    /api/v1/admin/users/:id/applications
POST   /api/v1/admin/users/bulk-action
```

#### Post Management
```typescript
GET    /api/v1/admin/posts
GET    /api/v1/admin/posts/:id
PATCH  /api/v1/admin/posts/:id
DELETE /api/v1/admin/posts/:id
POST   /api/v1/admin/posts/:id/boost
POST   /api/v1/admin/posts/:id/feature
DELETE /api/v1/admin/posts/:id/feature
POST   /api/v1/admin/posts/:id/pause
POST   /api/v1/admin/posts/:id/resume
POST   /api/v1/admin/posts/:id/extend
POST   /api/v1/admin/posts/bulk-action
```

#### Report Management
```typescript
GET    /api/v1/admin/reports
GET    /api/v1/admin/reports/:id
PATCH  /api/v1/admin/reports/:id
POST   /api/v1/admin/reports/:id/resolve
POST   /api/v1/admin/reports/:id/dismiss
GET    /api/v1/admin/reports/stats
GET    /api/v1/admin/reports/similar/:id
```

#### Payment Management
```typescript
GET    /api/v1/admin/payments
GET    /api/v1/admin/payments/:id
POST   /api/v1/admin/payments/:id/refund
GET    /api/v1/admin/payments/stats
```

#### System Monitoring
```typescript
GET    /api/v1/admin/system/health
GET    /api/v1/admin/system/metrics
GET    /api/v1/admin/system/errors
GET    /api/v1/admin/system/performance
```

#### Audit Logs
```typescript
GET    /api/v1/admin/audit-logs
GET    /api/v1/admin/audit-logs/:id
GET    /api/v1/admin/audit-logs/export
```

### 3.3 DTO Örnekleri

#### SuspendUserDto
```typescript
export class SuspendUserDto {
  @IsInt()
  @Min(1)
  @Max(90)
  days: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsBoolean()
  @IsOptional()
  notifyUser?: boolean;
}
```

#### BanUserDto
```typescript
export class BanUserDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsBoolean()
  @IsOptional()
  permanent?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyUser?: boolean;
}
```

#### ResolveReportDto
```typescript
export class ResolveReportDto {
  @IsEnum(['RESOLVED', 'DISMISSED'])
  status: string;

  @IsString()
  @IsNotEmpty()
  resolution: string;

  @IsEnum(['WARN', 'SUSPEND', 'BAN', 'DELETE_CONTENT', 'NONE'])
  action: string;

  @IsObject()
  @IsOptional()
  actionDetails?: Record<string, any>;
}
```

### 3.4 Service Katmanı

#### AdminService
```typescript
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    private auditService: AuditService,
    private analyticsService: AnalyticsService,
    private cacheManager: Cache,
  ) {}

  async getDashboardStats() {
    const cacheKey = 'admin:dashboard:stats';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const stats = await this.calculateStats();
    await this.cacheManager.set(cacheKey, stats, 300); // 5 min
    return stats;
  }

  async suspendUser(userId: string, dto: SuspendUserDto, adminId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + dto.days);

    await this.userRepo.update(userId, {
      status: UserStatus.SUSPENDED,
      suspended_until: suspendedUntil,
      suspended_reason: dto.reason,
    });

    await this.auditService.log({
      adminId,
      action: 'USER_SUSPENDED',
      targetType: 'user',
      targetId: userId,
      details: { days: dto.days, reason: dto.reason },
    });

    if (dto.notifyUser) {
      // Send notification
    }

    return this.userRepo.findOne({ where: { id: userId } });
  }
}
```


#### AnalyticsService
```typescript
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(DailyStat) private dailyStatRepo: Repository<DailyStat>,
  ) {}

  async getUserAnalytics(startDate: Date, endDate: Date) {
    const dailyStats = await this.dailyStatRepo
      .createQueryBuilder('stat')
      .where('stat.date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('stat.date', 'ASC')
      .getMany();

    return {
      growth: this.calculateGrowth(dailyStats),
      retention: await this.calculateRetention(startDate, endDate),
      churn: await this.calculateChurn(startDate, endDate),
      cohorts: await this.calculateCohorts(startDate, endDate),
    };
  }

  async getPostAnalytics(startDate: Date, endDate: Date) {
    return {
      totalPosts: await this.postRepo.count(),
      postsByType: await this.getPostsByType(),
      postsByRegion: await this.getPostsByRegion(),
      avgViewsPerPost: await this.getAvgViews(),
      avgApplicationsPerPost: await this.getAvgApplications(),
    };
  }
}
```

#### AuditService
```typescript
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async log(data: {
    adminId: string;
    action: string;
    targetType: string;
    targetId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const log = this.auditRepo.create({
      admin_id: data.adminId,
      action_type: data.action,
      target_type: data.targetType,
      target_id: data.targetId,
      details: data.details,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
    });

    return await this.auditRepo.save(log);
  }

  async getLogs(filters: {
    adminId?: string;
    actionType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const query = this.auditRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin');

    if (filters.adminId) {
      query.andWhere('log.admin_id = :adminId', { adminId: filters.adminId });
    }

    if (filters.actionType) {
      query.andWhere('log.action_type = :actionType', { actionType: filters.actionType });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('log.created_at BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    }

    query.orderBy('log.created_at', 'DESC');
    query.skip((filters.page - 1) * filters.limit);
    query.take(filters.limit);

    return await query.getManyAndCount();
  }
}
```

---

## 4. Frontend Tasarımı

### 4.1 Klasör Yapısı

```
frontend/app/admin/
├── layout.tsx                 # Admin layout with sidebar
├── page.tsx                   # Dashboard
├── users/
│   ├── page.tsx              # User list
│   ├── [id]/
│   │   └── page.tsx          # User detail
│   └── components/
│       ├── UserTable.tsx
│       ├── UserFilters.tsx
│       └── UserActions.tsx
├── posts/
│   ├── page.tsx              # Post list
│   ├── [id]/
│   │   └── page.tsx          # Post detail
│   └── components/
│       ├── PostTable.tsx
│       ├── PostFilters.tsx
│       └── PostActions.tsx
├── reports/
│   ├── page.tsx              # Report queue
│   ├── [id]/
│   │   └── page.tsx          # Report detail
│   └── components/
│       ├── ReportQueue.tsx
│       ├── ReportCard.tsx
│       └── ReportActions.tsx
├── payments/
│   ├── page.tsx              # Payment list
│   └── [id]/
│       └── page.tsx          # Payment detail
├── analytics/
│   ├── page.tsx              # Analytics dashboard
│   └── components/
│       ├── UserAnalytics.tsx
│       ├── PostAnalytics.tsx
│       └── RevenueAnalytics.tsx
├── system/
│   ├── page.tsx              # System health
│   └── components/
│       ├── HealthMetrics.tsx
│       ├── ErrorLog.tsx
│       └── PerformanceMetrics.tsx
└── audit-logs/
    └── page.tsx              # Audit log viewer

frontend/components/admin/
├── Sidebar.tsx
├── StatCard.tsx
├── DataTable.tsx
├── Chart.tsx
├── FilterBar.tsx
├── ActionMenu.tsx
├── ConfirmDialog.tsx
└── BulkActionBar.tsx
```

### 4.2 Layout Tasarımı

#### AdminLayout
```typescript
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900/50 backdrop-blur-xl border-r border-gray-800">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

#### AdminSidebar
```typescript
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Kullanıcılar', href: '/admin/users' },
  { icon: FileText, label: 'İlanlar', href: '/admin/posts' },
  { icon: Flag, label: 'Raporlar', href: '/admin/reports' },
  { icon: CreditCard, label: 'Ödemeler', href: '/admin/payments' },
  { icon: BarChart, label: 'Analytics', href: '/admin/analytics' },
  { icon: Activity, label: 'Sistem', href: '/admin/system' },
  { icon: FileSearch, label: 'Audit Logs', href: '/admin/audit-logs' },
];
```


### 4.3 Component Tasarımları

#### StatCard Component
```typescript
interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ComponentType;
  trend?: 'up' | 'down';
}

export function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {change > 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        <div className="bg-purple-500/10 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-purple-500" />
        </div>
      </div>
    </div>
  );
}
```

#### DataTable Component
```typescript
interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({ data, columns, onRowClick, loading, pagination }: DataTableProps<T>) {
  // Implementation with sorting, pagination, loading states
}
```

#### FilterBar Component
```typescript
interface Filter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange';
  options?: { label: string; value: string }[];
}

interface FilterBarProps {
  filters: Filter[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
}

export function FilterBar({ filters, values, onChange, onReset }: FilterBarProps) {
  // Implementation with filter inputs
}
```

#### Chart Component
```typescript
interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  xKey: string;
  yKey: string;
  title?: string;
  height?: number;
}

export function Chart({ type, data, xKey, yKey, title, height = 300 }: ChartProps) {
  // Implementation using Recharts
}
```

### 4.4 State Management

#### Admin Store (Zustand)
```typescript
interface AdminStore {
  // Dashboard
  stats: DashboardStats | null;
  activities: Activity[];
  
  // Users
  users: User[];
  selectedUser: User | null;
  userFilters: UserFilters;
  
  // Posts
  posts: Post[];
  selectedPost: Post | null;
  postFilters: PostFilters;
  
  // Reports
  reports: Report[];
  selectedReport: Report | null;
  reportFilters: ReportFilters;
  
  // Actions
  setStats: (stats: DashboardStats) => void;
  setUsers: (users: User[]) => void;
  setUserFilters: (filters: UserFilters) => void;
  // ... more actions
}

export const useAdminStore = create<AdminStore>((set) => ({
  stats: null,
  activities: [],
  users: [],
  selectedUser: null,
  userFilters: {},
  posts: [],
  selectedPost: null,
  postFilters: {},
  reports: [],
  selectedReport: null,
  reportFilters: {},
  
  setStats: (stats) => set({ stats }),
  setUsers: (users) => set({ users }),
  setUserFilters: (filters) => set({ userFilters: filters }),
  // ... more implementations
}));
```

### 4.5 API Client

#### Admin API Client
```typescript
class AdminAPI {
  private baseURL = process.env.NEXT_PUBLIC_API_URL;

  // Dashboard
  async getDashboardStats() {
    return await fetch(`${this.baseURL}/admin/dashboard/stats`, {
      headers: this.getHeaders(),
    }).then(res => res.json());
  }

  async getDashboardCharts(period: string) {
    return await fetch(`${this.baseURL}/admin/dashboard/charts?period=${period}`, {
      headers: this.getHeaders(),
    }).then(res => res.json());
  }

  // Users
  async getUsers(filters: UserFilters) {
    const params = new URLSearchParams(filters as any);
    return await fetch(`${this.baseURL}/admin/users?${params}`, {
      headers: this.getHeaders(),
    }).then(res => res.json());
  }

  async getUserById(id: string) {
    return await fetch(`${this.baseURL}/admin/users/${id}`, {
      headers: this.getHeaders(),
    }).then(res => res.json());
  }

  async suspendUser(id: string, data: SuspendUserDto) {
    return await fetch(`${this.baseURL}/admin/users/${id}/suspend`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json());
  }

  async banUser(id: string, data: BanUserDto) {
    return await fetch(`${this.baseURL}/admin/users/${id}/ban`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    }).then(res => res.json());
  }

  // ... more methods

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }
}

export const adminAPI = new AdminAPI();
```

### 4.6 React Query Hooks

```typescript
// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminAPI.getDashboardStats(),
    refetchInterval: 60000, // 1 minute
  });
}

export function useDashboardCharts(period: string) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'charts', period],
    queryFn: () => adminAPI.getDashboardCharts(period),
  });
}

// User hooks
export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => adminAPI.getUsers(filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminAPI.getUserById(id),
    enabled: !!id,
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SuspendUserDto }) =>
      adminAPI.suspendUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Kullanıcı askıya alındı');
    },
  });
}

// ... more hooks
```


---

## 5. Sayfa Tasarımları

### 5.1 Dashboard Page

```typescript
export default function AdminDashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: charts } = useDashboardCharts('30d');
  const { data: activities } = useRecentActivities();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">Platform genel bakış ve istatistikler</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Kullanıcı"
          value={stats.totalUsers}
          change={stats.userGrowth}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Aktif İlanlar"
          value={stats.activePosts}
          icon={FileText}
        />
        <StatCard
          title="Premium Üyeler"
          value={stats.premiumUsers}
          icon={Crown}
        />
        <StatCard
          title="Bekleyen Raporlar"
          value={stats.pendingReports}
          icon={Flag}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Kullanıcı Büyümesi</h3>
          <Chart
            type="line"
            data={charts.userGrowth}
            xKey="date"
            yKey="users"
            height={300}
          />
        </div>
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">İlan Trendi</h3>
          <Chart
            type="bar"
            data={charts.postTrend}
            xKey="date"
            yKey="posts"
            height={300}
          />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Son Aktiviteler</h3>
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
```

### 5.2 Users Page

```typescript
export default function UsersPage() {
  const [filters, setFilters] = useState<UserFilters>({});
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers({ ...filters, page, limit: 25 });
  const suspendMutation = useSuspendUser();
  const banMutation = useBanUser();

  const columns: Column<User>[] = [
    {
      key: 'avatar_url',
      label: 'Avatar',
      render: (url) => <Avatar src={url} />,
    },
    {
      key: 'username',
      label: 'Kullanıcı Adı',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'status',
      label: 'Durum',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'is_premium',
      label: 'Premium',
      render: (isPremium) => isPremium ? <Crown className="text-yellow-500" /> : null,
    },
    {
      key: 'created_at',
      label: 'Kayıt Tarihi',
      render: (date) => formatDate(date),
      sortable: true,
    },
    {
      key: 'id',
      label: 'Aksiyonlar',
      render: (id, user) => (
        <ActionMenu
          items={[
            { label: 'Detay', onClick: () => router.push(`/admin/users/${id}`) },
            { label: 'Suspend', onClick: () => handleSuspend(user) },
            { label: 'Ban', onClick: () => handleBan(user) },
            { label: 'Premium Ver', onClick: () => handleGrantPremium(user) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Kullanıcı Yönetimi</h1>
        <button className="btn-primary">Export CSV</button>
      </div>

      <FilterBar
        filters={[
          { key: 'search', label: 'Ara', type: 'text' },
          { key: 'status', label: 'Durum', type: 'select', options: statusOptions },
          { key: 'region', label: 'Bölge', type: 'select', options: regionOptions },
          { key: 'premium', label: 'Premium', type: 'select', options: premiumOptions },
        ]}
        values={filters}
        onChange={(key, value) => setFilters({ ...filters, [key]: value })}
        onReset={() => setFilters({})}
      />

      <DataTable
        data={data?.users || []}
        columns={columns}
        loading={isLoading}
        pagination={{
          page,
          limit: 25,
          total: data?.total || 0,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
```

### 5.3 User Detail Page

```typescript
export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { data: user, isLoading } = useUser(params.id);
  const { data: posts } = useUserPosts(params.id);
  const { data: applications } = useUserApplications(params.id);
  const { data: activity } = useUserActivity(params.id);

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <NotFound />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatar_url} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-white">{user.username}</h1>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">Düzenle</button>
          <button className="btn-danger">Suspend</button>
          <button className="btn-danger">Ban</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="İlanlar" value={user.total_posts} icon={FileText} />
        <StatCard title="Başvurular" value={user.total_applications} icon={Send} />
        <StatCard title="Reputation" value={user.reputation_score} icon={Star} />
        <StatCard title="Strike" value={user.strike_count} icon={AlertTriangle} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="posts">İlanlar</TabsTrigger>
          <TabsTrigger value="applications">Başvurular</TabsTrigger>
          <TabsTrigger value="activity">Aktivite</TabsTrigger>
          <TabsTrigger value="moderation">Moderasyon</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <UserProfileTab user={user} />
        </TabsContent>

        <TabsContent value="posts">
          <UserPostsTab posts={posts} />
        </TabsContent>

        <TabsContent value="applications">
          <UserApplicationsTab applications={applications} />
        </TabsContent>

        <TabsContent value="activity">
          <UserActivityTab activity={activity} />
        </TabsContent>

        <TabsContent value="moderation">
          <UserModerationTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```


### 5.4 Reports Page

```typescript
export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({ status: 'PENDING' });
  const { data, isLoading } = useReports(filters);
  const resolveMutation = useResolveReport();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Rapor Yönetimi</h1>

      {/* Status Tabs */}
      <div className="flex gap-2">
        <button
          className={`tab ${filters.status === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilters({ ...filters, status: 'PENDING' })}
        >
          Bekleyen ({data?.counts.pending})
        </button>
        <button
          className={`tab ${filters.status === 'REVIEWING' ? 'active' : ''}`}
          onClick={() => setFilters({ ...filters, status: 'REVIEWING' })}
        >
          İnceleniyor ({data?.counts.reviewing})
        </button>
        <button
          className={`tab ${filters.status === 'RESOLVED' ? 'active' : ''}`}
          onClick={() => setFilters({ ...filters, status: 'RESOLVED' })}
        >
          Çözümlendi ({data?.counts.resolved})
        </button>
      </div>

      {/* Report Queue */}
      <div className="space-y-4">
        {data?.reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onResolve={(resolution) => resolveMutation.mutate({ id: report.id, resolution })}
            onDismiss={() => resolveMutation.mutate({ id: report.id, status: 'DISMISSED' })}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 6. Güvenlik ve Yetkilendirme

### 6.1 Role-Based Access Control (RBAC)

```typescript
enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  VIEWER = 'VIEWER',
}

const permissions = {
  [AdminRole.SUPER_ADMIN]: ['*'], // All permissions
  [AdminRole.ADMIN]: [
    'users:read',
    'users:update',
    'users:suspend',
    'users:ban',
    'posts:read',
    'posts:update',
    'posts:delete',
    'posts:boost',
    'posts:feature',
    'reports:read',
    'reports:resolve',
    'payments:read',
    'analytics:read',
    'audit:read',
  ],
  [AdminRole.MODERATOR]: [
    'users:read',
    'posts:read',
    'posts:update',
    'reports:read',
    'reports:resolve',
  ],
  [AdminRole.VIEWER]: [
    'users:read',
    'posts:read',
    'reports:read',
    'analytics:read',
  ],
};
```

### 6.2 Permission Guard

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );

    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return this.hasPermission(user, requiredPermission);
  }

  private hasPermission(user: any, permission: string): boolean {
    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }
}
```

### 6.3 Permission Decorator

```typescript
export const RequirePermission = (permission: string) =>
  SetMetadata('permission', permission);

// Usage
@Post('users/:id/ban')
@RequirePermission('users:ban')
async banUser(@Param('id') id: string, @Body() dto: BanUserDto) {
  return await this.adminService.banUser(id, dto);
}
```

---

## 7. Caching Strategy

### 7.1 Redis Cache Layers

```typescript
// Dashboard stats - 5 minutes
await cacheManager.set('admin:dashboard:stats', stats, 300);

// User list - 2 minutes
await cacheManager.set(`admin:users:${filterHash}`, users, 120);

// Post list - 2 minutes
await cacheManager.set(`admin:posts:${filterHash}`, posts, 120);

// Analytics - 10 minutes
await cacheManager.set(`admin:analytics:${type}:${period}`, data, 600);

// System metrics - 1 minute
await cacheManager.set('admin:system:metrics', metrics, 60);
```

### 7.2 Cache Invalidation

```typescript
// On user update
await cacheManager.del('admin:dashboard:stats');
await cacheManager.del('admin:users:*');

// On post update
await cacheManager.del('admin:dashboard:stats');
await cacheManager.del('admin:posts:*');

// On report resolution
await cacheManager.del('admin:dashboard:stats');
await cacheManager.del('admin:reports:*');
```

---

## 8. Background Jobs

### 8.1 Job Queue Setup

```typescript
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'admin',
    }),
  ],
})
export class AdminModule {}
```

### 8.2 Job Processors

```typescript
@Processor('admin')
export class AdminProcessor {
  @Process('bulk-suspend')
  async handleBulkSuspend(job: Job<{ userIds: string[]; dto: SuspendUserDto }>) {
    const { userIds, dto } = job.data;
    
    for (const userId of userIds) {
      await this.adminService.suspendUser(userId, dto);
      await job.progress((userIds.indexOf(userId) + 1) / userIds.length * 100);
    }
    
    return { processed: userIds.length };
  }

  @Process('bulk-export')
  async handleBulkExport(job: Job<{ type: string; filters: any }>) {
    const { type, filters } = job.data;
    
    const data = await this.getDataForExport(type, filters);
    const csv = await this.generateCSV(data);
    const url = await this.uploadToStorage(csv);
    
    return { url };
  }

  @Process('daily-stats')
  async handleDailyStats(job: Job) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const stats = await this.calculateDailyStats(yesterday);
    await this.saveDailyStats(stats);
    
    return { date: yesterday, stats };
  }
}
```

### 8.3 Scheduled Jobs

```typescript
@Injectable()
export class AdminScheduler {
  constructor(
    @InjectQueue('admin') private adminQueue: Queue,
  ) {}

  @Cron('0 0 * * *') // Daily at midnight
  async scheduleDailyStats() {
    await this.adminQueue.add('daily-stats', {});
  }

  @Cron('0 * * * *') // Every hour
  async scheduleMetricsCollection() {
    await this.adminQueue.add('collect-metrics', {});
  }

  @Cron('*/5 * * * *') // Every 5 minutes
  async scheduleHealthCheck() {
    await this.adminQueue.add('health-check', {});
  }
}
```

---

## 9. Monitoring ve Logging

### 9.1 Sentry Integration

```typescript
// Backend
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Frontend
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 9.2 Custom Logger

```typescript
@Injectable()
export class AdminLogger {
  private logger = new Logger('AdminModule');

  logAction(action: string, adminId: string, details: any) {
    this.logger.log({
      action,
      adminId,
      details,
      timestamp: new Date(),
    });
  }

  logError(error: Error, context: string) {
    this.logger.error(error.message, error.stack, context);
    Sentry.captureException(error);
  }
}
```

---

## 10. Testing Strategy

### 10.1 Backend Tests

```typescript
describe('AdminService', () => {
  let service: AdminService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useClass: Repository },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('suspendUser', () => {
    it('should suspend user for specified days', async () => {
      const userId = 'test-user-id';
      const dto = { days: 7, reason: 'Test suspension' };
      
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepo, 'update').mockResolvedValue(undefined);
      
      const result = await service.suspendUser(userId, dto, 'admin-id');
      
      expect(result.status).toBe(UserStatus.SUSPENDED);
      expect(result.suspended_until).toBeDefined();
    });
  });
});
```

### 10.2 Frontend Tests

```typescript
describe('UserTable', () => {
  it('should render users correctly', () => {
    const users = [mockUser1, mockUser2];
    render(<UserTable users={users} />);
    
    expect(screen.getByText(mockUser1.username)).toBeInTheDocument();
    expect(screen.getByText(mockUser2.username)).toBeInTheDocument();
  });

  it('should call onSuspend when suspend button clicked', () => {
    const onSuspend = jest.fn();
    render(<UserTable users={[mockUser1]} onSuspend={onSuspend} />);
    
    fireEvent.click(screen.getByText('Suspend'));
    
    expect(onSuspend).toHaveBeenCalledWith(mockUser1);
  });
});
```

---

## 11. Deployment

### 11.1 Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5433/squadbul
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret
SENTRY_DSN=your-sentry-dsn

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 11.2 Docker Setup

```yaml
# docker-compose.yml additions
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

---

## 12. Performance Optimization

### 12.1 Database Indexes
- Composite indexes on frequently filtered columns
- Partial indexes for status-based queries
- GIN indexes for JSONB columns

### 12.2 Query Optimization
- Use select specific columns instead of SELECT *
- Implement pagination on all list endpoints
- Use database views for complex analytics queries

### 12.3 Frontend Optimization
- Code splitting per route
- Lazy loading for heavy components
- Virtual scrolling for large lists
- Debounced search inputs
- Optimistic updates for better UX

---

## 13. Migration Plan

### 13.1 Phase 1: Backend Setup
1. Create new database tables
2. Implement admin module
3. Add audit logging
4. Setup background jobs
5. Add tests

### 13.2 Phase 2: Frontend Development
1. Create admin layout
2. Implement dashboard
3. Build user management
4. Build post management
5. Build report management

### 13.3 Phase 3: Integration & Testing
1. Integration tests
2. Performance testing
3. Security audit
4. User acceptance testing

### 13.4 Phase 4: Deployment
1. Database migrations
2. Deploy backend
3. Deploy frontend
4. Monitor and fix issues
