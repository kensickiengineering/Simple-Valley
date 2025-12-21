document.addEventListener('DOMContentLoaded', function() {

    // --- GLOBAL SITE-WIDE FUNCTIONS --- //
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

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
    const checkoutButton = document.getElementById('checkout-button'); // Keep reference for disabling

    let cart = JSON.parse(localStorage.getItem('simpleValleyCart')) || [];

    function saveCart() {
        localStorage.setItem('simpleValleyCart', JSON.stringify(cart));
    }

    function openCart() {
        if(cartSidebar) cartSidebar.classList.add('active');
        if(cartOverlay) cartOverlay.classList.add('active');
    }

    function closeCart() {
        if(cartSidebar) cartSidebar.classList.remove('active');
        if(cartOverlay) cartOverlay.classList.remove('active');
    }

    if (cartSidebar && cartOverlay && closeCartBtn && cartBtns.length > 0) {
        cartBtns.forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); openCart(); }));
        closeCartBtn.addEventListener('click', closeCart);
        cartOverlay.addEventListener('click', closeCart);
    }

    function updateCartUI() {
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) {
            cartCountEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
        }

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
                                    <div class="quantity-selector">
                                        <button class="quantity-btn" data-action="decrease">-</button>
                                        <input type="number" value="${item.qty}" min="1" readonly>
                                        <button class="quantity-btn" data-action="increase">+</button>
                                    </div>
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
        if (checkoutBtn) {
            checkoutBtn.disabled = cart.length === 0;
        }
    }

    if (cartBody) {
        cartBody.addEventListener('click', e => {
            const target = e.target;
            const parentItem = target.closest('.cart-item');
            if (!parentItem) return;

            const productId = parentItem.dataset.id;
            const action = target.dataset.action;
            const productIndex = cart.findIndex(item => item.id === productId);

            if (productIndex === -1) return;

            if (action === 'increase') {
                cart[productIndex].qty++;
            } else if (action === 'decrease') {
                if (cart[productIndex].qty > 1) {
                    cart[productIndex].qty--;
                } else {
                    if (confirm('Are you sure? This will remove the item from your cart.')) {
                        cart.splice(productIndex, 1);
                    }
                }
            } else if (action === 'remove') {
                if (confirm('Are you sure? This will remove the item from your cart.')) {
                    cart.splice(productIndex, 1);
                }
            }

            saveCart();
            updateCartUI();
        });
    }
    
    updateCartUI();

    // --- SHOP PAGE SPECIFIC --- //
    if (document.querySelector('.shop-layout')) {
        const mainImg = document.getElementById('mainImg');
        const thumbs = document.querySelectorAll('.thumb');
        
        // Image Gallery Logic
        if (mainImg && thumbs.length > 0) {
            thumbs.forEach(thumb => {
                thumb.addEventListener('click', function() {
                    thumbs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    mainImg.src = this.querySelector('img').src;
                });
            });
        }

        // --- NEW BUNDLE LOGIC (Updated for Dynamic Stripe IDs) --- //
const bundleOptions = document.querySelectorAll('.bundle-option');
const addToCartBtn = document.getElementById('addToCartBtn');

// Variables to store current selection (Default to 2 Boxes)
let currentSelection = {
    qty: 1, // Logic change: We treat a "bundle" as Qty 1 of that specific bundle product
    price: 79.99,
    title: '2 Boxes (24 Bars)',
    priceId: 'price_1SgqJDLXAfa3XjXDkbgFa7Ka' // Default ID
};

if (bundleOptions.length > 0) {
    bundleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 1. Visual Update
            bundleOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            // 2. Data Update
            const price = this.dataset.price;
            const stripeId = this.dataset.stripeId;
            const bundleTitle = this.querySelector('.bundle-title').innerText;

            // Update Global Selection Variable
            currentSelection = {
                qty: 1, // We are buying 1 "Bundle" unit
                price: price,
                title: `The Simple Valley Bar - ${bundleTitle}`,
                priceId: stripeId
            };
            
            // 3. Update Button Text
            if (addToCartBtn) addToCartBtn.textContent = `Add to Cart - $${price}`;
        });
    });
}

