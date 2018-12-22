const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ActivitySchema = new Schema({
    subcategory: {type: Schema.Types.ObjectId, ref:"Subcategory"},
    name:{type: String, require: true},
})


module.exports = mongoose.model('Activity', ActivitySchema)