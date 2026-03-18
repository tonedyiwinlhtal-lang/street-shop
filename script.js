const SHEETDB_URL = "https://sheetdb.io/api/v1/m2gchc577difz";
const BOT_TOKEN = "8526807871:AAGuFjDoVdNM04TnzUhxzdEAOG01VOb3j7U";
const CHAT_ID = "6972208496";

let allProducts = [];
let cart = [];

// Load Everything
async function loadStore() {
    try {
        const [pRes, rRes] = await Promise.all([
            fetch(SHEETDB_URL + "?sheet=inventory"),
            fetch(SHEETDB_URL + "?sheet=reviews sheet")
        ]);
        allProducts = await pRes.json();
        renderProducts(allProducts);
        renderReviews(await rRes.json());
    } catch (e) { console.log("Error loading data"); }
}

function renderProducts(products) {
    const grid = document.getElementById('shop');
    grid.innerHTML = products.map((p, idx) => {
        const colors = p.colors ? p.colors.split(',') : [];
        const cImgs = p.color_images ? p.color_images.split(',') : [];
        const id = p.name.replace(/\s+/g, '');
        
        return `
            <div class="card" style="animation: fadeInUp 0.5s ease forwards ${idx * 0.1}s">
                <img src="${p.image}" class="product-img" id="img-${id}">
                <h4 style="margin:12px 0 5px 0; font-size:14px;">${p.name}</h4>
                <div style="color:var(--accent); font-weight:700; margin-bottom:12px;">${p.price} MMK</div>
                
                <div class="color-selection">
                    ${colors.map((c, i) => `
                        <div class="dot" style="background:${c.trim()}" 
                             onclick="document.getElementById('img-${id}').src='${cImgs[i]?.trim()}'">
                        </div>
                    `).join('')}
                </div>
                
                <button class="premium-btn" style="padding:10px; font-size:12px;" 
                        onclick="addToCart('${p.name}', ${p.price})">
                    <i class="fa fa-plus"></i> ADD
                </button>
            </div>
        `;
    }).join('');
}

function addToCart(name, price) {
    cart.push({name, price});
    updateUI();
    // Simple feedback
    const btn = event.target;
    btn.innerText = "ADDED!";
    setTimeout(() => { btn.innerHTML = '<i class="fa fa-plus"></i> ADD'; }, 1000);
}

function updateUI() {
    document.getElementById('cartCount').innerText = cart.length;
    const total = cart.reduce((s, i) => s + i.price, 0);
    document.getElementById('cartTotal').innerText = total + " MMK";
    
    document.getElementById('cartItems').innerHTML = cart.map((item, index) => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:var(--glass); padding:10px; border-radius:10px;">
            <span style="font-size:13px;">${item.name}</span>
            <i class="fa fa-trash-can" style="color:#555; cursor:pointer;" onclick="removeItem(${index})"></i>
        </div>
    `).join('');
}

function removeItem(idx) {
    cart.splice(idx, 1);
    updateUI();
}

async function checkout() {
    if(cart.length === 0) return;
    const name = prompt("Your Name:");
    const phone = prompt("Your Phone:");
    if(!name || !phone) return;

    const orderID = "KOTS-" + Math.floor(Math.random() * 9000 + 1000);
    const orderData = {
        order_id: orderID,
        name, phone,
        item: cart.map(i => i.name).join(','),
        price: cart.reduce((s, i) => s + i.price, 0),
        status: "Pending",
        date: new Date().toLocaleString()
    };

    // Post to Sheet
    await fetch(SHEETDB_URL + "?sheet=order sheet", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({data: [orderData]})
    });

    // Telegram Alert
    const msg = `🔥 *NEW ORDER ARRIVED*\n\nID: ${orderID}\nCustomer: ${name}\nPhone: ${phone}\nItems: ${orderData.item}\nTotal: ${orderData.price} MMK`;
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}&parse_mode=Markdown`);

    alert("ORDER PLACED! ID: " + orderID);
    cart = []; updateUI(); toggleCart();
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('open');
}

function renderReviews(revs) {
    document.getElementById('reviewDisplay').innerHTML = revs.map(r => `
        <div class="review-card" style="background:var(--glass); padding:15px; border-radius:15px; min-width:200px; border:1px solid var(--border);">
            <div style="color:gold; font-size:10px; margin-bottom:5px;">${'★'.repeat(r.rating)}</div>
            <p style="font-size:12px; margin:0; color:#ccc;">"${r.comment}"</p>
            <small style="display:block; margin-top:10px; color:var(--accent); font-size:10px;">- ${r.name}</small>
        </div>
    `).reverse().join('');
}

async function checkStatus() {
    const p = prompt("Enter Phone Number:");
    const res = await fetch(`${SHEETDB_URL}/search?sheet=order sheet&phone=${p}`);
    const data = await res.json();
    if(data.length > 0) {
        alert(`Order ID: ${data[data.length-1].order_id}\nStatus: ${data[data.length-1].status}`);
    } else { alert("Not Found!"); }
}

loadStore();
