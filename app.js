let cart = JSON.parse(localStorage.getItem('cart_esquina')) || [];
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElement = document.getElementById('cart-count');
const cartTotalElement = document.getElementById('cart-total');
const btnWhatsApp = document.getElementById('btn-whatsapp');
const btnEmpty = document.getElementById('btn-empty');

window.onload = () => {
    saveAndRenderCart();
    initCarousel();
};

/* ── TABS ── */
function openTab(evt, tabName) {
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

/* ── CART ── */
function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

function addToCart(id, name, price) {
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.quantity += 1; }
    else { cart.push({ id, name, price, quantity: 1 }); }
    saveAndRenderCart();
    if (!cartSidebar.classList.contains('active')) toggleCart();
}

function updateQuantity(id, change) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx > -1) {
        cart[idx].quantity += change;
        if (cart[idx].quantity <= 0) cart.splice(idx, 1);
    }
    saveAndRenderCart();
}

function emptyCart() {
    if (confirm('¿Desea vaciar el carrito?')) {
        cart = [];
        document.getElementById('client-name').value = '';
        document.getElementById('delivery-method').value = '';
        document.getElementById('location-details').value = '';
        saveAndRenderCart();
    }
}

function saveAndRenderCart() {
    localStorage.setItem('cart_esquina', JSON.stringify(cart));
    cartItemsContainer.innerHTML = '';
    let total = 0, totalItems = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align:center;padding:40px;color:var(--text-muted);">
                <p style="font-size:3rem;margin-bottom:10px;">🍲</p>
                <p style="font-family:'Playfair Display',serif;font-size:1.1rem;">Tu carrito está vacío</p>
                <p style="font-size:0.85rem;margin-top:5px;">¡Agrega algo delicioso!</p>
            </div>`;
        btnWhatsApp.disabled = true;
        btnWhatsApp.style.opacity = '0.5';
        btnEmpty.style.display = 'none';
    } else {
        btnWhatsApp.disabled = false;
        btnWhatsApp.style.opacity = '1';
        btnEmpty.style.display = 'block';

        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            totalItems += item.quantity;
            cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-controls">
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        </div>
                        <div class="item-price">$${subtotal.toFixed(2)}</div>
                    </div>
                </div>`;
        });
    }
    cartCountElement.innerText = totalItems;
    cartTotalElement.innerText = `$${total.toFixed(2)}`;
}

async function sendWhatsApp() {
    const clientName = document.getElementById('client-name').value;
    const deliveryMethod = document.getElementById('delivery-method').value;
    const locationDetails = document.getElementById('location-details').value;
    const paymentMethod = document.getElementById('payment-method').value;

    if (cart.length === 0 || !clientName || !deliveryMethod) {
        alert('Por favor completa tu nombre y el método de entrega.');
        return;
    }

    const totalOrder = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    const orderData = {
        id_pedido: Date.now(),
        fecha: new Date().toLocaleString(),
        cliente: clientName,
        items: cart.map(item => `${item.quantity}x ${item.name}`).join(', '),
        total: totalOrder,
        metodo_entrega: deliveryMethod,
        pago: paymentMethod,
        notas: locationDetails
    };

    try {
        await fetch('https://sheetdb.io/api/v1/5r8sg0dmxgzp0', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [orderData] })
        });
    } catch (error) {
        console.error('Error al registrar en Sheets:', error);
    }

    const phone = '50370483939';
    let messageText = `NUEVO PEDIDO: LA ESQUINA DEL SABOR\n\n`;
    messageText += `Cliente: ${clientName}\n`;
    messageText += `Modalidad: ${deliveryMethod}\n\n`;
    cart.forEach(item => {
        messageText += `• ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    messageText += `\nTOTAL: $${totalOrder}\n`;
    messageText += `Pago: ${paymentMethod}\n`;
    if (locationDetails) messageText += `Notas: ${locationDetails}\n`;
    messageText += '\n¡Gracias por preferir La Esquina del Sabor!';

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`, '_blank');
}

/* ── CAROUSEL ── */
let carouselIndex = 0;
let carouselTotal = 0;

function initCarousel() {
    const track = document.getElementById('carousel-track');
    const dotsContainer = document.getElementById('carousel-dots');
    if (!track) return;

    carouselTotal = track.children.length;
    dotsContainer.innerHTML = '';

    for (let i = 0; i < carouselTotal; i++) {
        const dot = document.createElement('button');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Ir a promoción ${i + 1}`);
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
    }

    setInterval(() => moveCarousel(1), 5000);
}

function moveCarousel(dir) {
    carouselIndex = (carouselIndex + dir + carouselTotal) % carouselTotal;
    updateCarousel();
}

function goToSlide(index) {
    carouselIndex = index;
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('carousel-track');
    const cardWidth = track.children[0].offsetWidth + 22;
    track.style.transform = `translateX(-${carouselIndex * cardWidth}px)`;
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === carouselIndex));
}