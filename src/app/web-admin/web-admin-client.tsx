'use client';

import { useState, useEffect } from 'react';
import {
    Globe,
    ShoppingCart,
    Package,
    Settings,
    RefreshCw,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    DollarSign,
    Send,
    Copy,
    ExternalLink,
    Bell,
    AlertTriangle,
    CreditCard,
    TrendingUp,
    Wallet,
    Shield,
    Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// --- Types ---
interface WebOrder {
    order_code: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    product_names: string;
    price: number;
    status: 'pending' | 'paid' | 'delivered' | 'expired' | 'cancelled';
    created_at: string;
    paid_at?: string;
    delivered_at?: string;
    delivery_content?: string;
    inventory_id?: string;
    secret_masked?: string;
}

interface WebStats {
    total: number;
    pending: number;
    paid: number;
    delivered: number;
    expired: number;
    cancelled: number;
    total_revenue: number;
}

interface InventoryItem {
    code: string;
    name: string;
    available_units: number;
    reserved_units: number;
    sold_units: number;
    sold_units_total?: number;
}

const STATUS_CONFIG = {
    pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    paid: { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-700', icon: CreditCard },
    delivered: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    expired: { label: 'Hết hạn', color: 'bg-gray-100 text-gray-500', icon: Clock },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircle },
};

// --- Components ---

// Navigation Tabs (Light Mode)
function NavTab({ active, label, onClick, icon: Icon }: { active: boolean; label: string; onClick: () => void; icon: any }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100 ring-2 ring-indigo-50'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
            {label}
        </button>
    );
}

