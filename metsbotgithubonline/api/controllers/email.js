const mysql = require('mysql');
const User = require('../models/users')
const createUser = require('./adminTools').botCreateUser

/// TODO: change te call of this pool to a function  like the shared.js
var pool = mysql.createPool({
    connectionLimit: 10,
    host: '***',
    port: '**',
    user: '***',
    password: '****',
    database: '*******'
});

///https://glacial-retreat-84103.herokuapp.com/api/mail/
//http://ubisalud.cs.buap.mx:5002/api/mail
function getMensaje(req, res, next) {
    let mensaje = "Has accedido a la api desde HIGIA :D "

    let resbody = {
            messages: [{
                text: mensaje
            }]
        } ///resbody
    res.json(resbody)
} ///fucniton


function getTEST(req, res, next) {

    pool.query('SELECT * from usuarios', function(error, results, fields) {
        if (error) throw error;
        console.log("this are the fields  ", fields)
        console.log('The solution is on the browser: ');
        console.log("here you got... your dato: ", req.params.dato)
        res.json(results)

    });
}


function saveEmail(req, res, next) {
    let svEmail = req.params.uEmail
    console.log("lets find:   ", svEmail)
    console.log("///////////////////")
    let quer = 'SELECT * FROM `usuarios` WHERE `Email` = "' + svEmail + '"'
    pool.query(quer, function(error, results, fields) {
        if (error) throw error;
        if (results[0] == null) {
            console.log("No se encontro el usuario")
            let resbody = {
                    messages: [{
                        text: "Este email " + svEmail + " no lo he encontrado registrado en METS :o "
                    }],
                    set_attributes: {
                        usuEmail: svEmail,
                        createdStatus: 0
                    }
                } ///resbody
            res.json(resbody)
        } else {
            let newUsu = {
                metsId: results[0].IdUsuario,
                metsName: results[0].NombreUsuario,
                email: results[0].Email,

            }

            ///Check metsId should be a number
            //// lets check the avatar ID of the user
            quer = 'SELECT `IdAvatar` FROM `ajustes` WHERE `IdUsuario`=' + newUsu.metsId
            pool.query(quer, function(error, results, fields) {
                    if (error) throw error;
                    newUsu.avatar = results[0].IdAvatar
                    createUser(newUsu, req, res)
                }) ///new query
        } //else
    }); //pool query
} // function SaveEmail


async function setReminder(req, res) {

    try {
        let usuId = req.params.metsId
        let msnId = req.params.msnId
        let usuReminder = req.body.reminderHr
        let botID = req.body.botId
        console.log("Set reminder")
        console.log(" Mets sql ID " + usuId + " type; " + typeof(usuId))
        console.log(" The Hr reminder " + usuReminder + " type; " + typeof(usuReminder))
        console.log(" FB msnId " + msnId + " type; " + typeof(msnId))
        console.log(" chatbotid mongo " + botID + " type; " + typeof(botID))
            ///now lets find the metaspasos of our user
        let quer = 'SELECT `MetaPasos` FROM `bitacoraretosusuario` WHERE (`IdUsuario`=' + usuId + ' AND`Status`="En Proceso")'
        await pool.query(quer, function(error, results, fields) {
                if (error) throw error;
                if (results[0] == null) {
                    console.log("No se encontro el metapasos")
                    let resbody = {
                            messages: [{
                                text: "Parece que aún no te has incscrito a ningún reto, ve a tu bitácora en Mets, aquí abajo en el menú está el enlace, inscríbete a un reto  y puedes regresar para configurar tu recordatorio sólo dime DEFINIR RECORDATORIO :)  "
                            }],
                            set_attributes: {
                                metsId: usuId,
                                botID: botID,
                                savedReminderStatus: 0
                            }
                        } ///resbody
                    res.json(resbody)
                } else {
                    setValues(req, res, results, usuId, usuReminder, botID, msnId)
                }
            }) ///new query 
    } catch (error) {
        console.log("Error seting reminder:  ", error)
        res.json({ msg: "Error, checa el path", err: error })
    }
}

