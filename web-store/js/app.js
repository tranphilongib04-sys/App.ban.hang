// PRODUCT DATA
const products = {
    chatgpt: {
        id: 'chatgpt',
        name: 'ChatGPT',
        category: 'AI',
        description: 'Trợ lý AI thông minh nhất hiện nay, hỗ trợ viết lách, code, và nhiều tác vụ khác',
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
        featured: true,
        rating: 4.8,
        reviewCount: 34,
        variants: [
            { name: 'ChatGPT Plus - Cấp TK mới', price: 70000, duration: '1 tháng', note: '' },
            { name: 'ChatGPT Plus - Gia hạn TK cũ', price: 90000, duration: '1 tháng', note: 'Khách cần gửi TK/MK qua Zalo' },
            { name: 'ChatGPT Pro', price: 100000, duration: '1 tháng', note: 'Hỗ trợ bảo hành khi hết credit' },
            { name: 'ChatGPT Go', price: 120000, duration: '1 năm', note: 'Bảo hành 1 tháng' }
        ],
        tabs: {
            description: `
                <h3>Về ChatGPT</h3>
                <p>ChatGPT là trợ lý AI mạnh mẽ nhất hiện nay, được phát triển bởi OpenAI. Với khả năng hiểu và xử lý ngôn ngữ tự nhiên vượt trội, ChatGPT có thể giúp bạn:</p>
                <ul>
                    <li>Viết và chỉnh sửa văn bản chuyên nghiệp</li>
                    <li>Lập trình và debug code</li>
                    <li>Phân tích dữ liệu và tạo báo cáo</li>
                    <li>Dịch thuật đa ngôn ngữ</li>
                    <li>Sáng tạo nội dung marketing</li>
                    <li>Và nhiều tác vụ khác</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li><strong>ChatGPT Plus cấp TK mới:</strong> Bảo hành đến hết tháng</li>
                    <li><strong>ChatGPT Plus gia hạn:</strong> Bảo hành đến hết tháng</li>
                    <li><strong>ChatGPT Pro:</strong> Hỗ trợ bảo hành khi hết credit</li>
                    <li><strong>ChatGPT Go:</strong> Bảo hành 1 tháng</li>
                </ul>
                <p>Nếu có bất kỳ vấn đề gì, vui lòng liên hệ Zalo: 0988428496 để được hỗ trợ ngay lập tức.</p>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <p><strong>Đối với gói cấp TK mới:</strong></p>
                <ul>
                    <li>Sau khi thanh toán, bạn sẽ nhận được tài khoản/mật khẩu qua Zalo</li>
                    <li>Đăng nhập tại chat.openai.com</li>
                    <li>Bắt đầu sử dụng ngay</li>
                </ul>
                <p><strong>Đối với gói gia hạn TK cũ:</strong></p>
                <ul>
                    <li>Gửi tài khoản/mật khẩu của bạn qua Zalo: 0988428496</li>
                    <li>Chờ admin gia hạn (15-30 phút)</li>
                    <li>Nhận thông báo khi hoàn tất</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Tài khoản có bị khóa không?</strong></p>
                <p>A: Tài khoản được đảm bảo an toàn, có chính sách bảo hành rõ ràng.</p>
                <p><strong>Q: Có thể đổi mật khẩu không?</strong></p>
                <p>A: Với gói cấp TK mới, bạn có thể đổi mật khẩu tự do.</p>
                <p><strong>Q: Thanh toán như thế nào?</strong></p>
                <p>A: Chuyển khoản qua ngân hàng, sau đó gửi bill qua Zalo.</p>
            `
        }
    },
    netflix: {
        id: 'netflix',
        name: 'Netflix',
        category: 'Giải trí',
        description: 'Xem phim và chương trình truyền hình không giới hạn với chất lượng HD/4K',
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
        featured: true,
        rating: 4.7,
        reviewCount: 29,
        variants: [
            { name: 'Netflix Extra', price: 70000, duration: '1 tháng', note: 'Cấp TK/MK, xem được từ 1-2 thiết bị', productCode: 'netflix_1m' }
        ],
        tabs: {
            description: `
                <h3>Về Netflix</h3>
                <p>Netflix là dịch vụ streaming giải trí hàng đầu thế giới với hàng nghìn bộ phim, series đình đám:</p>
                <ul>
                    <li>Thư viện phim khổng lồ với đầy đủ thể loại</li>
                    <li>Phim và series Netflix Original độc quyền</li>
                    <li>Chất lượng HD/4K sắc nét</li>
                    <li>Xem offline trên thiết bị di động</li>
                    <li>Không quảng cáo</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong suốt thời gian sử dụng</li>
                    <li>Hỗ trợ đổi tài khoản nếu có vấn đề</li>
                    <li>Cam kết xem được từ 1-2 thiết bị đồng thời</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Nhận tài khoản/mật khẩu qua Zalo sau khi thanh toán</li>
                    <li>Đăng nhập tại netflix.com hoặc app Netflix</li>
                    <li>Tạo profile riêng của bạn</li>
                    <li>Bắt đầu xem phim yêu thích</li>
                </ul>
                <p><strong>Lưu ý:</strong> Không thay đổi mật khẩu hoặc thông tin tài khoản.</p>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có thể xem bao nhiêu thiết bị?</strong></p>
                <p>A: Gói Extra cho phép xem từ 1-2 thiết bị đồng thời.</p>
                <p><strong>Q: Có thể download phim không?</strong></p>
                <p>A: Có, bạn có thể download để xem offline trên app.</p>
            `
        }
    },
    spotify: {
        id: 'spotify',
        name: 'Spotify Premium',
        category: 'Giải trí',
        description: 'Nghe nhạc không giới hạn với chất lượng cao, không quảng cáo',
        image: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
        featured: true,
        rating: 4.6,
        reviewCount: 18,
        variants: [
            { name: 'Spotify Premium 1 tháng', price: 30000, duration: '1 tháng', note: '', productCode: 'spotify_1m' },
            { name: 'Spotify Premium 4 tháng', price: 100000, duration: '4 tháng', note: '', productCode: 'spotify_4m' },
            { name: 'Spotify Premium 1 năm', price: 300000, duration: '1 năm', note: '', productCode: 'spotify_1y' }
        ],
        tabs: {
            description: `
                <h3>Về Spotify Premium</h3>
                <p>Spotify Premium mang đến trải nghiệm nghe nhạc tuyệt vời nhất:</p>
                <ul>
                    <li>Hơn 100 triệu bài hát và podcast</li>
                    <li>Chất lượng âm thanh cao (320kbps)</li>
                    <li>Nghe nhạc offline</li>
                    <li>Không quảng cáo</li>
                    <li>Bỏ qua bài hát không giới hạn</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong suốt thời gian sử dụng</li>
                    <li>Hỗ trợ 24/7 khi có vấn đề</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Cung cấp email Spotify của bạn</li>
                    <li>Admin sẽ nâng cấp lên Premium</li>
                    <li>Đăng nhập và thưởng thức âm nhạc</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có mất dữ liệu không?</strong></p>
                <p>A: Không, playlist và thư viện của bạn vẫn được giữ nguyên.</p>
            `
        }
    },
    adobe: {
        id: 'adobe',
        name: 'Adobe Creative Cloud',
        category: 'Thiết kế',
        description: 'Bộ công cụ thiết kế chuyên nghiệp với Photoshop, Illustrator, Premiere Pro...',
        image: 'https://www.adobe.com/content/dam/cc/icons/Adobe_Corporate_Horizontal_Red_HEX.svg',
        featured: true,
        rating: 4.9,
        reviewCount: 39,
        variants: [
            { name: 'Adobe 4 tháng KBH', price: 100000, duration: '4 tháng', note: 'Không bảo hành' },
            { name: 'Adobe 1 năm Log Ultraview', price: 400000, duration: '1 năm', note: '' },
            { name: 'Adobe 1 năm cấp TK/MK', price: 500000, duration: '1 năm', note: '' }
        ],
        tabs: {
            description: `
                <h3>Về Adobe Creative Cloud</h3>
                <p>Bộ công cụ sáng tạo mạnh mẽ nhất cho designer và content creator:</p>
                <ul>
                    <li>Photoshop - Chỉnh sửa ảnh chuyên nghiệp</li>
                    <li>Illustrator - Thiết kế đồ họa vector</li>
                    <li>Premiere Pro - Dựng video chuyên nghiệp</li>
                    <li>After Effects - Hiệu ứng và motion graphics</li>
                    <li>Lightroom - Quản lý và edit ảnh</li>
                    <li>Và nhiều ứng dụng khác</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li><strong>Gói 4 tháng KBH:</strong> Không bảo hành</li>
                    <li><strong>Gói 1 năm Log Ultraview:</strong> Bảo hành trong thời gian sử dụng</li>
                    <li><strong>Gói 1 năm cấp TK/MK:</strong> Bảo hành đầy đủ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <p><strong>Gói cấp TK/MK:</strong></p>
                <ul>
                    <li>Nhận tài khoản sau khi thanh toán</li>
                    <li>Đăng nhập tại adobe.com</li>
                    <li>Download ứng dụng cần thiết</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có đầy đủ tất cả ứng dụng không?</strong></p>
                <p>A: Có, bạn có thể sử dụng toàn bộ bộ Adobe Creative Cloud.</p>
            `
        }
    },
    youtube: {
        id: 'youtube',
        name: 'YouTube Premium',
        category: 'Giải trí',
        description: 'Xem YouTube không quảng cáo, nghe nhạc nền và download video',
        image: 'https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg',
        featured: true,
        rating: 4.5,
        reviewCount: 22,
        variants: [
            { name: 'YouTube Premium FBH', price: 40000, duration: '1 tháng', note: 'Khách cấp TK Gmail, Full bảo hành', productCode: 'youtube_1m' }
        ],
        tabs: {
            description: `
                <h3>Về YouTube Premium</h3>
                <p>Trải nghiệm YouTube tốt nhất với:</p>
                <ul>
                    <li>Xem video không quảng cáo</li>
                    <li>Phát nhạc nền khi tắt màn hình</li>
                    <li>Download video để xem offline</li>
                    <li>Truy cập YouTube Music Premium</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Full bảo hành trong tháng</li>
                    <li>Hỗ trợ 24/7</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Gửi địa chỉ Gmail của bạn qua Zalo</li>
                    <li>Admin sẽ thêm vào Family plan</li>
                    <li>Nhận thông báo và bắt đầu sử dụng</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có ảnh hưởng đến tài khoản Gmail không?</strong></p>
                <p>A: Không, hoàn toàn an toàn.</p>
            `
        }
    },
    duolingo: {
        id: 'duolingo',
        name: 'Duolingo Plus',
        category: 'Học tập',
        description: 'Học ngoại ngữ hiệu quả với Duolingo Premium',
        image: 'https://d35aaqx5ub95lt.cloudfront.net/images/duolingo-logo-horizontal.svg',
        featured: false,
        rating: 4.7,
        reviewCount: 15,
        variants: [
            { name: 'Duolingo Plus 1 năm FBH', price: 210000, duration: '1 năm', note: 'Khách cấp TK Email, Full bảo hành' }
        ],
        tabs: {
            description: `
                <h3>Về Duolingo Plus</h3>
                <p>Học ngoại ngữ dễ dàng và hiệu quả:</p>
                <ul>
                    <li>Không quảng cáo</li>
                    <li>Download bài học offline</li>
                    <li>Luyện tập không giới hạn</li>
                    <li>Kiểm tra tiến độ chi tiết</li>
                </ul>
            `,
            warranty: `<h3>Chính sách bảo hành</h3><p>Full bảo hành 1 năm</p>`,
            guide: `<h3>Hướng dẫn</h3><p>Cung cấp email Duolingo để nâng cấp</p>`,
            faq: `<h3>FAQ</h3><p>An toàn tuyệt đối cho tài khoản</p>`
        }
    },
    ms365: {
        id: 'ms365',
        name: 'Microsoft 365',
        category: 'Công cụ',
        description: 'Bộ công cụ văn phòng Microsoft Office với Word, Excel, PowerPoint...',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png',
        featured: false,
        rating: 4.8,
        reviewCount: 21,
        variants: [
            { name: 'MS 365 1 năm FBH', price: 160000, duration: '1 năm', note: 'Khách cấp Email, Full bảo hành' }
        ],
        tabs: {
            description: `
                <h3>Về Microsoft 365</h3>
                <p>Bộ công cụ văn phòng chuyên nghiệp:</p>
                <ul>
                    <li>Word, Excel, PowerPoint</li>
                    <li>OneDrive 1TB lưu trữ đám mây</li>
                    <li>Outlook, OneNote, Teams</li>
                    <li>Cài đặt trên 5 thiết bị</li>
                </ul>
            `,
            warranty: `<h3>Chính sách bảo hành</h3><p>Full bảo hành 1 năm</p>`,
            guide: `<h3>Hướng dẫn</h3><p>Cung cấp email để kích hoạt</p>`,
            faq: `<h3>FAQ</h3><p>Sử dụng được trên Windows và Mac</p>`
        }
    },
    quizlet: {
        id: 'quizlet',
        name: 'Quizlet',
        category: 'Học tập',
        description: 'Ứng dụng học tập với flashcard và công cụ ghi nhớ hiệu quả',
        image: 'https://assets.quizlet.com/a/i/logos/quizlet-logo-resizable-400-x.png',
        featured: false,
        rating: 4.5,
        reviewCount: 12,
        variants: [
            { name: 'Quizlet Plus 1 năm', price: 160000, duration: '1 năm', note: 'Khách cấp TK/MK' },
            { name: 'Quizlet Unlimited 1 năm', price: 220000, duration: '1 năm', note: 'Khách cấp TK/MK' }
        ],
        tabs: {
            description: `
                <h3>Về Quizlet</h3>
                <p>Công cụ học tập thông minh:</p>
                <ul>
                    <li>Tạo và chia sẻ flashcard</li>
                    <li>Nhiều chế độ học</li>
                    <li>Học offline</li>
                    <li>Không quảng cáo</li>
                </ul>
            `,
            warranty: `<h3>Chính sách bảo hành</h3><p>Bảo hành trong 1 năm</p>`,
            guide: `<h3>Hướng dẫn</h3><p>Gửi TK/MK Quizlet qua Zalo</p>`,
            faq: `<h3>FAQ</h3><p>Hỗ trợ đa nền tảng</p>`
        }
    },
    canva: {
        id: 'canva',
        name: 'Canva Pro',
        category: 'Thiết kế',
        description: 'Công cụ thiết kế đồ họa online dễ sử dụng với hàng triệu template',
        image: 'https://static.canva.com/web/images/8439b51bb7a19f6e65ce1064bc37c197.svg',
        featured: false,
        variants: [
            { name: 'Canva Edu 1 năm FBH', price: 80000, duration: '1 năm', note: 'Full bảo hành', productCode: 'canva_edu_1y' },
            { name: 'Canva Pro 1 năm FBH', price: 130000, duration: '1 năm', note: 'Full bảo hành', productCode: 'canva_pro_1y' }
        ],
        tabs: {
            description: `
                <h3>Về Canva Pro</h3>
                <p>Thiết kế chuyên nghiệp dễ dàng:</p>
                <ul>
                    <li>Hàng triệu template premium</li>
                    <li>Background remover</li>
                    <li>Brand kit</li>
                    <li>100GB lưu trữ đám mây</li>
                    <li>Export chất lượng cao</li>
                </ul>
            `,
            warranty: `<h3>Chính sách bảo hành</h3><p>Full bảo hành 1 năm</p>`,
            guide: `<h3>Hướng dẫn</h3><p>Cung cấp email Canva để nâng cấp</p>`,
            faq: `<h3>FAQ</h3><p>Phù hợp cho mọi người, không cần kỹ năng thiết kế</p>`
        }
    },
    capcut: {
        id: 'capcut',
        name: 'CapCut Pro',
        category: 'Thiết kế',
        description: 'Công cụ chỉnh sửa video chuyên nghiệp, tạo trend TikTok dễ dàng',
        image: 'images/capcut-logo.svg',
        featured: true,
        variants: [
            { name: 'CapCut Pro 1 tháng', price: 35000, duration: '1 tháng', note: 'Nâng cấp chính chủ' },
            { name: 'CapCut Pro 6 tháng', price: 180000, duration: '6 tháng', note: 'Nâng cấp chính chủ' },
            { name: 'CapCut Pro 1 năm', price: 300000, duration: '1 năm', note: 'Nâng cấp chính chủ' }
        ],
        tabs: {
            description: `
                <h3>Về CapCut Pro</h3>
                <p>Trình chỉnh sửa video được yêu thích nhất hiện nay:</p>
                <ul>
                    <li>Xóa nền video tự động</li>
                    <li>Hàng ngàn hiệu ứng và transition Pro</li>
                    <li>Kho nhạc bản quyền khổng lồ</li>
                    <li>Xuất video 4K sắc nét</li>
                    <li>Chỉnh sửa khuôn mặt, cơ thể</li>
                </ul>
            `,
            warranty: `<h3>Chính sách bảo hành</h3><p>Full bảo hành trong thời gian sử dụng</p>`,
            guide: `<h3>Hướng dẫn</h3><p>Cung cấp email/ID CapCut để nâng cấp</p>`,
            faq: `<h3>FAQ</h3><p>Dùng được trên cả điện thoại và máy tính</p>`
        }
    },
    test_payment: {
        id: 'test_payment',
        name: 'Testing Payment',
        category: 'Testing',
        description: 'Sản phẩm dùng để kiểm tra quy trình thanh toán',
        image: 'https://placehold.co/400x400?text=Test+Product',
        featured: false,
        variants: [
            { name: 'Test Pay 2k', price: 2000, duration: '1 lần', note: 'Không hoàn tiền', productCode: 'test_pay_2k' }
        ],
        tabs: {
            description: `<h3>Testing</h3><p>Đây là sản phẩm test.</p>`,
            warranty: `<h3>Bảo hành</h3><p>Không bảo hành.</p>`,
            guide: `<h3>Hướng dẫn</h3><p>Thanh toán và kiểm tra mã đơn hàng.</p>`,
            faq: `<h3>FAQ</h3><p>Chỉ dùng cho mục đích kiểm thử.</p>`
        }
    }
};

