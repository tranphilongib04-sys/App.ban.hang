// PRODUCT DATA
const products = {
    chatgpt: {
        id: 'chatgpt',
        name: 'ChatGPT',
        category: 'ChatGPT',
        description: 'Trợ lý AI thông minh nhất hiện nay, hỗ trợ viết lách, code, và nhiều tác vụ khác',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png',
        featured: true,
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
        category: 'Netflix',
        description: 'Xem phim và chương trình truyền hình không giới hạn với chất lượng HD/4K',
        image: 'https://images.ctfassets.net/y2ske730sjqp/1aONibCke6niZhgPxuiilC/2c401b05a07288746ddf3bd3943fbc76/BrandAssets_Logos_01-Wordmark.jpg',
        featured: true,
        variants: [
            { name: 'Netflix Extra', price: 70000, duration: '1 tháng', note: 'Cấp TK/MK, xem được từ 1-2 thiết bị' }
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
        category: 'Spotify',
        description: 'Nghe nhạc không giới hạn với chất lượng cao, không quảng cáo',
        image: 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png',
        featured: true,
        variants: [
            { name: 'Spotify Premium 1 tháng', price: 30000, duration: '1 tháng', note: '' },
            { name: 'Spotify Premium 4 tháng', price: 100000, duration: '4 tháng', note: '' },
            { name: 'Spotify Premium 1 năm', price: 300000, duration: '1 năm', note: '' }
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
        category: 'Adobe',
        description: 'Bộ công cụ thiết kế chuyên nghiệp với Photoshop, Illustrator, Premiere Pro...',
        image: 'https://www.adobe.com/content/dam/cc/icons/Adobe_Corporate_Horizontal_Red_HEX.svg',
        featured: true,
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
        category: 'YouTube',
        description: 'Xem YouTube không quảng cáo, nghe nhạc nền và download video',
        image: 'https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg',
        featured: true,
        variants: [
            { name: 'YouTube Premium FBH', price: 40000, duration: '1 tháng', note: 'Khách cấp TK Gmail, Full bảo hành' }
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
        category: 'Duolingo',
        description: 'Học ngoại ngữ hiệu quả với Duolingo Premium',
        image: 'https://d35aaqx5ub95lt.cloudfront.net/images/duolingo-logo-horizontal.svg',
        featured: false,
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
        category: 'Microsoft 365',
        description: 'Bộ công cụ văn phòng Microsoft Office với Word, Excel, PowerPoint...',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png',
        featured: false,
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
        category: 'Quizlet',
        description: 'Ứng dụng học tập với flashcard và công cụ ghi nhớ hiệu quả',
        image: 'https://assets.quizlet.com/a/i/logos/quizlet-logo-resizable-400-x.png',
        featured: false,
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
        category: 'Canva',
        description: 'Công cụ thiết kế đồ họa online dễ sử dụng với hàng triệu template',
        image: 'https://static.canva.com/web/images/8439b51bb7a19f6e65ce1064bc37c197.svg',
        featured: false,
        variants: [
            { name: 'Canva Edu 1 năm FBH', price: 80000, duration: '1 năm', note: 'Full bảo hành' },
            { name: 'Canva Pro 1 năm FBH', price: 130000, duration: '1 năm', note: 'Full bảo hành' }
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
        category: 'CapCut',
        description: 'Công cụ chỉnh sửa video chuyên nghiệp, tạo trend TikTok dễ dàng',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/CapCut_logo.svg/1024px-CapCut_logo.svg.png',
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
    }
};

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

    // Handle initial page load
    handleRoute();

    // Listen for hash change explicitly (better than popstate for hash routing)
    window.addEventListener('hashchange', handleRoute);
};

// HANDLE ROUTING (Consolidated Logic)
function handleRoute() {
    closeCart();

    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    const page = parts[0];

    // Hide all pages first
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    if (page === 'product' && parts[1]) {
        // Product detail page
        showProductDetail(parts[1]);
        document.getElementById('productDetailPage').classList.add('active');
    } else if (page === 'checkout') {
        document.getElementById('checkoutPage').classList.add('active');
        renderCheckoutSummary();
    } else if (page === 'products') {
        document.getElementById('productsPage').classList.add('active');
    } else if (page === 'confirmation') {
        document.getElementById('confirmationPage').classList.add('active');
    } else {
        // Default to home
        document.getElementById('homePage').classList.add('active');
    }

    window.scrollTo(0, 0);
}

// RENDER FEATURED PRODUCTS
function renderFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    const featured = Object.values(products).filter(p => p.featured);

    // FIX: Removed onclick and used href for SEO and reliable navigation
    container.innerHTML = featured.map(product => `
        <div class="product-card" onclick="window.location.hash='product/${product.id}'">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <span class="product-badge">Phổ biến</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">Từ ${formatPrice(Math.min(...product.variants.map(v => v.price)))}</p>
                <a href="#product/${product.id}" class="view-details" onclick="event.stopPropagation()">Xem chi tiết</a>
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
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                ${product.featured ? '<span class="product-badge">Phổ biến</span>' : ''}
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">Từ ${formatPrice(Math.min(...product.variants.map(v => v.price)))}</p>
                <a href="#product/${product.id}" class="view-details" onclick="event.stopPropagation()">Xem chi tiết</a>
            </div>
        </div>
    `).join('');
}

// RENDER FILTER LIST
function renderFilterList() {
    const container = document.getElementById('filterList');
    const categories = [...new Set(Object.values(products).map(p => p.category))];

    const allItem = '<li class="active" onclick="filterProducts(this, \'all\')">Tất cả sản phẩm</li>';
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
                    <img src="${product.image}" alt="${product.name}">
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
                                <input type="radio" name="variant" value="${index}" ${index === 0 ? 'checked' : ''} onchange="selectVariant(${index})">
                                <div class="variant-info">
                                    <div class="variant-name">${variant.name}</div>
                                    ${variant.note ? `<div class="variant-note">${variant.note}</div>` : ''}
                                    <div class="variant-note">${variant.duration}</div>
                                </div>
                                <div class="variant-price">${formatPrice(variant.price)}</div>
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

// ADD TO CART
function addToCart(productId) {
    const product = products[productId];
    const selectedOptions = document.querySelector('input[name="variant"]:checked');
    if (!selectedOptions) return;

    const selectedVariantIndex = selectedOptions.value;
    const variant = product.variants[selectedVariantIndex];

    const cartItem = {
        productId: productId,
        productName: product.name,
        variantName: variant.name,
        price: variant.price,
        image: product.image
    };

    cart.push(cartItem);
    updateCartUI();
    toggleCart();
    // V2: Show success toast
    showToast(`Đã thêm ${product.name} vào giỏ`, 'success');
}

// UPDATE CART UI
function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');

    cartCount.textContent = cart.length;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="cart-empty"><p>Giỏ hàng trống</p></div>';
        cartFooter.style.display = 'none';

        // Hide red dot if 0
        cartCount.style.display = 'none';
    } else {
        cartCount.style.display = 'flex';

        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.productName}">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.productName}</div>
                    <div class="cart-item-variant">${item.variantName}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                </div>
                <span class="remove-item" onclick="removeFromCart(${index})">×</span>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotal.textContent = formatPrice(total);
        cartFooter.style.display = 'block';
    }
}

