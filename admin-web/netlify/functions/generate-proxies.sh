#!/bin/bash
# Generate flattened proxy files for Netlify

cd "$(dirname "$0")"

# Auth
echo "module.exports = require('./api/auth/login.js');" > auth-login.js
echo "module.exports = require('./api/auth/setup-first-admin.js');" > auth-setup-first-admin.js

# Admin
echo "module.exports = require('./api/admin/stock.js');" > admin-stock.js
echo "module.exports = require('./api/admin/orders.js');" > admin-orders.js 
echo "module.exports = require('./api/admin/users.js');" > admin-users.js
echo "module.exports = require('./api/admin/audit-logs.js');" > admin-audit-logs.js
echo "module.exports = require('./api/admin/export.js');" > admin-export.js

# Ops
echo "module.exports = require('./api/ops/renew.js');" > ops-renew.js
echo "module.exports = require('./api/ops/step.js');" > ops-step.js
echo "module.exports = require('./api/ops/today.js');" > ops-today.js
echo "module.exports = require('./api/ops/renewals.js');" > ops-renewals.js
echo "module.exports = require('./api/ops/message-log.js');" > ops-message-log.js

# Sync
echo "module.exports = require('./api/sync/push.js');" > sync-push.js
echo "module.exports = require('./api/sync/pull.js');" > sync-pull.js
echo "module.exports = require('./api/sync/pull-readonly.js');" > sync-pull-readonly.js

echo "✅ Generated $(ls -1 *-*.js | wc -l) proxy files"
