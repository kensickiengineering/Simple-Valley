document.addEventListener('DOMContentLoaded', function() {

    // --- GLOBAL SITE-WIDE FUNCTIONS --- //
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (mobileNavToggle && mainNav) {
        mobileNavToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            mobileNavToggle.classList.toggle('open');
        });
    }

    const fadeInElements = document.querySelectorAll('.fade-in');
    if (fadeInElements.length > 0) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        fadeInElements.forEach(element => observer.observe(element));
    }

    // --- INGREDIENTS & FAQ ACCORDION LOGIC --- //
    function initializeAccordion(selector, headerClass, contentClass) {
        const items = document.querySelectorAll(selector);
        if (items.length > 0) {
            items.forEach(item => {
                const header = item.querySelector(headerClass);
                if (header) {
                    header.addEventListener('click', () => {
                        item.classList.toggle('active');
                        const content = item.querySelector(contentClass);
                        if (content && item.classList.contains('active')) {
                            content.style.maxHeight = content.scrollHeight + 'px';
                        } else if (content) {
                            content.style.maxHeight = null;
                        }
                    });
                }
            });
        }
    }
    initializeAccordion('.accordion-item', '.accordion-header', '.accordion-content');
    initializeAccordion('.ingredient-card', '.ingredient-header', '.ingredient-desc');

    // --- CART & E-COMMERCE LOGIC --- //
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartBtns = document.querySelectorAll('.cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartBody = document.getElementById('cart-body');
    let cart = JSON.parse(localStorage.getItem('simpleValleyCart')) || [];

    function saveCart() { localStorage.setItem('simpleValleyCart', JSON.stringify(cart)); }
    function openCart() { if(cartSidebar) cartSidebar.classList.add('active'); if(cartOverlay) cartOverlay.classList.add('active'); }
    function closeCart() { if(cartSidebar) cartSidebar.classList.remove('active'); if(cartOverlay) cartOverlay.classList.remove('active'); }

    if (cartSidebar && cartOverlay && closeCartBtn && cartBtns.length > 0) {
        cartBtns.forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); openCart(); }));
        closeCartBtn.addEventListener('click', closeCart);
        cartOverlay.addEventListener('click', closeCart);
    }

    function updateCartUI() {
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) cartCountEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);

        if (cartBody) {
            cartBody.innerHTML = '';
            if (cart.length === 0) {
                cartBody.innerHTML = '<p class="cart-empty-msg">Your cart is empty.</p>';
            } else {
                cart.forEach(item => {
                    const itemTotal = (item.price * item.qty).toFixed(2);
                    cartBody.innerHTML += `
                        <div class="cart-item" data-id="${item.id}">
                            <div class="cart-item-img"><img src="${item.image}" alt="${item.title}"></div>
                            <div class="cart-item-details">
                                <h4>${item.title}</h4>
                                <p class="cart-item-price">$${itemTotal}</p>
                                <div class="cart-item-actions">
                                    <button class="remove-item-btn" data-action="remove">Remove</button>
                                </div>
                            </div>
                        </div>`;
                });
            }
        }
        
        const subtotalEl = document.getElementById('cart-subtotal');
        if (subtotalEl) {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        }
        const checkoutBtn = document.getElementById('checkout-button');
        if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
    }

    if (cartBody) {
        cartBody.addEventListener('click', e => {
            if (e.target.dataset.action === 'remove') {
                const id = e.target.closest('.cart-item').dataset.id;
                cart = cart.filter(item => item.id !== id);
                saveCart();
                updateCartUI();
            }
        });
    }
    updateCartUI();

    // --- SHOP PAGE SPECIFIC (BUNDLES + GALLERY) --- //
    if (document.querySelector('.shop-layout')) {
        const mainImg = document.getElementById('mainImg');
        const thumbs = document.querySelectorAll('.thumb');
        
        // Gallery Logic
        if (mainImg && thumbs.length > 0) {
            thumbs.forEach(thumb => {
                thumb.addEventListener('click', function() {
                    thumbs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    mainImg.src = this.querySelector('img').src;
                });
            });
        }

        // Bundle Logic
        const bundleOptions = document.querySelectorAll('.bundle-option');
        const addToCartBtn = document.getElementById('addToCartBtn');
        let currentSelection = {
            qty: 1, 
            price: 79.99,
            title: 'The Simple Valley Bar - 2 Boxes (24 Bars)',
            priceId: 'price_1SgqJDLXAfa3XjXDkbgFa7Ka' // Default 2 Box ID
        };

        if (bundleOptions.length > 0) {
            bundleOptions.forEach(option => {
                option.addEventListener('click', function() {
                    // Update Visuals
                    bundleOptions.forEach(opt => opt.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update Data
                    currentSelection.price = this.dataset.price;
                    currentSelection.priceId = this.dataset.stripeId;
                    const bundleTitle = this.querySelector('.bundle-title').innerText;
                    currentSelection.title = `The Simple Valley Bar - ${bundleTitle}`;
                    
                    if (addToCartBtn) addToCartBtn.textContent = `Add to Cart - $${currentSelection.price}`;
                });
            });
        }

        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function() {
                const product = { 
                    id: currentSelection.priceId,
                    title: currentSelection.title, 
                    price: parseFloat(currentSelection.price),
                    image: 'assets/img/SecondaryPic2.png',
                    priceId: currentSelection.priceId,
                    qty: 1
                };
                
                const existingProduct = cart.find(p => p.id === product.id);
                if (existingProduct) {
                    existingProduct.qty += 1;
                } else {
                    cart.push(product);
                }
                
                saveCart();
                updateCartUI();
                openCart();

                const originalText = this.textContent;
                this.textContent = 'Added! ✓';
                this.classList.add('added');
                this.disabled = true;
                setTimeout(() => {
                    this.textContent = originalText;
                    this.classList.remove('added');
                    this.disabled = false;
                }, 2000);
            });
        }
    }

    // --- CHECKOUT LOGIC --- //
    const checkoutBtn = document.getElementById('checkout-button');
    if (checkoutBtn) {
        // Use cloning to ensure no duplicate listeners if code runs twice
        const newBtn = checkoutBtn.cloneNode(true);
        checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
        newBtn.addEventListener('click', async () => {
            if (cart.length === 0) return;
            newBtn.textContent = 'Processing...';
            try {
                const response = await fetch('/.netlify/functions/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cart: cart }),
                });
                const { url } = await response.json();
                window.location = url;
            } catch (e) {
                console.error(e);
                alert('Error processing checkout');
                newBtn.textContent = 'Proceed to Checkout';
            }
        });
    }

    // --- NEWSLETTER POPUP LOGIC --- //
    const modal = document.getElementById('newsletterModal');
    const closeModal = document.querySelector('.close-modal');
    if (modal && !localStorage.getItem('popupShown')) {
        setTimeout(() => { modal.style.display = 'block'; }, 6000);
    }
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            localStorage.setItem('popupShown', 'true');
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
            localStorage.setItem('popupShown', 'true');
        }
    });
});