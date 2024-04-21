const azureConnection = require('@azure/storage-blob');
require('dotenv').config();

const blobService = azureConnection.BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
)

//Crear contenedor
const createContainer = (req, res) => {
    try{
        const { container } = req.body;
        blobService.createContainer(container)
        res.json({"message": "success"})
    }catch(error){
        res.status(500).json({"message": error.message});
    }
}