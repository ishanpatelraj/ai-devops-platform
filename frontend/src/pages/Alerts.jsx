import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import AlertCard from '../components/AlertCard';
import api       from '../api/axios';
import socket    from '../socket/socket';

const TABS = [
  { key: 'open',     label: 'Open',     filter: (a) => !a.resolved  },
  { key: 'resolved', label: 'Resolved', filter: (a) =>  a.resolved  },
  { key: 'all',      label: 'All',      filter: ()  => true          },
];

export default function Alerts() {
  const [alerts,  setAlerts]  = useState([]);
  const [tab,     setTab]     = useState('open');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/alerts?limit=50');
        if (data.data?.length) setAlerts(data.data);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const handler = (alert) => setAlerts(p => [alert, ...p]);
    socket.on('new_alert', handler);
    return () => socket.off('new_alert', handler);
  }, []);

  const resolveAlert = async (id) => {
    try { await api.patch(`/api/alerts/${id}/resolve`); } catch {}
    setAlerts(p => p.map(a => a._id === id ? { ...a, resolved: true } : a));
  };

  const resolveAll = async () => {
    const openAlerts = alerts.filter(a => !a.resolved);
    for (const a of openAlerts) {
      try { await api.patch(`/api/alerts/${a._id}/resolve`); } catch {}
    }
    setAlerts(p => p.map(a => ({ ...a, resolved: true })));
  };

  const activeTab     = TABS.find(t => t.key === tab);
  const displayAlerts = alerts.filter(activeTab.filter);
  const openCount     = alerts.filter(a => !a.resolved).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0 }}
      className="space-y-8 max-w-[900px]"
    >
      <div className="flex items-center justify-between flex-wrap gap-4 border-b-4 border-foreground pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-none bg-foreground flex items-center justify-center">
            <Bell size={24} strokeWidth={1.5} className="text-background" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground uppercase tracking-tighter">Alert Center</h2>
            <p className="text-sm font-mono uppercase tracking-widest text-mutedForeground">
              {openCount > 0 ? `${openCount} open incident${openCount > 1 ? 's' : ''}` : 'All clear'}
            </p>
          </div>
        </div>

        {openCount > 0 && (
          <button onClick={resolveAll} className="border-2 border-foreground bg-foreground text-background font-bold uppercase tracking-widest px-4 py-2 flex items-center gap-2 text-xs hover:bg-background hover:text-foreground transition-none">
            <CheckCheck size={16} strokeWidth={2} />
            Resolve All
          </button>
        )}
      </div>

      <div className="flex gap-2 p-2 bg-background border-2 border-foreground w-fit">
        {TABS.map(t => {
          const count = alerts.filter(t.filter).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-2 rounded-none text-xs font-bold uppercase tracking-widest transition-none flex items-center gap-3 border-2 ${
                tab === t.key
                  ? 'bg-foreground border-foreground text-background'
                  : 'bg-background border-transparent text-foreground hover:border-foreground'
              }`}
            >
              {t.label}
              <span className={`font-mono text-[10px] px-1.5 py-0.5 ${
                tab === t.key ? 'bg-background text-foreground' : 'bg-muted text-foreground'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 border-2 border-dashed border-border bg-background">
          <motion.div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-none" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
        </div>
      ) : displayAlerts.length === 0 ? (
        <div className="bg-background border-2 border-foreground flex flex-col items-center justify-center py-24 gap-4">
          <CheckCheck size={32} strokeWidth={1.5} className="text-mutedForeground" />
          <p className="text-sm font-bold uppercase tracking-widest text-mutedForeground">
            {tab === 'open' ? 'NO OPEN ALERTS — SYSTEM IS HEALTHY' : 'NO ALERTS FOUND'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {displayAlerts.map((alert, i) => (
              <AlertCard
                key={alert._id}
                alert={alert}
                onResolve={!alert.resolved ? resolveAlert : undefined}
                index={i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}