// V2: Cart Persistence
function saveCart() {
    localStorage.setItem('tbq_cart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('tbq_cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load cart', e);
            cart = [];
        }
    }
}

// CART
let cart = [];

// SEARCH FUNCTIONALITY
let searchTimeout;
function handleSearch(query) {
    clearTimeout(searchTimeout);

    const resultsContainer = document.getElementById('searchResults');

    if (query.length < 2) {
        resultsContainer.classList.remove('active');
        return;
    }

    searchTimeout = setTimeout(() => {
        const results = Object.values(products).filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-no-results">Không tìm thấy sản phẩm</div>';
        } else {
            // FIX: Using onmousedown instead of onclick to prevent blur event from hiding results before click
            resultsContainer.innerHTML = results.map(product => `
                <a href="#product/${product.id}" class="search-result-item" onmousedown="setTimeout(() => { document.getElementById('searchInput').value = ''; document.getElementById('searchResults').classList.remove('active'); }, 100)">
                    <div class="search-result-icon">${getProductEmoji(product.id)}</div>
                    <div class="search-result-info">
                        <div class="search-result-name">${product.name}</div>
                        <div class="search-result-price">Từ ${formatPrice(Math.min(...product.variants.map(v => v.price)))}</div>
                    </div>
                </a>
            `).join('');
        }

        resultsContainer.classList.add('active');
    }, 300);
}

