const name = localStorage.getItem("loopUserName");

if (name) {
    const navName = document.getElementById("navName");
    const navAvatar = document.getElementById("navAvatar");

    if (navName) navName.textContent = name;
    if (navAvatar) navAvatar.textContent = name.charAt(0).toUpperCase();
}