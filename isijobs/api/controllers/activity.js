const Activity = require('../models/activity')
const Subcategory = require('../models/subcategory')
const config = require('../config/config')
const boom = require("boom")
const base64Img = require('base64-img')
const path = require('path')
const sendJSONresponse = require('./shared')



async function listActivity(req,res,next){
    try {
        let subCategoryId = req.params.subcategoryId
        let activities = await Activity.find({subcategory:subCategoryId})
        sendJSONresponse(res,200,activities)
    } catch (error) {
      return next (error)
    }
}


async function createActivity (req, res, next){
   try {
        let newActivity = new Activity(req.body)
        newActivity.subcategory = req.params.subcategoryId
        let createdActivity = await newActivity.save()
        sendJSONresponse(res,200,createdActivity)
   } catch (error) {
       return next (error)
   }
}

async function editActivity (req, res, next){
 try {
      let updatedActivity = await Activity.findByIdAndUpdate(req.params.activityId, req.body, {new: true})
      sendJSONresponse(res,200, updatedActivity)
  
 } catch (error) {
     return next(error)
 }
  
}

async function deleteActivity (req, res, next){
  try {
          let removedActivity = await Activity.findByIdAndRemove(req.params.activityId)
          sendJSONresponse(res,200,removedActivity)
  } catch (error) {
      return next(error)
  }
}  




  module.exports ={ 
    listActivity,
    createActivity,
    editActivity,
    deleteActivity
  }



  