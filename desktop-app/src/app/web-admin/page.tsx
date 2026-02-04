import { WebAdminClient } from './web-admin-client';
import { WebAdminAdvanced } from './web-admin-advanced';

export default function WebAdminPage() {
    // Toggle between basic and advanced
    const useAdvanced = process.env.NEXT_PUBLIC_WEB_ADMIN_ADVANCED === 'true';

    return useAdvanced ? <WebAdminAdvanced /> : <WebAdminClient />;
}
