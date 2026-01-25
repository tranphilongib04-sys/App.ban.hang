'use client';

import { useState } from 'react';
import { Template } from '@/lib/templates';
import { replaceVariables } from '@/lib/variable-replacer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Copy, Pencil, Trash2, Wand2 } from 'lucide-react';
import { TemplateEditor } from './template-editor';
import { deleteTemplateAction } from '@/app/actions';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/messages';

interface TemplatesPageClientProps {
    templates: Template[];
}

export function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | undefined>(undefined);

    // Group templates by Service
    const services = Array.from(new Set(templates.map(t => t.service))).sort();
    const serviceTabs = ['all', ...services];

    // Test context for preview (In real app, this would come from selected order/customer context)
    // For now we assume generic context or maybe allow user to "Test" with dummy data
    const dummyContext = {
        customerName: 'Anh Tuấn',
        service: 'Netflix Premium',
        price: 70000,
        endDate: '25/02/2026'
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.content.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === 'all' || t.service === activeTab;
        return matchesSearch && matchesTab;
    });

    const handleCopy = async (content: string) => {
        // In the future, we might check if there is a 'current selected customer' in global state
        // For now, if variables exist, we warn or just replace with placeholder text?
        // Let's replace with placeholders kept as is, but maybe highlight them?
        // Actually, let's just copy raw content for now unless we are in a context-aware mode.
        // Wait, the user wants "Auto fill". Since this page is standalone, 
        // we can't autofill unless we passed context. 
        // Let's stick to raw copy first, but maybe providing a "Preview" mode later.

        // BETTER IDEA: If variables present, show a mini prompt to fill them? 
        // Or just copy as is (Raw). Most users of this page might copy to Zalo and edit there.

        await copyToClipboard(content);
        toast.success('Đã copy nội dung!');
    };

    const handleEdit = (template: Template) => {
        setEditingTemplate(template);
        setIsEditorOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa mẫu này?')) return;
        try {
            await deleteTemplateAction(id);
            toast.success('Đã xóa mẫu');
        } catch {
            toast.error('Lỗi khi xóa');
        }
    };

    const handleCreate = () => {
        setEditingTemplate(undefined);
        setIsEditorOpen(true);
    };

    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'sale': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Báo giá</Badge>;
            case 'renewal': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Gia hạn</Badge>;
            case 'support': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none">Hỗ trợ</Badge>;
            default: return <Badge variant="secondary">Chung</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quick Reply Templates</h1>
                    <p className="text-gray-500">Manage your canned responses for various services</p>
                </div>
                <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm mẫu mới
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm mẫu tin nhắn..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white/50 backdrop-blur rounded-xl p-1 h-auto flex-wrap justify-start gap-1">
                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
                        Tất cả
                    </TabsTrigger>
                    {services.map(service => (
                        <TabsTrigger key={service} value={service} className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                            {service}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map(template => (
                            <Card key={template.id} className="liquid-card hover:shadow-md transition-all group flex flex-col h-full bg-white/40">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {getCategoryBadge(template.category)}
                                            <CardTitle className="text-base font-semibold mt-2 group-hover:text-indigo-700 transition-colors">
                                                {template.title}
                                            </CardTitle>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleEdit(template)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDelete(template.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">{template.service}</p>
                                </CardHeader>
                                <CardContent className="flex-1 pb-3">
                                    <div className="bg-gray-50/50 rounded-lg p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap leading-relaxed border border-gray-100 min-h-[100px]" onClick={() => handleCopy(template.content)}>
                                        {template.content}
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button
                                        size="lg"
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm active:scale-95 transition-all"
                                        onClick={() => handleCopy(template.content)}
                                    >
                                        <Copy className="mr-2 h-5 w-5" />
                                        Sao chép nhanh
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}

                        {filteredTemplates.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-400">
                                <Wand2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Không tìm thấy mẫu tin nhắn nào</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <TemplateEditor
                open={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                template={editingTemplate}
                services={services}
            />
        </div>
    );
}
