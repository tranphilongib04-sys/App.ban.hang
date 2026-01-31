/* ==========================================
   Products Catalog - JavaScript
   Rich Data with Descriptions, Features, Manuals
   ========================================== */

const CATALOG = [
    // --- AI & Productivity ---
    {
        id: 'chatgpt-1m',
        groupId: 'chatgpt',
        name: 'ChatGPT Plus',
        category: 'ai',
        categoryLabel: 'AI & Năng suất',
        desc: 'GPT-4o không giới hạn, viết content, code, brainstorm',
        logo: 'assets/logos/chatgpt.svg',
        duration: '1 tháng',
        price: 70000,
        originalPrice: 100000,
        longDescription: `
            <p>ChatGPT Plus mở khóa sức mạnh của mô hình AI tiên tiến nhất hiện nay từ OpenAI. Bạn sẽ được ưu tiên truy cập vào GPT-4o, tốc độ phản hồi nhanh hơn và khả năng xử lý các tác vụ phức tạp.</p>
            <p>Phù hợp cho: Content Writer, Programmer, Marketer, và bất kỳ ai muốn tăng hiệu suất làm việc.</p>
        `,
        features: [
            'Truy cập GPT-4o, GPT-4 không giới hạn',
            'Phản hồi nhanh hơn, không phải chờ đợi',
            'Sử dụng Plugin và Browsing (duyệt web)',
            'Phân tích dữ liệu nâng cao (Advanced Data Analysis)',
            'Tạo ảnh với DALL-E 3'
        ],
        manual: `
            <ol>
                <li>Truy cập <a href="https://chat.openai.com" target="_blank">chat.openai.com</a></li>
                <li>Chọn "Log in" và nhập Email/Password đã nhận.</li>
                <li>Bắt đầu trò chuyện với GPT-4o. Chọn model ở góc trên bên trái màn hình.</li>
                <li>Để tạo ảnh, chỉ cần gõ yêu cầu bắt đầu bằng "Vẽ..." hoặc "Create an image of..."</li>
            </ol>
        `,
        warranty: 'Bảo hành 1 đổi 1 trong suốt thời gian sử dụng (30 ngày). Nếu tài khoản bị lỗi hoặc mất Premium, liên hệ Zalo để được cấp tài khoản mới ngay lập tức.'
    },
    {
        id: 'chatgpt-3m',
        groupId: 'chatgpt',
        name: 'ChatGPT Plus',
        category: 'ai',
        categoryLabel: 'AI & Năng suất',
        desc: 'GPT-4o không giới hạn, viết content, code, brainstorm',
        logo: 'assets/logos/chatgpt.svg',
        duration: '3 tháng',
        price: 180000,
        originalPrice: 300000,
        longDescription: `
             <p>Gói 3 tháng tiết kiệm hơn. ChatGPT Plus mở khóa sức mạnh của mô hình AI tiên tiến nhất hiện nay từ OpenAI. Bạn sẽ được ưu tiên truy cập vào GPT-4o.</p>
        `,
        features: [
            'Truy cập GPT-4o, GPT-4 không giới hạn',
            'Tiết kiệm 30.000đ so với mua lẻ',
            'Tạo ảnh với DALL-E 3',
            'Phân tích dữ liệu và Code Interpreter'
        ],
        manual: `
            <ol>
                <li>Truy cập <a href="https://chat.openai.com" target="_blank">chat.openai.com</a></li>
                <li>Đăng nhập bằng tài khoản được cấp.</li>
                <li>Sử dụng liên tục trong 3 tháng không cần đổi tài khoản.</li>
            </ol>
        `,
        warranty: 'Bảo hành full 90 ngày. Hỗ trợ kỹ thuật 24/7.'
    },

    // --- Design ---
    {
        id: 'canva-1m',
        groupId: 'canva',
        name: 'Canva Pro',
        category: 'design',
        categoryLabel: 'Thiết kế',
        desc: 'Hàng triệu template, xóa nền, Brand Kit không giới hạn',
        logo: 'assets/logos/canva.svg',
        duration: '1 tháng',
        price: 50000,
        originalPrice: 80000,
        longDescription: `
            <p>Canva Pro giúp bạn thiết kế mọi thứ dễ dàng. Từ bài đăng Facebook, Instagram đến slide thuyết trình chuyên nghiệp. Mở khóa kho tài nguyên khổng lồ gồm ảnh, font chữ, video và công cụ AI Magic.</p>
        `,
        features: [
            'Truy cập hơn 100 triệu ảnh, video, âm thanh cao cấp',
            'Công cụ Magic Resize và Xóa nền ảnh (Background Remover)',
            'Brand Kit: Quản lý logo, màu sắc thương hiệu',
            'Mời thành viên vào team',
            'Lên lịch đăng bài mạng xã hội'
        ],
        manual: `
            <ol>
                <li>Truy cập <a href="https://canva.com" target="_blank">canva.com</a></li>
                <li>Đăng nhập tài khoản.</li>
                <li>Để tham gia team Pro: Click vào link mời trong email (hoặc copy link gửi kèm đơn hàng).</li>
                <li>Bắt đầu thiết kế với tất cả tính năng Pro đã được mở khóa.</li>
            </ol>
        `,
        warranty: 'Bảo hành 1 tháng. Nếu mất Pro sẽ được add lại vào team mới.'
    },
    {
        id: 'capcut-1m',
        groupId: 'capcut',
        name: 'CapCut Pro',
        category: 'design',
        categoryLabel: 'Thiết kế',
        desc: 'Edit video không watermark, full hiệu ứng premium',
        logo: 'assets/logos/capcut.svg',
        duration: '1 tháng',
        price: 35000,
        originalPrice: 60000,
        longDescription: `
            <p>CapCut Pro PC/Mobile mở khóa các tính năng chỉnh sửa video chuyên nghiệp. Xóa watermark, sử dụng các hiệu ứng, bộ lọc màu và chuyển cảnh độc quyền chỉ dành cho thành viên Pro.</p>
        `,
        features: [
            'Xóa logo (watermark) CapCut',
            'Mở khóa hiệu ứng Video/Body Effect Pro',
            'Tính năng Auto Captions (Phụ đề tự động) không giới hạn',
            'Xuất video 4K chất lượng cao',
            'Kho nhạc và Sticker bản quyền'
        ],
        manual: `
            <ol>
                <li>Mở app CapCut trên điện thoại hoặc PC.</li>
                <li>Đăng nhập bằng tài khoản (Email/Pass) shop cung cấp.</li>
                <li>Bạn sẽ thấy huy hiệu "Pro" trên avatar.</li>
                <li>Khi xuất video, logo CapCut sẽ tự động biến mất.</li>
            </ol>
        `,
        warranty: 'Bảo hành 30 ngày. Cam kết tài khoản chính chủ, không bị quét.'
    },
    {
        id: 'adobe-1m',
        groupId: 'adobe',
        name: 'Adobe Creative Cloud',
        category: 'design',
        categoryLabel: 'Thiết kế',
        desc: 'Photoshop, Illustrator, Premiere, After Effects...',
        logo: 'assets/logos/adobe.svg',
        duration: '1 tháng',
        price: 150000,
        originalPrice: 250000,
        longDescription: `
            <p>Bộ công cụ sáng tạo mạnh mẽ nhất thế giới. Bao gồm tất cả ứng dụng Adobe: Photoshop, Illustrator, Premiere Pro, After Effects, Acrobat Pro, và nhiều hơn nữa. Tích hợp Cloud lưu trữ.</p>
        `,
        features: [
            'Sử dụng hơn 20+ ứng dụng Adobe Desktop & Mobile',
            'Bao gồm Generative Fill (AI) trong Photoshop',
            '100GB Cloud Storage',
            'Adobe Fonts miễn phí',
            'Cập nhật phiên bản mới nhất tự động'
        ],
        manual: `
            <ol>
                <li>Bạn cung cấp Email chính chủ của bạn cho shop.</li>
                <li>Shop sẽ gửi lời mời tham gia Adobe Team vào email.</li>
                <li>Bạn mở email, bấm "Accept Invitation".</li>
                <li>Đăng nhập Adobe Creative Cloud và tải app về máy.</li>
            </ol>
        `,
        warranty: 'Bảo hành 25 ngày. Nâng cấp chính chủ trên email của bạn.'
    },

    // --- Entertainment ---
    {
        id: 'spotify-1m',
        groupId: 'spotify',
        name: 'Spotify Premium',
        category: 'entertainment',
        categoryLabel: 'Giải trí',
        desc: 'Nghe nhạc không quảng cáo, offline, chất lượng cao',
        logo: 'assets/logos/spotify.svg',
        duration: '1 tháng',
        price: 30000,
        originalPrice: 59000,
        longDescription: `
            <p>Spotify Premium mang đến trải nghiệm nghe nhạc hoàn hảo. Không bị làm phiền bởi quảng cáo, có thể nghe offline khi không có mạng, và chất lượng âm thanh 320kbps cực đỉnh.</p>
        `,
        features: [
            'Nghe nhạc không quảng cáo',
            'Tải nhạc nghe Offline (không cần mạng)',
            'Chuyển bài không giới hạn',
            'Chất lượng âm thanh cao nhất',
            'Nghe cùng bạn bè (Jam)'
        ],
        manual: `
            <ol>
                <li>Shop sẽ gửi Invite Link tham gia Family Plan.</li>
                <li>Đăng nhập tài khoản Spotify của bạn.</li>
                <li>Bấm vào link shop gửi và xác nhận địa chỉ (shop cung cấp địa chỉ).</li>
                <li>Tài khoản của bạn sẽ lên Premium ngay lập tức. Giữ nguyên playlist, lịch sử nghe.</li>
            </ol>
        `,
        warranty: 'Bảo hành 1 tháng. Nếu bị kick khỏi Family sẽ được add lại.'
    },
    {
        id: 'netflix-1m',
        groupId: 'netflix',
        name: 'Netflix Premium',
        category: 'entertainment',
        categoryLabel: 'Giải trí',
        desc: 'Xem phim 4K HDR, slot riêng không bị đá',
        logo: 'assets/logos/netflix.svg',
        duration: '1 tháng',
        price: 70000,
        originalPrice: 120000,
        longDescription: `
            <p>Thưởng thức kho phim khổng lồ của Netflix với chất lượng cao nhất Ultra HD 4K. Tài khoản ổn định, mỗi người một Profile riêng biệt có đặt mã PIN bảo mật.</p>
        `,
        features: [
            'Chất lượng 4K Ultra HD + HDR',
            'Âm thanh vòm Spatial Audio',
            'Xem trên TV, Điện thoại, Máy tính',
            'Profile riêng tư có PIN code',
            'Không cần Fake IP'
        ],
        manual: `
            <ol>
                <li>Truy cập Netflix trên web hoặc app.</li>
                <li>Đăng nhập bằng Email/Pass shop cấp.</li>
                <li>Chọn đúng Profile có tên bạn (hoặc số thứ tự shop báo).</li>
                <li>Không đổi pass, không đổi tên Profile người khác.</li>
            </ol>
        `,
        warranty: 'Bảo hành 28-30 ngày. Lỗi đổi mới trong 24h.'
    },

    // --- Learning ---
    {
        id: 'quizlet-1y',
        groupId: 'quizlet',
        name: 'Quizlet Plus',
        category: 'learning',
        categoryLabel: 'Học tập',
        desc: 'Flashcard thông minh, học offline, không quảng cáo',
        logo: 'assets/logos/quizlet.svg',
        duration: '1 năm',
        price: 160000,
        originalPrice: 300000,
        longDescription: `
            <p>Công cụ học tập số 1 cho học sinh, sinh viên. Quizlet Plus giúp bạn học nhanh hơn, nhớ lâu hơn với các chế độ học thông minh và không bị gián đoạn bởi quảng cáo.</p>
        `,
        features: [
            'Học không quảng cáo',
            'Chế độ Học (Learn Mode) thông minh',
            'Tải set về học Offline trên app',
            'Scan tài liệu để tạo set nhanh chóng',
            'Định dạng văn bản (in đậm, tô màu...)'
        ],
        manual: `
            <ol>
                <li>Shop sẽ gửi link nâng cấp vào email của bạn (hoặc gửi tài khoản có sẵn).</li>
                <li>Đăng nhập Quizlet và click vào link để kích hoạt Plus.</li>
                <li>Kiểm tra trạng thái tài khoản trong phần Cài đặt.</li>
            </ol>
        `,
        warranty: 'Bảo hành 1 năm. Nâng cấp chính chủ.'
    },
];

