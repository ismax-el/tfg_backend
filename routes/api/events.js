const router = require('express').Router();
const blobController = require('../../controllers/blob')
const Event = require('../../models/event.model');

//OBTENER TODOS LOS EVENTOS
router.get('/', async (req, res) => {
    try{
        const events = await Event.find();
        res.json(events);
    }catch(error){
        res.json({error: error.message});
    }
})

//OBTENER TODAS LAS IMÁGENES DE UN EVENTO
router.get('/:eventId/images', blobController.getBlobList)

//OBTENER UNA IMAGEN
router.get('/:eventId/images/:imageId', blobController.getBlob)

//Crear un evento - DB y Azure container
router.post('/create', async (req, res) => {
    try{
        console.log(req.body);
        const event = await Event.create(req.body);
        res.json(event);
    }catch(error){
        res.json({ error: error.message });
    }
})


//Crear una imagen - DB y Azure blob

module.exports = router;