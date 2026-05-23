import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Activity, Shield, Zap, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [mode, setMode]         = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await api.post('/api/auth/register', { username, email, password });
      }
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">

      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-16 overflow-hidden border-r-4 border-foreground bg-lines">

        <div className="relative z-10 flex items-center gap-4 border-b-4 border-foreground pb-4 w-fit">
          <div className="w-12 h-12 bg-foreground flex items-center justify-center">
            <Activity size={24} strokeWidth={2} className="text-background" />
          </div>
          <span className="text-4xl font-serif font-bold text-foreground uppercase tracking-tighter">NexusOps</span>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 rounded-none border-4 border-foreground border-dashed animate-[spin_30s_linear_infinite]" />
            <div className="absolute inset-10 rounded-none border-2 border-foreground animate-[spin_20s_linear_infinite_reverse]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-foreground flex items-center justify-center border-4 border-background outline outline-4 outline-foreground">
                <Activity size={48} strokeWidth={1} className="text-background" />
              </div>
            </div>

            <div className="absolute -top-6 -left-12 bg-background border-2 border-foreground px-4 py-2 flex items-center gap-3">
              <span className="font-serif text-xl font-bold text-foreground">34.2%</span>
              <span className="text-xs font-mono uppercase tracking-widest text-mutedForeground">CPU</span>
            </div>
            <div className="absolute -bottom-6 -right-12 bg-background border-2 border-foreground px-4 py-2 flex items-center gap-3">
              <span className="font-serif text-xl font-bold text-foreground">99.9%</span>
              <span className="text-xs font-mono uppercase tracking-widest text-mutedForeground">UPTIME</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t-4 border-foreground pt-8">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-6 uppercase tracking-tighter leading-none">
            AI-POWERED<br />INFRASTRUCTURE
          </h2>
          <div className="flex items-center gap-8">
            {[
              { icon: Shield,   text: 'DETECTION' },
              { icon: Zap,      text: 'PREDICTION' },
              { icon: Activity, text: 'LIVE METRICS' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                <Icon size={16} strokeWidth={2} className="text-foreground" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0 }}
        className="flex-1 flex items-center justify-center p-8 bg-background"
      >
        <div className="w-full max-w-md bg-background border-4 border-foreground p-8 relative">

          <div className="flex lg:hidden items-center gap-4 mb-12 border-b-4 border-foreground pb-4 justify-center">
            <div className="w-12 h-12 bg-foreground flex items-center justify-center">
              <Activity size={24} strokeWidth={2} className="text-background" />
            </div>
            <span className="text-3xl font-serif font-bold text-foreground uppercase tracking-tighter">NexusOps</span>
          </div>

          <div className="flex gap-2 p-2 bg-background border-2 border-foreground mb-10">
            {[
              { key: 'login',    label: 'Sign In' },
              { key: 'register', label: 'Register' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setMode(key); setError(''); }}
                className={`flex-1 py-2 font-bold uppercase tracking-widest text-xs transition-none border-2 ${
                  mode === key
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-transparent hover:border-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 className="text-4xl font-serif font-bold text-foreground mb-2 uppercase tracking-tighter">
            {mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
          </h2>
          <p className="text-sm font-mono uppercase tracking-widest text-mutedForeground mb-10">
            {mode === 'login'
              ? 'ACCESS YOUR DASHBOARD'
              : 'INITIALIZE DEVOPS PROFILE'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-widest text-foreground mb-2">USERNAME</label>
                <div className="relative">
                  <User size={16} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-mutedForeground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="SYSTEM_ADMIN"
                    required
                    className="w-full bg-background border-2 border-border text-foreground px-4 py-3 pl-12 font-mono text-sm uppercase tracking-widest focus:outline-none focus:border-foreground transition-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-widest text-foreground mb-2">EMAIL</label>
              <div className="relative">
                <Mail size={16} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-mutedForeground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ADMIN@NEXUSOPS.IO"
                  required
                  className="w-full bg-background border-2 border-border text-foreground px-4 py-3 pl-12 font-mono text-sm uppercase tracking-widest focus:outline-none focus:border-foreground transition-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-widest text-foreground mb-2">PASSWORD</label>
              <div className="relative">
                <Lock size={16} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-mutedForeground" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-background border-2 border-border text-foreground px-4 py-3 pl-12 pr-12 font-mono text-sm uppercase tracking-widest focus:outline-none focus:border-foreground transition-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-mutedForeground hover:text-foreground transition-none"
                >
                  {showPw ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-foreground text-background p-4 border-2 border-foreground">
                <p className="text-xs font-bold font-mono uppercase tracking-widest">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background font-bold uppercase tracking-widest py-4 mt-4 border-4 border-foreground hover:bg-background hover:text-foreground disabled:opacity-50 disabled:hover:bg-foreground disabled:hover:text-background transition-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-background border-t-transparent animate-spin" />
                  {mode === 'login' ? 'AUTHENTICATING...' : 'CREATING...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'SIGN IN' : 'REGISTER'}
                  <ArrowRight size={18} strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}