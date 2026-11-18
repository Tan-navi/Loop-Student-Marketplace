
const API_URL = "/api/listings";

const listingContainer = document.getElementById("listingContainer");
const loadingMessage = document.getElementById("loadingMessage");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");

let allListings = [];
let currentFilter = "ALL";

// FETCH LISTINGS FROM BACKEND
async function fetchListings() {
    try {
        loadingMessage.classList.remove("hidden");
        loadingMessage.textContent = "Finding good things for you...";

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not fetch listings");
        }

        const data = await response.json();

        allListings = data.listings;

        renderListings();

    } catch (error) {
        console.error("Error:", error);

        loadingMessage.textContent =
            "Couldn't load listings. Please refresh the page.";

    } finally {
        loadingMessage.classList.add("hidden");
    }
}


// FORMAT LISTING TYPE
function formatType(type) {
    const labels = {
        RENT: "FOR RENT",
        SELL: "THRIFT",
        EXCHANGE: "EXCHANGE",
        GIVEAWAY: "FREEBIE"
    };

    return labels[type] || type;
}


// FORMAT PRICE
function formatPrice(listing) {
    if (listing.listing_type === "GIVEAWAY") {
        return "Free";
    }

    if (listing.listing_type === "EXCHANGE") {
        return "Exchange";
    }

    const price = Number(listing.price);

    if (listing.listing_type === "RENT") {
        return `₹${price}/day`;
    }

    return `₹${price}`;
}


// GET PLACEHOLDER ICON
function getIcon(category) {
    const icons = {
        Books: "📚",
        Electronics: "💻",
        Clothing: "👕",
        Accessories: "👜",
        "Hostel Essentials": "🏠",
        Stationery: "✏️"
    };

    return icons[category] || "📦";
}


// CREATE PRODUCT CARD
function createCard(listing) {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageArea = document.createElement("div");
    imageArea.className = "product-image";

    if (listing.image_path) {
        const img = document.createElement("img");
        img.src = listing.image_path;
        img.alt = listing.item_name;

        img.onerror = () => {
            img.remove();
            imageArea.innerHTML = `
                <span class="product-placeholder">
                    ${getIcon(listing.category_name)}
                </span>
            `;
        };

        imageArea.appendChild(img);
    } else {
        const placeholder = document.createElement("span");
        placeholder.className = "product-placeholder";
        placeholder.textContent = getIcon(listing.category_name);
        imageArea.appendChild(placeholder);
    }

    const tag = document.createElement("span");
    tag.className = "product-tag";
    tag.textContent = formatType(listing.listing_type);
    imageArea.appendChild(tag);

    const info = document.createElement("div");
    info.className = "product-info";

    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = listing.category_name;

    const title = document.createElement("h3");
    title.textContent = listing.item_name;

    const owner = document.createElement("p");
    owner.className = "product-owner";
    owner.textContent = `Listed by ${listing.owner_name}`;

    const bottom = document.createElement("div");
    bottom.className = "product-bottom";

    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = formatPrice(listing);

    const condition = document.createElement("span");
    condition.className = "product-condition";
    condition.textContent = listing.item_condition || "Pre-loved";

    bottom.append(price, condition);
    info.append(category, title, owner, bottom);
    card.append(imageArea, info);

    return card;
}


// DISPLAY LISTINGS
function renderListings() {
    listingContainer.innerHTML = "";

    const searchTerm = searchInput.value.toLowerCase().trim();

    const filteredListings = allListings.filter(listing => {
        const matchesType =
            currentFilter === "ALL" ||
            listing.listing_type === currentFilter;

        const matchesSearch =
            listing.item_name.toLowerCase().includes(searchTerm) ||
            listing.category_name.toLowerCase().includes(searchTerm) ||
            listing.description.toLowerCase().includes(searchTerm);

        return matchesType && matchesSearch;
    });

    if (filteredListings.length === 0) {
        emptyMessage.classList.remove("hidden");
        return;
    }

    emptyMessage.classList.add("hidden");

    filteredListings.forEach(listing => {
        listingContainer.appendChild(createCard(listing));
    });
}


// CATEGORY FILTER BUTTONS
document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        renderListings();
    });
});


// CATEGORY CARDS
document.querySelectorAll(".category-card").forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.type;

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.toggle(
                "active",
                btn.dataset.filter === currentFilter
            );
        });

        document.getElementById("explore").scrollIntoView({
            behavior: "smooth"
        });

        renderListings();
    });
});


// SEARCH
searchInput.addEventListener("input", renderListings);


// INITIALISE HOMEPAGE
fetchListings();
