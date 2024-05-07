const router = require('express').Router();
const { checkToken } = require('../utils/middlewares');

router.use('/events', require('./api/events'));
router.use('/users', require('./api/users'));

module.exports = router;