export function WebAdminClient() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Data states
    const [stats, setStats] = useState<WebStats | null>(null);
    const [orders, setOrders] = useState<WebOrder[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    // UI states
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<WebOrder | null>(null);

    // Actions states
    const [deliveryContent, setDeliveryContent] = useState('');
    const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('');

    // Settings
    const [apiUrl, setApiUrl] = useState('');
    const [apiToken, setApiToken] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    useEffect(() => {
        // Init settings from localStorage
        const savedUrl = localStorage.getItem('web_admin_api_url') || 'https://tbq-homie.netlify.app/.netlify/functions';
        const savedToken = localStorage.getItem('web_admin_api_token') || '';
        const savedWebsite = localStorage.getItem('web_admin_website_url') || 'https://tbq-homie.netlify.app';

        setApiUrl(savedUrl);
        setApiToken(savedToken);
        setWebsiteUrl(savedWebsite);

        if (savedUrl && savedToken) {
            loadData();
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([loadOrders(), loadInventory()]);
            toast.success('Dữ liệu đã được cập nhật');
        } catch (error) {
            toast.error('Lỗi tải dữ liệu: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async () => {
        const url = localStorage.getItem('web_admin_api_url') || apiUrl;
        const token = localStorage.getItem('web_admin_api_token') || apiToken;

        const response = await fetch(`${url}/admin-orders`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Kết nối API thất bại');

        const data = await response.json();
        setOrders(data.orders || []);
        setStats(data.stats || null);
    };

    const loadInventory = async () => {
        const url = localStorage.getItem('web_admin_api_url') || apiUrl;
        const response = await fetch(`${url}/inventory?action=all`);
        const data = await response.json();
        setInventory(data.inventory || []);
    };

    // Actions
    const handleDeliver = async () => {
        if (!selectedOrder || !deliveryContent.trim()) return;
        try {
            const url = localStorage.getItem('web_admin_api_url') || apiUrl;
            const token = localStorage.getItem('web_admin_api_token') || apiToken;

            const response = await fetch(`${url}/admin-orders`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'deliver',
                    orderCode: selectedOrder.order_code,
                    deliveryContent: deliveryContent.trim(),
                }),
            });

            if (!response.ok) throw new Error('Giao hàng thất bại');

            toast.success('Đã giao hàng thành công!');
            setShowDeliveryDialog(false);
            setDeliveryContent('');
            setSelectedOrder(null);
            loadOrders();
        } catch (error) {
            toast.error('Lỗi: ' + (error as Error).message);
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedOrder || !newStatus) return;
        try {
            const url = localStorage.getItem('web_admin_api_url') || apiUrl;
            const token = localStorage.getItem('web_admin_api_token') || apiToken;

            const response = await fetch(`${url}/admin-orders`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_status',
                    orderCode: selectedOrder.order_code,
                    newStatus,
                }),
            });

            if (!response.ok) throw new Error('Cập nhật thất bại');

            toast.success('Đã cập nhật trạng thái!');
            setShowStatusDialog(false);
            setNewStatus('');
            setSelectedOrder(null);
            loadOrders();
        } catch (error) {
            toast.error('Lỗi: ' + (error as Error).message);
        }
    };

    const saveSettings = () => {
        localStorage.setItem('web_admin_api_url', apiUrl);
        localStorage.setItem('web_admin_api_token', apiToken);
        localStorage.setItem('web_admin_website_url', websiteUrl);
        toast.success('Đã lưu cài đặt');
    };

    // Helpers
    const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleString('vi-VN') : '-';

    const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

    return (
        <div className="space-y-8 font-sans">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Quản lý Web
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Admin Panel</span>
                    </h1>
                    <p className="text-gray-500 mt-1">Đồng bộ và quản lý đơn hàng từ Website</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => window.open(websiteUrl, '_blank')}
                        className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Website
                    </Button>
                    <Button
                        onClick={loadData}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap gap-2 p-1 bg-gray-100/50 rounded-xl w-fit">
                <NavTab active={activeTab === 'overview'} label="Tổng quan" icon={TrendingUp} onClick={() => setActiveTab('overview')} />
                <NavTab active={activeTab === 'orders'} label="Đơn hàng" icon={ShoppingCart} onClick={() => setActiveTab('orders')} />
                <NavTab active={activeTab === 'inventory'} label="Kho hàng" icon={Package} onClick={() => setActiveTab('inventory')} />
                <NavTab active={activeTab === 'settings'} label="Cấu hình" icon={Settings} onClick={() => setActiveTab('settings')} />
            </div>

            {/* Main Content Area */}
            <div className="animate-in fade-in duration-300">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Revenue Banner - Matching TodayDashboard */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center gap-2 mb-4">
                                <Globe className="h-6 w-6" />
                                <h2 className="text-xl font-semibold">Tổng quan Website</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-xl p-4 transition-all hover:scale-[1.02] hover:bg-white/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white/20 rounded-lg text-white">
                                            <DollarSign className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-medium text-white/90">Doanh thu ngày</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{formatCurrency(stats?.total_revenue || 0)}</p>
                                </div>

                                <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-xl p-4 transition-all hover:scale-[1.02] hover:bg-white/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white/20 rounded-lg text-white">
                                            <ShoppingCart className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-medium text-white/90">Đơn hàng mới</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{stats?.total || 0} đơn</p>
                                </div>

                                <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-xl p-4 transition-all hover:scale-[1.02] hover:bg-white/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white/20 rounded-lg text-white">
                                            <CheckCircle className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-medium text-white/90">Đã hoàn thành</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{stats?.delivered || 0} đơn</p>
                                </div>

                                <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-xl p-4 transition-all hover:scale-[1.02] hover:bg-white/30">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white/20 rounded-lg text-white">
                                            <Bell className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-medium text-white/90">Chờ xử lý</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{stats?.pending || 0} đơn</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Row - Pastel Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <CreditCard className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <span className="text-sm font-medium text-orange-800">Chờ thanh toán</span>
                                </div>
                                <p className="text-2xl font-bold text-orange-900 mt-2">{stats?.pending || 0}</p>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-medium text-blue-800">Đã thanh toán</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-900 mt-2">{stats?.paid || 0}</p>
                            </div>

                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                    </div>
                                    <span className="text-sm font-medium text-red-800">Lỗi / Hết hàng</span>
                                </div>
                                <p className="text-2xl font-bold text-red-900 mt-2">{(stats?.expired || 0) + (stats?.cancelled || 0)}</p>
                            </div>

                            <div className="bg-green-50 border border-green-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                    <span className="text-sm font-medium text-green-800">Hoàn tất</span>
                                </div>
                                <p className="text-2xl font-bold text-green-900 mt-2">{stats?.delivered || 0}</p>
                            </div>
                        </div>

                        {/* Recent Orders Table */}
                        <div className="bg-white border text-card-foreground shadow-sm rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Đơn hàng gần đây</h3>
                                <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">Xem tất cả</Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="p-4">Mã đơn</th>
                                            <th className="p-4">Khách hàng</th>
                                            <th className="p-4">Sản phẩm</th>
                                            <th className="p-4">Trạng thái</th>
                                            <th className="p-4">Thời gian</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.slice(0, 5).map((order) => {
                                            const status = STATUS_CONFIG[order.status];
                                            return (
                                                <tr key={order.order_code} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="p-4 font-mono text-gray-600">{order.order_code}</td>
                                                    <td className="p-4 font-medium text-gray-900">{order.customer_name}</td>
                                                    <td className="p-4 text-gray-500 truncate max-w-[200px]">{order.product_names}</td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                            <status.icon className="w-3 h-3" />
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-500">{formatDate(order.created_at)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Bộ lọc:</span>
                                <div className="flex gap-2">
                                    {['all', 'pending', 'paid', 'delivered'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setFilterStatus(s)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterStatus === s
                                                    ? 'bg-gray-900 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {s === 'all' ? 'Tất cả' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="p-4">Mã đơn</th>
                                            <th className="p-4">Khách hàng</th>
                                            <th className="p-4">Sản phẩm</th>
                                            <th className="p-4 text-right">Giá trị</th>
                                            <th className="p-4">Trạng thái</th>
                                            <th className="p-4 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredOrders.map((order) => {
                                            const status = STATUS_CONFIG[order.status];
                                            return (
                                                <tr key={order.order_code} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{order.order_code}</span>
                                                            <button onClick={() => { navigator.clipboard.writeText(order.order_code); toast.success('Đã sao chép'); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-gray-900 text-gray-400 transition-all">
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                                                        <div className="text-xs text-gray-500">{order.customer_phone}</div>
                                                    </td>
                                                    <td className="p-4 text-gray-500 max-w-[200px] truncate">{order.product_names}</td>
                                                    <td className="p-4 text-right font-bold text-gray-900">{formatCurrency(order.price).replace('₫', '')}</td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                            <status.icon className="w-3 h-3" />
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {order.status === 'paid' && (
                                                                <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white shadow-sm" onClick={() => { setSelectedOrder(order); setShowDeliveryDialog(true); }}>
                                                                    <Send className="w-3 h-3 mr-1" /> Giao
                                                                </Button>
                                                            )}
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100" onClick={() => { setSelectedOrder(order); setNewStatus(order.status); setShowStatusDialog(true); }}>
                                                                <Settings className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 gap-4">
                        {inventory.map((item) => (
                            <div key={item.code} className="bg-white border rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                                        <p className="text-sm font-mono text-gray-500">{item.code}</p>
                                    </div>
                                </div>
                                <div className="flex gap-8">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Có sẵn</div>
                                        <div className="text-2xl font-bold text-green-600">{item.available_units}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Đang giữ</div>
                                        <div className="text-2xl font-bold text-yellow-600">{item.reserved_units}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Đã bán</div>
                                        <div className="text-2xl font-bold text-gray-400">{item.sold_units}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="bg-white border rounded-xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">Kết nối Backend</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-700">URL API (Netlify Functions)</Label>
                                    <Input
                                        value={apiUrl}
                                        onChange={(e) => setApiUrl(e.target.value)}
                                        className="bg-gray-50 border-gray-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">API Token (Secret)</Label>
                                    <Input
                                        type="password"
                                        value={apiToken}
                                        onChange={(e) => setApiToken(e.target.value)}
                                        className="bg-gray-50 border-gray-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">URL Website Public</Label>
                                    <Input
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                        className="bg-gray-50 border-gray-200"
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <Button onClick={saveSettings} className="bg-indigo-600 hover:bg-indigo-700 text-white">Lưu cấu hình</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Dialogs */}
            <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Giao hàng cho {selectedOrder?.order_code}</DialogTitle>
                        <DialogDescription>
                            Nhập thông tin tài khoản để gửi cho khách hàng.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nội dung bàn giao</Label>
                            <Textarea
                                value={deliveryContent}
                                onChange={(e) => setDeliveryContent(e.target.value)}
                                placeholder="Tài khoản: ... | Mật khẩu: ..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDeliveryDialog(false)}>Hủy</Button>
                        <Button onClick={handleDeliver} className="bg-green-600 hover:bg-green-700 text-white">Xác nhận giao hàng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cập nhật trạng thái</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Chờ thanh toán</SelectItem>
                                <SelectItem value="paid">Đã thanh toán</SelectItem>
                                <SelectItem value="delivered">Hoàn thành</SelectItem>
                                <SelectItem value="cancelled">Hủy đơn</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Hủy</Button>
                        <Button onClick={handleUpdateStatus} className="bg-indigo-600 hover:bg-indigo-700 text-white">Lưu thay đổi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