// Get emoji for products
function getProductEmoji(productId) {
    const emojis = {
        chatgpt: '🤖',
        netflix: '🎬',
        spotify: '🎵',
        adobe: '🎨',
        youtube: '▶️',
        duolingo: '🦉',
        ms365: '📊',
        quizlet: '📚',
        canva: '✨',
        capcut: '🎬'
    };
    return emojis[productId] || '📦';
}

// Fallback khi image load lỗi → hiện emoji trong ô màu
function handleImgError(img, productId) {
    img.onerror = null; // ngăn loop
    img.style.display = 'none';
    const wrap = img.parentElement;
    wrap.style.cssText += 'display:flex;align-items:center;justify-content:center;background:#eef0f5;';
    wrap.insertAdjacentHTML('beforeend', `<span style="font-size:64px;pointer-events:none;">${getProductEmoji(productId)}</span>`);
}

// Close search results when clicking outside
document.addEventListener('click', function (e) {
    const searchContainer = document.querySelector('.search-container');
    if (!searchContainer.contains(e.target)) {
        document.getElementById('searchResults').classList.remove('active');
    }
});

// INITIALIZE
window.onload = function () {
    renderFeaturedProducts();
    renderAllProducts();
    renderFilterList();
    updateCartUI();

    // Inject background orbs into hero + CTA
    injectOrbs();

    // Attach scroll-reveal classes to static sections
    initScrollReveal();

    // Start observing for reveal
    startObserver();

    // Handle initial page load
    handleRoute();

    // Listen for hash change explicitly (better than popstate for hash routing)
    window.addEventListener('hashchange', handleRoute);
};

