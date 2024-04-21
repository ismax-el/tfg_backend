const {model, Schema} = require('mongoose');

const eventSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    themes: [
        { type: String, required: true }
    ],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
})

const Event = model('event', eventSchema);
module.exports = Event;