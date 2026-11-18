
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ==========================================
// 1. REQUEST AN ITEM
// ==========================================
router.post("/", async (req, res) => {
    try {
        const { listingId, userId, durationDays, offeredItem } = req.body;

        if (!listingId || !userId) {
            return res.status(400).json({
                success: false,
                message: "Missing listing or student information."
            });
        }

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


// ==========================================
// 2. ACCEPT OR REJECT A REQUEST
// ==========================================
router.patch("/:id/status", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const requestId = Number(req.params.id);
        const { userId, status } = req.body;

        if (!Number.isInteger(requestId) || requestId <= 0 || !userId) {
            return res.status(400).json({
                success: false,
                message: "Invalid request or user information."
            });
        }

        if (!["ACCEPTED", "REJECTED"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid decision."
            });
        }

        await connection.beginTransaction();

        // Find which listing belongs to this request
        const [initialRequests] = await connection.query(
            "SELECT listing_id FROM requests WHERE request_id = ?",
            [requestId]
        );

        if (!initialRequests.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        const listingId = initialRequests[0].listing_id;

        // Lock the listing to prevent simultaneous approvals
        const [listings] = await connection.query(
            "SELECT * FROM listings WHERE listing_id = ? FOR UPDATE",
            [listingId]
        );

        if (!listings.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Listing not found."
            });
        }

        const listing = listings[0];

        // Verify that the logged-in student owns this listing
        if (Number(listing.user_id) !== Number(userId)) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message: "You are not authorised to manage this request."
            });
        }

        // Lock and check the individual request
        const [requests] = await connection.query(
            "SELECT * FROM requests WHERE request_id = ? FOR UPDATE",
            [requestId]
        );

        if (!requests.length) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Request not found."
            });
        }

        const request = requests[0];

        if (request.status !== "PENDING") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This request has already been processed."
            });
        }

        // ACCEPT REQUEST
        if (status === "ACCEPTED") {

            if (listing.status !== "AVAILABLE") {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: "This item is no longer available."
                });
            }

            // Reserve the listing
            await connection.query(
                `UPDATE listings
                 SET status = 'RESERVED'
                 WHERE listing_id = ?`,
                [listingId]
            );

            // Accept selected request
            await connection.query(
                `UPDATE requests
                 SET status = 'ACCEPTED'
                 WHERE request_id = ?`,
                [requestId]
            );

            // Reject other pending requests for this item
            await connection.query(
                `UPDATE requests
                 SET status = 'REJECTED'
                 WHERE listing_id = ?
                 AND request_id != ?
                 AND status = 'PENDING'`,
                [listingId, requestId]
            );

        } else {

            // REJECT REQUEST
            await connection.query(
                `UPDATE requests
                 SET status = 'REJECTED'
                 WHERE request_id = ?`,
                [requestId]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            message: status === "ACCEPTED"
                ? "Request accepted! Item is now reserved."
                : "Request rejected successfully!"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Request decision error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to update request."
        });

    } finally {
        connection.release();
    }
});

module.exports = router;

