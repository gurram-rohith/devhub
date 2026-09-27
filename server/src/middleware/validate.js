// middleware/validate.js
import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    return next(new AppError(message, 400));
  }
  req.body = result.data; // replace with the cleaned, validated version
  next();
};

export default validate;