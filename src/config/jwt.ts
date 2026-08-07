import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const EXPIRATION_TIME = "20d";

export const generateToken = (payload: object) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRATION_TIME });
}
export const verifyToken = (token: string) =>{
    return jwt.verify(token, JWT_SECRET);
} 
