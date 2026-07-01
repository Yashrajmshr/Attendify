import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Sliders, Bell, RefreshCw, CheckCircle, Award } from 'lucide-react';
import api from '../api/axios';

const StudentProfileSettings = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(user || {});
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [pushAlerts, setPushAlerts] = useState(true);
    const [soundAlerts, setSoundAlerts] = useState(true);
    const [geoPermission, setGeoPermission] = useState(true);
    const [cameraPermission, setCameraPermission] = useState(true);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [academicStats, setAcademicStats] = useState({
        averageAttendance: '0.0',
        totalLeaves: 0,
        approvedLeaves: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch fresh profile details from database
                const profileRes = await api.get('/auth/profile');
                if (profileRes.data) {
                    setProfile(profileRes.data);
                }

                // Fetch attendance rates to calculate actual overall average
                const histRes = await api.get('/attendance/my');
                const history = histRes.data || [];
                const present = history.filter(r => r.status === 'P' || r.status === 'Present').length;
                const total = history.length;
                const averageAttendance = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

                // Fetch leaves count
                const leavesRes = await api.get('/leaves/my-leaves');
                const leaves = leavesRes.data || [];
                const totalLeaves = leaves.length;
                const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;

                setAcademicStats({
                    averageAttendance,
                    totalLeaves,
                    approvedLeaves
                });
            } catch (err) {
                console.error('Failed to load academic stats for profile', err);
            }
        };
        fetchStats();
    }, []);

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
            console.error('Failed to save student configurations', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-xl font-black text-slate-850 dark:text-white tracking-tight flex items-center">
                    <Sliders className="mr-2 text-primary-500" size={22} />
                    Profile & Settings
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                    Review your academic credentials, biometric permissions, and notification configurations.
                </p>
            </div>

            {success && (
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-450 p-4.5 rounded-2xl border border-emerald-500/20 text-xs font-bold flex items-center space-x-2">
                    <CheckCircle size={16} />
                    <span>Profile preferences and permissions saved successfully!</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Profile Card & Workload */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="premium-card p-6 relative overflow-hidden bg-white dark:bg-[#101415]/30">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl"></div>
                        <div className="flex flex-col items-center text-center space-y-4 pt-4">
                            <div className="w-20 h-20 rounded-[2rem] gradient-bg flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                {profile?.name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{profile?.name}</h3>
                                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">
                                    Student Terminal
                                </p>
                            </div>

                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800/60 my-2"></div>

                            <div className="w-full text-left space-y-3.5 text-xs">
                                <p className="flex justify-between">
                                    <span className="text-slate-400 font-semibold">Roll Number:</span>
                                    <span className="font-mono font-black text-slate-700 dark:text-slate-300">{profile?.rollNumber || 'Not Assigned'}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-400 font-semibold">Program / Degree:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.program || 'Not Assigned'}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-400 font-semibold">Current Semester:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.semester ? `Semester ${profile.semester}` : 'Not Assigned'}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-400 font-semibold">Academic Year:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.year ? `Year ${profile.year}` : 'Not Assigned'}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-400 font-semibold">Section Allocation:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.section ? `Section ${profile.section}` : 'Not Assigned'}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-400 font-semibold">Department:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{profile?.department || 'Not Assigned'}</span>
                                </p>
                                <p className="flex justify-between border-t border-slate-100 dark:border-white/5 pt-2">
                                    <span className="text-slate-400 font-semibold">Verified Email:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[170px]" title={profile?.email}>{profile?.email || 'Not Assigned'}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-6 space-y-5 bg-white dark:bg-[#101415]/30">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center">
                            <Award size={14} className="mr-1.5 text-primary-500" /> Academic Standing
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                    <span>Average Attendance Rate</span>
                                    <span>{academicStats.averageAttendance}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            parseFloat(academicStats.averageAttendance) >= 75 
                                                ? 'bg-emerald-500' 
                                                : parseFloat(academicStats.averageAttendance) >= 60 
                                                ? 'bg-amber-500' 
                                                : 'bg-rose-500'
                                        }`} 
                                        style={{ width: `${academicStats.averageAttendance}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                                <div className="bg-slate-50 dark:bg-slate-900/20 p-3 rounded-2xl border border-slate-200/30 dark:border-white/5 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Leaves Submitted</p>
                                    <h4 className="text-lg font-black text-slate-800 dark:text-white mt-1">{academicStats.totalLeaves}</h4>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/20 p-3 rounded-2xl border border-slate-200/30 dark:border-white/5 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Leaves Approved</p>
                                    <h4 className="text-lg font-black text-emerald-500 dark:text-emerald-400 mt-1">{academicStats.approvedLeaves}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Configuration Column */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSaveSettings} className="premium-card p-6 space-y-6 bg-white dark:bg-[#101415]/30">
                        <div>
                            <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center uppercase tracking-wider">
                                <Shield size={16} className="mr-2 text-primary-500" />
                                Hardware & Biometric Permissions
                            </h3>
                            <p className="text-[10px] text-slate-450 mt-1">
                                Configure localized scanner capabilities to optimize geofenced class checks.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4.5 bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/30 dark:border-white/5 rounded-2xl">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">Precision GPS Verification</p>
                                    <p className="text-[10px] text-slate-450">Authorize Attendify to query device hardware location coordinates during camera check-ins.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setGeoPermission(!geoPermission)}
                                    className={`w-11 h-6.5 flex items-center rounded-full p-1 transition-all ${geoPermission ? 'bg-primary-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                                >
                                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md"></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4.5 bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/30 dark:border-white/5 rounded-2xl">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">Camera Check-in Access</p>
                                    <p className="text-[10px] text-slate-450">Grant authorization to load the device video capture feed for visual QR code scanning.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setCameraPermission(!cameraPermission)}
                                    className={`w-11 h-6.5 flex items-center rounded-full p-1 transition-all ${cameraPermission ? 'bg-primary-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                                >
                                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md"></div>
                                </button>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-100 dark:bg-slate-800/60"></div>

                        <div>
                            <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center uppercase tracking-wider">
                                <Bell size={16} className="mr-2 text-primary-500" />
                                Portal Notification Feed
                            </h3>
                            <p className="text-[10px] text-slate-450 mt-1">
                                Customize warning thresholds and communication pathways.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4.5 bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/30 dark:border-white/5 rounded-2xl">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">Low Attendance Email Warning</p>
                                    <p className="text-[10px] text-slate-450">Receive automated email alerts if any subject average falls below the 75% compliance mark.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setEmailAlerts(!emailAlerts)}
                                    className={`w-11 h-6.5 flex items-center rounded-full p-1 transition-all ${emailAlerts ? 'bg-primary-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                                >
                                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md"></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4.5 bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/30 dark:border-white/5 rounded-2xl">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">Leave Status Push Alerts</p>
                                    <p className="text-[10px] text-slate-450">Deliver immediate portal notifications whenever leaves are approved or rejected by the department.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setPushAlerts(!pushAlerts)}
                                    className={`w-11 h-6.5 flex items-center rounded-full p-1 transition-all ${pushAlerts ? 'bg-primary-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                                >
                                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md"></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4.5 bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/30 dark:border-white/5 rounded-2xl">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">Chime Confirmation Feedback</p>
                                    <p className="text-[10px] text-slate-450">Play an audio notification chime on your device upon successful attendance check-in scan.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setSoundAlerts(!soundAlerts)}
                                    className={`w-11 h-6.5 flex items-center rounded-full p-1 transition-all ${soundAlerts ? 'bg-primary-500 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'}`}
                                >
                                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow-md"></div>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                <span>Save Configurations</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentProfileSettings;
