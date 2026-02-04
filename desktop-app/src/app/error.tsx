'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
            <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Có lỗi xảy ra</h2>
                <p className="text-gray-600 mb-4">
                    {error.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'}
                </p>
                <div className="space-x-4">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Thử lại
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Tải lại trang
                    </button>
                </div>
            </div>
        </div>
    );
}
