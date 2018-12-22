const User = require('../models/users')
const sendJSONresponse = require('./shared').sendJSONresponse


/// Posible: tener dos funciones diferentes con sus diferentes rutas una para los que dieron que ya estaban registrados y otro para los new new
async function botCreateUser(usuObj, req, res) {
    try {
        ///lets checkout if user already exists
        let theUser = await User.findOne({ "email": usuObj.email })
        if (theUser) {
            console.log("User geted succesfully status 200")
            let resbody = {
                    messages: [{
                        text: " 🤖 HOLA N U E V A M E N T E USUARIO: " + theUser.metsName + " :) jijij \n por comodidad te seguiré llamando por tu nombre de Facebook "
                    }],
                    set_attributes: {
                        usuEmail: theUser.email,
                        metsId: theUser.metsId,
                        metsName: theUser.metsName,
                        avatarId: theUser.avatar,
                        botId: theUser._id,
                        createdStatus: 1
                    }
                } ///resbody
            res.json(resbody)
        } ///if registered user
        else {
            let newUser = new User(usuObj);
            let createdUser = await newUser.save();
            if (createdUser) {
                console.log("User created succesfully status 200")
                let resbody = {
                        messages: [{
                            text: "Bonito nombre en Mets eh! \n 🤖 H O L A    U S U A R I O: " + createdUser.metsName + " 🤖  jijij \n por comodidad te seguiré llamando por tu nombre de Facebook "
                        }],
                        set_attributes: {
                            usuEmail: createdUser.email,
                            metsId: createdUser.metsId,
                            metsName: createdUser.metsName,
                            avatarId: createdUser.avatar,
                            botId: createdUser._id,
                            createdStatus: 1
                        }
                    } ///resbody
                res.json(resbody)
            } else {
                console.log("ERROR creating new USER status 400")
                let resbody = {
                        messages: [{
                            text: "Ooops, creo que ha habido una falla de manera interna con mi sistema, en otras palabras... \n no me siento bien :( puedes entrar a la pàgina de METS y reportar el problema o puedes intentar más tarde, solo escribe CHECAR CORREO "
                        }],
                        set_attributes: {
                            createdStatus: 0
                        }
                    } ///resbody
                res.json(resbody)
            } //ELSE not registered user
        } /// else registered user                  
    } catch (err) {
        console.log("Error creando el usuario ", err)
        let resbody = {
                messages: [{
                    text: "Ooops creo que hubo un error, ponte en contacto con nosotros desde la pagina de Mets para ver que ha sucedido, me siento malito :( "
                }],
                set_attributes: {
                    createdStatus: 2
                }
            } ///resbody
        res.json(resbody)
    } ////catch
} ///botCreateUser


//*****ADMIN FUNCTIONS FOR CRUD METSBOT USERS ******

async function createUser(req, res) {
    try {
        let newUser = new User(req.body)
        let createdUser = await newUser.save()
        if (createdUser)
            sendJSONresponse(res, 201, { msg: "Succesfully created a user", user: createdUser })
        else
            sendJSONresponse(res, 400, { msg: "bad body", sendedBody: req.body })
    } catch (error) {
        console.log("Error creating user from admin: ", error)
        sendJSONresponse(res, 400, { msg: "bad body", sendedBody: req.body })
    }
}

async function getAllUsers(req, res) {
    try {
        let usersList = await User.find({})
        if (usersList)
            sendJSONresponse(res, 201, usersList)
        else
            sendJSONresponse(res, 404, { msg: "No users founded" })
    } catch (error) {
        console.log("Error gettin all users from admin: ", error)
    }
}
async function getUser(req, res) {
    try {
        let idType = req.params.idType
        let usuId = req.params.usuId
        switch (idType) {
            case "mets":
                {
                    let theUser = await User.find({ "metsId": usuId })
                    if (theUser)
                        sendJSONresponse(res, 201, { msg: "Succesfully founded user", user: theUser })
                    else
                        sendJSONresponse(res, 404, { msg: "No user found with ID: " + usuId })
                    break
                }
            case "metsbot":
                {
                    let theUser = await User.findById(usuId)
                    if (theUser)
                        sendJSONresponse(res, 201, { msg: "Succesfully founded user", user: theUser })
                    else
                        sendJSONresponse(res, 404, { msg: "No user found with ID: " + usuId })
                    break
                }
            default:
                {
                    console.log("Bad type, only mets or metsbot id allowed")
                    sendJSONresponse(res, 404, { msg: "El tipo de id es incorrecto, solo especifica si mets o metsbot, tu diste " + idType })
                    break
                }
        }


    } catch (error) {
        console.log("Error gettin user from admin: ", error)
        res.json("Error  getin users, check the path")
    }
}


async function updateUser(req, res) {
    try {
        let updatedUser = await User.findByIdAndUpdate(req.params.usuId, req.body, { new: true })
        if (updatedUser)
            sendJSONresponse(res, 201, { msg: "Succesfully updated user", user: updatedUser })
        else
            sendJSONresponse(res, 404, { msg: "No user found with ID: " + req.params.usuId })

    } catch (error) {
        console.log("Error updatin user from admin: ", error)
    }
}

async function deleteUser(req, res) {
    try {
        let deletedUser = await User.findByIdAndRemove(req.params.usuId)
        if (deletedUser)
            sendJSONresponse(res, 201, { msg: "Succesfully deleted user", user: deletedUser })
        else
            sendJSONresponse(res, 404, { msg: "No user found with ID: " + req.params.usuId })

    } catch (error) {
        console.log("Error deleatin user from admin: ", error)
    }
}



module.exports = {
    botCreateUser,
    createUser,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
}