const Category = require('../models/category')
const config = require('../config/config')
const boom = require("boom")
const base64Img = require('base64-img')
const path = require('path')
const sendJSONresponse = require('./shared')



  async function listCategories(req,res,next){
      try {
          let categories = await Category.find({})
          sendJSONresponse(res,200,categories)
      } catch (error) {
        return next (error)
      }
  }

  async function createCategory (req, res, next){
     try {
            const name = req.body.name
            const subcategories = req.body.subcategories
            if (!name) /// subcategories too
            {
             throw boom.badRequest('El nombre es necesario')
            }
           let category = new Category({
             name: name,
             subcategories: subcategories,
           })
           if (req.body.image) {  
            let fileName = Date.now();
            let filepath = base64Img.imgSync(
              req.body.image,
              path.join("/public/images", "category"),
              fileName
            );
            category.image = "/images/category/" + fileName + path.extname(filepath);
          }          
          category = await category.save()
          sendJSONresponse(res,201, category)
             
     } catch (error) {
         return next (error)
     }
  }

  async function editCategory (req, res, next){
   try {
    //// modify imgae
        let updatedCategory = await Category.findByIdAndUpdate(req.params.categoryId, req.body, {new: true})
        sendJSONresponse(res,200, updatedCategory)
    
   } catch (error) {
       return next(error)
   }
    
  }

  async function deleteCategory (req, res, next){
    try {
            let removedCategory = await Category.findByIdAndRemove(req.params.categoryId)
            sendJSONresponse(res,200,removedCategory)
    } catch (error) {
        return next(error)
    }
  }  

  module.exports ={
    listCategories,
    createCategory,
    editCategory,
    deleteCategory
  }