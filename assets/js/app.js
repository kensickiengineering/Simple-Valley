document.addEventListener('DOMContentLoaded', function() {

    // --- GLOBAL SITE-WIDE FUNCTIONS --- //

    // Set current year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Mobile Navigation Toggle
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (mobileNavToggle && mainNav) {
        mobileNavToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            mobileNavToggle.classList.toggle('open');
        });
    }
    
    // Scroll-reveal animations for elements with .fade-in class
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

        fadeInElements.forEach(element => {
            observer.observe(element);
        });
    }

    // --- ACCORDION LOGIC --- //
    const accordionItems = document.querySelectorAll('.accordion-item');
    if (accordionItems.length > 0) {
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            const content = item.querySelector('.accordion-content');
            if (header && content) {
                header.addEventListener('click', () => {
                    item.classList.toggle('active');
                    if (item.classList.contains('active')) {
                        content.style.maxHeight = content.scrollHeight + 'px';
                    } else {
                        content.style.maxHeight = null;
                    }
                });
            }
        });
        const firstActive = document.querySelector('.accordion-item.active');
        if(firstActive) {
            const firstContent = firstActive.querySelector('.accordion-content');
            if(firstContent) firstContent.style.maxHeight = firstContent.scrollHeight + 'px';
        }
    }

    // --- CART & E-COMMERCE LOGIC --- //

    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartBtns = document.querySelectorAll('.cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartBody = document.getElementById('cart-body');
    const checkoutButton = document.getElementById('checkout-button');
    // Note: The main Stripe object is no longer needed here for checkout,
    // but it might be useful for other Stripe features (Elements, etc.) later.
    const stripe = Stripe('pk_test_51SG2EuLSl1NSHnh07iR5vfFbDRUSJbsh53vqHyj0tUzGA0qDHy0IwziAsVNkH97Pp137lJB3u4kKGasoEji0LEVZ00fSiIlSsH'); 

    let cart = JSON.parse(localStorage.getItem('simpleProteinCart')) || [];

    // --- SELF-HEALING CART VALIDATION ---
    const isCartInvalid = cart.some(item => !item.priceId);
    if (isCartInvalid) {
        console.warn('Invalid cart data detected (missing priceId). Clearing cart.');
        cart = [];
        localStorage.removeItem('simpleProteinCart');
    }
    // --- END VALIDATION ---

    function saveCart() {
        localStorage.setItem('simpleProteinCart', JSON.stringify(cart));
    }

    if (cartSidebar && cartOverlay && closeCartBtn && cartBtns.length > 0) {
        function openCart() {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
        }

        function closeCart() {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
        }

        cartBtns.forEach(btn => btn.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        }));
        
        closeCartBtn.addEventListener('click', closeCart);
        cartOverlay.addEventListener('click', closeCart);
    }

    function updateCartUI() {
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) {
            const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
            cartCountEl.textContent = totalItems;
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
                            <div class="cart-item-img">
                                <img src="${item.image}" alt="${item.title}">
                            </div>
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
                        </div>
                    `;
                });
            }
        }
        
        const subtotalEl = document.getElementById('cart-subtotal');
        if (subtotalEl) {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        }

        if (checkoutButton) {
            checkoutButton.disabled = cart.length === 0;
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
                    if (confirm('Are you sure? The Simple Valley bar will be removed from your cart.')) {
                        cart.splice(productIndex, 1);
                    } else {
                        return;
                    }
                }
            } else if (action === 'remove') {
                if (confirm('Are you sure? The Simple Valley bar will be removed from your cart.')) {
                    cart.splice(productIndex, 1);
                } else {
                    return;
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
        if (mainImg && thumbs.length > 0) {
            thumbs.forEach(thumb => {
                thumb.addEventListener('click', function() {
                    thumbs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    mainImg.src = this.querySelector('img').src;
                });
            });
        }

        const decreaseQtyBtn = document.getElementById('decreaseQty');
        const increaseQtyBtn = document.getElementById('increaseQty');
        const quantityInput = document.getElementById('quantity');
        if (decreaseQtyBtn && increaseQtyBtn && quantityInput) {
            decreaseQtyBtn.addEventListener('click', () => {
                let currentQty = parseInt(quantityInput.value);
                if (currentQty > 1) quantityInput.value = currentQty - 1;
            });
            increaseQtyBtn.addEventListener('click', () => {
                quantityInput.value = parseInt(quantityInput.value) + 1;
            });
        }

        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function() {
                const product = { 
                    id: 'prod_simple_bar_01',
                    title: 'The Simple Valley Bar', 
                    price: 39.99,
                    image: 'assets/img/SecondaryPic2.png',
                    priceId: 'price_1SG2SLLSl1NSHnh02hl0ySZi' 
                };
                const qty = parseInt(quantityInput.value) || 1;
                
                const existingProduct = cart.find(p => p.id === product.id);
                if (existingProduct) {
                    existingProduct.qty += qty;
                } else {
                    cart.push({ ...product, qty });
                }
                
                saveCart();
                updateCartUI();
                if (cartSidebar) openCart();

                this.textContent = 'Added! ✓';
                this.classList.add('added');
                this.disabled = true;

                setTimeout(() => {
                    this.textContent = 'Add to Cart';
                    this.classList.remove('added');
                    this.disabled = false;
                }, 2000);
            });
        }
    }
    
    // --- INGREDIENTS PAGE SPECIFIC --- //
    if (document.querySelector('.ingredients-grid')) {
        const ingredientCards = document.querySelectorAll('.ingredient-card');
        ingredientCards.forEach(card => {
            const header = card.querySelector('.ingredient-header');
            if (header) {
                header.addEventListener('click', () => {
                    card.classList.toggle('active');
                    const content = card.querySelector('.ingredient-desc');
                    if(content){
                        if(card.classList.contains('active')){
                           content.style.maxHeight = content.scrollHeight + 'px';
                        } else {
                           content.style.maxHeight = null;
                        }
                    }
                });
            }
        });
    }

    // --- STRIPE CHECKOUT LOGIC (FOR NETLIFY FUNCTIONS) --- //
    if (checkoutButton) {
      checkoutButton.addEventListener('click', function() {
        if (cart.length === 0) return;

        // Disable the button to prevent multiple clicks
        checkoutButton.disabled = true;
        checkoutButton.textContent = 'Processing...';

        // Call our Netlify Function.
        fetch('/.netlify/functions/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cart: cart }),
        })
        .then(res => {
          if (res.ok) return res.json();
          // If the server returns an error, show it to the user
          return res.json().then(json => Promise.reject(json));
        })
        .then(({ url }) => {
          // We received a checkout URL. Redirect the user to Stripe's page.
          window.location = url;
        })
        .catch(e => {
          console.error(e.error);
          alert('An error occurred during checkout. Please try again.');
          // Re-enable the button if the process fails
          checkoutButton.disabled = false;
          checkoutButton.textContent = 'Proceed to Checkout';
        });
      });
    }
// --- AUTH0 USER AUTHENTICATION LOGIC --- //

let auth0Client = null;

// Initialize Auth0 client
const configureClient = async () => {
  auth0Client = await auth0.createAuth0Client({
    domain: 'dev-y6t0um4ltxspelep.us.auth0.com',     // Your Auth0 domain
    clientId: 'IBrA9anQGfCPi3xxN9JSLWsaBQKrqYlz',    // Your Auth0 client ID
    authorizationParams: {
      redirect_uri: window.location.origin + '/account.html'
    }
  });
};

// Handle login
const login = async () => {
  await auth0Client.loginWithRedirect({
    authorizationParams: {
      redirect_uri: window.location.origin + '/account.html'
    }
  });
};

// Handle logout
const logout = async () => {
  await auth0Client.logout({
    logoutParams: {
      returnTo: window.location.origin
    }
  });
};

// Update navigation & account UI
const updateUI = async () => {
  const isAuthenticated = await auth0Client.isAuthenticated();
  const accountLink = document.getElementById('account-link');

  if (!accountLink) return;

  if (!isAuthenticated) {
    // Logged out: clicking the user icon triggers login
    accountLink.onclick = (e) => {
      e.preventDefault();
      login();
    };
  } else {
    // Logged in: clicking the icon goes to the account page
    accountLink.onclick = null;
    accountLink.href = '/account.html';
  }

  // If we're on account.html, show profile info
  if (window.location.pathname.endsWith('account.html') && isAuthenticated) {
    const user = await auth0Client.getUser();
    const profileDiv = document.getElementById('user-profile');
    if (profileDiv) {
      profileDiv.innerHTML = `
        <h3>Welcome back!</h3>
        <p><strong>Email:</strong> ${user.email}</p>
        <p>Your details will be pre-filled for checkout.</p>
      `;
    }

    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('account-view').style.display = 'block';

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) logoutButton.onclick = logout;
  }
};

// Main flow
window.addEventListener('load', async () => {
  await configureClient();

  // Handle redirect after Auth0 login
  const query = window.location.search;
  if (query.includes('code=') && query.includes('state=')) {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, '/account.html');
  }

  updateUI();
});

});