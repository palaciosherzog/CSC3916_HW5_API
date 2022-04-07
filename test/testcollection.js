let envPath = __dirname + '/../.env';
require('dotenv').config({ path: envPath });
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let User = require('../Users');
let Movie = require('../Movies');
let Review = require('../Reviews');
chai.should();

chai.use(chaiHttp);

let login_details = {
    name: 'test',
    username: 'email@email.com',
    password: '123@abc'
};

// random movies off of IMDB cause I don't watch movies
let movie_details = [
    {
        title: 'The Batman',
        yearReleased: 2022,
        genre: 'Action',
        actors: [
            {
                actorName: 'Zoe Kravitz',
                characterName: 'Catwoman'
            },
            {
                actorName: 'Robert Pattinson',
                characterName: 'Batman'
            },
            {
                actorName: 'Paul Dano',
                characterName: 'The Riddler'
            }
        ]
    },
    {
        title: 'Spider-Man: No Way Home',
        yearReleased: 2021,
        genre: 'Fantasy',
        actors: [
            {
                actorName: 'Tom Holland',
                characterName: 'Peter Parker'
            },
            {
                actorName: 'Zendaya',
                characterName: 'MJ'
            },
            {
                actorName: 'Benedict Cumberbatch',
                characterName: 'Doctor Strange'
            }
        ]
    },
    {
        title: 'Skyfall',
        yearReleased: 2012,
        genre: 'Adventure',
        actors: [
            {
                actorName: 'Daniel Craig',
                characterName: 'James Bond'
            },
            {
                actorName: 'Judi Dench',
                characterName: 'M'
            },
            {
                actorName: 'Javier Bardem',
                characterName: 'Silva'
            }
        ]
    },
    {
        title: 'Kingsman: The Secret Service',
        yearReleased: 2014,
        genre: 'Comedy',
        actors: [
            {
                actorName: 'Colin Firth',
                characterName: 'Harry Hart'
            },
            {
                actorName: 'Taron Egerton',
                characterName: "Gary 'Eggsy' Unwin"
            },
            {
                actorName: 'Samuel L. Jackson',
                characterName: 'Valentine'
            }
        ]
    },
    {
        title: 'Ghostbusters',
        yearReleased: 1984,
        genre: 'Comedy',
        actors: [
            {
                actorName: 'Bill Murray',
                characterName: 'Dr. Peter Venkman'
            },
            {
                actorName: 'Harold Ramis',
                characterName: 'Dr. Egon Spengler'
            },
            {
                actorName: 'Sigourney Weaver',
                characterName: 'Dana Barrett'
            }
        ]
    }
];

let movie_reviews = [
    {
        movieTitle: 'Ghostbusters',
        quote: 'I liked this movie',
        rating: 4
    },
    {
        movieTitle: 'Ghostbusters',
        quote: 'I cried butterfly tears.',
        rating: 5
    },
    {
        movieTitle: 'Kingsman: The Secret Service',
        quote: 'Fun, but brainless',
        rating: 3
    },
    {
        movieTitle: 'Skyfall',
        quote: 'Another dumb action movie.',
        rating: 1
    },
    {
        movieTitle: 'Spider-Man: No Way Home',
        quote: 'The best spider man is whoever',
        rating: 5
    },
    {
        movieTitle: 'The Batman',
        quote: 'It was better than many other DC movies.',
        rating: 4
    }
];

// from https://dev.to/sanderdebr/deep-equality-checking-of-objects-in-vanilla-javascript-5592
// adapted to remove all underscores from keys in a
// and to compare lists: only checks that every item in b is present in a, not vice versa
// also added console.logs of errors
const compareObjects = (a, b, print = true) => {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length != b.length) {
            console.log(`Arrays aren\'t the same length: a is of length ${a.length}, b is of length ${b.length}.`);
            return false;
        }
        return b.reduce((prev, bobj) => {
            let res = a.reduce((prev, aobj) => {
                return prev || compareObjects(aobj, bobj, false);
            }, false);
            if (!res) {
                console.log("Couldn't find match for", bobj, 'in', a);
            }
            return prev && res;
        }, true);
    }
    if (typeof a != 'object' || typeof b != 'object' || a == null || b == null) {
        if (print) {
            console.log('The values that were not equal were:', a, b);
        }
        return false;
    }
    let keysA = Object.keys(a).filter((k) => !k.startsWith('_')),
        keysB = Object.keys(b);
    if (keysA.length != keysB.length) {
        console.log(`Keys aren\'t the same length: a has ${keysA.length} keys, b has ${keysB.length} keys.`);
        return false;
    }
    for (let key of keysA) {
        if (!keysB.includes(key)) {
            console.log("B doesn't include the key:", key);
            return false;
        }
        if (!compareObjects(a[key], b[key], print)) return false;
    }
    return true;
};

