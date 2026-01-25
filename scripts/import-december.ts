// Script to import December 2025 data
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'subtrack.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source TEXT,
    contact TEXT,
    tags TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    service TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    distribution TEXT,
    revenue REAL DEFAULT 0,
    cost REAL DEFAULT 0,
    renewal_status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    last_contacted_at TEXT,
    contact_count INTEGER DEFAULT 0,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL,
    distribution TEXT,
    secret_payload TEXT NOT NULL,
    secret_masked TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    import_batch TEXT,
    cost REAL DEFAULT 0,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
    inventory_id INTEGER NOT NULL REFERENCES inventory_items(id),
    delivered_at TEXT NOT NULL,
    delivery_note TEXT
  );

  CREATE TABLE IF NOT EXISTS warranties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
    issue_date TEXT NOT NULL,
    issue_description TEXT,
    replacement_inventory_id INTEGER REFERENCES inventory_items(id),
    resolved_date TEXT,
    warranty_status TEXT NOT NULL DEFAULT 'pending',
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// December 2025 data
const data = [
  { stt: 1, source: "Zalo", customer: "Lê Huỳnh Quý", account: "lehuynhquy2004@gmail.com", service: "Chatgpt team", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Le Pham", revenue: 120000, cost: 40000, note: "" },
  { stt: 2, source: "Zalo", customer: "Tú Anh", account: "imogener@trendyaff.fashion|Mon123123@", service: "Capcut", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 25000, note: "" },
  { stt: 3, source: "Zalo", customer: "Minh Phượng", account: "Netflix", service: "Chatgpt team", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Le Pham", revenue: 120000, cost: 40000, note: "" },
  { stt: 4, source: "Zalo", customer: "Phạm Phương Trang", account: "kaminikhalsa@gmail.com 2FVZWUc8Z slot 3 5487", service: "Netflix", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Hong Phuoc Tele", revenue: 70000, cost: 55000, note: "" },
  { stt: 5, source: "Zalo", customer: "Hải Quyên", account: "nicolett@amberfield.icu|Mon123123@", service: "Capcut", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 25000, note: "" },
  { stt: 6, source: "Zalo", customer: "Huệ Anh", account: "flail.usher_0z@icloud.com", service: "Spotify", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Long", revenue: 30000, cost: 0, note: "" },
  { stt: 7, source: "Zalo", customer: "Quang Khê", account: "mariahst@ivycore.cyou|Mon123123@", service: "Capcut", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 25000, note: "" },
  { stt: 8, source: "Zalo", customer: "Anna", account: "berniece@zokaweb.xyz|Mon123123@", service: "Capcut", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 25000, note: "" },
  { stt: 9, source: "Zalo", customer: "Danh Xây Dựng", account: "arianna3@quietwave.cfd|Mon123123@", service: "Capcut", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 25000, note: "" },
  { stt: 10, source: "Zalo", customer: "Danh Xây Dựng", account: "ethelsch@blazingmoss.icu|Mon123123@", service: "Capcut", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 25000, note: "" },
  { stt: 11, source: "Zalo", customer: "Danh Xây Dựng", account: "edarusse@ivycore.cyou|Mon123123@", service: "Capcut", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 25000, note: "" },
  { stt: 12, source: "Zalo", customer: "Nguyễn thị Thuý", account: "felicita@teststudent.hair|Mon123123@", service: "Capcut", startDate: "2025-12-01", endDate: "2026-01-01", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 25000, note: "" },
  { stt: 13, source: "Zalo", customer: "Tu ANh", account: "camxinhttttt11111@gmail.com", service: "ytb pre", startDate: "2025-12-03", endDate: "2026-03-03", distribution: "Long", revenue: 111000, cost: 0, note: "" },
  { stt: 14, source: "Zalo", customer: "Nguyễn Đăng Dũng", account: "audios_fable.1k@icloud.com", service: "Spotify", startDate: "2025-11-01", endDate: "2025-12-01", distribution: "Long", revenue: 30000, cost: 0, note: "" },
  { stt: 15, source: "ins tpl", customer: "liloyan_169", account: "46.sole.seaways@icloud.com", service: "Sora", startDate: "2025-12-03", endDate: "2025-12-03", distribution: "Long", revenue: 8000, cost: 0, note: "" },
  { stt: 16, source: "ins tpl", customer: "liloyan_169", account: "spritz.presets-8o@icloud.com", service: "Sora", startDate: "2025-12-03", endDate: "2025-12-03", distribution: "Long", revenue: 8000, cost: 0, note: "" },
  { stt: 17, source: "ins tpl", customer: "liloyan_169", account: "dewy.heel-9k@icloud.com", service: "Sora", startDate: "2025-12-03", endDate: "2025-12-03", distribution: "Long", revenue: 8000, cost: 0, note: "" },
  { stt: 18, source: "ins tpl", customer: "liloyan_169", account: "08.tinpot.firebox@icloud.com", service: "Sora", startDate: "2025-12-03", endDate: "2025-12-03", distribution: "Long", revenue: 8000, cost: 0, note: "" },
  { stt: 19, source: "ins tpl", customer: "liloyan_169", account: "hooky47.striata@icloud.com", service: "Sora", startDate: "2025-12-03", endDate: "2025-12-03", distribution: "Long", revenue: 8000, cost: 0, note: "" },
  { stt: 20, source: "Zalo", customer: "Anna", account: "vikabut@Capcutpro.click|Capcut@69", service: "Capcut", startDate: "2025-12-03", endDate: "2026-01-03", distribution: "Long", revenue: 35000, cost: 35000, note: "" },
  { stt: 21, source: "Zalo", customer: "Anna", account: "keithdm@Capcutpro.click|123456", service: "Capcut", startDate: "2025-12-03", endDate: "2026-01-03", distribution: "Long", revenue: 35000, cost: 35000, note: "" },
  { stt: 22, source: "Zalo", customer: "Quang", account: "huyquang18100505@gmail.com", service: "Ytb pre", startDate: "2025-12-03", endDate: "2025-03-03", distribution: "Long", revenue: 80000, cost: 0, note: "" },
  { stt: 23, source: "Zalo", customer: "Xuân Phú Nexus", account: "pnguyen12606@gmail.com", service: "Ytb pre", startDate: "2025-12-04", endDate: "2026-01-04", distribution: "Long", revenue: 40000, cost: 0, note: "" },
  { stt: 24, source: "Zalo", customer: "Xuân Phú Nexus", account: "0.waifs_narwhal@icloud.com", service: "Chatgpt plus", startDate: "2025-12-04", endDate: "2026-01-04", distribution: "Long", revenue: 70000, cost: 14000, note: "" },
  { stt: 25, source: "Zalo", customer: "Lê Gia Bảo", account: "eaheartcody1@skylerr.shop SLOT 5 - 0556", service: "Netflix", startDate: "2025-12-04", endDate: "2026-01-04", distribution: "Hong Phuoc Tele", revenue: 70000, cost: 55000, note: "" },
  { stt: 26, source: "Zalo", customer: "Lê Thị Ngọc Trâm", account: "30-cue.zenith@icloud.com", service: "Chatgpt plus", startDate: "2025-12-04", endDate: "2026-01-04", distribution: "Long", revenue: 70000, cost: 14000, note: "" },
  { stt: 27, source: "Zalo", customer: "Minh Huyen", account: "ivauf23@helpnow.live MK: Kye03930@#", service: "Netflix extra", startDate: "2025-12-04", endDate: "2026-01-04", distribution: "Hong Phuoc Tele", revenue: 70000, cost: 65000, note: "" },
  { stt: 28, source: "Zalo", customer: "Đỗ Lâm Bảo Ngọc", account: "casket_behalf0k@icloud.com", service: "Chatgpt plus", startDate: "2025-12-04", endDate: "2026-01-04", distribution: "Long", revenue: 70000, cost: 14000, note: "" },
  { stt: 29, source: "Zalo", customer: "Cao Tiến Đạt", account: "have.fillips-3k@icloud.com", service: "Adobe", startDate: "2025-12-05", endDate: "2026-01-05", distribution: "Long", revenue: 40000, cost: 0, note: "" },
  { stt: 30, source: "Zalo", customer: "Quang Khê", account: "hakhue200776@gmail.com", service: "Canva pro", startDate: "2025-12-05", endDate: "2026-12-05", distribution: "Hong Phuoc Tele", revenue: 130000, cost: 90000, note: "" },
  { stt: 31, source: "Zalo", customer: "Vy Tũn", account: "vytunsocial@gmail.com", service: "Chatgpt pro", startDate: "2025-12-05", endDate: "2026-01-05", distribution: "Bot", revenue: 120000, cost: 50000, note: "" },
  { stt: 32, source: "Zalo", customer: "Lin Lin", account: "wcyyz02@abe2.tempdukviet.site a123456", service: "Capcut", startDate: "2025-12-05", endDate: "2026-01-05", distribution: "Batman", revenue: 38000, cost: 35000, note: "" },
  { stt: 33, source: "Zalo", customer: "Liêu Vy", account: "lieuvy1809@gmail.com", service: "Canva pro", startDate: "2025-12-07", endDate: "2026-12-07", distribution: "Hong Phuoc Tele", revenue: 130000, cost: 90000, note: "" },
  { stt: 34, source: "Zalo", customer: "Đinh Quý Vy", account: "douinex+lucile@gmail.com", service: "Netflix extra", startDate: "2025-12-07", endDate: "2026-01-07", distribution: "Hong Phuoc Tele", revenue: 65000, cost: 65000, note: "" },
  { stt: 35, source: "Zalo", customer: "Ngọc Diễm", account: "hlhkz70@ad11.capytumbum.online a123456", service: "Capcut", startDate: "2025-12-07", endDate: "2026-01-07", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 30000, note: "" },
  { stt: 36, source: "Fb TPL", customer: "Cao Minh Quân", account: "gobbler.81trinity@icloud.com", service: "Chatgpt plus", startDate: "2025-12-08", endDate: "2026-01-08", distribution: "Long", revenue: 70000, cost: 22000, note: "" },
  { stt: 37, source: "Fb TPL", customer: "Nguyễn Hải Quân", account: "stuffer.eight_9s@icloud.com", service: "Chatgpt plus", startDate: "2025-12-08", endDate: "2026-01-08", distribution: "Long", revenue: 70000, cost: 14000, note: "" },
  { stt: 38, source: "Zalo", customer: "Bảo Trân", account: "capers.mound.7v@icloud.com", service: "Chatgpt plus", startDate: "2025-12-08", endDate: "2026-01-08", distribution: "Long", revenue: 70000, cost: 14000, note: "" },
  { stt: 39, source: "Zalo", customer: "Lii", account: "mumps.ire7z@icloud.com", service: "Chatgpt plus", startDate: "2025-12-09", endDate: "2026-01-09", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 40, source: "Zalo", customer: "Kim Ngân", account: "cuhocvan@gmail.com", service: "Chatgpt plus", startDate: "2025-12-10", endDate: "2026-01-10", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 41, source: "Zalo", customer: "Minh Phương", account: "daisies_jambs_6k@icloud.com", service: "Spotify", startDate: "2025-12-10", endDate: "2026-03-10", distribution: "Long", revenue: 30000, cost: 0, note: "Code 3m free" },
  { stt: 42, source: "Zalo", customer: "Anna", account: "eg8bd55y4r@hunght1890.com", service: "Capcut", startDate: "2025-12-10", endDate: "2026-01-10", distribution: "hinh su", revenue: 15000, cost: 7000, note: "" },
  { stt: 43, source: "Zalo", customer: "Phương Thảo", account: "phalanx-seal.5l@icloud.com", service: "Chatgpt plus", startDate: "2025-12-10", endDate: "2026-01-10", distribution: "Long", revenue: 60000, cost: 8000, note: "" },
  { stt: 44, source: "Zalo", customer: "Thân Trọng", account: "orbital-15.scurvy@icloud.com", service: "Spotify", startDate: "2025-12-10", endDate: "2026-02-10", distribution: "Long", revenue: 60000, cost: 0, note: "" },
  { stt: 45, source: "Zalo", customer: "Hoàng Nguyễn", account: "cutelight493299@cute.webmmo.io.vn", service: "Veo3", startDate: "2025-12-10", endDate: "2025-12-10", distribution: "Clonzen", revenue: 70000, cost: 45000, note: "" },
  { stt: 46, source: "Zalo", customer: "Lê Võ Quang Kỳ", account: "gotici7082@alexida.com|tuongdeptrai", service: "Capcut", startDate: "2025-12-10", endDate: "2026-01-10", distribution: "Tele", revenue: 14000, cost: 8000, note: "" },
  { stt: 47, source: "Fb TPL", customer: "Nguyễn Văn Tuấn", account: "", service: "ver gg1", startDate: "2025-12-10", endDate: "2025-12-10", distribution: "Bot ver", revenue: 100000, cost: 30000, note: "" },
  { stt: 48, source: "Zalo", customer: "Quỳnh Chi", account: "trchi257@gmail.com", service: "Spotify", startDate: "2025-12-11", endDate: "2026-01-10", distribution: "Long", revenue: 30000, cost: 0, note: "" },
  { stt: 49, source: "Zalo", customer: "Phú Bùi", account: "t1lvnhe9lj@hunght1890.com:123123", service: "Capcut", startDate: "2025-12-11", endDate: "2025-12-18", distribution: "Bot", revenue: 7000, cost: 3000, note: "" },
  { stt: 50, source: "Zalo", customer: "Huyền Quách", account: "pvjqd25@ac40.capytumbum.online|a123456", service: "Capcut", startDate: "2025-12-12", endDate: "2026-01-12", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 30000, note: "" },
  { stt: 51, source: "ins TPL", customer: "linhling0802", account: "isank46@ac40.capytumbum.online|a123456", service: "Capcut", startDate: "2025-12-12", endDate: "2026-01-12", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 30000, note: "" },
  { stt: 52, source: "Zalo", customer: "Trần Huỳnh Trâm", account: "pjfxt45@ad20.capytumbum.online", service: "Capcut", startDate: "2025-12-12", endDate: "2026-01-12", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 30000, note: "" },
  { stt: 53, source: "Fb TPL", customer: "Linh Linh", account: "zczgv33@ac39.capytumbum.online|a123456", service: "Capcut", startDate: "2025-12-12", endDate: "2026-01-12", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 30000, note: "" },
  { stt: 54, source: "Zalo", customer: "Phú Bùi", account: "spice.weirs9e@icloud.com", service: "Canva Edu", startDate: "2025-12-12", endDate: "2026-01-12", distribution: "Long", revenue: 25000, cost: 0, note: "" },
  { stt: 55, source: "Zalo", customer: "Huy", account: "wamelon@vivu.top Netflix123@2 slot 1 7644", service: "Netflix", startDate: "2025-12-13", endDate: "2026-01-13", distribution: "Hong Phuoc Tele", revenue: 70000, cost: 60000, note: "" },
  { stt: 56, source: "Zalo", customer: "Huy Quang", account: "jennings@teststudent.hair Mon123123@", service: "Capcut", startDate: "2025-12-13", endDate: "2026-01-13", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 25000, note: "" },
  { stt: 57, source: "Zalo", customer: "Anna", account: "halrohan@quietwave.cfd Mon123123@", service: "Capcut", startDate: "2025-12-13", endDate: "2026-01-13", distribution: "Hong Phuoc Tele", revenue: 35000, cost: 25000, note: "" },
  { stt: 58, source: "Zalo", customer: "Khánh Ngọc By Ngân Đỗ", account: "wamelon@vivu.top Netflix123@2 slot 2 5634", service: "Netflix", startDate: "2025-12-13", endDate: "2026-01-13", distribution: "Hong Phuoc Tele", revenue: 70000, cost: 60000, note: "" },
  { stt: 59, source: "Zalo", customer: "Quang Anh", account: "quanganh05062002@gmail.com", service: "Chatgpt plus", startDate: "2025-12-13", endDate: "2026-01-13", distribution: "Long", revenue: 70000, cost: 10000, note: "" },
  { stt: 60, source: "Zalo", customer: "Vy Tùn", account: "ezequiel@happyzoomer.us Mon123123@", service: "Capcut", startDate: "2025-12-14", endDate: "2026-01-14", distribution: "", revenue: 35000, cost: 25000, note: "" },
  { stt: 61, source: "Zalo", customer: "Vy Tùn", account: "precious@thejuly.shop Premium32saa", service: "Netflix", startDate: "2025-12-14", endDate: "2026-01-14", distribution: "Hong Phuoc Tele", revenue: 70000, cost: 60000, note: "" },
  { stt: 62, source: "Zalo", customer: "Hân", account: "brisk.habitat_7i@icloud.com", service: "Chatgpt plus", startDate: "2025-12-14", endDate: "2026-01-14", distribution: "Long", revenue: 70000, cost: 10000, note: "" },
  { stt: 63, source: "Zalo", customer: "Lương Thị Diệu Hiền", account: "ltdh1900@gmail.com", service: "Chatgpt pro", startDate: "2025-12-14", endDate: "2026-01-14", distribution: "Long", revenue: 120000, cost: 0, note: "" },
  { stt: 64, source: "Ins TBQ", customer: "Minh nguyen", account: "minhlearn441@gmail.com", service: "Cousera", startDate: "2025-12-14", endDate: "2025-01-14", distribution: "Hong Phuoc Tele", revenue: 200000, cost: 170000, note: "" },
  { stt: 65, source: "Zalo", customer: "Nguyễn Linh Đan", account: "stems-peaches1n@icloud.com", service: "Chatgpt plus", startDate: "2025-12-15", endDate: "2026-01-15", distribution: "Long", revenue: 70000, cost: 10000, note: "" },
  { stt: 66, source: "Zalo", customer: "Lực Nguyễn", account: "dillanwi@brightwave.rest Mon123123@", service: "Capcut", startDate: "2025-12-15", endDate: "2026-01-15", distribution: "Bot", revenue: 35000, cost: 25000, note: "" },
  { stt: 67, source: "Zalo", customer: "Vân Ly", account: "84u5iirdu4@hunght1890.com:123123", service: "Capcut", startDate: "2025-12-15", endDate: "2025-12-22", distribution: "Bot", revenue: 7000, cost: 3000, note: "" },
  { stt: 68, source: "Zalo", customer: "Hồng Phúc", account: "worms.cots9v@icloud.com", service: "Chatgpt plus", startDate: "2025-12-15", endDate: "2026-01-15", distribution: "Long", revenue: 70000, cost: 10000, note: "" },
  { stt: 70, source: "Zalo", customer: "Tien", account: "derekdixony1yw@wallacecreations.net", service: "Chatgpt plus", startDate: "2025-12-15", endDate: "2026-01-15", distribution: "Long", revenue: 70000, cost: 10000, note: "" },
  { stt: 71, source: "Zalo", customer: "Võ Tòng", account: "mahout-overage.7s@icloud.com", service: "Chatgpt plus", startDate: "2025-12-15", endDate: "2026-01-15", distribution: "Long", revenue: 70000, cost: 10000, note: "" },
  { stt: 72, source: "Zalo", customer: "Võ Tòng", account: "beadier-toasts-6h@icloud.com", service: "Chatgpt plus", startDate: "2025-12-15", endDate: "2026-01-15", distribution: "Long", revenue: 70000, cost: 10000, note: "" },
  { stt: 73, source: "Zalo", customer: "Nguyentay Nguyen", account: "hydrant_micros_5t@icloud.com", service: "Spotify", startDate: "2025-12-16", endDate: "2026-01-16", distribution: "Long", revenue: 70000, cost: 0, note: "" },
  { stt: 74, source: "Zalo", customer: "Thanh Thuỷ", account: "alright_09_chilled@icloud.com", service: "Chatgpt plus", startDate: "2025-12-16", endDate: "2026-01-16", distribution: "Long", revenue: 70000, cost: 10000, note: "" },
  { stt: 75, source: "Zalo", customer: "Thanh Tuyền", account: "jannie4@clicknichezone.shop|Mon123123@", service: "Capcut", startDate: "2025-12-16", endDate: "2026-01-16", distribution: "Bot", revenue: 35000, cost: 15000, note: "" },
  { stt: 76, source: "Zalo", customer: "Kim Chi", account: "laths_choker4a@icloud.com", service: "Chatgpt plus", startDate: "2025-12-16", endDate: "2026-02-16", distribution: "Long", revenue: 140000, cost: 20000, note: "" },
  { stt: 77, source: "Zalo", customer: "Truong Bao Nhi", account: "outside-clips-2r@icloud.com", service: "Chatgpt plus", startDate: "2025-12-17", endDate: "2026-01-17", distribution: "Long", revenue: 70000, cost: 10000, note: "" },
  { stt: 78, source: "Zalo", customer: "Kha", account: "sashagri@tinybizhub.xyz", service: "Capcut", startDate: "2025-12-17", endDate: "2026-01-17", distribution: "bot", revenue: 35000, cost: 0, note: "" },
  { stt: 79, source: "Zalo", customer: "Nguyễn Thuỳ Anh", account: "myd800191@gmail.com", service: "Spotify", startDate: "2025-12-17", endDate: "2026-12-17", distribution: "Long", revenue: 270000, cost: 0, note: "" },
  { stt: 80, source: "Zalo", customer: "Nguyễn Đăng Dũng", account: "sting.whines.66@icloud.com", service: "Spotify", startDate: "2025-12-18", endDate: "2026-01-18", distribution: "Long", revenue: 30000, cost: 0, note: "" },
  { stt: 81, source: "Zalo", customer: "Phạm Hải Yến", account: "mackmura@zenithwave.website|Mon123123@", service: "Capcut", startDate: "2025-12-18", endDate: "2026-01-18", distribution: "Long", revenue: 35000, cost: 15000, note: "" },
  { stt: 82, source: "Fb tpl", customer: "Nguyên Lofi", account: "scoop-parries8p@icloud.com", service: "Chatgpt plus", startDate: "2025-12-18", endDate: "2026-01-18", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 83, source: "Zalo", customer: "Phú Bùi", account: "joy8@quietwave.cfd|Mon123123@", service: "Capcut", startDate: "2025-12-19", endDate: "2026-01-19", distribution: "bot", revenue: 35000, cost: 15000, note: "" },
  { stt: 84, source: "Zalo", customer: "Nguyễn Nguyễn Thái Hà", account: "thaihanguyennguyen@gmail.com", service: "Chatgpt pro", startDate: "2025-12-19", endDate: "2026-01-19", distribution: "Long", revenue: 130000, cost: 0, note: "" },
  { stt: 85, source: "Zalo", customer: "Kimmu Hua", account: "sashagri@tinybizhub.xyz|Mon123123@", service: "Capcut pro", startDate: "2025-12-19", endDate: "2026-01-19", distribution: "bot", revenue: 35000, cost: 15000, note: "" },
  { stt: 86, source: "Zalo", customer: "Như", account: "Nhustt17@gmail.com", service: "ytb pre", startDate: "2026-11-29", endDate: "2026-02-28", distribution: "Long", revenue: 111000, cost: 0, note: "" },
  { stt: 87, source: "Zalo", customer: "Cẩm Nhung", account: "wardschr@tinybizhub.xyz|Mon123123@", service: "Capcut", startDate: "2025-12-19", endDate: "2026-01-19", distribution: "bot", revenue: 35000, cost: 15000, note: "" },
  { stt: 88, source: "Zalo", customer: "Mai Hương", account: "dollybla@radiantforge.bond|Mon123123@", service: "Capcut", startDate: "2025-12-20", endDate: "2026-01-20", distribution: "Bot", revenue: 35000, cost: 15000, note: "" },
  { stt: 89, source: "Zalo", customer: "QMy", account: "sandraku@happyzoomer.us|Mon123123@", service: "Capcut", startDate: "2025-12-20", endDate: "2026-01-20", distribution: "Bot", revenue: 35000, cost: 15000, note: "" },
  { stt: 90, source: "Zalo", customer: "Anna", account: "ernestin@techhub.lol|Mon123123@", service: "Capcut", startDate: "2025-12-20", endDate: "2026-01-20", distribution: "Bot", revenue: 15000, cost: 15000, note: "" },
  { stt: 91, source: "Fb JAy", customer: "Vũ Hoài Thương", account: "thaihanguyennguyen@gmail.com", service: "MS365", startDate: "2025-12-20", endDate: "2026-12-20", distribution: "Hong Phuoc Tele", revenue: 160000, cost: 120000, note: "" },
  { stt: 92, source: "Zalo", customer: "Trang Lê", account: "Dryvermouth2106@gmail.com", service: "Chatgpt pro", startDate: "2025-12-21", endDate: "2026-01-21", distribution: "Long", revenue: 130000, cost: 0, note: "" },
  { stt: 93, source: "Zalo", customer: "Bảo", account: "bao0917750562@gmail.com", service: "ytb pre", startDate: "2025-12-21", endDate: "2026-03-21", distribution: "Long", revenue: 111000, cost: 0, note: "" },
  { stt: 94, source: "Zalo", customer: "Linh Tiêu", account: "tieulinh01102001@gmail.com", service: "Spotify", startDate: "2025-12-21", endDate: "2026-03-21", distribution: "Long", revenue: 90000, cost: 33000, note: "" },
  { stt: 95, source: "Zalo", customer: "Lê Võ Quang Kỳ", account: "theanade@fastlearnhub.site|Mon123123@", service: "Capcut", startDate: "2025-12-21", endDate: "2026-01-21", distribution: "Bot", revenue: 35000, cost: 15000, note: "" },
  { stt: 96, source: "Zalo", customer: "Huyền Quách", account: "sandraku@happyzoomer.us|Mon123123@", service: "Capcut", startDate: "2025-12-21", endDate: "2026-01-21", distribution: "Bot", revenue: 35000, cost: 0, note: "" },
  { stt: 97, source: "Zalo", customer: "Yến Nhi", account: "theater_harvest33@icloud.com", service: "Chatgpt plus", startDate: "2025-12-22", endDate: "2026-01-22", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 98, source: "Zalo", customer: "Tài Phạm", account: "Minhtai9803@gmail.com", service: "Chatgpt pro", startDate: "2025-12-22", endDate: "2026-01-22", distribution: "VinhDo", revenue: 130000, cost: 0, note: "" },
  { stt: 99, source: "Zalo", customer: "Bùi Duy Hung", account: "fprwgnkya3@hunght1890.com:123123", service: "Capcut", startDate: "2025-12-22", endDate: "2025-12-29", distribution: "Bot", revenue: 7000, cost: 4000, note: "" },
  { stt: 100, source: "Zalo", customer: "Vương Nga Daiichi", account: "mikelpf44@helpnow.live phimhay2233ss5655TTGG", service: "Netflix", startDate: "2025-12-22", endDate: "2026-01-22", distribution: "Trần Quốc Vỹ", revenue: 80000, cost: 55000, note: "" },
  { stt: 101, source: "Zalo", customer: "Tuyết Trân", account: "bop-spoiled.40@icloud.com", service: "Chatgpt plus", startDate: "2025-12-22", endDate: "2026-01-22", distribution: "Long", revenue: 70000, cost: 10000, note: "" },
  { stt: 102, source: "Zalo", customer: "Lin Lin", account: "bobbypro@quietwave.cfd|Mon123123@", service: "Capcut", startDate: "2025-12-22", endDate: "2026-01-22", distribution: "Bot", revenue: 35000, cost: 12000, note: "" },
  { stt: 103, source: "Zalo", customer: "Hải Yến", account: "smell_yaps5z@icloud.com", service: "Chatgpt plus", startDate: "2025-12-23", endDate: "2026-01-23", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 104, source: "Zalo", customer: "Vũ Trường Huy", account: "msgteam20066@gmail.com", service: "Chatgpt pro", startDate: "2025-12-23", endDate: "2026-01-23", distribution: "Vinh Do", revenue: 120000, cost: 0, note: "" },
  { stt: 105, source: "Zalo", customer: "Vũ Trường Huy", account: "vutruonghuy3@gmail.com", service: "Chatgpt pro", startDate: "2025-12-23", endDate: "2026-01-23", distribution: "Vinh Do", revenue: 120000, cost: 0, note: "" },
  { stt: 106, source: "Zalo", customer: "Thuý Vinhomes", account: "heather3@zenithwave.website|Mon123123@", service: "Capcut", startDate: "2025-12-23", endDate: "2026-01-23", distribution: "Bot", revenue: 35000, cost: 12000, note: "" },
  { stt: 107, source: "Zalo", customer: "Anna", account: "wava90@crispfeather.boats|Mon123123@", service: "Capcut", startDate: "2025-12-23", endDate: "2026-01-23", distribution: "Bot", revenue: 25000, cost: 12000, note: "" },
  { stt: 108, source: "Zalo", customer: "Trần Phúc Anh", account: "train_hope_5b@icloud.com", service: "Chatgpt plus", startDate: "2025-12-23", endDate: "2026-01-23", distribution: "Hong Phuoc Tele", revenue: 80000, cost: 50000, note: "" },
  { stt: 109, source: "Zalo", customer: "Linh Mìii", account: "basho.gabled_5q@icloud.com", service: "Chatgpt plus", startDate: "2025-12-23", endDate: "2026-01-23", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 110, source: "Zalo", customer: "Hưng Cocacola", account: "pdofdlf05.es@loopout.shop July9090@@", service: "Netflix", startDate: "2025-12-23", endDate: "2026-03-23", distribution: "Hong Phuoc Tele", revenue: 200000, cost: 165000, note: "" },
  { stt: 111, source: "Zalo", customer: "Kim Ngân", account: "odium.doltish3a@icloud.com", service: "Chatgpt plus", startDate: "2025-12-24", endDate: "2026-01-24", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 112, source: "Zalo", customer: "Diẽm Quỳnh", account: "rules-atrial-4f@icloud.com", service: "Chatgpt plus", startDate: "2025-12-24", endDate: "2026-01-24", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 113, source: "Zalo", customer: "Lê Thị Ý", account: "felicita@fastcheckmail.homes|Mon123123@", service: "Capcut pro", startDate: "2025-12-24", endDate: "2026-01-24", distribution: "Bot", revenue: 35000, cost: 12000, note: "" },
  { stt: 114, source: "Zalo", customer: "Hoang", account: "wava90@crispfeather.boats|Mon123123@", service: "Capcut pro", startDate: "2025-12-24", endDate: "2026-01-24", distribution: "Bot", revenue: 30000, cost: 12000, note: "" },
  { stt: 115, source: "Zalo", customer: "Hoai Trang", account: "barbara.cryr@gmail.com", service: "Gamma", startDate: "2025-12-25", endDate: "2026-01-25", distribution: "Hong Phuoc Tele", revenue: 150000, cost: 120000, note: "" },
  { stt: 116, source: "Ins tpl", customer: "bundaumayo", account: "freidaro@happyzoomer.us|Mon123123@", service: "Capcut pro", startDate: "2025-12-25", endDate: "2026-01-25", distribution: "Bot", revenue: 30000, cost: 12000, note: "" },
  { stt: 117, source: "Zalo", customer: "Tuan", account: "pipinsaq+katheryn@gmail.com phimhay7772AA", service: "Netflix", startDate: "2025-12-25", endDate: "2026-01-25", distribution: "Vỹ", revenue: 70000, cost: 55000, note: "" },
  { stt: 118, source: "Zalo", customer: "Kim Ngân", account: "cayoskygowyz@hotmail.com", service: "Sora 2", startDate: "2025-12-27", endDate: "2026-01-27", distribution: "Long", revenue: 80000, cost: 35000, note: "" },
  { stt: 119, source: "Fb js", customer: "Trong Nhan", account: "qhan3955@gmail.com", service: "Spotify", startDate: "2025-12-28", endDate: "2026-01-28", distribution: "Long", revenue: 30000, cost: 0, note: "" },
  { stt: 120, source: "Zalo", customer: "Mèo", account: "milkryuu111@gmail.com", service: "Spotify", startDate: "2025-12-28", endDate: "2026-01-28", distribution: "Long", revenue: 30000, cost: 0, note: "" },
  { stt: 121, source: "Zalo", customer: "Hà Thục Anh", account: "obscure_canopy_3x@icloud.com", service: "Spotify", startDate: "2025-12-28", endDate: "2026-03-28", distribution: "Long", revenue: 90000, cost: 0, note: "" },
  { stt: 122, source: "Zalo", customer: "Nguyễn Lan Anh", account: "chanhhocbai@gmail.com", service: "Ytb", startDate: "2025-12-28", endDate: "2026-01-28", distribution: "Long", revenue: 37000, cost: 0, note: "" },
  { stt: 123, source: "Zalo", customer: "Viêt Anh", account: "tabitha5@ivycore.cyou|Mon123123@", service: "Capcut pro", startDate: "2025-12-28", endDate: "2026-01-28", distribution: "Bot", revenue: 35000, cost: 12000, note: "" },
  { stt: 124, source: "Fb JS", customer: "Lương Hiền", account: "sensual_23tequila@icloud.com", service: "Chatgpt plus", startDate: "2025-12-29", endDate: "2026-12-29", distribution: "Hong Phuoc Tele", revenue: 80000, cost: 50000, note: "" },
  { stt: 125, source: "Zalo", customer: "Anna", account: "mauricio@amberfield.icu|Mon123123@", service: "Capcut pro", startDate: "2025-12-29", endDate: "2026-12-29", distribution: "Bot", revenue: 25000, cost: 12000, note: "" },
  { stt: 126, source: "Zalo", customer: "Lê Quỳnh Như", account: "haitn.gpt@gmail.com", service: "Chatgpt plus", startDate: "2025-12-29", endDate: "2026-12-29", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 127, source: "Zalo", customer: "Ngan", account: "31carving-arums@icloud.com", service: "Chatgpt plus", startDate: "2025-12-30", endDate: "2026-01-30", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 128, source: "Zalo", customer: "Thảo Nguyên", account: "8t5uu1mrjc@hunght1890.com", service: "Capcut pro", startDate: "2025-12-30", endDate: "2026-01-30", distribution: "Bot", revenue: 7000, cost: 3000, note: "" },
  { stt: 129, source: "Zalo", customer: "Lê Gia Bảo", account: "baodeptraikothedungthuhai@gmail.com", service: "Canva EDU", startDate: "2025-12-30", endDate: "2026-12-30", distribution: "Canva EDU", revenue: 80000, cost: 0, note: "" },
  { stt: 130, source: "Zalo", customer: "Lê Thị Ngọc Trâm", account: "alliesch@mmoninja.pics|Mon123123@", service: "Capcut pro", startDate: "2025-12-30", endDate: "2026-01-30", distribution: "Bot", revenue: 35000, cost: 12000, note: "" },
  { stt: 131, source: "Zalo", customer: "Loan Hồng", account: "unghongloan@gmail.com", service: "Spotify", startDate: "2025-12-30", endDate: "2026-01-30", distribution: "Long", revenue: 30000, cost: 0, note: "" },
  { stt: 132, source: "Zalo", customer: "An Khánh", account: "elouise8@trendyaff.fashion", service: "Capcut pro", startDate: "2025-12-30", endDate: "2026-01-30", distribution: "Bot", revenue: 35000, cost: 12000, note: "" },
  { stt: 133, source: "Zalo", customer: "Phạm Phương Trang", account: "trangbi878@gmail.com", service: "Ytb pre", startDate: "2025-12-30", endDate: "2026-01-30", distribution: "Long", revenue: 40000, cost: 0, note: "" },
  { stt: 134, source: "Zalo", customer: "Phạm Phương Trang", account: "clarissayates71+sky@gmail.com", service: "Netflix", startDate: "2025-12-30", endDate: "2026-01-30", distribution: "Vỹ zalo", revenue: 70000, cost: 55000, note: "" },
  { stt: 135, source: "Zalo", customer: "Đinh Trần Anh Tuấn", account: "9.villas.weekday@icloud.com", service: "Chatgpt plus", startDate: "2025-12-31", endDate: "2026-01-31", distribution: "Long", revenue: 70000, cost: 8000, note: "" },
  { stt: 136, source: "Zalo", customer: "Tom", account: "mac2@trendyaff.fashion", service: "Capcut pro", startDate: "2025-12-31", endDate: "2026-01-31", distribution: "Bot", revenue: 35000, cost: 12000, note: "" },
  { stt: 137, source: "Zalo", customer: "Bảo Ngọc", account: "joanyhan@trendyaff.fashion|Mon123123@", service: "Capcut pro", startDate: "2025-12-31", endDate: "2026-01-31", distribution: "Bot", revenue: 35000, cost: 12000, note: "" },
  { stt: 138, source: "Zalo", customer: "Bùi Duy Hưng", account: "celineba@solarpetals.space|Mon123123@", service: "Capcut pro", startDate: "2025-12-31", endDate: "2026-01-31", distribution: "Bot", revenue: 30000, cost: 12000, note: "" },
];

// Helper to mask secret
function maskSecret(secret: string): string {
  if (!secret || secret.length <= 8) return '****';
  const parts = secret.split('|');
  if (parts.length === 2) {
    const email = parts[0];
    const maskedEmail = email.slice(0, 4) + '****' + (email.includes('@') ? email.slice(email.indexOf('@')) : '');
    return `${maskedEmail}|****`;
  }
  return secret.slice(0, 4) + '****' + secret.slice(-2);
}

// Create customer map to avoid duplicates
const customerMap = new Map<string, number>();

// Prepare statements
const insertCustomer = db.prepare(`
  INSERT INTO customers (name, source, contact, tags, note, created_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
`);

const findCustomer = db.prepare(`SELECT id FROM customers WHERE name = ?`);

const insertSubscription = db.prepare(`
  INSERT INTO subscriptions (customer_id, service, start_date, end_date, distribution, revenue, cost, renewal_status, payment_status, contact_count, note, account_info, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'renewed', 'paid', 0, ?, ?, datetime('now'))
`);

// Add Nguyen Van A customer if exists (from test)
const testCustomer = findCustomer.get('Nguyen Van A') as { id: number } | undefined;
if (testCustomer) {
  customerMap.set('Nguyen Van A', testCustomer.id);
}

// Truncate existing subscriptions to avoid duplicates when re-running
db.prepare("DELETE FROM subscriptions WHERE start_date < '2026-01-01'").run();

// Import data
let customersAdded = 0;
let subscriptionsAdded = 0;

for (const row of data) {
  if (!row.customer || row.customer.trim() === '') continue;

  // Get or create customer
  let customerId = customerMap.get(row.customer);
  if (!customerId) {
    const existing = findCustomer.get(row.customer) as { id: number } | undefined;
    if (existing) {
      customerId = existing.id;
    } else {
      const result = insertCustomer.run(row.customer, row.source, '', '', '');
      customerId = Number(result.lastInsertRowid);
      customersAdded++;
    }
    customerMap.set(row.customer, customerId);
  }

  // Create subscription
  insertSubscription.run(
    customerId,
    row.service,
    row.startDate,
    row.endDate,
    row.distribution,
    row.revenue,
    row.cost,
    row.note,
    row.account
  );
  subscriptionsAdded++;
}

console.log(`✅ Import completed!`);
console.log(`   Customers added: ${customersAdded}`);
console.log(`   Subscriptions added: ${subscriptionsAdded}`);
console.log(`   Total customers in DB: ${customerMap.size}`);

db.close();
