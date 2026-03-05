const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const menuIcon = document.getElementById("menuIcon");
const mobileSkincareBtn = document.getElementById("mobileSkincareBtn");
const mobileDrop = document.getElementById("mobileDrop");

let menuOpen = false;

menuToggle.addEventListener("click", () => {

  menuOpen = !menuOpen;

  if (menuOpen) {
    mobileMenu.classList.add("active");
    menuIcon.classList.remove("fa-bars");
    menuIcon.classList.add("fa-times");
  } else {
    mobileMenu.classList.remove("active");
    menuIcon.classList.remove("fa-times");
    menuIcon.classList.add("fa-bars");
  }

});

mobileSkincareBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  mobileDrop.style.display =
    mobileDrop.style.display === "block" ? "none" : "block";
});


let allProductsData = []; 
let filteredData = []; 
let currentPage = 1;
const rowsPerPage = 8; 
const API_URL = 'https://calesta-beauty-server.vercel.app/api'; 

async function initStore() {
    try {
        const response = await fetch(`${API_URL}/products?limit=100`);
        const result = await response.json();
        
        if (result.success) {
            allProductsData = result.data;
            filteredData = [...allProductsData]; 

          
            render(allProductsData.filter(p => p.isBestseller).slice(0, 4), 'bestseller-grid');
            render(allProductsData.filter(p => p.isNew).slice(0, 4), 'new-arrival-grid');
            
            // ২. Shop Page Logic
            if (document.getElementById('all-product-grid')) {
                updateDisplay(); 
            }

            // ৩. Details Page Logic
            if (window.location.pathname.includes('product-details.html')) {
                loadProductDetails();
            }
        }
    } catch (error) {
        console.error("Backend API error:", error);
    }
}

// ২. Pagination and Render Coordinator
function updateDisplay() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = filteredData.slice(start, end);

    render(paginatedItems, 'all-product-grid');
    setupPagination(filteredData.length);
}



