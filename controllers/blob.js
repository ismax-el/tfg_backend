const azureConnection = require('@azure/storage-blob');

require('dotenv').config();

const blobService = azureConnection.BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
)

//Subir un file/imagen
const uploadBlob = async (req, res)=> {
    try{
        const {container} = req.body;
        const {originalname, buffer} = req.file;

        const containerClient = blobService.getContainerClient(container);

        await containerClient.getBlockBlobClient(originalname).uploadData(buffer);

        res.json({"message": "success"})
    }catch(error){
        res.status(500).json({"message": error.message});
    }
}

//Obtener un file/imagen
const getBlob = async (req, res)=> {
    try{
        console.log("hola");
        const {container, filename} = req.params;

        const containerClient = blobService.getContainerClient(container);

        res.header("Content-Type", "image/jpg");

        const response = await containerClient.getBlockBlobClient(filename).downloadToBuffer();

        res.send(response);
    }catch(error){
        res.status(500).json({"message": error.message});
    }
}

//Obtener lista de files/images de un contenedor
const getBlobList = async (req, res)=> {
    try{
        const {eventId} = req.params;

        const containerClient = blobService.getContainerClient(eventId);

        const images= [];

        const list = containerClient.listBlobsFlat();

        for await (const blob of list){
            images.push(blob.name)
        }

        res.json(images);
    }catch(error){
        res.status(500).json({"message": error.message});
    }
}

module.exports = {
    getBlob: getBlob, 
    uploadBlob: uploadBlob,
    getBlobList: getBlobList
};
