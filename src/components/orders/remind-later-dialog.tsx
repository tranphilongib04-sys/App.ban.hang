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
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import { updateSubscriptionAction } from '@/app/actions';
import { Bell, Loader2 } from 'lucide-react';

interface RemindLaterDialogProps {
    subscription: SubscriptionWithCustomer;
    children: React.ReactNode;
    onSuccess?: () => void;
}

export function RemindLaterDialog({ subscription, children, onSuccess }: RemindLaterDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Default reminder: Tomorrow? Or user picks
    const defaultDate = subscription.reminderDate
        ? format(new Date(subscription.reminderDate), 'yyyy-MM-dd')
        : format(addDays(new Date(), 1), 'yyyy-MM-dd'); // Default tomorrow

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const reminderDate = formData.get('reminderDate') as string;

        try {
            await updateSubscriptionAction(subscription.id, {
                reminderDate: reminderDate
            });
            toast.success(`Đã hẹn nhắc lại vào ${format(new Date(reminderDate), 'dd/MM/yyyy')}`);
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
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
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Nhắc lại sau</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="reminderDate">Chọn ngày nhắc lại</Label>
                        <Input
                            name="reminderDate"
                            type="date"
                            defaultValue={defaultDate}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Hệ thống sẽ nhắc bạn liên hệ lại vào ngày này.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
                            Lưu
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
