import prisma from "../database/prismaClient.js";
import bcrypt from "bcryptjs";
import type { CreateUserInput, UpdateUserInput } from "../validators/user.validator.js";
import { AppError } from "../utils/AppError.js";
import { includes } from "zod";
import { tr } from "zod/locales";

export const update = async (id: number, data: UpdateUserInput, file?: Express.Multer.File ) => {
    const user = await prisma.user.findUnique({ where: { id : id } });
     if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }
    let imagePath = user.image;
    if (file) {
        imagePath = `/uploads/users/${id}/${file.filename}`;  
    }
    const updatedUser = await prisma.user.update({
        where: { id : id },
        data: {
            fullname: data.fullname ?? user.fullname,
            phone: data.phone ?? user.phone,
            image: imagePath,
        },
        include: {
            roles:{
                include:{role: true}
            }
        }
    });
   const formattedRoles = updatedUser.roles.map((userRole) => ({
        id: userRole.role.id,
        fullname: userRole.role.fullname,
        route: userRole.role.route,
        image: userRole.role.image,
    })); 
    const { password, ...userData } = updatedUser;
    return {
        ...userData,
        image: userData.image ? `http://${process.env.HOST}:${process.env.PORT}${userData.image}` : null,
        roles: formattedRoles
    }
}
export const findByEmail = async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
}
export const findById = async (id: number) => {
    const user = await prisma.user.findUnique({ where: { id : id } });
    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }
    const { password, ...userData } = user;
    
    return {
        ...userData,
        image: userData.image ? `http://${process.env.HOST}:${process.env.PORT}${userData.image}` : null,
    };
}
