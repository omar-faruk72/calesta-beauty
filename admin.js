const API_URL = "https://calesta-beauty-server.vercel.app/api";
let currentEditId = null;

// ======================== CORE NAVIGATION ========================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        loadSection(this.dataset.section);
    });
});

async function loadSection(section) {
    const body = document.getElementById('content-body');
    const title = document.getElementById('section-title');
    body.innerHTML = '<div class="loader">Loading...</div>';

    if (section === 'overview') {
        title.innerText = "Dashboard Overview";
        body.innerHTML = `<div class="stats-grid">
            <div class="stat-card"><h2>$42,500</h2><p>Total Revenue</p></div>
            <div class="stat-card"><h2 id="p-count">...</h2><p>Products</p></div>
            <div class="stat-card"><h2 id="u-count">...</h2><p>Customers</p></div>
        </div>`;
        updateStats();
    } else if (section === 'products') {
        title.innerText = "Product Management";
        body.innerHTML = `
            <button class="btn-submit" style="width:auto; padding:10px 20px" onclick="openProductModal()">+ Add Product</button>
            <div class="table-container"><table class="admin-table">
                <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
                <tbody id="data-table"></tbody>
            </table></div>`;
        fetchProducts();
    } else if (section === 'categories') {
        title.innerText = "Categories";
        body.innerHTML = `
            <button class="btn-submit" style="width:auto; padding:10px 20px" onclick="openCategoryModal()">+ Add Category</button>
            <div class="table-container"><table class="admin-table">
                <thead><tr><th>Image</th><th>Name</th><th>Action</th></tr></thead>
                <tbody id="data-table"></tbody>
            </table></div>`;
        fetchCategories();
    }
}

// ======================== PRODUCT CRUD ========================
async function fetchProducts() {
    const res = await fetch(`${API_URL}/products`);
    const result = await res.json();
    document.getElementById('data-table').innerHTML = result.data.map(p => `
        <tr>
            <td><div style="display:flex; align-items:center; gap:10px">
                <img src="${p.thumbnail}" width="40" height="40" style="border-radius:8px"> <b>${p.name}</b>
            </div></td>
            <td>${p.categoryID?.name || 'N/A'}</td>
            <td>$${p.salePrice}</td>
            <td>${p.stock}</td>
            <td>
                <button onclick="openProductModal('${p._id}')" class="btn-edit"><i class="fa fa-pen"></i></button>
                <button onclick="deleteItem('product-delete', '${p._id}')" class="btn-delete"><i class="fa fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

async function openProductModal(id = null) {
    currentEditId = id;
    const modal = document.getElementById('adminModal');
    const fields = document.getElementById('form-fields');
    document.getElementById('modal-title').innerText = id ? "Update Product" : "Add Product";

    const catRes = await fetch(`${API_URL}/categories`);
    const cats = await catRes.json();
    
    let p = { name: '', description: '', regularPrice: '', salePrice: '', stock: '', categoryID: '' };
    if(id) {
        const res = await fetch(`${API_URL}/products/${id}`);
        const data = await res.json();
        p = data.data;
    }

    fields.innerHTML = `
        <div class="form-group"><label>Product Name</label><input type="text" name="name" value="${p.name}" required></div>
        <div class="form-group"><label>Description</label><textarea name="description">${p.description}</textarea></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
            <div class="form-group"><label>Regular Price</label><input type="number" name="regularPrice" value="${p.regularPrice}"></div>
            <div class="form-group"><label>Sale Price</label><input type="number" name="salePrice" value="${p.salePrice}"></div>
        </div>
        <div class="form-group"><label>Category</label>
            <select name="categoryID">${cats.data.map(c => `<option value="${c._id}" ${p.categoryID?._id===c._id?'selected':''}>${c.name}</option>`)}</select>
        </div>
        <div class="form-group"><label>Stock</label><input type="number" name="stock" value="${p.stock}"></div>
        <div class="form-group"><label>Thumbnail</label><input type="file" name="thumbnail"></div>
    `;
    modal.style.display = 'flex';
    document.getElementById('dynamic-form').onsubmit = handleProductSubmit;
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = currentEditId ? `${API_URL}/product-update/${currentEditId}` : `${API_URL}/create-product`;
    const res = await fetch(url, { method: currentEditId ? 'PUT' : 'POST', body: formData });
    if(res.ok) location.reload();
}

// ======================== DELETE GENERIC ========================
async function deleteItem(route, id) {
    if(confirm("Are you sure?")) {
        await fetch(`${API_URL}/${route}/${id}`, { method: 'DELETE' });
        location.reload();
    }
}

// Initial Load
loadSection('overview');
document.getElementById('closeModal').onclick = () => document.getElementById('adminModal').style.display = 'none';