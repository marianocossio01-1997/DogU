import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const EXPIRATION_TIME = "20d";
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRATION_TIME });
};
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
//# sourceMappingURL=jwt.js.map