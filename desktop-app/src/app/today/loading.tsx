import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="max-w-6xl space-y-8">
            <div className="mb-8">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-5 w-64" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-xl bg-white/80" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-8 w-48" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-white/50 rounded-xl border border-gray-100 flex gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-full max-w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
                <div>
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}
