require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

app.listen(3000, () => {
    console.log("Server is running on port 3000!");
})

const Pokemon = mongoose.model('pokemon', new mongoose.Schema(
    {
        name: String,
        type: String,
        level: Number,
        nature: String
    }
));

app.get('/api/pokemon', async (req, res) => {
    const pokemon = await Pokemon.find();
    res.send(pokemon);
    console.log("Fetched All Pokemon!");
})  

app.post('/api/pokemon', async (req, res) =>{
    const pokemon = new Pokemon(req.body);
    await pokemon.save();
    res.send(pokemon);
    console.log("Added New Pokemon: ", pokemon);
})