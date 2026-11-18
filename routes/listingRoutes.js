
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET ALL LISTINGS
router.get("/", async (req, res) => {
    try {
        const { type, category, search } = req.query;

        let sql = `
            SELECT
                l.*,
                c.category_name
            FROM listings l
            JOIN categories c
            ON l.category_id = c.category_id
            WHERE 1=1
        `;

        const values = [];

        if (type) {
            sql += " AND l.listing_type = ?";
            values.push(type.toUpperCase());
        }

        if (category) {
            sql += " AND c.category_name = ?";
            values.push(category);
        }

        if (search) {
            sql += " AND (l.item_name LIKE ? OR l.description LIKE ?)";
            values.push(`%${search}%`, `%${search}%`);
        }

        sql += " ORDER BY l.created_at DESC";

        const [listings] = await pool.query(sql, values);

        res.json({
            success: true,
            count: listings.length,
            listings
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch listings"
        });
    }
});

// GET SINGLE LISTING
router.get("/:id", async (req, res) => {
    try {
        const [listings] = await pool.query(
            `SELECT l.*, c.category_name
             FROM listings l
             JOIN categories c
             ON l.category_id = c.category_id
             WHERE l.listing_id = ?`,
            [req.params.id]
        );

        if (listings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }

        res.json({
            success: true,
            listing: listings[0]
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch listing"
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const {
            itemName, description, category,
            listingType, price, itemCondition, userId
        } = req.body;

        if (!itemName || !category || !listingType || !userId) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields."
            });
        }

        const [users] = await pool.query(
            "SELECT * FROM users WHERE user_id = ?",
            [userId]
        );

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found. Please log in again."
            });
        }

        const [categories] = await pool.query(
            "SELECT category_id FROM categories WHERE category_name = ?",
            [category]
        );

        if (!categories.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid category."
            });
        }

        const allowedTypes = ["RENT", "SELL", "EXCHANGE", "GIVEAWAY"];

        if (!allowedTypes.includes(listingType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid listing type."
            });
        }

        const [result] = await pool.query(
            `INSERT INTO listings
            (item_name, description, category_id, owner_name,
             listing_type, price, item_condition, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                itemName.trim(),
                description || "",
                categories[0].category_id,
                users[0].student_name,
                listingType,
                listingType === "GIVEAWAY" ? 0 : (Number(price) || 0),
                itemCondition || "Good",
                userId
            ]
        );

        res.status(201).json({
            success: true,
            message: "Your item has been added to Loop!",
            listingId: result.insertId
        });

    } catch (error) {
        console.error("Create listing error:", error.message);
        res.status(500).json({
            success: false,
            message: "Unable to create listing."
        });
    }
});

module.exports = router;
