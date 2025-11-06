// Mobile Navigation and Responsive Features
class MobileManager {
    constructor(app) {
        this.app = app;
        this.setupMobileListeners();
    }

    setupMobileListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        if (mobileMenuOverlay) {
            mobileMenuOverlay.addEventListener('click', () => this.closeMobileMenu());
        }

        // Close menu when clicking on links
        const mobileLinks = mobileMenu?.querySelectorAll('a, button[data-action]');
        mobileLinks?.forEach(link => {
            link.addEventListener('click', () => this.closeMobileMenu());
        });

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());

        // Setup touch gestures for mobile
        this.setupTouchGestures();
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        const hamburgerIcon = document.querySelector('#mobileMenuBtn .hamburger-icon');
        const closeIcon = document.querySelector('#mobileMenuBtn .close-icon');

        if (mobileMenu.classList.contains('hidden')) {
            // Open menu
            mobileMenu.classList.remove('hidden');
            mobileMenuOverlay.classList.remove('hidden');
            
            // Animate in
            setTimeout(() => {
                mobileMenu.classList.add('translate-x-0');
                mobileMenu.classList.remove('translate-x-full');
                mobileMenuOverlay.classList.add('opacity-100');
                mobileMenuOverlay.classList.remove('opacity-0');
            }, 10);

            // Update icon
            if (hamburgerIcon) hamburgerIcon.classList.add('hidden');
            if (closeIcon) closeIcon.classList.remove('hidden');

            // Prevent body scroll
            document.body.classList.add('overflow-hidden');
        } else {
            this.closeMobileMenu();
        }
    }

    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        const hamburgerIcon = document.querySelector('#mobileMenuBtn .hamburger-icon');
        const closeIcon = document.querySelector('#mobileMenuBtn .close-icon');

        // Animate out
        mobileMenu.classList.add('translate-x-full');
        mobileMenu.classList.remove('translate-x-0');
        mobileMenuOverlay.classList.add('opacity-0');
        mobileMenuOverlay.classList.remove('opacity-100');

        // Update icon
        if (hamburgerIcon) hamburgerIcon.classList.remove('hidden');
        if (closeIcon) closeIcon.classList.add('hidden');

        // Allow body scroll after animation
        setTimeout(() => {
            mobileMenu.classList.add('hidden');
            mobileMenuOverlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }, 300);
    }

    handleResize() {
        // Close mobile menu when switching to desktop view
        if (window.innerWidth >= 1024) {
            this.closeMobileMenu();
        }
    }

    setupTouchGestures() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', (e) => {
            endX = e.touches[0].clientX;
            endY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', () => {
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            // Swipe left to close mobile menu
            if (deltaX < -50 && absDeltaX > absDeltaY) {
                const mobileMenu = document.getElementById('mobileMenu');
                if (!mobileMenu.classList.contains('hidden')) {
                    this.closeMobileMenu();
                }
            }

            // Swipe right to open mobile menu (only on left edge)
            if (deltaX > 50 && absDeltaX > absDeltaY && startX < 50) {
                const mobileMenu = document.getElementById('mobileMenu');
                if (mobileMenu.classList.contains('hidden')) {
                    this.toggleMobileMenu();
                }
            }
        });
    }
}

// Keyboard shortcuts manager
class KeyboardManager {
    constructor(app) {
        this.app = app;
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only trigger shortcuts when not typing in an input
            if (this.isTypingInInput(e.target)) return;

            // Ctrl/Cmd + key combinations
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        this.app.showEditor();
                        break;
                    case 's':
                        e.preventDefault();
                        if (this.app.currentView === 'editor') {
                            this.app.saveEntry();
                        }
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('searchInput')?.focus();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.app.showDashboard();
                        break;
                    case '1':
                        e.preventDefault();
                        this.app.showFavorites();
                        break;
                    case '2':
                        e.preventDefault();
                        this.app.showProfile();
                        break;
                    case '3':
                        e.preventDefault();
                        this.app.showSettings();
                        break;
                }
            }

            // Escape key
            if (e.key === 'Escape') {
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobileMenu');
                if (!mobileMenu.classList.contains('hidden')) {
                    document.getElementById('mobileMenuOverlay')?.click();
                    return;
                }

                // Go back to dashboard from editor
                if (this.app.currentView === 'editor') {
                    this.app.showDashboard();
                }
            }
        });
    }

    isTypingInInput(element) {
        const tagName = element.tagName.toLowerCase();
        const inputTypes = ['input', 'textarea', 'select'];
        return inputTypes.includes(tagName) || element.contentEditable === 'true';
    }
}

// Print functionality
class PrintManager {
    constructor(app) {
        this.app = app;
        this.setupPrintListeners();
    }

    setupPrintListeners() {
        // Print current entry
        document.getElementById('printEntryBtn')?.addEventListener('click', () => {
            this.printCurrentEntry();
        });

        // Print all entries
        document.getElementById('printAllEntriesBtn')?.addEventListener('click', () => {
            this.printAllEntries();
        });
    }

    printCurrentEntry() {
        if (!this.app.currentEntry) return;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        const content = this.formatEntryForPrint(this.app.currentEntry);
        
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    }

    printAllEntries() {
        if (this.app.entries.length === 0) return;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        let content = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Meu Diário Pessoal - Todas as Entradas</title>
                <style>
                    body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
                    .entry { margin-bottom: 40px; page-break-inside: avoid; }
                    .entry-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #000; }
                    .entry-date { font-size: 14px; color: #666; margin-bottom: 15px; }
                    .entry-content { font-size: 16px; margin-bottom: 15px; }
                    .entry-tags { margin-bottom: 10px; }
                    .tag { display: inline-block; background: #f0f0f0; padding: 3px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px; }
                    .page-break { page-break-before: always; }
                    @media print { .page-break { page-break-before: always; } }
                </style>
            </head>
            <body>
                <h1>Meu Diário Pessoal</h1>
                <p>Exportado em ${new Date().toLocaleDateString('pt-BR')}</p>
                <hr style="margin: 20px 0;">
        `;

        this.app.entries.forEach((entry, index) => {
            content += this.formatEntryForPrint(entry, index > 0);
        });

        content += '</body></html>';
        
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    }

    formatEntryForPrint(entry, addPageBreak = false) {
        const date = new Date(entry.createdAt);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        let content = `
            <div class="entry${addPageBreak ? ' page-break' : ''}">
                <h2 class="entry-title">${entry.title || 'Sem título'}</h2>
                <div class="entry-date">${formattedDate}</div>
                <div class="entry-content">${entry.content.replace(/\n/g, '<br>')}</div>
        `;

        if (entry.tags && entry.tags.length > 0) {
            content += '<div class="entry-tags">';
            entry.tags.forEach(tag => {
                content += `<span class="tag">${tag}</span>`;
            });
            content += '</div>';
        }

        content += '</div>';
        return content;
    }
}

// Initialize all managers when app loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        window.mobile = new MobileManager(window.app);
        window.keyboard = new KeyboardManager(window.app);
        window.print = new PrintManager(window.app);
    }
});