// HANDLE ROUTING (Consolidated Logic + page-transition)
function handleRoute() {
    closeCart();

    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    const page = parts[0];

    function showPage(el) {
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active', 'page-enter');
        });
        // Force reflow so page-enter animation restarts reliably
        void el.offsetWidth;
        el.classList.add('active', 'page-enter');
        el.addEventListener('animationend', () => el.classList.remove('page-enter'), { once: true });
    }

    doRoute(page, parts, showPage);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// helper: resolve target page element id
function getTargetPageId(page, parts) {
    if (page === 'product' && parts[1]) return 'productDetailPage';
    if (page === 'checkout') return 'checkoutPage';
    if (page === 'products') return 'productsPage';
    if (page === 'confirmation') return 'confirmationPage';
    return 'homePage';
}

function doRoute(page, parts, showPage) {
    if (page === 'product' && parts[1]) {
        showProductDetail(parts[1]);
        showPage(document.getElementById('productDetailPage'));
    } else if (page === 'checkout') {
        showPage(document.getElementById('checkoutPage'));
        renderCheckoutSummary();
        // animate checkout form fields
        setTimeout(() => {
            const form = document.querySelector('.checkout-form');
            if (form) form.classList.add('animated');
        }, 100);
    } else if (page === 'products') {
        showPage(document.getElementById('productsPage'));
        // re-trigger stagger on product grid
        triggerStagger(document.getElementById('allProducts'));
    } else if (page === 'confirmation') {
        showPage(document.getElementById('confirmationPage'));
        // launch confetti after a short delay
        setTimeout(launchConfetti, 400);
    } else if (page === 'contact') {
        showPage(document.getElementById('homePage'));
        setTimeout(() => {
            const contactSection = document.getElementById('contact');
            if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    } else {
        showPage(document.getElementById('homePage'));
        // re-observe home sections
        startObserver();
    }
}

// RENDER FEATURED PRODUCTS
function renderFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    const featured = Object.values(products).filter(p => p.featured);

    container.innerHTML = featured.map(product => `
        <div class="product-card" onclick="window.location.hash='product/${product.id}'">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="handleImgError(this,'${product.id}')">
            </div>
            <div class="product-info product-info-simple">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${formatPrice(Math.min(...product.variants.map(v => v.price)))}</p>
                <a href="#product/${product.id}" class="buy-now-btn" onclick="event.stopPropagation()">Xem</a>
            </div>
        </div>
    `).join('');
}

// RENDER ALL PRODUCTS
function renderAllProducts(filter = 'all') {
    const container = document.getElementById('allProducts');
    let productsToShow = Object.values(products);

    if (filter !== 'all') {
        productsToShow = productsToShow.filter(p => p.category === filter);
    }

    container.innerHTML = productsToShow.map(product => `
        <div class="product-card" onclick="window.location.hash='product/${product.id}'">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="handleImgError(this,'${product.id}')">
            </div>
            <div class="product-info product-info-simple">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${formatPrice(Math.min(...product.variants.map(v => v.price)))}</p>
                <a href="#product/${product.id}" class="buy-now-btn" onclick="event.stopPropagation()">Xem</a>
            </div>
        </div>
    `).join('');
}

// RENDER FILTER LIST
function renderFilterList() {
    const container = document.getElementById('filterList');
    const categories = [...new Set(Object.values(products).map(p => p.category))];

    // Clean UI - No icons as requested
    const allItem = '<li class="active" onclick="filterProducts(this, \'all\')">Tất cả</li>';
    const categoryItems = categories.map(cat =>
        `<li onclick="filterProducts(this, '${cat}')">${cat}</li>`
    ).join('');

    container.innerHTML = allItem + categoryItems;
}

// FILTER PRODUCTS
function filterProducts(element, category) {
    document.querySelectorAll('.filter-list li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
    renderAllProducts(category);
}

// SHOW PRODUCT DETAIL (Rendering only)
function showProductDetail(productId) {
    const product = products[productId];
    if (!product) return;

    const container = document.getElementById('productDetailContent');

    container.innerHTML = `
        <div class="product-layout">
            <div class="product-gallery">
                <div class="main-image">
                    <img src="${product.image}" alt="${product.name}" onerror="handleImgError(this,'${product.id}')">
                </div>
            </div>
            
            <div class="product-details">
                <h1>${product.name}</h1>
                <p class="product-description">${product.description}</p>
                
                <div class="variant-selector">
                    <div class="variant-label">Chọn gói dịch vụ:</div>
                    <div class="variant-options" id="variantOptions">
                        ${product.variants.map((variant, index) => `
                            <label class="variant-option ${index === 0 ? 'selected' : ''}">
                                <div class="variant-select-circle">
                                    <input type="radio" name="variant" value="${index}" ${index === 0 ? 'checked' : ''} onchange="selectVariant(${index})">
                                </div>
                                <div class="variant-info">
                                    <div class="variant-header">
                                        <div class="variant-name">${variant.name}</div>
                                    </div>
                                    ${variant.note ? `<div class="variant-note">${variant.note}</div>` : ''}
                                    <div class="variant-meta-row">
                                        <span class="variant-duration-text ${(variant.duration || '').includes('năm') ? 'duration-year' : 'duration-month'}">${variant.duration}</span>
                                        <span class="variant-separator"></span>
                                        <span class="variant-price-text">${formatPrice(variant.price)}</span>
                                    </div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <button class="add-to-cart-btn" onclick="addToCart('${productId}')">
                    Thêm vào giỏ hàng
                </button>
            </div>
        </div>
        
        <div class="product-tabs">
            <div class="tab-buttons">
                <button class="tab-button active" onclick="switchTab(this, 0)">Mô tả</button>
                <button class="tab-button" onclick="switchTab(this, 1)">Bảo hành</button>
                <button class="tab-button" onclick="switchTab(this, 2)">Hướng dẫn</button>
                <button class="tab-button" onclick="switchTab(this, 3)">FAQ</button>
            </div>
            
            <div class="tab-content active">${product.tabs.description}</div>
            <div class="tab-content">${product.tabs.warranty}</div>
            <div class="tab-content">${product.tabs.guide}</div>
            <div class="tab-content">${product.tabs.faq}</div>
        </div>
    `;
}

// SELECT VARIANT
function selectVariant(index) {
    document.querySelectorAll('.variant-option').forEach((opt, i) => {
        opt.classList.toggle('selected', i === index);
        opt.classList.remove('just-selected');
        if (i === index) {
            void opt.offsetWidth; // reflow
            opt.classList.add('just-selected');
        }
    });
}

// SWITCH TAB
function switchTab(btn, index) {
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.tab-content').forEach((content, i) => {
        content.classList.toggle('active', i === index);
    });
}

// ADD TO CART (V2 - with quantity support)
function addToCart(productId) {
    const product = products[productId];
    const selectedOptions = document.querySelector('input[name="variant"]:checked');
    if (!selectedOptions) return;

    const selectedVariantIndex = selectedOptions.value;
    const variant = product.variants[selectedVariantIndex];

    // Check if item already in cart
    const existingIndex = cart.findIndex(item =>
        item.productId === productId && item.variantName === variant.name
    );

    if (existingIndex >= 0) {
        // Increase quantity
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
        cart[existingIndex].price = variant.price * cart[existingIndex].quantity;
    } else {
        // Add new item
        const cartItem = {
            productId: productId,
            productName: product.name,
            variantName: variant.name,
            variantIndex: selectedVariantIndex,
            price: variant.price,
            unitPrice: variant.price,
            quantity: 1,
            image: product.image
        };
        cart.push(cartItem);
    }

    updateCartUI();
    toggleCart();
    saveCart(); // Save state
    showToast(`Đã thêm ${product.name} vào giỏ`, 'success');

    // badge bounce
    const badge = document.querySelector('.cart-count');
    if (badge) {
        badge.classList.remove('bounce');
        void badge.offsetWidth; // force reflow
        badge.classList.add('bounce');
    }
}

// productCode gửi lên API: ưu tiên variant.productCode (khớp DB), không thì tạo từ tên
function getProductCode(productId, variantName) {
    const product = products[productId];
    if (product) {
        const variant = product.variants.find(v => v.name === variantName);
        if (variant && variant.productCode) return variant.productCode;
    }
    const codeMap = { chatgpt: 'chatgpt', netflix: 'netflix', spotify: 'spotify', adobe: 'adobe', youtube: 'youtube', duolingo: 'duolingo', ms365: 'ms365', quizlet: 'quizlet', canva: 'canva', capcut: 'capcut' };
    const prefix = codeMap[productId] || productId;
    const variantCode = variantName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return `${prefix}_${variantCode}`;
}

// UPDATE CART UI (V2 - with quantity controls)
function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');

    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCount.textContent = totalItems;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="cart-empty"><p>Giỏ hàng trống</p></div>';
        cartFooter.style.display = 'none';
        cartCount.style.display = 'none';
    } else {
        cartCount.style.display = 'flex';

        cartItems.innerHTML = cart.map((item, index) => {
            const qty = item.quantity || 1;
            const unitPrice = item.unitPrice || item.price;
            return `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.productName}">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.productName}</div>
                    <div class="cart-item-variant">${item.variantName}</div>
                    <div class="cart-item-quantity" style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                        <button onclick="updateCartQuantity(${index}, -1)" style="width: 28px; height: 28px; border: 1px solid #d2d2d7; border-radius: 4px; background: white; cursor: pointer;">-</button>
                        <span style="min-width: 30px; text-align: center;">${qty}</span>
                        <button onclick="updateCartQuantity(${index}, 1)" style="width: 28px; height: 28px; border: 1px solid #d2d2d7; border-radius: 4px; background: white; cursor: pointer;">+</button>
                    </div>
                    <div class="cart-item-price" style="margin-top: 8px;">${formatPrice(unitPrice * qty)}</div>
                </div>
                <span class="remove-item" onclick="removeFromCart(${index})">×</span>
            </div>
        `;
        }).join('');

        const total = cart.reduce((sum, item) => {
            const qty = item.quantity || 1;
            const unitPrice = item.unitPrice || item.price;
            return sum + (unitPrice * qty);
        }, 0);
        cartTotal.textContent = formatPrice(total);
        cartFooter.style.display = 'block';
    }
}

// UPDATE CART QUANTITY
function updateCartQuantity(index, delta) {
    const item = cart[index];
    if (!item) return;

    const newQty = Math.max(1, (item.quantity || 1) + delta);
    item.quantity = newQty;
    item.price = (item.unitPrice || item.price) * newQty;

    updateCartUI();
}

// REMOVE FROM CART
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart(); // Save state
    updateCartUI();
}

// TOGGLE CART
function toggleCart() {
    document.querySelector('.cart-sidebar').classList.toggle('active');
    document.querySelector('.cart-overlay').classList.toggle('active');
}

// Close cart sidebar
function closeCart() {
    document.querySelector('.cart-sidebar').classList.remove('active');
    document.querySelector('.cart-overlay').classList.remove('active');
}

// RENDER CHECKOUT SUMMARY (V2 - with quantity)
function renderCheckoutSummary() {
    const container = document.getElementById('checkoutSummary');
    const total = cart.reduce((sum, item) => {
        const qty = item.quantity || 1;
        const unitPrice = item.unitPrice || item.price;
        return sum + (unitPrice * qty);
    }, 0);

    if (cart.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 20px;">Vui lòng thêm sản phẩm vào giỏ</div>';
        return;
    }

    container.innerHTML = cart.map(item => {
        const qty = item.quantity || 1;
        const unitPrice = item.unitPrice || item.price;
        return `
        <div class="summary-item">
            <span>${item.productName} - ${item.variantName}${qty > 1 ? ` (x${qty})` : ''}</span>
            <span>${formatPrice(unitPrice * qty)}</span>
        </div>
    `;
    }).join('');

    document.getElementById('checkoutTotal').textContent = formatPrice(total);
}

// PLACE ORDER (V2 - calls new API with quantity support)
async function placeOrder() {
    if (cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }

    const name = document.getElementById('customerName').value;
    const email = document.getElementById('customerEmail').value;
    const phone = document.getElementById('customerPhone').value;
    const note = document.getElementById('customerNote')?.value || '';

    if (!name || !email || !phone) {
        showToast('Vui lòng điền đầy đủ thông tin!', 'error');
        validateInput(document.getElementById('customerName'));
        validateInput(document.getElementById('customerEmail'));
        validateInput(document.getElementById('customerPhone'));
        return;
    }

    if (document.querySelectorAll('.error').length > 0) {
        showToast('Vui lòng kiểm tra lại thông tin!', 'error');
        return;
    }

    // UX: Disable button to prevent double submit
    const submitBtn = document.querySelector('.place-order-btn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Đang xử lý...';
    submitBtn.style.opacity = '0.7';

    // Build items payload
    const items = cart.map(item => ({
        productCode: getProductCode(item.productId, item.variantName),
        quantity: item.quantity || 1,
        price: item.unitPrice || item.price
    }));

    const total = cart.reduce((sum, item) => sum + (item.unitPrice || item.price) * (item.quantity || 1), 0);

    // Show loading
    showToast('Đang tạo đơn hàng...', 'info');

    try {
        // Call create-order API
        const response = await fetch('/.netlify/functions/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                customerNote: note,
                items: items,
                price: total
            })
        });

        let data;
        try {
            data = await response.json();
        } catch (parseErr) {
            console.error('Create order response not JSON:', response.status, parseErr);
            showToast(response.status === 404
                ? 'Không tìm thấy API. Chạy bằng Netlify dev (netlify dev) để tạo đơn.'
                : 'Máy chủ trả về lỗi. Vui lòng thử lại hoặc liên hệ hỗ trợ.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            submitBtn.style.opacity = '1';
            return;
        }

        if (!response.ok) {
            const msg = data?.error || data?.message || `Lỗi ${response.status}`;
            showToast(msg, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            submitBtn.style.opacity = '1';
            return;
        }

        if (!data.success) {
            let errMsg = data.message || 'Có lỗi xảy ra';
            if (data.error === 'INSUFFICIENT_STOCK') {
                errMsg = `Hết hàng: ${data.product || 'sản phẩm'} chỉ còn ${data.available ?? 0}.`;
            } else if (data.error === 'Product not found' || (data.error && data.error.includes('Product not found'))) {
                errMsg = 'Sản phẩm không tồn tại trong kho. Vui lòng chọn sản phẩm khác hoặc liên hệ hỗ trợ.';
            } else if (data.error === 'Too many requests' || response.status === 429) {
                errMsg = 'Bạn đã gửi quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.';
            }
            showToast(errMsg, 'error');

            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            submitBtn.style.opacity = '1';
            return;
        }

        const orderCode = data.orderCode;
        // const paymentInfo = data.paymentInfo;

        // Store order for invoice
        lastOrder = {
            code: orderCode,
            date: new Date().toLocaleString('vi-VN'),
            customer: { name, email, phone },
            items: [...cart],
            total: data.amount || total
        };

        // Update UI elements
        document.getElementById('orderCode').textContent = orderCode;
        document.getElementById('transferContent').textContent = orderCode;
        document.getElementById('transferAmount').textContent = formatPrice(data.amount || total);

        // Generate and display QR Code
        const qrCodeUrl = generateTPBankQR(orderCode, data.amount || total);
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = `
            <img src="${qrCodeUrl}" alt="Mã QR thanh toán" 
                 style="max-width: 220px; border-radius: 8px;"
                 onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<p style=\\'color:#ef4444; margin-top:10px; font-weight:500\\'>⚠️ Không thể tạo mã QR. Vui lòng chuyển khoản thủ công theo thông tin bên dưới.</p>');">
        `;

        // Clear cart
        cart = [];
        updateCartUI();

        // Navigate to confirmation page
        window.location.hash = 'confirmation';

        // Re-enable button (though we navigated away)
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        submitBtn.style.opacity = '1';

        // Start polling for payment status
        startPaymentPolling(orderCode, data.amount || total);

    } catch (error) {
        console.error('Place order error:', error);
        const isNetwork = error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'));
        showToast(isNetwork
            ? 'Không kết nối được máy chủ. Kiểm tra mạng hoặc chạy "netlify dev" nếu test local.'
            : 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.', 'error');

        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        submitBtn.style.opacity = '1';
    }
}

// Show success UI with credentials inline (no redirect)
// SaaS Professional Design - Stripe/Notion/Apple inspired
async function showSuccessWithCredentials(orderCode, deliveryToken, invoiceNumber) {
    const pendingState = document.getElementById('pendingPaymentState');
    const successState = document.getElementById('successPaymentState');

    if (!pendingState || !successState) {
        window.location.href = `/.netlify/functions/delivery?token=${deliveryToken}&order=${orderCode}`;
        return;
    }

    try {
        const response = await fetch(`/.netlify/functions/delivery?token=${deliveryToken}&order=${orderCode}&format=json`);
        const data = await response.json();

        if (!data.success) {
            window.location.href = `/.netlify/functions/delivery?token=${deliveryToken}&order=${orderCode}`;
            return;
        }

        const credentials = data.credentials || [];

        // Hide pending, show success
        pendingState.style.display = 'none';
        successState.style.display = 'block';

        // Build success HTML - Professional SaaS Design
        successState.innerHTML = `
            <!-- Success Header -->
            <div class="conf-success-header">
                <div class="conf-success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h1 class="conf-success-title">Thanh toán hoàn tất</h1>
                <p class="conf-success-subtitle">
                    Cảm ơn bạn đã mua hàng tại TBQ Homie.<br>
                    Mã đơn hàng: <strong>${orderCode}</strong>
                    <span class="conf-order-note">Vui lòng lưu lại mã đơn để được hỗ trợ nhanh hơn khi cần.</span>
                </p>
            </div>

            <!-- Credentials Section -->
            <div class="conf-credentials-section">
                <h3 class="conf-credentials-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Thông tin đăng nhập dịch vụ
                </h3>
                ${credentials.map((cred, idx) => `
                    <div class="conf-credential-item">
                        <div class="conf-credential-field">
                            <label class="conf-credential-label">Tên đăng nhập</label>
                            <div class="conf-credential-value-wrap">
                                <span class="conf-credential-value">${escapeHtml(cred.username)}</span>
                                <button class="conf-action-btn" onclick="copyText('${escapeAttr(cred.username)}')" title="Sao chép">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </button>
                            </div>
                        </div>
                        <div class="conf-credential-field">
                            <label class="conf-credential-label">Mật khẩu</label>
                            <div class="conf-credential-value-wrap">
                                <span class="conf-credential-value conf-password-blur" id="pass-${idx}">${escapeHtml(cred.password)}</span>
                                <button class="conf-action-btn secondary" onclick="togglePassword(${idx})" title="Hiện/Ẩn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                                <button class="conf-action-btn" onclick="copyText('${escapeAttr(cred.password)}')" title="Sao chép">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </button>
                            </div>
                        </div>
                        ${cred.extraInfo ? `<p class="conf-credential-note" style="font-size:12px;color:#6b7280;margin-top:8px;">${escapeHtml(cred.extraInfo)}</p>` : ''}
                    </div>
                `).join('')}
                <button class="conf-copy-all-btn" onclick="copyAllCreds()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Sao chép toàn bộ thông tin đăng nhập
                </button>
            </div>

            <!-- Next Steps -->
            <div class="conf-steps-section">
                <h4 class="conf-steps-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Bước tiếp theo
                </h4>
                <ol class="conf-steps-list">
                    <li><span class="conf-step-number">1</span>Truy cập trang đăng nhập chính thức của dịch vụ.</li>
                    <li><span class="conf-step-number">2</span>Dán thông tin đăng nhập để đăng nhập.</li>
                    <li><span class="conf-step-number">3</span>Không thay đổi mật khẩu nếu chưa có hướng dẫn từ TBQ.</li>
                </ol>
            </div>

            <!-- Security Note -->
            <div class="conf-security-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Vì lý do bảo mật, vui lòng lưu lại thông tin ngay sau khi nhận. Hệ thống có thể không hiển thị lại.</span>
            </div>

            <!-- Support Section -->
            <div class="conf-support-section">
                <h4 class="conf-support-title">Hỗ trợ</h4>
                <p class="conf-support-text">Nếu bạn gặp lỗi đăng nhập hoặc cần hỗ trợ, hãy liên hệ TBQ để được xử lý nhanh.</p>
                <a href="https://zalo.me/0988428496" target="_blank" class="conf-zalo-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Liên hệ Zalo hỗ trợ
                </a>
                <span class="conf-hotline">Hotline: 0988 428 496</span>
            </div>

            <!-- Back Home -->
            <a href="#home" class="conf-back-home">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Về trang chủ
            </a>
        `;

        window._credentials = credentials;

        // Show toast notification
        showToast('Đã sao chép. Bạn có thể dán vào trang đăng nhập của dịch vụ.', 'success');

    } catch (error) {
        console.error('Error fetching credentials:', error);
        window.location.href = `/.netlify/functions/delivery?token=${deliveryToken}&order=${orderCode}`;
    }
}

// Helper functions for success page
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function togglePassword(idx) {
    const el = document.getElementById('pass-' + idx);
    if (el) el.classList.toggle('conf-password-blur');
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Đã sao chép!');
    });
}

function copyAllCreds() {
    if (!window._credentials) return;
    const text = window._credentials.map((c, i) =>
        `Tài khoản ${i + 1}:\nTên đăng nhập: ${c.username}\nMật khẩu: ${c.password}${c.extraInfo ? '\nGhi chú: ' + c.extraInfo : ''}`
    ).join('\n\n---\n\n');
    navigator.clipboard.writeText(text).then(() => {
        showToast('Đã sao chép. Bạn có thể dán vào trang đăng nhập của dịch vụ.', 'success');
    });
}

// POLL PAYMENT STATUS – uses lightweight order-status endpoint (read-only).
// check-payment is still the server-side fallback that *triggers* fulfillment;
// order-status just reads the current state so the UI stays in sync even if
// the webhook already fulfilled the order while the tab was open.
let pollingInterval;
function startPaymentPolling(orderCode, amount) {
    if (pollingInterval) clearInterval(pollingInterval);

    let attempts = 0;
    const maxAttempts = 240; // 240 * 5s = 20 minutes

    const check = async () => {
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(pollingInterval);
            return;
        }

        try {
            // Use check-payment which both checks AND triggers fulfillment
            const response = await fetch(`/.netlify/functions/check-payment?orderCode=${encodeURIComponent(orderCode)}`);

            // If server returned non-2xx, try to surface the error body.
            if (!response.ok) {
                let details = '';
                try {
                    const text = await response.text();
                    details = text;
                    try {
                        const j = JSON.parse(text);
                        details = j.message || j.error || text;
                    } catch { /* ignore */ }
                } catch { /* ignore */ }

                console.error('[poll] check-payment non-OK:', response.status, details);
                // Don't show toast for 429 or transient errors during polling to avoid spamming user
                if (response.status !== 429) {
                    // showToast(details || `Lỗi máy chủ (${response.status}).`, 'error');
                }
                return;
            }

            const data = await response.json();

            // check-payment returns status: 'paid' when successful
            if (data.status === 'paid' || data.status === 'fulfilled') {
                clearInterval(pollingInterval);

                // Show success UI with credentials
                if (data.deliveryToken) {
                    await showSuccessWithCredentials(orderCode, data.deliveryToken, data.invoiceNumber);
                } else {
                    // Fallback: redirect to delivery page
                    window.location.href = data.redirectUrl || `/.netlify/functions/delivery?order=${orderCode}`;
                }
            }
        } catch (error) {
            console.error('[poll] check-payment error:', error);
        }
    };

    // Run immediately
    check();
    // Then poll every 3 seconds
    pollingInterval = setInterval(check, 3000);
}

// Generate QR Code for TP Bank using VietQR API
function generateTPBankQR(orderCode, amount) {
    const bankInfo = {
        bin: "970423",  // TP Bank BIN code
        accountNo: "00000828511",
        accountName: "TRAN PHI LONG",
        amount: amount,
        description: orderCode
    };

    // Use VietQR.io API to generate QR code
    // Fix: encodeURIComponent for safety
    const qrUrl = `https://img.vietqr.io/image/${bankInfo.bin}-${bankInfo.accountNo}-compact2.jpg?amount=${bankInfo.amount}&addInfo=${encodeURIComponent(bankInfo.description)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

    return qrUrl;
}

// FORMAT PRICE
function formatPrice(price) {
    return price.toLocaleString('vi-VN') + '₫';
}

/* V2 FUNCTIONS */

let lastOrder = null;

// TOAST NOTIFICATION
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const svgCheck = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const svgX = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const svgInfo = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    const icons = { success: svgCheck, error: svgX, info: svgInfo };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Sound effect (Optional)
    // if(type === 'success') new Audio('success.mp3').play().catch(() => {});

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// VALIDATION
function validateInput(input) {
    const value = input.value.trim();
    const errorDiv = input.parentElement.querySelector('.error-feedback');
    let isValid = true;
    let errorMsg = '';

    if (input.hasAttribute('required') && !value) {
        isValid = false;
        errorMsg = 'Không được để trống';
    } else if (input.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMsg = 'Email không hợp lệ';
        }
    } else if (input.type === 'tel' && value) {
        const phoneRegex = /(84|0[35789])([0-9]{8})\b/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMsg = 'Số điện thoại không hợp lệ';
        }
    }

    if (!isValid) {
        input.classList.add('error');
        if (errorDiv) {
            errorDiv.innerHTML = `<div class="error-message">⚠️ ${errorMsg}</div>`;
        }
    } else {
        input.classList.remove('error');
        if (errorDiv) {
            errorDiv.innerHTML = '';
        }
    }
    return isValid;
}

