const express = require('express');
const router  = express.Router();

const { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } =
  require('../controllers/address.controller');
const { verifyUserJWT } = require('../middleware/auth.middleware');
const { validate }      = require('../middleware/validate.middleware');
const { addressSchema } = require('../validators/address.validator');

router.use(verifyUserJWT);
router.get('/',               getAddresses);
router.post('/',              validate(addressSchema), addAddress);
router.put('/:id',            validate(addressSchema), updateAddress);
router.delete('/:id',         deleteAddress);
router.patch('/:id/default',  setDefaultAddress);

module.exports = router;
