const express = require('express');
const router = express.Router();
const knex = require('../node-knex/db');


router.get("/", function (req, res, next) {
  res.render("movies", { title: "Express" });
});

router.get('/search/:Title', (req, res, next) => {
  req.db('basics')
    .select('primaryTitle as Title', 'startYear as Year', 'tconst as imdbID', 'titleType as Type')
    .where('primaryTitle', 'like', `%${req.params.Title}%`)
    .then((rows) => {
      const totalResults = rows.length;
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 10;
      const offset = (page - 1) * perPage;

      const paginatedRows = rows.slice(offset, offset + perPage);

      const response = {
        success: true,
        data: paginatedRows,
        pagination: {
          total: totalResults,
          lastPage: Math.ceil(totalResults / perPage),
          perPage,
          currentPage: page,
          from: offset,
          to: offset + paginatedRows.length,
        },
      };

      res.json(response); // Send the response
    })
    .catch((err) => {
      console.error('Error fetching movies:', err);
      next(err); // Pass the error to the error handler
    });
});

router.get('/data/:imdbID', async (req, res, next) => {
  const { imdbID } = req.params;

  try {
    // Fetch movie details from the basics table
    const movie = await knex('basics')
      .select(
        'tconst as imdbID',
        'primaryTitle as Title',
        'startYear as Year',
        'runtimeMinutes as Runtime',
        'genres as Genres'
      )
      .where('tconst', imdbID)
      .first();

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    // Fetch directors from the crew table and join with names
    const directors = await knex('crew')
      .leftJoin('names', 'crew.directors', 'names.nconst')
      .select('names.primaryName')
      .where('crew.tconst', imdbID);

    movie.Directors = directors.map((director) => director.primaryName);

    // Fetch writers (handling multiple nconst values)
    const crew = await knex('crew').select('writers').where('tconst', imdbID).first();
    if (crew && crew.writers) {
      const writerIds = crew.writers.split(','); // Split multiple nconst values
      const writers = await knex('names')
        .select('primaryName')
        .whereIn('nconst', writerIds);
      movie.Writers = writers.map((writer) => writer.primaryName);
    } else {
      movie.Writers = [];
    }

    // Fetch ratings
    const ratings = await knex('ratings')
      .select('averageRating as Rating', 'numVotes as Votes')
      .where('tconst', imdbID)
      .first();

    movie.Rating = ratings ? ratings.Rating : null;
    movie.Votes = ratings ? ratings.Votes : null;

    res.json({ success: true, data: movie });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch movie details' });
  }
});


module.exports = router;
