import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, Wifi, WifiOff, X, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import socket from '../socket/socket';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard',   sub: 'Real-time overview'        },
  '/servers':   { title: 'Servers',     sub: 'Infrastructure status'     },
  '/logs':      { title: 'Logs',        sub: 'Application log stream'    },
  '/alerts':    { title: 'Alerts',      sub: 'Active incidents'          },
  '/insights':  { title: 'AI Insights', sub: 'ML predictions & analysis' },
};

export default function Navbar() {
  const { logout } = useAuth();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [connected, setConnected] = useState(socket.connected);
  const [alerts, setAlerts]       = useState(0);
  const [toast, setToast]         = useState(null);
  const [muted, setMuted]         = useState(false);

  const page = PAGE_TITLES[location.pathname] ?? { title: 'NexusOps', sub: '' };

  useEffect(() => {
    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNewAlert   = (data) => {
      if (muted) return;
      setAlerts(n => n + 1);
      setToast({ message: data.message ?? 'New alert received', severity: data.severity ?? 'WARNING' });
      setTimeout(() => setToast(null), 4000);
    };

    socket.on('connect',    onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_alert',  onNewAlert);

    return () => {
      socket.off('connect',    onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_alert',  onNewAlert);
    };
  }, [muted]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-20 bg-background border-b-4 border-foreground flex items-center justify-between px-6 lg:px-12 shrink-0 z-20">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground leading-none tracking-tighter">{page.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-none text-xs font-mono font-bold uppercase tracking-widest border-2 ${
            connected
              ? 'bg-background border-foreground text-foreground'
              : 'bg-muted border-mutedForeground text-mutedForeground'
          }`}>
            {connected ? <Wifi size={14} strokeWidth={2} /> : <WifiOff size={14} strokeWidth={2} />}
            <span>{connected ? 'Live' : 'Offline'}</span>
            {connected && <span className="dot-live text-foreground" />}
          </div>

          <button
            onClick={() => setMuted(!muted)}
            className="p-2.5 rounded-none border-2 border-transparent text-foreground hover:bg-foreground hover:text-background transition-none"
            title={muted ? "Unmute alerts" : "Mute alerts"}
          >
            {muted ? <VolumeX size={20} strokeWidth={1.5} /> : <Volume2 size={20} strokeWidth={1.5} />}
          </button>

          <button
            onClick={() => { navigate('/alerts'); setAlerts(0); }}
            className="relative p-2.5 rounded-none border-2 border-transparent text-foreground hover:border-foreground transition-none"
            title="View alerts"
          >
            <Bell size={20} strokeWidth={1.5} />
            {alerts > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-foreground rounded-none text-[10px] font-bold text-background flex items-center justify-center font-mono"
              >
                {alerts > 9 ? '9+' : alerts}
              </motion.span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-none border-2 border-transparent text-foreground hover:bg-foreground hover:text-background transition-none"
            title="Sign out"
          >
            <LogOut size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0 }}
            className="fixed top-24 right-12 z-50 max-w-sm w-full bg-background border-4 border-foreground px-5 py-4 shadow-none"
          >
            <div className="flex justify-between items-center mb-1 border-b-2 border-foreground pb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground">New Alert</p>
              <button onClick={() => setToast(null)} className="text-foreground hover:text-mutedForeground transition-none">
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <p className="text-sm font-serif text-foreground leading-snug mt-2">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}