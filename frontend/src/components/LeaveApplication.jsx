import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Calendar, Clock, CheckCircle, XCircle, FileText, Send, RefreshCw } from 'lucide-react';

const LeaveApplication = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        reason: ''
    });

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/leaves/my');
            setLeaves(data);
        } catch (err) {
            console.error('Failed to fetch leaves', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setApplying(true);

        try {
            await api.post('/leaves/apply', formData);
            setMessage('Leave application submitted successfully!');
            setFormData({ startDate: '', endDate: '', reason: '' });
            fetchLeaves();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit leave application');
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                    <FileText className="mr-2 text-primary-500" />
                    Apply for Leave
                </h3>

                {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 mb-6">{message}</div>}
                {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Reason</label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                            rows="3"
                            placeholder="Please explain the reason for your leave..."
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        disabled={applying}
                        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl transition-all font-semibold"
                    >
                        {applying ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                        Submit Application
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                    <Calendar className="mr-2 text-slate-500" />
                    My Leave History
                </h3>

                {loading ? (
                    <div className="text-center py-10"><RefreshCw className="animate-spin inline-block text-primary-500" /></div>
                ) : leaves.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        No leave applications found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {leaves.map(leave => (
                            <div key={leave.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800 dark:text-white">
                                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{leave.reason}</p>
                                </div>
                                <div className="flex items-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                        leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                                        leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30' :
                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                                    }`}>
                                        {leave.status === 'Approved' && <CheckCircle size={14} />}
                                        {leave.status === 'Rejected' && <XCircle size={14} />}
                                        {leave.status === 'Pending' && <Clock size={14} />}
                                        {leave.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveApplication;
