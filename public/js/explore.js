
const grid = document.getElementById("marketplaceGrid");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");

async function loadExplore() {
    const params = new URLSearchParams();

    if (searchInput.value.trim()) {
        params.set("search", searchInput.value.trim());
    }

    if (typeFilter.value) {
        params.set("type", typeFilter.value);
    }

    grid.textContent = "Loading items...";

    try {
        const response = await fetch(`/api/listings?${params.toString()}`);
        const data = await response.json();

        if (!data.success) throw new Error("Unable to load listings.");

        if (!data.listings.length) {
            grid.textContent = "No items found. Try another search.";
            return;
        }

        grid.innerHTML = data.listings.map(item => `
            <article class="product-card"
                onclick="window.location.href='product.html?id=${item.listing_id}'"
                style="cursor:pointer">
                <div class="product-image">
                    ${item.image_path
                        ? `<img src="${escapeHTML(item.image_path)}" alt="${escapeHTML(item.item_name)}">`
                        : `<span>🛍️</span>`}
                </div>
                <div class="product-info">
                    <p class="product-category">${escapeHTML(item.category_name)}</p>
                    <h3>${escapeHTML(item.item_name)}</h3>
                    <p>Listed by ${escapeHTML(item.owner_name)}</p>
                    <div class="product-bottom">
                        <strong>${Number(item.price) > 0 ? "₹" + item.price : "Free"}</strong>
                        <span>${escapeHTML(item.listing_type)}</span>
                    </div>
                </div>
            </article>
        `).join("");

    } catch (error) {
        console.error(error);
        grid.textContent = "Could not load items. Please try again.";
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#039;"
    })[char]);
}

searchInput.addEventListener("input", loadExplore);
typeFilter.addEventListener("change", loadExplore);

loadExplore();
