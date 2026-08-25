import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import prisma from "../database/prismaClient.js";
import { AppError } from "../utils/AppError.js";
import { generateToken } from "../config/jwt.js";
import type { CreateUserInput } from "../validators/user.validator.js";
import type { LoginInput } from "../validators/auth.validator.js";

const buildImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}${imagePath}`;
    }
    if (process.env.PUBLIC_URL) {
        return `${process.env.PUBLIC_URL}${imagePath}`;
    }
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || 3000;
    return `http://${host}:${port}${imagePath}`;
};
export const register = async (data: CreateUserInput & { role?: string }, file?: Express.Multer.File) => {
    const { fullname, email, phone, password, role } = data; 
    if (!email || !password || !fullname) {
        throw new AppError("Todos los campos principales son obligatorios", 400);
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError("El correo electrónico ya está registrado", 400);
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const roleId = role === 'DRIVER' ? 'DRIVER' : 'CLIENT';
    const imagePath = file ? `/uploads/users/${file.filename}` : null;
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
            data: {
                fullname: fullname,
                email: email,
                phone: phone || '',
                password: hashPassword,
                image: imagePath,
            }    
        });
        const selectedRole = await tx.role.upsert({
            where: { id: roleId },
            update: {},
            create: {
                id: roleId,
                fullname: roleId === 'DRIVER' ? 'Conductor' : 'Cliente',
                route: roleId === 'DRIVER' ? '/driver' : '/client',
                image: ''
            }
        });
        await tx.userHasRole.create({
            data: {
                id_user: user.id,
                id_rol: selectedRole.id
            }
        });
        const token = generateToken({
            id: user.id,
            email: user.email,
        });
        return {
            token: `Bearer ${token}`,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone,
                image: buildImageUrl(user.image), 
                notification_token: user.notification_token,
                role: selectedRole.id, 
                driverCarInfo: null,  
                roles: [
                    {
                        id: selectedRole.id,
                        fullname: selectedRole.fullname,
                        route: selectedRole.route,
                        image: selectedRole.image,  
                    }
                ]
            }
        };
    });

    return result;
};
export const loginUser = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: {
            roles: {
                include: { role: true }
            },
            driverCarInfo: true 
        }    
    });
    if (!user) {
        throw new AppError("Usuario no encontrado", 400);
    }
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
        throw new AppError("Contraseña incorrecta", 401);
    }
    const token = generateToken({
        id: user.id,
        email: user.email,
    });
    const { password, roles, driverCarInfo, ...userData } = user;
    const formattedRoles = roles.map((userRole: any) => ({
        id: userRole.role.id,
        fullname: userRole.role.fullname,
        route: userRole.role.route,
        image: userRole.role.image,
    }));
    const hasDriver = roles.some((r: any) => r.role.id === 'DRIVER');
    const primaryRole = hasDriver ? 'DRIVER' : 'CLIENT';
    return {
        "token": `Bearer ${token}`,
        "user": {
            ...userData,
            image: buildImageUrl(userData.image), 
            role: primaryRole, 
            driverCarInfo: driverCarInfo ?? null,
            roles: formattedRoles
        }
    };
};