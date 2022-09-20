const express = require('express');
const path = require('path');
const fs = require('fs');

/* create a router (to export) */
const router = express.Router();

/* Routes image URLs */
router.get('/:filename?', (req, res) => {
    const filename = req.params.filename;
    let image_path = path.resolve(__dirname, `../public/images/${filename}`);

    // if image doesn't exist, use a default image
    if (!fs.existsSync(image_path)) {
        console.error(`Error image file not found: ${filename}, using default photo instead`);
        image_path = path.resolve(__dirname, '../public/images/default.jpg');
    }

    res.sendFile(image_path);
});

module.exports = router; // export the router
