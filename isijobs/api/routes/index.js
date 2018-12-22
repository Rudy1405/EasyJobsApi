module.exports = (app) => { // declaracion para exportar el modulo
    const express = require('express') /// se necesita express
    const passport = require('passport')
    require('../config/passport')
    const category_controller = require('../controllers/category')
    const subcategory_controller = require('../controllers/subCategory')
    const activity_controller = require('../controllers/activity')
    const authentication_controller = require ('../controllers/authentication');
    const boom = require("boom")

    // Middleware to require login/authentication
    const require_authentication = passport.authenticate('jwt', {
        session: false
    })
  
    const require_login = passport.authenticate('local', {
        session: false
    })

    const api_routes = express.Router() // se crea el modelo router que contiene a todos
    const auth_routes = express.Router()
    const category_routes = express.Router()
    const subcategory_routes = express.Router()
    const activity_routes = express.Router()
    ///Routes

    api_routes.use('/auth', auth_routes)
        auth_routes.post('/register', authentication_controller.register)
        auth_routes.post('/login', require_login ,authentication_controller.login)
        auth_routes.post('/loginfb',require_login,authentication_controller.facebookLogin)
        auth_routes.post('/lostpassword',authentication_controller.forgotPassword)

    api_routes.use('/category', category_routes)
        category_routes.get('/',require_authentication, category_controller.listCategories)
        category_routes.post('/',require_authentication, authentication_controller.roleAuthorization('Admin'),category_controller.createCategory)
        category_routes.put('/:categoryId',require_authentication,authentication_controller.roleAuthorization('Admin'), category_controller.editCategory)
        category_routes.delete('/:categoryId',require_authentication,authentication_controller.roleAuthorization('Admin'), category_controller.deleteCategory)

    api_routes.use('/category/:categoryId/subcategory',subcategory_routes)
        subcategory_routes.get('/:categoryId',require_authentication,subcategory_controller.listSubCategories)
        subcategory_routes.post('/',require_authentication,authentication_controller.roleAuthorization('Admin'),subcategory_controller.createSubCategory)
        subcategory_routes.put('/:subcategoryId',require_authentication,authentication_controller.roleAuthorization('Admin'),subcategory_controller.editSubCategory)
        subcategory_routes.delete('/:subcategoryId',require_authentication,authentication_controller.roleAuthorization('Admin'),subcategory_controller.deleteSubCategory)
 
    api_routes.use('/category/:categoryId/subcategory/:subcategoryId/activity',activity_routes)
        activity_routes.get('/:subcategoryId',require_authentication,activity_controller.listActivity)
        activity_routes.post('/',require_authentication,authentication_controller.roleAuthorization('Admin'),activity_controller.createActivity)
        activity_routes.put('/:activityId',require_authentication,authentication_controller.roleAuthorization('Admin'),activity_controller.editActivity)
        activity_routes.delete('/:activityId',require_authentication,authentication_controller.roleAuthorization('Admin'),activity_controller.deleteActivity)
        

    app.use ('/api', api_routes)    // Cuando se llega aqui se usa la ruta /API y la funcion apiroutes que es esta
}// end module.exports

