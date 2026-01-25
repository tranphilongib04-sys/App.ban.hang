import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="max-w-6xl space-y-6">
            <div className="mb-8">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-5 w-48" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>

            <div className="flex gap-3 flex-wrap">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-28" />
            </div>

            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
            </div>
        </div>
    )
}
