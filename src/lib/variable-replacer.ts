export interface VariableContext {
    customerName?: string;
    service?: string;
    price?: number;
    endDate?: string;
    [key: string]: any;
}

export const VARIABLES = [
    { key: '{ten_khach}', label: 'Tên khách hàng', example: 'Anh Tuấn' },
    { key: '{dich_vu}', label: 'Dịch vụ', example: 'Netflix Premium' },
    { key: '{gia}', label: 'Giá tiền', example: '70.000 đ' },
    { key: '{ngay_het_han}', label: 'Ngày hết hạn', example: '25/02/2026' },
];

export function replaceVariables(content: string, context?: VariableContext): string {
    if (!context) return content;

    let result = content;

    if (context.customerName) {
        result = result.replace(/{ten_khach}/g, context.customerName);
        // Also support English placeholder just in case
        result = result.replace(/{customer_name}/g, context.customerName);
    }

    if (context.service) {
        result = result.replace(/{dich_vu}/g, context.service);
        result = result.replace(/{service}/g, context.service);
    }

    if (context.price !== undefined) {
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.price);
        result = result.replace(/{gia}/g, formattedPrice);
        result = result.replace(/{price}/g, formattedPrice);
    }

    if (context.endDate) {
        // Simple date formatting if needed, assuming ISO string or similar
        const date = new Date(context.endDate);
        const formattedDate = !isNaN(date.getTime())
            ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
            : context.endDate;

        result = result.replace(/{ngay_het_han}/g, formattedDate);
        result = result.replace(/{end_date}/g, formattedDate);
    }

    return result;
}
