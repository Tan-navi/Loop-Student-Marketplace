
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// LOGIN OR CREATE A DEMO STUDENT PROFILE
router.post("/login", async (req, res) => {
    try {
        const { studentName, college } = req.body;

        if (!studentName || !college) {
            return res.status(400).json({
                success: false,
                message: "Please enter your name and college."
            });
        }

        const name = studentName.trim();

        // Check whether this student already has a profile
        const [existingUsers] = await pool.query(
            `SELECT user_id, student_name, college, email, created_at
             FROM users
             WHERE LOWER(student_name) = LOWER(?)
             AND college = ?
             LIMIT 1`,
            [name, college]
        );

        let user;

        if (existingUsers.length > 0) {
            user = existingUsers[0];
        } else {
            // Create a new profile if one doesn't exist
            const [result] = await pool.query(
                `INSERT INTO users (student_name, college)
                 VALUES (?, ?)`,
                [name, college]
            );

            const [newUsers] = await pool.query(
                `SELECT user_id, student_name, college, email, created_at
                 FROM users
                 WHERE user_id = ?`,
                [result.insertId]
            );

            user = newUsers[0];
        }

        res.json({
            success: true,
            message: "Login successful!",
            user
        });

    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to log in. Please try again."
        });
    }
});

// GET A STUDENT PROFILE
router.get("/:id", async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT user_id, student_name, college, email, created_at
             FROM users
             WHERE user_id = ?`,
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        res.json({ success: true, user: users[0] });

    } catch (error) {
        console.error("Profile error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to fetch profile."
        });
    }
});

// GET STUDENT ACTIVITY: LISTINGS AND REQUESTS
router.get("/:id/activity", async (req, res) => {
    try {
        const userId = req.params.id;

        // Items listed by this student
        const [listings] = await pool.query(
            `SELECT listing_id, item_name, listing_type, price,
                    status, image_path, created_at
             FROM listings
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        // Requests made by this student
        const [requestsMade] = await pool.query(
            `SELECT r.request_id, r.request_type, r.status,
                    r.duration_days, r.offered_item,
                    l.item_name, l.owner_name
             FROM requests r
             JOIN listings l ON r.listing_id = l.listing_id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );

        // Requests received for this student's listings
        const [requestsReceived] = await pool.query(
            `SELECT r.request_id, r.request_type, r.status,
                    r.duration_days, r.offered_item,
                    r.requester_name, l.item_name
             FROM requests r
             JOIN listings l ON r.listing_id = l.listing_id
             WHERE l.user_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            listings,
            requestsMade,
            requestsReceived
        });

    } catch (error) {
        console.error("Activity error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to fetch student activity."
        });
    }
});


module.exports = router;
