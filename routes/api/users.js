const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios')
require('dotenv').config();

const User = require('../../models/user.model');

const {checkCaptcha} = require('../../utils/middlewares')

//POST /api/users/getUserInfo
router.get('/getUserInfo/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
        if (!user) {
            res.json({ error: "No se ha encontrado el usuario." })
        }

        res.json(user);

    } catch (error) {
        res.json({ error: error.message })
    }
})

//POST /api/users/register
router.post('/register', checkCaptcha, async (req, res) => {
    try {
        //Verificar antes de nada si no existe un usuario con ese email ya
        const userExists = await User.findOne({ email: req.body.email });
        if (userExists) {
            return res.json({ error: 'Ya existe un usuario con ese email.' });
        }

        req.body.password = bcrypt.hashSync(req.body.password, 12);
        const user = await User.create(req.body)
        res.json(user);
    } catch (error) {
        res.json({ error: error.message })
    }
});

//POST /api/users/login
router.post('/login', checkCaptcha, async (req, res) => {
    //Comprobar si el mail existe
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.json({ error: 'Error en email/contraseña' });
    }

    const eq = bcrypt.compareSync(req.body.password, user.password);

    if (!eq) {
        return res.json({ error: 'Error en email/contraseña' });
    }

    res.json({
        success: 'Login correcto',
        token: createToken(user),
        userId: user.id,
        userRol: user.rol
    });
})

router.post('/validate', async (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.json({ error: 'Debes incluir la cabecera con el token' })
    }

    try {
        const payload = jwt.verify(token, 'clave secreta');
        res.json({ isValid: true });
    } catch (error) {
        res.json({ isValid: false });
    }
})


function createToken(user) {
    const payload = {
        user_id: user._id,
        user_rol: user.rol
    }
    return jwt.sign(payload, 'clave secreta')
}


module.exports = router;