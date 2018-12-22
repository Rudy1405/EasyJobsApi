const User = require('../models/users')
const mysql = require('mysql');
var request = require('request')
var schedule = require('node-schedule');

///Token to send msg in metsbot api 
let token = "***********"
    //********** */    
    //Pool config for Mysql conetion 
var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    port: '1111',
    user: '****',
    password: '***',
    database: '***'
});


/*
path on server
link for json api https://docs.chatfuel.com/api/json-api/json-api
*/


async function insertMotivo(req, res) {
    try {
        let userID = req.params.metsId
        let motivo = new Object({ motives: req.body.motive })

        let userWithMotivo = await User.findOneAndUpdate(userID, { $push: { motives: motivo } }, { safe: true, upsert: true }, )
        if (userWithMotivo) {
            resbody = {
                    messages: [{
                        text: "Ok, ya veo"
                    }],
                    set_attributes: {
                        metsId: userID,
                        insertMotivoStatus: 1
                    }
                } ///resbody  
        } else {
            console.log("Not user founded to put a motivo")
            resbody = {
                    messages: [{
                        text: "No te veo como usuario en metsbot, ingresa a la pagina de ubisalud para reportar este problema"
                    }],
                    set_attributes: {
                        metsId: userID,
                        insertMotivoStatus: 0
                    }
                } ///resbody  
        }
        res.json(resbody)
    } catch (error) {
        console.log("Error insertando MOTIVO in user ", error)
    }
}


async function consultaProgresoHoy(req, res) {
    let metsUId = req.params.metsId
    let resbody
    let quer = 'SELECT * FROM `detalle_diario` WHERE `Status`= 1 AND `IdUsuario`=' + metsUId
    console.log("progreso del  dia de HOY para el usu de METS:", metsUId)
    if (metsUId == undefined) {
        console.log("Usuario no registrado en metsbot")
        throw error
    }
    try {
        let userData = await User.findOne({ "metsId": metsUId })
        if (userData) {
            pool.query(quer, function(error, results, fields) {
                    if (error) throw error;
                    console.log("DiaCumplido", results[0].DiaCumplido, " \n pasos lleva ", results[0].PasosHechos, " \n La fecha ", results[0].FechaDetalle)
                    if (results[0] == null) {
                        console.log("No se encontro el cosas dela bitacora")
                        resbody = {
                                messages: [{
                                    text: "Parece que aún no te has incscrito a ningún reto, ve a tu bitácora en Mets, aquí abajo en el menú está el enlace, inscríbete a un reto  y puedes regresar para configurar tu recordatorio sólo dime DEFINIR RECORDATORIO :) "
                                }],
                                set_attributes: {
                                    metsId: metsUId,
                                    consultaRetoHoyStatus: 0
                                } ////consultaRetoHoyStatus da 0 si no hay reto eso se ve en chatfuel si es 1 es porque si encontro al usuario
                            } ///resbody         
                    } else {
                        if (results[0].DiaCumplido == 1) { ///SI en mets me dice que ya se cumplio el reto no hacemos nada mas que felicitar
                            resbody = {
                                    messages: [{
                                        text: "Wow!! hoy has logrado hacer: " + results[0].PasosHechos + " pasos."
                                    }],
                                    set_attributes: {
                                        metsId: metsUId,
                                        consultaRetoHoyStatus: 1,
                                        porcentajeHechoHoy: 100
                                    }
                                } ///resbody
                        } else {
                            ///SI el reto aun no se cumple entonces hay que sacar porcentaje de progreso
                            let porcentajeHecho = (results[0].PasosHechos * 100) / userData.metaPasos
                            resbody = {
                                messages: [{
                                    text: "Bien, analizando tu información tu reto es lograr " + userData.metaPasos + " al día, déjame ver..."
                                }],
                                set_attributes: {
                                    metsId: metsUId,
                                    consultaRetoHoyStatus: 1,
                                    porcentajeHechoHoy: porcentajeHecho,
                                    PasosHechosHoy: results[0].PasosHechos

                                } /// porcentaje hecho es unatributo que mandamos para que las reacciones de los gifs y dialogo hagan su trabajo
                            }
                        } ///else de dia cumpplido = 1
                    } ///else dia results 0 = null
                    res.json(resbody)
                }) //query 
        } //if userData
        else {
            console.log("Not user founded")
        }
    } catch (err) {
        console.log("Erro en consultaProgresoHoy: ", err)
    }

} //consultaProgresoHoy