function render(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = `<p class="no-data">No products found.</p>`;
        return;
    }

    container.innerHTML = data.map(product => {
        const hasDiscount = product.regularPrice > product.salePrice;
        return `
        <div class="product-card" onclick="goToDetails('${product._id}')">
            <div class="img-box">
                <img src="${product.thumbnail}" alt="${product.name}">
                <button class="add-cart" onclick="addToCart(event, '${product._id}')">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
            </div>
            <div class="product-info">
                <small>${product.categoryID?.name || 'Skincare'}</small>
                <h3>${product.name}</h3>
                <p class="tagline">${product.straight_up || ''}</p>
                <p class="price">
                    <span class="sale-price">$${product.salePrice}</span>
                    ${hasDiscount ? `<span class="reg-price" style="text-decoration: line-through; font-size: 12px; color: #888; margin-left: 5px;">$${product.regularPrice}</span>` : ''}
                </p>
            </div>
        </div>`;
    }).join('');
}
// ৪. Pagination UI Setup
function setupPagination(totalItems) {
    const paginationEl = document.getElementById('pagination-controls');
    if (!paginationEl) return;

    const pageCount = Math.ceil(totalItems / rowsPerPage);
    let btnHtml = '';

    // Previous Arrow
    btnHtml += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fa fa-chevron-left"></i></button>`;

    // Page Numbers
    for (let i = 1; i <= pageCount; i++) {
        btnHtml += `<button class="${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    // Next Arrow
    btnHtml += `<button onclick="changePage(${currentPage + 1})" ${currentPage === pageCount ? 'disabled' : ''}><i class="fa fa-chevron-right"></i></button>`;

    paginationEl.innerHTML = btnHtml;
}

window.changePage = (page) => {
    currentPage = page;
    updateDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ৫. Category Filter
window.filterByTab = (element, category) => {
    document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
    element.classList.add('active');

    const categoryLower = category.toLowerCase();
    filteredData = (categoryLower === 'all') 
        ? allProductsData 
        : allProductsData.filter(p => p.categoryID?.name.toLowerCase().includes(categoryLower));
    
    currentPage = 1; 
    updateDisplay();
};

window.goToDetails = (id) => { window.location.href = `product-details.html?id=${id}`; };
window.addToCart = (event, id) => { event.stopPropagation(); alert("Added ID: " + id); };

initStore();





async function loadProductDetails() {
    try {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id'); 
        if (!productId) return;
        fetchReviews(productId);

        const response = await fetch(`${API_URL}/product/${productId}`);
        const result = await response.json();

        if (result.success && result.data) {
            const product = result.data;

            // Name & Tagline
            document.getElementById('product-name').innerText = product.name;
            const taglineEl = document.getElementById('product-tagline');
            if(taglineEl) taglineEl.innerText = product.straight_up;

            // Price Logic
            const priceEl = document.querySelector('.price-section .price');
            const decimalEl = document.querySelector('.price-section .decimal');
            const oldPriceEl = document.getElementById('old-price'); 

            if (priceEl && decimalEl) {
                const [main, decimal] = product.salePrice.toFixed(2).split('.');
                priceEl.innerText = main;
                decimalEl.innerText = decimal;
            }
            if (oldPriceEl && product.regularPrice > product.salePrice) {
                oldPriceEl.innerText = `$${product.regularPrice}`;
                oldPriceEl.style.display = 'inline';
            }

            // Description & Lowdown (Bullet Points)
            const detailsBox = document.querySelector('.details-content');
            if (detailsBox) {
                let lowdownHtml = '';
                if(product.lowdown && Array.isArray(product.lowdown)) {
                    lowdownHtml = `<ul class="lowdown-list" style="margin-top:20px; list-style:none; padding:0;">
                        ${product.lowdown.map(point => `<li style="margin-bottom:10px;"><i class="fa-solid fa-circle-check" style="color:#2ecc71; margin-right:8px;"></i> ${point}</li>`).join('')}
                    </ul>`;
                }
                
                detailsBox.innerHTML = `
                    <div class="product-info-block">
                        <h3 style="margin-bottom:15px;">The Lowdown</h3>
                        <p class="description-text" style="line-height:1.6; color:#555;">${product.description}</p>
                        ${lowdownHtml}
                    </div>
                `;
            }

            // Gallery Logic
            const featuredImg = document.getElementById('featured-image');
            if (featuredImg) featuredImg.src = product.thumbnail;

            const thumbContainer = document.querySelector('.thumbnails');
            if (thumbContainer) {
                const gallery = Array.isArray(product.images) ? product.images : [];
                // link er extra space trim kora hoyeche
                const allImgs = [product.thumbnail, ...gallery].map(img => img.trim());

                thumbContainer.innerHTML = allImgs.map((img, index) => `
                        <div class="thumb-wrapper ${index === 0 ? 'active' : ''}" onclick="changeImage(this)">
                            <img src="${img}" alt="view ${index + 1}">
                        </div>
                    `).join('');
            }
        }
    } catch (error) {
        console.error("Error loading product details:", error);
    }
}
loadProductDetails();


// Thumbnails click function
function changeImage(element) {
    // 1. Main image change kora
    const newSrc = element.querySelector('img').src;
    document.getElementById('featured-image').src = newSrc;
    
    // 2. Active class shift kora
    document.querySelectorAll('.thumb-wrapper').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
}
// Quantity update function
window.updateQty = (val) => {
    const qtyInput = document.getElementById('qty');
    let current = parseInt(qtyInput.value);
    if (current + val >= 1) {
        qtyInput.value = current + val;
    }
};

window.goToDetails = (id) => { window.location.href = `product-details.html?id=${id}`; };
// --- CART GLOBAL LOGIC ---

// ১. Add to Cart Function
window.addToCart = (event, id) => {
    event.stopPropagation();
    
    // global data theke product-ti khuje ber kora
    const product = allProductsData.find(p => p._id === id);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingIndex = cart.findIndex(item => item._id === id);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    alert(`${product.name} added to cart!`);
};

// --- DETAILS PAGE CART LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    const detailsAddBtn = document.getElementById('details-add-btn');
    
    if (detailsAddBtn) {
        detailsAddBtn.addEventListener('click', () => {
            // ১. URL theke Product ID neya (Jodi URL e ?id=... thake)
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id'); 
            
            // ২. Quantity input theke value neya
            const qtyInput = document.getElementById('qty');
            const quantity = parseInt(qtyInput.value) || 1;

            if (productId) {
                addToCartFromDetails(productId, quantity);
            } else {
                console.error("Product ID not found in URL");
            }
        });
    }
});

// ৩. Details page theke add korar custom function
function addToCartFromDetails(id, quantity) {
    // allProductsData theke product khuje ber kora
    const product = allProductsData.find(p => p._id === id);
    if (!product) {
        alert("Product data not loaded yet!");
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = cart.findIndex(item => item._id === id);

    if (existingIndex > -1) {
        // Jodi agei thake, tobe input-er quantity jog hobe
        cart[existingIndex].quantity += quantity;
    } else {
        // Notun hole quantity set hobe
        cart.push({ ...product, quantity: quantity });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    alert(`${quantity} ${product.name} added to cart!`);
}

// Quantity +/- update function (Jodi age na thake)
window.updateQty = (change) => {
    const qtyInput = document.getElementById('qty');
    let currentQty = parseInt(qtyInput.value) || 1;
    currentQty += change;
    if (currentQty < 1) currentQty = 1;
    qtyInput.value = currentQty;
};

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.length;
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;
}

// ৩. Cart Page-e data render kora
function renderCartPage() {
    const cartItemsList = document.querySelector('.cart-items-list');
    if (!cartItemsList) return; // Jodi amra cart page-e na thaki

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = `<h3>Your cart is empty</h3><button class="continue-btn" onclick="window.location.href='products.html'">Shop Now</button>`;
        updateSummary(0);
        return;
    }

    let cartHtml = cart.map(item => `
        <div class="cart-item">
            <div class="item-img">
                <img src="${item.thumbnail}" alt="${item.name}">
            </div>
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="qty-text">Quantity: ${item.quantity}</p>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="changeQty('${item._id}', 1)"><i class="fa-solid fa-plus"></i></button>
                    <span class="qty-num">${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQty('${item._id}', -1)"><i class="fa-solid fa-minus"></i></button>
                </div>
            </div>
            <div class="item-price-action">
                <span class="price">$${(item.salePrice * item.quantity).toFixed(2)}</span>
                <button class="delete-btn" onclick="removeFromCart('${item._id}')"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        </div>
    `).join('');

    cartHtml += `<button class="continue-btn" onclick="window.location.href='products.html'">Continue Shopping</button>`;
    cartItemsList.innerHTML = cartHtml;

    const subtotal = cart.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
    updateSummary(subtotal);
}

// ৪. Quantity change logic
window.changeQty = (id, delta) => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const index = cart.findIndex(item => item._id === id);

    if (index > -1) {
        cart[index].quantity += delta;
        if (cart[index].quantity < 1) {
            cart.splice(index, 1); // Quantity 1 er niche gele delete
        }
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartPage();
    updateCartBadge();
};

// ৫. Remove from cart
window.removeFromCart = (id) => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item._id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartPage();
    updateCartBadge();
};

// ৬. Order Summary update
function updateSummary(subtotal) {
    const shipping = subtotal > 0 ? 5.99 : 0;
    const total = subtotal + shipping;

    const summaryBox = document.querySelector('.summary-box');
    if (summaryBox) {
        summaryBox.innerHTML = `
            <h2>Order Summary</h2>
            <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
            <div class="summary-row"><span>Shipping</span><span>$${shipping.toFixed(2)}</span></div>
            <hr class="summary-divider">
            <div class="summary-row total-row"><span>Total</span><span>$${total.toFixed(2)}</span></div>
            <div class="promo-section">
                <input type="text" placeholder="Promo Code" class="promo-input">
                <button class="apply-btn">Apply</button>
            </div>
            <button class="checkout-btn">Proceed to Checkout</button>
        `;
    }
}

// Initial Call
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    if (document.querySelector('.shopping-cart-container')) {
        renderCartPage();
    }
});


document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('checkout-btn')) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length > 0) {
            window.location.href = 'checkout.html';
        } else {
            alert("Your cart is empty!");
        }
    }
});


function renderCheckoutPage() {
    const orderSummaryCard = document.querySelector('.order-summary-card');
    if (!orderSummaryCard) return; // Check if we are on checkout page

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Shipping cost logic based on selection (default 5.99)
    let shippingCost = 5.99; 
    const subtotal = cart.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
    
    // Render Items
    let itemsHtml = `<h2>Order Summary</h2>`;
    
    cart.forEach(item => {
        itemsHtml += `
            <div class="summary-item">
                <img src="${item.thumbnail}" alt="${item.name}">
                <div class="summary-info">
                    <h4>${item.name}</h4>
                    <p>Quantity: ${item.quantity}</p>
                </div>
                <span class="summary-price">$${(item.salePrice * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });

    // Subtotal and Total Calculation
    const total = subtotal + shippingCost;

    itemsHtml += `
        <hr class="summary-line">
        <div class="summary-detail">
            <span>Subtotal</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-detail">
            <span>Shipping</span>
            <span>$${shippingCost.toFixed(2)}</span>
        </div>
        <hr class="summary-line">
        <div class="summary-detail total-checkout">
            <span>Total</span>
            <span id="final-total">$${total.toFixed(2)}</span>
        </div>
    `;

    orderSummaryCard.innerHTML = itemsHtml;
}

// Global initialization update
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    
    // Cart page render
    if (document.querySelector('.shopping-cart-container')) {
        renderCartPage();
    }
    
    // Checkout page render
    if (document.querySelector('.checkout-section')) {
        renderCheckoutPage();
    }
});




