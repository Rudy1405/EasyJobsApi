const mongoose = require('mongoose')
const Schema = mongoose.Schema


const subcategroySchema = new Schema({
    category: {type: Schema.Types.ObjectId, ref:"Category"},
    name:{type: String, require: true}
})
//subc.activities.push()

module.exports = mongoose.model('Subcategory', subcategroySchema)