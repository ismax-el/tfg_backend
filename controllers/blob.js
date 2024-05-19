const azureConnection = require('@azure/storage-blob');

require('dotenv').config();

const sharp = require('sharp')

const blobService = azureConnection.BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
)

//Subir un file/imagen
const uploadBlob = async (eventId, imageId, buffer, mimetype) => {
    try {
        const containerClientOriginals = blobService.getContainerClient(eventId + "-originals");
        await containerClientOriginals.getBlockBlobClient(imageId).uploadData(buffer, {
            blobHTTPHeaders: {
                blobContentType: mimetype
            }
        });
        
        const containerClientPreviews = blobService.getContainerClient(eventId + "-previews");
        const resizedImageBuffer = await sharp(buffer).resize(300).toBuffer();
        await containerClientPreviews.getBlockBlobClient(imageId).uploadData(resizedImageBuffer, {
            blobHTTPHeaders: {
                blobContentType: mimetype
            }
        })

    } catch (error) {
        res.json({ "message": error.message });
    }
}

//Obtener un file/imagen preview
const getBlobPreview = async (req, res) => {
    try {
        //console.log(req.params);
        const { eventId, imageId } = req.params;

        const containerClient = blobService.getContainerClient(eventId + "-previews");
        const blobClient = containerClient.getBlockBlobClient(imageId);

        // Obtener las propiedades del blob, incluyendo el mimetype
        const properties = await blobClient.getProperties();
        const contentType = properties.contentType;

        // Descargar el contenido del blob a un buffer
        const response = await blobClient.downloadToBuffer();

        // Configurar el header 'Content-Type' usando el mimetype del blob
        res.header("Content-Type", contentType);
        res.send(response);
    } catch (error) {
        res.json({ "message": error.message });
    }
}

//Obtener un file/imagen preview
const getBlobOriginal = async (req, res) => {
    try {
        //console.log(req.params);
        const { eventId, imageId } = req.params;

        const containerClient = blobService.getContainerClient(eventId + "-originals");
        const blobClient = containerClient.getBlockBlobClient(imageId);

        // Obtener las propiedades del blob, incluyendo el mimetype
        const properties = await blobClient.getProperties();
        const contentType = properties.contentType;

        // Descargar el contenido del blob a un buffer
        const response = await blobClient.downloadToBuffer();

        // Configurar el header 'Content-Type' usando el mimetype del blob
        res.header("Content-Type", contentType);
        res.send(response);
    } catch (error) {
        res.json({ "message": error.message });
    }
}

const deleteBlob = async (eventId, imageId) => {
    try {
        const containerClientOriginals = blobService.getContainerClient(eventId + "-originals");
        const containerClientPreviews = blobService.getContainerClient(eventId + "-previews");
        
        await containerClientOriginals.getBlockBlobClient(imageId).deleteIfExists();
        await containerClientPreviews.getBlockBlobClient(imageId).deleteIfExists();
    } catch (error) {
        res.json({ "message": error.message });
    }
}


module.exports = {
    getBlobPreview: getBlobPreview,
    getBlobOriginal: getBlobOriginal,
    uploadBlob: uploadBlob,
    deleteBlob: deleteBlob
};
