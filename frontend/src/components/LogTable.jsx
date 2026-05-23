import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { SEVERITY_CONFIG } from '../utils/constants';

export default function LogTable({ logs = [] }) {
  if (!logs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 border-2 border-dashed border-border">
        <Terminal size={32} strokeWidth={1} className="text-mutedForeground" />
        <p className="text-mutedForeground font-mono uppercase tracking-widest text-sm">No logs found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-2 border-foreground">
      <table className="w-full text-sm">
        <thead className="bg-foreground text-background">
          <tr>
            {['Severity', 'Service', 'Server', 'AI Category', 'Message', 'Timestamp'].map((h) => (
              <th key={h} className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {logs.map((log, i) => {
            const cfg = SEVERITY_CONFIG[log.severity] ?? SEVERITY_CONFIG.INFO;
            const ts  = new Date(log.timestamp).toLocaleString([], {
              month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
            });

            return (
              <motion.tr
                key={log._id ?? i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0 }} // instant
                className="border-b border-border hover:bg-muted transition-none group"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={cfg.badge}>{log.severity}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-mutedForeground uppercase tracking-widest">
                  {log.serviceName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground font-bold uppercase tracking-widest">
                  {log.serverId || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs">
                  <span className="text-foreground border-b border-border">{log.category || '—'}</span>
                  {log.confidence > 0 && (
                    <span className="ml-2 text-[10px] text-background bg-foreground px-1.5 py-0.5 tracking-widest font-bold">
                      {Math.round(log.confidence * 100)}%
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground max-w-md truncate group-hover:text-clip">
                  {log.message}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-mutedForeground">
                  {ts}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}