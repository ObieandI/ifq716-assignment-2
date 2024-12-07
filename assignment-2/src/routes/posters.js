const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const knex = require('../node-knex/db');
const authenticateCookie = require('../middleware/auth');
const axios = require('axios');
const router = express.Router();

const POSTER_DIR = path.join(__dirname, '../res/posters');
const OMDB_API_KEY = process.env.OMDB_API_KEY;

// Ensure the directory exists
if (!fs.existsSync(POSTER_DIR)) {
    fs.mkdirSync(POSTER_DIR, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, POSTER_DIR);
    },
    filename: (req, file, cb) => {
        const { imdbID } = req.params;
        cb(null, `${imdbID}_poster${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

// Fetch poster by IMDb ID
router.get('/:imdbID', authenticateCookie, async (req, res, next) => {
    try {
        const { imdbID } = req.params;
        const localPosterPath = path.join(POSTER_DIR, `${imdbID}_poster.png`);

        if (fs.existsSync(localPosterPath)) {
            console.log(`Serving poster from local file: ${localPosterPath}`);
            return res.sendFile(localPosterPath);
        }

        const omdbUrl = `http://www.omdbapi.com/?i=${imdbID}&apikey=${OMDB_API_KEY}`;
        const response = await axios.get(omdbUrl);

        if (response.data && response.data.Poster) {
            const posterUrl = response.data.Poster;
            const writer = fs.createWriteStream(localPosterPath);
            const posterResponse = await axios({
                url: posterUrl,
                method: 'GET',
                responseType: 'stream',
            });

            posterResponse.data.pipe(writer);
            writer.on('finish', () => res.sendFile(localPosterPath));
            writer.on('error', (err) => next(err));
        } else {
            res.status(404).json({ success: false, message: 'Poster not found in OMDb.' });
        }
    } catch (error) {
        next(error);
    }
});

// Add new poster
router.post('/add/:imdbID', authenticateCookie, upload.single('image'), async (req, res, next) => {
    try {
        const { imdbID } = req.params;
        const fileName = req.file.filename;

        const movieExists = await knex('basics').where({ tconst: imdbID }).first();
        if (!movieExists) {
            fs.unlinkSync(req.file.path);
            return res.status(400).send('<h1>Invalid IMDb ID.</h1>');
        }

        const filePath = `posters/${fileName}`;
        const existingPoster = await knex('posters').where({ imdbID }).first();

        if (existingPoster) {
            await knex('posters').where({ imdbID }).update({ filePath });
        } else {
            await knex('posters').insert({ imdbID, filePath });
        }

        res.sendFile(path.join(POSTER_DIR, fileName));
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
});

module.exports = router;
