import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Activity, RefreshCw, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { SERVER_STATUS_CONFIG, generateChartData } from '../utils/constants';
import api from '../api/axios';
import socket from '../socket/socket';

const Sparkline = ({ color = '#000000' }) => {
  const data = generateChartData(12, 35, 20);
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Tooltip
          contentStyle={{ background: '#FFFFFF', border: '2px solid #000000', borderRadius: 0, fontSize: 10, fontFamily: 'JetBrains Mono', color: '#000000', padding: '4px 8px' }}
          itemStyle={{ color: '#000000', fontWeight: 'bold' }}
          formatter={(v) => [`${v.toFixed(1)}%`, 'CPU']}
          labelFormatter={() => ''}
          cursor={{ stroke: '#000000', strokeWidth: 1, strokeDasharray: '2 2' }}
        />
        <Area type="step" dataKey="value" stroke={color} strokeWidth={2} fill="transparent" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const MetricBar = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-[10px] font-bold font-mono uppercase tracking-widest mb-2">
      <span className="text-mutedForeground">{label}</span>
      <span className="text-foreground">{value}%</span>
    </div>
    <div className="h-2 bg-muted rounded-none border border-border">
      <motion.div
        className="h-full bg-foreground rounded-none"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.2, ease: 'linear' }}
      />
    </div>
  </div>
);

const ServerDetail = ({ server }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0 }}
    className="overflow-hidden border-t-2 border-foreground mt-6 pt-6 space-y-5"
  >
    <MetricBar label="CPU"    value={server.cpu || 0}    />
    <MetricBar label="Memory" value={server.memory || 0} />
    <MetricBar label="Disk"   value={server.disk || 0}   />
    <div className="pt-2">
      <p className="text-[10px] text-mutedForeground font-bold uppercase tracking-widest font-mono mb-2">CPU TREND — 12 min</p>
      <div className="border-2 border-border p-2">
        <Sparkline color={server.status === 'offline' ? '#A3A3A3' : '#000000'} />
      </div>
    </div>
  </motion.div>
);

