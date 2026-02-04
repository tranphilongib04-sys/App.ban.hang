
// HEADER SCROLL LOGIC
let lastScrollTop = 0;
const header = document.querySelector('header');
const scrollThreshold = 10; // offset to prevent micro-jitters

window.addEventListener('scroll', function () {
    // Only active on mobile/small screens if requested, or globally. 
    // User asked for "web mobile", but good UX usually applies to all or we check width.
    // Let's apply globally for consistency or check window.innerWidth < 769 if strict.
    // Given the prompt "web mobile", I will restrict it to mobile width for safety or just let it be.
    // Let's stick to global behavior as it's cleaner, but maybe check width if needed.
    // Actually, "web mobile" implies the mobile view. Let's do a width check to be safe.

    if (window.innerWidth > 768) return; // Optional: restrict to mobile

    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Ignore bounce scrolling (iOS)
    if (scrollTop < 0) {
        scrollTop = 0;
    }

    if (Math.abs(scrollTop - lastScrollTop) <= scrollThreshold) return;

    if (scrollTop > lastScrollTop && scrollTop > 60) {
        // Scroll Down -> Hide
        header.classList.add('header-hidden');
    } else {
        // Scroll Up -> Show
        header.classList.remove('header-hidden');
    }

    lastScrollTop = scrollTop;
});
