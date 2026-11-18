
const listingForm = document.getElementById("listingForm");
const formMessage = document.getElementById("formMessage");

listingForm.addEventListener("submit", async event => {
    event.preventDefault();

    const userId = localStorage.getItem("loopUserId");

    if (!userId) {
        alert("Please log in before listing an item.");
        window.location.href = "/";
        return;
    }

    const listingType = document.getElementById("listingType").value;

    const listing = {
        itemName: document.getElementById("itemName").value.trim(),
        description: document.getElementById("description").value.trim(),
        category: document.getElementById("category").value,
        listingType,
        price: listingType === "GIVEAWAY"
            ? 0
            : document.getElementById("price").value,
        itemCondition: document.getElementById("itemCondition").value,
        userId
    };

    try {
        const response = await fetch("/api/listings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(listing)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not publish listing.");
        }

        formMessage.textContent = data.message;
        formMessage.style.color = "#244B3C";
        listingForm.reset();

        setTimeout(() => {
            window.location.href = "profile.html";
        }, 1200);

    } catch (error) {
        formMessage.textContent = error.message;
        formMessage.style.color = "#B65C50";
    }
});
