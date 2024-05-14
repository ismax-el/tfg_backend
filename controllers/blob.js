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
        console.log("Error: ", error.message);
    }
}

//Obtener un file/imagen preview
const getBlobPreview = async (req, res) => {
    try {
        //console.log(req.params);
        const { eventId, imageId } = req.params;

        const containerClient = blobService.getContainerClient(eventId + "-previews");

        const response = await containerClient.getBlockBlobClient(imageId).downloadToBuffer();

        res.header("Content-Type", "image/jpg");

        res.send(response);
    } catch (error) {
        res.status(500).json({ "message": error.message });
    }
}

//Obtener un file/imagen preview
const getBlobOriginal = async (req, res) => {
    try {
        //console.log(req.params);
        const { eventId, imageId } = req.params;

        const containerClient = blobService.getContainerClient(eventId + "-originals");

        const response = await containerClient.getBlockBlobClient(imageId).downloadToBuffer();

        res.header("Content-Type", "image/jpg");

        res.send(response);
    } catch (error) {
        res.status(500).json({ "message": error.message });
    }
}

const deleteBlob = async (eventId, imageId) => {
    try {
        const containerClientOriginals = blobService.getContainerClient(eventId + "-originals");
        const containerClientPreviews = blobService.getContainerClient(eventId + "-previews");
        
        await containerClientOriginals.getBlockBlobClient(imageId).deleteIfExists();
        await containerClientPreviews.getBlockBlobClient(imageId).deleteIfExists();
    } catch (error) {
        console.log("Error: ", error.message);
    }
}


module.exports = {
    getBlobPreview: getBlobPreview,
    getBlobOriginal: getBlobOriginal,
    uploadBlob: uploadBlob,
    deleteBlob: deleteBlob
};
