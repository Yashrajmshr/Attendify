import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Sliders, Bell, RefreshCw, CheckCircle } from 'lucide-react';

const FacultyProfileSettings = () => {
    const { user } = useAuth();
    const [geofence, setGeofence] = useState(15); // Default 15 meters
    const [duration, setDuration] = useState(15); // Default 15 minutes
    const [prefMethod, setPrefMethod] = useState('hybrid'); // 'hybrid' | 'qr' | 'gps_qr' | 'face' | 'manual'
    const [notifyShortage, setNotifyShortage] = useState(true);
    const [notifyLeaves, setNotifyLeaves] = useState(true);
    const [notifySecurity, setNotifySecurity] = useState(true);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        try {
            // Simulate saving configs to database
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save settings', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-xl font-black text-slate-850 dark:text-white tracking-tight flex items-center">
                    <Sliders className="mr-2 text-primary-500" size={22} />
                    Profile & Parameters
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                    Manage your workload credentials, geofencing limits, and verification preferences
                </p>
            </div>

            {success && (
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-450 p-4.5 rounded-2xl border border-emerald-500/20 text-xs font-bold flex items-center space-x-2">
                    <CheckCircle size={16} />
                    <span>Parameter configurations saved successfully!</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Profile Card & Workload */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="premium-card p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl"></div>
                        <div className="flex flex-col items-center text-center space-y-4 pt-4">
                            <div className="w-20 h-20 rounded-[2rem] gradient-bg flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                {user?.name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{user?.name}</h3>
                                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">
                                    {user?.role || 'Senior Professor'}
                                </p>
                            </div>

                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800/60 my-2"></div>

                            <div className="w-full text-left space-y-3.5 text-xs">
                                <p className="flex justify-between">
                                    <span className="text-slate-400">Employee ID:</span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">EMP-206584</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-400">Department:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{user?.department || 'Computer Science'}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-400">Designation:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Associate Professor</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-400">Verified Email:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">prof.{user?.name?.toLowerCase()?.replace(/\s+/g, '') || 'faculty'}@university.edu</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-6 space-y-5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center">
                            <User size={14} className="mr-1.5" /> Teaching Workload
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                    <span>Weekly Class Load</span>
                                    <span>14 / 18 Hours</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-200/40 dark:border-white/5">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '77%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                    <span>Subject Allocation</span>
                                    <span>3 Assigned</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-200/40 dark:border-white/5">
                                    <div className="h-full bg-pink-500 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configurations */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSaveSettings} className="premium-card p-6 md:p-8 space-y-6">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center tracking-tight border-b border-slate-100 dark:border-slate-800/50 pb-4">
                            <Sliders size={16} className="mr-2 text-primary-500" />
                            Default Session Parameters
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Default Geofence Radius (Meters)
                                </label>
                                <div className="flex items-center space-x-4">
                                    <input 
                                        type="range" 
                                        min="5" 
                                        max="100" 
                                        value={geofence}
                                        onChange={(e) => setGeofence(parseInt(e.target.value))}
                                        className="w-full accent-primary-500 cursor-pointer"
                                    />
                                    <span className="w-12 text-center font-mono font-bold text-xs text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200/40 dark:border-white/5">
                                        {geofence}m
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Default Portal Duration (Minutes)
                                </label>
                                <div className="flex items-center space-x-4">
                                    <input 
                                        type="range" 
                                        min="5" 
                                        max="120" 
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        className="w-full accent-indigo-500 cursor-pointer"
                                    />
                                    <span className="w-12 text-center font-mono font-bold text-xs text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200/40 dark:border-white/5">
                                        {duration}m
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                                    Attendance Verification Mode
                                </label>
                                <div className="bg-indigo-500/5 border border-indigo-500/15 p-3.5 rounded-2xl text-[10px] font-bold text-indigo-650 dark:text-indigo-400">
                                    🔒 Hardcoded: Hybrid (GPS Lock + Dynamic QR Rotation)
                                </div>
                            </div>
                        </div>

                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center tracking-tight border-b border-slate-100 dark:border-slate-800/50 pb-4 pt-4">
                            <Bell size={16} className="mr-2 text-indigo-500" />
                            Notifications & System Alerts
                        </h3>

                        <div className="space-y-4">
                            {[
                                { id: 'shortage', label: 'Notify when student attendance falls below 75%', state: notifyShortage, setter: setNotifyShortage },
                                { id: 'leaves', label: 'E-mail notifications on new leave applications', state: notifyLeaves, setter: setNotifyLeaves },
                                { id: 'security', label: 'Trigger instant alerts on device mismatch/GPS fraud detection', state: notifySecurity, setter: setNotifySecurity }
                            ].map(item => (
                                <label key={item.id} className="flex items-start space-x-3 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={item.state}
                                        onChange={() => item.setter(!item.state)}
                                        className="w-4.5 h-4.5 rounded text-primary-500 border-slate-300 dark:border-slate-800 focus:ring-primary-500 mt-0.5"
                                    />
                                    <div className="text-xs font-bold text-slate-650 dark:text-slate-350">
                                        {item.label}
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="premium-button gradient-bg px-8 text-[11px] font-black tracking-widest flex items-center space-x-2 shadow-active-primary"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw size={12} className="animate-spin" />
                                        <span>Saving Params...</span>
                                    </>
                                ) : (
                                    <span>Save Settings</span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="premium-card p-6 md:p-8 space-y-4">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center tracking-tight border-b border-slate-100 dark:border-slate-800/50 pb-4">
                            <Shield size={16} className="mr-2 text-rose-500" />
                            Console Security & Identity
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            Authorized access verified on server. To revoke session keys or reset device bindings, contact institutional IT administrators.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FacultyProfileSettings;
