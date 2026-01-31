'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubscriptionWithCustomer } from '@/types';
import { updateSubscriptionAction } from '@/app/actions';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditOrderDialogProps {
    subscription: SubscriptionWithCustomer;
    trigger?: React.ReactNode;
}

export function EditOrderDialog({ subscription, trigger }: EditOrderDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const data = {
                customerName: formData.get('customerName') as string,
                service: formData.get('service') as string,
                revenue: parseFloat(formData.get('revenue') as string) || 0,
                cost: parseFloat(formData.get('cost') as string) || 0,
                startDate: formData.get('startDate') as string,
                endDate: formData.get('endDate') as string,
                accountInfo: formData.get('accountInfo') as string,
                note: formData.get('note') as string,
            };

            await updateSubscriptionAction(subscription.id, data);
            toast.success('Đã cập nhật đơn hàng');
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa đơn hàng - {subscription.customerName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Label htmlFor="customerName">Tên khách hàng</Label>
                        <Input
                            name="customerName"
                            defaultValue={subscription.customerName}
                            required
                        />
                    </div>

                    <div className="col-span-2">
                        <Label htmlFor="service">Dịch vụ</Label>
                        <Input
                            name="service"
                            defaultValue={subscription.service}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="startDate">Ngày bắt đầu</Label>
                        <Input
                            name="startDate"
                            type="date"
                            defaultValue={subscription.startDate.split('T')[0]}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="endDate">Ngày kết thúc</Label>
                        <Input
                            name="endDate"
                            type="date"
                            defaultValue={subscription.endDate.split('T')[0]}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="revenue">Doanh thu (VNĐ)</Label>
                        <Input
                            name="revenue"
                            type="number"
                            defaultValue={subscription.revenue || 0}
                        />
                    </div>

                    <div>
                        <Label htmlFor="cost">Chi phí (VNĐ)</Label>
                        <Input
                            name="cost"
                            type="number"
                            defaultValue={subscription.cost || 0}
                        />
                    </div>

                    <div className="col-span-2">
                        <Label htmlFor="accountInfo">Thông tin tài khoản/Key</Label>
                        <Textarea
                            name="accountInfo"
                            defaultValue={subscription.accountInfo || ''}
                            placeholder="user|pass..."
                            className="font-mono"
                        />
                    </div>

                    <div className="col-span-2">
                        <Label htmlFor="note">Ghi chú</Label>
                        <Textarea
                            name="note"
                            defaultValue={subscription.note || ''}
                        />
                    </div>

                    <div className="col-span-2 flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
