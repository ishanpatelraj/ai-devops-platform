export const SEVERITY_CONFIG = {
  INFO:     { badge: 'badge-info',     dot: 'bg-foreground', color: 'text-foreground', glow: 'none' },
  WARNING:  { badge: 'badge-warning',  dot: 'bg-foreground', color: 'text-foreground', glow: 'none' },
  ERROR:    { badge: 'badge-error',    dot: 'bg-foreground', color: 'text-foreground', glow: 'none' },
  CRITICAL: { badge: 'badge-critical', dot: 'bg-foreground', color: 'text-foreground', glow: 'none' },
};

export const SERVER_STATUS_CONFIG = {
  online:      { color: 'text-foreground', dot: 'bg-foreground', label: 'Online' },
  offline:     { color: 'text-mutedForeground', dot: 'bg-mutedForeground', label: 'Offline' },
  warning:     { color: 'text-foreground', dot: 'bg-foreground', label: 'Degraded' },
  maintenance: { color: 'text-foreground', dot: 'bg-foreground', label: 'Maintenance' },
};

// Mock server list — replace with API call when ready
export const MOCK_SERVERS = [
  { id: 'srv-001', name: 'prod-api-01',  region: 'us-east-1',  status: 'online',      cpu: 34, memory: 61, disk: 42, uptime: '99.98%' },
  { id: 'srv-002', name: 'prod-api-02',  region: 'us-east-1',  status: 'online',      cpu: 28, memory: 55, disk: 39, uptime: '99.95%' },
  { id: 'srv-003', name: 'prod-db-01',   region: 'us-west-2',  status: 'warning',     cpu: 87, memory: 79, disk: 68, uptime: '98.12%' },
  { id: 'srv-004', name: 'staging-api',  region: 'eu-west-1',  status: 'online',      cpu: 12, memory: 33, disk: 25, uptime: '99.80%' },
  { id: 'srv-005', name: 'ml-service',   region: 'us-east-1',  status: 'offline',     cpu: 0,  memory: 0,  disk: 71, uptime: '81.30%' },
  { id: 'srv-006', name: 'redis-cache',  region: 'ap-south-1', status: 'online',      cpu: 8,  memory: 22, disk: 15, uptime: '100%'   },
];

// Generate a mock time-series for charts
export const generateChartData = (points = 20, baseValue = 40, variance = 30) => {
  return Array.from({ length: points }, (_, i) => ({
    time: `${i}m`,
    value: Math.max(5, Math.min(100, baseValue + (Math.random() - 0.5) * variance * 2)),
    // Add a second series for memory
    memory: Math.max(5, Math.min(100, baseValue + 15 + (Math.random() - 0.5) * variance)),
  }));
};