export default function Servers() {
  const [servers,   setServers]   = useState([]);
  const [expanded,  setExpanded]  = useState(null);
  const [refreshing,setRefreshing]= useState(false);
  const [newServerId, setNewServerId] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [newServerIp, setNewServerIp] = useState('127.0.0.1');

  const fetchServers = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get('/api/servers');
      if (data.data) {
        const formattedServers = data.data.map(srv => ({
          ...srv,
          cpu: srv.latestMetric?.cpuUsage || 0,
          memory: srv.latestMetric?.memoryUsage || 0,
          disk: srv.latestMetric?.diskUsage || 0,
          uptime: srv.status === 'Online' ? '100%' : '0%',
        }));
        setServers(formattedServers);
      }
    } catch (error) {
      console.error("Failed to fetch servers", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    const onMetric = (m) => {
      setServers(prev => prev.map(srv => {
        if (srv.serverId === m.serverId) {
          return {
            ...srv,
            cpu: m.cpuUsage,
            memory: m.memoryUsage,
            disk: m.diskUsage,
            status: 'Online',
            lastSeen: new Date().toISOString()
          };
        }
        return srv;
      }));
    };
    socket.on('new_metric', onMetric);
    return () => socket.off('new_metric', onMetric);
  }, []);

  const counts = {
    online:  servers.filter(s => s.status === 'Online').length,
    warning: servers.filter(s => s.status === 'Degraded').length,
    offline: servers.filter(s => s.status === 'Offline').length,
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/servers/${id}`);
      setServers(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddServer = async (e) => {
    e.preventDefault();
    if (!newServerId || !newServerName) return;
    try {
      const { data } = await api.post('/api/servers', {
        serverId: newServerId,
        name: newServerName,
        ipAddress: newServerIp,
        os: 'Linux'
      });
      if (data.data) {
        setServers(prev => [{ ...data.data, cpu: 0, memory: 0, disk: 0, uptime: '0%' }, ...prev]);
        setNewServerId('');
        setNewServerName('');
      }
    } catch (err) {
      alert("Failed to add server: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0 }}
      className="space-y-8 max-w-[1200px]"
    >
      <div className="flex items-center justify-between flex-wrap gap-4 border-b-4 border-foreground pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-none bg-foreground flex items-center justify-center">
            <Server size={24} strokeWidth={1.5} className="text-background" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground uppercase tracking-tighter">Infrastructure</h2>
            <p className="text-sm font-mono uppercase tracking-widest text-mutedForeground">{servers.length} registered servers</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest font-mono px-3 py-1.5 border-2 border-foreground bg-background text-foreground">
            <span className="dot-live text-foreground" />
            {counts.online} online
          </span>
          {counts.warning > 0 && (
            <span className="text-xs font-bold uppercase tracking-widest font-mono px-3 py-1.5 border-2 border-foreground bg-foreground text-background">
              {counts.warning} degraded
            </span>
          )}
          {counts.offline > 0 && (
            <span className="text-xs font-bold uppercase tracking-widest font-mono px-3 py-1.5 border-2 border-mutedForeground bg-muted text-mutedForeground">
              {counts.offline} offline
            </span>
          )}
          <button onClick={fetchServers} className={`p-2 border-2 border-foreground hover:bg-foreground hover:text-background transition-none ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="bg-background border-4 border-foreground p-6">
        <h3 className="font-serif font-bold text-xl uppercase tracking-widest border-b-2 border-foreground pb-2 mb-4">Register New Server</h3>
        <form onSubmit={handleAddServer} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest font-bold text-mutedForeground block mb-2">SERVER IDENTIFIER (Must match Agent)</label>
            <input
              type="text"
              value={newServerId}
              onChange={(e) => setNewServerId(e.target.value)}
              placeholder="e.g. WIN-DESKTOP-01"
              required
              className="w-full bg-background border-2 border-border text-foreground px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:border-foreground transition-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest font-bold text-mutedForeground block mb-2">DISPLAY NAME</label>
            <input
              type="text"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              placeholder="Main Database"
              required
              className="w-full bg-background border-2 border-border text-foreground px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:border-foreground transition-none"
            />
          </div>
          <div className="w-48">
            <label className="text-[10px] uppercase tracking-widest font-bold text-mutedForeground block mb-2">IP ADDRESS</label>
            <input
              type="text"
              value={newServerIp}
              onChange={(e) => setNewServerIp(e.target.value)}
              required
              className="w-full bg-background border-2 border-border text-foreground px-3 py-2 font-mono text-sm focus:outline-none focus:border-foreground transition-none"
            />
          </div>
          <button
            type="submit"
            className="bg-foreground text-background px-6 py-2 border-2 border-foreground font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-background hover:text-foreground transition-none h-[42px]"
          >
            <Plus size={16} strokeWidth={2} />
            Add Server
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {servers.map((server) => {
          const cfg      = SERVER_STATUS_CONFIG[server.status?.toLowerCase()] ?? SERVER_STATUS_CONFIG.offline;
          const isOpen   = expanded === server._id;
          const isOnline = server.status === 'Online';

          return (
            <motion.div
              key={server._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0, delay: 0 }}
              className={`bg-background border-2 border-foreground p-6 ${!isOnline ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="flex items-start justify-between mb-6 border-b-2 border-foreground pb-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-10 h-10 rounded-none bg-foreground flex items-center justify-center">
                    <Server size={20} strokeWidth={1.5} className="text-background" />
                    {isOnline && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-foreground border border-background" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-foreground font-mono truncate max-w-[150px]" title={server.name}>{server.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-mutedForeground mt-0.5">{server.serverId} • {server.ipAddress}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border-2 ${
                    server.status === 'Online'      ? 'bg-background text-foreground border-foreground' :
                    server.status === 'Degraded'     ? 'bg-foreground text-background border-foreground' :
                    server.status === 'maintenance' ? 'bg-muted text-foreground border-border' :
                                                      'bg-muted text-mutedForeground border-mutedForeground'
                  }`}>
                    {cfg.label || server.status}
                  </span>
                  <button
                    onClick={() => handleDelete(server._id)}
                    className="p-1 text-mutedForeground hover:text-foreground hover:bg-muted border-2 border-transparent hover:border-foreground transition-none"
                    title="Delete Server"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-6">
                {[
                  { label: 'CPU',  value: server.cpu   },
                  { label: 'MEM',  value: server.memory },
                  { label: 'DISK', value: server.disk   },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="font-serif text-2xl font-bold text-foreground">
                      {Math.round(value)}%
                    </p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-mutedForeground mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setExpanded(isOpen ? null : server._id)}
                className="w-full flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold text-foreground border-2 border-border hover:border-foreground py-2 transition-none"
              >
                <Activity size={14} strokeWidth={2} />
                {isOpen ? 'HIDE DETAILS' : 'VIEW DETAILS'}
                {isOpen ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
              </button>

              {isOpen && <ServerDetail server={server} />}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}