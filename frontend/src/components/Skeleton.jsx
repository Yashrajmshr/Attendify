const Skeleton = ({ className }) => {
    return (
        <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}></div>
    );
};

export const DashboardSkeleton = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-72" />
                <Skeleton className="h-72" />
            </div>
        </div>
    );
};

export const TableSkeleton = ({ rows = 5 }) => {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(rows)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
};

export default Skeleton;
