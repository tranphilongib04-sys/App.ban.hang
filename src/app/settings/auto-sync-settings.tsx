'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Save, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { getSystemConfigAction, saveSystemConfigAction, syncFromLocalFileAction } from '@/app/actions';

export function AutoSyncSettings() {
    const [filePath, setFilePath] = useState('');
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        // Load initial config
        getSystemConfigAction('excel_file_path').then((value) => {
            if (value) setFilePath(value);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveSystemConfigAction('excel_file_path', filePath);
            toast.success('Đã lưu đường dẫn file');
        } catch (error) {
            toast.error('Lỗi khi lưu cài đặt');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncNow = async () => {
        if (!filePath) {
            toast.error('Vui lòng nhập đường dẫn file trước');
            return;
        }
        setSyncing(true);
        try {
            const result = await syncFromLocalFileAction();
            if (result.success && 'customersAdded' in result) {
                toast.success(`Đã đồng bộ: +${result.customersAdded} khách, +${result.subscriptionsAdded} đơn`);
            } else if (!result.success) {
                toast.error(`Lỗi đồng bộ: ${result.error}`);
            }
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Card className="bg-white">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Tự động cập nhật (Auto-Sync)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="filePath">Đường dẫn file Excel trên máy (Absolute Path)</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="filePath"
                                    placeholder="/Users/username/Downloads/data.xlsx"
                                    value={filePath}
                                    onChange={(e) => setFilePath(e.target.value)}
                                    className="pl-10 font-mono text-sm"
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Lưu...' : <><Save className="h-4 w-4 mr-2" /> Lưu</>}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Nhập đường dẫn tuyệt đối đến file Excel. Ứng dụng sẽ tự động đọc file này mỗi khi mở lại.
                        </p>
                    </div>
                </form>

                <div className="pt-2 border-t border-gray-100">
                    <Button
                        variant="outline"
                        onClick={handleSyncNow}
                        disabled={syncing || !filePath}
                        className="w-full"
                    >
                        {syncing ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Đang đồng bộ...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Đồng bộ ngay (Test)
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
