
const loginForm = document.getElementById("loginForm");
const guestButton = document.getElementById("guestButton");
const errorMessage = document.getElementById("errorMessage");

async function loginStudent(studentName, college) {
    try {
        errorMessage.textContent = "";

        const response = await fetch("/api/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ studentName, college })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Login failed.");
        }

        // Remember the logged-in student
        localStorage.setItem("loopUserId", data.user.user_id);
        localStorage.setItem("loopUserName", data.user.student_name);
        localStorage.setItem("loopCollege", data.user.college);

        window.location.href = "index.html";

    } catch (error) {
        errorMessage.textContent = error.message;
    }
}

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const studentName = document.getElementById("studentName").value.trim();
    const college = document.getElementById("college").value;

    if (!studentName || !college) {
        errorMessage.textContent = "Please enter your name and college.";
        return;
    }

    loginStudent(studentName, college);
});

if (guestButton) {
    guestButton.addEventListener("click", function () {
        loginStudent("Guest Student", "Guest");
    });
}