// --- CHECKOUT PROCESS ---

const placeOrderBtn = document.getElementById('placeOrderBtn');

if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', async () => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const form = document.getElementById('checkoutForm');
        
        // ১. Cart empty kina check
        if (cart.length === 0) {
            alert("Your cart is empty! Please add products first.");
            return;
        }

        // ২. Form Validation (HTML5 validation triggers)
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // ৩. Form data collect
        const formData = new FormData(form);
        const customerData = Object.fromEntries(formData.entries());

        // ৪. Payload toiri (Product ID সহ)
        const subtotal = cart.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
        const shippingFee = parseFloat(customerData.shipping) || 5.99;

        const orderPayload = {
            customerInfo: {
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                email: customerData.email,
                phone: customerData.phone,
                address: customerData.address,
                city: customerData.city,
                state: customerData.state,
                zipCode: customerData.zipCode
            },
            items: cart.map(item => ({
                productID: item._id, // Ekhane ID thikmoto jachche
                name: item.name,
                price: item.salePrice,
                quantity: item.quantity
            })),
            shippingFee: shippingFee,
            totalAmount: subtotal + shippingFee
        };

        // ৫. Backend API Call
        try {
            placeOrderBtn.innerText = "Processing...";
            placeOrderBtn.disabled = true;

            const response = await fetch(`${API_URL}/payment/create-checkout-session`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(orderPayload)
            });

            const result = await response.json();

            if (result.success && result.url) {
                // SSLCommerz Payment Page-e niye jabe
                window.location.href = result.url;
            } else {
                alert("Error: " + (result.message || "Failed to initiate payment"));
                placeOrderBtn.innerText = "Proceed to Payment";
                placeOrderBtn.disabled = false;
            }
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Could not connect to server. Check if backend is running.");
            placeOrderBtn.innerText = "Proceed to Payment";
            placeOrderBtn.disabled = false;
        }
    });
}

