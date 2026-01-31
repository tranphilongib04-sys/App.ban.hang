/* ==========================================
   Tiệm Bản Quyền - Main JavaScript
   Cart, Checkout, History, Animations
   ========================================== */

// ==========================================
// PRODUCT DATA
// ==========================================
const PRODUCTS = [
    { id: 'chatgpt', name: 'ChatGPT Plus', price: 70000, duration: '1 tháng', logo: 'assets/logos/chatgpt.svg' },
    { id: 'canva', name: 'Canva Pro', price: 50000, duration: '1 tháng', logo: 'assets/logos/canva.svg' },
    { id: 'capcut', name: 'CapCut Pro', price: 35000, duration: '1 tháng', logo: 'assets/logos/capcut.svg' },
    { id: 'spotify', name: 'Spotify Premium', price: 30000, duration: '1 tháng', logo: 'assets/logos/spotify.svg' },
    { id: 'netflix', name: 'Netflix Premium', price: 70000, duration: '1 tháng', logo: 'assets/logos/netflix.svg' },
    { id: 'quizlet', name: 'Quizlet Plus', price: 160000, duration: '1 năm', logo: 'assets/logos/quizlet.svg' },
    { id: 'adobe', name: 'Adobe CC', price: 150000, duration: '1 tháng', logo: 'assets/logos/adobe.svg' },
];

// ==========================================
// CART STATE
// ==========================================
let cart = JSON.parse(localStorage.getItem('tbq_cart')) || [];

function saveCart() {
    localStorage.setItem('tbq_cart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        showToast('Sản phẩm đã có trong giỏ', '⚠️');
        return;
    }

    cart.push({ ...product, quantity: 1 });
    saveCart();
    showToast(`Đã thêm ${product.name}`, '✓');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function formatPrice(price) {
    return price.toLocaleString('vi-VN') + 'đ';
}

// ==========================================
// CART UI
// ==========================================
function updateCartUI() {
    const countEl = document.getElementById('cartCount');
    const itemsEl = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (countEl) {
        countEl.textContent = cart.length;
        countEl.dataset.count = cart.length;
    }

    if (itemsEl) {
        if (cart.length === 0) {
            itemsEl.innerHTML = '<div class="cart-empty">Giỏ hàng trống</div>';
        } else {
            itemsEl.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.logo}" alt="${item.name}" class="cart-item-logo">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-duration">${item.duration}</div>
                    </div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <button class="cart-item-remove" data-id="${item.id}">✕</button>
                </div>
            `).join('');

            // Add remove handlers
            itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
            });
        }
    }

    if (totalEl) {
        totalEl.textContent = formatPrice(getCartTotal());
    }

    if (checkoutBtn) {
        if (cart.length === 0) {
            checkoutBtn.style.pointerEvents = 'none';
            checkoutBtn.style.opacity = '0.5';
        } else {
            checkoutBtn.style.pointerEvents = 'auto';
            checkoutBtn.style.opacity = '1';
        }
    }
}

function openCart() {
    document.getElementById('cartOverlay')?.classList.add('active');
    document.getElementById('cartModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartOverlay')?.classList.remove('active');
    document.getElementById('cartModal')?.classList.remove('active');
    document.body.style.overflow = '';
}

// ==========================================
// RENDER PRODUCTS
// ==========================================
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = PRODUCTS.map(product => `
        <div class="product-card fade-in" data-id="${product.id}">
            <img src="${product.logo}" alt="${product.name}" class="product-logo">
            <div class="product-name">${product.name}</div>
            <div class="product-price">${formatPrice(product.price)}/${product.duration}</div>
            <button class="product-add-btn" data-id="${product.id}">
                + Thêm giỏ hàng
            </button>
        </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.product-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(btn.dataset.id);
        });
    });

    // Re-observe for animations
    observeFadeIns();
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, icon = '✓') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ==========================================
// ANIMATIONS
// ==========================================
function observeFadeIns() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ==========================================
// FAQ ACCORDION
// ==========================================
function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question');
        question?.addEventListener('click', () => {
            // Close others
            document.querySelectorAll('.faq-item.active').forEach(other => {
                if (other !== item) other.classList.remove('active');
            });
            item.classList.toggle('active');
        });
    });
}

// ==========================================
// SMOOTH SCROLL
// ==========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ==========================================
// TRANSACTION HISTORY
// ==========================================
function getOrders() {
    return JSON.parse(localStorage.getItem('tbq_orders')) || [];
}

