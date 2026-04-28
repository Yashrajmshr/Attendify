import { useState, useEffect } from 'react';
import api from '../api/axios';
import { MapPin } from 'lucide-react';

const CreateSession = () => {
    const [formData, setFormData] = useState({
        subject: '',
        section: '',
        radius: '',
        sessionType: 'Class'
    });
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [mySubjects, setMySubjects] = useState([]);
    const [availableSections, setAvailableSections] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    // Fetch faculty's assigned subjects on component mount
    useEffect(() => {
        const fetchMySubjects = async () => {
            try {
                setLoadingSubjects(true);
                const { data } = await api.get('/subjects/my-subjects');
                const subjects = data.subjects || (data.subject ? [data.subject] : []);
                setMySubjects(subjects);
                setAvailableSections(data.sections || []);

                // Auto-select the first subject if available
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
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLoading(false);
                    setError('');
                },
                (err) => {
                    setError('Error getting location: ' + err.message);
                    setLoading(false);
                }
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

        if (!location) {
            setError('Please get your current location first.');
            return;
        }

        try {
            await api.post('/session', {
                ...formData,
                lat: location.lat,
                lng: location.lng,
                radius: Number(formData.radius)
            });
            setMessage('Session created successfully! Go to "Active Sessions" to view QR.');
            // Reset but keep the currently selected subject if multiple exist, otherwise reset to empty if no subjects
            const currentSubjectValue = formData.subject;
            setFormData({
                subject: currentSubjectValue,
                section: '',
                radius: '',
                sessionType: 'Class'
            });
            setLocation(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create session');
        }
    };

    if (loadingSubjects) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500 font-medium">Loading your assigned subjects...</p>
            </div>
        );
    }

    if (mySubjects.length === 0) {
        return (
            <div className="p-8">
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-8 text-center shadow-sm">
                    <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-3">No Subject Assigned</h3>
                    <p className="text-amber-700 dark:text-amber-500/80 max-w-md mx-auto">
                        You don't have any subjects assigned yet. Please contact the administrator to assign subjects to your account.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-8">Create Attendance Session</h2>

            {message && <div className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 mb-6 font-medium animate-fade-in">{message}</div>}
            {error && <div className="bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 p-4 rounded-2xl border border-rose-100 dark:border-rose-800/40 mb-6 font-medium animate-fade-in">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Choice of Subject</label>
                    <select
                        className="w-full px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white font-bold text-sm"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                    >
                        {mySubjects.map((s, idx) => {
                            const val = `${s.name} (${s.code})`;
                            return <option key={s.id || idx} value={val}>{val}</option>
                        })}
                    </select>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 ml-1 font-medium">Select one of your assigned subjects</p>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Target Section</label>
                    <select
                        className="w-full px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white font-bold text-sm"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        required
                    >
                        <option value="">-- Choose Section --</option>
                        {availableSections.map((section) => (
                            <option key={section} value={section}>
                                Section {section}
                            </option>
                        ))}
                    </select>
                    {availableSections.length === 0 && (
                        <p className="text-[10px] text-rose-500 mt-2 ml-1 font-bold italic">No sections assigned. Contact administrator.</p>
                    )}
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Session Type</label>
                    <select
                        className="w-full px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white font-bold text-sm"
                        value={formData.sessionType}
                        onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                        required
                    >
                        <option value="Class">Class (1 Attendance)</option>
                        <option value="Lab">Lab (2 Attendances)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Allowed Radius (meters)</label>
                    <input
                        type="number"
                        className="w-full px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white font-bold text-sm"
                        value={formData.radius}
                        onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                        required
                        placeholder="e.g. 50"
                        min="25"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 ml-1 font-medium italic">Minimum radius: 25 meters</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={getLocation}
                        disabled={loading}
                        className={`flex items-center px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${location ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                    >
                        <MapPin size={16} className="mr-2" />
                        {loading ? 'Locating...' : location ? 'Location Locked' : 'Fetch My Location'}
                    </button>
                    {location && (
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Coordinates Captured</span>
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full py-4 gradient-bg text-white font-bold rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary-500/25 flex items-center justify-center uppercase tracking-widest text-xs"
                >
                    Initialize Session
                </button>
            </form>
        </div>
    );
};

export default CreateSession;