// REMOVE FROM CART
function removeFromCart(index) {
    cart.splice(index, 1);
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

// RENDER CHECKOUT SUMMARY
function renderCheckoutSummary() {
    const container = document.getElementById('checkoutSummary');
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    if (cart.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 20px;">Vui lòng thêm sản phẩm vào giỏ</div>';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.productName} - ${item.variantName}</span>
            <span>${formatPrice(item.price)}</span>
        </div>
    `).join('');

    document.getElementById('checkoutTotal').textContent = formatPrice(total);
}

// PLACE ORDER
function placeOrder() {
    if (cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }

    const name = document.getElementById('customerName').value;
    const email = document.getElementById('customerEmail').value;
    const phone = document.getElementById('customerPhone').value;

    if (!name || !email || !phone) {
        showToast('Vui lòng điền đầy đủ thông tin!', 'error');
        // Trigger validation on all fields
        validateInput(document.getElementById('customerName'));
        validateInput(document.getElementById('customerEmail'));
        validateInput(document.getElementById('customerPhone'));
        return;
    }

    // Check for any remaining errors
    if (document.querySelectorAll('.error').length > 0) {
        showToast('Vui lòng kiểm tra lại thông tin!', 'error');
        return;
    }

    const orderCode = 'TBQ' + Date.now().toString().slice(-8);
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    // V2: Store order for invoice
    lastOrder = {
        code: orderCode,
        date: new Date().toLocaleString('vi-VN'),
        customer: { name, email, phone },
        items: [...cart],
        total: total
    };

    document.getElementById('orderCode').textContent = orderCode;
    document.getElementById('transferContent').textContent = orderCode;
    document.getElementById('transferAmount').textContent = formatPrice(total);

    // Generate QR Code for TP Bank
    const qrCodeUrl = generateTPBankQR(orderCode, total);
    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.innerHTML = `
        <h4 style="font-size: 18px; margin-bottom: 16px; color: var(--accent);">
            📱 Quét mã QR để thanh toán nhanh
        </h4>
        <div style="background: white; padding: 20px; border-radius: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 280px; height: 280px; border-radius: 12px;">
        </div>
        <p style="font-size: 14px; color: var(--text-secondary); margin-top: 12px; max-width: 320px; margin-left: auto; margin-right: auto;">
            Mở app ngân hàng → Quét mã QR → Xác nhận thanh toán
        </p>
        <div id="paymentStatus" style="margin-top: 20px; font-weight: 600; color: var(--warning);">
            ⏳ Đang chờ thanh toán...
        </div>
    `;

    // Clear cart (but keep logic independent of UI navigation for a moment)
    cart = [];
    updateCartUI();

    // Navigate to confirmation page
    window.location.hash = 'confirmation';

    // Start polling for payment status
    startPaymentPolling(orderCode, total);
}

// POLL PAYMENT STATUS
let pollingInterval;
function startPaymentPolling(orderCode, amount) {
    if (pollingInterval) clearInterval(pollingInterval);

    let attempts = 0;
    const maxAttempts = 100; // Stop after ~5 minutes (3s * 100)

    // Simulate caching/localstorage to persist order if refresh? (Future V2 improvement)

    pollingInterval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(pollingInterval);
            return;
        }

        try {
            // Call Netlify Function
            const response = await fetch(`/.netlify/functions/check-payment?orderCode=${orderCode}&amount=${amount}`);
            const data = await response.json();

            if (data.status === 'paid') {
                clearInterval(pollingInterval);

                // AUTO-DELIVERY UI
                const deliveryMsg = data.delivery ?
                    `<div style="margin-top:16px; padding:16px; background:#f0fdf4; border:1px solid #4ade80; border-radius:8px; text-align:left;">
                        <strong style="color:#15803d; display:block; margin-bottom:8px;">📦 Đơn hàng của bạn:</strong>
                        <code style="display:block; background:white; padding:8px; border-radius:4px; border:1px solid #ddd; font-family:monospace;">${data.delivery}</code>
                        <p style="font-size:12px; color:#15803d; margin-top:8px;">*Hãy lưu lại thông tin này ngay.</p>
                     </div>`
                    : '';

                const statusEl = document.getElementById('paymentStatus');
                if (statusEl) {
                    statusEl.innerHTML = `
                        <span style="color: var(--success); font-size: 18px; display:block; margin-bottom:8px;">
                            ✅ Thanh toán thành công!
                        </span>
                        ${deliveryMsg}
                    `;
                }
            }
        } catch (error) {
            console.error("Error checking payment:", error);
        }
    }, 3000); // Check every 3 seconds
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

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
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
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
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
    doc.text(`Ma don hang: ${lastOrder.code}`, 20, 40);
    doc.text(`Ngay: ${lastOrder.date}`, 20, 50);

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