///llamada cuando el usuario pide informacion de su resto actual
function infoReto(req, res) {
    console.log("Info Reto")
    let metsUId = req.params.metsId
    let resbody
    let quer = 'SELECT * FROM `bitacoraretosusuario` WHERE (`IdUsuario` =' + metsUId + ' AND`Status`="En Proceso")'
    pool.query(quer, function(error, results, fields) {
            if (error) throw error;
            if (results[0] == null) {
                console.log("No se encontro cosas de la bitacora")
                resbody = {
                        messages: [{
                            text: "Parece que aun no te has incscrito a ningún reto, ve a tu bitácora en Mets, aquí abajo en el menú está el enlace, inscríbete a un reto  y puedes regresar para configurar tu recordatorio, sólo dime DEFINIR RECORDATORIO :) "
                        }],
                        set_attributes: {
                            metsId: metsUId,
                            infoRetoStatus: 0
                        }
                    } ///resbody         
            } else {
                console.log("Se encontro info de la bitacora")
                resbody = {
                    messages: [{
                        text: "🤖 BIP BUP BIP 🤖"
                    }],
                    set_attributes: {
                        metsId: metsUId,
                        infoRetoStatus: 1,
                    }
                }
            }
            res.json(resbody)
        }) //query  
}
///llamada cuando el usuario pide SU PROGRESO del reto actual 
function consultaReto(req, res) {
    console.log("progreso del  Reto")
    let metsUId = req.params.metsId
    let resbody
    let quer = 'SELECT * FROM `bitacoraretosusuario` WHERE (`IdUsuario` =' + metsUId + ' AND`Status`="En Proceso")'
    pool.query(quer, function(error, results, fields) {
            if (error) throw error;
            if (results[0] == null) {
                console.log("No se encontro el cosas dela bitacora")
                resbody = {
                        messages: [{
                            text: "Parece que aun no te has incscrito a ningún reto, ve a tu bitácora en Mets, aquí abajo en el menú está el enlace, inscríbete a un reto  y puedes regresar para configurar tu recordatorio, sólo dime DEFINIR RECORDATORIO :)  "
                        }],
                        set_attributes: {
                            metsId: metsUId,
                            consultaRetoStatus: 0
                        }
                    } ///resbody     	
            } else {
                console.log("DiasCumplidos:", results[0].DiasCumplidos, "PorcentajeHecho: ", results[0].PorcentajeHecho)
                resbody = {
                    messages: [{
                        text: "Bien, analizando tu información tu reto es lograr " + results[0].MetaPasos + " al día, durante " + results[0].DiasTotales
                    }],
                    set_attributes: {
                        metsId: metsUId,
                        consultaRetoStatus: 1,
                        porcentajeHecho: results[0].PorcentajeHecho,
                        diasCumplidos: results[0].DiasCumplidos

                    } /// porcentaje hecho es unatributo que mandamos para que las reacciones de los gifs y dialogo hagan su trabajo
                }
            }
            res.json(resbody)
        }) //query  
}
async function sendAvatarInit(req, res) {
    let metsWebId = req.params.uId
    let gifUrl
    let resbody

    console.log("Check avatar params Mets webId : ", metsWebId)
    try {
        let userData = await User.findOne({ "metsId": metsWebId })
        if (userData) {

            // console.log("userDAta:   ",userData)

            switch (userData.avatar) {
                case 1:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/1feliz.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 2:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/2feliz.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 3:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/3feliz.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 4:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/4feliz.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                default:
                    {
                        console.log("Bad number of GIF")
                    }
            } ///switch
            res.json(resbody)
        } ///if userData exists
        else {
            console.log("userDAta BAD, is not a user in metsbot database")
            console.log(userData)
        } ///if user dnt exists

    } catch (err) {
        console.log("Hubo un error al conseguir el Avatar  ", err)
    }


} /// sendAvatarInit

