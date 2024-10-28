const express = require('express');
const seriesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

seriesRouter.param('seriesId', (req, res, next, id) => {
    db.get('SELECT * FROM Series WHERE id = $id', { $id: id }, (err, row) => {
        if (err || !row) {
            return res.sendStatus(404);
        } else {
            req.series = row;
            next();
        }
    });
});

const isValidSeries = (req, res, next) => {
    if (!req.body.series.name || !req.body.series.description) {
        return res.sendStatus(400);
    } else {
        next();
    }
}

seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series', (err, rows) => {
        if (err) {
            return res.sendStatus(500);
        } else {
            res.status(200).send({ series: rows });
        }
    })
});

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).send({ series: req.series });
});

seriesRouter.post('/', isValidSeries, (req, res, next) => {
    const newSeries = req.body.series;
    db.run('INSERT INTO Series (name, description) VALUES ($name, $desc)', { $name: newSeries.name, $desc: newSeries.description }, function(err) {
        if (err) {
            return res.sendStatus(500);
        } else {
            db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`, (err, row) => {
                res.status(201).send({ series: row });
            });
        }
    });
});

seriesRouter.put('/:seriesId', isValidSeries, (req, res, next) => {
    const reqSeries = req.body.series;
    db.run('UPDATE Series SET name = $name, description = $desc WHERE id = $id', { $name: reqSeries.name, $desc: reqSeries.description, $id: req.params.seriesId }, err => {
        if (err) {
            return res.sendStatus(500);
        } else {
            db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`, (err, row) => {
                res.status(200).send({ series: row });
            });
        }
    });
});

module.exports = seriesRouter;