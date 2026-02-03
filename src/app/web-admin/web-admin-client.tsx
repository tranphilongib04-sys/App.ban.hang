'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Types
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
    total_revenue: number;
}

interface InventoryItem {
    code: string;
    name: string;
    available_units: number;
    reserved_units: number;
    sold_units: number;
}

const STATUS_CONFIG = {
    pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    paid: { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-800', icon: DollarSign },
    delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    expired: { label: 'Hết hạn', color: 'bg-gray-100 text-gray-800', icon: Clock },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function WebAdminClient() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<WebStats | null>(null);
    const [orders, setOrders] = useState<WebOrder[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<WebOrder | null>(null);
    const [deliveryContent, setDeliveryContent] = useState('');
    const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('');

    // Settings
    const [apiUrl, setApiUrl] = useState('');
    const [apiToken, setApiToken] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    useEffect(() => {
        // Load settings from localStorage
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
            toast.success('Đã tải dữ liệu từ web');
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async () => {
        const url = localStorage.getItem('web_admin_api_url') || apiUrl;
        const token = localStorage.getItem('web_admin_api_token') || apiToken;

        const response = await fetch(`${url}/admin-orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Không thể kết nối API. Kiểm tra URL và Token.');
        }

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

    const handleDeliver = async () => {
        if (!selectedOrder || !deliveryContent.trim()) {
            toast.error('Vui lòng nhập nội dung giao hàng');
            return;
        }

        try {
            const url = localStorage.getItem('web_admin_api_url') || apiUrl;
            const token = localStorage.getItem('web_admin_api_token') || apiToken;

            const response = await fetch(`${url}/admin-orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
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
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
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

    const testConnection = async () => {
        try {
            const response = await fetch(`${apiUrl}/admin-orders`, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                },
            });

            if (response.ok) {
                toast.success('Kết nối thành công!');
            } else {
                toast.error('Kết nối thất bại. Kiểm tra URL và Token.');
            }
        } catch (error) {
            toast.error('Lỗi kết nối: ' + (error as Error).message);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Đã sao chép!');
    };

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                        <Globe className="h-6 w-6 text-indigo-600" />
                        Quản lý Web
                    </h1>
                    <p className="text-gray-500 mt-1">Quản lý đơn hàng và kho từ website bán hàng</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => window.open(websiteUrl, '_blank')}
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Mở website
                    </Button>
                    <Button onClick={loadData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="settings">Cài đặt</TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Chờ: {stats?.pending || 0} | Đã thanh toán: {stats?.paid || 0}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Đã giao hàng</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Hết hạn/Hủy: {(stats?.expired || 0) + (stats?.cancelled || 0)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
                                <DollarSign className="h-4 w-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-indigo-600">
                                    {formatCurrency(stats?.total_revenue || 0)}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Từ đơn đã giao</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Orders */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Đơn hàng gần đây</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã đơn</TableHead>
                                        <TableHead>Khách hàng</TableHead>
                                        <TableHead>Sản phẩm</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Thời gian</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.slice(0, 5).map((order) => {
                                        const statusConfig = STATUS_CONFIG[order.status];
                                        return (
                                            <TableRow key={order.order_code}>
                                                <TableCell className="font-mono text-sm">
                                                    {order.order_code}
                                                </TableCell>
                                                <TableCell>{order.customer_name}</TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {order.product_names}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusConfig.color}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {formatDate(order.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-4">
                    <div className="flex gap-2">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Lọc trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="pending">Chờ thanh toán</SelectItem>
                                <SelectItem value="paid">Đã thanh toán</SelectItem>
                                <SelectItem value="delivered">Đã giao</SelectItem>
                                <SelectItem value="expired">Hết hạn</SelectItem>
                                <SelectItem value="cancelled">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã đơn</TableHead>
                                        <TableHead>Khách hàng</TableHead>
                                        <TableHead>SĐT</TableHead>
                                        <TableHead>Sản phẩm</TableHead>
                                        <TableHead>Giá</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Tạo lúc</TableHead>
                                        <TableHead>Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => {
                                        const statusConfig = STATUS_CONFIG[order.status];
                                        const Icon = statusConfig.icon;
                                        return (
                                            <TableRow key={order.order_code}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {order.order_code}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(order.order_code)}
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{order.customer_name}</div>
                                                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{order.customer_phone}</TableCell>
                                                <TableCell className="max-w-xs">
                                                    <div className="truncate">{order.product_names}</div>
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(order.price)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusConfig.color}>
                                                        <Icon className="h-3 w-3 mr-1" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {formatDate(order.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {order.status === 'paid' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setShowDeliveryDialog(true);
                                                                }}
                                                            >
                                                                <Send className="h-3 w-3 mr-1" />
                                                                Giao
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setNewStatus(order.status);
                                                                setShowStatusDialog(true);
                                                            }}
                                                        >
                                                            <Settings className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Inventory Tab */}
                <TabsContent value="inventory" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Tồn kho trên Web
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã sản phẩm</TableHead>
                                        <TableHead>Tên</TableHead>
                                        <TableHead>Có sẵn</TableHead>
                                        <TableHead>Đang giữ</TableHead>
                                        <TableHead>Đã bán</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventory.map((item) => (
                                        <TableRow key={item.code}>
                                            <TableCell className="font-mono text-sm">{item.code}</TableCell>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                                    {item.available_units}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                                    {item.reserved_units}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                                    {item.sold_units}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cài đặt kết nối</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>URL API Backend</Label>
                                <Input
                                    value={apiUrl}
                                    onChange={(e) => setApiUrl(e.target.value)}
                                    placeholder="https://tbq-homie.netlify.app/.netlify/functions"
                                />
                                <p className="text-xs text-gray-500">
                                    URL của Netlify Functions
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>API Token</Label>
                                <Input
                                    type="password"
                                    value={apiToken}
                                    onChange={(e) => setApiToken(e.target.value)}
                                    placeholder="Nhập ADMIN_API_TOKEN"
                                />
                                <p className="text-xs text-gray-500">
                                    Token để xác thực với admin API
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>URL Website</Label>
                                <Input
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    placeholder="https://tbq-homie.netlify.app"
                                />
                                <p className="text-xs text-gray-500">
                                    URL website bán hàng
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={saveSettings}>
                                    Lưu cài đặt
                                </Button>
                                <Button variant="outline" onClick={testConnection}>
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Test kết nối
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Hướng dẫn</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-gray-600">
                            <p>1. Thêm biến môi trường <code className="bg-gray-100 px-1">ADMIN_API_TOKEN</code> vào Netlify</p>
                            <p>2. Deploy lại website sau khi thêm token</p>
                            <p>3. Nhập URL API và Token vào form trên</p>
                            <p>4. Test kết nối để kiểm tra</p>
                            <p>5. Bắt đầu quản lý đơn hàng từ web!</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delivery Dialog */}
            <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Giao hàng thủ công</DialogTitle>
                        <DialogDescription>
                            Đơn hàng: {selectedOrder?.order_code}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Khách hàng</Label>
                            <p className="text-sm text-gray-600">{selectedOrder?.customer_name}</p>
                        </div>
                        <div>
                            <Label>Sản phẩm</Label>
                            <p className="text-sm text-gray-600">{selectedOrder?.product_names}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Nội dung giao hàng *</Label>
                            <Textarea
                                value={deliveryContent}
                                onChange={(e) => setDeliveryContent(e.target.value)}
                                placeholder="VD: TK: example@gmail.com | MK: password123"
                                rows={4}
                            />
                            <p className="text-xs text-gray-500">
                                Nội dung này sẽ được gửi cho khách hàng
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleDeliver}>
                            <Send className="h-4 w-4 mr-2" />
                            Giao hàng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cập nhật trạng thái</DialogTitle>
                        <DialogDescription>
                            Đơn hàng: {selectedOrder?.order_code}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Trạng thái mới</Label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                                    <SelectItem value="delivered">Đã giao</SelectItem>
                                    <SelectItem value="cancelled">Hủy</SelectItem>
                                    <SelectItem value="expired">Hết hạn</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleUpdateStatus}>
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
