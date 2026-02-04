import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Database, Info, Heart } from 'lucide-react';
import { ImportDataClient } from './import-data-client';
import { AutoSyncSettings } from './auto-sync-settings';

export default function SettingsPage() {
    return (
        <div className="max-w-2xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Cài đặt ứng dụng</p>
            </div>

            <div className="space-y-6">
                {/* Auto Sync Settings */}
                <AutoSyncSettings />

                {/* App Info */}
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Thông tin ứng dụng
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Tên ứng dụng</span>
                            <span className="font-medium text-gray-900">TPB Manage</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Phiên bản</span>
                            <span className="font-medium text-gray-900">1.0.0</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Công nghệ</span>
                            <span className="font-medium text-gray-900">Next.js + SQLite</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Database */}
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Cơ sở dữ liệu
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Loại</span>
                            <span className="font-medium text-gray-900">SQLite (Local)</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Đường dẫn</span>
                            <span className="font-mono text-sm text-gray-900">./data/tpb-manage.db</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Features */}
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            Tính năng
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Quản lý khách hàng & subscription
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Nhắc nhở gia hạn tự động (0-3 ngày)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Gia hạn nhanh 1-click
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Quản lý inventory (TK/MK/Keys)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Giao hàng FIFO + Copy tin nhắn
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Bảo hành: cấp tài khoản mới
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Báo cáo doanh thu & lợi nhuận
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Import Data */}
                <ImportDataClient />

                {/* Credits */}
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
                    <CardContent className="py-6 text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-500 mb-2">
                            <span>Made with</span>
                            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                            <span>for your business</span>
                        </div>
                        <p className="text-sm text-gray-400">TPB Manage © 2026</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
