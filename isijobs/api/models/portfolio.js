const mongoose = require('mongoose')
const Schema = mongoose.Schema


const infoSchema = new Schema({
    profilePicture: { type: String },
    name: {type: String, required: true },
    department: {type: String, required: true}, // especialidad
    residence: {type: String, required: true},
    birthDate: { type: Date, require: true},
    sex: {type: String, enum: ['H','M','NE'], required: true},
    activities: [{ type: Schema.Types.ObjectId, ref:"Activity" }]
})

const docSchema = new Schema({
    document: {type: String},
    name: {type: String}
})

const photosSchema = new Schema({
    photos: {type: String},
    description: {type: String}
})

const portfolioSchema = new Schema({
    information: {infoSchema, required: true},
    documents: [docSchema],
    photos: [photosSchema]
})

module.exports = mongoose.model('Portfolio', portfolioSchema)