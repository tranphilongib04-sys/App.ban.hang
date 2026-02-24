'use server';

import * as fs from 'fs';
import * as path from 'path';

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;

const DATA_DIR = path.join(process.cwd(), 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');

export type TemplateCategory = 'sale' | 'renewal' | 'support' | 'general';

export interface Template {
    id: string;
    service: string; // 'General', 'Netflix', 'CapCut', etc.
    title: string;
    content: string;
    category: TemplateCategory;
}

const DEFAULT_TEMPLATES: Template[] = [
    {
        id: '1',
        service: 'Capcut',
        title: 'Báo giá CapCut Pro',
        category: 'sale',
        content: `Capcut pro mình đang bán **35k/tháng**, full bảo hành trong thời hạn, thanh toán khi log in thành công ạ.`
    },
    {
        id: '2',
        service: 'Giao sau',
        title: 'Báo giá Giao sau',
        category: 'sale',
        content: `Gói giao sau mình đang bán **30k/tháng**, full bảo hành trong thời hạn, thanh toán khi xử lý xong thành công.`
    },
    {
        id: '3',
        service: 'ChatGPT',
        title: 'Báo giá ChatGPT Plus',
        category: 'sale',
        content: `Chatgpt mình đang bán **70k/tháng**\nHàng acc cấp, ko dùng chung, có thể share được 3-4 thiết bị, thanh toán khi log in thành công ạ`
    },
    {
        id: '4',
        service: 'ChatGPT',
        title: 'Gia hạn ChatGPT',
        category: 'renewal',
        content: `ChatGPT mình đang có 2 options:\nOption 1: Gia hạn tk cũ: **90k/tháng**\nOption 2: Cấp tk mới: **70k/tháng**`
    },
    {
        id: '5',
        service: 'General',
        title: 'Nhắc gia hạn (Mẫu chung)',
        category: 'renewal',
        content: `Chào {ten_khach}, gói {dich_vu} của bạn sắp hết hạn vào ngày {ngay_het_han}. Bạn có muốn gia hạn tiếp không ạ?`
    }
];

// Ensure data directory exists (skip on Vercel - read-only filesystem)
function ensureDataDir() {
    if (isVercel) return;
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    } catch (error) {
        console.error('Cannot create data directory:', error);
    }
}

export async function getTemplates(): Promise<Template[]> {
    // On Vercel, return default templates
    if (isVercel) {
        return DEFAULT_TEMPLATES;
    }

    ensureDataDir();

    if (!fs.existsSync(TEMPLATES_FILE)) {
        await saveTemplates(DEFAULT_TEMPLATES);
        return DEFAULT_TEMPLATES;
    }

    try {
        const data = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
        return JSON.parse(data) as Template[];
    } catch (error) {
        console.error('Error reading templates:', error);
        return DEFAULT_TEMPLATES;
    }
}

export async function saveTemplates(templates: Template[]): Promise<void> {
    if (isVercel) {
        throw new Error('Tính năng lưu mẫu chỉ hoạt động trên App local');
    }

    ensureDataDir();

    try {
        fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving templates:', error);
        throw new Error('Failed to save templates');
    }
}

export async function addTemplate(template: Omit<Template, 'id'>): Promise<Template> {
    if (isVercel) {
        throw new Error('Tính năng lưu mẫu chỉ hoạt động trên App local');
    }

    const templates = await getTemplates();
    const newTemplate = {
        ...template,
        id: Math.random().toString(36).substring(2, 9),
    };
    templates.push(newTemplate);
    await saveTemplates(templates);
    return newTemplate;
}

export async function updateTemplate(id: string, updates: Partial<Template>): Promise<void> {
    if (isVercel) {
        throw new Error('Tính năng lưu mẫu chỉ hoạt động trên App local');
    }

    const templates = await getTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
        templates[index] = { ...templates[index], ...updates };
        await saveTemplates(templates);
    }
}

export async function deleteTemplate(id: string): Promise<void> {
    if (isVercel) {
        throw new Error('Tính năng lưu mẫu chỉ hoạt động trên App local');
    }

    const templates = await getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await saveTemplates(filtered);
}

