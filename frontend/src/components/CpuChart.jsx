import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { generateChartData } from '../utils/constants';
import socket from '../socket/socket';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border-2 border-foreground p-3 text-xs">
      <p className="text-mutedForeground font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-mono text-foreground">
          <span className="uppercase tracking-widest mr-2">{p.name}:</span>
          <span className="font-bold">{p.value.toFixed(1)}%</span>
        </p>
      ))}
    </div>
  );
};

export default function CpuChart({ title = 'Resource Usage', serverId, showMemory = true }) {
  const [data, setData] = useState(() => generateChartData(20, 40, 25));

  useEffect(() => {
    const onMetric = (metric) => {
      if (serverId && metric.serverId !== serverId) return;
      setData((prev) => {
        const updated = [...prev.slice(-19), {
          time:   new Date(metric.timestamp ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value:  metric.cpuUsage   ?? prev[prev.length - 1]?.value  ?? 30,
          memory: metric.memoryUsage ?? prev[prev.length - 1]?.memory ?? 50,
        }];
        return updated;
      });
    };

    socket.on('new_metric', onMetric);
    return () => socket.off('new_metric', onMetric);
  }, [serverId]);

  useEffect(() => {
    if (socket.connected) return; 
    const interval = setInterval(() => {
      setData((prev) => [
        ...prev.slice(-19),
        {
          time:   new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          value:  Math.max(5, Math.min(95, (prev[prev.length - 1]?.value ?? 40) + (Math.random() - 0.45) * 12)),
          memory: Math.max(5, Math.min(95, (prev[prev.length - 1]?.memory ?? 55) + (Math.random() - 0.45) * 8)),
        },
      ]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card bg-background h-full">
      <div className="flex items-center justify-between mb-8 border-b-2 border-foreground pb-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{title}</h3>
        <div className="flex items-center gap-2 text-xs font-bold text-foreground tracking-widest uppercase">
          <span className="dot-live" />
          Live
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#E5E5E5" strokeDasharray="2 2" vertical={false} />

          <XAxis
            dataKey="time"
            tick={{ fill: '#525252', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#525252', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#000000', strokeWidth: 1, strokeDasharray: '2 2' }} />

          {showMemory && (
            <Area
              type="step" dataKey="memory" name="Memory"
              stroke="#525252" strokeWidth={1} strokeDasharray="4 4"
              fill="#F5F5F5" dot={false} activeDot={{ r: 4, fill: '#FFFFFF', stroke: '#000000', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          )}
          <Area
            type="step" dataKey="value" name="CPU"
            stroke="#000000" strokeWidth={2}
            fill="transparent" dot={false} activeDot={{ r: 5, fill: '#000000' }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}