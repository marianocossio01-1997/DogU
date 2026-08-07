import { AppError } from "../utils/AppError.js";
export const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message,
            statusCode: err.statusCode
        });
    }
    console.error(err);
    return res.status(500).json({
        message: "Internal Server Error",
        statusCode: 500,
    });
};
//# sourceMappingURL=errorHandler.js.map