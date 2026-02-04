# 🚀 Web Admin - Quick Reference Card

## 📍 Access
```
URL: http://127.0.0.1:3210/web-admin
```

## 🔄 Toggle Mode

```bash
# Bật Advanced
./scripts/toggle-web-admin-advanced.sh on

# Tắt (về Basic)
./scripts/toggle-web-admin-advanced.sh off

# Restart
npm run dev
```

## 🎯 2 Modes

### Basic (Mặc định)
- 4 tabs: Dashboard / Orders / Inventory / Settings
- Xem + Giao hàng

### Advanced (Mới)
- 6 tabs: Products / Stock / Customers / Analytics / Automation / Logs
- Full CRUD + Bulk import + Analytics

## 📦 Common Tasks

### 1. Giao hàng thủ công
```
Orders tab → Filter "Đã thanh toán"
→ Click "Giao" → Nhập TK|MK → Send
```

### 2. Import stock (Advanced)
```
Stock tab → "Import Stock"
→ Chọn product → Paste TK|MK list
→ Import
```

### 3. Thêm sản phẩm (Advanced)
```
Products tab → "Thêm sản phẩm"
→ Fill form → Save
```

### 4. Xem analytics (Advanced)
```
Analytics tab → Select range
→ View charts + stats
```

### 5. Tìm khách VIP (Advanced)
```
Customers tab → Sort by "Tổng chi tiêu"
```

## 🔑 API Setup

```bash
# 1. Generate token
node scripts/generate-admin-token.js

# 2. Add to Netlify
ADMIN_API_TOKEN=<token>

# 3. Deploy
git push

# 4. Config in app
Settings tab → Paste token → Save
```

## 🔌 API Endpoints

### Basic Mode
```
GET  /admin-orders
POST /admin-orders
GET  /inventory
```

### Advanced Mode (+ New)
```
GET    /products
POST   /products
PUT    /products/:id
DELETE /products/:id

POST   /stock-units/bulk
GET    /stock-units

GET    /customers
GET    /analytics
GET    /webhook-logs
```

## 📊 Tabs Overview

| Tab | Basic | Advanced | Key Feature |
|-----|-------|----------|-------------|
| Dashboard | ✅ | ✅ | Stats overview |
| Orders | ✅ | ✅ | Manual delivery |
| Inventory | ✅ | - | Stock summary |
| Settings | ✅ | - | API config |
| **Products** | ❌ | ✅ | **CRUD products** |
| **Stock** | ❌ | ✅ | **Bulk import** |
| **Customers** | ❌ | ✅ | **Analytics** |
| **Analytics** | ❌ | ✅ | **Charts** |
| **Automation** | ❌ | ✅ | **Auto-delivery** |
| **Logs** | ❌ | ✅ | **Webhooks** |

## 🛠️ Troubleshooting

### ❌ 401 Unauthorized
```
→ Check token in Settings
→ Verify Netlify env var
→ Redeploy site
```

### ❌ No data
```
→ Click "Làm mới"
→ Check Network tab (F12)
→ Verify API URL
```

### ❌ UI broken
```
→ Reload page (Cmd+R)
→ Check console (F12)
→ Restart server
```

## 📁 File Locations

### Frontend
```
src/app/web-admin/
├── page.tsx              # Router
├── web-admin-client.tsx  # Basic
└── web-admin-advanced.tsx # Advanced
```

### Backend
```
tbq-homie-deployment/netlify/functions/
├── admin-orders.js       # Basic
├── inventory.js          # Basic
├── products.js           # Advanced
├── stock-units.js        # Advanced
├── customers.js          # Advanced
├── analytics.js          # Advanced
└── webhook-logs.js       # Advanced
```

### Docs
```
WEB_ADMIN_SETUP.md          # Setup full
QUICK_TEST_WEB_ADMIN.md     # Test guide
WEB_ADMIN_ADVANCED_FEATURES.md # Advanced docs
WEB_ADMIN_SUMMARY.md        # Comparison
WEB_ADMIN_COMPLETE.md       # Complete guide
CHANGELOG_WEB_ADMIN.md      # Version history
WEB_ADMIN_QUICK_REF.md      # This file
```

## ⚡ Shortcuts

### Workflow: Thêm product mới
```
1. Advanced mode ON
2. Products tab → Add
3. Stock tab → Import 50 units
4. Done! Live on web
```

### Workflow: Export stock
```
1. Stock tab
2. "Export Available" button
3. CSV download
```

### Workflow: Find VIP
```
1. Customers tab
2. Sort by revenue DESC
3. Top 10 = VIP
```

## 🎨 Icons

| Icon | Meaning |
|------|---------|
| 🌐 | Web Admin |
| 📦 | Products |
| 📋 | Stock |
| 👥 | Customers |
| 📊 | Analytics |
| ⚡ | Automation |
| 📝 | Logs |
| ➕ | Add |
| ✏️ | Edit |
| 🗑️ | Delete |
| 👁️ | Show/Hide |
| ⬆️ | Import |
| ⬇️ | Export |
| 🔍 | Search |
| 🔄 | Refresh |
| ⚙️ | Settings |

## 📞 Quick Help

```bash
# Check logs
F12 → Console

# Check network
F12 → Network → Filter by /netlify/functions

# Check env
cat .env.local

# Restart
npm run dev

# Generate token
node scripts/generate-admin-token.js

# Toggle mode
./scripts/toggle-web-admin-advanced.sh
```

## ✅ Checklist - Daily Use

**Morning:**
- [ ] Open Web Admin
- [ ] Check pending orders
- [ ] Giao hàng cho đơn paid

**End of day:**
- [ ] Check Analytics
- [ ] Review customer list
- [ ] Export reports

**Weekly:**
- [ ] Import stock nếu < 10
- [ ] Review top products
- [ ] Check webhook logs

---

**Print this card for quick reference!** 📄
