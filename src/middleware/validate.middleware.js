const ApiError = require('../utils/ApiError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[source], { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return next(ApiError.badRequest('Validation failed', errors));
  }
  next();
};

module.exports = { validate };
