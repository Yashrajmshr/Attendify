import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Calendar, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

const LeaveApprovals = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending'); // 'Pending', 'Approved', 'Rejected', 'All'
    const [actionLoading, setActionLoading] = useState(null);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const url = filter === 'All' ? '/leaves' : `/leaves?status=${filter}`;
            const { data } = await api.get(url);
            setLeaves(data);
        } catch (err) {
            console.error('Failed to fetch leaves', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [filter]);

    const handleAction = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this leave application?`)) return;
        
        setActionLoading(id);
        try {
            await api.put(`/leaves/${id}/status`, { status });
            // Remove from current view if filtering by Pending, else just update status in list
            if (filter === 'Pending') {
                setLeaves(leaves.filter(l => l.id !== id));
            } else {
                setLeaves(leaves.map(l => l.id === id ? { ...l, status } : l));
            }
        } catch (err) {
            alert('Failed to update leave status');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                        <Calendar className="mr-2 text-primary-500" size={24} />
                        Leave Applications
                    </h2>
                    <p className="text-sm text-slate-500">Review and manage student leave requests</p>
                </div>
                <div className="flex items-center gap-2">
                    {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                filter === f 
                                    ? 'bg-primary-500 text-white' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                    <button onClick={fetchLeaves} className="ml-2 p-1.5 text-slate-400 hover:text-primary-500">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10"><RefreshCw className="animate-spin inline-block text-primary-500 mr-2" /> Loading...</div>
            ) : leaves.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    No {filter !== 'All' ? filter.toLowerCase() : ''} leave applications found.
                </div>
            ) : (
                <div className="grid gap-4">
                    {leaves.map(leave => (
                        <div key={leave.id} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-white">{leave.studentName}</h4>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                                        leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                        leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {leave.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                                    <span>Roll: <strong className="text-slate-700 dark:text-slate-300">{leave.rollNumber}</strong></span>
                                    <span>Sec: <strong className="text-slate-700 dark:text-slate-300">{leave.section}</strong></span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} /> 
                                        {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-semibold block mb-1">Reason:</span>
                                    {leave.reason}
                                </div>
                            </div>
                            
                            {leave.status === 'Pending' && (
                                <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                                    <button 
                                        onClick={() => handleAction(leave.id, 'Approved')}
                                        disabled={actionLoading === leave.id}
                                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-all font-semibold"
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleAction(leave.id, 'Rejected')}
                                        disabled={actionLoading === leave.id}
                                        className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl transition-all font-semibold"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeaveApprovals;
