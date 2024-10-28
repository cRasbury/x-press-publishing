const express = require('express');
const issuesRouter = express.Router({ mergeParams: true });

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issuesRouter.param('issueId', (req, res, next, id) => {
    db.get(`SELECT * FROM Issue WHERE id = ${id}`, (err, row) => {
        if (err || !row) {
            return res.sendStatus(404);
        } else {
            next();
        }
    });
});

const isValidIssue = (req, res, next) => {
    const reqIssue = req.body.issue;
    if (!reqIssue.name || !reqIssue.issueNumber || !reqIssue.publicationDate || !reqIssue.artistId) {
        return res.sendStatus(400);
    } else {
        next();
    }
}

issuesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Issue WHERE series_id = $seriesId', { $seriesId: req.params.seriesId }, (err, rows) => {
        if (err) {
            return res.sendStatus(500);
        } else {
            res.status(200).send({ issues: rows });
        }
    });
});

issuesRouter.post('/', isValidIssue, (req, res, next) => {
    const newIssue = req.body.issue;
    db.run('INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $num, $pub, $artist, $series)', { $name: newIssue.name, $num: newIssue.issueNumber, $pub: newIssue.publicationDate, $artist: newIssue.artistId, $series: req.params.seriesId }, function(err) {
        if (err) {
            return res.sendStatus(500);
        } else {
            db.get(`SELECT * FROM Issue WHERE id = ${this.lastID}`, (err, row) => {
                res.status(201).send({ issue: row });
            });
        }
    });
});

issuesRouter.put('/:issueId', isValidIssue, (req, res, next) => {
    const reqIssue = req.body.issue;
    db.run('UPDATE Issue SET name = $name, issue_number = $num, publication_date = $pub, artist_id = $artist', { $name: reqIssue.name, $num: reqIssue.issueNumber, $pub: reqIssue.publicationDate, $artist: reqIssue.artistId }, err => {
        if (err) {
            return res.sendStatus(500);
        } else {
            db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId}`, (err, row) => {
                res.status(200).send({ issue: row });
            });
        }
    });
});

issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run('DELETE FROM Issue WHERE id = $issueId', { $issueId: req.params.issueId }, err => {
        if (err) {
            return res.sendStatus(500);
        } else {
            return res.sendStatus(204);
        }
    });
});

module.exports = issuesRouter;