// Shipping price update hole Total change kora
document.addEventListener('change', (e) => {
    if (e.target.name === 'shipping') {
        renderCheckoutPage(); // Ager render function call hobe dynamic total er jonno
    }
});

// Related Products render
function loadRelatedProducts(allProducts, category, currentId) {
    const relatedGrid = document.getElementById('related-grid');
    if(!relatedGrid) return;

    const related = allProducts
        .filter(p => p.category.toLowerCase() === category.toLowerCase() && p.id !== currentId)
        .slice(0, 4);

    relatedGrid.innerHTML = related.map(p => `
        <div class="product-card" onclick="location.href='product-details.html?id=${p.id}'">
            <div class="img-box">
                <img src="${p.image[0]}" alt="${p.name}">
            </div>
            <div class="product-info">
                <small>${p.category}</small>
                <h3>${p.name}</h3>
                <p class="price">$${p.price}</p>
                <div class="rating">${p.rating} ★</div>
            </div>
        </div>
    `).join('');
}





function renderRatingsAndReviews(reviews, totalCount, avgRating) {
    const reviewsContainer = document.getElementById('dynamic-reviews-container');
    const statStars = document.getElementById('stat-stars');
    const statCount = document.getElementById('stat-count');

    // Stats update
    if (statStars) {
        statStars.innerHTML = Array(5).fill(0).map((_, i) => 
            i < Math.round(avgRating) ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>'
        ).join('');
    }
    if (statCount) statCount.innerText = `${totalCount} Reviews`;
    console.log(reviews)

    // Reviews list update
    if (reviewsContainer) {
        if (!reviews || reviews.length === 0) {
            reviewsContainer.innerHTML = "<p>No reviews yet. Be the first!</p>";
            return;
        }

        reviewsContainer.innerHTML = reviews.map(rev => `
            <div class="review-item">
                <div class="review-header">
                   <div>
                    <img src="${rev.userID?.profileImage || 'images/default-user.jpg'}" class="user-avatar">
                   </div>
                    <div class="user-info">
                        <div class="review-stars-individual">
                            ${Array(5).fill(0).map((_, i) => i < rev.rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>').join('')}
                        </div>
                        <p class="review-comment">"${rev.comment}"</p>
                        <div class="review-meta">
                            <span class="user-name">${rev.userID?.name || 'Verified Buyer'}</span>
                            <span class="review-date">${new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}





// ১. Form Render kora (Button-e click korle)
// ১. Form Toggle ebong selected rating variable
let selectedRating = 0;

const openReviewBtn = document.getElementById('open-review-btn');
if (openReviewBtn) {
    openReviewBtn.addEventListener('click', function() {
        const formContainer = document.getElementById('review-form-container');
        formContainer.classList.toggle('hidden');
    });
}

// ২. Rating Set korar function (Button active state shoho)
window.setRating = (n) => {
    selectedRating = n;
    // Sob rating button theke 'active' class remove kora
    document.querySelectorAll('.rate-btn').forEach(btn => btn.classList.remove('active'));
    // Clicked button-e 'active' class add kora
    document.querySelector(`.rate-btn[data-val="${n}"]`).classList.add('active');
};

// ৩. Review Submit Logic
window.submitReview = async () => {
    const commentInput = document.getElementById('review-comment');
    const urlParams = new URLSearchParams(window.location.search);
    const productID = urlParams.get('id');
    
    // LocalStorage theke user dhora (Login-er somoy jeta save korechilen)
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user._id) {
        alert("Please login to submit a review!");
        return;
    }

    if (commentInput.value.trim() && selectedRating > 0 && productID) {
        const reviewData = {
            productID: productID,
            userID: user._id, // Backend model onujayi
            rating: selectedRating,
            comment: commentInput.value.trim()
        };

        try {
            const response = await fetch(`${API_URL}/reviews/add-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });

            const result = await response.json();

            if (result.success) {
                alert("Review submitted successfully!");
                
                // Form clear & hide
                commentInput.value = '';
                selectedRating = 0;
                document.querySelectorAll('.rate-btn').forEach(btn => btn.classList.remove('active'));
                document.getElementById('review-form-container').classList.add('hidden');

                // Page reload na kore reviews list refresh kora
                fetchReviews(productID); 
            }
        } catch (error) {
            console.error("Review Error:", error);
            alert("Failed to post review.");
        }
    } else {
        alert("Please select a rating and write a comment.");
    }
};


