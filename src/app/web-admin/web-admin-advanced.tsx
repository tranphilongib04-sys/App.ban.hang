'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    Plus,
    Edit,
    Trash2,
    Upload,
    Download,
    Users,
    TrendingUp,
    BarChart3,
    Zap,
    Mail,
    Bell,
    Eye,
    EyeOff,
    Tag,
    Filter,
    Search,
    FileText,
    Activity,
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
interface Product {
    id: number;
    code: string;
    name: string;
    category: string;
    description: string;
    image_url: string;
    featured: boolean;
    active: boolean;
    created_at: string;
}

interface ProductVariant {
    id: number;
    product_id: number;
    name: string;
    price: number;
    duration: string;
    note: string;
    active: boolean;
}

interface StockUnit {
    id: number;
    product_id: number;
    product_code: string;
    product_name: string;
    secret: string;
    status: 'available' | 'reserved' | 'sold';
    reserved_until?: string;
    created_at: string;
}

interface Customer {
    email: string;
    name: string;
    phone: string;
    total_orders: number;
    total_spent: number;
    last_order_date: string;
}

interface Analytics {
    daily_revenue: { date: string; revenue: number }[];
    top_products: { product: string; count: number; revenue: number }[];
    conversion_rate: { pending: number; paid: number; delivered: number };
    customer_stats: { new_customers: number; returning: number };
}

interface WebhookLog {
    id: number;
    event_type: string;
    payload: string;
    status: 'success' | 'failed';
    created_at: string;
}

