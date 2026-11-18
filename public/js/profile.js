
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

        // MY LISTINGS
        renderList("myListings", listings, item => `
            <div class="activity-item">
                <div>
                    <strong>${escapeHTML(item.item_name)}</strong>
                    <p>${escapeHTML(item.listing_type)} · ₹${escapeHTML(item.price)}</p>
                </div>
                <span class="activity-status">${escapeHTML(item.status)}</span>
            </div>
        `);

        // REQUESTS MADE
        renderList("requestsMade", requestsMade, item => `
            <div class="activity-item">
                <div>
                    <strong>${escapeHTML(item.item_name)}</strong>
                    <p>Owner: ${escapeHTML(item.owner_name)} · ${escapeHTML(item.request_type)}</p>
                </div>
                <span class="activity-status">${escapeHTML(item.status)}</span>
            </div>
        `);

        // REQUESTS RECEIVED
        renderList("requestsReceived", requestsReceived, item => `
            <div class="activity-item">
                <div>
                    <strong>${escapeHTML(item.item_name)}</strong>
                    <p>Requested by ${escapeHTML(item.requester_name)} · ${escapeHTML(item.request_type)}</p>
                </div>

                <div class="request-actions">
                    <span class="activity-status">${escapeHTML(item.status)}</span>

                    ${item.status === "PENDING" ? `
                        <div class="decision-buttons">
                            <button
                                class="accept-button"
                                onclick="updateRequest(${Number(item.request_id)}, 'ACCEPTED')">
                                Accept
                            </button>

                            <button
                                class="reject-button"
                                onclick="updateRequest(${Number(item.request_id)}, 'REJECTED')">
                                Reject
                            </button>
                        </div>
                    ` : ""}
                </div>
            </div>
        `);

    } catch (error) {
        console.error(error);

        document.querySelector(".profile-container").innerHTML =
            "<p>Unable to load your profile. Please refresh and try again.</p>";
    }
}


// ACCEPT OR REJECT REQUEST
async function updateRequest(requestId, status) {
    const action = status === "ACCEPTED" ? "accept" : "reject";

    if (!confirm(`Are you sure you want to ${action} this request?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/requests/${requestId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId,
                status
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to update request.");
        }

        alert(data.message);

        // Refresh profile and updated request statuses
        await loadProfile();

    } catch (error) {
        console.error(error);
        alert(error.message || "Something went wrong.");
    }
}


// PREVENT HTML INJECTION
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}


// RENDER ACTIVITY LISTS
function renderList(elementId, items, template) {
    const container = document.getElementById(elementId);

    if (!items.length) {
        container.innerHTML = '<p class="empty-state">Nothing here yet.</p>';
        return;
    }

    container.innerHTML = items.map(template).join("");
}


// LOGOUT
document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("loopUserId");
    localStorage.removeItem("loopUserName");
    localStorage.removeItem("loopCollege");
    window.location.href = "/";
});

loadProfile();

