import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MetricCard({
  title, value = 0, unit = '%', icon: Icon,
  trend = 'stable', trendValue = '', index = 0,
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  // All trends are monochrome, but we can use muted text for context
  const trendColor = 'text-mutedForeground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0, delay: index * 0.05 }} // instant transition preferred
      className="card card-hoverable group cursor-default bg-lines flex flex-col justify-between"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-8">
        <p className="text-sm font-bold text-mutedForeground uppercase tracking-widest">{title}</p>
        
        {/* Icon box (no bg, no radius) */}
        <div className={`w-8 h-8 border-2 border-transparent group-hover:border-background transition-none flex items-center justify-center`}>
          {Icon && <Icon size={20} strokeWidth={1.5} className="text-foreground group-hover:text-background" />}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-5xl font-normal text-foreground group-hover:text-background tracking-tighter">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="text-lg text-mutedForeground font-mono group-hover:text-background">{unit}</span>
        </div>
      </div>

      {/* Progress line (sharp corners) */}
      <div className="mb-4">
        <div className="h-1 bg-muted group-hover:bg-background/20 rounded-none overflow-hidden border border-transparent">
          <motion.div
            className="h-full bg-foreground group-hover:bg-background rounded-none"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, value)}%` }}
            transition={{ duration: 0.2, delay: index * 0.05, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Trend indicator */}
      <div className={`flex items-center gap-1.5 ${trendColor} group-hover:text-background`}>
        <TrendIcon size={16} strokeWidth={1.5} />
        <span className="text-xs font-mono uppercase tracking-wider">{trendValue || 'No change'}</span>
      </div>
    </motion.div>
  );
}