export function WebAdminAdvanced() {
    // State management
    const [activeTab, setActiveTab] = useState('products');
    const [loading, setLoading] = useState(false);

    // Products
    const [products, setProducts] = useState<Product[]>([]);
    const [showProductDialog, setShowProductDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Stock
    const [stockUnits, setStockUnits] = useState<StockUnit[]>([]);
    const [showStockDialog, setShowStockDialog] = useState(false);
    const [bulkStockText, setBulkStockText] = useState('');
    const [selectedProductForStock, setSelectedProductForStock] = useState('');

    // Customers
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');

    // Analytics
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [dateRange, setDateRange] = useState('7days');

    // Webhooks
    const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
    const [autoDeliveryEnabled, setAutoDeliveryEnabled] = useState(false);

    // Settings
    const [apiUrl, setApiUrl] = useState('');
    const [apiToken, setApiToken] = useState('');

    useEffect(() => {
        const savedUrl = localStorage.getItem('web_admin_api_url') || '';
        const savedToken = localStorage.getItem('web_admin_api_token') || '';
        setApiUrl(savedUrl);
        setApiToken(savedToken);

        if (savedUrl && savedToken) {
            loadAllData();
        }
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadProducts(),
                loadStockUnits(),
                loadCustomers(),
                loadAnalytics(),
                loadWebhookLogs(),
            ]);
            toast.success('Đã tải toàn bộ dữ liệu');
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await fetch(`${apiUrl}/products`, {
                headers: { 'Authorization': `Bearer ${apiToken}` },
            });
            if (!response.ok) throw new Error('Không thể tải products');
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Load products error:', error);
        }
    };

    const loadStockUnits = async () => {
        try {
            const response = await fetch(`${apiUrl}/stock-units?status=all`, {
                headers: { 'Authorization': `Bearer ${apiToken}` },
            });
            if (!response.ok) throw new Error('Không thể tải stock');
            const data = await response.json();
            setStockUnits(data.stock || []);
        } catch (error) {
            console.error('Load stock error:', error);
        }
    };

    const loadCustomers = async () => {
        try {
            const response = await fetch(`${apiUrl}/customers`, {
                headers: { 'Authorization': `Bearer ${apiToken}` },
            });
            if (!response.ok) throw new Error('Không thể tải customers');
            const data = await response.json();
            setCustomers(data.customers || []);
        } catch (error) {
            console.error('Load customers error:', error);
        }
    };

    const loadAnalytics = async () => {
        try {
            const response = await fetch(`${apiUrl}/analytics?range=${dateRange}`, {
                headers: { 'Authorization': `Bearer ${apiToken}` },
            });
            if (!response.ok) throw new Error('Không thể tải analytics');
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Load analytics error:', error);
        }
    };

    const loadWebhookLogs = async () => {
        try {
            const response = await fetch(`${apiUrl}/webhook-logs?limit=50`, {
                headers: { 'Authorization': `Bearer ${apiToken}` },
            });
            if (!response.ok) throw new Error('Không thể tải webhook logs');
            const data = await response.json();
            setWebhookLogs(data.logs || []);
        } catch (error) {
            console.error('Load webhook logs error:', error);
        }
    };

    // Product Management
    const handleSaveProduct = async (productData: Partial<Product>) => {
        try {
            const method = editingProduct ? 'PUT' : 'POST';
            const url = editingProduct
                ? `${apiUrl}/products/${editingProduct.id}`
                : `${apiUrl}/products`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) throw new Error('Không thể lưu product');

            toast.success(editingProduct ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
            setShowProductDialog(false);
            setEditingProduct(null);
            loadProducts();
        } catch (error) {
            toast.error('Lỗi: ' + (error as Error).message);
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm('Xóa sản phẩm này?')) return;

        try {
            const response = await fetch(`${apiUrl}/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${apiToken}` },
            });

            if (!response.ok) throw new Error('Không thể xóa');

            toast.success('Đã xóa sản phẩm');
            loadProducts();
        } catch (error) {
            toast.error('Lỗi: ' + (error as Error).message);
        }
    };

    const handleToggleProductActive = async (id: number, active: boolean) => {
        try {
            const response = await fetch(`${apiUrl}/products/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ active }),
            });

            if (!response.ok) throw new Error('Không thể cập nhật');

            toast.success(active ? 'Đã hiện sản phẩm' : 'Đã ẩn sản phẩm');
            loadProducts();
        } catch (error) {
            toast.error('Lỗi: ' + (error as Error).message);
        }
    };

    // Stock Management
    const handleBulkImportStock = async () => {
        if (!selectedProductForStock || !bulkStockText.trim()) {
            toast.error('Vui lòng chọn sản phẩm và nhập stock');
            return;
        }

        try {
            const lines = bulkStockText.trim().split('\n').filter(l => l.trim());
            const stockData = lines.map(line => {
                const [username, password] = line.split('|').map(s => s.trim());
                return {
                    product_code: selectedProductForStock,
                    secret: `${username}|${password}`,
                };
            });

            const response = await fetch(`${apiUrl}/stock-units/bulk`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stock: stockData }),
            });

            if (!response.ok) throw new Error('Import thất bại');

            const result = await response.json();
            toast.success(`Đã import ${result.count} stock units`);
            setShowStockDialog(false);
            setBulkStockText('');
            loadStockUnits();
        } catch (error) {
            toast.error('Lỗi: ' + (error as Error).message);
        }
    };

    const handleExportStock = async (status: string) => {
        try {
            const filtered = stockUnits.filter(s => s.status === status);
            const csv = [
                'Product,Username,Password,Status,Created',
                ...filtered.map(s => {
                    const [user, pass] = s.secret.split('|');
                    return `${s.product_name},${user},${pass},${s.status},${s.created_at}`;
                })
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stock_${status}_${Date.now()}.csv`;
            a.click();

            toast.success('Đã export stock');
        } catch (error) {
            toast.error('Lỗi export: ' + (error as Error).message);
        }
    };

    // Automation
    const handleToggleAutoDelivery = async (enabled: boolean) => {
        try {
            const response = await fetch(`${apiUrl}/settings/auto-delivery`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enabled }),
            });

            if (!response.ok) throw new Error('Không thể cập nhật');

            setAutoDeliveryEnabled(enabled);
            toast.success(enabled ? 'Đã bật auto-delivery' : 'Đã tắt auto-delivery');
        } catch (error) {
            toast.error('Lỗi: ' + (error as Error).message);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                        <Zap className="h-6 w-6 text-indigo-600" />
                        Quản lý Web Nâng cao
                    </h1>
                    <p className="text-gray-500 mt-1">Quản trị toàn diện website bán hàng</p>
                </div>
                <Button onClick={loadAllData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới tất cả
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-6 w-full">
                    <TabsTrigger value="products">Sản phẩm</TabsTrigger>
                    <TabsTrigger value="stock">Stock</TabsTrigger>
                    <TabsTrigger value="customers">Khách hàng</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="automation">Tự động hóa</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                {/* PRODUCTS TAB */}
                <TabsContent value="products" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Quản lý Sản phẩm Web</CardTitle>
                                    <CardDescription>Thêm, sửa, xóa sản phẩm trên website</CardDescription>
                                </div>
                                <Button onClick={() => {
                                    setEditingProduct(null);
                                    setShowProductDialog(true);
                                }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm sản phẩm
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã</TableHead>
                                        <TableHead>Tên</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Featured</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-mono text-sm">{product.code}</TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{product.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {product.featured && <Badge className="bg-yellow-100 text-yellow-800">⭐ Featured</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleToggleProductActive(product.id, !product.active)}
                                                >
                                                    {product.active ? (
                                                        <Eye className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingProduct(product);
                                                            setShowProductDialog(true);
                                                        }}
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3 text-red-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* STOCK TAB */}
                <TabsContent value="stock" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Available</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">
                                    {stockUnits.filter(s => s.status === 'available').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Reserved</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-yellow-600">
                                    {stockUnits.filter(s => s.status === 'reserved').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Sold</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-600">
                                    {stockUnits.filter(s => s.status === 'sold').length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Quản lý Stock Units</CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => handleExportStock('available')}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Available
                                    </Button>
                                    <Button onClick={() => setShowStockDialog(true)}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import Stock
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Sản phẩm</TableHead>
                                            <TableHead>Thông tin</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Ngày tạo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stockUnits.slice(0, 100).map((stock) => (
                                            <TableRow key={stock.id}>
                                                <TableCell className="font-mono text-xs">{stock.id}</TableCell>
                                                <TableCell className="font-medium">{stock.product_name}</TableCell>
                                                <TableCell className="font-mono text-xs truncate max-w-xs">
                                                    {stock.secret.replace(/./g, '•')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            stock.status === 'available' ? 'bg-green-100 text-green-800' :
                                                            stock.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }
                                                    >
                                                        {stock.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500">
                                                    {formatDate(stock.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CUSTOMERS TAB */}
                <TabsContent value="customers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Khách hàng từ Web</CardTitle>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Tìm kiếm..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="w-64"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Khách hàng</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>SĐT</TableHead>
                                        <TableHead>Tổng đơn</TableHead>
                                        <TableHead>Tổng chi tiêu</TableHead>
                                        <TableHead>Đơn cuối</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers
                                        .filter(c =>
                                            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                            c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                            c.phone.includes(customerSearch)
                                        )
                                        .map((customer, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell className="text-sm">{customer.email}</TableCell>
                                            <TableCell className="text-sm">{customer.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{customer.total_orders}</Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {formatCurrency(customer.total_spent)}
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {formatDate(customer.last_order_date)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ANALYTICS TAB */}
                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Analytics & Insights
                                </CardTitle>
                                <Select value={dateRange} onValueChange={setDateRange}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7days">7 ngày</SelectItem>
                                        <SelectItem value="30days">30 ngày</SelectItem>
                                        <SelectItem value="90days">90 ngày</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center text-gray-500 py-12">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>Analytics sẽ hiển thị biểu đồ doanh thu, top products, conversion rate</p>
                                <p className="text-sm mt-2">Cần tạo Netlify Function để trả về data analytics</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AUTOMATION TAB */}
                <TabsContent value="automation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Tự động hóa
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div className="font-medium">Auto-delivery khi thanh toán</div>
                                    <div className="text-sm text-gray-500">
                                        Tự động giao hàng ngay khi nhận webhook thanh toán từ Sepay
                                    </div>
                                </div>
                                <Checkbox
                                    checked={autoDeliveryEnabled}
                                    onCheckedChange={handleToggleAutoDelivery}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                                <div>
                                    <div className="font-medium">Zalo notification</div>
                                    <div className="text-sm text-gray-500">
                                        Gửi tin nhắn Zalo tự động khi có đơn mới hoặc thanh toán
                                    </div>
                                </div>
                                <Checkbox disabled />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                                <div>
                                    <div className="font-medium">Email delivery</div>
                                    <div className="text-sm text-gray-500">
                                        Gửi email tự động với thông tin tài khoản sau khi giao hàng
                                    </div>
                                </div>
                                <Checkbox disabled />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* LOGS TAB */}
                <TabsContent value="logs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Webhook Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Event</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Payload</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {webhookLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-mono text-xs">{log.id}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{log.event_type}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        log.status === 'success'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }>
                                                        {log.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs max-w-xs truncate">
                                                    {log.payload}
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500">
                                                    {formatDate(log.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Product Dialog */}
            <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Form thêm/sửa sản phẩm (Code, Name, Category, Description, Image URL, Featured, Active)
                        </p>
                        <p className="text-xs text-gray-400">
                            Cần implement form với validation
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProductDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={() => handleSaveProduct({})}>
                            {editingProduct ? 'Cập nhật' : 'Thêm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stock Import Dialog */}
            <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Import Stock hàng loạt</DialogTitle>
                        <DialogDescription>
                            Nhập danh sách TK|MK, mỗi dòng 1 stock unit
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Chọn sản phẩm</Label>
                            <Select value={selectedProductForStock} onValueChange={setSelectedProductForStock}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn product..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.code} value={p.code}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Danh sách Stock (TK|MK)</Label>
                            <Textarea
                                value={bulkStockText}
                                onChange={(e) => setBulkStockText(e.target.value)}
                                placeholder="example1@gmail.com|password123&#10;example2@gmail.com|password456&#10;example3@gmail.com|password789"
                                rows={10}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500">
                                Mỗi dòng: username|password. Tổng: {bulkStockText.trim().split('\n').filter(l => l.trim()).length} dòng
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStockDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleBulkImportStock}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import {bulkStockText.trim().split('\n').filter(l => l.trim()).length} units
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
