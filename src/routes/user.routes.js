const express = require('express');
const router  = express.Router();

const { getMe, updateMe, deleteMe } = require('../controllers/user.controller');
const { verifyUserJWT } = require('../middleware/auth.middleware');

router.use(verifyUserJWT);
router.get('/',      getMe);
router.patch('/me',  updateMe);
router.delete('/me', deleteMe);

module.exports = router;