describe('All Tests', () => {
    // test the sign up functionality and sign in functionality
    /*describe('/signup', () => {
        before((done) => {
            // delete test user if it exists so that we don't have issues
            User.deleteOne({ username: login_details.username }, (err, user) => done());
        });
        it('it should sign up and sign in and get a token', (done) => {
            chai.request(server)
                .post('/signup')
                .send(login_details)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    res.body.should.have.property('msg');
                    //follow-up to get the JWT token from signing in
                    chai.request(server)
                        .post('/signin')
                        .send(login_details)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.success.should.be.eql(true);
                            res.body.should.have.property('token');
                            done();
                        });
                });
        });
        it('it should fail signing in with an invalid password', (done) => {
            chai.request(server)
                .post('/signup')
                .send({ username: 'newemail@email.com', password: '123@abc' })
                .end((err, res) => {
                    //follow-up to get the JWT token from signing in
                    chai.request(server)
                        .post('/signin')
                        .send({ username: 'newemail@email.com', password: 'adjfad;fs' })
                        .end((err, res) => {
                            res.should.have.status(401);
                            res.body.success.should.be.eql(false);
                            res.body.msg.should.be.eql('Authentication failed.');
                            done();
                        });
                });
        });
        it('it should fail when signing in with an user that doesnt exist', (done) => {
            chai.request(server)
                .post('/signin')
                .send({ name: 'test', username: 'thisemaildoesntexist@gmail.com', password: 'no' })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.success.should.be.eql(false);
                    res.body.msg.should.be.eql('Authentication failed.');
                    done();
                });
        });
        it('it should fail when signing in without a password', (done) => {
            chai.request(server)
                .post('/signup')
                .send({ username: 'newemail@email.com', password: '123@abc' })
                .end((err, res) => {
                    //follow-up to get the JWT token from signing in
                    chai.request(server)
                        .post('/signin')
                        .send({ username: 'newemail@email.com' })
                        .end((err, res) => {
                            res.should.have.status(401);
                            res.body.success.should.be.eql(false);
                            res.body.msg.should.be.eql('Authentication failed.');
                            done();
                        });
                });
        });
        it('it should return an error when signing up with an already used email', (done) => {
            let new_login_details = JSON.parse(JSON.stringify(login_details));
            new_login_details.username = 'anewemail@email.com';
            chai.request(server)
                .post('/signup')
                .send(new_login_details)
                .end((err, res) => {
                    res.should.have.status(200);
                    //follow-up to try signing up with the already used one
                    chai.request(server)
                        .post('/signup')
                        .send(new_login_details)
                        .end((err, res) => {
                            console.log(res.body);
                            res.should.have.status(200);
                            res.body.success.should.be.eql(false);
                            done();
                        });
                });
        });
    });

    describe('/movies*', () => {
        let token = '';
        // before this test suite, sign up and sign in & save token
        before((done) => {
            chai.request(server)
                .post('/signin')
                .send(login_details)
                .end((err, res) => {
                    token = res.body.token;
                    done();
                });
        });

        describe('/movies POST', () => {
            before((done) => {
                Movie.deleteOne({ title: movie_details[0].title }, (err, movie) => done());
            });
            after((done) => {
                Movie.deleteOne({ title: movie_details[0].title }, (err, movie) => done());
            });
            it('it should add the valid movie', (done) => {
                chai.request(server)
                    .post('/movies')
                    .set('Authorization', token)
                    .send(movie_details[0])
                    .end((err, res) => {
                        console.log(res.body);
                        res.should.have.status(200);
                        done();
                    });
            });
            it('it should not succeed for a movie with an invalid genre', (done) => {
                let movie_copy = JSON.parse(JSON.stringify(movie_details[0]));
                movie_copy['genre'] = 'act';
                chai.request(server)
                    .post('/movies')
                    .set('Authorization', token)
                    .send(movie_copy)
                    .end((err, res) => {
                        console.log(res.body);
                        res.should.have.status(400);
                        done();
                    });
            });
            it('it should not succeed for a movie without actors', (done) => {
                let movie_copy = JSON.parse(JSON.stringify(movie_details[0]));
                delete movie_copy.actors;
                chai.request(server)
                    .post('/movies')
                    .set('Authorization', token)
                    .send(movie_copy)
                    .end((err, res) => {
                        console.log(res.body);
                        res.should.have.status(400);
                        done();
                    });
            });
            it('it should not succeed for a movie with invalid actors', (done) => {
                let movie_copy = JSON.parse(JSON.stringify(movie_details[0]));
                delete movie_copy.actors[0].characterName;
                chai.request(server)
                    .post('/movies')
                    .set('Authorization', token)
                    .send(movie_copy)
                    .end((err, res) => {
                        console.log(res.body);
                        res.should.have.status(400);
                        done();
                    });
            });
            it('it should not allow unauthorized access', (done) => {
                chai.request(server)
                    .post('/movies')
                    .end((err, res) => {
                        res.should.have.status(401);
                        res.text.should.be.eql('Unauthorized');
                        done();
                    });
            });
        });

        describe('/movies PUT', () => {
            it('it should return an error for this invalid method', (done) => {
                chai.request(server)
                    .put('/movies')
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(405);
                        res.text.should.eql('Method not allowed');
                        done();
                    });
            });
        });

        describe('/movies GET,DELETE,PUT', () => {
            before((done) => {
                Movie.insertMany(movie_details, (err, docs) => done());
            });
            after((done) => {
                Movie.deleteMany({ title: movie_details.map((m) => m.title) }, (err, docs) => done());
            });
            it('it should get all the movies added', (done) => {
                chai.request(server)
                    .get('/movies')
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.length(5);
                        compareObjects(res.body, movie_details).should.equal(true);
                        done();
                    });
            });
            it('it should get one movie', (done) => {
                chai.request(server)
                    .get('/movies/' + movie_details[0].title)
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        compareObjects(res.body, movie_details[0]).should.equal(true);
                        done();
                    });
            });
            it('it should not get a movie that does not exist', (done) => {
                chai.request(server)
                    .get('/movies/This Movie Doesnt Exist')
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(400);
                        res.body.success.should.equal(false);
                        res.body.msg.should.equal('No movie with that title exists.');
                        done();
                    });
            });
            it('it should delete one movie', (done) => {
                chai.request(server)
                    .delete('/movies/Skyfall')
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.success.should.be.eql(true);
                        chai.request(server)
                            .get('/movies')
                            .set('Authorization', token)
                            .end((err, res) => {
                                res.should.have.status(200);
                                res.body.should.have.length(4);
                                res.body.map((item) => item.title).should.not.include('Skyfall');
                                res.body.map((item) => item.title).should.include('The Batman');
                                done();
                            });
                    });
            });
            it('it should return not successful for deleting an item that doesnt exist', (done) => {
                chai.request(server)
                    .delete('/movies/This Movie Doesnt Exist')
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(400);
                        res.body.success.should.be.eql(false);
                        done();
                    });
            });
            it('it should update a movie correctly', (done) => {
                chai.request(server)
                    .put('/movies/' + movie_details[3].title)
                    .send({ genre: 'Action', yearReleased: 2013 })
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.success.should.be.eql(true);
                        chai.request(server)
                            .get('/movies/' + movie_details[3].title)
                            .set('Authorization', token)
                            .end((err, res) => {
                                res.should.have.status(200);
                                res.body.title.should.be.eq(movie_details[3].title);
                                res.body.yearReleased.should.be.eq(2013);
                                res.body.genre.should.be.eq('Action');
                                done();
                            });
                    });
            });
            it('it should return not successful for updating an item that doesnt exist', (done) => {
                chai.request(server)
                    .put('/movies/This Movie Doesnt Exist')
                    .send({ genre: 'Action', yearReleased: '2013' })
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(400);
                        res.body.success.should.be.eql(false);
                        done();
                    });
            });
            it("it shouldn't update an item where the update has an invalid value", (done) => {
                chai.request(server)
                    .put('/movies/' + movie_details[0].title)
                    .send({ genre: 'act', yearReleased: 2013 })
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(400);
                        console.log(res.body);
                        chai.request(server)
                            .get('/movies/' + movie_details[0].title)
                            .set('Authorization', token)
                            .end((err, res) => {
                                res.should.have.status(200);
                                res.body.yearReleased.should.be.eql(movie_details[0].yearReleased);
                                done();
                            });
                    });
            });
            it('it should return an error for updating the actors to an invalid value', (done) => {
                chai.request(server)
                    .put('/movies/' + movie_details[0].title)
                    .send({ yearReleased: 'hi', actors: movie_details[0].actors.slice(0, 2) })
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(400);
                        console.log(res.body);
                        done();
                    });
            });
        });
    });

    describe('/reviews', () => {
        let token = '';
        // before this test suite, sign up and sign in & save token
        before((done) => {
            chai.request(server)
                .post('/signin')
                .send(login_details)
                .end((err, res) => {
                    token = res.body.token;
                    Movie.insertMany(movie_details, (err, docs) => done());
                });
        });

        after((done) => {
            Review.deleteMany({ username: login_details.username }, (err, revs) => done());
        });

        describe('/reviews POST', () => {
            after((done) => {
                Review.deleteMany({ username: login_details.username }, (err, revs) => done());
            });
            it('it should add the review', (done) => {
                chai.request(server)
                    .post('/reviews')
                    .set('Authorization', token)
                    .send(movie_reviews[0])
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.success.should.equal(true);
                        res.body.msg.should.equal('Successfully posted new review.');
                        done();
                    });
            });
            it("it should not add the review for a movie that doesn't exist", (done) => {
                let newReview = JSON.parse(JSON.stringify(movie_reviews[0]));
                newReview.movieTitle = 'This Movie Does Not Exist';
                chai.request(server)
                    .post('/reviews')
                    .set('Authorization', token)
                    .send(newReview)
                    .end((err, res) => {
                        res.should.have.status(400);
                        res.body.success.should.equal(false);
                        res.body.msg.should.equal('No movie with that title exists.');
                        done();
                    });
            });
        });

        describe('/reviews', () => {
            before((done) => {
                Review.insertMany(
                    movie_reviews.map((r) => {
                        return { ...r, username: login_details.username };
                    }),
                    (err, docs) => done()
                );
            });
            it('it should get all the movies with reviews', (done) => {
                chai.request(server)
                    .get('/movies?reviews=true')
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.length(5);
                        res.body
                            .reduce((prev, obj) => {
                                let newMovie = JSON.parse(
                                    JSON.stringify(movie_details.filter((o) => o.title === obj.title)[0])
                                );
                                newMovie.reviews = movie_reviews
                                    .filter((r) => obj.title === r.movieTitle)
                                    .map((r) => {
                                        return { ...r, username: login_details.username };
                                    });
                                newMovie.avgRating =
                                    newMovie.reviews.reduce((prev, cur) => prev + cur.rating, 0) /
                                    newMovie.reviews.length;
                                return prev && compareObjects(obj, newMovie);
                            }, true)
                            .should.equal(true);
                        done();
                    });
            });
            it('it should get one movie with the review', (done) => {
                chai.request(server)
                    .get(`/movies/${movie_details[0].title}?reviews=true`)
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(200);
                        let newMovie = JSON.parse(JSON.stringify(movie_details[0]));
                        newMovie.reviews = movie_reviews
                            .filter((r) => movie_details[0].title === r.movieTitle)
                            .map((r) => {
                                return { ...r, username: login_details.username };
                            });
                        newMovie.avgRating =
                            newMovie.reviews.reduce((prev, cur) => prev + cur.rating, 0) / newMovie.reviews.length;
                        compareObjects(res.body, newMovie).should.equal(true);
                        done();
                    });
            });
            it('it should not get a movie that does not exist', (done) => {
                chai.request(server)
                    .get('/movies/This Movie Doesnt Exist?reviews=true')
                    .set('Authorization', token)
                    .end((err, res) => {
                        res.should.have.status(400);
                        res.body.success.should.equal(false);
                        res.body.msg.should.equal('No movie with that title exists.');
                        done();
                    });
            });
        });
    });*/
    describe('/search', () => {
        let token = '';
        // before this test suite, sign up and sign in & save token
        before((done) => {
            chai.request(server)
                .post('/signin')
                .send(login_details)
                .end((err, res) => {
                    token = res.body.token;
                    done();
                });
        });
        it('it should get movies based on the search string', (done) => {
            chai.request(server)
                .get('/movies/search?reviews=true')
                .send({ searchStr: 'The ' })
                .set('Authorization', token)
                .end((err, res) => {
                    console.log(res.body);
                    done();
                });
        });
        it('it should get movies based on the search string in actors', (done) => {
            chai.request(server)
                .get('/movies/search?reviews=true')
                .send({ searchStr: 'Dan' })
                .set('Authorization', token)
                .end((err, res) => {
                    console.log(res.body);
                    done();
                });
        });
    });
});
