const express = require('express');
const artistsRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistsRouter.param('artistId', (req, res, next, id) => {
    db.get('SELECT * FROM Artist WHERE id = $id', { $id: id }, (err, row) => {
        if (err || !row) {
            return res.sendStatus(404);
        } else {
            req.artist = row;
            next();
        }
    });
});

const isValidArtist = (req, res, next) => {
    reqArtist = req.body.artist;
    if (!reqArtist.name || !reqArtist.dateOfBirth || !reqArtist.biography) {
        return res.sendStatus(400);
    } else {
        next();
    }
}

artistsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE is_currently_employed = 1', (err, rows) => {
        if (err) {
            return res.sendStatus(500);
        } else {
            res.status(200).send({ artists: rows });
        }
    });
});

artistsRouter.get('/:artistId', (req, res, next) => {
    res.status(200).send({ artist: req.artist });
});

artistsRouter.post('/', isValidArtist, (req, res, next) => {
    const reqArtist = req.body.artist;
    db.run('INSERT INTO Artist (name, date_of_birth, biography) VALUES ($name, $dob, $bio)', { $name: reqArtist.name, $dob: reqArtist.dateOfBirth, $bio: reqArtist.biography }, function(err) {
        if (err) {
            return res.sendStatus(500);
        } else {
            db.get('SELECT * FROM Artist WHERE id = $id', { $id: this.lastID }, (err, row) => {
                res.status(201).send({ artist: row });
            });
        }
    });
});

artistsRouter.put('/:artistId', isValidArtist, (req, res, next) => {
    const reqArtist = req.body.artist;
    db.run('UPDATE Artist SET name = $name, date_of_birth = $dob, biography = $bio, is_currently_employed = $isEmployed WHERE id = $id', { $name: reqArtist.name, $dob: reqArtist.dateOfBirth, $bio: reqArtist.biography, $isEmployed: reqArtist.isCurrentlyEmployed, $id: req.params.artistId }, err => {
        if (err) {
            return res.sendStatus(500);
        } else {
            db.get('SELECT * FROM Artist WHERE id = $id', { $id: req.params.artistId }, (err, row) => {
                res.status(200).send({ artist: row });
            });
        }
    });
});

artistsRouter.delete('/:artistId', (req, res, next) => {
    db.run('UPDATE Artist SET is_currently_employed = 0 WHERE id = $id', { $id: req.params.artistId }, err => {
        if (err) {
            return res.sendStatus(500);
        } else {
            db.get('SELECT * FROM Artist WHERE id = $id', { $id: req.params.artistId }, (err, row) => {
                res.status(200).send({ artist: row });
            });
        }
    });
});

module.exports = artistsRouter;