// PRODUCT DATA
const products = {
    chatgpt: {
        id: 'chatgpt',
        name: 'ChatGPT',
        category: 'AI',
        deliveryType: 'instant',
        description: 'Trợ lý AI thông minh nhất hiện nay, hỗ trợ viết lách, code, và nhiều tác vụ khác',
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
        featured: true,
        rating: 4.8,
        reviewCount: 34,
        soldCount: 156,
        variants: [
            { name: 'ChatGPT Plus Acc Cấp Sẵn', price: 70000, duration: '1 tháng', note: 'Cấp acc mới, full bảo hành', productCode: 'chatgpt_acc_cap_san_fbh', deliveryType: 'preorder' },
            { name: 'ChatGPT Plus Gia Hạn Acc Cũ', price: 90000, duration: '1 tháng', note: 'Gia hạn TK cũ của bạn, không bảo hành', productCode: 'chatgpt_plus_cap_tk', deliveryType: 'preorder' },
            { name: 'ChatGPT Plus Chính Chủ - FBH', price: 190000, duration: '1 tháng', note: 'Hàng die đền khách, gia hạn TK cũ', productCode: 'chatgpt_plus_gia_han', deliveryType: 'preorder' },
            { name: 'ChatGPT Team (có model pro)', price: 100000, duration: '1 tháng', note: 'Hỗ trợ bảo hành khi hết credit', productCode: 'chatgpt_team_1m', deliveryType: 'preorder' },
            { name: 'ChatGPT Go', price: 160000, duration: '1 năm', note: 'Bảo hành 1 tháng', productCode: 'chatgpt_go_1y' }
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
                    <li><strong>ChatGPT Plus Acc Cấp Sẵn:</strong> Cấp acc mới, full bảo hành</li>
                    <li><strong>ChatGPT Plus Gia Hạn Acc Cũ:</strong> Gia hạn TK cũ, không bảo hành</li>
                    <li><strong>ChatGPT Plus Chính Chủ FBH:</strong> Hàng die đền khách, gia hạn TK cũ</li>
                    <li><strong>ChatGPT Team (có model pro):</strong> Hỗ trợ bảo hành khi hết credit</li>
                    <li><strong>ChatGPT Go:</strong> Bảo hành 1 tháng</li>
                </ul>
                <p>Nếu có bất kỳ vấn đề gì, vui lòng liên hệ Zalo: 0988428496 để được hỗ trợ ngay lập tức.</p>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <p><strong>Đối với gói KBH (cấp TK mới – giao liền):</strong></p>
                <ul>
                    <li>Sau khi thanh toán, bạn sẽ nhận được tài khoản/mật khẩu qua Zalo</li>
                    <li>Đăng nhập tại chat.openai.com</li>
                    <li>Bắt đầu sử dụng ngay</li>
                </ul>
                <p><strong>Đối với gói KBH/FBH gia hạn TK cũ (giao sau):</strong></p>
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
        deliveryType: 'preorder',
        description: 'Xem phim, series không giới hạn với chất lượng 4K HDR',
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
        featured: true,
        rating: 4.7,
        reviewCount: 29,
        soldCount: 132,
        variants: [
            { name: 'Netflix Slot 1 tháng', price: 70000, duration: '1 tháng', note: 'Share slot, xem được từ 1-2 thiết bị', productCode: 'netflix_slot_1m', deliveryType: 'preorder' },
            { name: 'Netflix Extra 1 tháng', price: 75000, duration: '1 tháng', note: 'Cấp TK/MK riêng', productCode: 'netflix_extra_1m', deliveryType: 'preorder' }
        ],
        tabs: {
            description: `
                <h3>Về Netflix</h3>
                <p>Dịch vụ xem phim trực tuyến hàng đầu thế giới:</p>
                <ul>
                    <li>Xem phim, series không giới hạn</li>
                    <li>Chất lượng 4K HDR sắc nét</li>
                    <li>Kho phim đa dạng, cập nhật liên tục</li>
                    <li>Hỗ trợ nhiều thiết bị</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong suốt thời gian sử dụng</li>
                    <li>Hỗ trợ đổi tài khoản nếu có vấn đề</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Sau khi thanh toán, nhắn Zalo: 0988428496 để nhận tài khoản</li>
                    <li>Chờ xử lý trong 5-10 phút, kiểm tra theo hướng dẫn</li>
                </ul>
                <p><strong>Lưu ý:</strong> Giữ liên lạc qua Zalo để được hỗ trợ nhanh nhất.</p>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Thanh toán xong nhận tài khoản khi nào?</strong></p>
                <p>A: Nhắn Zalo sau khi thanh toán, nhận trong 5-10 phút.</p>
            `
        }
    },
    spotify: {
        id: 'spotify',
        name: 'Spotify Premium',
        category: 'Giải trí',
        deliveryType: 'preorder',
        description: 'Nghe nhạc không quảng cáo, chất lượng cao với hàng triệu bài hát',
        image: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
        featured: true,
        rating: 4.6,
        reviewCount: 18,
        soldCount: 98,
        variants: [
            { name: 'Spotify Premium 1 tháng', price: 30000, duration: '1 tháng', note: '', productCode: 'spotify_premium_1m', deliveryType: 'preorder' },
            { name: 'Spotify Premium 4 tháng', price: 115000, duration: '4 tháng', note: '', productCode: 'spotify_premium_4m', deliveryType: 'preorder' },
            { name: 'Spotify Premium 1 năm', price: 350000, duration: '1 năm', note: '', productCode: 'spotify_premium_1y', deliveryType: 'preorder' }
        ],
        tabs: {
            description: `
                <h3>Về Spotify Premium</h3>
                <p>Nền tảng nghe nhạc trực tuyến hàng đầu thế giới:</p>
                <ul>
                    <li>Nghe nhạc không quảng cáo</li>
                    <li>Chất lượng âm thanh cao</li>
                    <li>Download nhạc nghe offline</li>
                    <li>Hàng triệu bài hát và podcast</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong suốt thời gian sử dụng</li>
                    <li>Hỗ trợ 24/7 khi có vấn đề</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Nhắn Zalo: 0988428496 để được tư vấn gói giao sau phù hợp</li>
                    <li>Thanh toán theo hướng dẫn trên trang đặt hàng</li>
                    <li>Chờ xử lý trong 5-10 phút, sau đó kiểm tra kết quả theo hướng dẫn</li>
                </ul>
                <p><strong>Lưu ý:</strong> Giữ liên lạc qua Zalo để được hỗ trợ nhanh nhất khi có vấn đề.</p>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có mất dữ liệu không?</strong></p>
                <p>A: Không, playlist và thư viện của bạn vẫn được giữ nguyên.</p>
                <p><strong>Q: Dùng được trên bao nhiêu thiết bị?</strong></p>
                <p>A: Không giới hạn thiết bị, nhưng chỉ phát 1 thiết bị cùng lúc.</p>
                <p><strong>Q: Thanh toán xong nhận tài khoản khi nào?</strong></p>
                <p>A: Nhắn Zalo sau khi thanh toán, nhận trong 5-10 phút.</p>
            `
        }
    },
    adobe: {
        id: 'adobe',
        name: 'Adobe Creative Cloud',
        category: 'Thiết kế',
        deliveryType: 'preorder',
        description: 'Bộ công cụ thiết kế chuyên nghiệp với Photoshop, Illustrator, Premiere Pro...',
        image: 'https://www.adobe.com/content/dam/cc/icons/Adobe_Corporate_Horizontal_Red_HEX.svg',
        featured: true,
        rating: 4.9,
        reviewCount: 39,
        soldCount: 187,
        variants: [
            { name: 'Adobe 4 tháng KBH', price: 100000, duration: '4 tháng', note: 'Không bảo hành', productCode: 'adobe_4m_kbh' },
            { name: 'Adobe 1 năm Log Ultraview', price: 400000, duration: '1 năm', note: '', productCode: 'adobe_1y_ultraview' },
            { name: 'Adobe 1 năm cấp TK/MK', price: 500000, duration: '1 năm', note: '', productCode: 'adobe_1y_tkmk' }
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
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <p><strong>Gói cấp TK/MK:</strong></p>
                <ul>
                    <li>Nhắn Zalo: 0988428496 sau khi thanh toán</li>
                    <li>Nhận tài khoản/mật khẩu trong 5-10 phút</li>
                    <li>Đăng nhập tại adobe.com và download ứng dụng</li>
                </ul>
                <p><strong>Gói Log Ultraview:</strong></p>
                <ul>
                    <li>Admin gửi link đăng nhập qua Zalo</li>
                    <li>Mở link và đăng nhập trực tiếp</li>
                    <li>Không cần nhập TK/MK</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có đầy đủ tất cả ứng dụng không?</strong></p>
                <p>A: Có, bạn có thể sử dụng toàn bộ bộ Adobe Creative Cloud.</p>
                <p><strong>Q: Gói Log Ultraview là gì?</strong></p>
                <p>A: Đăng nhập qua link, không cần nhập tài khoản/mật khẩu.</p>
                <p><strong>Q: Gói 4 tháng KBH là gì?</strong></p>
                <p>A: Gói giá rẻ, không bảo hành nếu tài khoản bị mất.</p>
            `
        }
    },
    youtube: {
        id: 'youtube',
        name: 'YouTube Premium',
        category: 'Giải trí',
        deliveryType: 'preorder',
        description: 'Xem YouTube không quảng cáo, nghe nhạc nền và download video',
        image: 'https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg',
        featured: true,
        rating: 4.5,
        reviewCount: 22,
        soldCount: 89,
        variants: [
            { name: 'YouTube Premium FBH', price: 40000, duration: '1 tháng', note: 'Khách cấp TK Gmail, Full bảo hành', productCode: 'youtube_premium_1m' }
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
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Gửi địa chỉ Gmail của bạn qua Zalo: 0988428496</li>
                    <li>Admin sẽ thêm vào Family plan trong 5-10 phút</li>
                    <li>Nhận thông báo và bắt đầu sử dụng</li>
                </ul>
                <p><strong>Lưu ý:</strong> Không rời khỏi Family plan, nếu không sẽ mất Premium.</p>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có ảnh hưởng đến tài khoản Gmail không?</strong></p>
                <p>A: Không, hoàn toàn an toàn.</p>
                <p><strong>Q: Có được YouTube Music Premium không?</strong></p>
                <p>A: Có, bạn được cả YouTube Premium và YouTube Music.</p>
                <p><strong>Q: Thanh toán xong nhận tài khoản khi nào?</strong></p>
                <p>A: Nhắn Zalo sau khi thanh toán, được thêm vào Family trong 5-10 phút.</p>
            `
        }
    },
    duolingo: {
        id: 'duolingo',
        name: 'Duolingo Plus',
        category: 'Học tập',
        deliveryType: 'preorder',
        description: 'Học ngoại ngữ hiệu quả với Duolingo Premium',
        image: 'images/duolingo-logo.png',
        featured: false,
        rating: 4.7,
        reviewCount: 15,
        soldCount: 45,
        variants: [
            { name: 'Duolingo Plus 1 năm FBH', price: 210000, duration: '1 năm', note: 'Khách cấp TK Email, Full bảo hành', productCode: 'duolingo_plus_1y' }
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
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Full bảo hành trong suốt 1 năm sử dụng</li>
                    <li>Hỗ trợ đổi tài khoản nếu có vấn đề</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Cung cấp email Duolingo của bạn qua Zalo: 0988428496</li>
                    <li>Admin sẽ nâng cấp lên Duolingo Plus trong 5-10 phút</li>
                    <li>Đăng nhập app Duolingo và bắt đầu học</li>
                </ul>
                <p><strong>Lưu ý:</strong> Không thay đổi email hoặc mật khẩu tài khoản.</p>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có mất dữ liệu học tập không?</strong></p>
                <p>A: Không, toàn bộ tiến độ học và streak của bạn được giữ nguyên.</p>
                <p><strong>Q: Dùng được trên bao nhiêu thiết bị?</strong></p>
                <p>A: Dùng được trên tất cả thiết bị đã đăng nhập email.</p>
                <p><strong>Q: Thanh toán như thế nào?</strong></p>
                <p>A: Chuyển khoản ngân hàng, sau đó nhắn Zalo gửi bill.</p>
            `
        }
    },
    ms365: {
        id: 'ms365',
        name: 'Microsoft 365',
        category: 'Công cụ',
        deliveryType: 'preorder',
        description: 'Bộ công cụ văn phòng Microsoft Office với Word, Excel, PowerPoint...',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png',
        featured: false,
        rating: 4.8,
        reviewCount: 21,
        soldCount: 76,
        variants: [
            { name: 'MS 365 1 năm FBH', price: 160000, duration: '1 năm', note: 'Khách cấp Email, Full bảo hành', productCode: 'ms365_1y' }
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
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Full bảo hành trong suốt 1 năm sử dụng</li>
                    <li>Hỗ trợ kích hoạt lại nếu bị mất quyền</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Cung cấp email Microsoft của bạn qua Zalo: 0988428496</li>
                    <li>Admin sẽ kích hoạt MS 365 trong 5-10 phút</li>
                    <li>Đăng nhập tại office.com và download ứng dụng</li>
                    <li>Cài đặt trên tối đa 5 thiết bị</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Dùng được trên Windows và Mac không?</strong></p>
                <p>A: Có, hỗ trợ cả Windows, Mac, iOS và Android.</p>
                <p><strong>Q: Có được 1TB OneDrive không?</strong></p>
                <p>A: Có, bạn sẽ được 1TB lưu trữ đám mây OneDrive.</p>
                <p><strong>Q: Download ứng dụng ở đâu?</strong></p>
                <p>A: Đăng nhập office.com → Install Office → Download bộ cài.</p>
            `
        }
    },
    quizlet: {
        id: 'quizlet',
        name: 'Quizlet',
        category: 'Học tập',
        deliveryType: 'preorder',
        description: 'Ứng dụng học tập với flashcard và công cụ ghi nhớ hiệu quả',
        image: 'images/quizlet-logo.png',
        featured: false,
        rating: 4.5,
        reviewCount: 12,
        soldCount: 34,
        variants: [
            { name: 'Quizlet Plus 1 năm', price: 160000, duration: '1 năm', note: 'Khách cấp TK/MK', productCode: 'quizlet_plus_1y' },
            { name: 'Quizlet Unlimited 1 năm', price: 220000, duration: '1 năm', note: 'Khách cấp TK/MK', productCode: 'quizlet_unlimited_1y' }
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
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong suốt 1 năm sử dụng</li>
                    <li>Hỗ trợ đổi tài khoản nếu có vấn đề</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Gửi TK/MK Quizlet của bạn qua Zalo: 0988428496</li>
                    <li>Admin sẽ nâng cấp trong 5-10 phút</li>
                    <li>Đăng nhập app Quizlet và bắt đầu học</li>
                </ul>
                <p><strong>Lưu ý:</strong> Không thay đổi mật khẩu sau khi được nâng cấp.</p>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Quizlet Plus và Unlimited khác gì?</strong></p>
                <p>A: Unlimited có thêm tính năng AI, giải thích chuyên sâu hơn.</p>
                <p><strong>Q: Dùng được trên bao nhiêu thiết bị?</strong></p>
                <p>A: Không giới hạn thiết bị, đăng nhập cùng TK/MK.</p>
                <p><strong>Q: Có mất flashcard đã tạo không?</strong></p>
                <p>A: Không, toàn bộ dữ liệu giữ nguyên.</p>
            `
        }
    },
    canva: {
        id: 'canva',
        name: 'Canva Pro',
        category: 'Thiết kế',
        deliveryType: 'preorder',
        description: 'Công cụ thiết kế đồ họa online dễ sử dụng với hàng triệu template',
        image: 'images/canva-logo.png',
        featured: false,
        rating: 4.6,
        reviewCount: 16,
        soldCount: 52,
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
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Full bảo hành trong suốt 1 năm sử dụng</li>
                    <li>Hỗ trợ đổi tài khoản nếu bị mất quyền</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Cung cấp email Canva của bạn qua Zalo: 0988428496</li>
                    <li>Admin sẽ nâng cấp trong 5-10 phút</li>
                    <li>Đăng nhập canva.com và sử dụng ngay</li>
                </ul>
                <p><strong>Lưu ý:</strong> Không thay đổi email hoặc mật khẩu tài khoản.</p>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Canva Edu và Canva Pro khác gì?</strong></p>
                <p>A: Cùng tính năng, Edu rẻ hơn nhưng chỉ dành cho email giáo dục.</p>
                <p><strong>Q: Có mất thiết kế đã tạo không?</strong></p>
                <p>A: Không, toàn bộ thiết kế giữ nguyên.</p>
                <p><strong>Q: Dùng được trên điện thoại không?</strong></p>
                <p>A: Có, dùng được trên web, iOS và Android.</p>
            `
        }
    },
    capcut: {
        id: 'capcut',
        name: 'CapCut Pro',
        category: 'Thiết kế',
        deliveryType: 'instant',
        description: 'Công cụ chỉnh sửa video chuyên nghiệp, tạo trend TikTok dễ dàng',
        image: 'images/capcut-logo.png',
        featured: true,
        rating: 4.7,
        reviewCount: 25,
        soldCount: 112,
        variants: [
            { name: 'CapCut 7 ngày', price: 7000, duration: '7 ngày', note: 'Giao trong 5-10 phút', productCode: 'capcut_7d', deliveryType: 'preorder' },
            { name: 'CapCut 14 ngày', price: 15000, duration: '14 ngày', note: 'Giao liền', productCode: 'capcut_14d', deliveryType: 'instant' },
            { name: 'CapCut Pro 1 tháng', price: 30000, duration: '1 tháng', note: 'Giao liền', productCode: 'capcut_1m', deliveryType: 'instant' },
            { name: 'CapCut Pro 6 tháng', price: 160000, duration: '6 tháng', note: 'Giao liền', productCode: 'capcut_6m', deliveryType: 'instant' },
            { name: 'CapCut Pro 1 năm', price: 280000, duration: '1 năm', note: 'Giao liền', productCode: 'capcut_pro_1y', deliveryType: 'instant' }
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
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Full bảo hành trong suốt thời gian sử dụng</li>
                    <li>Hỗ trợ đổi tài khoản nếu có vấn đề</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <p><strong>⚡ Gói Giao liền (14 ngày, 1 tháng, 6 tháng, 1 năm):</strong></p>
                <ul>
                    <li>Sau khi thanh toán, bạn nhận ngay TK/MK trên màn hình</li>
                    <li>Đăng nhập app CapCut và sử dụng ngay</li>
                </ul>
                <p><strong>🕐 Gói Giao sau (7 ngày):</strong></p>
                <ul>
                    <li>Sau khi thanh toán, nhắn Zalo: 0988428496</li>
                    <li>Nhận tài khoản trong 5-10 phút</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Dùng được trên điện thoại và máy tính không?</strong></p>
                <p>A: Có, CapCut Pro dùng được trên cả điện thoại và máy tính.</p>
                <p><strong>Q: Tại sao gói 7 ngày lại là Giao sau?</strong></p>
                <p>A: Gói 7 ngày cần admin xử lý thủ công, mất 5-10 phút qua Zalo.</p>
                <p><strong>Q: Có được xuất video 4K không?</strong></p>
                <p>A: Có, CapCut Pro hỗ trợ xuất video 4K sắc nét.</p>
            `
        }
    },
    grok: {
        id: 'grok',
        name: 'Grok',
        category: 'AI',
        deliveryType: 'preorder',
        description: 'AI của xAI (Elon Musk), truy cập real-time, trả lời sắc bén và cập nhật tin tức',
        image: 'images/grok-logo.png',
        featured: true,
        rating: 4.6,
        reviewCount: 12,
        soldCount: 38,
        variants: [
            { name: 'Grok 7 ngày', price: 15000, duration: '7 ngày', note: 'Cấp TK/MK', productCode: 'grok_7d' },
            { name: 'Super Grok - Cấp sẵn', price: 270000, duration: '1 tháng', note: 'Cấp TK/MK sẵn', productCode: 'super_grok_cap_san', deliveryType: 'preorder' },
            { name: 'Super Grok - Nâng chính chủ', price: 350000, duration: '1 tháng', note: 'Khách gửi TK qua Zalo', productCode: 'super_grok_chinh_chu', deliveryType: 'preorder' }
        ],
        tabs: {
            description: `
                <h3>Về Grok</h3>
                <p>Grok là mô hình AI do xAI phát triển, tích hợp trên nền tảng X (Twitter). Grok có khả năng:</p>
                <ul>
                    <li>Truy cập thông tin real-time từ internet</li>
                    <li>Trả lời câu hỏi với phong cách thẳng thắn, hài hước</li>
                    <li>Cập nhật tin tức và xu hướng mới nhất</li>
                    <li>Hỗ trợ viết lách, phân tích, và trò chuyện thông minh</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong 7 ngày sử dụng</li>
                    <li>Hỗ trợ đổi tài khoản nếu lỗi đăng nhập</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <p><strong>Sau khi thanh toán:</strong></p>
                <ul>
                    <li>Bạn sẽ nhận ngay <strong>Tài khoản / Mật khẩu</strong> trên màn hình (giao liền)</li>
                    <li>Đăng nhập trên app X (Twitter) hoặc x.ai</li>
                    <li>Vào mục Grok để trò chuyện với AI</li>
                    <li>Không đổi mật khẩu hoặc email để tránh mất quyền truy cập</li>
                </ul>
                <p><strong>Lưu ý:</strong> Tài khoản dùng chung, vui lòng không thay đổi thông tin.</p>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Grok khác gì ChatGPT?</strong></p>
                <p>A: Grok được kết nối real-time với X (Twitter), cập nhật tin tức và có phong cách trả lời riêng.</p>
                <p><strong>Q: Dùng được trên điện thoại không?</strong></p>
                <p>A: Có, đăng nhập app X (Twitter) và vào mục Grok.</p>
                <p><strong>Q: Thanh toán xong nhận tài khoản khi nào?</strong></p>
                <p>A: Giao liền – bạn xem ngay TK/MK trên trang sau khi thanh toán thành công.</p>
            `
        }
    },
    autocad: {
        id: 'autocad',
        name: 'AutoCAD',
        category: 'Thiết kế',
        deliveryType: 'preorder',
        description: 'Phần mềm thiết kế 2D/3D chuyên nghiệp hàng đầu cho kỹ sư và kiến trúc sư',
        image: 'images/autocad-logo.svg',
        featured: false,
        rating: 4.7,
        reviewCount: 8,
        soldCount: 23,
        variants: [
            { name: 'AutoCAD nâng cấp mail chính chủ 1 năm', price: 170000, ctvPrice: 150000, duration: '1 năm', note: 'Chỉ cần cung cấp địa chỉ mail', productCode: 'autocad_1y' }
        ],
        tabs: {
            description: `
                <h3>Về AutoCAD</h3>
                <p>AutoCAD là phần mềm thiết kế CAD hàng đầu thế giới:</p>
                <ul>
                    <li>Thiết kế bản vẽ 2D và 3D chuyên nghiệp</li>
                    <li>Công cụ mạnh mẽ cho kỹ sư, kiến trúc sư</li>
                    <li>Hỗ trợ nhiều định dạng file (DWG, DXF...)</li>
                    <li>Dùng trên máy tính và web</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong suốt 1 năm sử dụng</li>
                    <li>Hỗ trợ kích hoạt lại nếu có vấn đề</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Cung cấp địa chỉ email qua Zalo: 0988428496</li>
                    <li>Admin sẽ add mail vào team trong 5-10 phút</li>
                    <li>Đăng nhập Autodesk và sử dụng AutoCAD</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Dùng được trên máy nào?</strong></p>
                <p>A: Windows và Mac đều được.</p>
                <p><strong>Q: Có cần gửi mật khẩu không?</strong></p>
                <p>A: Không, chỉ cần cung cấp địa chỉ email.</p>
            `
        }
    },
    linkedin: {
        id: 'linkedin',
        name: 'LinkedIn Business',
        category: 'Công cụ',
        deliveryType: 'preorder',
        description: 'Nâng cấp LinkedIn Premium Business/Career cho tài khoản chính chủ',
        image: 'images/linkedin-logo.png',
        featured: false,
        rating: 4.6,
        reviewCount: 10,
        soldCount: 29,
        variants: [
            { name: 'LinkedIn Business 3 tháng', price: 530000, ctvPrice: 480000, duration: '3 tháng', note: 'Nâng cấp chính chủ, cần TK/MK + OTP', productCode: 'linkedin_biz_3m' },
            { name: 'LinkedIn Business 1 năm', price: 1750000, ctvPrice: 1700000, duration: '1 năm', note: 'Nâng cấp chính chủ, cần TK/MK + OTP', productCode: 'linkedin_biz_1y' },
            { name: 'LinkedIn Career 3 tháng', price: 500000, ctvPrice: 450000, duration: '3 tháng', note: 'Nâng cấp chính chủ, cần TK/MK + OTP', productCode: 'linkedin_career_3m' }
        ],
        tabs: {
            description: `
                <h3>Về LinkedIn Premium</h3>
                <p>Nâng cấp tài khoản LinkedIn chính chủ của bạn:</p>
                <ul>
                    <li><strong>Business:</strong> InMail không giới hạn, xem ai đã ghé thăm, insights ngành</li>
                    <li><strong>Career:</strong> Nổi bật với nhà tuyển dụng, so sánh ứng viên</li>
                    <li>Nâng cấp trực tiếp trên tài khoản của bạn</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Chỉ bảo hành các vấn đề liên quan đến gói đăng ký (mất sub/mất gói)</li>
                    <li><strong>Không bảo hành:</strong> TK chưa xác thực SĐT, CCCD không khớp, TK bị ban do login nhiều IP</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Gửi tài khoản, mật khẩu LinkedIn qua Zalo: 0988428496</li>
                    <li>Cần cung cấp mã OTP khi admin yêu cầu</li>
                    <li>Admin nâng cấp trong 10-30 phút</li>
                    <li>Nhận thông báo khi hoàn tất</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có an toàn không?</strong></p>
                <p>A: Nâng cấp trực tiếp trên TK chính chủ, bạn giữ toàn quyền.</p>
                <p><strong>Q: Business và Career khác gì?</strong></p>
                <p>A: Business cho người kinh doanh, Career cho người tìm việc.</p>
            `
        }
    },
    gamma: {
        id: 'gamma',
        name: 'Gamma AI',
        category: 'AI',
        deliveryType: 'preorder',
        description: 'Tạo slide, tài liệu, trang web đẹp mắt bằng AI trong vài giây',
        image: 'images/gamma-new.png',
        featured: false,
        rating: 4.5,
        reviewCount: 6,
        soldCount: 18,
        variants: [
            { name: 'Gamma Plus chính chủ 1 tháng', price: 150000, duration: '1 tháng', note: 'Gói 10$, cần tên đăng nhập + mật khẩu', productCode: 'gamma_plus_1m' },
            { name: 'Gamma Pro hình chủ 1 tháng', price: 220000, duration: '1 tháng', note: 'Cần tên đăng nhập + mật khẩu', productCode: 'gamma_pro_1m' }
        ],
        tabs: {
            description: `
                <h3>Về Gamma AI</h3>
                <p>Gamma là công cụ AI tạo nội dung trình bày tuyệt đẹp:</p>
                <ul>
                    <li>Tạo slide thuyết trình chuyên nghiệp bằng AI</li>
                    <li>Tạo tài liệu, báo cáo đẹp mắt</li>
                    <li>Tạo trang web đơn giản</li>
                    <li>Nhiều template chuyên nghiệp</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong thời gian sử dụng</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
                <p><strong>Lưu ý:</strong> Thời gian xử lý có thể lâu, khách hàng/CTV vui lòng kiên nhẫn chờ.</p>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Gửi tên đăng nhập và mật khẩu Gamma qua Zalo: 0988428496</li>
                    <li>Admin nâng cấp (có thể mất thời gian)</li>
                    <li>Nhận thông báo khi hoàn tất</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Plus và Pro khác gì?</strong></p>
                <p>A: Pro có nhiều tính năng AI hơn và không giới hạn export.</p>
                <p><strong>Q: Mất bao lâu để nâng cấp?</strong></p>
                <p>A: Có thể mất lâu hơn các sản phẩm khác, vui lòng kiên nhẫn.</p>
            `
        }
    },
    sketchup: {
        id: 'sketchup',
        name: 'SketchUp EDU',
        category: 'Thiết kế',
        deliveryType: 'preorder',
        description: 'Phần mềm thiết kế 3D trực quan, phổ biến trong kiến trúc và nội thất',
        image: 'images/sketchup-logo.svg',
        featured: false,
        rating: 4.6,
        reviewCount: 5,
        soldCount: 14,
        variants: [
            { name: 'SketchUp EDU cấp sẵn 1 năm', price: 350000, duration: '1 năm', note: 'Cấp TK riêng, đăng nhập bằng Gmail', productCode: 'sketchup_edu_1y' }
        ],
        tabs: {
            description: `
                <h3>Về SketchUp EDU</h3>
                <p>SketchUp là phần mềm thiết kế 3D trực quan:</p>
                <ul>
                    <li>Thiết kế kiến trúc, nội thất 3D</li>
                    <li>Giao diện dễ sử dụng</li>
                    <li>Kho model 3D phong phú</li>
                    <li>Hỗ trợ render chất lượng cao</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Chỉ bảo hành gói đăng ký, không bảo hành dữ liệu Gmail</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Nhận tài khoản Gmail + mật khẩu sau khi thanh toán</li>
                    <li>Đăng nhập SketchUp bằng Gmail được cấp</li>
                    <li>Dùng riêng, không chia sẻ</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có dùng được SketchUp Pro không?</strong></p>
                <p>A: Đây là gói EDU, tính năng tương đương Pro.</p>
            `
        }
    },
    figma: {
        id: 'figma',
        name: 'Figma',
        category: 'Thiết kế',
        deliveryType: 'preorder',
        description: 'Công cụ thiết kế UI/UX hàng đầu, cộng tác real-time',
        image: 'images/figma-logo.png',
        featured: false,
        rating: 4.8,
        reviewCount: 14,
        soldCount: 41,
        variants: [
            { name: 'Figma Pro chính chủ 1 tháng', price: 200000, duration: '1 tháng', note: 'Nâng cấp chính chủ, cần tên đăng nhập + mật khẩu', productCode: 'figma_pro_1m' },
            { name: 'Figma Edu 1 năm (cấp TK)', price: 280000, duration: '1 năm', note: 'Cấp sẵn TK/MK, lấy về nhập và dùng', productCode: 'figma_edu_1y' }
        ],
        tabs: {
            description: `
                <h3>Về Figma</h3>
                <p>Figma là công cụ thiết kế UI/UX hàng đầu:</p>
                <ul>
                    <li>Thiết kế giao diện web và mobile</li>
                    <li>Cộng tác real-time với team</li>
                    <li>Prototyping tương tác</li>
                    <li>Kho plugin và component phong phú</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li><strong>Figma Pro chính chủ:</strong> Bảo hành 1 tháng</li>
                    <li><strong>Figma Edu:</strong> Bảo hành trong thời gian sử dụng</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <p><strong>Figma Pro chính chủ:</strong></p>
                <ul>
                    <li>Gửi tên đăng nhập + mật khẩu Figma qua Zalo</li>
                    <li>Admin nâng cấp trong 5-10 phút</li>
                </ul>
                <p><strong>Figma Edu:</strong></p>
                <ul>
                    <li>Nhận TK/MK sau thanh toán</li>
                    <li>Đăng nhập figma.com và sử dụng ngay</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Pro và Edu khác gì?</strong></p>
                <p>A: Pro nâng cấp trên TK chính chủ. Edu cấp TK mới với tính năng tương đương.</p>
            `
        }
    },
    autodesk: {
        id: 'autodesk',
        name: 'Autodesk Full App',
        category: 'Thiết kế',
        deliveryType: 'preorder',
        description: 'Trọn bộ ứng dụng Autodesk: AutoCAD, Revit, 3ds Max, Maya...',
        image: 'images/autodesk-logo.svg',
        featured: false,
        rating: 4.7,
        reviewCount: 7,
        soldCount: 19,
        variants: [
            { name: 'Autodesk lẻ 1 app 1 năm', price: 170000, duration: '1 năm', note: 'Chỉ cần cung cấp email', productCode: 'autodesk_1app_1y' },
            { name: 'Autodesk lẻ 2 app 1 năm', price: 250000, duration: '1 năm', note: 'Chỉ cần cung cấp email', productCode: 'autodesk_2app_1y' },
            { name: 'Autodesk chính chủ full app 1 năm', price: 370000, duration: '1 năm', note: 'Chỉ cần cung cấp email', productCode: 'autodesk_full_1y' }
        ],
        tabs: {
            description: `
                <h3>Về Autodesk Full App</h3>
                <p>Trọn bộ phần mềm Autodesk chuyên nghiệp:</p>
                <ul>
                    <li>AutoCAD - Thiết kế 2D/3D</li>
                    <li>Revit - Thiết kế kiến trúc BIM</li>
                    <li>3ds Max - Dựng hình 3D</li>
                    <li>Maya - Animation chuyên nghiệp</li>
                    <li>Và nhiều ứng dụng khác</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong suốt 1 năm sử dụng</li>
                    <li>Hỗ trợ kích hoạt lại nếu mất quyền</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Cung cấp địa chỉ email qua Zalo: 0988428496</li>
                    <li>Admin add mail vào team trong 5-10 phút</li>
                    <li>Đăng nhập Autodesk và download ứng dụng</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Lẻ 1 app là chọn app nào?</strong></p>
                <p>A: Bạn chọn 1 app bất kỳ (AutoCAD, Revit, 3ds Max...).</p>
                <p><strong>Q: Full app gồm những gì?</strong></p>
                <p>A: Toàn bộ ứng dụng Autodesk (AutoCAD, Revit, 3ds Max, Maya, Inventor...).</p>
            `
        }
    },
    meitu: {
        id: 'meitu',
        name: 'Meitu',
        category: 'Thiết kế',
        deliveryType: 'preorder',
        description: 'Ứng dụng chỉnh ảnh, làm đẹp và thiết kế ảnh chuyên nghiệp hàng đầu',
        image: 'images/meitu-logo.png',
        featured: false,
        rating: 4.6,
        reviewCount: 5,
        soldCount: 12,
        variants: [
            { name: 'Meitu VIP 1 tháng', price: 75000, duration: '1 tháng', note: 'Đăng nhập cố định 1 thiết bị', productCode: 'meitu_vip_1m' }
        ],
        tabs: {
            description: `
                <h3>Về Meitu</h3>
                <p>Meitu là ứng dụng chỉnh sửa ảnh và làm đẹp hàng đầu, với hàng ngàn bộ lọc, hiệu ứng và công cụ AI tiên tiến:</p>
                <ul>
                    <li>Chỉnh sửa ảnh chuyên nghiệp với AI</li>
                    <li>Hàng ngàn bộ lọc và hiệu ứng đẹp mắt</li>
                    <li>Công cụ làm đẹp, retouch da mặt</li>
                    <li>Thiết kế poster, collage sáng tạo</li>
                    <li>Xóa phông, thay nền thông minh</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li><strong>Bảo hành Full-Time</strong> trong suốt thời hạn sử dụng</li>
                    <li>Hỗ trợ xử lý mọi vấn đề phát sinh</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
                <p><strong>⚠️ Lưu ý quan trọng:</strong></p>
                <ul>
                    <li>Quý khách đăng nhập cố định <strong>1 thiết bị</strong></li>
                    <li>Không chỉnh sửa, thay đổi bất kỳ thông tin nào trên tài khoản</li>
                    <li>Vi phạm các điều khoản trên sẽ <strong>không được bảo hành</strong></li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Sau khi thanh toán, nhận tài khoản/mật khẩu</li>
                    <li>Đăng nhập trên 1 thiết bị duy nhất</li>
                    <li>Sử dụng đầy đủ tính năng VIP</li>
                    <li><strong>Không đổi mật khẩu, email hoặc bất kỳ thông tin nào</strong></li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Có thể dùng trên nhiều thiết bị không?</strong></p>
                <p>A: Không, chỉ đăng nhập cố định trên 1 thiết bị duy nhất.</p>
                <p><strong>Q: Có được đổi mật khẩu không?</strong></p>
                <p>A: Không, việc thay đổi thông tin tài khoản sẽ mất bảo hành.</p>
                <p><strong>Q: Bảo hành như thế nào?</strong></p>
                <p>A: Bảo hành Full-Time trong suốt thời hạn sử dụng, liên hệ Zalo khi gặp vấn đề.</p>
            `
        }
    },
    gemini: {
        id: 'gemini',
        name: 'Gemini Pro + 2TB Drive',
        category: 'AI',
        deliveryType: 'preorder',
        description: 'Google Gemini Pro kèm 2TB Google Drive, trợ lý AI mạnh mẽ từ Google',
        image: 'images/gemini-logo.png',
        featured: false,
        rating: 4.7,
        reviewCount: 4,
        soldCount: 10,
        variants: [
            { name: 'Gemini Pro + 2TB - 1 tháng', price: 25000, duration: '1 tháng', note: 'IB Zalo để nhận hàng', productCode: 'gemini_pro_1m', deliveryType: 'preorder' },
            { name: 'Gemini Pro + 2TB - 3 tháng', price: 70000, duration: '3 tháng', note: 'IB Zalo để nhận hàng', productCode: 'gemini_pro_3m', deliveryType: 'preorder' },
            { name: 'Gemini Pro + 2TB - 6 tháng', price: 120000, duration: '6 tháng', note: 'IB Zalo để nhận hàng', productCode: 'gemini_pro_6m', deliveryType: 'preorder' },
            { name: 'Gemini Pro + 2TB - 1 năm', price: 220000, duration: '1 năm', note: 'IB Zalo để nhận hàng', productCode: 'gemini_pro_1y', deliveryType: 'preorder' }
        ],
        tabs: {
            description: `
                <h3>Về Gemini Pro + 2TB Drive</h3>
                <p>Google Gemini Pro là trợ lý AI thế hệ mới từ Google, đi kèm 2TB dung lượng Google Drive:</p>
                <ul>
                    <li>Trợ lý AI Gemini Pro với khả năng xử lý đa phương tiện</li>
                    <li>2TB Google Drive lưu trữ đám mây</li>
                    <li>Tích hợp Gmail, Google Docs, Sheets</li>
                    <li>Chỉnh sửa ảnh với Magic Editor</li>
                    <li>Tạo hình ảnh AI với Imagen</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong suốt thời hạn sử dụng</li>
                    <li>Hỗ trợ xử lý mọi vấn đề phát sinh</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Sau khi thanh toán, IB Zalo: 0988428496 để nhận hàng</li>
                    <li>Admin sẽ kích hoạt trong 5-15 phút</li>
                    <li>Đăng nhập Google và sử dụng Gemini Pro</li>
                </ul>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Dùng được trên tài khoản Google cá nhân không?</strong></p>
                <p>A: Có, sẽ được add vào Google Workspace.</p>
                <p><strong>Q: 2TB Drive dùng chung hay riêng?</strong></p>
                <p>A: 2TB Drive riêng cho tài khoản của bạn.</p>
                <p><strong>Q: Nhận hàng như thế nào?</strong></p>
                <p>A: Sau khi thanh toán, IB Zalo để admin kích hoạt.</p>
            `
        }
    },
    claude: {
        id: 'claude',
        name: 'Claude Pro',
        category: 'AI',
        deliveryType: 'preorder',
        description: 'Trợ lý AI từ Anthropic, nổi bật với khả năng phân tích sâu, viết lách tự nhiên và xử lý tác vụ phức tạp',
        image: 'images/claude-logo.svg',
        featured: true,
        rating: 4.8,
        reviewCount: 8,
        soldCount: 25,
        variants: [
            { name: 'Claude Pro 1 tháng', price: 380000, duration: '1 tháng', note: 'Giao sau, IB Zalo để nhận hàng', productCode: 'claude_pro_1m', deliveryType: 'preorder' }
        ],
        tabs: {
            description: `
                <h3>Về Claude Pro</h3>
                <p>Claude là trợ lý AI thế hệ mới từ Anthropic, được đánh giá cao về khả năng phân tích, suy luận và xử lý ngôn ngữ tự nhiên:</p>
                <ul>
                    <li>Phân tích văn bản dài, tài liệu phức tạp vượt trội</li>
                    <li>Viết lách tự nhiên, sáng tạo và chính xác</li>
                    <li>Hỗ trợ lập trình, debug code hiệu quả</li>
                    <li>Xử lý đa ngôn ngữ, dịch thuật chất lượng cao</li>
                    <li>Suy luận logic mạnh mẽ, phù hợp cho nghiên cứu và học tập</li>
                    <li>Hỗ trợ upload file, phân tích hình ảnh</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong suốt thời gian sử dụng</li>
                    <li>Hỗ trợ xử lý mọi vấn đề phát sinh</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Sau khi thanh toán, IB Zalo: 0988428496 để nhận hàng</li>
                    <li>Admin sẽ xử lý và giao tài khoản trong thời gian sớm nhất</li>
                    <li>Đăng nhập tại claude.ai và bắt đầu sử dụng</li>
                </ul>
                <p><strong>Lưu ý:</strong> Giữ liên lạc qua Zalo để được hỗ trợ nhanh nhất.</p>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Claude Pro khác gì ChatGPT Plus?</strong></p>
                <p>A: Claude nổi bật với khả năng phân tích văn bản dài, suy luận logic và viết lách tự nhiên hơn. Phù hợp cho nghiên cứu, viết báo cáo và phân tích tài liệu.</p>
                <p><strong>Q: Có thể dùng trên điện thoại không?</strong></p>
                <p>A: Có, Claude có app trên iOS và Android, hoặc dùng trực tiếp trên web claude.ai.</p>
                <p><strong>Q: Thanh toán xong nhận tài khoản khi nào?</strong></p>
                <p>A: Sau khi thanh toán, IB Zalo để admin xử lý và giao hàng.</p>
            `
        }
    },
    cursor: {
        id: 'cursor',
        name: 'Cursor Pro',
        category: 'AI',
        deliveryType: 'preorder',
        description: 'IDE lập trình tích hợp AI hàng đầu, hỗ trợ viết code, debug và refactor thông minh với sức mạnh AI',
        image: 'images/cursor-logo.png',
        featured: true,
        rating: 4.9,
        reviewCount: 12,
        soldCount: 30,
        variants: [
            { name: 'Cursor Pro 1 tháng', price: 380000, duration: '1 tháng', note: 'Giao sau, IB Zalo để nhận hàng', productCode: 'cursor_pro_1m', deliveryType: 'preorder' }
        ],
        tabs: {
            description: `
                <h3>Về Cursor Pro</h3>
                <p>Cursor là trình soạn thảo code tích hợp AI tiên tiến nhất hiện nay, được xây dựng trên nền VS Code và tích hợp sâu các mô hình AI hàng đầu:</p>
                <ul>
                    <li>Gợi ý code thông minh, autocomplete chính xác theo ngữ cảnh</li>
                    <li>Chat AI trực tiếp trong editor để hỏi đáp, giải thích code</li>
                    <li>Tự động debug, tìm lỗi và đề xuất sửa code</li>
                    <li>Refactor code nhanh chóng với AI</li>
                    <li>Hỗ trợ đa ngôn ngữ: Python, JavaScript, TypeScript, Go, Rust...</li>
                    <li>Tích hợp GPT-4, Claude và nhiều mô hình AI khác</li>
                </ul>
            `,
            warranty: `
                <h3>Chính sách bảo hành</h3>
                <ul>
                    <li>Bảo hành trong suốt thời gian sử dụng</li>
                    <li>Hỗ trợ xử lý mọi vấn đề phát sinh</li>
                    <li>Liên hệ Zalo: 0988428496 khi cần hỗ trợ</li>
                </ul>
            `,
            guide: `
                <h3>Hướng dẫn sử dụng</h3>
                <ul>
                    <li>Sau khi thanh toán, IB Zalo: 0988428496 để nhận hàng</li>
                    <li>Admin sẽ xử lý và giao tài khoản trong thời gian sớm nhất</li>
                    <li>Tải Cursor tại cursor.com và đăng nhập để sử dụng</li>
                </ul>
                <p><strong>Lưu ý:</strong> Giữ liên lạc qua Zalo để được hỗ trợ nhanh nhất.</p>
            `,
            faq: `
                <h3>Câu hỏi thường gặp</h3>
                <p><strong>Q: Cursor Pro khác gì phiên bản miễn phí?</strong></p>
                <p>A: Cursor Pro cho phép sử dụng không giới hạn các mô hình AI cao cấp (GPT-4, Claude), tốc độ phản hồi nhanh hơn và nhiều tính năng nâng cao.</p>
                <p><strong>Q: Có thể dùng Cursor thay VS Code không?</strong></p>
                <p>A: Hoàn toàn được, Cursor được xây dựng trên nền VS Code nên hỗ trợ tất cả extension và cấu hình của VS Code.</p>
                <p><strong>Q: Thanh toán xong nhận tài khoản khi nào?</strong></p>
                <p>A: Sau khi thanh toán, IB Zalo để admin xử lý và giao hàng.</p>
            `
        }
    },
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
    normalizeCartItems();
}

// CART
let cart = [];

// DISCOUNT CODE STATE
let appliedDiscount = null; // { code, discountAmount, finalTotal }

// CTV MODE
const CTV_CODES = ['CTV2026', 'CTV01', 'CTV02', 'CTV03', 'CTV04', 'CTV05'];
let ctvMode = localStorage.getItem('tbq_ctv_mode') === '1';

function setCtvMode(enable) {
    ctvMode = !!enable;
    localStorage.setItem('tbq_ctv_mode', ctvMode ? '1' : '0');
    cart = cart.map(item => {
        const publicPrice = item.publicPrice ?? item.unitPrice ?? item.price;
        const ctvPrice = item.ctvPrice ?? publicPrice;
        const unitPrice = ctvMode ? ctvPrice : publicPrice;
        return { ...item, publicPrice, ctvPrice, unitPrice, price: unitPrice * (item.quantity || 1) };
    });
    saveCart();
    updateCartUI();
    renderCheckoutSummary(true);
    renderFeaturedProducts();
    renderAllProducts();
    const hash = window.location.hash || '#home';
    if (hash.startsWith('#product/')) {
        const productId = hash.split('/')[1];
        if (productId) showProductDetail(productId, { preserveDiscount: true });
    }
}

function getVariantPrice(variant, tier = 'public') {
    if (tier === 'ctv') return variant.ctvPrice ?? variant.price;
    return variant.price;
}

function getItemUnitPrice(item, tier = 'public') {
    if (tier === 'ctv') return item.ctvPrice ?? item.unitPrice ?? item.price;
    return item.publicPrice ?? item.unitPrice ?? item.price;
}

function getCartTotal(tier = 'public') {
    return cart.reduce((sum, item) => {
        const qty = item.quantity || 1;
        return sum + (getItemUnitPrice(item, tier) * qty);
    }, 0);
}

function renderPriceStack(publicPrice, ctvPrice, publicClass = 'product-price', wrapTag = 'p') {
    if (ctvMode && ctvPrice !== null && ctvPrice !== undefined && ctvPrice !== publicPrice) {
        return `
            <div class="price-stack">
                <span class="${publicClass}">${formatPrice(publicPrice)}</span>
                <span class="price-ctv">Giá CTV: ${formatPrice(ctvPrice)}</span>
            </div>
        `;
    }
    return `<${wrapTag} class="${publicClass}">${formatPrice(publicPrice)}</${wrapTag}>`;
}

function renderPriceInline(publicPrice, ctvPrice, prefix = '') {
    if (ctvMode && ctvPrice !== null && ctvPrice !== undefined && ctvPrice !== publicPrice) {
        return `${prefix}${formatPrice(publicPrice)} · CTV ${formatPrice(ctvPrice)}`;
    }
    return `${prefix}${formatPrice(publicPrice)}`;
}

function normalizeCartItems() {
    cart = cart.map(item => {
        const product = products[item.productId];
        const variant = product?.variants?.find(v => v.name === item.variantName);
        const publicPrice = item.publicPrice ?? variant?.price ?? item.unitPrice ?? item.price;
        const ctvPrice = item.ctvPrice ?? variant?.ctvPrice ?? publicPrice;
        const unitPrice = ctvMode ? ctvPrice : publicPrice;
        return { ...item, publicPrice, ctvPrice, unitPrice, price: unitPrice * (item.quantity || 1) };
    });
}

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
                        <div class="search-result-price">
                            ${renderPriceInline(
                Math.min(...product.variants.map(v => getVariantPrice(v, 'public'))),
                Math.min(...product.variants.map(v => getVariantPrice(v, 'ctv'))),
                'Từ '
            )}
                        </div>
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
// ── HERO SLIDER ──
let currentSlide = 0;
let slideInterval = null;

function goToSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides.length) return;
    currentSlide = ((index % slides.length) + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
    dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

function nextSlide() { goToSlide(currentSlide + 1); resetSlideTimer(); }
function prevSlide() { goToSlide(currentSlide - 1); resetSlideTimer(); }

function resetSlideTimer() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
}

function initHeroSlider() {
    slideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
}

// ── CATEGORY BANNERS ──
const categoryConfig = {
    'AI': { emoji: '🤖', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    'Giải trí': { emoji: '🎬', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    'Thiết kế': { emoji: '🎨', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    'Công cụ': { emoji: '🛠️', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    'Học tập': { emoji: '📚', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
};

function renderCategoryBanners() {
    const container = document.getElementById('categoryBanners');
    if (!container) return;
    const categories = [...new Set(Object.values(products).filter(p => p.category !== 'Testing').map(p => p.category))];

    container.innerHTML = categories.map(cat => {
        const config = categoryConfig[cat] || { emoji: '📦', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' };
        const count = Object.values(products).filter(p => p.category === cat).length;
        return `
            <a href="#products" class="category-banner-card" onclick="setTimeout(()=>filterProducts(document.querySelector('.filter-list li[data-cat=\\'${cat}\\']')||document.querySelectorAll('.filter-list li')[0],'${cat}'),100)" style="background: ${config.gradient}">
                <span class="cat-banner-emoji">${config.emoji}</span>
                <span class="cat-banner-name">${cat}</span>
                <span class="cat-banner-count">${count} sản phẩm</span>
            </a>
        `;
    }).join('');
}

window.onload = function () {
    renderFeaturedProducts();
    renderAllProducts();
    renderFilterList();
    renderCategoryBanners();
    updateCartUI();

    // Init hero slider
    initHeroSlider();

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
    updateActiveNavLink(page);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update active nav link (desktop + mobile)
function updateActiveNavLink(currentPage) {
    // Desktop nav
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href') || '';
        const linkPage = href.replace('#', '').split('/')[0] || 'home';
        if (linkPage === currentPage || (currentPage === 'product' && linkPage === 'products')) {
            link.classList.add('active');
        }
    });
    // Mobile bottom nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
        const itemPage = item.getAttribute('data-page') || '';
        if (itemPage === currentPage || (currentPage === 'product' && itemPage === 'products') || (currentPage === 'home' && itemPage === 'contact')) {
            // 'contact' scrolls to footer on home page, so keep home active for contact
        }
        if (itemPage === currentPage || (currentPage === 'product' && itemPage === 'products')) {
            item.classList.add('active');
        }
    });
}

// helper: resolve target page element id
function getTargetPageId(page, parts) {
    if (page === 'product' && parts[1]) return 'productDetailPage';
    if (page === 'checkout') return 'checkoutPage';
    if (page === 'products') return 'productsPage';
    if (page === 'confirmation') return 'confirmationPage';
    if (page === 'lookup') return 'orderLookupPage';
    return 'homePage';
}

function doRoute(page, parts, showPage) {
    if (page === 'product' && parts[1]) {
        showProductDetail(parts[1]);
        showPage(document.getElementById('productDetailPage'));
    } else if (page === 'checkout') {
        showPage(document.getElementById('checkoutPage'));
        renderCheckoutSummary();
        // Auto-fill coupon from URL hash (e.g. #checkout?coupon=TBQ-XKRN-7M2P)
        try {
            const hashQuery = window.location.hash.split('?')[1];
            if (hashQuery) {
                const params = new URLSearchParams(hashQuery);
                const couponCode = params.get('coupon');
                if (couponCode) {
                    const discountInput = document.getElementById('discountCodeInput');
                    if (discountInput && !discountInput.readOnly) {
                        discountInput.value = couponCode;
                        // Auto-apply after a short delay to ensure DOM is ready
                        setTimeout(() => { applyDiscountCode(); }, 300);
                    }
                }
            }
        } catch (e) { console.warn('Coupon auto-fill:', e); }
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
        // Only show confirmation if there's an active order, otherwise redirect home
        const orderCodeEl = document.getElementById('orderCode');
        if (!orderCodeEl || !orderCodeEl.textContent || orderCodeEl.textContent === '') {
            showPage(document.getElementById('homePage'));
            startObserver();
            return;
        }
        showPage(document.getElementById('confirmationPage'));
    } else if (page === 'lookup') {
        showPage(document.getElementById('orderLookupPage'));
        var phoneInput = document.getElementById('lookupPhoneInput');
        if (phoneInput) {
            phoneInput.focus();
            phoneInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') lookupOrders();
            });
        }
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

// RENDER PRODUCT CARD (shared template)
function renderProductCardHTML(product) {
    const minPublic = Math.min(...product.variants.map(v => getVariantPrice(v, 'public')));
    const maxPublic = Math.max(...product.variants.map(v => getVariantPrice(v, 'public')));
    const minCtv = Math.min(...product.variants.map(v => getVariantPrice(v, 'ctv')));
    const hasMultiplePrices = minPublic !== maxPublic;
    const priceDisplay = hasMultiplePrices
        ? `${formatPrice(minPublic)} - ${formatPrice(maxPublic)}`
        : formatPrice(minPublic);
    const rating = product.rating || 4.5;
    const soldCount = product.soldCount || 0;

    return `
        <div class="product-card" onclick="window.location.hash='product/${product.id}'">
            <div class="product-image">
                <span class="delivery-badge ${(product.deliveryType || 'instant') === 'instant' ? 'badge-instant' : 'badge-preorder'}">
                    ${(product.deliveryType || 'instant') === 'instant' ? '⚡ Giao liền' : '🕐 Giao sau'}
                </span>
                <img src="${product.image}" alt="${product.name}" onerror="handleImgError(this,'${product.id}')">
            </div>
            <div class="product-info product-info-simple">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-meta-row">
                    <span class="product-rating-stars">${renderStars(rating)} ${rating}</span>
                    <span class="product-sold">| ${soldCount > 99 ? soldCount + '+' : soldCount} sold</span>
                </div>
                <div class="product-price-row">
                    <span class="product-price">${priceDisplay}</span>
                    ${ctvMode && minCtv !== minPublic ? `<span class="price-ctv">CTV: ${formatPrice(minCtv)}</span>` : ''}
                </div>
                <a href="#product/${product.id}" class="buy-now-btn" onclick="event.stopPropagation()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    Xem chi tiết
                </a>
            </div>
        </div>
    `;
}

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '<span class="stars">' + '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty) + '</span>';
}

// RENDER FEATURED PRODUCTS
function renderFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    const featured = Object.values(products)
        .filter(p => p.featured)
        .sort((a, b) => ((a.deliveryType || 'instant') === 'instant' ? 0 : 1) - ((b.deliveryType || 'instant') === 'instant' ? 0 : 1));

    container.innerHTML = featured.map(product => renderProductCardHTML(product)).join('');
}

// RENDER ALL PRODUCTS
function renderAllProducts(filter = 'all') {
    const container = document.getElementById('allProducts');
    let productsToShow = Object.values(products).filter(p => p.category !== 'Testing');

    if (filter !== 'all') {
        productsToShow = productsToShow.filter(p => p.category === filter);
    }
    productsToShow.sort((a, b) => ((a.deliveryType || 'instant') === 'instant' ? 0 : 1) - ((b.deliveryType || 'instant') === 'instant' ? 0 : 1));

    container.innerHTML = productsToShow.map(product => renderProductCardHTML(product)).join('');
}

// RENDER FILTER LIST
function renderFilterList() {
    const container = document.getElementById('filterList');
    const categories = [...new Set(Object.values(products).filter(p => p.category !== 'Testing').map(p => p.category))];

    const allItem = '<li class="active" data-cat="all" onclick="filterProducts(this, \'all\')">Tất cả</li>';
    const categoryItems = categories.map(cat =>
        `<li data-cat="${cat}" onclick="filterProducts(this, '${cat}')">${cat}</li>`
    ).join('');

    container.innerHTML = allItem + categoryItems;
}

// FILTER PRODUCTS
function filterProducts(element, category) {
    document.querySelectorAll('.filter-list li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
    renderAllProducts(category);
}

// Map duration text to CSS class (same duration = same style)
function getDurationClass(duration) {
    if (!duration) return 'duration-other';
    const d = String(duration).toLowerCase().trim();
    if (d.includes('năm') || d.includes('nam')) return 'duration-year';
    if (d.includes('ngày') || d.includes('ngay')) return 'duration-day';
    if (d.includes('tháng') || d.includes('thang')) return 'duration-month';
    if (d.includes('lần') || d.includes('lan')) return 'duration-once';
    return 'duration-other';
}

// SHOW PRODUCT DETAIL (Rendering only)
function showProductDetail(productId, { preserveDiscount = false } = {}) {
    const product = products[productId];
    if (!product) return;

    // Reset detail order info state
    if (!preserveDiscount) {
        detailQuantity = 1;
        detailDiscount = null;
    }

    const container = document.getElementById('productDetailContent');

    container.innerHTML = `
        <div class="product-layout">
            <div class="product-gallery">
                <div class="main-image">
                    <img src="${product.image}" alt="${product.name}" onerror="handleImgError(this,'${product.id}')">
                </div>

                <!-- ORDER INFO SECTION (sticky with image) -->
                <div class="order-info-section" id="orderInfoSection">
                    <!-- Quantity -->
                    <div class="order-info-row">
                        <span class="order-info-label">Số lượng</span>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateDetailQuantity(-1)">−</button>
                            <span class="qty-value" id="detailQty">1</span>
                            <button class="qty-btn" onclick="updateDetailQuantity(1)">+</button>
                        </div>
                    </div>

                    <!-- Discount Code Collapsible -->
                    <div class="detail-discount-wrap">
                        <button class="detail-discount-toggle" onclick="toggleDetailDiscount()" id="detailDiscountToggle">
                            <span>💳 Bạn có mã giảm giá?</span>
                            <svg class="detail-discount-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <div class="detail-discount-content" id="detailDiscountContent" style="display:none;">
                            <div class="discount-input-group">
                                <input type="text" id="detailDiscountInput" placeholder="Nhập mã CTV / mã giảm giá" maxlength="30" autocomplete="off">
                                <button type="button" class="discount-apply-btn" id="detailDiscountApplyBtn" onclick="applyDetailDiscount('${productId}')">Áp dụng</button>
                            </div>
                            <div id="detailDiscountFeedback" class="discount-feedback"></div>
                        </div>
                    </div>

                    <!-- Price Summary -->
                    <div class="detail-price-summary" id="detailPriceSummary">
                        <div class="price-summary-row">
                            <span>Tạm tính</span>
                            <span id="detailSubtotal">0₫</span>
                        </div>
                        <div class="price-summary-row discount-row" id="detailDiscountRow" style="display:none;">
                            <span>🏷️ <span class="discount-label-text" id="detailDiscountLabel">Chiết khấu</span></span>
                            <span class="discount-value" id="detailDiscountValue">-0₫</span>
                        </div>
                        <div class="price-summary-divider"></div>
                        <div class="price-summary-row total-row">
                            <span>Tổng cộng</span>
                            <span class="total-value" id="detailTotal">0₫</span>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="buy-now-row">
                        <button class="buy-now-btn" onclick="buyNow('${productId}')">
                            🛒 Đặt hàng ngay
                        </button>
                        <button class="add-to-cart-text-btn" onclick="addToCart('${productId}')">
                            🛍 Thêm giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="product-details">
                <h1>${product.name}</h1>
                <p class="product-description">${product.description}</p>
                <div class="delivery-info-box ${product.id === 'capcut' ? 'delivery-mixed' : (product.deliveryType || 'instant') === 'instant' ? 'delivery-instant' : 'delivery-preorder'}">
                    ${product.id === 'capcut'
            ? '<div class="delivery-simple"><span class="delivery-line instant">⚡ <strong>GIAO LIỀN</strong> = Nhận ngay sau thanh toán</span><span class="delivery-line preorder">🕐 <strong>GIAO SAU</strong> = Nhận qua Zalo sau thanh toán</span></div>'
            : (product.deliveryType || 'instant') === 'instant'
                ? '<span class="delivery-line instant">⚡ <strong>GIAO LIỀN</strong> — Nhận ngay sau thanh toán</span>'
                : '<span class="delivery-line preorder">🕐 <strong>GIAO SAU</strong> — Nhận qua Zalo sau thanh toán</span>'}
                </div>
                <div class="variant-selector">
                    <div class="variant-label">Chọn gói dịch vụ:</div>
                    <div class="variant-options" id="variantOptions">
                        ${product.variants.map((variant, index) => `
                            <label class="variant-option ${index === 0 ? 'selected' : ''} variant-${(variant.deliveryType || product.deliveryType || 'instant') === 'instant' ? 'instant' : 'preorder'}">
                                <div class="variant-select-circle">
                                    <input type="radio" name="variant" value="${index}" ${index === 0 ? 'checked' : ''} onchange="selectVariant(${index})">
                                </div>
                                <div class="variant-info">
                                    <div class="variant-header">
                                        <div class="variant-name">${variant.name}</div>
                                        ${renderPriceStack(getVariantPrice(variant, 'public'), getVariantPrice(variant, 'ctv'), 'variant-price-text', 'span')}
                                    </div>
                                    <div class="variant-meta-row">
                                        <span class="variant-duration-text duration-badge ${getDurationClass(variant.duration)}">${variant.duration}</span>
                                        <span class="variant-delivery-badge ${(variant.deliveryType || product.deliveryType || 'instant') === 'instant' ? 'delivery-instant' : 'delivery-preorder'}">${(variant.deliveryType || product.deliveryType || 'instant') === 'instant' ? 'GIAO LIỀN' : 'GIAO SAU'}</span>
                                    </div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
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

    // Initialize price summary after DOM is ready
    setTimeout(() => {
        updateDetailPriceSummary(productId);
        // Restore discount UI if detailDiscount was preserved (e.g. after setCtvMode re-render)
        if (detailDiscount) {
            const input = document.getElementById('detailDiscountInput');
            const feedback = document.getElementById('detailDiscountFeedback');
            const btn = document.getElementById('detailDiscountApplyBtn');
            const content = document.getElementById('detailDiscountContent');
            if (input) { input.value = detailDiscount.code; input.readOnly = true; }
            if (feedback) { feedback.textContent = 'Giảm 25% cho CTV'; feedback.className = 'discount-feedback success'; }
            if (content) content.style.display = 'block';
            if (btn) {
                btn.textContent = 'Xoá';
                btn.onclick = function () { clearDetailDiscount(); };
            }
        }
    }, 0);
}

// detail-level state
let detailQuantity = 1;
let detailDiscount = null; // { code, discountAmount, finalTotal, codeType, percent }

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
    // Recalculate price when variant changes
    const currentProductId = window.location.hash.replace('#product/', '');
    if (currentProductId) {
        detailDiscount = null;
        clearDetailDiscount();
        updateDetailPriceSummary(currentProductId);
    }
}

// ── DETAIL ORDER INFO FUNCTIONS ──

function updateDetailQuantity(delta) {
    const qtyEl = document.getElementById('detailQty');
    if (!qtyEl) return;
    detailQuantity = Math.max(1, detailQuantity + delta);
    qtyEl.textContent = detailQuantity;
    const currentProductId = window.location.hash.replace('#product/', '');
    updateDetailPriceSummary(currentProductId);
}

function updateDetailPriceSummary(productId) {
    const product = products[productId];
    if (!product) return;

    const selected = document.querySelector('input[name="variant"]:checked');
    if (!selected) return;
    const variant = product.variants[selected.value];
    // Always use public price as subtotal so discounts are visually correct
    const unitPrice = getVariantPrice(variant, 'public');
    const subtotal = unitPrice * detailQuantity;

    const subtotalEl = document.getElementById('detailSubtotal');
    const totalEl = document.getElementById('detailTotal');
    const discountRow = document.getElementById('detailDiscountRow');
    const discountValueEl = document.getElementById('detailDiscountValue');
    const discountLabelEl = document.getElementById('detailDiscountLabel');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);

    let finalTotal = subtotal;
    if (detailDiscount && detailDiscount.discountAmount > 0) {
        let discountAmt;
        if (detailDiscount.percent) {
            // Percentage-based discount (CTV 25%, coupons, etc.)
            discountAmt = Math.round(subtotal * detailDiscount.percent / 100);
        } else {
            // Fixed-amount discount: cap at subtotal
            discountAmt = Math.min(detailDiscount.discountAmount, subtotal);
        }
        finalTotal = Math.max(0, subtotal - discountAmt);
        if (discountRow) discountRow.style.display = 'flex';
        if (discountValueEl) discountValueEl.textContent = '-' + formatPrice(discountAmt);
        if (discountLabelEl) discountLabelEl.textContent = `Chiết khấu (${detailDiscount.percent ? detailDiscount.percent + '%' : detailDiscount.code})`;
    } else {
        if (discountRow) discountRow.style.display = 'none';
    }

    if (totalEl) totalEl.textContent = formatPrice(finalTotal);
}

function toggleDetailDiscount() {
    const content = document.getElementById('detailDiscountContent');
    const toggle = document.getElementById('detailDiscountToggle');
    if (!content) return;
    const isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : 'block';
    if (toggle) toggle.classList.toggle('open', !isOpen);
}

async function applyDetailDiscount(productId) {
    const input = document.getElementById('detailDiscountInput');
    const feedback = document.getElementById('detailDiscountFeedback');
    const btn = document.getElementById('detailDiscountApplyBtn');
    const code = input.value.trim();

    if (!code) {
        feedback.textContent = '';
        feedback.className = 'discount-feedback';
        return;
    }

    const product = products[productId];
    const selected = document.querySelector('input[name="variant"]:checked');
    if (!product || !selected) return;
    const variant = product.variants[selected.value];
    const productCode = getProductCode(productId, variant.name);

    const items = [{ productCode, quantity: detailQuantity }];

    btn.disabled = true;
    btn.textContent = '...';

    try {
        const response = await fetch('/.netlify/functions/validate-discount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, items })
        });

        const data = await response.json();

        if (data.valid) {
            detailDiscount = {
                code: data.code,
                discountAmount: data.discountAmount,
                finalTotal: data.finalTotal,
                codeType: data.codeType || 'discount',
                percent: data.discountPercent || 0,
                quantity: detailQuantity
            };

            feedback.textContent = data.message;
            feedback.className = 'discount-feedback success';
            input.readOnly = true;
            btn.textContent = 'Xoá';
            btn.disabled = false;
            btn.onclick = function () { clearDetailDiscount(); };

            if (data.codeType === 'ctv') setCtvMode(true);
        } else {
            feedback.textContent = data.error || 'Mã giảm giá không hợp lệ';
            feedback.className = 'discount-feedback error';
            detailDiscount = null;
            btn.disabled = false;
            btn.textContent = 'Áp dụng';
        }
    } catch (err) {
        feedback.textContent = 'Không thể kiểm tra mã. Thử lại sau.';
        feedback.className = 'discount-feedback error';
        btn.disabled = false;
        btn.textContent = 'Áp dụng';
    }

    updateDetailPriceSummary(productId);
}

function clearDetailDiscount() {
    detailDiscount = null;
    const input = document.getElementById('detailDiscountInput');
    const feedback = document.getElementById('detailDiscountFeedback');
    const btn = document.getElementById('detailDiscountApplyBtn');
    const currentProductId = window.location.hash.replace('#product/', '');

    if (input) { input.readOnly = false; input.value = ''; }
    if (feedback) { feedback.textContent = ''; feedback.className = 'discount-feedback'; }
    if (btn) {
        btn.textContent = 'Áp dụng';
        btn.disabled = false;
        btn.onclick = function () { applyDetailDiscount(currentProductId); };
    }

    if (ctvMode) setCtvMode(false);
    updateDetailPriceSummary(currentProductId);
}

// BUY NOW - Direct order from product page
function buyNow(productId) {
    const product = products[productId];
    const selected = document.querySelector('input[name="variant"]:checked');
    if (!product || !selected) return;

    const variant = product.variants[selected.value];
    const email = document.getElementById('detailEmail')?.value.trim() || '';

    // Build the modal
    let existing = document.getElementById('buyNowModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'buyNowModal';
    modal.className = 'buy-now-modal-overlay';
    modal.innerHTML = `
        <div class="buy-now-modal">
            <button class="buy-now-modal-close" onclick="document.getElementById('buyNowModal').remove()">&times;</button>
            <h3>Thông tin liên hệ</h3>
            <p class="buy-now-modal-desc">Nhập tên và SĐT để đặt hàng nhanh</p>
            <div class="buy-now-modal-field">
                <label>Họ và tên *</label>
                <input type="text" id="buyNowName" required>
            </div>
            <div class="buy-now-modal-field">
                <label>Số điện thoại *</label>
                <input type="tel" id="buyNowPhone" required>
                <div class="form-hint" style="font-size: 12px; color: #6b7280; margin-top: 4px;">📱 Dùng SĐT này để tra cứu đơn hàng</div>
            </div>
            <div class="buy-now-modal-summary">
                <span>${variant.name} × ${detailQuantity}</span>
                <span class="buy-now-modal-total">${document.getElementById('detailTotal')?.textContent || '0₫'}</span>
            </div>
            <button class="buy-now-modal-submit" id="buyNowSubmitBtn" onclick="submitBuyNow('${productId}')">
                Xác nhận đặt hàng
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Focus name input
    setTimeout(() => document.getElementById('buyNowName')?.focus(), 100);
}

async function submitBuyNow(productId) {
    const product = products[productId];
    const selected = document.querySelector('input[name="variant"]:checked');
    if (!product || !selected) return;

    const variant = product.variants[selected.value];
    const name = document.getElementById('buyNowName')?.value.trim();
    const phone = document.getElementById('buyNowPhone')?.value.trim();
    const email = document.getElementById('detailEmail')?.value.trim() || '';

    if (!name || !phone) {
        showToast('Vui lòng điền đầy đủ họ tên và SĐT!', 'error');
        return;
    }

    // Validate phone
    const phoneRegex = /(84|0[35789])([0-9]{8})\b/;
    if (!phoneRegex.test(phone)) {
        showToast('Số điện thoại không hợp lệ!', 'error');
        return;
    }

    const submitBtn = document.getElementById('buyNowSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Đang xử lý...';
    submitBtn.style.opacity = '0.7';

    const productCode = getProductCode(productId, variant.name);
    const unitPrice = getVariantPrice(variant, ctvMode ? 'ctv' : 'public');

    const items = [{
        productCode,
        quantity: detailQuantity,
        price: unitPrice,
        deliveryType: variant.deliveryType || product.deliveryType || 'instant'
    }];

    const note = '';

    try {
        const response = await fetch('/.netlify/functions/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                customerNote: note,
                items: items,
                price: unitPrice * detailQuantity,
                discountCode: detailDiscount ? detailDiscount.code : null
            })
        });

        let data;
        try {
            data = await response.json();
        } catch (parseErr) {
            showToast('Máy chủ trả về lỗi. Vui lòng thử lại.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = '1';
            return;
        }

        if (!response.ok || !data.success) {
            let errMsg = data?.message || data?.error || 'Có lỗi xảy ra';
            if (data?.error === 'INSUFFICIENT_STOCK') {
                errMsg = `Hết hàng: ${data.product || 'sản phẩm'} chỉ còn ${data.available ?? 0}.`;
            }
            showToast(errMsg, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = '1';
            return;
        }

        // Success - close modal
        document.getElementById('buyNowModal')?.remove();

        const orderCode = data.orderCode;
        const total = data.amount || (unitPrice * detailQuantity);

        // Store order for invoice
        lastOrder = {
            code: orderCode,
            date: new Date().toLocaleString('vi-VN'),
            customer: { name, phone },
            items: [{
                productId,
                productName: product.name,
                variantName: variant.name,
                price: unitPrice,
                unitPrice: unitPrice,
                quantity: detailQuantity,
                image: product.image
            }],
            total: total
        };

        // Reset detail state
        detailQuantity = 1;
        detailDiscount = null;

        // ── FREE ORDER: skip payment, show credentials directly ──
        if (data.freeOrder) {
            if (pollingInterval) clearInterval(pollingInterval);
            const isPreorder = data.fulfillmentType === 'owner_upgrade';
            if (isPreorder) {
                showPreorderSuccess(orderCode, data.invoiceNumber);
            } else if (data.deliveryToken) {
                await showSuccessWithCredentials(orderCode, data.deliveryToken, data.invoiceNumber);
            } else {
                showPreorderSuccess(orderCode, data.invoiceNumber);
            }
            window.location.hash = 'confirmation';
            return;
        }

        // Setup confirmation page
        if (pollingInterval) clearInterval(pollingInterval);
        const pendingState = document.getElementById('pendingPaymentState');
        const successState = document.getElementById('successPaymentState');
        if (pendingState) pendingState.style.display = 'block';
        if (successState) { successState.style.display = 'none'; successState.innerHTML = ''; }

        document.getElementById('orderCode').textContent = orderCode;
        document.getElementById('transferContent').textContent = orderCode;
        document.getElementById('transferAmount').textContent = formatPrice(total);

        const qrCodeUrl = generateTPBankQR(orderCode, total);
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = `<img src="${qrCodeUrl}" alt="Mã QR thanh toán" style="max-width: 220px; border-radius: 8px;" onerror="this.style.display='none'; this.insertAdjacentHTML('afterend', '<p style=\'color:#ef4444; margin-top:10px; font-weight:500\'>⚠️ Không thể tạo mã QR.</p>');">`;

        window.location.hash = 'confirmation';
        startPaymentPolling(orderCode, total);

    } catch (error) {
        console.error('Buy now error:', error);
        showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.style.opacity = '1';
    }
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
        const unitPrice = cart[existingIndex].unitPrice || variant.price;
        if (cart[existingIndex].publicPrice === undefined) {
            cart[existingIndex].publicPrice = getVariantPrice(variant, 'public');
        }
        if (cart[existingIndex].ctvPrice === undefined) {
            cart[existingIndex].ctvPrice = getVariantPrice(variant, 'ctv');
        }
        cart[existingIndex].price = unitPrice * cart[existingIndex].quantity;
    } else {
        // Add new item
        const publicPrice = getVariantPrice(variant, 'public');
        const ctvPrice = getVariantPrice(variant, 'ctv');
        const unitPrice = ctvMode ? ctvPrice : publicPrice;
        const cartItem = {
            productId: productId,
            productName: product.name,
            variantName: variant.name,
            variantIndex: selectedVariantIndex,
            price: unitPrice,
            unitPrice: unitPrice,
            publicPrice: publicPrice,
            ctvPrice: ctvPrice,
            quantity: 1,
            image: product.image,
            deliveryType: (variant.deliveryType || product.deliveryType || 'instant')
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
    const codeMap = { chatgpt: 'chatgpt', netflix: 'netflix', spotify: 'spotify', adobe: 'adobe', youtube: 'youtube', duolingo: 'duolingo', ms365: 'ms365', quizlet: 'quizlet', canva: 'canva', capcut: 'capcut', grok: 'grok' };
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
            const unitPrice = getItemUnitPrice(item, ctvMode ? 'ctv' : 'public');
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

        const total = getCartTotal(ctvMode ? 'ctv' : 'public');
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
    const unitPrice = getItemUnitPrice(item, ctvMode ? 'ctv' : 'public');
    item.unitPrice = unitPrice;
    item.price = unitPrice * newQty;

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
function renderCheckoutSummary(skipDiscountReset = false) {
    const container = document.getElementById('checkoutSummary');
    const total = getCartTotal(ctvMode ? 'ctv' : 'public');

    if (cart.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 20px;">Vui lòng thêm sản phẩm vào giỏ</div>';
        return;
    }

    container.innerHTML = cart.map((item, index) => {
        const qty = item.quantity || 1;
        const unitPrice = getItemUnitPrice(item, ctvMode ? 'ctv' : 'public');
        return `
        <div class="checkout-item">
            <div class="checkout-item-img">
                <img src="${item.image}" alt="${item.productName}">
            </div>
            <div class="checkout-item-details">
                <div class="checkout-item-name">${item.productName}</div>
                <div class="checkout-item-variant">${item.variantName}</div>
                <div class="checkout-item-bottom">
                    <div class="checkout-item-qty">
                        <button class="qty-btn-sm" onclick="updateCheckoutQty(${index}, -1)">−</button>
                        <span class="qty-val-sm">${qty}</span>
                        <button class="qty-btn-sm" onclick="updateCheckoutQty(${index}, 1)">+</button>
                    </div>
                    <span class="checkout-item-price">${formatPrice(unitPrice * qty)}</span>
                </div>
            </div>
            <button class="checkout-item-remove" onclick="removeCheckoutItem(${index})" title="Xoá">×</button>
        </div>
    `;
    }).join('');

    const hasPreorder = cart.some(item => (item.deliveryType || 'instant') === 'preorder');
    if (hasPreorder) {
        container.innerHTML += `
        <div class="checkout-delivery-note">
            <span>&#128337;</span> Một số sản phẩm sẽ được giao qua Zalo trong 5-10 phút sau thanh toán.
        </div>
        `;
    }

    document.getElementById('checkoutTotal').textContent = formatPrice(total);

    // Reset discount when cart changes
    if (appliedDiscount && !skipDiscountReset) {
        if (appliedDiscount.percent) {
            // Percentage-based discount (CTV 25%, coupons, etc.) — recalculate
            const publicTotal = getCartTotal('public');
            const discountAmount = Math.round(publicTotal * appliedDiscount.percent / 100);
            const finalTotal = Math.max(0, publicTotal - discountAmount);
            document.getElementById('discountLine').style.display = 'flex';
            document.getElementById('discountCodeDisplay').textContent = appliedDiscount.code || 'CTV';
            document.getElementById('discountAmountDisplay').textContent = formatPrice(discountAmount);
            document.getElementById('checkoutTotal').textContent = formatPrice(finalTotal);
        } else {
            clearDiscount();
        }
    }
}

// Update quantity from checkout page
function updateCheckoutQty(index, delta) {
    const item = cart[index];
    if (!item) return;
    const newQty = Math.max(1, (item.quantity || 1) + delta);
    item.quantity = newQty;
    const unitPrice = getItemUnitPrice(item, ctvMode ? 'ctv' : 'public');
    item.unitPrice = unitPrice;
    item.price = unitPrice * newQty;
    saveCart();
    updateCartUI();
    renderCheckoutSummary(true);
}

// Remove item from checkout page
function removeCheckoutItem(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    renderCheckoutSummary();
    if (cart.length === 0) {
        showToast('Giỏ hàng trống', 'info');
    }
}

// ── DISCOUNT CODE ──
async function applyDiscountCode() {
    const input = document.getElementById('discountCodeInput');
    const feedback = document.getElementById('discountFeedback');
    const btn = document.getElementById('discountApplyBtn');
    const code = input.value.trim();

    if (!code) {
        feedback.textContent = '';
        feedback.className = 'discount-feedback';
        return;
    }

    // Build items from cart
    const items = cart.map(item => ({
        productCode: getProductCode(item.productId, item.variantName),
        quantity: item.quantity || 1
    }));

    if (items.length === 0) {
        feedback.textContent = 'Vui lòng thêm sản phẩm vào giỏ trước';
        feedback.className = 'discount-feedback error';
        return;
    }

    btn.disabled = true;
    btn.textContent = '...';

    try {
        const response = await fetch('/.netlify/functions/validate-discount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, items })
        });

        const data = await response.json();

        if (data.valid) {
            appliedDiscount = {
                code: data.code,
                discountAmount: data.discountAmount,
                finalTotal: data.finalTotal,
                codeType: data.codeType || 'discount',
                percent: data.discountPercent || 0
            };

            feedback.textContent = data.message;
            feedback.className = 'discount-feedback success';
            input.readOnly = true;
            btn.textContent = 'Xoá';
            btn.disabled = false;
            btn.onclick = function () { clearDiscount(); };

            // Show discount line
            document.getElementById('discountLine').style.display = 'flex';
            document.getElementById('discountCodeDisplay').textContent = data.code;
            document.getElementById('discountAmountDisplay').textContent = formatPrice(data.discountAmount);

            // Update total
            document.getElementById('checkoutTotal').textContent = formatPrice(data.finalTotal);
        } else {
            feedback.textContent = data.error || 'Mã giảm giá không hợp lệ';
            feedback.className = 'discount-feedback error';
            appliedDiscount = null;
            if (ctvMode) setCtvMode(false);
            btn.disabled = false;
            btn.textContent = 'Áp dụng';
        }
    } catch (err) {
        feedback.textContent = 'Không thể kiểm tra mã giảm giá. Thử lại sau.';
        feedback.className = 'discount-feedback error';
        btn.disabled = false;
        btn.textContent = 'Áp dụng';
    }
}

function clearDiscount() {
    appliedDiscount = null;
    const input = document.getElementById('discountCodeInput');
    const feedback = document.getElementById('discountFeedback');
    const btn = document.getElementById('discountApplyBtn');

    if (input) {
        input.readOnly = false;
        input.value = '';
    }
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'discount-feedback';
    }
    if (btn) {
        btn.textContent = 'Áp dụng';
        btn.disabled = false;
        btn.onclick = function () { applyDiscountCode(); };
    }

    const discountLine = document.getElementById('discountLine');
    if (discountLine) discountLine.style.display = 'none';

    setCtvMode(false);
    // Recalculate original total
    const total = getCartTotal('public');
    const checkoutTotal = document.getElementById('checkoutTotal');
    if (checkoutTotal) checkoutTotal.textContent = formatPrice(total);
}

// PLACE ORDER (V2 - calls new API with quantity support)
async function placeOrder() {
    if (cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }

    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const note = document.getElementById('customerNote')?.value || '';

    if (!name || !phone) {
        showToast('Vui lòng điền đầy đủ thông tin!', 'error');
        validateInput(document.getElementById('customerName'));
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
        price: getItemUnitPrice(item, ctvMode ? 'ctv' : 'public'),
        deliveryType: item.deliveryType || 'instant'
    }));

    const total = getCartTotal(ctvMode ? 'ctv' : 'public');

    // Show loading
    showToast('Đang tạo đơn hàng...', 'info');

    try {
        // Call create-order API
        const response = await fetch('/.netlify/functions/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: name,
                customerEmail: '',
                customerPhone: phone,
                customerNote: note,
                items: items,
                price: total,
                discountCode: appliedDiscount ? appliedDiscount.code : null
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
            customer: { name, phone },
            items: [...cart],
            total: data.amount || total
        };

        // Clear cart & discount
        cart = [];
        appliedDiscount = null;
        updateCartUI();

        // ── FREE ORDER: skip payment, show credentials directly ──
        if (data.freeOrder) {
            if (pollingInterval) clearInterval(pollingInterval);
            const isPreorder = data.fulfillmentType === 'owner_upgrade';
            if (isPreorder) {
                showPreorderSuccess(orderCode, data.invoiceNumber);
            } else if (data.deliveryToken) {
                await showSuccessWithCredentials(orderCode, data.deliveryToken, data.invoiceNumber);
            } else {
                showPreorderSuccess(orderCode, data.invoiceNumber);
            }
            window.location.hash = 'confirmation';
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            submitBtn.style.opacity = '1';
            return;
        }

        // Reset confirmation page state for new order
        // (fixes bug: 2nd order shows old order's success instead of new QR)
        if (pollingInterval) clearInterval(pollingInterval);
        const pendingState = document.getElementById('pendingPaymentState');
        const successState = document.getElementById('successPaymentState');
        if (pendingState) pendingState.style.display = 'block';
        if (successState) {
            successState.style.display = 'none';
            successState.innerHTML = '';
        }

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
        const hasChatGPTPro = !!data.hasChatGPTPro;

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
                ${credentials.map((cred, idx) => {
            const isLink = cred.isLink === true;
            const isUrl = cred.username && /^https?:\/\//.test(cred.username);
            if (isLink) {
                return `
                    <div class="conf-credential-item">
                        <div class="conf-credential-field">
                            <label class="conf-credential-label">Link kích hoạt</label>
                            <div class="conf-credential-value-wrap">
                                ${isUrl ? `<a href="${escapeHtml(cred.username)}" target="_blank" rel="noopener" class="conf-credential-value" style="color:#0066cc;word-break:break-all;">${escapeHtml(cred.username)}</a>` : `<span class="conf-credential-value">${escapeHtml(cred.username)}</span>`}
                                <button class="conf-action-btn" onclick="copyText('${escapeAttr(cred.username)}')" title="Sao chép">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </button>
                            </div>
                        </div>
                        ${cred.extraInfo ? `<p class="conf-credential-note" style="font-size:12px;color:#6b7280;margin-top:8px;white-space:pre-wrap;">${escapeHtml(cred.extraInfo)}</p>` : ''}
                    </div>
                `;
            }
            return `
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
                `;
        }).join('')}
                <button class="conf-copy-all-btn" onclick="copyAllCreds()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Sao chép toàn bộ thông tin đăng nhập
                </button>
            </div>

            ${hasChatGPTPro ? `
            <!-- ChatGPT Pro: Hướng dẫn đăng nhập workspace -->
            <div class="conf-chatgpt-pro-login">
                <h3 class="conf-chatgpt-pro-login-title">📩 Đăng nhập (gửi sau khi mua)</h3>
                <ul class="conf-chatgpt-pro-login-steps">
                    <li>Mở email đã đăng ký</li>
                    <li>Tìm thư mời workspace → <strong>Join workspace</strong></li>
                    <li>Đăng nhập và dùng</li>
                </ul>
                <p class="conf-chatgpt-pro-login-warn">⚠️ Không chỉnh sửa cài đặt workspace và không tự ý thêm thành viên. Có lỗi thì nhắn Zalo gửi Gmail.</p>
            </div>
            ` : ''}

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
        window._customerName = data.customerName || (typeof lastOrder !== 'undefined' && lastOrder && lastOrder.customer ? lastOrder.customer.name : '') || '';
        window._customerPhone = data.customerPhone || (typeof lastOrder !== 'undefined' && lastOrder && lastOrder.customer ? lastOrder.customer.phone : '') || '';

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
    const header = '🔐 TBQ HOMIE — Thông tin đăng nhập\n━━━━━━━━━━━━━━━━━━━━';
    const customerInfo = (window._customerName || window._customerPhone)
        ? `\n👤 Khách hàng: ${window._customerName || ''}${window._customerPhone ? '\n📱 SĐT: ' + window._customerPhone : ''}\n`
        : '';
    const body = window._credentials.map((c, i) => {
        if (c.isLink) return `🔗 Code/Link ${i + 1}:\n   Link kích hoạt: ${c.username}${c.extraInfo ? '\n   📝 Lưu ý: ' + c.extraInfo : ''}`;
        return `📧 Tài khoản${window._credentials.length > 1 ? ' ' + (i + 1) : ''}: ${c.username}\n🔑 Mật khẩu: ${c.password}${c.extraInfo ? '\n📝 Ghi chú: ' + c.extraInfo : ''}`;
    }).join('\n\n');
    const footer = '━━━━━━━━━━━━━━━━━━━━\n⚠️ Không chia sẻ thông tin này cho người khác\n💬 Hỗ trợ: zalo.me/0988428496';
    const text = `${header}${customerInfo}\n${body}\n\n${footer}`;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Đã sao chép toàn bộ thông tin!', 'success');
    });
}

// Pre-order success: show Zalo instructions (no credentials)
function showPreorderSuccess(orderCode, invoiceNumber) {
    const pendingState = document.getElementById('pendingPaymentState');
    const successState = document.getElementById('successPaymentState');
    if (!pendingState || !successState) return;
    pendingState.style.display = 'none';
    successState.style.display = 'block';
    successState.innerHTML = `
        <div class="conf-success-header">
            <div class="conf-success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <h1 class="conf-success-title">Thanh toán hoàn tất!</h1>
            <p class="conf-success-subtitle">
                Mã đơn hàng: <strong>${escapeHtml(orderCode)}</strong>
            </p>
        </div>
        <div class="conf-preorder-instructions">
            <div class="conf-preorder-icon">
                <span style="font-size: 48px;">&#128337;</span>
            </div>
            <h3>Hướng dẫn nhận tài khoản</h3>
            <div class="conf-preorder-steps">
                <div class="conf-preorder-step">
                    <span class="conf-step-number">1</span>
                    <span>Chụp màn hình hóa đơn / xác nhận thanh toán</span>
                </div>
                <div class="conf-preorder-step">
                    <span class="conf-step-number">2</span>
                    <span>Gửi qua Zalo để nhận tài khoản</span>
                </div>
                <div class="conf-preorder-step">
                    <span class="conf-step-number">3</span>
                    <span>Nhận tài khoản trong 5-10 phút</span>
                </div>
            </div>
            <a href="https://zalo.me/0988428496" target="_blank" class="conf-zalo-btn conf-zalo-btn-lg">
                Chat Zalo ngay - 0988 428 496
            </a>
        </div>
        <div class="conf-security-note">
            Lưu lại mã đơn hàng <strong>${escapeHtml(orderCode)}</strong> để được hỗ trợ nhanh hơn.
        </div>
        <a href="#home" class="conf-back-home">Về trang chủ</a>
    `;
    showToast('Thanh toán thành công! Gửi bill qua Zalo để nhận tài khoản.', 'success');
}

// POLL PAYMENT STATUS – uses lightweight order-status endpoint (read-only).
// check-payment is still the server-side fallback that *triggers* fulfillment;
// order-status just reads the current state so the UI stays in sync even if
// the webhook already fulfilled the order while the tab was open.
let pollingInterval;
function startPaymentPolling(orderCode, amount) {
    if (pollingInterval) clearInterval(pollingInterval);

    let attempts = 0;
    const maxAttempts = 600; // 600 * 2s = 20 minutes
    let isChecking = false; // guard against overlapping requests

    const handlePaid = async (data) => {
        clearInterval(pollingInterval);

        const isPreorder = data.fulfillmentType === 'owner_upgrade' || data.fulfillmentType === 'preorder';
        const hasPreorderItems = data.hasPreorderItems === true;

        if (isPreorder && !data.deliveryToken) {
            showPreorderSuccess(orderCode, data.invoiceNumber);
        } else if (data.deliveryToken) {
            await showSuccessWithCredentials(orderCode, data.deliveryToken, data.invoiceNumber);
            if (hasPreorderItems) {
                const successState = document.getElementById('successPaymentState');
                if (successState) {
                    const zaloSection = `
                        <div class="conf-preorder-instructions" style="margin-top: 1.5rem;">
                            <h3>San pham dat truoc</h3>
                            <p style="margin: 0.5rem 0;">Một số sản phẩm sẽ được giao qua Zalo trong 5-10 phút.</p>
                            <a href="https://zalo.me/0988428496" target="_blank" class="conf-zalo-btn conf-zalo-btn-lg">Chat Zalo - 0988 428 496</a>
                        </div>
                    `;
                    const backHome = successState.querySelector('.conf-back-home');
                    if (backHome) backHome.insertAdjacentHTML('beforebegin', zaloSection);
                }
            }
        } else {
            window.location.href = data.redirectUrl || `/.netlify/functions/delivery?order=${orderCode}`;
        }
    };

    const check = async () => {
        if (isChecking) return; // skip if previous request still in-flight
        isChecking = true;
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(pollingInterval);
            isChecking = false;
            return;
        }

        try {
            // Use check-payment which both checks AND triggers fulfillment
            const response = await fetch(`/.netlify/functions/check-payment?orderCode=${encodeURIComponent(orderCode)}&amount=${encodeURIComponent(amount)}`);

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
                isChecking = false;
                return;
            }

            const data = await response.json();

            // check-payment returns status: 'paid' when successful
            if (data.status === 'paid' || data.status === 'fulfilled') {
                await handlePaid(data);
            }
        } catch (error) {
            console.error('[poll] check-payment error:', error);
        }
        isChecking = false;
    };

    // Run immediately
    check();
    // Fast polling: every 2 seconds (webhook usually fulfills in ~1s, so next poll catches it)
    pollingInterval = setInterval(check, 2000);
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
        if (e.target.matches('#customerName, #customerPhone')) {
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
    doc.text(`SĐT: ${lastOrder.customer.phone}`, 30, 90);

    doc.text("CHI TIET DON HANG:", 20, 120);
    let y = 130;

    lastOrder.items.forEach(item => {
        // Remove dong/vnd for safe rendering
        const unitPrice = item.unitPrice || item.price;
        const price = formatPrice(unitPrice).replace('₫', ' VND');
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

// ── ORDER LOOKUP ────────────────────────────────────────────────
var _lookupIdCounter = 0;

function lookupOrders() {
    var phoneInput = document.getElementById('lookupPhoneInput');
    var emailInput = document.getElementById('lookupEmailInput');
    var resultDiv = document.getElementById('lookupResult');
    var guide = document.getElementById('lookupGuide');
    var btn = document.getElementById('lookupBtn');
    var phone = (phoneInput.value || '').trim();
    var email = (emailInput ? emailInput.value : '').trim();

    if (!phone || phone.length < 9) {
        resultDiv.innerHTML = '<div class="lookup-empty"><span class="lookup-empty-icon">📱</span><p>Vui lòng nhập số điện thoại hợp lệ</p></div>';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="lookup-btn-text">Đang tra cứu...</span>';
    resultDiv.innerHTML = '<div class="lookup-loading"><div class="lookup-spinner"></div><p>Đang tìm kiếm đơn hàng...</p></div>';
    if (guide) guide.style.display = 'none';

    var base = window.API_BASE || '';
    fetch(base + '/.netlify/functions/order-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone, email: email })
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            btn.disabled = false;
            btn.innerHTML = '<span class="lookup-btn-text">Tra cứu</span><svg class="lookup-btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

            if (!data.success) {
                resultDiv.innerHTML = '<div class="lookup-empty"><span class="lookup-empty-icon">❌</span><p>' + escHtml(data.error || 'Lỗi hệ thống') + '</p></div>';
                if (guide) guide.style.display = '';
                return;
            }

            var orders = data.orders || [];
            if (orders.length === 0) {
                resultDiv.innerHTML = '<div class="lookup-empty"><span class="lookup-empty-icon">📭</span><p>Không tìm thấy đơn hàng nào với SĐT <strong>' + escHtml(phone) + '</strong></p><p class="lookup-hint">Hãy kiểm tra lại số điện thoại hoặc liên hệ hỗ trợ qua <a href="https://zalo.me/0988428496" target="_blank">Zalo</a></p></div>';
                if (guide) guide.style.display = '';
                return;
            }

            var html = '<div class="lookup-count">Tìm thấy ' + orders.length + ' đơn hàng</div>';

            // Show hint if email not provided/verified
            if (!data.emailVerified && orders.some(function (o) { return o.status === 'fulfilled' || o.status === 'paid'; })) {
                html += '<div class="lookup-email-hint">💡 Nhập <strong>email đã đặt hàng</strong> ở ô phía trên để xem thông tin đăng nhập trực tiếp tại đây</div>';
            }

            orders.forEach(function (o) {
                var statusClass = 'status-' + (o.status || 'pending');
                var badge = '<span class="lookup-badge ' + statusClass + '">' + escHtml(o.statusLabel) + '</span>';

                var itemsHtml = (o.items || []).map(function (item) {
                    return '<div class="lookup-item"><span class="lookup-item-name">' + escHtml(item.name) + '</span><span class="lookup-item-info">x' + item.quantity + ' — ' + formatPrice(item.subtotal) + '</span></div>';
                }).join('');

                var date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

                var actionHtml = '';
                if ((o.status === 'fulfilled' || o.status === 'paid') && !o.credentials && o.deliveryUrl) {
                    actionHtml = '<a href="' + escAttr(o.deliveryUrl) + '" target="_blank" class="lookup-delivery-btn">🔑 Xem thông tin đăng nhập</a>';
                } else if (o.status === 'paid' && !o.deliveryUrl && !o.credentials) {
                    actionHtml = '<span class="lookup-paid-note">✅ Đã thanh toán — đang xử lý giao hàng</span>';
                } else if (o.status === 'pending_payment') {
                    actionHtml = '<span class="lookup-pending-note">⏳ Đang chờ thanh toán</span>';
                }

                // Inline credentials
                var credHtml = '';
                if (o.credentials && o.credentials.length > 0) {
                    credHtml = '<div class="lookup-credentials">';
                    credHtml += '<div class="lookup-credentials-title">🔑 Thông tin đăng nhập</div>';
                    o.credentials.forEach(function (c) {
                        var uid = 'lc' + (++_lookupIdCounter);
                        if (c.isLink) {
                            // Link/code delivery
                            var isUrl = c.username && /^https?:\/\//i.test(c.username);
                            credHtml += '<div class="lookup-cred-card">' +
                                '<div class="lookup-cred-field">' +
                                '<div class="lookup-cred-label">Link kích hoạt</div>' +
                                '<div class="lookup-cred-value">' +
                                '<span class="lookup-cred-text">' + (isUrl ? '<a href="' + escAttr(c.username) + '" target="_blank" style="color:#1e3a5f;word-break:break-all">' + escHtml(c.username) + '</a>' : escHtml(c.username)) + '</span>' +
                                '<button class="lookup-cred-copy" onclick="lookupCopy(\'' + escAttr(c.username).replace(/'/g, "\\'") + '\',this)">Copy</button>' +
                                '</div></div>';
                            if (c.extraInfo) {
                                credHtml += '<div class="lookup-cred-field"><div class="lookup-cred-label">Hướng dẫn</div>' +
                                    '<div class="lookup-cred-value"><span class="lookup-cred-text" style="white-space:pre-wrap">' + escHtml(c.extraInfo) + '</span></div></div>';
                            }
                            credHtml += '</div>';
                        } else {
                            // Account delivery
                            credHtml += '<div class="lookup-cred-card">' +
                                '<div class="lookup-cred-field">' +
                                '<div class="lookup-cred-label">Tài khoản</div>' +
                                '<div class="lookup-cred-value">' +
                                '<span class="lookup-cred-text">' + escHtml(c.username) + '</span>' +
                                '<button class="lookup-cred-copy" onclick="lookupCopy(\'' + escAttr(c.username).replace(/'/g, "\\'") + '\',this)">Copy</button>' +
                                '</div></div>' +
                                '<div class="lookup-cred-field">' +
                                '<div class="lookup-cred-label">Mật khẩu</div>' +
                                '<div class="lookup-cred-value">' +
                                '<span class="lookup-cred-text blurred" id="' + uid + '">' + escHtml(c.password) + '</span>' +
                                '<button class="lookup-cred-reveal" id="' + uid + '-r" onclick="lookupReveal(\'' + uid + '\')">Hiện</button>' +
                                '<button class="lookup-cred-copy" style="display:none" id="' + uid + '-c" onclick="lookupCopy(\'' + escAttr(c.password).replace(/'/g, "\\'") + '\',this)">Copy</button>' +
                                '</div></div>';
                            if (c.extraInfo) {
                                credHtml += '<div class="lookup-cred-field"><div class="lookup-cred-label">Mã 2FA / Ghi chú</div>' +
                                    '<div class="lookup-cred-value"><span class="lookup-cred-text">' + escHtml(c.extraInfo) + '</span>' +
                                    '<button class="lookup-cred-copy" onclick="lookupCopy(\'' + escAttr(c.extraInfo).replace(/'/g, "\\'") + '\',this)">Copy</button></div></div>';
                            }
                            credHtml += '</div>';
                        }
                    });
                    credHtml += '</div>';
                }

                var discountHtml = '';
                if (o.discountAmount && o.discountAmount > 0) {
                    discountHtml = '<div class="lookup-discount">Mã giảm giá: <strong>' + escHtml(o.discountCode || '') + '</strong> (-' + formatPrice(o.discountAmount) + ')</div>';
                }

                html += '<div class="lookup-order-card">' +
                    '<div class="lookup-order-header">' +
                    '<div class="lookup-order-code">' + escHtml(o.orderCode) + '</div>' +
                    badge +
                    '</div>' +
                    '<div class="lookup-order-meta">' +
                    '<span>📅 ' + escHtml(date) + '</span>' +
                    '<span class="lookup-total">💰 ' + formatPrice(o.total) + '</span>' +
                    '</div>' +
                    discountHtml +
                    '<div class="lookup-items">' + itemsHtml + '</div>' +
                    (actionHtml ? '<div class="lookup-action">' + actionHtml + '</div>' : '') +
                    credHtml +
                    '</div>';
            });

            resultDiv.innerHTML = html;
        })
        .catch(function (err) {
            btn.disabled = false;
            btn.innerHTML = '<span class="lookup-btn-text">Tra cứu</span><svg class="lookup-btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
            resultDiv.innerHTML = '<div class="lookup-empty"><span class="lookup-empty-icon">⚠️</span><p>Lỗi kết nối. Vui lòng thử lại.</p></div>';
            if (guide) guide.style.display = '';
            console.error('[lookup]', err);
        });
}

function lookupReveal(uid) {
    var el = document.getElementById(uid);
    var revBtn = document.getElementById(uid + '-r');
    var cpBtn = document.getElementById(uid + '-c');
    if (el) el.classList.remove('blurred');
    if (revBtn) revBtn.style.display = 'none';
    if (cpBtn) cpBtn.style.display = '';
}

function lookupCopy(text, btnEl) {
    navigator.clipboard.writeText(text).then(function () {
        if (btnEl) {
            var orig = btnEl.textContent;
            btnEl.textContent = '✓';
            setTimeout(function () { btnEl.textContent = orig; }, 1500);
        }
    }).catch(function () { });
}

function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escAttr(s) { return escHtml(s); }

// =============================================
// 🎵 FLOATING MUSIC PLAYER
// =============================================

const musicPlaylist = [
    { title: 'Nhẹ nhàng', src: 'audio/nhe-nhang.mp3' },
    { title: 'Lofi', src: 'audio/lofi.mp3' },
    { title: 'Chill', src: 'audio/chill.mp3' },
    { title: 'Bolero', src: 'audio/bolero.mp3' },
    { title: 'Ấn Độ', src: 'audio/an-do.mp3' },
    { title: 'Rap', src: 'audio/rap.mp3' }
];

let musicAudio = new Audio();
let musicCurrentIndex = -1;
let musicIsPlaying = false;
let musicPanelOpen = false;
let musicPlaylistOpen = false;
let musicProgressTimer = null;

// Init & auto-play "Nhẹ nhàng" on load
(function initMusicPlayer() {
    const savedVol = localStorage.getItem('tbq_music_vol');

    if (savedVol !== null) {
        musicAudio.volume = parseInt(savedVol) / 100;
        const volSlider = document.getElementById('musicVolume');
        if (volSlider) volSlider.value = savedVol;
    } else {
        musicAudio.volume = 0.7;
    }

    // Build playlist UI
    musicRenderPlaylist();

    // Audio events
    musicAudio.addEventListener('ended', function () {
        musicNext();
    });

    musicAudio.addEventListener('timeupdate', function () {
        musicUpdateProgress();
    });

    musicAudio.addEventListener('loadedmetadata', function () {
        const durEl = document.getElementById('musicDuration');
        if (durEl) durEl.textContent = musicFormatTime(musicAudio.duration);
    });

    // Chuẩn bị bài Nhẹ nhàng (index 0) — chưa phát
    musicCurrentIndex = 0;
    musicAudio.src = musicPlaylist[0].src;
    var nameEl = document.getElementById('musicTrackName');
    if (nameEl) nameEl.textContent = musicPlaylist[0].title;
    localStorage.setItem('tbq_music_track', 0);
    musicRenderPlaylist();

    // Generate floating particles
    var particleContainer = document.getElementById('welcomeParticles');
    if (particleContainer) {
        for (var i = 0; i < 20; i++) {
            var p = document.createElement('div');
            p.className = 'welcome-particle';
            var size = 2 + Math.random() * 4;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (6 + Math.random() * 8) + 's';
            p.style.animationDelay = (Math.random() * 6) + 's';
            particleContainer.appendChild(p);
        }
    }

    // Welcome overlay — click "Khám phá ngay" để phát nhạc
    var welcomeBtn = document.getElementById('welcomeEnterBtn');
    var welcomeOverlay = document.getElementById('welcomeOverlay');
    if (welcomeBtn && welcomeOverlay) {
        welcomeBtn.addEventListener('click', function () {
            welcomeOverlay.classList.add('hidden');
            setTimeout(function () { welcomeOverlay.remove(); }, 700);

            // Fade in: bắt đầu volume nhỏ, tăng dần trong 3 giây
            var targetVolume = musicAudio.volume; // volume đã lưu (mặc định 0.7)
            musicAudio.volume = 0.05; // bắt đầu rất nhẹ

            musicAudio.play().then(function () {
                musicIsPlaying = true;
                musicUpdateUI();

                // Tăng dần volume
                var fadeStep = 0;
                var totalSteps = 30; // 30 bước x 100ms = 3 giây
                var fadeInterval = setInterval(function () {
                    fadeStep++;
                    musicAudio.volume = Math.min(0.05 + (targetVolume - 0.05) * (fadeStep / totalSteps), targetVolume);
                    if (fadeStep >= totalSteps) {
                        clearInterval(fadeInterval);
                        musicAudio.volume = targetVolume;
                    }
                }, 100);
            }).catch(function (e) {
                console.warn('Music play failed:', e);
            });
        });
    }
})();

function toggleMusicPlayer() {
    musicPanelOpen = !musicPanelOpen;
    const panel = document.getElementById('musicPlayerPanel');
    if (panel) panel.classList.toggle('open', musicPanelOpen);
}

function musicRenderPlaylist() {
    const container = document.getElementById('musicPlaylist');
    if (!container) return;
    container.innerHTML = musicPlaylist.map(function (track, i) {
        const isActive = i === musicCurrentIndex;
        return '<div class="music-playlist-item' + (isActive ? ' active' : '') + '" onclick="musicPlayTrack(' + i + ')">' +
            '<span class="music-playlist-item-num">' + (isActive ? '♪' : (i + 1)) + '</span>' +
            '<span class="music-playlist-item-name">' + track.title + '</span>' +
            '<div class="music-playlist-item-playing"><span></span><span></span><span></span></div>' +
            '</div>';
    }).join('');
}

function musicPlayTrack(index) {
    if (index < 0 || index >= musicPlaylist.length) index = 0;
    musicCurrentIndex = index;
    musicAudio.src = musicPlaylist[index].src;
    musicAudio.play().then(function () {
        musicIsPlaying = true;
        musicUpdateUI();
    }).catch(function (e) {
        console.warn('Music autoplay blocked:', e);
    });
    localStorage.setItem('tbq_music_track', index);
}

function musicTogglePlay() {
    if (musicCurrentIndex < 0) {
        musicPlayTrack(0);
        return;
    }
    if (musicIsPlaying) {
        musicAudio.pause();
        musicIsPlaying = false;
    } else {
        musicAudio.play().then(function () {
            musicIsPlaying = true;
            musicUpdateUI();
        }).catch(function () { });
        return;
    }
    musicUpdateUI();
}

function musicNext() {
    const next = (musicCurrentIndex + 1) % musicPlaylist.length;
    musicPlayTrack(next);
}

function musicPrev() {
    // If more than 3 seconds into the song, restart; otherwise go prev
    if (musicAudio.currentTime > 3) {
        musicAudio.currentTime = 0;
        return;
    }
    const prev = (musicCurrentIndex - 1 + musicPlaylist.length) % musicPlaylist.length;
    musicPlayTrack(prev);
}

function musicSeek(val) {
    if (musicAudio.duration) {
        musicAudio.currentTime = (val / 100) * musicAudio.duration;
    }
}

function musicSetVolume(val) {
    musicAudio.volume = val / 100;
    musicAudio.muted = false;
    localStorage.setItem('tbq_music_vol', val);
    musicUpdateVolIcon();
}

function musicToggleMute() {
    musicAudio.muted = !musicAudio.muted;
    const volSlider = document.getElementById('musicVolume');
    if (musicAudio.muted) {
        if (volSlider) volSlider.value = 0;
    } else {
        if (volSlider) volSlider.value = Math.round(musicAudio.volume * 100);
    }
    musicUpdateVolIcon();
}

function musicUpdateVolIcon() {
    const waves = document.getElementById('musicVolWaves');
    if (!waves) return;
    if (musicAudio.muted || musicAudio.volume === 0) {
        waves.style.opacity = '0.2';
    } else {
        waves.style.opacity = '1';
    }
}

function toggleMusicPlaylist() {
    musicPlaylistOpen = !musicPlaylistOpen;
    const pl = document.getElementById('musicPlaylist');
    const arrow = document.getElementById('musicPlaylistArrow');
    if (pl) pl.classList.toggle('open', musicPlaylistOpen);
    if (arrow) arrow.classList.toggle('rotated', musicPlaylistOpen);
}

function musicUpdateUI() {
    const fab = document.getElementById('musicPlayerFab');
    const playBtn = document.getElementById('musicPlayIcon');
    const nameEl = document.getElementById('musicTrackName');

    if (fab) {
        fab.classList.toggle('playing', musicIsPlaying);
        fab.classList.toggle('paused', !musicIsPlaying && musicCurrentIndex >= 0);
    }

    if (playBtn) {
        if (musicIsPlaying) {
            playBtn.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        } else {
            playBtn.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        }
    }

    if (nameEl && musicCurrentIndex >= 0) {
        nameEl.textContent = musicPlaylist[musicCurrentIndex].title;
    }

    musicRenderPlaylist();
}

function musicUpdateProgress() {
    if (!musicAudio.duration) return;
    const progress = document.getElementById('musicProgress');
    const curTime = document.getElementById('musicCurrentTime');
    if (progress) progress.value = (musicAudio.currentTime / musicAudio.duration) * 100;
    if (curTime) curTime.textContent = musicFormatTime(musicAudio.currentTime);
}

function musicFormatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
}
