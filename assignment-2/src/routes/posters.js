const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const authenticateCookie = require('../middleware/auth'); // Middleware for authentication
const router = express.Router();

const OMDB_API_KEY = process.env.OMDB_API_KEY;

// Poster route with no-cache headers and authentication
router.get('/:imdbID', authenticateCookie, async (req, res, next) => {
    // Add no-cache headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');

    try {
        const { imdbID } = req.params; // Extract IMDb ID from the request parameters
        const posterDir = path.join(__dirname, '../res/posters');
        const posterPath = path.join(posterDir, `${imdbID}_poster.jpg`);

        // Ensure the directory exists
        if (!fs.existsSync(posterDir)) {
            fs.mkdirSync(posterDir, { recursive: true });
        }

        // If the poster exists locally, serve it
        if (fs.existsSync(posterPath)) {
            return res.sendFile(posterPath);
        }

        // Fetch the poster from OMDb
        const response = await axios.get(`http://www.omdbapi.com/?i=${imdbID}&apikey=${OMDB_API_KEY}`);
        if (response.data && response.data.Poster) {
            const posterUrl = response.data.Poster;

            // Save the poster locally
            const writer = fs.createWriteStream(posterPath);
            const posterResponse = await axios({
                url: posterUrl,
                method: 'GET',
                responseType: 'stream',
            });

            posterResponse.data.pipe(writer);

            writer.on('finish', () => res.sendFile(posterPath));
            writer.on('error', (err) => {
                console.error('Error saving poster:', err);
                next(err);
            });
        } else {
            res.status(404).json({ success: false, message: 'Poster not found in OMDb.' });
        }
    } catch (error) {
        console.error('Error fetching poster:', error);
        next(error);
    }
});

module.exports = router;
