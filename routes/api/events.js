const router = require('express').Router();
const blobController = require('../../controllers/blob')
const containerController = require('../../controllers/container')
const Event = require('../../models/event.model');
const Image = require('../../models/image.model');
const Like = require('../../models/like.model')
const multer = require('multer');

const upload = multer();

//OBTENER TODOS LOS EVENTOS
router.get('/', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.json({ error: error.message });
    }
})

//OBTENER UN EVENTO
router.get('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);
        res.json(event);
    } catch (error) {
        res.json({ error: error.message })
    }
})

//OBTENER TODAS LAS IMÁGENES DE UN EVENTO
router.get('/:eventId/images', async (req, res) => {
    try {
        const { eventId } = req.params;
        const events = await Image.find({ event_id: eventId });
        //console.log(events)
        res.json(events);
    } catch (error) {
        res.json({ error: error.message });
    }
})

//OBTENER UNA IMAGEN PREVIEW
router.get('/:eventId/images/:imageId/preview', blobController.getBlobPreview)

//OBTENER UNA IMAGEN ORIGINAL
router.get('/:eventId/images/:imageId/original', blobController.getBlobOriginal)

//Crear un evento - DB y Azure container
router.post('/create', async (req, res) => {
    try {
        //Crear evento en base de datos
        //console.log(req.body);
        const event = await Event.create(req.body);

        //Crear contenedor en azure
        containerController.createContainer(event.id);

        res.json(event);
    } catch (error) {
        res.json({ error: error.message });
    }
})

//Crear una imagen - DB y Azure blob
router.post('/:eventId/images/upload', upload.single('file'), async (req, res) => {
    try {
        //Guardar en base de datos
        const { user_id, event_id, name } = req.body;
        const { mimetype, buffer } = req.file
        //console.log(req.file)

        const image = await Image.create({
            user_id: user_id,
            event_id: event_id,
            name: name
        })

        //Guardar en azure también
        await blobController.uploadBlob(event_id, image.id, buffer, mimetype)

        res.json(image);
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

//Dar like
router.post('/:eventId/images/:imageId/like', async (req, res) => {
    try{
        const { userId } = req.body;
        const {imageId, eventId} = req.params;

        console.log(userId)
        console.log(imageId)
        console.log(eventId)

        //Verificar si la imagen a la que le está dando like ya le ha dado
        const isLiked = await Like.find({user_id: userId, event_id: eventId, image_id: imageId})

        if(isLiked.length > 0){
            res.json({alreadyLiked: "Ya le has dado like a esta imagen"})
        }else{

            //Verificar si se ha dado like en este evento a otra imagen
            const userLikesInEvent = await Like.find({user_id: userId, event_id: eventId})
    
            if(userLikesInEvent.length > 0){
                res.json({error: '¡Oh no! Parece que ya votaste en este evento.'});
            }else{
                const like = await Like.create({
                    user_id: userId,
                    image_id: imageId,
                    event_id: eventId
                })
    
                await Image.updateOne({_id: imageId}, {$inc: {likes: 1}})
    
                res.json(like);
            }
        }
    }catch(error){
        res.status(500).json({message: error.message})
    }
})

//Dislike image
router.post("/:eventId/images/:imageId/dislike", async (req, res) => {
    try{

        const { userId } = req.body;
        const {imageId, eventId} = req.params;

        await Like.deleteOne({user_id: userId, event_id: eventId, image_id: imageId})
        await Image.updateOne({_id: imageId}, {$inc: {likes: -1}})

        res.json({success: "Ya no te gusta la imagen"})
    }catch(error){
        res.status(500).json({message: error.message})
    }


})

//Obtener like de un usuario en un evento
router.post("/:eventId/getLike", async (req, res) => {
    try{
        const { userId } = req.body;
        const { eventId} = req.params;

        const like = await Like.findOne({user_id: userId, event_id: eventId})
        
        res.json({imageId: like.image_id});

    }catch(error){

    }
})

module.exports = router;