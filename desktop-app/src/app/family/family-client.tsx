'use client';

import { useState } from 'react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, CreditCard, Calendar, User, Mail, Users2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
    createFamilyAction,
    updateFamilyAction,
    deleteFamilyAction,
    addFamilyMemberAction,
    updateFamilyMemberAction,
    deleteFamilyMemberAction,
    confirmFamilyPaymentAction,
} from '@/app/actions';
import { Family, FamilyMember } from '@/lib/db/schema';

interface FamilyWithMembers extends Family {
    members: FamilyMember[];
}

interface FamilyClientProps {
    families: FamilyWithMembers[];
}

export function FamilyClient({ families }: FamilyClientProps) {
    const router = useRouter();
    const [isAddFamilyOpen, setIsAddFamilyOpen] = useState(false);
    const [editingFamily, setEditingFamily] = useState<Family | null>(null);
    const [addingMemberToFamily, setAddingMemberToFamily] = useState<number | null>(null);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
    const [confirmingPayment, setConfirmingPayment] = useState<number | null>(null);

    const today = new Date();
    const currentDay = today.getDate();

    // Payment status-based color theming
    // Red = Cần thanh toán (payment due)
    // Green = Đã thanh toán / chưa tới ngày (paid / not due yet)
    const getPaymentTheme = (isDue: boolean) => {
        if (isDue) {
            // Red theme for payment due
            return {
                gradient: 'from-red-500/10 via-red-500/5 to-pink-500/10',
                border: 'border-red-100/50',
                badge: 'bg-red-100 text-red-700',
                accent: 'text-red-600',
                iconBg: 'from-red-500 to-red-600',
                owner: 'from-red-50 to-rose-50 border-red-100/60',
                ownerLabel: 'text-red-500',
                button: 'hover:text-red-600 hover:bg-red-50',
            };
        }
        // Green theme for paid/not due
        return {
            gradient: 'from-green-500/10 via-green-500/5 to-emerald-500/10',
            border: 'border-green-100/50',
            badge: 'bg-green-100 text-green-700',
            accent: 'text-green-600',
            iconBg: 'from-green-500 to-green-600',
            owner: 'from-green-50 to-emerald-50 border-green-100/60',
            ownerLabel: 'text-green-500',
            button: 'hover:text-green-600 hover:bg-green-50',
        };
    };

    // Check if payment is due
    // Payment is due when today >= paymentDay in the month of endDate
    // Example: endDate = Feb 8, paymentDay = 8 → due on Feb 8
    const isPaymentDue = (family: Family) => {
        if (!family.paymentDay) return false;

        const endDate = new Date(family.endDate);
        // Create the payment due date: paymentDay in the month of endDate
        const paymentDueDate = new Date(endDate.getFullYear(), endDate.getMonth(), family.paymentDay);

        // Payment is due when today >= paymentDueDate
        return today >= paymentDueDate;
    };

    // Get unique services
    const services = [...new Set(families.map(f => f.service))];
    const defaultService = services[0] || 'YouTube';

    // Group families by service and sort by payment due (due first)
    const familiesByService = new Map<string, FamilyWithMembers[]>();
    for (const family of families) {
        if (!familiesByService.has(family.service)) {
            familiesByService.set(family.service, []);
        }
        familiesByService.get(family.service)!.push(family);
    }
    // Sort each service group
    for (const [service, fams] of familiesByService) {
        fams.sort((a, b) => {
            const aDue = isPaymentDue(a);
            const bDue = isPaymentDue(b);

            // 1. Priority: Payment Due (Critical)
            if (aDue && !bDue) return -1;
            if (!aDue && bDue) return 1;

            // 2. Priority: Empty Slots (Opportunity) - NEW
            const aHasSlots = a.members.length < 5;
            const bHasSlots = b.members.length < 5;
            if (aHasSlots && !bHasSlots) return -1;
            if (!aHasSlots && bHasSlots) return 1;

            // 3. Priority: Payment Day (Soonest first)
            // Both due or both not due - sort by payment day
            return (a.paymentDay || 32) - (b.paymentDay || 32);
        });
    }

    const handleCreateFamily = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await createFamilyAction(formData);
            toast.success('Đã tạo Family mới');
            setIsAddFamilyOpen(false);
            router.refresh();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleUpdateFamily = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingFamily) return;
        const formData = new FormData(e.currentTarget);
        try {
            await updateFamilyAction(editingFamily.id, {
                name: formData.get('name') as string,
                service: formData.get('service') as string,
                ownerAccount: formData.get('ownerAccount') as string,
                startDate: formData.get('startDate') as string,
                endDate: formData.get('endDate') as string,
                paymentCard: formData.get('paymentCard') as string,
                paymentDay: parseInt(formData.get('paymentDay') as string) || null,
                note: formData.get('note') as string,
            });
            toast.success('Đã cập nhật Family');
            setEditingFamily(null);
            router.refresh();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleDeleteFamily = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa Family này và tất cả thành viên?')) return;
        try {
            await deleteFamilyAction(id);
            toast.success('Đã xóa Family');
            router.refresh();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!addingMemberToFamily) return;
        const formData = new FormData(e.currentTarget);
        try {
            await addFamilyMemberAction(addingMemberToFamily, formData);
            toast.success('Đã thêm thành viên');
            setAddingMemberToFamily(null);
            router.refresh();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleUpdateMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingMember) return;
        const formData = new FormData(e.currentTarget);
        try {
            await updateFamilyMemberAction(editingMember.id, {
                slotNumber: parseInt(formData.get('slotNumber') as string) || 1,
                memberName: formData.get('memberName') as string || null,
                memberAccount: formData.get('memberAccount') as string || null,
                startDate: formData.get('startDate') as string || null,
                endDate: formData.get('endDate') as string || null,
                note: formData.get('note') as string || null,
            });
            toast.success('Đã cập nhật thành viên');
            setEditingMember(null);
            router.refresh();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleDeleteMember = async (id: number) => {
        if (!confirm('Xóa thành viên này?')) return;
        try {
            await deleteFamilyMemberAction(id);
            toast.success('Đã xóa thành viên');
            router.refresh();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleConfirmPayment = async (id: number) => {
        setConfirmingPayment(id);
        try {
            await confirmFamilyPaymentAction(id);
            toast.success('Đã xác nhận thanh toán - chuyển sang tháng mới');
            router.refresh();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setConfirmingPayment(null);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '--';
        try {
            return format(new Date(dateStr), 'dd/MM');
        } catch {
            return dateStr;
        }
    };

    const FamilyForm = ({ defaultValues, onSubmit, submitLabel }: {
        defaultValues?: Family;
        onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
        submitLabel: string;
    }) => (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="name">Tên Family *</Label>
                    <Input name="name" defaultValue={defaultValues?.name} placeholder="Fam 1" required />
                </div>
                <div>
                    <Label htmlFor="service">Dịch vụ *</Label>
                    <Input name="service" defaultValue={defaultValues?.service} placeholder="YouTube" required />
                </div>
            </div>
            <div>
                <Label htmlFor="ownerAccount">Tài khoản chủ fam *</Label>
                <Input name="ownerAccount" defaultValue={defaultValues?.ownerAccount} placeholder="email@gmail.com" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                    <Input name="startDate" type="date" defaultValue={defaultValues?.startDate?.split('T')[0]} required />
                </div>
                <div>
                    <Label htmlFor="endDate">Ngày kết thúc *</Label>
                    <Input name="endDate" type="date" defaultValue={defaultValues?.endDate?.split('T')[0]} required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="paymentCard">Thẻ thanh toán</Label>
                    <Input name="paymentCard" defaultValue={defaultValues?.paymentCard || ''} placeholder="visa 8960" />
                </div>
                <div>
                    <Label htmlFor="paymentDay">Ngày thanh toán (1-31)</Label>
                    <Input name="paymentDay" type="number" min="1" max="31" defaultValue={defaultValues?.paymentDay || ''} placeholder="22" />
                </div>
            </div>
            <div>
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea name="note" defaultValue={defaultValues?.note || ''} />
            </div>
            <Button type="submit" className="w-full">{submitLabel}</Button>
        </form>
    );

    const MemberForm = ({ defaultValues, onSubmit, submitLabel }: {
        defaultValues?: FamilyMember;
        onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
        submitLabel: string;
    }) => (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="slotNumber">Slot #</Label>
                    <Input name="slotNumber" type="number" min="1" max="10" defaultValue={defaultValues?.slotNumber || 1} required />
                </div>
                <div>
                    <Label htmlFor="memberName">Tên</Label>
                    <Input name="memberName" defaultValue={defaultValues?.memberName || ''} placeholder="Tên thành viên" />
                </div>
            </div>
            <div>
                <Label htmlFor="memberAccount">Tài khoản</Label>
                <Input name="memberAccount" defaultValue={defaultValues?.memberAccount || ''} placeholder="email@gmail.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="startDate">Bắt đầu</Label>
                    <Input name="startDate" type="date" defaultValue={defaultValues?.startDate?.split('T')[0] || ''} />
                </div>
                <div>
                    <Label htmlFor="endDate">Kết thúc</Label>
                    <Input name="endDate" type="date" defaultValue={defaultValues?.endDate?.split('T')[0] || ''} />
                </div>
            </div>
            <div>
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea name="note" defaultValue={defaultValues?.note || ''} />
            </div>
            <Button type="submit" className="w-full">{submitLabel}</Button>
        </form>
    );

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex gap-4 items-center">
                <Dialog open={isAddFamilyOpen} onOpenChange={setIsAddFamilyOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm Family
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Thêm Family mới</DialogTitle>
                        </DialogHeader>
                        <FamilyForm onSubmit={handleCreateFamily} submitLabel="Tạo Family" />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tabs by service */}
            {services.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <Users2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Chưa có Family nào</p>
                    <p className="text-sm mt-1">Bấm "Thêm Family" để bắt đầu</p>
                </div>
            ) : (
                <Tabs defaultValue={defaultService}>
                    <TabsList className="h-11 bg-slate-100/80 p-1 rounded-xl">
                        {services.map(service => (
                            <TabsTrigger key={service} value={service} className="data-[state=active]:bg-white rounded-lg">
                                {service} ({familiesByService.get(service)?.length || 0})
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {services.map(service => (
                        <TabsContent key={service} value={service} className="space-y-6 mt-6">
                            {familiesByService.get(service)?.map(family => {
                                const paymentDue = isPaymentDue(family);
                                const theme = getPaymentTheme(paymentDue);
                                return (
                                    <Card key={family.id} className="overflow-hidden border border-gray-200/60 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
                                        {/* Enhanced Header with Payment-status-based Gradient */}
                                        <CardHeader className={`pb-4 pt-5 px-6 bg-gradient-to-r ${theme.gradient} border-b ${theme.border}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-3">
                                                    {/* Title with service badge */}
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                                            {family.name}
                                                        </CardTitle>
                                                        <span className={`px-2.5 py-1 text-xs font-semibold ${theme.badge} rounded-full`}>
                                                            {family.service}
                                                        </span>
                                                        {/* Payment Due Badge */}
                                                        {paymentDue && (
                                                            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full animate-pulse">
                                                                ⚠️ Cần thanh toán
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Info Badges */}
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm`}>
                                                            <Calendar className={`h-4 w-4 ${theme.accent}`} />
                                                            <span className={`${theme.accent} font-semibold`}>{formatDate(family.startDate)}</span>
                                                            <span className="text-gray-400 mx-1">→</span>
                                                            <span className={`${theme.accent} font-semibold`}>{formatDate(family.endDate)}</span>
                                                        </span>
                                                        {family.paymentCard && (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">
                                                                <CreditCard className="h-4 w-4 text-emerald-500" />
                                                                <span className="text-emerald-600 font-semibold">{family.paymentCard}</span>
                                                                {family.paymentDay && (
                                                                    <>
                                                                        <span className="text-gray-300">•</span>
                                                                        <span className={`${paymentDue ? 'text-amber-600' : 'text-gray-600'} font-semibold`}>Ngày {family.paymentDay}</span>
                                                                    </>
                                                                )}
                                                            </span>
                                                        )}
                                                        {/* Payment Confirm Button */}
                                                        {paymentDue && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleConfirmPayment(family.id)}
                                                                disabled={confirmingPayment === family.id}
                                                                className="h-8 px-3 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                {confirmingPayment === family.id ? 'Đang xử lý...' : 'Xác nhận đã thanh toán'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingFamily(family)} className={`h-9 w-9 text-gray-400 ${theme.button} rounded-xl transition-colors`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFamily(family.id)} className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 px-6">
                                            <div className={`flex items-center gap-3 mb-5 p-4 bg-gradient-to-r ${theme.owner} rounded-xl border`}>
                                                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${theme.iconBg} flex items-center justify-center shadow-md`}>
                                                    <User className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className={`text-xs font-medium ${theme.ownerLabel} uppercase tracking-wide`}>Chủ Family</span>
                                                    <p className="text-sm font-semibold text-gray-900 font-mono">{family.ownerAccount}</p>
                                                    {family.note && (
                                                        <p className="text-xs text-gray-500 mt-1 truncate" title={family.note}>📝 {family.note}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Members Table - Always show 5 slots */}
                                            {(() => {
                                                const MAX_SLOTS = 5;
                                                // Fix: Count unique occupied slots within range 1-5
                                                const filledCount = new Set(
                                                    family.members
                                                        .map(m => m.slotNumber)
                                                        .filter(s => s >= 1 && s <= MAX_SLOTS)
                                                ).size;
                                                const emptySlots = MAX_SLOTS - filledCount;

                                                // Create array of all 5 slots
                                                const slots = Array.from({ length: MAX_SLOTS }, (_, i) => {
                                                    const slotNum = i + 1;
                                                    const member = family.members.find(m => m.slotNumber === slotNum);
                                                    return { slotNum, member };
                                                });

                                                return (
                                                    <>
                                                        {/* Slot status indicator */}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Users2 className="h-4 w-4 text-gray-400" />
                                                                <span className="text-sm font-medium text-gray-600">
                                                                    Thành viên: <span className={filledCount === MAX_SLOTS ? 'text-green-600' : 'text-amber-600'}>{filledCount}/{MAX_SLOTS}</span>
                                                                </span>
                                                                {emptySlots > 0 && (
                                                                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-600 rounded-full">
                                                                        Còn {emptySlots} slot trống
                                                                    </span>
                                                                )}
                                                                {filledCount === MAX_SLOTS && (
                                                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-50 text-green-600 rounded-full">
                                                                        ✓ Đủ slot
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="bg-gray-50/50">
                                                                    <TableHead className="w-20">#</TableHead>
                                                                    <TableHead>Tên</TableHead>
                                                                    <TableHead>Tài khoản</TableHead>
                                                                    <TableHead className="w-24">Bắt đầu</TableHead>
                                                                    <TableHead className="w-24">Kết thúc</TableHead>
                                                                    <TableHead>Ghi chú</TableHead>
                                                                    <TableHead className="w-24"></TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {slots.map(({ slotNum, member }) => (
                                                                    member ? (
                                                                        <TableRow key={slotNum} className="hover:bg-gray-50">
                                                                            <TableCell className="font-medium text-gray-500">
                                                                                <span className="inline-flex items-center gap-1.5">
                                                                                    <span className="h-2 w-2 rounded-full bg-green-400"></span>
                                                                                    Slot {slotNum}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell>{member.memberName || '--'}</TableCell>
                                                                            <TableCell className="font-mono text-sm text-gray-600">
                                                                                {member.memberAccount || '--'}
                                                                            </TableCell>
                                                                            <TableCell>{formatDate(member.startDate)}</TableCell>
                                                                            <TableCell>{formatDate(member.endDate)}</TableCell>
                                                                            <TableCell className="text-sm text-gray-500 max-w-[200px] truncate" title={member.note || ''}>
                                                                                {member.note || '--'}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="flex gap-1">
                                                                                    <Button variant="ghost" size="icon" onClick={() => setEditingMember(member)} className="h-7 w-7">
                                                                                        <Edit className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteMember(member.id)} className="h-7 w-7 text-red-500 hover:text-red-600">
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ) : (
                                                                        <TableRow key={slotNum} className="bg-gray-50/30 hover:bg-amber-50/30">
                                                                            <TableCell className="font-medium text-gray-400">
                                                                                <span className="inline-flex items-center gap-1.5">
                                                                                    <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                                                                                    Slot {slotNum}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell colSpan={5} className="text-center text-gray-400 italic">
                                                                                Slot trống
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setAddingMemberToFamily(family.id);
                                                                                        // Pre-fill slot number in form (will need to handle this in form)
                                                                                    }}
                                                                                    className="h-7 px-2 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                                                                >
                                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                                    Thêm
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </>
                                                );
                                            })()}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </TabsContent>
                    ))}
                </Tabs>
            )}

            {/* Edit Family Dialog */}
            <Dialog open={!!editingFamily} onOpenChange={() => setEditingFamily(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa Family</DialogTitle>
                    </DialogHeader>
                    {editingFamily && <FamilyForm defaultValues={editingFamily} onSubmit={handleUpdateFamily} submitLabel="Cập nhật" />}
                </DialogContent>
            </Dialog>

            {/* Add Member Dialog */}
            <Dialog open={!!addingMemberToFamily} onOpenChange={() => setAddingMemberToFamily(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Thêm thành viên</DialogTitle>
                    </DialogHeader>
                    <MemberForm onSubmit={handleAddMember} submitLabel="Thêm" />
                </DialogContent>
            </Dialog>

            {/* Edit Member Dialog */}
            <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa thành viên</DialogTitle>
                    </DialogHeader>
                    {editingMember && <MemberForm defaultValues={editingMember} onSubmit={handleUpdateMember} submitLabel="Cập nhật" />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
