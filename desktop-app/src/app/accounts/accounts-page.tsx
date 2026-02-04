'use client';

import { useState } from 'react';
import { AccountItem, AccountCategory } from '@/lib/my-accounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Copy, Pencil, Trash2, Lock, Eye, EyeOff, SearchCode, ShieldCheck, Wallet } from 'lucide-react';
import { AccountDialog } from './account-dialog';
import { deleteAccountAction } from '@/app/actions';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/messages';
import { cn } from '@/lib/utils';

interface AccountsPageClientProps {
    accounts: AccountItem[];
}

export function AccountsPageClient({ accounts }: AccountsPageClientProps) {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<AccountItem | undefined>(undefined);

    const categories: { id: string, label: string }[] = [
        { id: 'all', label: 'Tất cả' },
        { id: 'bank', label: 'Ngân hàng' },
        { id: 'icloud', label: 'iCloud' },
        { id: 'tools', label: 'Tools' },
        { id: 'edu', label: 'Edu Mail' },
        { id: 'entertainment', label: 'Giải trí' },
        { id: 'personal', label: 'Cá nhân' },
        { id: 'other', label: 'Khác' },
    ];

    const filteredAccounts = accounts.filter(acc => {
        const term = search.toLowerCase();
        const matchesSearch = acc.service.toLowerCase().includes(term) ||
            acc.username.toLowerCase().includes(term) ||
            (acc.note || '').toLowerCase().includes(term);
        const matchesTab = activeTab === 'all' || acc.category === activeTab;
        return matchesSearch && matchesTab;
    });

    const categoriesInUse = new Set(accounts.map(a => a.category));

    const handleCopy = async (text: string, label: string) => {
        if (!text) return;
        await copyToClipboard(text);
        toast.success(`Đã copy ${label}`);
    };

    const toggleReveal = (id: string) => {
        const newSet = new Set(revealedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setRevealedIds(newSet);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
        try {
            await deleteAccountAction(id);
            toast.success('Đã xóa tài khoản');
        } catch {
            toast.error('Lỗi khi xóa');
        }
    };

    const handleEdit = (acc: AccountItem) => {
        setEditingAccount(acc);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingAccount(undefined);
        setIsDialogOpen(true);
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'bank': return Wallet;
            case 'icloud': return ShieldCheck;
            case 'tools': return SearchCode;
            default: return Lock;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="h-6 w-6 text-indigo-600" />
                        Kho Tài Khoản
                    </h1>
                    <p className="text-gray-500">Lưu trữ bảo mật các tài khoản cá nhân, ngân hàng, tools...</p>
                </div>
                <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm tài khoản
                </Button>
            </div>

            {/* Search */}
            <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Tìm kiếm tài khoản, email, dịch vụ..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-white"
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white/50 backdrop-blur rounded-xl p-1 h-auto flex-wrap justify-start gap-1">
                    {categories.map(cat => (
                        // Only show tabs that have items (or 'all') to keep it clean
                        (cat.id === 'all' || categoriesInUse.has(cat.id as any)) && (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.id}
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                            >
                                {cat.label}
                            </TabsTrigger>
                        )
                    ))}
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAccounts.map(acc => {
                            const isRevealed = revealedIds.has(acc.id);
                            const Icon = getCategoryIcon(acc.category);

                            return (
                                <Card key={acc.id} className="liquid-card hover:border-indigo-200 transition-all group flex flex-col h-full bg-white/40">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-semibold text-gray-900 leading-tight">
                                                        {acc.service}
                                                    </CardTitle>
                                                    <p className="text-xs text-gray-500 capitalize">{acc.category}</p>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={() => handleEdit(acc)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600" onClick={() => handleDelete(acc.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="flex-1 pb-3 pt-2 space-y-3">
                                        {/* Username Group */}
                                        <div
                                            className="group/field relative bg-gray-50/80 rounded-lg p-2.5 border border-gray-100 hover:border-indigo-100 transition-colors cursor-pointer"
                                            onClick={() => handleCopy(acc.username, 'Tài khoản')}
                                            title="Click để copy tài khoản"
                                        >
                                            <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider mb-0.5">Tài khoản</p>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-mono text-sm text-gray-800 truncate select-all">{acc.username}</p>
                                                <Copy className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover/field:opacity-100 transition-opacity" />
                                            </div>
                                        </div>

                                        {/* Password Group */}
                                        {acc.password && (
                                            <div
                                                className="group/field relative bg-gray-50/80 rounded-lg p-2.5 border border-gray-100 hover:border-indigo-100 transition-colors"
                                            >
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Mật khẩu</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600"
                                                        onClick={(e) => { e.stopPropagation(); toggleReveal(acc.id); }}
                                                    >
                                                        {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                                <div
                                                    className="flex items-center justify-between gap-2 cursor-pointer"
                                                    onClick={() => handleCopy(acc.password || '', 'Mật khẩu')}
                                                    title="Click để copy mật khẩu"
                                                >
                                                    <p className={cn(
                                                        "font-mono text-sm truncate select-all flex-1",
                                                        isRevealed ? "text-indigo-700 font-medium" : "text-gray-400 tracking-widest"
                                                    )}>
                                                        {isRevealed ? acc.password : '••••••••'}
                                                    </p>
                                                    <Copy className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover/field:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Note */}
                                        {acc.note && (
                                            <div className="pt-1">
                                                <p className="text-xs text-gray-500 italic bg-amber-50/50 p-2 rounded border border-amber-100/50">
                                                    {acc.note}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter className="pt-0 pb-3 justify-between text-[10px] text-gray-400">
                                        <span></span>
                                        {/* Could show last updated here */}
                                    </CardFooter>
                                </Card>
                            );
                        })}

                        {filteredAccounts.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-400">
                                <Lock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Không tìm thấy tài khoản nào</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <AccountDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                account={editingAccount}
            />
        </div>
    );
}
