
const userId = localStorage.getItem("loopUserId");

if (!userId) {
    window.location.href = "/";
}

async function loadProfile() {
    try {
        const [profileResponse, activityResponse] = await Promise.all([
            fetch(`/api/users/${userId}`),
            fetch(`/api/users/${userId}/activity`)
        ]);

        if (!profileResponse.ok || !activityResponse.ok) {
            throw new Error("Could not load profile.");
        }

        const profileData = await profileResponse.json();
        const activityData = await activityResponse.json();

        const user = profileData.user;

        document.getElementById("studentName").textContent = user.student_name;
        document.getElementById("studentCollege").textContent = user.college;
        document.getElementById("avatar").textContent =
            user.student_name.charAt(0).toUpperCase();

        document.getElementById("joinedDate").textContent =
            "Member since " + new Date(user.created_at).toLocaleDateString();

        const { listings, requestsMade, requestsReceived } = activityData;

        document.getElementById("listingCount").textContent = listings.length;
        document.getElementById("madeCount").textContent = requestsMade.length;
        document.getElementById("receivedCount").textContent = requestsReceived.length;

        renderList("myListings", listings, item => `
            <div class="activity-item">
                <div>
                    <strong>${escapeHTML(item.item_name)}</strong>
                    <p>${item.listing_type} · ₹${item.price}</p>
                </div>
                <span class="activity-status">${item.status}</span>
            </div>
        `);

        renderList("requestsMade", requestsMade, item => `
            <div class="activity-item">
                <div>
                    <strong>${escapeHTML(item.item_name)}</strong>
                    <p>Owner: ${escapeHTML(item.owner_name)} · ${item.request_type}</p>
                </div>
                <span class="activity-status">${item.status}</span>
            </div>
        `);

        renderList("requestsReceived", requestsReceived, item => `
            <div class="activity-item">
                <div>
                    <strong>${escapeHTML(item.item_name)}</strong>
                    <p>Requested by ${escapeHTML(item.requester_name)} · ${item.request_type}</p>
                </div>
                <span class="activity-status">${item.status}</span>
            </div>
        `);

    } catch (error) {
        console.error(error);
        document.querySelector(".profile-container").innerHTML =
            "<p>Unable to load your profile. Please refresh and try again.</p>";
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

function renderList(elementId, items, template) {
    const container = document.getElementById(elementId);

    if (!items.length) {
        container.innerHTML = '<p class="empty-state">Nothing here yet.</p>';
        return;
    }

    container.innerHTML = items.map(template).join("");
}

document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("loopUserId");
    localStorage.removeItem("loopUserName");
    localStorage.removeItem("loopCollege");
    window.location.href = "/";
});

loadProfile();
