const router = require('express').Router();
const { checkToken } = require('../utils/middlewares');

router.use('/gallery', require('./api/gallery'));
router.use('/events', checkToken , require('./api/events'))
router.use('/users', require('./api/users'));

module.exports = router;