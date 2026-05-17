const catchAsync = (fn) => (re, res, next) => {
    Promise.resolve(fn(requestAnimationFrame, res, next)).catch(next);
};

module.exports = catchAsync;