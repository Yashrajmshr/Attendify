import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldAlert, Award, Calendar, CheckCircle2, XCircle, BellRing, Eye, RefreshCw } from 'lucide-react';

const StudentNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all' | 'alerts' | 'academic' | 'leaves'
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setRefreshing(true);
        else setLoading(true);

        try {
            // 1. Fetch Student's own leave applications
            const leavesRes = await api.get('/leaves/my').catch(() => ({ data: [] }));
            const myLeaves = leavesRes.data || [];

            // 2. Build dynamic notifications based on system state
            const list = [];

            // Add Leave status notifications
            myLeaves.forEach((leave, index) => {
                const dateStr = leave.date ? new Date(leave.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';
                
                if (leave.status === 'Approved') {
                    list.push({
                        id: `leave-approved-${leave._id || index}`,
                        category: 'leaves',
                        title: 'Leave Request Approved',
                        message: `Your leave application for ${leave.subject || 'Subject'} on ${dateStr} has been APPROVED by the department.`,
                        time: leave.updatedAt ? formatTimeAgo(leave.updatedAt) : 'Recently',
                        type: 'success',
                        read: false
                    });
                } else if (leave.status === 'Rejected') {
                    list.push({
                        id: `leave-rejected-${leave._id || index}`,
                        category: 'leaves',
                        title: 'Leave Request Rejected',
                        message: `Your leave application for ${leave.subject || 'Subject'} on ${dateStr} has been REJECTED by the department. Reason: ${leave.rejectionReason || 'Insufficient documentation.'}`,
                        time: leave.updatedAt ? formatTimeAgo(leave.updatedAt) : 'Recently',
                        type: 'danger',
                        read: false
                    });
                } else {
                    list.push({
                        id: `leave-pending-${leave._id || index}`,
                        category: 'leaves',
                        title: 'Leave Request Submitted',
                        message: `Your leave application for ${leave.subject || 'Subject'} on ${dateStr} is currently pending review.`,
                        time: leave.createdAt ? formatTimeAgo(leave.createdAt) : 'Recently',
                        type: 'info',
                        read: true
                    });
                }
            });


            // Merge with read status from localStorage to persist read actions
            const readIds = JSON.parse(localStorage.getItem(`read_notif_${user?.id || 'guest'}`) || '[]');
            const updatedList = list.map(item => ({
                ...item,
                read: readIds.includes(item.id) ? true : item.read
            }));

            setNotifications(updatedList);
        } catch (err) {
            console.error('Failed to compile notifications list', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, [user]);

    const formatTimeAgo = (isoString) => {
        try {
            const now = new Date();
            const date = new Date(isoString);
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays}d ago`;
        } catch (e) {
            return 'Recently';
        }
    };

    const handleMarkAsRead = (id) => {
        const readIds = JSON.parse(localStorage.getItem(`read_notif_${user?.id || 'guest'}`) || '[]');
        if (!readIds.includes(id)) {
            readIds.push(id);
            localStorage.setItem(`read_notif_${user?.id || 'guest'}`, JSON.stringify(readIds));
        }

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllRead = () => {
        const readIds = notifications.map(n => n.id);
        localStorage.setItem(`read_notif_${user?.id || 'guest'}`, JSON.stringify(readIds));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const filteredNotifs = notifications.filter(n => filter === 'all' || n.category === filter);
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        <Bell className="text-primary-500" size={24} />
                        Notification Centre
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        View academic alerts, leave approval status, and security compliance records.
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => loadNotifications(true)}
                        disabled={refreshing}
                        className="p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center"
                        title="Refresh notifications"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-primary-500/10 text-primary-600 dark:text-primary-450 border border-primary-500/15 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary-500/20 active:scale-[0.98] transition-all"
                        >
                            <Eye size={12} />
                            <span>Mark All Read</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Categorization tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-px scrollbar-none">
                {[
                    { id: 'all', label: 'All Notices', badge: notifications.length },
                    { id: 'leaves', label: 'Leave Desk', badge: notifications.filter(n => n.category === 'leaves').length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`px-4.5 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                            filter === tab.id
                                ? 'border-primary-500 text-primary-500 dark:text-white font-extrabold'
                                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                        <span>{tab.label}</span>
                        {tab.badge > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                filter === tab.id 
                                    ? 'bg-primary-500 text-white' 
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
                            }`}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Notifications Feed */}
            <div className="space-y-4">
                {loading ? (
                    <div className="premium-card p-16 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <RefreshCw className="animate-spin inline-block mr-2" size={14} />
                        Syncing notification logs...
                    </div>
                ) : filteredNotifs.length > 0 ? (
                    filteredNotifs.map((notif) => {
                        const bgClass = notif.read 
                            ? 'bg-white dark:bg-slate-950/20 border-slate-200 dark:border-white/5 opacity-75' 
                            : notif.type === 'danger' 
                                ? 'bg-rose-500/5 border-rose-500/15 text-rose-800 dark:text-rose-300' 
                                : notif.type === 'warning' 
                                    ? 'bg-amber-500/5 border-amber-500/15 text-amber-800 dark:text-amber-300'
                                    : 'bg-primary-500/5 border-primary-500/15 text-primary-800 dark:text-indigo-300';

                        const iconClass = notif.type === 'danger' 
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                            : notif.type === 'warning' 
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                : notif.type === 'success' 
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';

                        return (
                            <div 
                                key={notif.id} 
                                className={`premium-card p-5 border flex items-start space-x-4 transition-all duration-300 ${bgClass}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                                    {notif.category === 'leaves' && (notif.type === 'success' ? <CheckCircle2 size={16} /> : notif.type === 'danger' ? <XCircle size={16} /> : <Calendar size={16} />)}
                                    {notif.category === 'alerts' && <ShieldAlert size={16} />}
                                    {notif.category === 'academic' && <Award size={16} />}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between gap-4">
                                        <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            {!notif.read && (
                                                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse flex-shrink-0"></span>
                                            )}
                                            {notif.title}
                                        </h4>
                                        <span className="text-[9px] font-bold text-slate-400 font-mono flex-shrink-0">{notif.time}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                                        {notif.message}
                                    </p>
                                </div>

                                {!notif.read && (
                                    <button
                                        onClick={() => handleMarkAsRead(notif.id)}
                                        className="p-1 text-slate-400 hover:text-primary-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-all flex-shrink-0"
                                        title="Mark as read"
                                    >
                                        <Eye size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="premium-card p-16 text-center text-slate-400 italic font-bold uppercase tracking-wider text-[10px] border-dashed">
                        No notifications found under this category
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentNotifications;
