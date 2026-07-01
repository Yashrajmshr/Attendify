import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    Calendar, CheckCircle, AlertTriangle, BookOpen, 
    ChevronDown, ChevronUp, MapPin, RefreshCw, XCircle 
} from 'lucide-react';

const StudentHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubjects, setExpandedSubjects] = useState({});

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/attendance/my');
            setHistory(data || []);
        } catch (error) {
            console.error('Failed to fetch attendance history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const toggleExpand = (key) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Group history records by subject
    const subjectGroups = {};
    history.forEach(record => {
        const subjectName = record.sessionId?.subject || 'Unknown Subject';
        const subjectCode = record.sessionId?.code || 'N/A';
        const section = record.sessionId?.section || 'N/A';
        const key = `${subjectName}_${subjectCode}`;
        
        if (!subjectGroups[key]) {
            subjectGroups[key] = {
                key,
                subjectName,
                subjectCode,
                section,
                records: [],
                present: 0,
                total: 0
            };
        }
        
        subjectGroups[key].records.push(record);
        subjectGroups[key].total += 1;
        if (record.status === 'P' || record.status === 'Present') {
            subjectGroups[key].present += 1;
        }
    });

    const subjectArray = Object.values(subjectGroups);

    const getRate = (present, total) => {
        return total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
    };

    const getStatusTheme = (rate) => {
        const numRate = parseFloat(rate);
        if (numRate >= 75) return {
            bg: 'bg-emerald-500',
            text: 'text-emerald-600 dark:text-emerald-450',
            border: 'border-emerald-500/20 dark:border-emerald-500/10',
            lightBg: 'bg-emerald-500/5',
            badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
            label: 'Safe (75%+)'
        };
        if (numRate >= 60) return {
            bg: 'bg-amber-500',
            text: 'text-amber-600 dark:text-amber-450',
            border: 'border-amber-500/20 dark:border-amber-500/10',
            lightBg: 'bg-amber-500/5',
            badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
            label: 'Warning (<75%)'
        };
        return {
            bg: 'bg-rose-500',
            text: 'text-rose-600 dark:text-rose-455',
            border: 'border-rose-500/20 dark:border-rose-500/10',
            lightBg: 'bg-rose-500/5',
            badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-450',
            label: 'Defaulter (<60%)'
        };
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center">
                        <BookOpen className="mr-2 text-primary-500" size={22} />
                        Attendance Registry
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        View subject-wise attendance logs, dynamic compliance meters, and GPS audit metrics.
                    </p>
                </div>
                <button
                    onClick={fetchHistory}
                    disabled={loading}
                    className="p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center"
                    title="Reload registry"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="premium-card p-16 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <RefreshCw className="animate-spin inline-block mr-2" size={14} />
                    Syncing subject registries...
                </div>
            ) : subjectArray.length === 0 ? (
                <div className="premium-card p-16 text-center text-slate-450 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                    No attendance records found
                </div>
            ) : (
                <div className="space-y-6">
                    {subjectArray.map(sub => {
                        const rate = getRate(sub.present, sub.total);
                        const theme = getStatusTheme(rate);
                        const isExpanded = !!expandedSubjects[sub.key];

                        return (
                            <div 
                                key={sub.key} 
                                className={`premium-card overflow-hidden border transition-all duration-300 ${theme.border} bg-white dark:bg-[#101415]/30`}
                            >
                                {/* Subject Header Row */}
                                <div 
                                    onClick={() => toggleExpand(sub.key)}
                                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors select-none"
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/10 flex-shrink-0">
                                            <BookOpen size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-bold text-sm text-slate-850 dark:text-white leading-snug">{sub.subjectName}</h4>
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500 dark:text-slate-450 uppercase">{sub.subjectCode}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Section {sub.section}</p>
                                        </div>
                                    </div>

                                    {/* Stats and Expand Actions */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-white/5">
                                        <div className="text-right">
                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${theme.badge}`}>
                                                {theme.label}
                                            </span>
                                            <div className="flex items-baseline justify-end gap-1.5 mt-1.5">
                                                <span className={`text-xl font-black ${theme.text}`}>{rate}%</span>
                                                <span className="text-[10px] text-slate-400 font-bold">({sub.present}/{sub.total} Logs)</span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-1.5 text-slate-400 dark:text-slate-500 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/20 dark:border-white/5">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Subject Dynamic Progress Bar */}
                                <div className="h-1 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                                    <div className={`h-full ${theme.bg}`} style={{ width: `${rate}%` }}></div>
                                </div>

                                {/* Collapsible History Table */}
                                {isExpanded && (
                                    <div className="border-t border-slate-200/50 dark:border-white/5 bg-slate-50/20 dark:bg-slate-950/5 overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200/50 dark:divide-white/5 text-left">
                                            <thead>
                                                <tr className="bg-slate-100/40 dark:bg-slate-900/10 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                    <th className="px-6 py-3.5">Check-in Timestamp</th>
                                                    <th className="px-6 py-3.5">Attendance Status</th>
                                                    <th className="px-6 py-3.5 text-right">GPS Verified Distance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200/40 dark:divide-white/5 text-xs text-slate-600 dark:text-slate-350">
                                                {sub.records.map((rec) => {
                                                    const isPresent = rec.status === 'P' || rec.status === 'Present';
                                                    const date = rec.createdAt ? new Date(rec.createdAt) : null;
                                                    const dateStr = date ? `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'N/A';
                                                    
                                                    return (
                                                        <tr key={rec._id || rec.id} className="hover:bg-slate-100/20 dark:hover:bg-slate-900/5 transition-colors">
                                                            <td className="px-6 py-4.5 font-mono text-[10px] whitespace-nowrap">{dateStr}</td>
                                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                                    isPresent 
                                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10' 
                                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/10'
                                                                }`}>
                                                                    {isPresent ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                                    {isPresent ? 'Present' : 'Absent'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4.5 text-right font-mono text-[10px] whitespace-nowrap text-slate-500 dark:text-slate-450">
                                                                {rec.distanceFromFaculty !== undefined && rec.distanceFromFaculty !== null ? (
                                                                    <span className="flex items-center justify-end gap-1">
                                                                        <MapPin size={10} />
                                                                        {Number(rec.distanceFromFaculty).toFixed(1)}m
                                                                    </span>
                                                                ) : (
                                                                    'N/A'
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentHistory;
