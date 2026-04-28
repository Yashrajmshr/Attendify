import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Mail, AlertTriangle, RefreshCw } from 'lucide-react';

const DefaultersList = () => {
    const [defaulters, setDefaulters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(75);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [notifying, setNotifying] = useState(false);

    const fetchDefaulters = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get(`/admin/defaulters?threshold=${threshold}`);
            setDefaulters(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch defaulters');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDefaulters();
    }, [threshold]);

    const handleNotifyAll = async () => {
        if (!window.confirm(`Are you sure you want to send warning emails to ${defaulters.length} students?`)) return;
        setNotifying(true);
        setMessage('');
        setError('');
        try {
            const studentIds = defaulters.map(d => d.id);
            const { data } = await api.post('/admin/notify-defaulters', { studentIds });
            setMessage(data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to notify defaulters');
        } finally {
            setNotifying(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                        <AlertTriangle className="mr-2 text-rose-500" size={24} />
                        Defaulters List
                    </h2>
                    <p className="text-sm text-slate-500">Students with attendance below {threshold}%</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Threshold %:</label>
                        <input 
                            type="number" 
                            value={threshold} 
                            onChange={(e) => setThreshold(e.target.value)}
                            onBlur={fetchDefaulters}
                            className="w-20 px-3 py-1.5 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <button 
                        onClick={handleNotifyAll}
                        disabled={defaulters.length === 0 || notifying}
                        className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-all font-semibold"
                    >
                        {notifying ? <RefreshCw size={18} className="animate-spin" /> : <Mail size={18} />}
                        Notify All
                    </button>
                </div>
            </div>

            {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100">{message}</div>}
            {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100">{error}</div>}

            {loading ? (
                <div className="text-center py-10"><RefreshCw className="animate-spin inline-block mr-2" /> Loading...</div>
            ) : defaulters.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    🎉 No defaulters found below {threshold}%!
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Roll No</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Section</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Classes Attended</th>
                                <th className="p-4 font-semibold text-rose-500">Percentage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {defaulters.map(d => (
                                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-800 dark:text-slate-200">
                                    <td className="p-4">{d.rollNumber || 'N/A'}</td>
                                    <td className="p-4 font-medium">{d.name}</td>
                                    <td className="p-4">Sec {d.section}</td>
                                    <td className="p-4">{d.presentClasses} / {d.possibleClasses}</td>
                                    <td className="p-4 font-bold text-rose-500">{d.percentage}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DefaultersList;
