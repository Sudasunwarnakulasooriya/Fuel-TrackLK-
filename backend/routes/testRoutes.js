const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

router.get("/firebase", async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: "Firebase not connected",
            });
        }

        await db.ref("test").set({
            message: "Firebase connected successfully",
            time: new Date().toISOString(),
        });

        res.json({
            success: true,
            message: "Firebase connected successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Firebase connection failed",
            error: error.message,
        });
    }
});

module.exports = router;