async function fetchReviews(productId) {
    try {
        const response = await fetch(`${API_URL}/reviews/get-reviews/${productId}`);
        const reviews = await response.json();
        
        // Product statistics calculate kora
        const totalCount = reviews.length;
        const avgRating = totalCount > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
            : 0;

        // Render function call kora
        renderRatingsAndReviews(reviews, totalCount, avgRating);
    } catch (error) {
        console.error("Fetch Reviews Error:", error);
    }
}

async function loadCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`); 
    const result = await response.json();
    
    if (result.success) {
      const categories = result.data; 
      console.log("Loaded Categories:", categories);
      
      const catGrid = document.getElementById('category-grid');
      if (!catGrid) return; 

      catGrid.innerHTML = ""; 

    
      categories.forEach(cat => {
        catGrid.innerHTML += `
          <div class="cat-card" onclick="filterByCategory('${cat._id}')">
            <div class="cat-img">
                <img src="${cat.image}" alt="${cat.name}">
            </div>
            <h3>${cat.name}</h3>
          </div>
        `;
      });
    } else {
      console.error("API Error:", result.message);
    }
  } catch (error) {
    console.error("Category load korte somossa:", error);
  }
}

loadCategories();

let currentSlide = 0;

async function loadTestimonials() {
    try {
        const res = await fetch('testimonials.json');
        const data = await res.json();
        const container = document.getElementById('testimonial-grid');
        const dotsContainer = document.getElementById('slider-dots');

        // Render Cards
        container.innerHTML = data.map(t => {
            let stars = '<i class="fa fa-star"></i>'.repeat(t.rating);
            return `
                <div class="testi-card">
                    <div class="testi-img"><img src="${t.image}" alt="${t.name}"></div>
                    <div class="testi-info">
                        <div class="stars">${stars}</div>
                        <p>${t.text}</p>
                        <h4>${t.name}</h4>
                    </div>
                </div>`;
        }).join('');

        // Dots Generation: Prottek slide-e 2ti card thakle slide hobe (Total/2) ti
        const totalSlides = window.innerWidth > 992 ? Math.ceil(data.length / 2) : data.length;
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            dotsContainer.innerHTML += `<span class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`;
        }
    } catch (e) { console.log(e); }
}

function goToSlide(index) {
    const wrapper = document.getElementById('testimonial-grid');
    const dots = document.querySelectorAll('.dot');
    
    // Desktop e 100% slide mane 2ti card shift kora
    const movePercentage = window.innerWidth > 992 ? index * 103 : index * 100;
    wrapper.style.transform = `translateX(-${movePercentage}%)`;

    dots.forEach(d => d.classList.remove('active'));
    dots[index].classList.add('active');
    currentSlide = index;
}

loadTestimonials();

// Resize hole dots thik korar jonno
window.addEventListener('resize', loadTestimonials);






const profileMenu = document.getElementById('profileMenu');
const profileIcon = document.getElementById('profileIcon');

if (profileIcon) {
    profileIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        updateProfileDropdown(); 
        profileMenu.classList.toggle('show');
    });
}

function updateProfileDropdown() {
    const user = JSON.parse(localStorage.getItem('user')); 

    if (user) {
        profileMenu.innerHTML = `
            <a href="account.html">My Account</a>
            <a href="orders.html">Order History</a>
            <hr>
            <a href="#" class="logout-link" onclick="handleLogout(event)">Log Out</a>
        `;
    } else {
        profileMenu.innerHTML = `
            <a href="signin.html">Sign In</a>
            <hr>
            <a href="signup.html">Sign Up</a>
        `;
    }
}

window.handleLogout = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('https://calesta-beauty-server.vercel.app/api/auth/logout');
        const result = await response.json();

        if (result.success) {
            localStorage.removeItem('user'); 
            alert("Logged out successfully!");
            window.location.href = 'index.html'; 
        }
    } catch (error) {
        console.error("Logout Error:", error);
    }
};

// ৪. Window click e dropdown bondho kora
window.addEventListener('click', (e) => {
    if (profileMenu && !profileMenu.contains(e.target) && e.target !== profileIcon) {
        profileMenu.classList.remove('show');
    }
});

// ৩. Sign In / Sign Up Form Logic (Jodi login page-e thake)

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const submitBtn = loginForm.querySelector('.auth-btn');

        submitBtn.innerText = 'Signing In...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('https://calesta-beauty-server.vercel.app/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                // User data local storage-e rakha jate profile-e name dekhano jay
                localStorage.setItem('user', JSON.stringify(result.data));
                alert('Welcome back, ' + result.data.name);
                window.location.href = 'index.html'; 
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Could not connect to server.");
        } finally {
            submitBtn.innerText = 'Sign In';
            submitBtn.disabled = false;
        }
    });
}








// sign up



const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const imageFile = document.getElementById('profileImage')?.files[0]; // Image jodi thake

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const submitBtn = signupForm.querySelector('.auth-btn');
        submitBtn.innerText = 'Creating Account...';
        submitBtn.disabled = true;

        // Backend-e file pathanor jonno FormData use korte hobe
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        if (imageFile) formData.append('image', imageFile);

        try {
            const response = await fetch('https://calesta-beauty-server.vercel.app/api/auth/register', {
                method: 'POST',
                // FormData use korle headers-e 'Content-Type' manually dewa lage na
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                alert('Success: ' + result.message);
                window.location.href = 'signin.html';
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('API Error:', error);
            alert('Server connection failed.');
        } finally {
            submitBtn.innerText = 'Sign Up';
            submitBtn.disabled = false;
        }
    });
}




