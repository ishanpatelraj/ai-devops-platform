import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw, Terminal } from 'lucide-react';
import LogTable from '../components/LogTable';
import api      from '../api/axios';
import socket   from '../socket/socket';

const SEVERITIES = ['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
const SEVERITY_COLORS = {
  INFO: 'text-background bg-foreground border-foreground',
  WARNING: 'text-background bg-foreground border-foreground',
  ERROR: 'text-background bg-foreground border-foreground',
  CRITICAL: 'text-background bg-foreground border-foreground',
  ALL: 'text-background bg-foreground border-foreground',
};

export default function Logs() {
  const [logs,       setLogs]       = useState([]);
  const [search,     setSearch]     = useState('');
  const [severity,   setSeverity]   = useState('ALL');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [liveCount,  setLiveCount]  = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (severity !== 'ALL') params.append('severity', severity);
      const { data } = await api.get(`/api/logs?${params}`);
      setLogs(data.data || []);
      setTotalPages(data.totalPages ?? 1);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, severity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    const onNewLog = (log) => {
      setLiveCount(n => n + 1);
      if (page === 1) setLogs(p => [log, ...p].slice(0, 20));
    };
    socket.on('new_log', onNewLog);
    return () => socket.off('new_log', onNewLog);
  }, [page]);

  const filtered = search.trim()
    ? logs.filter(l =>
        l.message?.toLowerCase().includes(search.toLowerCase()) ||
        l.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
        l.serverId?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0 }}
      className="space-y-8 max-w-[1200px]"
    >
      <div className="flex items-center justify-between border-b-4 border-foreground pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-none bg-foreground flex items-center justify-center">
            <Terminal size={24} strokeWidth={1.5} className="text-background" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground uppercase tracking-tighter">Log Stream</h2>
            <p className="text-sm text-mutedForeground font-mono uppercase tracking-widest">{filtered.length} entries displayed</p>
          </div>
        </div>
        {liveCount > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0 }}
            onClick={() => { setLiveCount(0); fetchLogs(); }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-background border-2 border-foreground bg-foreground px-4 py-2 hover:bg-background hover:text-foreground transition-none"
          >
            <span className="dot-live" />
            {liveCount} new — click to refresh
          </motion.button>
        )}
      </div>

      <div className="bg-background border-2 border-foreground p-5 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-mutedForeground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH MESSAGES, SERVICES, SERVERS..."
            className="w-full bg-background border-2 border-border text-foreground px-4 py-2 pl-12 font-mono text-xs uppercase tracking-widest focus:outline-none focus:border-foreground"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} strokeWidth={2} className="text-foreground shrink-0 mr-2" />
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => { setSeverity(s); setPage(1); }}
              className={`text-xs font-bold uppercase tracking-widest border-2 px-3 py-1.5 transition-none ${
                severity === s
                  ? SEVERITY_COLORS[s]
                  : 'text-foreground border-border hover:border-foreground bg-background'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button onClick={fetchLogs} className={`p-2 border-2 border-border text-foreground hover:border-foreground transition-none ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="bg-background">
        {loading ? (
          <div className="flex items-center justify-center py-24 border-2 border-dashed border-border">
            <motion.div
              className="w-8 h-8 border-4 border-muted border-t-foreground rounded-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : filtered.length === 0 ? (
           <p className="text-sm font-bold uppercase tracking-widest text-mutedForeground text-center py-12 border-2 border-dashed border-border">No logs found</p>
        ) : (
          <LogTable logs={filtered} />
        )}
      </div>

      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-foreground border-t-4 border-foreground pt-4">
        <span className="font-mono">Page {page} of {totalPages}</span>
        <div className="flex gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="border-2 border-foreground px-4 py-2 hover:bg-foreground hover:text-background disabled:opacity-30 disabled:hover:bg-background disabled:hover:text-foreground transition-none flex items-center gap-2"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Prev
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="border-2 border-foreground px-4 py-2 hover:bg-foreground hover:text-background disabled:opacity-30 disabled:hover:bg-background disabled:hover:text-foreground transition-none flex items-center gap-2"
          >
            Next
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}