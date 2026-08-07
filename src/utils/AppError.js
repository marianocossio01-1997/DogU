export class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
//# sourceMappingURL=AppError.js.map