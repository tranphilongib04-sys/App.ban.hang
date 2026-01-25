import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const messages = {
    // Reminder message for renewal
    reminder: (name: string, service: string, endDate: string, accountInfo?: string): string => {
        const accountText = accountInfo ? `: ${accountInfo}` : '';
        return `Mình thấy ${service}${accountText} của bạn sắp hết hạn, mình gia hạn cho bạn luôn nhé!`;
    },

    // Delivery message with credentials
    delivery: (name: string, service: string, credentials: string): string => {
        return `Mình gửi bạn account ${service}: ${credentials}
Bạn thử login nhée`;
    },

    // Warranty replacement message
    warranty: (name: string, service: string, newCredentials: string): string => {
        return `Chào anh/chị ${name},
Em gửi tài khoản mới cho gói ${service}:

${newCredentials}

Anh/chị kiểm tra giúp em nha.`;
    },

    // Thank you message after payment
    thankYou: (name: string, service: string): string => {
        return `Cảm ơn anh/chị ${name} đã thanh toán gói ${service}.
Chúc anh/chị sử dụng dịch vụ vui vẻ!`;
    },
};

// Copy text to clipboard (client-side only)
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
