const express = require("express");
const path = require("path");
require("dotenv").config();

const pool = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const listingRoutes = require("./routes/listingRoutes");
const requestRoutes = require("./routes/requestRoutes");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// FIRST: Show login page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// SECOND: Serve static files
app.use(express.static(path.join(__dirname, "public")));

// API ROUTES
app.use("/api/listings", listingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
// HEALTH CHECK
app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS result");

        res.json({
            success: true,
            message: "Backend and MySQL are connected!",
            database: rows[0].result
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});