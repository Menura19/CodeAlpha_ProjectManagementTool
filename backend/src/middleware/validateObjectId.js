const mongoose = require('mongoose');

const validateObjectId = (...paramNames) => {
  return (req, res, next) => {
    for (const param of paramNames) {
      const id = req.params[param];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ID format for ${param}: '${id}'`,
        });
      }
    }
    next();
  };
};

module.exports = validateObjectId;
