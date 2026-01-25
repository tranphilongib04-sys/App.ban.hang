'use client';

import { useState } from 'react';
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
import { Template, TemplateCategory } from '@/lib/templates';
import { VARIABLES } from '@/lib/variable-replacer';
import { addTemplateAction, updateTemplateAction } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TemplateEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: Template; // If provided, edit mode
    services: string[]; // List of existing services to suggest
    onSuccess?: () => void;
}

export function TemplateEditor({ open, onOpenChange, template, services, onSuccess }: TemplateEditorProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(template?.title || '');
    const [content, setContent] = useState(template?.content || '');
    const [service, setService] = useState(template?.service || '');
    const [category, setCategory] = useState<TemplateCategory>(template?.category || 'general');

    // Reset when opening for new item
    // Note: This simple effect might run too often, relying on key chang or manual reset is better in parent

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !service) {
            toast.error('Vui lòng điền đủ thông tin');
            return;
        }

        setLoading(true);
        try {
            if (template) {
                // Update
                await updateTemplateAction(template.id, {
                    title,
                    content,
                    service,
                    category
                });
                toast.success('Đã cập nhật mẫu tin nhắn');
            } else {
                // Create
                await addTemplateAction({
                    title,
                    content,
                    service,
                    category
                });
                toast.success('Đã tạo mẫu tin nhắn mới');
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const insertVariable = (variableKey: string) => {
        setContent(prev => prev + ` ${variableKey} `);
    };

    // Gather unique services for autocomplete/select (combobox would be better but select is simpler for now)
    // We'll allow typing custom service if we use Input, or just use Input for service always to be flexible

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{template ? 'Sửa tin nhắn mẫu' : 'Thêm tin nhắn mẫu'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tiêu đề (Để mình nhớ)</Label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="VD: Báo giá CapCut"
                                required
                            />
                        </div>
                        <div>
                            <Label>Dịch vụ</Label>
                            <Input
                                value={service}
                                onChange={e => setService(e.target.value)}
                                placeholder="VD: CapCut, Spotify..."
                                list="services-list"
                                required
                            />
                            <datalist id="services-list">
                                {services.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                    </div>

                    <div>
                        <Label>Phân loại</Label>
                        <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">Chung</SelectItem>
                                <SelectItem value="sale">Báo giá / Bán hàng</SelectItem>
                                <SelectItem value="renewal">Gia hạn</SelectItem>
                                <SelectItem value="support">Hỗ trợ kỹ thuật</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <Label>Nội dung tin nhắn</Label>
                            <div className="flex gap-1">
                                {VARIABLES.map(v => (
                                    <Button
                                        key={v.key}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 bg-gray-50 text-indigo-600 border-indigo-100 hover:bg-indigo-50"
                                        onClick={() => insertVariable(v.key)}
                                        title={v.label}
                                    >
                                        {v.key}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Nội dung tin nhắn..."
                            className="min-h-[150px] font-mono text-sm"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Mẹo: Dùng các nút bấm trên để chèn biến tự động (Tên khách, Giá tiền...).
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {template ? 'Lưu thay đổi' : 'Tạo mới'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
