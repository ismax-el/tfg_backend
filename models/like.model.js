const {model, Schema} = require('mongoose');

const likeSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    image_id: { type: Schema.Types.ObjectId, ref: 'Image', required: true },
    event_id: { type: Schema.Types.ObjectId, ref: 'Event', required: true}
})

const Like = model('like', likeSchema);
module.exports = Like;