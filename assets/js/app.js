const isAccountPage =
    window.location.pathname === "/account.html" ||
    window.location.pathname.endsWith("/account.html");

document.addEventListener('DOMContentLoaded', function() {

    // --- GLOBAL --- //
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

    // --- POPUP & FLOATING BUTTON LOGIC --- //
    const modal = document.getElementById('newsletterModal');
    const closeModal = document.querySelector('.close-modal');
    const joinTribeBtn = document.getElementById('joinTribeBtn');
    const hideFloatingBtn = document.getElementById('hideFloatingBtn');

    // 1. Initial Popup Show (Delay 6s)
    if (modal && !localStorage.getItem('simpleValleyPopupShown')) {
        setTimeout(() => {
            modal.style.display = 'block';
            if(joinTribeBtn) joinTribeBtn.style.display = 'none'; // Hide button when modal is open
        }, 6000); 
    } else {
        // If popup already seen, show the floating button
        if(joinTribeBtn) joinTribeBtn.style.display = 'flex';
    }

    // 2. Close Modal triggers
    function closePopup() {
        modal.style.display = 'none';
        localStorage.setItem('simpleValleyPopupShown', 'true');
        if(joinTribeBtn && !sessionStorage.getItem('hideTribeBtn')) {
            joinTribeBtn.style.display = 'flex'; // Show floating button
        }
    }

    if (closeModal) closeModal.addEventListener('click', closePopup);
    window.addEventListener('click', (e) => { if (e.target == modal) closePopup(); });

    // 3. Floating Button Trigger
    if (joinTribeBtn) {
        joinTribeBtn.addEventListener('click', (e) => {
            // Prevent clicking the X from triggering the modal
            if(e.target !== hideFloatingBtn) {
                modal.style.display = 'block';
                joinTribeBtn.style.display = 'none';
            }
        });
    }

    // 4. Hide Floating Button (X)
    if (hideFloatingBtn) {
        hideFloatingBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            joinTribeBtn.style.display = 'none';
            sessionStorage.setItem('hideTribeBtn', 'true'); // Remember for session
        });
    }

    // --- GALLERY LOGIC (FIXED) --- //
    const galleryContainer = document.querySelector('.product-gallery');
    if (galleryContainer) {
        const mainImg = galleryContainer.querySelector('#mainImg');
        const thumbs = galleryContainer.querySelectorAll('.thumb');
        
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                // Remove active from all
                thumbs.forEach(t => t.classList.remove('active'));
                // Add active to clicked (using currentTarget handles inner img clicks)
                const clickedThumb = e.currentTarget;
                clickedThumb.classList.add('active');
                
                // Update main image
                const newSrc = clickedThumb.querySelector('img').src;
                if (mainImg && newSrc) {
                    mainImg.src = newSrc;
                }
            });
        });
    }

    // --- ACCORDION LOGIC --- //
    function initializeAccordion(selector, headerClass, contentClass) {
        const items = document.querySelectorAll(selector);
        items.forEach(item => {
            const header = item.querySelector(headerClass);
            if (header) {
                header.addEventListener('click', () => {
                    item.classList.toggle('active');
                    const content = item.querySelector(contentClass);
                    if (content) {
                        content.style.maxHeight = item.classList.contains('active') ? content.scrollHeight + 'px' : null;
                    }
                });
            }
        });
    }
    initializeAccordion('.accordion-item', '.accordion-header', '.accordion-content');
    initializeAccordion('.ingredient-card', '.ingredient-header', '.ingredient-desc');

    // --- CART LOGIC --- //
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartBtns = document.querySelectorAll('.cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartBody = document.getElementById('cart-body');
    let cart = JSON.parse(localStorage.getItem('simpleValleyCart')) || [];

    function saveCart() { localStorage.setItem('simpleValleyCart', JSON.stringify(cart)); }
    function openCart() { if(cartSidebar) cartSidebar.classList.add('active'); if(cartOverlay) cartOverlay.classList.add('active'); }
    function closeCart() { if(cartSidebar) cartSidebar.classList.remove('active'); if(cartOverlay) cartOverlay.classList.remove('active'); }

    if (cartSidebar) {
        cartBtns.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openCart(); }));
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