async function sendAvatarMad(req, res) {
    let metsWebId = req.params.uId
    let gifUrl
    let resbody

    console.log("Check avatar params Mets webId : ", metsWebId)
    try {
        let userData = await User.findOne({ "metsId": metsWebId })
        if (userData) {

            // console.log("userDAta:   ",userData)

            switch (userData.avatar) {
                case 1:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/1mad.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 2:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/2mad.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 3:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/3mad.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 4:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/4mad.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                default:
                    {
                        console.log("Bad number of GIF")
                    }
            } ///switch
            res.json(resbody)
        } ///if userData exists
        else {
            console.log("userDAta BAD, is not a user in metsbot database")
            console.log(userData)
        } ///if user dnt exists

    } catch (err) {
        console.log("Hubo un error al conseguir el Avatar  ", err)
    }


} /// sendAvatarMad


async function sendAvatarBien(req, res) {
    let metsWebId = req.params.uId
    let gifUrl
    let resbody

    console.log("Check avatar bien params Mets webId : ", metsWebId)
    try {
        let userData = await User.findOne({ "metsId": metsWebId })
        if (userData) {

            // console.log("userDAta:   ",userData)

            switch (userData.avatar) {
                case 1:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/1muybien.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 2:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/2muybien.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 3:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/3muybien.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 4:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/4muybien.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                default:
                    {
                        console.log("Bad number of GIF")
                    }
            } ///switch
            res.json(resbody)
        } ///if userData exists
        else {
            console.log("userDAta BAD, is not a user in metsbot database")
            console.log(userData)
        } ///if user dnt exists

    } catch (err) {
        console.log("Hubo un error al conseguir el Avatar  ", err)
    }


} /// sendAvatarBien

async function sendAvatarSad(req, res) {
    let metsWebId = req.params.uId
    let gifUrl
    let resbody

    console.log("Check avatar sad params Mets webId : ", metsWebId)
    try {
        let userData = await User.findOne({ "metsId": metsWebId })
        if (userData) {

            // console.log("userDAta:   ",userData)

            switch (userData.avatar) {
                case 1:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/1triste.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 2:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/2triste.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 3:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/3triste.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 4:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/4triste.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                default:
                    {
                        console.log("Bad number of GIF")
                    }
            } ///switch
            res.json(resbody)
        } ///if userData exists
        else {
            console.log("userDAta BAD, is not a user in metsbot database")
            console.log(userData)
        } ///if user dnt exists

    } catch (err) {
        console.log("Hubo un error al conseguir el Avatar  ", err)
    }


} /// sendAvatarSAd

async function sendAvatarAngry(req, res) {
    let metsWebId = req.params.uId
    let gifUrl
    let resbody

    console.log("Check avatar angy params Mets webId : ", metsWebId)
    try {
        let userData = await User.findOne({ "metsId": metsWebId })
        if (userData) {

            // console.log("userDAta:   ",userData)

            switch (userData.avatar) {
                case 1:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/1enojado.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 2:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/2enojado.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 3:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/3enojado.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                case 4:
                    {
                        gifUrl = "https://ubisalud.cs.buap.mx/mets/img/metsbotgifs/4enojado.gif"
                        resbody = {
                            "messages": [{
                                "attachment": {
                                    "type": "image",
                                    "payload": {
                                        "url": gifUrl
                                    }
                                }
                            }]
                        } ///resbody
                        break
                    }
                default:
                    {
                        console.log("Bad number of GIF")
                    }
            } ///switch
            res.json(resbody)
        } ///if userData exists
        else {
            console.log("userDAta BAD, is not a user in metsbot database")
            console.log(userData)
        } ///if user dnt exists

    } catch (err) {
        console.log("Hubo un error al conseguir el Avatar  ", err)
    }


} /// sendAvatarInit

// Function for reminder que recordatra a la gente su progreso
/// y se activara a cada hora al min 30 
var rA = schedule.scheduleJob('10 * * * *', function() {
    console.log("Hora de checar los usuarios con recordatorio")
    console.log("Son las " + getCurrentHour())
    reminderAlert()
});
var sA = schedule.scheduleJob('55 * * * *', function() {
    console.log("Hora de checar los usuarios para SEDENTARIO ALERT")
    let hora = getCurrentHour()
    console.log("Son las " + hora)
    if (hora > 12 && hora <= 20) /// definimos que las alertas de sedentarismo no ocurran de las 20hr a las 12hr
        sedentarioAlert()
});


