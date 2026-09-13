// 404 handler — runs when no route matched
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found — ${req.method} ${req.originalUrl}`));
}

// Central error handler — every thrown error / rejected promise ends up here
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Server Error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(e => e.message)
      .join(", ");
  }

  // Duplicate key (e.g. job id or admin username already exists)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field ? field : "Value"} already exists — must be unique`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
}

module.exports = { notFound, errorHandler };
