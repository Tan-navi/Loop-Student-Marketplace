
const productId = new URLSearchParams(window.location.search).get("id");
const detail = document.getElementById("productDetail");

async function loadProduct() {
    if (!productId || !/^\d+$/.test(productId)) {
        detail.textContent = "Invalid product.";
        return;
    }

    try {
        const response = await fetch(`/api/listings/${productId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Product not found.");
        }

        const item = data.listing;
        const userId = localStorage.getItem("loopUserId");
        const isOwner = userId && Number(userId) === Number(item.user_id);

        const actionLabel = {
            RENT: "Request to Rent",
            SELL: "Buy Item",
            EXCHANGE: "Request Exchange",
            GIVEAWAY: "Claim this Item"
        };

        detail.innerHTML = `
            <div class="detail-image">
                ${item.image_path
                    ? `<img src="${escapeHTML(item.image_path)}" alt="${escapeHTML(item.item_name)}">`
                    : "<span>🛍️</span>"}
            </div>
            <div class="detail-info">
                <p class="eyebrow">${escapeHTML(item.category_name)} · ${escapeHTML(item.listing_type)}</p>
                <h1>${escapeHTML(item.item_name)}</h1>
                <div class="detail-price">
                    ${Number(item.price) > 0 ? "₹" + item.price : "Free"}
                    ${item.listing_type === "RENT" ? "/ day" : ""}
                </div>
                <p>${escapeHTML(item.description || "No description provided.")}</p>
                <p><strong>Listed by:</strong> ${escapeHTML(item.owner_name)}</p>
                <p><strong>Condition:</strong> ${escapeHTML(item.item_condition || "Not specified")}</p>
                <p><strong>Status:</strong> ${escapeHTML(item.status)}</p>
                ${isOwner
                    ? "<p>This is your listing.</p>"
                    : item.status === "AVAILABLE"
                        ? `<button class="detail-action" id="detailRequest">${actionLabel[item.listing_type]}</button>`
                        : "<p>This item is no longer available.</p>"}
            </div>
        `;

        const requestButton = document.getElementById("detailRequest");
        if (requestButton) {
            requestButton.addEventListener("click", () => {
                requestItem(item.listing_id, item.listing_type);
            });
        }

    } catch (error) {
        detail.textContent = error.message;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#039;"
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
            body: JSON.stringify({ listingId, userId, durationDays, offeredItem })
        });

        const data = await response.json();
        alert(data.message);

    } catch (error) {
        alert("Could not send request.");
    }
}

loadProduct();
