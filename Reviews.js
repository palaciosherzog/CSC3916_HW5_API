var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

try {
    mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
} catch (error) {
    console.log('Reviews file could not connect using mongoose');
    console.log(error);
}
mongoose.set('useCreateIndex', true);

// review schema
var ReviewSchema = new Schema({
    username: { type: String, required: true },
    movieTitle: { type: String, required: true },
    quote: { type: String, required: true },
    rating: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5] // only allow these ratings
    }
});

// return the model to the server
module.exports = mongoose.model('Review', ReviewSchema);
