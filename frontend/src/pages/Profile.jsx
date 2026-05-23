import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Server, Trash2, Mail, Shield, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const { user } = useAuth();
  const [servers, setServers] = useState([]);
  
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/servers');
        if (data.data) setServers(data.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/servers/${id}`);
      setServers(prev => prev.filter(s => s._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0 }}
      className="space-y-8 max-w-[1200px]"
    >
      <div className="flex items-center gap-4 border-b-4 border-foreground pb-4">
        <div className="w-12 h-12 rounded-none bg-foreground flex items-center justify-center">
          <User size={24} strokeWidth={1.5} className="text-background" />
        </div>
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground uppercase tracking-tighter">Profile</h2>
          <p className="text-sm font-mono uppercase tracking-widest text-mutedForeground">User Information & Settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* About Me Section */}
        <div className="bg-background border-2 border-foreground p-6">
          <h3 className="text-xl font-serif font-bold text-foreground uppercase tracking-tighter mb-6 border-b-2 border-foreground pb-2">About Me</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-mutedForeground block mb-1">Username</label>
              <div className="flex items-center gap-3 p-3 border-2 border-border">
                <User size={16} className="text-foreground" />
                <span className="font-mono text-sm font-bold uppercase">{user?.username || user?.name || 'Unknown'}</span>
              </div>
            </div>
            
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-mutedForeground block mb-1">Email</label>
              <div className="flex items-center gap-3 p-3 border-2 border-border">
                <Mail size={16} className="text-foreground" />
                <span className="font-mono text-sm font-bold uppercase">{user?.email || 'N/A'}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-mutedForeground block mb-1">Role / Access Level</label>
              <div className="flex items-center gap-3 p-3 border-2 border-border">
                <Shield size={16} className="text-foreground" />
                <span className="font-mono text-sm font-bold uppercase">{user?.role || 'Admin'}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-mutedForeground block mb-1">User ID</label>
              <div className="flex items-center gap-3 p-3 border-2 border-border">
                <Hash size={16} className="text-foreground" />
                <span className="font-mono text-sm font-bold uppercase">{user?.id || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Server Management Section */}
        <div className="bg-background border-2 border-foreground p-6 flex flex-col">
          <h3 className="text-xl font-serif font-bold text-foreground uppercase tracking-tighter mb-6 border-b-2 border-foreground pb-2">Server Management</h3>
          <p className="text-[10px] uppercase tracking-widest text-mutedForeground mb-4 font-bold">Your Registered Servers</p>

          <div className="flex-1 overflow-y-auto min-h-[200px] border-2 border-border p-2 space-y-2">
            {servers.length === 0 ? (
              <div className="text-center p-4 text-sm font-mono text-mutedForeground uppercase tracking-widest">No servers added</div>
            ) : (
              servers.map(server => (
                <div key={server._id} className="flex items-center justify-between p-3 border-2 border-border hover:border-foreground transition-none group">
                  <div className="flex items-center gap-3">
                    <Server size={16} className="text-foreground" />
                    <div>
                      <p className="text-sm font-bold font-mono uppercase tracking-widest truncate max-w-[150px]">{server.name}</p>
                      <p className="text-[10px] text-mutedForeground font-mono uppercase tracking-widest">{server.serverId} • {server.status}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(server._id)}
                    className="p-2 text-mutedForeground hover:text-foreground hover:bg-muted border-2 border-transparent hover:border-foreground transition-none"
                    title="Delete Server"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
