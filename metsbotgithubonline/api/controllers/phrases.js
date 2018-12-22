const Phrases = require("../models/phrases")
const sendJSONresponse = require('./shared').sendJSONresponse


async function getPhrase(req, res) {
    try {
        let phrasesList = await Phrases.find({})
        if (getPhrase)
            sendJSONresponse(res, 201, phrasesList)
        else
            sendJSONresponse(res, 404, { msg: "No phrases founded" })
    } catch (error) {
        console.log("An error getin phrase occurs: ", error)
        sendJSONresponse(res, 404, { msg: "No phrases founded" })
    }
}
async function createPhrase(req, res) {
    try {
        let newPhrase = req.body.frase
        console.log("Da phrase ", newPhrase)
        let newList = await Phrases.update({ _id: req.params.listId }, { $push: { frases: newPhrase } });
        if (newList)
            sendJSONresponse(res, 201, { msg: "Se añadio la frase: " + newPhrase, listaFrases: newList })
        else
            sendJSONresponse(res, 404, { msg: "No phrases founded" })
    } catch (error) {
        console.log("An error creating phrase occurs: ", error)
        sendJSONresponse(res, 404, { msg: "No phrases founded" })
    }
}
async function updatePhrase(req, res) {
    try {
        let fraseModificada = req.body.frase
        let fraseABorrar = req.body.fraseBorrar
        let phrasesList = await Phrases.find({})
        let tempList = await Phrases.update({ _id: req.body.listId }, { $pull: { frases: [fraseABorrar] } })
        let newPhrasesList = await Phrases.update({ _id: req.params.listId }, { $push: { frases: fraseModificada } })

        if (newPhrasesList) {
            sendJSONresponse(res, 201, { msg: "Se modifico la frase: " + fraseABorrar + " por: " + fraseModificada, listaFrases: newPhrasesList })
        } else
            sendJSONresponse(res, 404, { msg: "No phrases founded" })
    } catch (error) {
        console.log("An error updating phrase occurs: ", error)
        sendJSONresponse(res, 404, { msg: "No phrases founded" })
    }
}
async function deletePhrase(req, res) {
    try {
        let fraseABorrar = req.body.fraseBorrar
        let newList = await Phrases.update({ _id: req.body.listId }, { $pull: { frases: [fraseABorrar] } })
        if (newList) {
            sendJSONresponse(res, 201, { msg: "Se borro la frase: " + fraseABorrar, listaFrases: newList })
        } else
            sendJSONresponse(res, 404, { msg: "No phrase founded" })
    } catch (error) {
        console.log("An error deleting phrase occurs: ", error)
        sendJSONresponse(res, 404, { msg: "No phrases founded" })
    }
}


module.exports = {
    getPhrase,
    createPhrase,
    updatePhrase,
    deletePhrase
}