'use server';

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'my-accounts.json');

export type AccountCategory = 'personal' | 'work' | 'bank' | 'icloud' | 'entertainment' | 'edu' | 'tools' | 'other';

export interface AccountItem {
    id: string;
    service: string;
    username: string;
    password?: string;
    category: AccountCategory;
    note?: string;
    url?: string;
    updatedAt?: string;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function getAccounts(): Promise<AccountItem[]> {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
        return [];
    }

    try {
        const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
        return JSON.parse(data) as AccountItem[];
    } catch (error) {
        console.error('Error reading accounts:', error);
        return [];
    }
}

export async function saveAccounts(accounts: AccountItem[]): Promise<void> {
    try {
        fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving accounts:', error);
        throw new Error('Failed to save accounts');
    }
}

export async function addAccount(account: Omit<AccountItem, 'id' | 'updatedAt'>): Promise<AccountItem> {
    const accounts = await getAccounts();
    const newAccount = {
        ...account,
        id: Math.random().toString(36).substring(2, 9),
        updatedAt: new Date().toISOString(),
    };
    accounts.push(newAccount);
    await saveAccounts(accounts);
    return newAccount;
}

export async function updateAccount(id: string, updates: Partial<AccountItem>): Promise<void> {
    const accounts = await getAccounts();
    const index = accounts.findIndex(t => t.id === id);
    if (index !== -1) {
        accounts[index] = {
            ...accounts[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await saveAccounts(accounts);
    }
}

export async function deleteAccount(id: string): Promise<void> {
    const accounts = await getAccounts();
    const filtered = accounts.filter(t => t.id !== id);
    await saveAccounts(filtered);
}
