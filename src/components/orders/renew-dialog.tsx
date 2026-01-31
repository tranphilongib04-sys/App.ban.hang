'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { SubscriptionWithCustomer } from '@/types';
import { format, addMonths, addDays } from 'date-fns';
import { toast } from 'sonner';
import { renewSubscriptionAction } from '@/app/actions';
import { Check, Loader2 } from 'lucide-react';

interface RenewDialogProps {
    subscription: SubscriptionWithCustomer;
    children: React.ReactNode;
    onSuccess?: () => void;
}

export function RenewDialog({ subscription, children, onSuccess }: RenewDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Calculate default dates
    // Start date = Today (Renewal starts immediately)
    const defaultStartDate = format(new Date(), 'yyyy-MM-dd');
    const defaultEndDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await renewSubscriptionAction(subscription.id, formData);
            toast.success('Đã gia hạn thành công!');
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error('Có lỗi xảy ra khi gia hạn');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Gia hạn: {subscription.customerName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div>
                        <Label htmlFor="customerName">Tên khách hàng</Label>
                        <Input
                            name="customerName"
                            defaultValue={subscription.customerName}
                            placeholder="VD: Nguyễn Văn A"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="service">Dịch vụ</Label>
                        <Input
                            name="service"
                            defaultValue={subscription.service}
                            placeholder="VD: ChatGPT Plus"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="startDate">Ngày bắt đầu</Label>
                            <Input
                                name="startDate"
                                type="date"
                                defaultValue={defaultStartDate}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="endDate">Ngày kết hạn</Label>
                            <Input
                                name="endDate"
                                type="date"
                                defaultValue={defaultEndDate}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="revenue">Doanh thu (VNĐ)</Label>
                            <Input
                                name="revenue"
                                type="number"
                                defaultValue={subscription.revenue || 0}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="cost">Chi phí (VNĐ)</Label>
                            <Input
                                name="cost"
                                type="number"
                                defaultValue={subscription.cost || 0}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="accountInfo">Tên tài khoản</Label>
                        <Input
                            name="accountInfo"
                            defaultValue={subscription.accountInfo || ''}
                            placeholder="VD: email@gmail.com | pass"
                        />
                    </div>

                    <div>
                        <Label htmlFor="note">Ghi chú</Label>
                        <Input
                            name="note"
                            defaultValue={subscription.note || ''}
                            placeholder="Ghi chú thêm..."
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            name="paymentStatus"
                            id="paymentStatus"
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <Label htmlFor="paymentStatus" className="font-normal cursor-pointer text-gray-700">
                            Đã thanh toán (Hiện trong 'Hoàn tất hôm nay')
                        </Label>
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        Xác nhận gia hạn
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
