import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { SEVERITY_CONFIG } from '../utils/constants';

export default function AlertCard({ alert, onResolve, index = 0 }) {
  const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.INFO;
  const time = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = new Date(alert.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0, delay: index * 0.05 }}
      className={`card flex items-start gap-4 group transition-none ${
        alert.resolved ? 'border-l-4 border-l-mutedForeground opacity-60' : `border-l-[8px] border-l-foreground`
      }`}
    >
      <div className="relative shrink-0 mt-0.5">
        <ShieldAlert size={20} strokeWidth={1.5} className="text-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className={cfg.badge}>{alert.severity}</span>
          <span className="text-xs font-mono uppercase tracking-widest text-mutedForeground border-b border-border px-1 py-0.5">
            {alert.type}
          </span>
        </div>
        <p className="text-base font-serif text-foreground leading-snug">{alert.message}</p>
        <div className="flex items-center gap-1.5 mt-4 text-xs text-mutedForeground font-mono">
          <Clock size={14} strokeWidth={1.5} />
          <span>{date} at {time}</span>
        </div>
      </div>

      {!alert.resolved && onResolve && (
        <button
          onClick={() => onResolve(alert._id)}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-none text-xs font-medium uppercase tracking-widest text-foreground border-2 border-foreground hover:bg-foreground hover:text-background transition-none"
        >
          <CheckCircle size={14} strokeWidth={1.5} />
          Resolve
        </button>
      )}

      {alert.resolved && (
        <span className="shrink-0 flex items-center gap-1.5 text-xs text-foreground font-medium uppercase tracking-widest">
          <CheckCircle size={14} strokeWidth={1.5} />
          Resolved
        </span>
      )}
    </motion.div>
  );
}