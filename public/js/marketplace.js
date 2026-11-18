
async function loadMarketplace(type) {
    const grid = document.getElementById("marketplaceGrid");

    try {
        const response = await fetch(`/api/listings?type=${type}`);
        const data = await response.json();

        if (!data.success) throw new Error("Unable to load listings.");

        if (!data.listings.length) {
            grid.textContent = "No items available here yet.";
            return;
        }

        grid.innerHTML = data.listings.map(item => `
            <article class="product-card"
    onclick="window.location.href='product.html?id=${item.listing_id}'"
    style="cursor:pointer">
                <div class="product-image">
                    ${item.image_path
                        ? `<img src="${item.image_path}" alt="${escapeHTML(item.item_name)}">`
                        : `<span>🛍️</span>`}
                </div>
                <div class="product-info">
                    <p class="product-category">${escapeHTML(item.category_name)}</p>
                    <h3>${escapeHTML(item.item_name)}</h3>
                    <p>${escapeHTML(item.description || "A student-listed item on Loop.")}</p>
                    <div class="product-bottom">
    <strong>${Number(item.price) > 0 ? "₹" + item.price : "Free"}</strong>
    <span>${escapeHTML(item.owner_name)}</span>
</div>

<button class="request-button"
    onclick="event.stopPropagation(); requestItem(${item.listing_id}, '${item.listing_type}')">
    ${item.listing_type === "RENT" ? "Request to Rent" :
      item.listing_type === "SELL" ? "Buy Item" :
      item.listing_type === "EXCHANGE" ? "Request Exchange" :
      "Claim Item"}
</button>
                </div>
            </article>
        `).join("");

    } catch (error) {
        console.error(error);
        grid.textContent = "Could not load items. Please refresh.";
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

async function requestItem(listingId, listingType) {
    const userId = localStorage.getItem("loopUserId");

    if (!userId) {
        alert("Please log in first.");
        window.location.href = "/";
        return;
    }

    let durationDays = null;
    let offeredItem = null;

    if (listingType === "RENT") {
        durationDays = prompt("How many days would you like to rent this item?");
        if (!durationDays || !Number.isInteger(Number(durationDays)) || Number(durationDays) <= 0) return;
    }

    if (listingType === "EXCHANGE") {
        offeredItem = prompt("What would you like to offer in exchange?");
        if (!offeredItem) return;
    }

    try {
        const response = await fetch("/api/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                listingId,
                userId,
                durationDays,
                offeredItem
            })
        });

        const data = await response.json();

        alert(data.message);

    } catch (error) {
        alert("Could not send request. Please try again.");
    }
}

