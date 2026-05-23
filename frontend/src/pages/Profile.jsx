import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Server, Trash2, Mail, Shield, Hash, Key, Bell, 
  Globe, Lock, CheckCircle2, ChevronRight, LogOut, Terminal,
  Plus, Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const TABS = [
  { id: 'general', label: 'General Info', icon: User },
  { id: 'security', label: 'Security & Auth', icon: Lock },
  { id: 'notifications', label: 'Alert Preferences', icon: Bell },
  { id: 'servers', label: 'Server Fleet', icon: Server },
  { id: 'advanced', label: 'Advanced Settings', icon: Terminal },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [servers, setServers] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [apiKeys] = useState([
    { id: 'key_1', name: 'Production Agent', key: 'sk_live_...9f2a', created: '2026-01-15' },
    { id: 'key_2', name: 'Testing Env', key: 'sk_test_...b41c', created: '2026-03-22' }
  ]);

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

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const InputField = ({ label, icon: Icon, defaultValue, type = "text", disabled = false }) => (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-mutedForeground block">{label}</label>
      <div className={`flex items-center border-2 ${disabled ? 'border-border bg-muted' : 'border-foreground bg-background'} transition-colors group-hover:border-foreground focus-within:border-foreground`}>
        <div className="p-3 border-r-2 border-inherit">
          <Icon size={16} className={disabled ? 'text-mutedForeground' : 'text-foreground'} />
        </div>
        <input 
          type={type} 
          defaultValue={defaultValue} 
          disabled={disabled}
          className="w-full bg-transparent p-3 text-sm font-mono font-bold outline-none uppercase tracking-wider disabled:text-mutedForeground placeholder:text-mutedForeground"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      </div>
    </div>
  );

  const Toggle = ({ label, defaultChecked }) => {
    const [checked, setChecked] = useState(defaultChecked);
    return (
      <div className="flex items-center justify-between p-4 border-2 border-foreground hover:bg-muted transition-colors cursor-pointer" onClick={() => setChecked(!checked)}>
        <span className="text-sm font-mono font-bold uppercase tracking-widest">{label}</span>
        <div className={`w-12 h-6 border-2 border-foreground flex items-center p-1 transition-colors ${checked ? 'bg-foreground' : 'bg-background'}`}>
          <motion.div 
            className={`w-3 h-3 bg-background ${!checked && 'bg-foreground'}`}
            animate={{ x: checked ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6" onSubmit={handleSave}>
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-foreground flex items-center justify-center border-4 border-background outline outline-4 outline-foreground shrink-0">
                <User size={48} className="text-background" strokeWidth={1} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold uppercase tracking-tighter">{user?.username || 'System Admin'}</h3>
                <p className="text-sm font-mono uppercase tracking-widest text-mutedForeground mt-1">Role: {user?.role || 'Administrator'}</p>
                <div className="flex gap-2 mt-4">
                  <button type="button" className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors">
                    Upload Avatar
                  </button>
                  <button type="button" className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 border-2 border-transparent text-mutedForeground hover:border-foreground hover:text-foreground transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <InputField label="Username" icon={User} defaultValue={user?.username || 'admin_user'} />
              <InputField label="Email Address" icon={Mail} defaultValue={user?.email || 'admin@nexusops.local'} type="email" />
              <InputField label="System Role" icon={Shield} defaultValue={user?.role || 'Admin'} disabled />
              <InputField label="Account ID" icon={Hash} defaultValue={user?.id || 'USR-90210'} disabled />
              
              <div className="space-y-2 xl:col-span-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-mutedForeground block">Timezone Preference</label>
                <div className="flex items-center border-2 border-foreground bg-background focus-within:border-foreground">
                  <div className="p-3 border-r-2 border-foreground">
                    <Globe size={16} className="text-foreground" />
                  </div>
                  <select className="w-full bg-transparent p-3 text-sm font-mono font-bold outline-none uppercase tracking-wider appearance-none cursor-pointer">
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>EST (Eastern Standard Time)</option>
                    <option>PST (Pacific Standard Time)</option>
                    <option>IST (Indian Standard Time)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t-4 border-foreground flex items-center justify-end gap-4">
              <AnimatePresence>
                {isSaved && (
                  <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm font-mono font-bold uppercase tracking-widest text-foreground">
                    <CheckCircle2 size={16} /> Saved Successfully
                  </motion.span>
                )}
              </AnimatePresence>
              <button type="submit" className="px-8 py-3 bg-foreground text-background font-mono font-bold uppercase tracking-widest border-2 border-foreground hover:bg-background hover:text-foreground transition-colors">
                Save Changes
              </button>
            </div>
          </motion.form>
        );
      case 'security':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <section>
              <h3 className="text-xl font-serif font-bold uppercase tracking-tighter mb-6 border-b-2 border-foreground pb-2">Change Password</h3>
              <form className="space-y-5 max-w-xl" onSubmit={handleSave}>
                <InputField label="Current Password" icon={Key} type="password" />
                <InputField label="New Password" icon={Lock} type="password" />
                <InputField label="Confirm New Password" icon={CheckCircle2} type="password" />
                <button type="submit" className="px-6 py-3 bg-foreground text-background font-mono text-sm font-bold uppercase tracking-widest hover:bg-background hover:text-foreground border-2 border-transparent hover:border-foreground transition-colors">
                  Update Password
                </button>
              </form>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6 border-b-2 border-foreground pb-2">
                <h3 className="text-xl font-serif font-bold uppercase tracking-tighter">Developer API Keys</h3>
                <button className="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 px-3 py-2 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors">
                  <Plus size={14} /> Generate New Key
                </button>
              </div>
              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border-2 border-foreground bg-muted hover:bg-background transition-colors">
                    <div className="mb-4 lg:mb-0">
                      <p className="text-sm font-bold font-mono uppercase tracking-widest">{key.name}</p>
                      <p className="text-[10px] text-mutedForeground font-mono uppercase tracking-widest mt-1">Created: {key.created}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="text-xs font-mono bg-background px-4 py-2 border-2 border-foreground">{key.key}</code>
                      <button className="p-2 hover:bg-foreground hover:text-background border-2 border-transparent hover:border-foreground transition-colors" title="Copy to clipboard">
                        <Copy size={16} />
                      </button>
                      <button className="p-2 hover:bg-foreground hover:text-background border-2 border-transparent hover:border-foreground transition-colors text-red-500" title="Revoke key">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <section className="space-y-4">
              <h3 className="text-xl font-serif font-bold uppercase tracking-tighter mb-6 border-b-2 border-foreground pb-2">Alert Channels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle label="Critical Alerts (Email)" defaultChecked={true} />
                <Toggle label="Warning Alerts (Email)" defaultChecked={false} />
                <Toggle label="Daily System Digest" defaultChecked={true} />
                <Toggle label="SMS Downtime Alerts" defaultChecked={false} />
              </div>
            </section>
            
            <section className="space-y-6">
              <h3 className="text-xl font-serif font-bold uppercase tracking-tighter mb-4 border-b-2 border-foreground pb-2">Webhooks Integration</h3>
              <InputField label="Slack Webhook URL" icon={Hash} defaultValue="https://hooks.slack.com/services/T00000000/B00000000/XXXX" />
              <div className="flex items-center gap-4">
                <button className="px-6 py-3 bg-foreground text-background font-mono text-xs font-bold uppercase tracking-widest hover:bg-background hover:text-foreground border-2 border-foreground transition-colors">
                  Save Webhook
                </button>
                <button className="px-6 py-3 bg-background text-foreground font-mono text-xs font-bold uppercase tracking-widest border-2 border-transparent hover:border-foreground transition-colors">
                  Test Connection
                </button>
              </div>
            </section>
          </motion.div>
        );
      case 'servers':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
              <div>
                <h3 className="text-xl font-serif font-bold uppercase tracking-tighter">Registered Servers</h3>
                <p className="text-[10px] uppercase tracking-widest text-mutedForeground font-bold mt-1">Manage your active monitoring nodes</p>
              </div>
              <span className="text-xs font-mono font-bold bg-foreground text-background px-4 py-2 uppercase tracking-widest">
                {servers.length} Active Nodes
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {servers.length === 0 ? (
                <div className="col-span-full text-center p-16 border-2 border-dashed border-foreground font-mono uppercase tracking-widest text-mutedForeground">
                  No servers currently connected to your account.
                </div>
              ) : (
                servers.map(server => (
                  <div key={server._id} className="p-6 border-2 border-foreground bg-background hover:bg-muted transition-colors relative group overflow-hidden">
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 transform group-hover:scale-125 transition-transform duration-500">
                      <Server size={120} />
                    </div>
                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <h4 className="text-xl font-bold font-mono uppercase tracking-widest truncate max-w-[200px]">{server.name}</h4>
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`w-3 h-3 border-2 border-foreground ${server.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-xs font-mono font-bold uppercase tracking-widest text-mutedForeground">{server.status}</span>
                        </div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-mutedForeground mt-6 border-t-2 border-foreground/10 pt-4">
                          Agent ID: {server.serverId}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(server._id)}
                        className="p-3 bg-background text-foreground border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
                        title="Deregister Server"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        );
      case 'advanced':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <section className="space-y-6">
              <h3 className="text-xl font-serif font-bold uppercase tracking-tighter mb-4 border-b-2 border-foreground pb-2">Data Retention Policy</h3>
              <div className="p-8 border-2 border-foreground bg-muted">
                <p className="text-sm font-mono font-bold uppercase tracking-widest mb-6">Historical Metric Logs</p>
                <div className="flex flex-wrap gap-4">
                  {['7 Days', '30 Days', '90 Days', 'Forever'].map((opt, i) => (
                    <button key={opt} className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest border-2 border-foreground transition-colors ${i === 1 ? 'bg-foreground text-background' : 'bg-background hover:bg-muted'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="text-xs uppercase tracking-widest text-mutedForeground mt-6 font-mono">Note: Longer retention periods will significantly increase database storage requirements and may incur extra costs.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-xl font-serif font-bold uppercase tracking-tighter mb-4 border-b-2 border-red-500 text-red-500 pb-2">Danger Zone</h3>
              <div className="p-8 border-2 border-red-500 bg-red-500/5">
                <h4 className="text-lg font-bold font-mono uppercase tracking-widest text-red-500 mb-2">Delete Account</h4>
                <p className="text-xs font-mono uppercase tracking-widest text-foreground mb-8">Permanently delete your account, all server associations, and historical telemetry data. This action is irreversible.</p>
                <button className="px-8 py-4 bg-red-500 text-white font-mono text-sm font-bold uppercase tracking-widest hover:bg-red-600 transition-colors border-2 border-red-600">
                  Delete Everything
                </button>
              </div>
            </section>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1400px] min-h-[calc(100vh-120px)] flex flex-col md:flex-row gap-10"
    >
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 shrink-0 flex flex-col gap-2">
        <div className="mb-8">
          <h2 className="text-4xl font-serif font-bold text-foreground uppercase tracking-tighter">Settings</h2>
          <p className="text-xs font-mono uppercase tracking-widest text-mutedForeground mt-2">Manage your platform profile</p>
        </div>
        
        <nav className="flex flex-col gap-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-between p-4 border-2 transition-all duration-200 group ${
                activeTab === tab.id 
                  ? 'border-foreground bg-foreground text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                  : 'border-transparent hover:border-foreground bg-background text-foreground'
              }`}
            >
              <div className="flex items-center gap-4">
                <tab.icon size={20} className={activeTab === tab.id ? 'text-background' : 'text-mutedForeground group-hover:text-foreground transition-colors'} />
                <span className="font-mono text-sm font-bold uppercase tracking-widest">{tab.label}</span>
              </div>
              <ChevronRight size={18} className={`transition-transform ${activeTab === tab.id ? 'translate-x-1' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-10">
          <button onClick={logout} className="w-full flex items-center justify-center gap-3 p-4 border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background transition-colors font-mono text-sm font-bold uppercase tracking-widest group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Sign Out securely
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-background border-4 border-foreground p-8 md:p-12 overflow-y-auto relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Decorative corner lines typical of brutalist design */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-foreground" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-foreground" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-foreground" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-foreground" />
        
        {/* Container for content to avoid overlapping with corner borders */}
        <div className="relative z-10 px-2 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
}
