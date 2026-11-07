const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }));
      return errorResponse(res, formattedErrors[0].message, 422, formattedErrors);
    }

    next();
  };
};

module.exports = validate;