// FIX BUG #5: Clear validation errors on input
document.addEventListener('DOMContentLoaded', function () {
    // Add input event listeners to clear errors while typing
    document.addEventListener('input', function (e) {
        if (e.target.matches('#customerName, #customerEmail, #customerPhone')) {
            validateInput(e.target);
        }
    });
});

// COPY TO CLIPBOARD
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Đã sao chép vào bộ nhớ tạm', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Không thể sao chép', 'error');
    });
}

// GENERATE INVOICE
function generateInvoice() {
    if (!lastOrder) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Font support is limited in standard jsPDF without loading custom font.
    // We will use standard font and keep it simple "TBQ HOMIE INVOICE".

    doc.setFontSize(22);
    doc.setTextColor(0, 102, 204);
    doc.text("TBQ HOMIE - HOA DON", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`So hoa don: ${lastOrder.invoiceNumber || 'DRAFT'}`, 20, 40);
    doc.text(`Ma don hang: ${lastOrder.code}`, 20, 50);
    doc.text(`Ngay: ${lastOrder.date}`, 20, 60);

    doc.text("KHACH HANG:", 20, 70);
    doc.text(`Ten: ${lastOrder.customer.name}`, 30, 80);
    doc.text(`Email: ${lastOrder.customer.email}`, 30, 90);
    doc.text(`SĐT: ${lastOrder.customer.phone}`, 30, 100);

    doc.text("CHI TIET DON HANG:", 20, 120);
    let y = 130;

    lastOrder.items.forEach(item => {
        // Remove dong/vnd for safe rendering
        const price = formatPrice(item.price).replace('₫', ' VND');
        // Remove vietnamese accents for safety if font missing
        const name = item.productName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const variant = item.variantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        doc.text(`- ${name} (${variant})`, 30, y);
        doc.text(`${price}`, 150, y);
        y += 10;
    });

    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(14);
    doc.text(`TONG CONG: ${formatPrice(lastOrder.total).replace('₫', ' VND')}`, 120, y);

    doc.save(`invoice-${lastOrder.code}.pdf`);

    showToast('Đang tải xuống hóa đơn...', 'info');
}

