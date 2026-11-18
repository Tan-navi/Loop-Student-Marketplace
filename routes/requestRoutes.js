
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// REQUEST AN ITEM
router.post("/", async (req, res) => {
    try {
        const { listingId, userId, durationDays, offeredItem } = req.body;

        if (!listingId || !userId) {
            return res.status(400).json({
                success: false,
                message: "Missing listing or student information."
            });
        }

        // Find the student
        const [users] = await pool.query(
            "SELECT * FROM users WHERE user_id = ?",
            [userId]
        );

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        // Find the listing
        const [listings] = await pool.query(
            "SELECT * FROM listings WHERE listing_id = ?",
            [listingId]
        );

        if (!listings.length) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        const listing = listings[0];
        const user = users[0];

        if (Number(listing.user_id) === Number(userId)) {
            return res.status(400).json({
                success: false,
                message: "You cannot request your own item."
            });
        }

        if (listing.status !== "AVAILABLE") {
            return res.status(400).json({
                success: false,
                message: "This item is no longer available."
            });
        }

        const requestTypes = {
            RENT: "RENT",
            SELL: "BUY",
            EXCHANGE: "EXCHANGE",
            GIVEAWAY: "CLAIM"
        };

        const requestType = requestTypes[listing.listing_type];

        if (!requestType) {
            return res.status(400).json({
                success: false,
                message: "Invalid listing type."
            });
        }

        const [result] = await pool.query(
            `INSERT INTO requests
             (listing_id, requester_name, request_type, duration_days,
              offered_item, user_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                listingId,
                user.student_name,
                requestType,
                durationDays || null,
                offeredItem || null,
                userId
            ]
        );

        res.status(201).json({
            success: true,
            message: "Your request has been sent!",
            requestId: result.insertId
        });

    } catch (error) {
        console.error("Request error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to send request."
        });
    }
});

module.exports = router;
