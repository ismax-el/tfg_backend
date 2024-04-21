const {model, Schema} = require('mongoose');

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    instagram: { type: String, required: false },
    twitter: { type: String, required: false },
    artstation: { type: String, required: false },
    rol: { type: String, enum: ['user', 'administrator'], default: 'user' },
})

const User = model('user', userSchema);
module.exports = User;