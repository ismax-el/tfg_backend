const jwt = require('jsonwebtoken');
const axios = require('axios');
const Event = require('../models/event.model');
require('dotenv').config();

const checkToken = (req, res, next) => {
    //Verificar que nos viene un token real
    if (!req.headers['authorization']) {
        return res.json({ error: 'Debes incluir la cabecera con el token.' })
    }

    const token = req.headers['authorization']

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET_KEY)
    } catch (error) {
        return res.json({ error: 'El token no es correcto.' })
    }

    next();
}

const checkRol = (req, res, next) => {
    //Verificar si tiene permisos de administrador
    if (!req.headers['authorization']) {
        return res.json({ error: 'Debes incluir la cabecera con el token.' })
    }

    const token = req.headers['authorization']

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET_KEY)
        if (payload.user_rol != 'administrator') {
            throw error;
        }
    } catch (error) {
        return res.json({ error: 'No tienes permisos para eso.' })
    }

    next();
}

const checkEventStatus = async (req, res, next) => {
    //Hacer este middleware con la intención de no poder hacer ninguna acción en los ya pasados
    try{
        const {eventId} = req.params;
        const event = await Event.findById(eventId);
        const actualDate = new Date();
        const eventDate = new Date(event.endDate);

        // Convertir las fechas a la zona horaria 'Europe/Madrid'
        const actualDateEuropeMadrid = new Date(actualDate.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
        const eventDateEuropeMadrid = new Date(eventDate.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));

        actualDateEuropeMadrid.setHours(0,0,0,0)
        eventDateEuropeMadrid.setHours(0,0,0,0)

        console.log(actualDateEuropeMadrid, eventDateEuropeMadrid)

        if(actualDateEuropeMadrid > eventDateEuropeMadrid){
            throw error;
        }

    }catch(error){
        return res.json({ error: 'No puedes subir más imágenes, ya ha finalizado el evento.' })
    }

    next();
}

const checkCaptcha = async (req, res, next) => {
    //Verificar que nos viene un token real
    if (!req.body.recaptcha) {
        return res.json({ error: 'Error del captcha.' })
    }

    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
        params: {
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: req.body.recaptcha
        }
    })

    if (response.data.success) {
        console.log("Captcha válido.")
        next();
    }else{
        res.status(400).json({ success: false, message: 'Token reCAPTCHA inválido' });
    }
}


module.exports = { checkToken, checkRol, checkCaptcha, checkEventStatus };