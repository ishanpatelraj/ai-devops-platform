const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    //invalid MongoDB ObjectId was passed
    if(err.name === "CastError"){
        statusCode = 400;
        message = `Invalid ID Format: ${err.value}`;
    }

    // Mongoose: Duplicate key error
    if(err.code === 11000){
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists. Please use a different value.`;
    }

    //(required fields missing, enum mismatch, etc.
    if(err.name === 'ValidationError'){
        statusCode = 400;
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(", ");
    }

    //JWT error
    if(err.name === 'JsonWebTokenError'){
        statusCode = 401;
        message = "Token expired. Please log in again.";
    }

    res.status(statusCode).json({
        success: false,
            message,
        // Only show the stack trace in development (hides internal details in production)
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}

module.exports = errorMiddleware;