async function sedentarioAlert() {

    try {

        let usersInHour = await User.find({})
        if (usersInHour) {
            for (const i in usersInHour) {
                let quer = 'SELECT SUM(`PasosHechos`) as PasosHechos FROM actividadporhora WHERE `IdUsuario`=' + usersInHour[i].metsId + ' AND `Fecha`= CURRENT_DATE AND (`IdHora` = (SELECT HOUR(CURRENT_TIME()))-1 OR `IdHora` = (SELECT HOUR(CURRENT_TIME ())) -2 )'
                pool.query(quer, function(error, results, fields) {
                    if (error) throw error;
                    /*
                        tomamos como promedio marcar como advertencia de sedentarismo un numero menor a 600
                        pasos basandonos en que un dia de actividad consta de aprox 12hr y que el reto
                        mas basico son dar 4000 pasos al dia, 4000/12 = 333.33 siendo esta la minima de pasos
                        por hora y como el query checa los pasos dados las ultimas 2HRS 333.33*2 = 666 
                        Solo dejamos un margen de tolerancia de 66 pasos 
                        results[0].PasosHechos < 600
                    */
                    console.log("Usuario #" + i)
                        //console.log(usersInHour[i].metsName)
                    if (results[0].PasosHechos < 100) {
                        let pasitos = results[0].PasosHechos
                        if (pasitos == null)
                            pasitos = 0
                        console.log("User: " + usersInHour[i].metsName + " HA dado: ", pasitos, " EN las ultimas 2 hrs")
                        resbody = {
                            sender: usersInHour[i].msnId,
                            msg: "Oops, ALERTA DE SENDENTARISMO! \n Sólo has logrado " + pasitos + " pasos en las últimas 2horas, te recomiendo que vayas a dar una vuelta por ahí",
                            avatarMood: "bien",
                            avatarNo: usersInHour.avatar
                        }
                        generaMsg(resbody)
                    }
                })
            }
        } else
            console.log("No hay usersInHour")
    } catch (error) {
        console.log("Error occurr in sedentario alert ", error)
    }


}




function getCurrentHour() {
    let dat = new Date
    let h = dat.getHours()
    let min = dat.getMinutes()
    return h
}


async function reminderAlert() {
    try {
        console.log("Entrando a ciclo de reminder Alert")
            /// Sacamos la hora actual para comparar
        let HoraActual = getCurrentHour()
            //Sacamos el usuario segun el atributo de la hr
        let usersInHour = await User.find({ "timeReminder": HoraActual })
            //si existe el usuario con esa horas sacamos datos
        if (usersInHour) {
            for (const i in usersInHour) {
                console.log("Usuario #" + i)
                    //tstCreateParams(usersInHour[i])
                reminderGenerator(usersInHour[i])
                    //console.log(`usersInHour.${i} = ${usersInHour[i].email}`);
                    //console.log(`usersInHour.${i} = ${usersInHour[i].timeReminder}`);
            }
        } else
            console.log("Not users in this hour")
    } catch (error) {
        console.log("an Error ocurr while reminderAlert", error)
    }

} //reminderAlert

