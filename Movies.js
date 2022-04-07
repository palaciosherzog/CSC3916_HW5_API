var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

try {
    mongoose.connect(
        process.env.DB,
        { useNewUrlParser: true, useUnifiedTopology: true }
    );
} catch (error) {
    console.log('Movies file could not connect using mongoose');
    console.log(error);
}
mongoose.set('useCreateIndex', true);

// actor schema
var ActorSchema = new Schema({
    actorName: { type: String, required: true },
    characterName: { type: String, required: true }
});

// movie schema
var MovieSchema = new Schema({
    title: { type: String, required: true, index: { unique: true } },
    yearReleased: { type: Number, required: true },
    imageUrl: { type: String },
    genre: {
        type: String,
        enum: [
            'Action',
            'Adventure',
            'Comedy',
            'Drama',
            'Fantasy',
            'Horror',
            'Mystery',
            'Western'
        ],
        required: true
    },
    actors: {
        type: [ActorSchema],
        required: true,
        validate: [v => v.length >= 3, 'Path `{PATH}` needs at least 3 items']
    }
});

// return the model to the server
module.exports = mongoose.model('Movie', MovieSchema);
