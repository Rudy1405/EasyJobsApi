const mongoose = require('mongoose')
const Schema = mongoose.Schema

const motivos = new Schema({
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String
    }

})


const userSchema = new Schema({
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true
    },
    metsId: { type: Number, required: true },
    metsName: { type: String, required: true },
    metaPasos: {
        type: Number
    },
    timeReminder: { type: Number },
    avatar: { type: Number },
    msnId: { type: String },
    motives: [motivos]
})




module.exports = mongoose.model('User', userSchema)