async function reminderGenerator(userToNotify) {
    let metsUId = userToNotify.metsId
    let resbody
    let quer = 'SELECT * FROM `detalle_diario` WHERE `Status`= 1 AND `IdUsuario`=' + metsUId
    console.log("reminderGenerator:", metsUId)
    if (metsUId == undefined) {
        console.log("Usuario no registrado en metsbot")
        throw error
    }
    try {
        pool.query(quer, function(error, results, fields) {
                if (error) throw error;
                // console.log("DiaCumplido", results[0].DiaCumplido, " \n pasos lleva ", results[0].PasosHechos , " \n La fecha ", results[0].FechaDetalle)
                if (results[0] == null) {
                    console.log("No se encontro el cosas dela bitacora")
                } else {
                    if (results[0].DiaCumplido == 1) { ///SI en mets me dice que ya se cumplio el reto no hacemos nada mas que felicitar
                        resbody = {
                            sender: userToNotify.msnId,
                            msg: "Wow!! hoy has logrado hacer: " + results[0].PasosHechos + " pasos. \n Has cumplido tu reto el día de hoy 🥇 y vencido el sedentarismo el día de hoy 👌 ¡FELICIDADES! 🏆  Vamos por un día más. ",
                            avatarMood: "bien",
                            avatarNo: userToNotify.avatar
                        }
                        generaMsg(resbody)
                    } else {
                        ///SI el reto aun no se cumple entonces hay que sacar porcentaje de progreso
                        let porcentajeHecho = (results[0].PasosHechos * 100) / userToNotify.metaPasos
                        if (porcentajeHecho >= 80) {
                            resbody = {
                                sender: userToNotify.msnId,
                                msg: "Hey!, vas bastante bien, llevas " + results[0].PasosHechos + " pasos💪 \n Un " + porcentajeHecho + "% no te detengas que estás apunto de completar tu reto de hoy! 😎",
                                avatarMood: "bien",
                                avatarNo: userToNotify.avatar
                            }
                            generaMsg(resbody)
                        } else if (porcentajeHecho > 50) {
                            resbody = {
                                sender: userToNotify.msnId,
                                msg: "Ya es la hora y vas bien, ya pasaste la mitad del reto 😎 \n lo dificil ya pasó, no es hora de detenerse, sigue así.",
                                avatarMood: "gifinit",
                                avatarNo: userToNotify.avatar
                            }
                            generaMsg(resbody)
                        } else if (porcentajeHecho == 50) {
                            resbody = {
                                sender: userToNotify.msnId,
                                msg: " Qué curioso, estás justo a la mitad del reto. NO ES HORA DE DETENERSE, la otra mitad es más fácil.💪😀 ",
                                avatarMood: "none",
                                avatarNo: userToNotify.avatar
                            }
                            generaMsg(resbody)
                        } else if (porcentajeHecho >= 30) {
                            resbody = {
                                sender: userToNotify.msnId,
                                msg: " Ya es hora de checar cuántos pasos llevas y pues sólo has hecho " + results[0].PasosHechos + " pasos, eso no es ni la mitad 😞 \n Pero bueno aún puedes salir y caminar un poco más para cumplir el reto de hoy. ",
                                avatarMood: "sad",
                                avatarNo: userToNotify.avatar
                            }
                            generaMsg(resbody)
                        } else {
                            resbody = {
                                sender: userToNotify.msnId,
                                msg: "Chequé tu progreso y me encuentro con que sólo haz hecho " + results[0].PasosHechos + " pasos 🤦🏻‍♂️ \n 🤔 mmm...  te recomiendo que camines más porque te falta mucho para cumplir tu reto de hoy. CAMINA! 🤨👉  ",
                                avatarMood: "bien",
                                avatarNo: userToNotify.avatar
                            }
                            generaMsg(resbody)
                        }
                    } ///else de dia cumpplido = 1                      
                } ///else dia results 0 = null
            }) //query 
    } catch (err) {
        console.log("Erro en consultaProgresoHoy: ", err)
    }

} //reminderGenerator


function tstCreateParams(userToNotify) {
    /// this is a test function to know if it would work
    // if I only send this shit 
    let req = {
        params: {
            metsId: userToNotify.metsId
        }
    }
    consultaProgresoHoy(req)
}

function generaMsg(resbody) {
    // let sender = "2196749803700412"
    // let text = "Hey este mensaje se envio sin consultar a Chatfuel OMG"
    /// mandamos mensaje y mandamos avatar
    /// esta a consulta si se mandan los avatares, para evitar sobre carga de imagenes
    let sender = resbody.sender
    let text = resbody.msg
    sendTextMessage(sender, text)
}

//CHecar si se puede dar parametros para que el resto lo haga chatfuel O sino hacer toda la composicion de texto e imagen desde aqui
function sendTextMessage(sender, text) {
    messageData = {
            "text": text
        } //// en el recipient abajo de [id] va el "sender_action":"typing_on"

    sendRequest(sender, messageData)
}

function sendRequest(sender, messageData) { /// Metodo que envia los msj
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

module.exports = {
    sendAvatarInit,
    sendAvatarBien,
    sendAvatarSad,
    sendAvatarAngry,
    consultaReto,
    sendAvatarMad,
    infoReto,
    consultaProgresoHoy,
    generaMsg,
    insertMotivo
}