// --- ADD TO CART LOGIC --- //
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
        const product = { 
            id: currentSelection.priceId, // Use Stripe ID as unique Cart ID
            title: currentSelection.title, 
            price: parseFloat(currentSelection.price),
            image: 'assets/img/SecondaryPic2.png',
            priceId: currentSelection.priceId // Send this to Stripe
        };
        
        // Add to Global Cart Array
        const existingProduct = cart.find(p => p.id === product.id);
        if (existingProduct) {
            existingProduct.qty += 1;
        } else {
            cart.push({ ...product, qty: 1 });
        }
        
        saveCart();
        updateCartUI();
        openCart();

        // Button Feedback
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
    
    // --- STRIPE & AUTH0 LOGIC --- //
    let auth0Client = null;

    const configureClient = async () => {
        try {
            auth0Client = await auth0.createAuth0Client({
                domain: 'login.simplevalleybar.com',
                clientId: 'IBrA9anQGfCPi3xxN9JSLWsaBQKrqYlz',
                authorizationParams: { redirect_uri: window.location.origin + '/account.html' }
            });
        } catch (e) {
            console.error("Error creating Auth0 client:", e);
        }
    };

    const login = async () => auth0Client.loginWithRedirect({
        authorizationParams: { redirect_uri: window.location.origin + '/account.html' }
    });

    const logout = async () => auth0Client.logout({
        logoutParams: { returnTo: window.location.origin }
    });
    
    async function fetchAndDisplayOrders() {
        const container = document.getElementById('order-history-container');
        if (!container) return;
    
        try {
            const user = await auth0Client.getUser();
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

    // --- MAIN UI UPDATE FUNCTION --- //
    const updateUI = async () => {
        const isAuthenticated = await auth0Client.isAuthenticated();
        const accountLink = document.getElementById('account-link');
    
        if (accountLink) {
            accountLink.href = isAuthenticated ? '/account.html' : '#';
            if (!isAuthenticated) {
                accountLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    login();
                });
            }
        }

        const checkoutBtn = document.getElementById('checkout-button');
        if (checkoutBtn) {
            const newCheckoutBtn = checkoutBtn.cloneNode(true);
            checkoutBtn.parentNode.replaceChild(newCheckoutBtn, checkoutBtn);
            
            newCheckoutBtn.addEventListener('click', async function() {
                if (cart.length === 0) return;
                newCheckoutBtn.disabled = true;
                newCheckoutBtn.textContent = 'Processing...';
                
                const isAuthenticated = await auth0Client.isAuthenticated();
                const userEmail = isAuthenticated ? (await auth0Client.getUser()).email : null;
        
                try {
                    const response = await fetch('/.netlify/functions/create-checkout-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cart: cart, userEmail: userEmail }),
                    });
                    if (!response.ok) throw new Error('Server error');
                    const { url } = await response.json();
                    window.location = url;
                } catch (e) {
                    console.error(e);
                    alert('An error occurred. Please try again.');
                    newCheckoutBtn.disabled = false;
                    newCheckoutBtn.textContent = 'Proceed to Checkout';
                }
            });
        }
    
        if (window.location.pathname.endsWith('account.html')) {
            if (!isAuthenticated) {
                window.location.pathname = '/';
                return;
            }

            const user = await auth0Client.getUser();
            
            document.getElementById('loading-state').style.display = 'none';
            document.getElementById('account-view').style.display = 'block';
            document.getElementById('user-profile').innerHTML = `<h3>Welcome back!</h3><p><strong>Email:</strong> ${user.email}</p>`;
            document.getElementById('logout-button').addEventListener('click', logout);

            await fetchAndDisplayOrders();

            const settingsBtn = document.getElementById('settings-menu-btn');
            const settingsDropdown = document.getElementById('settings-dropdown-content');
            const changeEmailBtn = document.getElementById('change-email-btn');
            const passwordSection = document.getElementById('password-section');
            const deleteAccountBtn = document.getElementById('delete-account-btn');

            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsDropdown.classList.toggle('active');
            });
            window.addEventListener('click', () => {
                if (settingsDropdown.classList.contains('active')) {
                    settingsDropdown.classList.remove('active');
                }
            });

            const isPasswordUser = user.sub.startsWith('auth0|');
            if (isPasswordUser) {
                changeEmailBtn.style.display = 'block';
                passwordSection.style.display = 'block';
            } else {
                changeEmailBtn.style.display = 'none';
                passwordSection.style.display = 'none';
            }

            async function handleUserAction(action, payload) {
                try {
                    const response = await fetch('/.netlify/functions/manage-user', {
                        method: 'POST',
                        body: JSON.stringify({ action, userId: user.sub, ...payload })
                    });
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || 'Something went wrong.');
                    }
                    return await response.json();
                } catch (error) {
                    console.error(`Error with action '${action}':`, error);
                    alert(`Error: ${error.message}`);
                    return null;
                }
            }

            changeEmailBtn.addEventListener('click', async () => {
                const newEmail = prompt('Please enter your new email address:');
                if (newEmail) {
                    const result = await handleUserAction('changeEmail', { newEmail });
                    if (result) {
                        alert('Please check your inbox to verify your new email. The confirmation link should arrive within the next 5 minutes.');
                        document.querySelector('#user-profile p').innerHTML = `<strong>Email:</strong> ${newEmail}`;
                    }
                }
            });

            document.getElementById('reset-btn').addEventListener('click', async () => {
                const result = await handleUserAction('changePassword');
                if (result) {
                    alert('A password reset link has been sent to your email. Please allow up to 5 minutes for the email to arrive.');
                }
            });

            deleteAccountBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete your account? This action is permanent.')) {
                    const result = await handleUserAction('deleteAccount');
                    if (result) {
                        alert('Your account has been deleted.');
                        logout();
                    }
                }
            });
        }
    };

    // Main initialization flow
    window.addEventListener('load', async () => {
        await configureClient();
        if (!auth0Client) {
            console.error("Auth0 client failed to initialize.");
            return;
        };

        const query = window.location.search;
        if (query.includes('code=') && query.includes('state=')) {
            try {
                await auth0Client.handleRedirectCallback();
                window.history.replaceState({}, document.title, '/account.html');
            } catch(e) {
                console.error("Error handling redirect callback:", e);
            }
        }
        await updateUI();
    });

    // --- MODIFIED CONTACT FORM SUBMISSION HANDLER --- //
    const handleContactFormSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        // Create a URLSearchParams object to properly encode the data.
        const urlEncodedData = new URLSearchParams(formData);
        // Netlify's AJAX form submission requires the 'form-name' field to be sent.
        // The value must match the 'name' attribute of your HTML form tag.
        urlEncodedData.append('form-name', form.getAttribute('name'));

        try {
            const response = await fetch("/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: urlEncodedData.toString(),
            });

            if (response.ok) {
                document.getElementById('contact-form').style.display = 'none';
                document.getElementById('form-success-message').style.display = 'block';
            } else {
                throw new Error(`Form submission failed. Status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Sorry, there was an error sending your message. Please try again later.");
        }
    };

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener("submit", handleContactFormSubmit);
    }
// --- NEWSLETTER POPUP LOGIC --- //
    const modal = document.getElementById('newsletterModal');
    const closeModal = document.querySelector('.close-modal');

    // Show popup after 6 seconds ONLY if user hasn't seen it
    if (modal && !localStorage.getItem('simpleValleyPopupShown')) {
        setTimeout(() => {
            modal.style.display = 'block';
        }, 6000); 
    }

    // Close Button Logic
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            localStorage.setItem('simpleValleyPopupShown', 'true'); // Remember they closed it
        });
    }

    // Close if clicking outside the box
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
            localStorage.setItem('simpleValleyPopupShown', 'true');
        }
    });

});

