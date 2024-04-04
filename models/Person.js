    // models/Person.js
const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    name: String,
    ranking: Number,
    height: Number
});

const Person = mongoose.model('Person', personSchema);

module.exports = Person;