function saveOrder(order) {
    const orders = getOrders();
    orders.unshift(order);
    localStorage.setItem('tbq_orders', JSON.stringify(orders));
}

function generateOrderId() {
    return 'TBQ' + Date.now().toString(36).toUpperCase();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==========================================
// CHECKOUT PAGE
// ==========================================
function initCheckout() {
    const orderSummary = document.getElementById('orderSummary');
    const orderTotal = document.getElementById('orderTotal');
    const transferContent = document.getElementById('transferContent');

    if (!orderSummary) return;

    if (cart.length === 0) {
        window.location.href = 'index.html';
        return;
    }

    // Render cart items
    orderSummary.innerHTML = cart.map(item => `
        <div class="order-item">
            <div class="order-item-info">
                <img src="${item.logo}" alt="${item.name}" class="order-item-logo">
                <span class="order-item-name">${item.name}</span>
            </div>
            <span class="order-item-price">${formatPrice(item.price)}</span>
        </div>
    `).join('');

    // Update total
    const total = getCartTotal();
    if (orderTotal) orderTotal.textContent = formatPrice(total);

    // Set transfer content
    const productNames = cart.map(p => p.id.toUpperCase()).join(' ');
    if (transferContent) transferContent.textContent = `TBQ ${productNames}`;

    // Copy button
    document.getElementById('copyBtn')?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText('0918161862');
            showToast('Đã copy số tài khoản!', '✓');
        } catch (err) {
            alert('Copy thủ công: 0918161862');
        }
    });

    // Confirm payment button
    document.getElementById('confirmBtn')?.addEventListener('click', () => {
        // Save order
        const order = {
            id: generateOrderId(),
            date: new Date().toISOString(),
            items: [...cart],
            total: getCartTotal(),
            status: 'pending'
        };
        saveOrder(order);

        // Store current order for success page
        localStorage.setItem('tbq_current_order', JSON.stringify(order));

        // Clear cart
        cart = [];
        saveCart();

        // Go to success
        window.location.href = 'success.html';
    });
}

// ==========================================
// SUCCESS PAGE
// ==========================================
function initSuccess() {
    const orderIdEl = document.getElementById('orderId');
    const orderItemsEl = document.getElementById('successOrderItems');

    const currentOrder = JSON.parse(localStorage.getItem('tbq_current_order'));

    if (orderIdEl && currentOrder) {
        orderIdEl.textContent = currentOrder.id;
    }

    if (orderItemsEl && currentOrder) {
        orderItemsEl.innerHTML = currentOrder.items.map(item => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0;">
                <img src="${item.logo}" alt="${item.name}" style="width: 32px; height: 32px;">
                <span>${item.name}</span>
            </div>
        `).join('');
    }
}

// ==========================================
// HISTORY PAGE
// ==========================================
function initHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    const orders = getOrders();

    if (orders.length === 0) {
        historyList.innerHTML = `
            <div class="cart-empty" style="padding: 60px 20px;">
                <p style="margin-bottom: 16px;">Bạn chưa có đơn hàng nào</p>
                <a href="index.html" class="btn btn-primary">Mua sắm ngay</a>
            </div>
        `;
        return;
    }

    historyList.innerHTML = orders.map(order => `
        <div class="history-item">
            <div class="history-header">
                <span class="history-date">${formatDate(order.date)}</span>
                <span class="history-status ${order.status}">${order.status === 'pending' ? 'Đang xử lý' : 'Hoàn thành'}</span>
            </div>
            <div class="history-products">
                ${order.items.map(item => `
                    <div class="history-product">
                        <img src="${item.logo}" alt="${item.name}" class="history-product-logo">
                        <span>${item.name}</span>
                    </div>
                `).join('')}
            </div>
            <div class="history-total">
                <span>Mã đơn: ${order.id}</span>
                <span>${formatPrice(order.total)}</span>
            </div>
        </div>
    `).join('');
}

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Cart modal handlers
    document.getElementById('cartBtn')?.addEventListener('click', openCart);
    document.getElementById('cartClose')?.addEventListener('click', closeCart);
    document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

    // Init based on page
    renderProducts();
    updateCartUI();
    initFAQ();
    initSmoothScroll();
    observeFadeIns();

    // Page-specific init
    if (document.getElementById('orderSummary')) {
        initCheckout();
    }
    if (document.getElementById('orderId')) {
        initSuccess();
    }
    if (document.getElementById('historyList')) {
        initHistory();
    }
});

// Expose functions globally
window.showToast = showToast;
window.addToCart = addToCart;
