import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, MemoryStick, HardDrive, Network, RefreshCw } from 'lucide-react';
import MetricCard  from '../components/MetricCard';
import CpuChart    from '../components/CpuChart';
import AlertCard   from '../components/AlertCard';
import LogTable    from '../components/LogTable';
import api         from '../api/axios';
import socket      from '../socket/socket';

const Section = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0, delay }}
  >
    {children}
  </motion.div>
);

export default function Dashboard() {
  const [metrics, setMetrics] = useState({ cpu: 0, memory: 0, disk: 0, network: 0 });
  const [logs,    setLogs]    = useState([]);
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, alertsRes] = await Promise.allSettled([
        api.get('/api/logs?limit=5'),
        api.get('/api/alerts?resolved=false&limit=3'),
      ]);
      if (logsRes.status   === 'fulfilled') setLogs(logsRes.value.data.data);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data.data);
    } catch {} 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const onMetric = (m) => setMetrics(prev => ({
      cpu:     m.cpuUsage    ?? prev.cpu,
      memory:  m.memoryUsage ?? prev.memory,
      disk:    m.diskUsage   ?? prev.disk,
      network: m.networkUsage ?? prev.network,
    }));
    const onNewLog   = (log)   => setLogs((p) => [log, ...p].slice(0, 5));
    const onNewAlert = (alert) => setAlerts((p) => [alert, ...p].slice(0, 3));

    socket.on('new_metric', onMetric);
    socket.on('new_log',    onNewLog);
    socket.on('new_alert',  onNewAlert);
    return () => {
      socket.off('new_metric', onMetric);
      socket.off('new_log',    onNewLog);
      socket.off('new_alert',  onNewAlert);
    };
  }, []);

  const resolveAlert = async (id) => {
    try {
      await api.patch(`/api/alerts/${id}/resolve`);
      setAlerts((p) => p.filter((a) => a._id !== id));
    } catch {
      setAlerts((p) => p.filter((a) => a._id !== id)); 
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px]">

      {/* ── Metric cards row ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="CPU Usage"    value={metrics.cpu}    unit="%" icon={Cpu}        trend="up"     trendValue="" index={0} />
        <MetricCard title="Memory"       value={metrics.memory} unit="%" icon={MemoryStick} trend="stable" trendValue="" index={1} />
        <MetricCard title="Disk Usage"   value={metrics.disk}   unit="%" icon={HardDrive}   trend="up"     trendValue="" index={2} />
        <MetricCard title="Network I/O"  value={metrics.network}unit="MB/s" icon={Network} trend="down"   trendValue="" index={3} />
      </div>

      <hr className="border-t-4 border-foreground" />

      {/* ── Charts row ───────────────────────────────── */}
      <Section delay={0.05}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CpuChart title="CPU & Memory — Live Stream" showMemory />
          <CpuChart title="Recent Anomalies" serverId="" showMemory={false} />
        </div>
      </Section>

      <hr className="border-t-4 border-foreground" />

      {/* ── Alerts + Logs row ────────────────────────── */}
      <Section delay={0.1}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Active alerts */}
          <div className="bg-background border-2 border-foreground p-6">
            <div className="flex items-center justify-between mb-8 border-b-2 border-foreground pb-4">
              <h3 className="text-xl font-serif font-bold text-foreground">Active Alerts</h3>
              <span className="text-xs font-mono text-background bg-foreground px-3 py-1 uppercase tracking-widest font-bold">
                {alerts.length} open
              </span>
            </div>
            {alerts.length === 0 ? (
              <p className="text-sm font-bold uppercase tracking-widest text-mutedForeground text-center py-12 border-2 border-dashed border-border">No active alerts</p>
            ) : (
              <div className="space-y-4">
                {alerts.map((a, i) => <AlertCard key={a._id} alert={a} onResolve={resolveAlert} index={i} />)}
              </div>
            )}
          </div>

          {/* Recent logs */}
          <div className="bg-background border-2 border-foreground p-6">
            <div className="flex items-center justify-between mb-8 border-b-2 border-foreground pb-4">
              <h3 className="text-xl font-serif font-bold text-foreground">Recent Logs</h3>
              <button
                onClick={fetchData}
                className={`p-2 bg-foreground text-background hover:bg-background hover:text-foreground border-2 border-transparent hover:border-foreground transition-none ${loading ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={16} strokeWidth={2} />
              </button>
            </div>
            <LogTable logs={logs} />
          </div>

        </div>
      </Section>
    </div>
  );
}