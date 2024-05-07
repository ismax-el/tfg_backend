const {model, Schema} = require('mongoose');

const imageSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event_id: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    likes: { type: Number, default: 0 },
})

const Image = model('image', imageSchema);
module.exports = Image;