const express = require('express');
const multer = require('multer');
const csv = require('fast-csv');
const mongoose = require('mongoose');
const cors = require('cors');
const Person = require('./models/Person');
const stream = require('stream');
const dotenv = require('dotenv').config();
const app = express();
const upload = multer();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const corsUrl = "http://localhost:3000" 
// const corsUrl = "https://keen-tapioca-848e6d.netlify.app"; 
const corsUrl = "*.netlify.app";
app.use(cors(
    {
        origin : [corsUrl],
        credentials: true
        }
));

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Error connecting to MongoDB:', error));

    
app.get('/', async (req, res) => {
    console.log("GET")
    res.json({message : "Hello, world! Its dummy get method!"});

});


app.post('/upload', upload.single('csvFile'), async (req, res) => {
    const results = [];

    const bufferStream = new stream.PassThrough();
    // console.log("bufferStream==========================",bufferStream);

    bufferStream.end(req.file.buffer);
    // console.log("req.file.buffer==========================",req.file.buffer);

    bufferStream
        .pipe(csv.parse({ headers: true }))
        .on('error', error => console.error(error))
        .on('data', async (data) => {
            console.log("data=============",data);
            const ranking = parseFloat(data.Ranking);
            const height = parseFloat(data.Height);

            if (!isNaN(ranking) && !isNaN(height)) {
                const person = new Person({
                    name: data.Name,
                    ranking: ranking,
                    height: height
                });

                try {
                    const savedPerson = await person.save();
                    results.push(savedPerson);
                } catch (error) {
                    console.error('Error saving person:', error);
                }
            } else {
                console.error('Invalid ranking or height values:', data);
            }
        })
        .on('end', () => {
            res.json(results);
        });
});


app.get('/players', async (req, res) => {
    try {
        const players = await Person.find();
        res.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.delete('/drop-collection', async (req, res) => {
    try {
        await Person.deleteMany({}); // Drop the entire collection
        res.status(200).json({ message: 'Collection dropped successfully' });
    } catch (error) {
        console.error('Error dropping collection:', error);
        res.status(500).json({ error: 'An error occurred while dropping the collection' });
    }
});



app.put('/edit-player/:id', async (req, res) => {
    const playerId = req.params.id;
    const { name, ranking, height } = req.body;

    try {
        // Find the player by ID and update their information
        const updatedPlayer = await Person.findByIdAndUpdate(playerId, { name, ranking, height }, { new: true });
        res.status(200).json(updatedPlayer);
    } catch (error) {
        console.error('Error editing player:', error);
        res.status(500).json({ error: 'An error occurred while editing the player' });
    }
});


app.delete('/players/:id', async (req, res) => {
    try {
        // Find and delete the player by ID
        const deletedPlayer = await Person.findByIdAndDelete(req.params.id);
        if (!deletedPlayer) {
            return res.status(404).json({ message: 'Player not found' });
        }
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
