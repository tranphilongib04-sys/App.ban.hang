# 🚀 Deploy tự động (Netlify + Git)

Sau khi setup xong, mỗi lần bạn **push code lên GitHub**, Netlify sẽ **tự động build và deploy** — không cần chạy lệnh tay.

---

## Bước 1: Đẩy code lên GitHub

Nếu repo chưa có trên GitHub:

```bash
cd /Users/tranphilong/Desktop/dark-observatory

# Tạo repo trên GitHub (github.com → New repository), rồi:
git remote add origin https://github.com/<username>/<repo-name>.git
git branch -M main
git push -u origin main
```

Nếu đã có remote:

```bash
git add .
git commit -m "Setup auto deploy"
git push origin main
```

---

## Bước 2: Kết nối Netlify với GitHub

1. Vào **[Netlify Dashboard](https://app.netlify.com/)** → **Add new site** → **Import an existing project**.
2. Chọn **GitHub** (hoặc GitLab/Bitbucket).
3. Authorize Netlify nếu được hỏi.
4. **Choose a repository**: chọn repo `dark-observatory` (hoặc tên repo của bạn).
5. **Configure build settings** — quan trọng:

   | Ô | Giá trị |
   |---|--------|
   | **Branch to deploy** | `main` |
   | **Base directory** | `tbq-homie-deployment` |
   | **Build command** | *(để trống hoặc)* `# no build` |
   | **Publish directory** | `tbq-homie-deployment` (hoặc `.` nếu Base directory đã là `tbq-homie-deployment`) |

   **Lưu ý:** Vì site nằm trong thư mục con `tbq-homie-deployment`, bạn **bắt buộc** điền **Base directory** = `tbq-homie-deployment`. Khi đó:
   - **Publish directory** để `.` (tức là publish từ trong `tbq-homie-deployment`).

6. **Environment variables**: Click **Add environment variables** → thêm các biến (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, DELIVERY_SECRET, …) như trong `DEPLOY_GUIDE.md`.
7. Click **Deploy site**.

---

## Bước 3: Kiểm tra deploy tự động

1. Trong Netlify: **Site overview** → **Production deploys**.
2. Sửa 1 file bất kỳ trong `tbq-homie-deployment`, commit và push:

   ```bash
   cd /Users/tranphilong/Desktop/dark-observatory
   echo "# test" >> tbq-homie-deployment/README.md
   git add tbq-homie-deployment/README.md
   git commit -m "Test auto deploy"
   git push origin main
   ```

3. Vào lại **Production deploys** trên Netlify — sẽ thấy deploy mới chạy tự động (triggered by Git).

---

## Tóm tắt

| Hành động | Kết quả |
|-----------|--------|
| Push lên `main` | Netlify tự build & deploy |
| Base directory | `tbq-homie-deployment` |
| Env vars | Cấu hình trong Netlify Dashboard |

Sau khi làm xong 3 bước trên, **deploy tự động** đã bật. Cứ push code là site cập nhật.
