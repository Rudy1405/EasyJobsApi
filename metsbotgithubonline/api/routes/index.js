module.exports = (app) => {

        const express = require('express')
        const email_controller = require('../controllers/email')
        const adminTools_controller = require('../controllers/adminTools')
        const phrases_controller = require('../controllers/phrases')
        const coachingTools_controller = require('../controllers/coachingTools')

        const api_routes = express.Router()
        const email_routes = express.Router()
        const adminTools_routes = express.Router()
        const phrases_routes = express.Router()
        const coach_routes = express.Router()
        const coach_msg = express.Router()
            ///rputes
        api_routes.use('/mail', email_routes)
        email_routes.get('/', email_controller.getMensaje)
        email_routes.post('/:uEmail', email_controller.saveEmail)
        email_routes.get('/tst/:dato', email_controller.getTEST)
        api_routes.use('/reminder', email_routes)
        email_routes.post('/:metsId/:msnId', email_controller.setReminder)

        api_routes.use('/admincrud', adminTools_routes)
        adminTools_routes.get('/', adminTools_controller.getAllUsers)
        adminTools_routes.get('/:idType/:usuId', adminTools_controller.getUser)
        adminTools_routes.post('/', adminTools_controller.createUser)
        adminTools_routes.put('/:usuId', adminTools_controller.updateUser)
        adminTools_routes.delete('/:usuId', adminTools_controller.deleteUser)

        api_routes.use('/frases', phrases_routes)
        phrases_routes.get('/', phrases_controller.getPhrase)
        phrases_routes.post('/:listId', phrases_controller.createPhrase)
        phrases_routes.put('/:listId', phrases_controller.updatePhrase)
        phrases_routes.delete('/:listId', phrases_controller.deletePhrase)

        api_routes.use('/coach', coach_routes)
        coach_routes.get('/gifinit/:uId', coachingTools_controller.sendAvatarInit)
        coach_routes.get('/sendAvatarBien/:uId', coachingTools_controller.sendAvatarBien)
        coach_routes.get('/sendAvatarSad/:uId', coachingTools_controller.sendAvatarSad)
        coach_routes.get('/sendAvatarAngry/:uId', coachingTools_controller.sendAvatarAngry)
        coach_routes.get('/infoReto/:metsId', coachingTools_controller.infoReto)
        coach_routes.get('/consultaReto/:metsId', coachingTools_controller.consultaReto)
        coach_routes.get('/consultaProgresoHoy/:metsId', coachingTools_controller.consultaProgresoHoy)
        coach_routes.post('/insertMotivo/:metsId/', coachingTools_controller.insertMotivo)


        api_routes.use('/msgs', coach_msg)
        coach_msg.get('/', coachingTools_controller.generaMsg)


        app.use('/api', api_routes)
    } // exports app