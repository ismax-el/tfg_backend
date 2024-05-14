const azureConnection = require('@azure/storage-blob');
require('dotenv').config();

const blobService = azureConnection.BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
)

//Crear contenedor
const createContainer = (eventId) => {
    try{
        blobService.createContainer(eventId + "-previews")
        blobService.createContainer(eventId + "-originals")
    }catch(error){
        console.log("Error: ", error.message)
    }
}

const deleteContainer = (eventId) => {
    try{
        blobService.deleteContainer(eventId + "-previews");
        blobService.deleteContainer(eventId + "-originals");
    }catch(error){
        console.log("Error: ", error.message)
    }
}

module.exports = {
    createContainer: createContainer,
    deleteContainer: deleteContainer
}