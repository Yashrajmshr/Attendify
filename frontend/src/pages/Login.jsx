import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldAlert, ArrowRight } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (result.success) {
            if (result.user.role === 'admin') {
                navigate('/admin');
            } else if (result.user.role === 'faculty') {
                navigate('/faculty-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -ml-64 -mb-64 animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-premium-card w-full max-w-md border border-white/40 dark:border-white/5 relative z-10 animate-fade-in">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 gradient-bg rounded-3xl flex items-center justify-center text-white shadow-active-primary mb-6 group hover:scale-110 transition-transform duration-500">
                        <Lock size={32} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-4xl font-display font-black tracking-tight text-slate-900 dark:text-white mb-2">Welcome Back</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide italic">Secure Portal Access</p>
                </div>

                {error && (
                    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl mb-8 flex items-center text-sm font-semibold animate-fade-in">
                        <ShieldAlert size={18} className="mr-2 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="username@domain.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">Secure Password</label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none pr-14 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••••••"
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 focus:outline-none transition-colors p-1"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={22} />
                                ) : (
                                    <Eye size={22} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full h-14 gradient-bg text-white font-black rounded-2xl shadow-active-primary hover:shadow-glow-primary hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 text-lg tracking-tight"
                        >
                            <span>Authenticate Account</span>
                            <ArrowRight size={20} strokeWidth={3} />
                        </button>
                    </div>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Institutional Access Only</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
