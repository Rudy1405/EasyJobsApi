const mongoose = require('mongoose')
const Schema = mongoose.Schema

const phraseSchema = new Schema({
        frases: [String]
        })

        
module.exports = mongoose.model('Phrases', phraseSchema)