// =============================================
// 🎬 ANIMATION ENGINE
// =============================================

/* ---------- 1. FLOATING ORBS ---------- */
function injectOrbs() {
    // Hero orbs
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.insertAdjacentHTML('afterbegin', `
            <div class="orb orb--1"></div>
            <div class="orb orb--2"></div>
            <div class="orb orb--3"></div>
        `);
    }
    // CTA section orbs
    const cta = document.querySelector('.cta-section');
    if (cta) {
        cta.insertAdjacentHTML('afterbegin', `
            <div class="orb orb--1"></div>
            <div class="orb orb--2"></div>
        `);
    }
}

/* ---------- 2. SCROLL-REVEAL + STAGGER ---------- */
function initScrollReveal() {
    // Wrap each top-level section inside #homePage with reveal
    const home = document.getElementById('homePage');
    if (!home) return;

    // All direct <section> elements inside homePage
    home.querySelectorAll('section').forEach(sec => {
        sec.classList.add('reveal');
    });

    // Feature grid → stagger children
    const featGrid = home.querySelector('.features-grid');
    if (featGrid) {
        featGrid.classList.add('stagger');
        featGrid.parentElement.classList.add('reveal');
    }

    // Testimonials section → reveal
    const testimSection = home.querySelector('.testimonials-section');
    if (testimSection) {
        testimSection.classList.add('reveal');
    }

    // Featured product grid → stagger
    const featProducts = document.getElementById('featuredProducts');
    if (featProducts) {
        featProducts.classList.add('stagger');
        // The parent <section> already has reveal from the loop above
    }
}