// --- STRIPE & AUTH0 LOGIC --- //
window.auth0Client = null;

const configureClient = async () => {
    try {
        window.auth0Client = await auth0.createAuth0Client({
            domain: 'login.simplevalleybar.com',
            clientId: 'IBrA9anQGfCPi3xxN9JSLWsaBQKrqYlz',
            authorizationParams: {
                redirect_uri: window.location.origin + '/account.html'
            }
        });
    } catch (e) {
        console.error("Error creating Auth0 client:", e);
    }
};

const login = async () => {
    if (!window.auth0Client) return;
    await window.auth0Client.loginWithRedirect({
        authorizationParams: {
            redirect_uri: window.location.origin + '/account.html'
        }
    });
};

const logout = async () => {
    if (!window.auth0Client) return;
    await window.auth0Client.logout({
        logoutParams: { returnTo: window.location.origin }
    });
};

async function fetchAndDisplayOrders() {
    const container = document.getElementById('order-history-container');
    if (!container || !window.auth0Client) return;

    try {
        const user = await window.auth0Client.getUser();
        // This fetches past orders from your backend
        const response = await fetch('/.netlify/functions/get-order-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user })
        });
        
        if (!response.ok) throw new Error('Failed to load orders.');

        const orders = await response.json();
        if (orders.length === 0) {
            container.innerHTML = '<p>You have not made any orders yet.</p>';
            return;
        }

        container.innerHTML = `<div class="orders-list">
            ${orders.map(order => `
                <div class="order-item">
                    <div class="order-summary">
                        <span class="order-date"><strong>Date:</strong> ${order.date}</span>
                        <span class="order-total"><strong>Total:</strong> ${order.total}</span>
                    </div>
                    <ul class="order-details">
                        ${order.items.map(item => `<li>${item.name} (x${item.quantity})</li>`).join('')}
                    </ul>
                </div>`).join('')}
        </div>`;
    } catch (error) {
        console.error('Order fetch error:', error);
        container.innerHTML = '<p>Sorry, we could not retrieve your orders at this time.</p>';
    }
}

const updateAuthUI = async () => {
    if (!window.auth0Client) return;

    const accountLink = document.getElementById('account-link');
    if (!accountLink) return;

    const isAuthenticated = await window.auth0Client.isAuthenticated();

    accountLink.textContent = isAuthenticated ? "Account" : "Log In";
    accountLink.href = "/account.html";
};

