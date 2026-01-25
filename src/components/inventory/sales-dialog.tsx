'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { InventoryItem, Customer } from '@/lib/db/schema';
import { CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/messages';
import { formatCurrency } from '@/lib/business';
import { sellInventoryItemAction } from '@/app/actions';

interface SalesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InventoryItem | null;
    customers: Customer[];
    initialCustomerName?: string;
    initialContact?: string;
}

export function SalesDialog({
    open,
    onOpenChange,
    item,
    customers,
    initialCustomerName = '',
    initialContact = ''
}: SalesDialogProps) {
    const router = useRouter();

    // Form State
    const [customerName, setCustomerName] = useState(initialCustomerName);
    const [contact, setContact] = useState(initialContact);
    const [price, setPrice] = useState('0');
    const [duration, setDuration] = useState('1');
    const [note, setNote] = useState('');
    const [source, setSource] = useState('Fb TPL'); // Default per user request
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [soldSecret, setSoldSecret] = useState<string | null>(null);

    // Track previous open state to only reset on OPENING transition
    const prevOpen = useRef(open);

    // Filter customers
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerName.toLowerCase()) ||
        (c.contact && c.contact.toLowerCase().includes(customerName.toLowerCase()))
    ).slice(0, 5);

    // Initialize/Reset form when item opens
    useEffect(() => {
        // Only run if opening (false -> true)
        if (open && !prevOpen.current && item) {
            // Only convert cost to string if it exists, default to '0'. 
            const costStr = item.cost != null ? item.cost.toString() : '0';

            // If initialCustomerName provided (e.g. from Renewal), use it.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCustomerName(initialCustomerName);
            setContact(initialContact);
            setPrice(costStr);
            setDuration('1');
            setNote('');
            setPaymentStatus('unpaid');
            setSoldSecret(null);
            setIsSubmitting(false);
        }
        prevOpen.current = open;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, item, initialCustomerName, initialContact]);

    const handleSelectCustomer = (customer: Customer) => {
        setCustomerName(customer.name);
        setContact(customer.contact || '');
        setShowSuggestions(false);
    };

    const handleSell = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!item || !customerName) {
            toast.error('Vui lòng nhập thông tin');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('inventoryId', item.id.toString());
        formData.append('customerName', customerName);
        formData.append('contact', contact);
        formData.append('salePrice', price);
        formData.append('durationMonths', duration);
        formData.append('note', note);
        formData.append('source', source);
        formData.append('paymentStatus', paymentStatus);

        try {
            const result = await sellInventoryItemAction(formData);
            if (result.success && result.secretPayload) {
                toast.success('Đã bán hàng thành công!');

                // Calculate expiry for message
                const months = parseInt(duration) || 1;
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + months);
                const endDateStr = endDate.toLocaleDateString('vi-VN');

                const message = `📦 Đơn hàng: ${item.service}
👤 Khách hàng: ${customerName}
📅 Hạn sử dụng: ${endDateStr}
--------------------------------
🔐 Tài khoản:
${result.secretPayload}
--------------------------------
Cảm ơn bạn đã ủng hộ!`;

                setSoldSecret(message);
                router.refresh();
            } else if (result.success) {
                toast.success('Đã bán hàng thành công!');
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error('Lỗi: ' + result.error);
                setIsSubmitting(false);
            }
        } catch {
            toast.error('Có lỗi xảy ra khi bán hàng');
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{soldSecret ? 'Bán hàng thành công!' : 'Bán hàng từ kho'}</DialogTitle>
                </DialogHeader>

                {soldSecret ? (
                    <div className="space-y-4 pt-2">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                            <h3 className="text-green-900 font-medium">Giao dịch hoàn tất</h3>
                            <p className="text-sm text-green-700 mt-1">Sản phẩm đã được chuyển trạng thái &quot;Đã giao&quot;</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Tin nhắn giao hàng (Copy gửi khách)</Label>
                            <div className="relative">
                                <Textarea
                                    value={soldSecret}
                                    readOnly
                                    rows={8}
                                    className="font-mono text-sm bg-gray-50 resize-none pr-10"
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute right-1 top-1 text-gray-400 hover:text-gray-900"
                                    onClick={() => {
                                        copyToClipboard(soldSecret);
                                        toast.success('Đã copy');
                                    }}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => onOpenChange(false)}
                            >
                                Đóng
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                    copyToClipboard(soldSecret);
                                    toast.success('Đã copy');
                                    onOpenChange(false);
                                }}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy & Đóng
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSell} className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg text-sm border space-y-1">
                            <div className="flex justify-between font-semibold text-gray-700">
                                <span>📦 {item?.service}</span>
                                <span className="text-gray-500 font-normal text-xs bg-gray-100 px-2 py-0.5 rounded">
                                    Vốn: {formatCurrency(item?.cost || 0)}
                                </span>
                            </div>
                            <p className="text-gray-500 truncate text-xs font-mono" title={item?.secretPayload}>
                                Data: {item?.secretMasked}
                            </p>
                        </div>

                        <div>
                            <Label>Tên khách hàng</Label>
                            <div className="relative">
                                <Input
                                    value={customerName}
                                    onChange={(e) => {
                                        setCustomerName(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    // Handle blur carefully or use click outside
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    placeholder="Nhập tên khách hàng..."
                                    required
                                    autoComplete="off"
                                />
                                {showSuggestions && customerName && (
                                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map(customer => (
                                                <div
                                                    key={customer.id}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                    onClick={() => handleSelectCustomer(customer)}
                                                >
                                                    <div className="font-medium">{customer.name}</div>
                                                    {customer.contact && (
                                                        <div className="text-xs text-gray-500">{customer.contact}</div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-gray-500">
                                                Nhấn Enter để tạo mới
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Liên hệ (SĐT/Email)</Label>
                                <Input
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="0912..."
                                />
                            </div>
                            <div>
                                <Label>Kênh bán</Label>
                                <Input
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="Fb TPL, Zalo..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Giá bán (VNĐ)</Label>
                                <Input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0"
                                />
                                {item && (
                                    <div className="text-[11px] mt-1 text-right">
                                        {(() => {
                                            const p = parseFloat(price) || 0;
                                            const c = item.cost || 0;
                                            const profit = p - c;
                                            return (
                                                <span className={profit > 0 ? "text-emerald-600 font-medium" : "text-red-500"}>
                                                    Lãi: {formatCurrency(profit)}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label>Thời hạn (Tháng)</Label>
                                <Input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    min="1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Trạng thái thanh toán</Label>
                            <Select
                                value={paymentStatus}
                                onValueChange={(v: 'paid' | 'unpaid') => setPaymentStatus(v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paid">Đã thanh toán (Paid)</SelectItem>
                                    <SelectItem value="unpaid">Chưa thanh toán (Unpaid)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Ghi chú</Label>
                            <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ghi chú thêm..."
                            />
                        </div>

                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận bán'}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
