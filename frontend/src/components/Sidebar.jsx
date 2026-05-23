import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ScrollText, Bell, Server,
  BrainCircuit, ChevronLeft, Activity, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/servers',   icon: Server,          label: 'Servers'      },
  { to: '/logs',      icon: ScrollText,       label: 'Logs'         },
  { to: '/alerts',    icon: Bell,             label: 'Alerts'       },
  { to: '/insights',  icon: BrainCircuit,     label: 'AI Insights', soon: true },
  { to: '/profile',   icon: User,             label: 'Profile'      },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();

  const sidebarVariants = {
    expanded:  { width: 220 },
    collapsed: { width: 68  },
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0, ease: 'linear' }}
      className="relative flex flex-col h-full bg-background border-r-4 border-foreground shrink-0 overflow-hidden z-30"
    >
      <div className="flex items-center h-16 px-4 border-b-2 border-foreground shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-none bg-foreground flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-background" strokeWidth={2} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0 }}
                className="font-bold font-serif text-foreground text-xl tracking-tighter whitespace-nowrap uppercase"
              >
                NexusOps
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <nav className="flex-1 px-0 py-4 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, soon }) => {
          const isActive = location.pathname === to;
          return (
            <div key={to} className="relative group">
              <NavLink
                to={soon ? '#' : to}
                onClick={e => soon && e.preventDefault()}
                className={`nav-item ${isActive ? 'active' : ''} ${soon ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <Icon size={18} strokeWidth={1.5} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0 }}
                      className="whitespace-nowrap uppercase tracking-widest text-xs font-bold"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && soon && (
                  <span className="ml-auto text-[10px] font-mono text-foreground border border-foreground px-1 py-0.5 uppercase tracking-widest bg-muted">
                    Soon
                  </span>
                )}
              </NavLink>

              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-foreground border-2 border-foreground text-xs font-bold uppercase tracking-widest text-background whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-none z-50">
                  {label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 px-0 pb-0 pt-0 border-t-2 border-foreground bg-muted">
        <div className="flex items-center gap-3 px-4 py-4 rounded-none">
          <div className="w-8 h-8 rounded-none bg-foreground flex items-center justify-center shrink-0 text-background text-sm font-serif font-bold">
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0 }}
                className="min-w-0"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-foreground truncate">{user?.username ?? 'User'}</p>
                <p className="text-[10px] text-mutedForeground uppercase tracking-widest truncate font-mono mt-0.5">{user?.role ?? 'Viewer'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={onToggle}
        className="absolute bottom-[92px] -right-3 w-6 h-6 rounded-none bg-background border-2 border-foreground flex items-center justify-center text-foreground hover:bg-foreground hover:text-background transition-none z-40"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0 }}>
          <ChevronLeft size={14} strokeWidth={2} />
        </motion.div>
      </button>
    </motion.aside>
  );
}