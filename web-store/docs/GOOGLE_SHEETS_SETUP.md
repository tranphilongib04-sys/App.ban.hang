# Hướng dẫn cài đặt Google Sheets API cho Tồn Kho

## Bước 1: Tạo Google Sheet "Tồn Kho"

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo **Bảng tính mới** → Đặt tên: **"Tồn Kho"**
3. Tạo header ở dòng 1 với các cột:

| A | B | C | D | E |
|---|---|---|---|---|
| product_code | secret | status | reserved_order | created_at |

4. **Lưu lại Sheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID_Ở_ĐÂY]/edit
   ```

---

## Bước 2: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Đặt tên: **"TBQ-Homie-Inventory"** → **Create**
4. Chờ project được tạo xong

---

## Bước 3: Bật Google Sheets API

1. Trong project vừa tạo, vào **APIs & Services** → **Library**
2. Tìm kiếm **"Google Sheets API"**
3. Click **Enable**

---

## Bước 4: Tạo Service Account

1. Vào **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **"Service Account"**
3. Điền thông tin:
   - Service account name: **tbq-inventory**
   - Click **Create and Continue**
   - Skip role selection → **Continue**
   - Click **Done**

4. Click vào service account vừa tạo
5. Vào tab **"Keys"** → **"Add Key"** → **"Create new key"**
6. Chọn **JSON** → **Create**
7. File JSON sẽ được tải xuống (GIỮ BÍ MẬT!)

---

## Bước 5: Chia sẻ Sheet với Service Account

1. Mở file JSON vừa tải, copy **client_email** (dạng: `xxx@project.iam.gserviceaccount.com`)
2. Mở Google Sheet "Tồn Kho"
3. Click **Share** → Paste email service account
4. Chọn **Editor** → **Send**

---

## Bước 6: Cấu hình Netlify Environment Variables

Vào Netlify Dashboard → Site Settings → Environment Variables → Add:

| Variable | Value |
|----------|-------|
| `GOOGLE_SHEETS_ID` | Sheet ID từ bước 1 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | client_email từ file JSON |
| `GOOGLE_PRIVATE_KEY` | private_key từ file JSON (bao gồm `-----BEGIN...-----END-----`) |

---

## Hoàn tất!

Sau khi cấu hình xong, báo cho tôi biết để tiếp tục implement code.