let revealObserver;
function startObserver() {
    if (revealObserver) revealObserver.disconnect();

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    // Observe all .reveal and .stagger elements
    document.querySelectorAll('.reveal, .stagger').forEach(el => {
        revealObserver.observe(el);
    });
}

/* ---------- 3. STAGGER PRODUCT GRID (dynamically rendered) ---------- */
function triggerStagger(container) {
    if (!container) return;
    container.classList.add('stagger');
    // reset → re-trigger
    container.classList.remove('visible');
    void container.offsetWidth;
    container.classList.add('visible');
}

/* ---------- 4. BUTTON RIPPLE ---------- */
document.addEventListener('click', function (e) {
    const btn = e.target.closest('.cta-button, .add-to-cart-btn, .checkout-btn, .place-order-btn, .view-details');
    if (!btn) return;

    const ripple = document.createElement('span');
    ripple.classList.add('ripple-span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
});

/* ---------- 5. CONFETTI ---------- */
function launchConfetti() {
    const colors = ['#0066cc', '#a855f7', '#34c759', '#ff9500', '#ff3b30', '#5ac8fa', '#ffcc00'];
    const count = 60;
    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.classList.add('confetti-piece');
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.width = (6 + Math.random() * 8) + 'px';
        piece.style.height = piece.style.width;
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.animationDuration = (2 + Math.random() * 1.2) + 's';
        piece.style.animationDelay = Math.random() * 0.4 + 's';
        document.body.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove());
    }
}

