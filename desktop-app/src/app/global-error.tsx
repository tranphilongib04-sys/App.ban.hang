'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{
                    display: 'flex',
                    minHeight: '100vh',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    fontFamily: 'system-ui, sans-serif',
                    background: '#f5f5f5'
                }}>
                    <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                        <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Có lỗi xảy ra</h2>
                        <p style={{ color: '#666', marginBottom: '1rem' }}>
                            {error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.'}
                        </p>
                        <button
                            onClick={() => reset()}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                marginRight: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            Thử lại
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#e5e7eb',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
