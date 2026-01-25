import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="w-full space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            <div className="rounded-md border border-gray-100 bg-white">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-full max-w-sm" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>
                <div className="space-y-4 p-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
