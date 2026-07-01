import { useState, useEffect } from 'react';
import api from '../api/axios';
import { MapPin, Settings, ShieldCheck } from 'lucide-react';

const CreateSession = () => {
    const [formData, setFormData] = useState({
        subject: '',
        section: '',
        radius: '15',
        sessionType: 'Class',
        method: 'hybrid', // 'hybrid' | 'qr' | 'gps_qr' | 'face' | 'manual'
        duration: '15' // minutes
    });
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [mySubjects, setMySubjects] = useState([]);
    const [availableSections, setAvailableSections] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    useEffect(() => {
        const fetchMySubjects = async () => {
            try {
                setLoadingSubjects(true);
                const { data } = await api.get('/subjects/my-subjects');
                const subjects = data.subjects || (data.subject ? [data.subject] : []);
                setMySubjects(subjects);
                setAvailableSections(data.sections || []);

                if (subjects.length > 0) {
                    const firstSubject = subjects[0];
                    setFormData(prev => ({
                        ...prev,
                        subject: `${firstSubject.name} (${firstSubject.code})`
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch assigned subjects:', err);
                setError('Failed to load your assigned subjects. Please contact admin.');
            } finally {
                setLoadingSubjects(false);
            }
        };

        fetchMySubjects();
    }, []);

    const getLocation = () => {
        setLoading(true);
        setError('');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLoading(false);
                },
                (err) => {
                    setError('Error getting location: ' + err.message + '. Please ensure location access is enabled.');
                    setLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setError('Geolocation is not supported by this browser.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const needsGPS = ['hybrid', 'gps_qr'].includes(formData.method);
        if (needsGPS && !location) {
            setError('Please get your current GPS location first for this verification method.');
            return;
        }

        try {
            await api.post('/session', {
                ...formData,
                lat: location ? location.lat : 0,
                lng: location ? location.lng : 0,
                radius: Number(formData.radius),
                duration: Number(formData.duration)
            });
            setMessage('Attendance Session initiated successfully! Navigate to "Analytics Room" -> "Lectures Roster" to view dynamic QR and monitor check-ins.');
            
            const currentSubjectValue = formData.subject;
            setFormData({
                subject: currentSubjectValue,
                section: '',
                radius: '15',
                sessionType: 'Class',
                method: 'hybrid',
                duration: '15'
            });
            setLocation(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initialize session.');
        }
    };

    if (loadingSubjects) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">Syncing Assigned Subjects...</p>
            </div>
        );
    }

    if (mySubjects.length === 0) {
        return (
            <div className="p-8">
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-8 text-center shadow-sm">
                    <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-3">No Subjects Assigned</h3>
                    <p className="text-amber-700 dark:text-amber-500/80 max-w-md mx-auto text-xs font-semibold">
                        You do not have any teaching subjects allocated to your account. Please contact the Academic Department administrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-3xl">
            <div>
                <h2 className="text-xl font-black text-slate-850 dark:text-white tracking-tight flex items-center">
                    <Settings className="mr-2 text-primary-500" size={22} />
                    Attendance Session Architect
                </h2>
                <p className="text-xs text-slate-400 mt-1">Configure parameters and launch real-time student verification portals</p>
            </div>

            {message && (
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-455 p-4.5 rounded-2xl border border-emerald-500/20 text-xs font-bold flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>{message}</span>
                </div>
            )}
            {error && (
                <div className="bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-455 p-4.5 rounded-2xl border border-rose-500/20 text-xs font-bold flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="premium-card p-6 md:p-8 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest ml-1">Allocation / Subject</label>
                        <select
                            className="glass-select text-xs font-bold"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        >
                            {mySubjects.map((s, idx) => {
                                const val = `${s.name} (${s.code})`;
                                return <option key={s.id || idx} value={val} className="dark:bg-slate-900">{val}</option>
                            })}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest ml-1">Target Section</label>
                        <select
                            className="glass-select text-xs font-bold"
                            value={formData.section}
                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            required
                        >
                            <option value="" className="dark:bg-slate-900">— Select Section —</option>
                            {availableSections.map((section) => (
                                <option key={section} value={section} className="dark:bg-slate-900">
                                    Section {section}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest ml-1">Workload Session Type</label>
                        <select
                            className="glass-select text-xs font-bold"
                            value={formData.sessionType}
                            onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                            required
                        >
                            <option value="Class" className="dark:bg-slate-900">Standard Lecture (1x Credit)</option>
                            <option value="Lab" className="dark:bg-slate-900">Lab Practical (2x Credit Weight)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest ml-1">Portal Expiry Duration (Minutes)</label>
                        <input
                            type="number"
                            className="glass-input text-xs font-bold"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            required
                            placeholder="e.g. 15"
                            min="5"
                            max="120"
                        />
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 ml-1">Auto-expires session after timer runs out</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-1">
                        <label className="block text-[10px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest ml-1">Geofencing radius limit (Meters)</label>
                        <input
                            type="number"
                            className="glass-input text-xs font-bold"
                            value={formData.radius}
                            onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                            required
                            placeholder="e.g. 15"
                            min="5"
                            max="500"
                        />
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 ml-1">
                            Allowed check-in radius (meters)
                        </p>
                    </div>
                    <div className="space-y-2 col-span-1 flex flex-col justify-end">
                        <div className="bg-indigo-500/5 border border-indigo-500/15 p-4.5 rounded-2xl text-[10px] font-bold text-indigo-650 dark:text-indigo-400">
                            Verification: Hybrid (GPS Lock + Dynamic QR Rotation) active by default.
                        </div>
                    </div>
                </div>

                {/* Geolocation visual card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-100/40 dark:bg-slate-950/20 p-6 rounded-2xl border border-slate-200/40 dark:border-white/5 relative overflow-hidden group transition-all">
                    <div className="flex items-center space-x-4 relative z-10">
                        <button
                            type="button"
                            onClick={getLocation}
                            disabled={loading}
                            className={`flex items-center px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border ${
                                location 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/30 scale-[1.02]' 
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-250 dark:border-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            <MapPin size={14} className={`mr-1.5 ${location ? 'animate-bounce text-emerald-500' : ''}`} />
                            {loading ? 'Acquiring GPS...' : location ? 'Location Verified' : 'Lock GPS Coordinates'}
                        </button>

                        {location ? (
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">GPS Coordinates Locked</span>
                                <span className="font-mono text-[10px] font-bold text-slate-500 mt-1">{location.lat.toFixed(6)}°, {location.lng.toFixed(6)}°</span>
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-405 font-bold uppercase">GPS location lock required for geofence verification</p>
                        )}
                    </div>
                    
                    {location && (
                        <div className="absolute right-6 top-6 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-60"></div>
                    )}
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="premium-button gradient-bg w-full py-4 text-xs font-black tracking-widest flex items-center justify-center space-x-2 shadow-active-primary"
                    >
                        <ShieldCheck size={16} />
                        <span>Launch Attendance Portal</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateSession;
