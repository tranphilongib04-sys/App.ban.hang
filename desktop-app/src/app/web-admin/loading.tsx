export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
                ))}
            </div>
            <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
    );
}