/* ---------- 6. PRODUCT CARDS stagger after dynamic render ---------- */
// Patch renderFeaturedProducts & renderAllProducts to add stagger after innerHTML
const _origRenderFeatured = renderFeaturedProducts;
renderFeaturedProducts = function () {
    _origRenderFeatured();
    const el = document.getElementById('featuredProducts');
    if (el) {
        el.classList.add('stagger');
        // short delay so DOM is painted
        requestAnimationFrame(() => {
            el.classList.remove('visible');
            void el.offsetWidth;
            el.classList.add('visible');
        });
    }
};

const _origRenderAll = renderAllProducts;
renderAllProducts = function (filter) {
    _origRenderAll(filter);
    triggerStagger(document.getElementById('allProducts'));
};
// HEADER SCROLL LOGIC (Mobile)
let lastScrollTop = 0;
window.addEventListener('scroll', function () {
    // Only active on mobile
    if (window.innerWidth > 768) return;

    const header = document.querySelector('header');
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop < 0) scrollTop = 0; // iOS bounce fix

    // Threshold
    if (Math.abs(scrollTop - lastScrollTop) <= 5) return;

    if (scrollTop > lastScrollTop && scrollTop > 60) {
        // Scroll Down
        header.classList.add('header-hidden');
    } else {
        // Scroll Up
        header.classList.remove('header-hidden');
    }

    lastScrollTop = scrollTop;
});

/* =============================================
   TESTIMONIALS CAROUSEL + LIGHTBOX
   ============================================= */
function initTestiCarousel() {
    const track = document.querySelector('.testi-track');
    const dotsContainer = document.querySelector('.testi-dots');
    if (!track || !dotsContainer) return;

    const cards = track.querySelectorAll('.testi-card');
    if (!cards.length) return;

    // Build dots
    function getVisibleCount() {
        if (window.innerWidth >= 1024) return 3;
        if (window.innerWidth >= 601) return 2;
        return 1;
    }

    function buildDots() {
        dotsContainer.innerHTML = '';
        const visibleCount = getVisibleCount();
        const dotCount = Math.max(1, cards.length - visibleCount + 1);
        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('button');
            dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Slide ' + (i + 1));
            dot.addEventListener('click', () => scrollToIndex(i));
            dotsContainer.appendChild(dot);
        }
    }

    function scrollToIndex(index) {
        const card = cards[index];
        if (!card) return;
        track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }

    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.testi-dot');
        if (!dots.length) return;
        const scrollLeft = track.scrollLeft;
        const cardWidth = cards[0].offsetWidth + parseInt(getComputedStyle(track).gap || 20);
        const activeIndex = Math.round(scrollLeft / cardWidth);
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
        });
    }

    buildDots();
    track.addEventListener('scroll', updateDots, { passive: true });
    window.addEventListener('resize', () => {
        buildDots();
        updateDots();
    });
}

// Lightbox
function openLightbox(el) {
    const img = el.querySelector('img');
    if (!img) return;
    const lightbox = document.getElementById('testiLightbox');
    const lbImg = document.getElementById('lightboxImg');
    if (!lightbox || !lbImg) return;
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
    const lightbox = document.getElementById('testiLightbox');
    if (!lightbox) return;
    // Close if clicking backdrop or close button, not the image itself
    if (e && e.target && e.target.tagName === 'IMG') return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
}

// Close lightbox on Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox(e);
});

// Init carousel on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initTestiCarousel);
