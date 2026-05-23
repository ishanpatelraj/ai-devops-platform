import { motion } from 'framer-motion';

export default function Loader({ fullscreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Animated logo mark */}
      <div className="relative">
        <motion.div
          className="w-14 h-14 rounded-2xl border border-accent-cyan/30 flex items-center justify-center"
          animate={{ boxShadow: ['0 0 0px rgba(34,211,238,0)', '0 0 30px rgba(34,211,238,0.4)', '0 0 0px rgba(34,211,238,0)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* NexusOps "N" logo mark */}
          <span className="font-mono font-bold text-2xl text-accent-cyan">N</span>
        </motion.div>
        {/* Spinning ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-t border-r border-accent-cyan/60"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Loading bar */}
      <div className="w-40 h-0.5 bg-line rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent-cyan to-accent-violet"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <p className="text-ink-muted text-sm font-mono tracking-widest uppercase">
        Initializing
      </p>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-16">{content}</div>;
}