// Utility functions
function formatPrice(price) {
    return price.toLocaleString('vi-VN') + 'đ';
}

function getDiscount(original, current) {
    return Math.round((1 - current / original) * 100);
}

// Get Product by ID
function getProductById(id) {
    return CATALOG.find(p => p.id === id);
}

// Get Related Products
function getRelatedProducts(product) {
    return CATALOG.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
}

// Add to Cart
function addToCart(productId) {
    const product = getProductById(productId);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem('tbq_cart')) || [];
    if (!cart.some(item => item.id === productId)) {
        cart.push({ ...product, quantity: 1 });
        localStorage.setItem('tbq_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('storage')); // Trigger update
        showToast(`Đã thêm ${product.name} vào giỏ`);
    } else {
        showToast('Sản phẩm đã có trong giỏ', '⚠️');
    }
}

// Buy Now (Add and Redirect)
function buyNow(productId) {
    const product = getProductById(productId);
    if (!product) return;

    // Clear cart or append? Usually buy now replaces or adds. 
    // Let's just add and go to checkout for simplicity, but best UX might be direct checkout.
    // For this flow: Add to cart -> Go to checkout.
    let cart = JSON.parse(localStorage.getItem('tbq_cart')) || [];

    if (!cart.some(item => item.id === productId)) {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('tbq_cart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

// Make globally available
window.CATALOG = CATALOG;
window.formatPrice = formatPrice;
window.getDiscount = getDiscount;
window.getProductById = getProductById;
window.getRelatedProducts = getRelatedProducts;
window.buyNow = buyNow;
window.addToCart = addToCart;
