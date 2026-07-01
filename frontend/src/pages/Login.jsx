import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState('student');
    const [email, setEmail] = useState('test_student@gmail.com');
    const [password, setPassword] = useState('1234');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Redirection if already authenticated
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'faculty') {
                navigate('/faculty-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        }
    }, [user, navigate]);

    // Autofill demo accounts depending on active tab for developer convenience
    const handleRoleSwitch = (role) => {
        setSelectedRole(role);
        setError('');
        if (role === 'student') {
            setEmail('test_student@gmail.com');
            setPassword('1234');
        } else if (role === 'faculty') {
            setEmail('test_faculty@gmail.com');
            setPassword('1234');
        } else if (role === 'admin') {
            setEmail('admin@gmail.com');
            setPassword('1234');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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

    // Parallax background movement effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.005;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.005;
            const img = document.querySelector('.branding-image');
            if (img) {
                img.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
                img.style.transition = 'transform 0.2s ease-out';
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="bg-background text-on-background min-h-screen selection:bg-primary-design/30 flex font-sans">
            <main className="flex min-h-screen w-full overflow-hidden">
                {/* Left Side: Abstract Geometric Branding */}
                <section className="hidden lg:flex lg:w-1/2 relative bg-[#090b0c] items-center justify-center p-12 overflow-hidden border-r border-slate-800">
                    {/* Background Decorative Mesh & Organic Blurs */}
                    <div className="absolute inset-0 z-0">
                        {/* Glow spots */}
                        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl animate-pulse"></div>
                        
                        {/* Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                    </div>

                    {/* Branding Content */}
                    <div className="relative z-10 max-w-md w-full space-y-8">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-gradient-to-tr from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>dataset</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-white uppercase leading-none">Attendify</h1>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-1">Enterprise Platform</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                                Next-gen enterprise presence tracking.
                            </h2>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                A unified intelligence layer for institutional attendance, session auditing, and real-time engagement analytics. Built for scale. Engineered for precision.
                            </p>
                        </div>

                        {/* Live Shimmer Stats */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="premium-card p-5 bg-white/5 dark:bg-slate-900/10 border border-slate-800/40 rounded-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
                                <div className="flex items-center space-x-1.5 mb-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-450">System Core</p>
                                </div>
                                <p className="text-sm font-black text-white">Node Active</p>
                            </div>
                            <div className="premium-card p-5 bg-white/5 dark:bg-slate-900/10 border border-slate-800/40 rounded-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer"></div>
                                <div className="flex items-center space-x-1.5 mb-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-450">Encryption Feed</p>
                                </div>
                                <p className="text-sm font-black text-white">AES-256 TLS</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right Side: Authentication Card */}
                <section className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 bg-[#0a0d0e]">
                    <div className="w-full max-w-[400px] space-y-8">
                        {/* Mobile Branding (Hidden on Desktop) */}
                        <div className="lg:hidden flex flex-col items-center mb-6">
                            <div className="w-11 h-11 bg-gradient-to-tr from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3">
                                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>dataset</span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-white uppercase">Attendify</h1>
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-1">Enterprise Platform</p>
                        </div>

                        <div className="space-y-1.5">
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">Enterprise Portal</h2>
                            <p className="text-xs text-slate-400 font-semibold">Verify your identity to access the management suite.</p>
                        </div>

                        {/* Tabbed Portal Switcher */}
                        <div className="flex p-1 bg-slate-900/60 rounded-2xl border border-slate-800">
                            {['student', 'faculty', 'admin'].map((role) => (
                                <button 
                                    key={role}
                                    type="button"
                                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                        selectedRole === role
                                            ? 'bg-gradient-to-r from-primary-500/10 to-indigo-500/10 border border-primary-500/20 text-white font-extrabold shadow-sm'
                                            : 'border border-transparent text-slate-450 hover:text-slate-200'
                                    }`} 
                                    onClick={() => handleRoleSwitch(role)}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl flex items-center gap-3 animate-fade-in text-xs font-bold">
                                <span className="material-symbols-outlined text-[18px] text-rose-500">gpp_maybe</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                {/* Email Input */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-450 block ml-1" htmlFor="email">Institutional Email</label>
                                    <div className="relative flex items-center border border-slate-800 rounded-2xl bg-slate-900/20 transition-all focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
                                        <span className="material-symbols-outlined absolute left-4 text-slate-500 pointer-events-none text-[18px]">alternate_email</span>
                                        <input 
                                            className="w-full bg-transparent border-none text-sm text-slate-200 pl-12 pr-4 py-3.5 focus:ring-0 focus:outline-none placeholder:text-slate-600 font-medium" 
                                            id="email" 
                                            placeholder={
                                                selectedRole === 'student' 
                                                    ? 'student@university.edu' 
                                                    : selectedRole === 'faculty' 
                                                    ? 'faculty@university.edu' 
                                                    : 'admin@university.edu'
                                            } 
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                {/* Password Input */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-455" htmlFor="password">Password</label>
                                        <button className="text-[9px] font-black uppercase tracking-wider text-primary-500 hover:text-primary-400" type="button">Forgot Password</button>
                                    </div>
                                    <div className="relative flex items-center border border-slate-800 rounded-2xl bg-slate-900/20 transition-all focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
                                        <span className="material-symbols-outlined absolute left-4 text-slate-500 pointer-events-none text-[18px]">lock</span>
                                        <input 
                                            className="w-full bg-transparent border-none text-sm text-slate-200 pl-12 pr-12 py-3.5 focus:ring-0 focus:outline-none placeholder:text-slate-655 font-medium tracking-widest" 
                                            id="password" 
                                            placeholder="••••••••" 
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button 
                                            className="absolute right-4 text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center p-1" 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button 
                                className="w-full bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider py-4 rounded-2xl shadow-lg shadow-primary-500/10 hover:shadow-xl hover:shadow-primary-500/20 active:scale-[0.98] transition-all cursor-pointer"
                                type="submit"
                            >
                                Authenticate Account
                            </button>
                        </form>

                        {/* Security Badges */}
                        <div className="pt-6 border-t border-slate-800 space-y-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="material-symbols-outlined text-[16px] text-emerald-500">verified_user</span>
                                <p className="text-[10px] font-bold uppercase tracking-wider">Active session protection enabled.</p>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/40 border border-slate-800 rounded-xl">
                                    <span className="material-symbols-outlined text-[12px] text-primary-500" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">SSO COMPLIANT</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/40 border border-slate-800 rounded-xl">
                                    <span className="material-symbols-outlined text-[12px] text-primary-500" style={{ fontVariationSettings: "'FILL' 1" }}>gpp_good</span>
                                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">SOC2 TYPE II</span>
                                </div>
                            </div>
                        </div>
                        
                        <footer className="text-center pt-2">
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                © 2024 Attendify Enterprise. All rights reserved.
                            </p>
                        </footer>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Login;
