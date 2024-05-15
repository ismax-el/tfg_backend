const router = require('express').Router();
const blobController = require('../../controllers/blob')
const containerController = require('../../controllers/container')
const Event = require('../../models/event.model');
const Image = require('../../models/image.model');
const Like = require('../../models/like.model')
const User = require('../../models/user.model')
const multer = require('multer');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { checkToken, checkRol, checkEventStatus } = require('../../utils/middlewares')

const upload = multer();

//OBTENER TODOS LOS EVENTOS
router.get('/', checkToken, async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.json({ error: error.message });
    }
})

//OBTENER UN EVENTO
router.get('/:eventId', checkToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);
        res.json(event);
    } catch (error) {
        res.json({ error: error.message })
    }
})

//OBTENER TODAS LAS IMÁGENES DE UN EVENTO
router.get('/:eventId/images', checkToken, async (req, res) => {
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
router.post('/create', checkRol, async (req, res) => {
    try {
        console.log(req.body)
        //Crear evento en base de datos
        const event = await Event.create(req.body);

        //Crear contenedor en azure
        containerController.createContainer(event.id);

        res.json(event);
    } catch (error) {
        res.json({ error: error.message });
    }
})

//Modificar un evento
router.put('/:eventId/editEvent', checkRol, async (req, res) => {
    try {
        const { eventId } = req.params;
        const response = await Event.findByIdAndUpdate(eventId, req.body, { new: true });
        res.json(response);
    } catch (error) {
        res.json({ error: error.message })
    }
})

//Crear una imagen - DB y Azure blob
router.post('/:eventId/images/upload', checkToken, checkEventStatus, upload.single('file'), async (req, res) => {
    try {
        //Guardar en base de datos
        const { user_id, event_id, name } = req.body;
        const { mimetype, buffer } = req.file

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
router.post('/:eventId/images/:imageId/like', checkToken, checkEventStatus, async (req, res) => {
    try {
        const { userId } = req.body;
        const { imageId, eventId } = req.params;

        console.log(userId)
        console.log(imageId)
        console.log(eventId)

        //VERIFICAR QUE EL USER DEL TOKEN SEA EL MISMO QUE EL DEL TOKEN Y SI EXISTE
        const token = req.headers['authorization'];
        let payload;
        payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (payload.user_id != userId) {
            return res.json({ error: "Algo ha salido mal." });
        }

        //VERIFICAR SI LA IMAGEN A LA QUE LE INTENTA DAR LIKE ES SUYA
        const image = await Image.findOne({ _id: imageId, event_id: eventId })
        if (image.user_id == userId) {
            return res.json({ error: "No puedes votarte a ti mismo." })
        }

        //Verificar si la imagen a la que le está dando like ya le ha dado
        const isLiked = await Like.find({ user_id: userId, event_id: eventId, image_id: imageId })

        if (isLiked.length > 0) {
            return res.json({ alreadyLiked: "Ya le has dado like a esta imagen" })
        } else {

            //Verificar si se ha dado like en este evento a otra imagen
            const userLikesInEvent = await Like.find({ user_id: userId, event_id: eventId })

            if (userLikesInEvent.length > 0) {
                return res.json({ error: '¡Oh no! Parece que ya votaste en este evento.' });
            } else {
                const like = await Like.create({
                    user_id: userId,
                    image_id: imageId,
                    event_id: eventId
                })

                await Image.updateOne({ _id: imageId }, { $inc: { likes: 1 } })

                res.json(like);
            }
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

//Dislike image
router.post("/:eventId/images/:imageId/dislike", checkToken, checkEventStatus, async (req, res) => {
    try {

        const { userId } = req.body;
        const { imageId, eventId } = req.params;

        //VERIFICAR QUE EL USER DEL TOKEN SEA EL MISMO QUE EL DEL BODY Y SI EXISTE
        const token = req.headers['authorization'];
        let payload;
        payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (payload.user_id != userId) {
            return res.json({ error: "Algo ha salido mal." });
        }

        await Like.deleteOne({ user_id: userId, event_id: eventId, image_id: imageId })
        await Image.updateOne({ _id: imageId }, { $inc: { likes: -1 } })

        res.json({ success: "Ya no te gusta la imagen" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }


})

//Obtener like de un usuario en un evento
router.post("/:eventId/getLike", checkToken, async (req, res) => {
    try {
        const { userId } = req.body;
        const { eventId } = req.params;

        const like = await Like.findOne({ user_id: userId, event_id: eventId })

        res.json({ imageId: like.image_id });

    } catch (error) {

    }
})

//DELETE eliminar imagen tanto usuarios como administradores
router.delete("/:eventId/images/:imageId/delete", checkToken, async (req, res) => {
    try {
        const token = req.headers['authorization']
        let payload;
        payload = jwt.verify(token, 'clave secreta')

        const userId = payload.user_id;
        const { eventId, imageId } = req.params;

        //Primero miramos si existe el usuario
        const user = await User.findById({ _id: userId });
        if (!user) {
            return res.json({ error: 'Usuario no encontrado.' });
        }

        //En caso de ser administrador borrar la imagen directamente
        if (user.rol == 'administrator') {
            //Si es admin borrarla sin problema
            await Image.findByIdAndDelete({ _id: imageId });
        } else {
            //En caso de ser un usuario normal, comprobar antes que esa imagen sea suya
            const image = await Image.findById({ _id: imageId });
            if (image.user_id != userId) {
                return res.json({ error: 'No puedes borrar una foto que no es tuya.' });
            }

            await Image.findOneAndDelete({ _id: imageId, user_id: userId })
        }

        //Elimina todos los likes de esa imagen en ese evento así todos los users vuelven a tener el like disponible
        await Like.deleteMany({ image_id: imageId, event_id: eventId })
        await blobController.deleteBlob(eventId, imageId)
        res.json({ success: "¡Imagen borrada con éxito!" })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.delete('/:eventId/delete', checkRol, async (req, res) => {
    try {
        const { eventId } = req.params;

        await Like.deleteMany({ event_id: eventId });
        await Image.deleteMany({ event_id: eventId });
        await Event.findByIdAndDelete({ _id: eventId });

        containerController.deleteContainer(eventId);

        res.json({ success: "¡Evento borrado con éxito!" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = router;