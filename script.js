const SHEETDB_URL = "https://sheetdb.io/api/v1/udrb2kova8ql6;
const BOT_TOKEN = "8526807871:AAGuFjDoVdNM04TnzUhxzdEAOG01VOb3j7U";
const CHAT_ID = "6972208496";

let allProducts = [];
let cart = [];

async function loadData() {
    const [prodRes, revRes] = await Promise.all([
        fetch(SHEETDB_URL + "?sheet=inventory"),
        fetch(SHEETDB_URL + "?sheet=reviews sheet")
    ]);
    allProducts = await prodRes.json();
    renderProducts(allProducts);
    renderReviews(await revRes.json());
}

function renderProducts(products) {
    const grid = document.getElementById('shop');
    grid.innerHTML = products.map(p => {
        const colors = p.colors ? p.colors.split(',') : [];
        const colorImgs = p.color_images ? p.color_images.split(',') : [];

        return `
            <div class="card">
                <img src="${p.image}" class="product-img" id="img-${p.name.replace(/\s+/g, '')}">
                <h4>${p.name}</h4>
                <div style="color:red;">${p.price} MMK</div>
                
                <div class="color-selection">
                    ${colors.map((c, i) => `
                        <div class="color-dot" style="background:${c.trim()}" 
                             onclick="changeImg('${p.name.replace(/\s+/g, '')}', '${colorImgs[i]?.trim()}')">
                        </div>
                    `).join('')}
                </div>

                <button class="cat-btn" style="width:100%" onclick="addToCart('${p.name}', ${p.price})">Add to Cart</button>
            </div>
        `;
    }).join('');
}

function changeImg(id, url) {
    if(url) document.getElementById('img-' + id).src = url;
}

function addToCart(name, price) {
    cart.push({name, price});
    updateCart();
}

function updateCart() {
    document.getElementById('cartCount').innerText = cart.length;
    let total = cart.reduce((s, i) => s + i.price, 0);
    document.getElementById('cartItems').innerHTML = cart.map((i, idx) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span>${i.name}</span>
            <i class="fa fa-trash" onclick="cart.splice(${idx},1);updateCart();"></i>
        </div>`).join('');
    document.getElementById('cartTotal').innerText = `Total: ${total} MMK`;
}

async function checkout() {
    const name = prompt("Name:");
    const phone = prompt("Phone:");
    if(!name || !phone) return;

    const orderID = "KOTS-" + Math.floor(Math.random()*1000);
    const orderData = {
        order_id: orderID,
        name, phone,
        item: cart.map(i => i.name).join(','),
        price: cart.reduce((s, i) => s + i.price, 0),
        status: "Pending",
        date: new Date().toLocaleString()
    };

    await fetch(SHEETDB_URL + "?sheet=order sheet", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({data: [orderData]})
    });

    const msg = `📦 NEW ORDER\nID: ${orderID}\nItems: ${orderData.item}\nTotal: ${orderData.price}\nName: ${name}\nPhone: ${phone}`;
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}`);

    alert("Ordered! ID: " + orderID);
    cart = []; updateCart(); toggleCart();
}

function renderReviews(reviews) {
    document.getElementById('reviewDisplay').innerHTML = reviews.map(r => `
        <div class="review-card">
            <b>${r.name}</b>
            <div style="color:gold">${'★'.repeat(r.rating)}</div>
            <p style="font-size:12px">"${r.comment}"</p>
        </div>
    `).reverse().join('');
}

async function checkStatus() {
    const p = prompt("Enter Phone:");
    const res = await fetch(`${SHEETDB_URL}/search?sheet=order sheet&phone=${p}`);
    const data = await res.json();
    if(data.length > 0) alert("Status: " + data[data.length-1].status);
    else alert("Not found!");
}

function toggleCart() { document.getElementById('cartSidebar').classList.toggle('open'); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

loadData();