const loadAccountPage = async () => {
document.getElementById('loading-state').style.display = 'none';
document.getElementById('account-view').style.display = 'block';

document.getElementById('user-profile').innerHTML = `
    <h3>Welcome back!</h3>
    <p><strong>Email:</strong> ${user.email}</p>
`;

    // Logout button
const logoutButton = document.getElementById('logout-button');

const performLogout = async () => {
    if (!window.auth0Client) {
        console.error("Auth0 client not initialized!");
        return;
    }

    try {
        await window.auth0Client.logout({
            logoutParams: { returnTo: window.location.origin }
        });
    } catch (err) {
        console.error("Logout failed:", err);
    }
};

// 3. Attach the click event (Connect the button to the logic)
if (logoutButton) {
    logoutButton.addEventListener("click", performLogout);
}

    // Load orders
    await fetchAndDisplayOrders();

    // Settings menu logic
    const settingsBtn = document.getElementById('settings-menu-btn');
    const settingsDropdown = document.getElementById('settings-dropdown-content');

    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('active');
    });

    window.addEventListener('click', () => {
        settingsDropdown.classList.remove('active');
    });
};


    // --- BUNDLE & SHOP LOGIC --- //
    const bundleOptions = document.querySelectorAll('.bundle-option');
    const addToCartBtn = document.getElementById('addToCartBtn');
    let currentSelection = {
        qty: 1, price: 79.99, title: 'The Simple Valley Bar - 2 Boxes', priceId: 'price_1SgqJDLXAfa3XjXDkbgFa7Ka'
    };

    if (bundleOptions.length > 0) {
        bundleOptions.forEach(option => {
            option.addEventListener('click', function() {
                bundleOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
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
if (!existingProduct) {
  cart.push(product);
}
 else { cart.push(product); }
            
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

// --- CHECKOUT LOGIC --- //
const checkoutBtn = document.getElementById('checkout-button');
if (checkoutBtn) {
    const newBtn = checkoutBtn.cloneNode(true);
    checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);

    newBtn.addEventListener('click', async () => {
        if (cart.length === 0) return;

        // 1. UI Feedback
        const originalText = newBtn.textContent;
        newBtn.textContent = 'Processing...';
        newBtn.disabled = true;

        try {
            // 2. Get User Email (if logged in)
            let userEmail = null;
            if (window.auth0Client) {
                const isAuthenticated = await window.auth0Client.isAuthenticated();
                if (isAuthenticated) {
                    const user = await window.auth0Client.getUser();
                    userEmail = user.email;
                }
            }

            // 3. Create Checkout Session
            const response = await fetch('/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Now we are passing the email correctly again!
                body: JSON.stringify({ cart: cart, userEmail: userEmail }),
            });

            if (!response.ok) {
                throw new Error('Server error creating checkout session');
            }

            const { url } = await response.json();
            
            // 4. Redirect
            if (url) {
                window.location = url;
            } else {
                throw new Error('No checkout URL returned.');
            }

        } catch (e) {
            console.error(e);
            alert('Error processing checkout. Please try again.');
            newBtn.textContent = originalText;
            newBtn.disabled = false;
        }
    });
}
// --- SOCIAL CAROUSEL SCROLL LOGIC --- //
    const track = document.getElementById('communityTrack');
    const btnLeft = document.getElementById('scrollLeftBtn');
    const btnRight = document.getElementById('scrollRightBtn');

    if (track && btnLeft && btnRight) {
        btnLeft.addEventListener('click', () => {
            track.scrollBy({ left: -300, behavior: 'smooth' });
        });
        btnRight.addEventListener('click', () => {
            track.scrollBy({ left: 300, behavior: 'smooth' });
        });
    }
// --- YOUTUBE MODAL LOGIC --- //
    const videoModal = document.getElementById('videoModal');
    const youtubePlayer = document.getElementById('youtubePlayer');
    const socialCards = document.querySelectorAll('.social-card');
    const closeVideoBtn = document.querySelector('.close-video');

    if (videoModal && youtubePlayer) {
        // Open Video
        socialCards.forEach(card => {
            card.addEventListener('click', () => {
                const videoId = card.getAttribute('data-youtube-id');
                if (videoId) {
                    // Construct embed URL with autoplay
                    youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
                    videoModal.style.display = 'block';
                } else {
                    console.log("No YouTube ID found for this card.");
                }
            });
        });

        // Close Video Function (Stops audio by clearing src)
        const closeVideo = () => {
            videoModal.style.display = 'none';
            youtubePlayer.src = ""; 
        };

        // Close on X button
        if (closeVideoBtn) {
            closeVideoBtn.addEventListener('click', closeVideo);
        }

        // Close on click outside
        window.addEventListener('click', (e) => {
            if (e.target == videoModal) {
                closeVideo();
            }
        });
    }
window.addEventListener("load", async () => {

    await configureClient();
    await updateAuthUI();

    if (!isAccountPage) return;

    // Handle Auth0 redirect callback
    if (
        window.location.search.includes("code=") &&
        window.location.search.includes("state=")
    ) {
        await window.auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, "/account.html");
    }

    const isAuthenticated = await window.auth0Client.isAuthenticated();

    if (!isAuthenticated) {
        await window.auth0Client.loginWithRedirect({
            authorizationParams: {
                redirect_uri: window.location.origin + "/account.html"
            }
        });
        return;
    }

    const user = await window.auth0Client.getUser();
    await loadAccountPage(user);
});

});