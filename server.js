/*
CSC3916 HW3
File: Server.js
Description: Movie API using MongoDB
*/

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.post('/signup', function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({ success: false, msg: 'Please include both username and password to signup.' });
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function (err) {
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, msg: 'A user with that username already exists.' });
                else return res.json(err);
            }

            res.json({ success: true, msg: 'Successfully created new user.' });
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username })
        .select('name username password')
        .exec(function (err, user) {
            if (err) {
                res.send(err);
            } else if (!userNew.username || !userNew.password || !user) {
                res.status(401).json({ success: false, msg: 'Authentication failed.' });
            } else {
                user.comparePassword(userNew.password, function (isMatch) {
                    if (isMatch) {
                        var userToken = { id: user.id, username: user.username };
                        var token = jwt.sign(userToken, process.env.SECRET_KEY);
                        res.json({ success: true, token: 'JWT ' + token });
                    } else {
                        res.status(401).send({ success: false, msg: 'Authentication failed.' });
                    }
                });
            }
        });
});

router
    .route('/movies/search') // route for movies search
    .get(authJwtController.isAuthenticated, function (req, res) {
        let searchStr = new RegExp(req.query['k'], 'i');
        if ('reviews' in req.query && req.query['reviews'] === 'true') {
            Movie.aggregate([
                {
                    $match: {
                        $or: [
                            { title: searchStr }, 
                            { actors: { $elemMatch: { actorName: searchStr } } }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'reviews',
                        localField: 'title',
                        foreignField: 'movieTitle',
                        as: 'reviews'
                    }
                },
                {
                    $addFields: {
                        avgRating: { $avg: '$reviews.rating' }
                    }
                }
            ]).exec(function (err, movies) {
                if (err) return res.status(400).json(err);
                else res.json(movies);
            });
        } else {
            Movie.find(
                { $or: [
                    { title: searchStr }, 
                    { actors: { $elemMatch: { actorName: searchStr } } }
                ] },
                (err, movies) => {
                    if (err) return res.status(400).json(err);
                    else res.json(movies);
                }
            );
        }
    });

router
    .route('/movies/:title') // route things that have movies and then a title through here
    .get(authJwtController.isAuthenticated, function (req, res) {
        if ('reviews' in req.query && req.query['reviews'] === 'true') {
            Movie.aggregate([
                {
                    $match: {
                        title: req.params['title']
                    }
                },
                {
                    $lookup: {
                        from: 'reviews',
                        localField: 'title',
                        foreignField: 'movieTitle',
                        as: 'reviews'
                    }
                },
                {
                    $addFields: {
                        avgRating: { $avg: '$reviews.rating' }
                    }
                },
                {
                    $sort: {
                        avgRating: -1
                    }
                }
            ]).exec(function (err, movies) {
                //console.log("match movies", movies.filter((m) => m.title === req.params['title']));
                if (err) return res.status(400).json(err);
                else if (movies.length === 0)
                    return res.status(400).json({ success: false, msg: 'No movie with that title exists.' });
                else res.json(movies[0]);
            });
        } else {
            Movie.findOne({ title: req.params['title'] }, (err, movie) => {
                if (err) res.status(400).json(err);
                else if (!movie)
                    return res.status(400).json({ success: false, msg: 'No movie with that title exists.' });
                else res.json(movie);
            });
        }
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        Movie.updateOne({ title: req.params['title'] }, req.body, { runValidators: true }, (err, movie) => {
            if (err) res.status(400).json({ success: false, msg: err.message });
            else if (movie.nModified === 0)
                res.status(400).json({ success: false, msg: 'No movie with that title exists.' });
            else res.json({ success: true, msg: 'Successfully updated movie.' });
        });
    })
    .delete(authJwtController.isAuthenticated, function (req, res) {
        Movie.deleteOne({ title: req.params['title'] }, (err, movie) => {
            if (err) res.status(400).json({ success: false, msg: err.message });
            else if (movie.deletedCount === 0)
                res.status(400).json({ success: false, msg: 'No movie with that title exists.' });
            else res.json({ success: true, msg: 'Successfully deleted movie.' });
        });
    });

router
    .route('/movies') // route for movies with no arguments
    .post(authJwtController.isAuthenticated, function (req, res) {
        var newMovie = new Movie(req.body);
        newMovie.save(function (err) {
            if (err) res.status(400).json({ success: false, msg: err.message });
            else res.json({ success: true, msg: 'Successfully created new movie.' });
        });
    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        if ('reviews' in req.query && req.query['reviews'] === 'true') {
            Movie.aggregate([
                {
                    $lookup: {
                        from: 'reviews',
                        localField: 'title',
                        foreignField: 'movieTitle',
                        as: 'reviews'
                    }
                },
                {
                    $addFields: {
                        avgRating: { $avg: '$reviews.rating' }
                    }
                }
            ]).exec(function (err, movies) {
                if (err) return res.status(400).json(err);
                else res.json(movies);
            });
        } else {
            Movie.find({}, (err, movies) => {
                if (err) return res.status(400).json(err);
                else res.json(movies);
            });
        }
    });

router
    .route('/reviews') // route for movies with no arguments
    .post(authJwtController.isAuthenticated, function (req, res) {
        // ensure movie in database before posting review
        Movie.findOne({ title: req.body.movieTitle }, (err, movie) => {
            if (err) res.status(400).json(err);
            else if (!movie) return res.status(400).json({ success: false, msg: 'No movie with that title exists.' });
            else {
                var newReview = new Review({ ...req.body, username: req.user.username });
                newReview.save(function (err) {
                    if (err) res.status(400).json({ success: false, msg: err.message });
                    else res.json({ success: true, msg: 'Successfully posted new review.' });
                });
            }
        });
    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        Review.find({}, (err, reviews) => {
            if (err) return res.status(400).json(err);
            else res.json(reviews);
        });
    });

app.use('/', router);

app.use((req, res) => res.status(405).send('Method not allowed'));

app.listen(process.env.PORT || 8080);
// module.exports = app; // for testing only
