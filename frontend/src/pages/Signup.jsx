import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
        section: '',
        rollNumber: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await register(formData);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] -ml-64 -mt-64 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -mr-64 -mb-64 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

            <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-premium-card w-full max-w-lg border border-white/40 dark:border-white/5 relative z-10 animate-fade-in my-12">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-display font-black tracking-tight text-slate-900 dark:text-white mb-2">
                        Create Account
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                        Join your institution's digital campus
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl mb-8 flex items-center text-sm font-semibold animate-fade-in">
                        <span className="font-bold mr-2">Error:</span> {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="mb-6">
                            <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest ml-1 mb-3">Identity Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'student' })}
                                    className={`py-3 px-4 rounded-2xl border text-sm font-bold tracking-tight transition-all duration-300 ${formData.role === 'student' ? 'bg-primary-500 border-primary-500 text-white shadow-active-primary' : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50'}`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'faculty' })}
                                    className={`py-3 px-4 rounded-2xl border text-sm font-bold tracking-tight transition-all duration-300 ${formData.role === 'faculty' ? 'bg-primary-500 border-primary-500 text-white shadow-active-primary' : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50'}`}
                                >
                                    Faculty
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                                    placeholder="yourname@domain.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">Secure Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                                    placeholder="••••••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">Department</label>
                                <input
                                    name="department"
                                    type="text"
                                    required
                                    className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                                    placeholder="e.g. CSE, ECE"
                                    value={formData.department}
                                    onChange={handleChange}
                                />
                            </div>
                            {formData.role === 'student' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">Roll Number</label>
                                        <input
                                            name="rollNumber"
                                            type="text"
                                            required
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                                            placeholder="Roll No"
                                            value={formData.rollNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest ml-1">Section</label>
                                        <input
                                            name="section"
                                            type="text"
                                            required
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
                                            placeholder="Section"
                                            value={formData.section}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            className="w-full h-14 gradient-bg text-white font-black rounded-2xl shadow-active-primary hover:shadow-glow-primary hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 text-lg tracking-tight"
                        >
                            <span>Create Account</span>
                        </button>
                    </div>
                </form>
                <div className="mt-8 text-center">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Already have an account? <Link to="/login" className="text-primary-500 font-black hover:underline ml-1">Login Here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
