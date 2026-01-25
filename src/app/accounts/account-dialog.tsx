'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
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
import { AccountItem, AccountCategory } from '@/lib/my-accounts';
import { addAccountAction, updateAccountAction } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react';

interface AccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account?: AccountItem;
    onSuccess?: () => void;
}

export function AccountDialog({ open, onOpenChange, account, onSuccess }: AccountDialogProps) {
    const [loading, setLoading] = useState(false);

    const [service, setService] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [category, setCategory] = useState<AccountCategory>('personal');
    const [note, setNote] = useState('');

    // UI state
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (open) {
            if (account) {
                setService(account.service);
                setUsername(account.username);
                setPassword(account.password || '');
                setCategory(account.category);
                setNote(account.note || '');
            } else {
                setService('');
                setUsername('');
                setPassword('');
                setCategory('personal');
                setNote('');
            }
            setShowPassword(false);
        }
    }, [open, account]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!service || !username) {
            toast.error('Vui lòng điền Tên dịch vụ và Tài khoản');
            return;
        }

        setLoading(true);
        try {
            if (account) {
                // Update
                await updateAccountAction(account.id, {
                    service,
                    username,
                    password,
                    category,
                    note
                });
                toast.success('Đã cập nhật tài khoản');
            } else {
                // Create
                await addAccountAction({
                    service,
                    username,
                    password,
                    category,
                    note
                });
                toast.success('Đã thêm tài khoản mới');
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{account ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Tên dịch vụ</Label>
                        <Input
                            value={service}
                            onChange={e => setService(e.target.value)}
                            placeholder="VD: Facebook, VCB, iCloud..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <Label>Phân loại</Label>
                            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="personal">Cá nhân</SelectItem>
                                    <SelectItem value="work">Công việc</SelectItem>
                                    <SelectItem value="bank">Ngân hàng</SelectItem>
                                    <SelectItem value="icloud">iCloud / Apple</SelectItem>
                                    <SelectItem value="entertainment">Giải trí</SelectItem>
                                    <SelectItem value="edu">Giáo dục</SelectItem>
                                    <SelectItem value="tools">Công cụ (Tools)</SelectItem>
                                    <SelectItem value="other">Khác</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-2 pt-2 space-y-3">
                        <div>
                            <Label>Tên đăng nhập / Email</Label>
                            <Input
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="email@example.com hoặc username"
                                required
                            />
                        </div>

                        <div>
                            <Label>Mật khẩu</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label>Ghi chú</Label>
                        <Textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="PIN code, câu hỏi bảo mật, v.v."
                            className="min-h-[80px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {account ? 'Lưu thay đổi' : 'Thêm mới'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