/*
 * usuId stands for the METS user (SQL)
 * botId stands for the Metsbot user (mongodb)
 * msnId stands for the Facebook Msn unique ID 
 */

async function setValues(req, res, results, usuId, usuReminder, botID, msnId) {
    try {
        console.log("meta diara", results[0].MetaPasos, "  and reminder is: ", usuReminder)
        let updatableData = {
            metaPasos: results[0].MetaPasos,
            timeReminder: usuReminder,
            msnId: msnId
        }
        let updatedUsu = await User.findByIdAndUpdate(botID, updatableData, { new: true })
        if (updatedUsu) {
            let resbody = {
                    messages: [{
                        text: "Perfecto, tu meta actual diaria es alcanzar los " + updatedUsu.metaPasos + " yo te creo capaz de ello. También te mandaré tu progreso a las " + updatedUsu.timeReminder + " para ver como andas de ese sedentarismo :D"
                    }],
                    set_attributes: {
                        metsId: usuId,
                        usuEmail: updatedUsu.email,
                        metsId: updatedUsu.metsId,
                        botID: botID,
                        savedReminderStatus: 1
                    }
                } ///resbody
            res.json(resbody)
        } else {
            let resbody = {
                    messages: [{
                        text: "Oops al parecer no te he encontrado en la plataforma Mets, revisa que estes correctamente en ella o entra a la pagina y en la seccion de contacto mandanos un mensaje con este error."
                    }],
                    set_attributes: {
                        usuEmail: updatedUsu.email,
                        metsId: updatedUsu.metsId,
                        savedReminderStatus: 0
                    }
                } ///resbody
            res.json(resbody)
        }
    } catch (error) {
        console.log("Error in serValue: ", error)
        res.json({ msg: "Error, checa el path", err: error })
    }
}

async function setValuesDummy(req, res, results, usuId, usuReminder, botID, msnId) {

    try {
        ///now lets find the metaspasos of our user
        let MetaPasos = results[0].MetaPasos
        console.log("meta diara", MetaPasos, "  and reminder is: ", usuReminder)
        let resbody = {
                messages: [{
                    text: "Meta pasos" + MetaPasos + " recordatorio a las: " + usuReminder +
                        "Usuario de Mets: " + usuId + " Usuario de mongo: " + botID + " usu the msn: " + msnId
                }],
                set_attributes: {
                    metsId: usuId,
                    botID: botID,
                    savedReminderStatus: 1
                }
            } ///resbody
        res.json(resbody)


    } catch (error) {
        console.log("Error seting reminder:  ", error)
        res.json({ msg: "Error, checa el path", err: error })
    }
}

function saveEmailDummy(req, res, next) {
    let svEmail = req.params.uEmail
    console.log("This is saveEmail var:   ", svEmail)
    console.log("///////////////////")
    console.log("This is params:  ", req.params.uEmail)

    let resbody = {
            messages: [{
                text: "Este es tu email " + svEmail + " Gracias por ser un usuario de prueba pronto tendremos esta y mas funciones, puedes avisarle a tu evaluador que ya terminaste :) "
            }],
            set_attributes: {
                usuEmail: svEmail
            }
        } ///resbody
    res.json(resbody)
} // function


module.exports = {
    getMensaje,
    getTEST,
    saveEmail,
    setReminder,
    saveEmailDummy,
}











/*
        let pais;
        let ucpais;
        let cod_pais;

        let resbody = {
            messages: [
                {
                    text: "Me encanta ese pais" + pais
                }
            ],
            set_attributes:{
                namepais: pais,
                ucpais: ucpais,
                cod_pais: cod_pais
            }
        }

        resString = JSON.stringify(resbody)
        resJson = JSON.parse(resString) /// este se manda
*/