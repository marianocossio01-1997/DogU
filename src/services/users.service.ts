import prisma from "../database/prismaClient.js";
import type { UpdateUserInput } from "../validators/user.validator.js";
import { AppError } from "../utils/AppError.js";

const buildImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (process.env.PUBLIC_URL) {
        const cleanBase = process.env.PUBLIC_URL.replace(/\/$/, '');
        return `${cleanBase}${imagePath}`;
    }
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}${imagePath}`;
    }
    if (process.env.NODE_ENV === 'production') {
        return `https://dogu-production-813e.up.railway.app${imagePath}`;
    }
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || 3000;
    return `http://${host}:${port}${imagePath}`;
}
export const update = async (id: number, data: UpdateUserInput, file?: Express.Multer.File) => {
    const user = await prisma.user.findUnique({ where: { id: id } });
    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }
    let imagePath = user.image;
    if (file) {
        imagePath = `/uploads/users/${file.filename}`;  
    }
    const updatedUser = await prisma.user.update({
        where: { id: id },
        data: {
            fullname: data.fullname ?? user.fullname,
            phone: data.phone ?? user.phone,
            image: imagePath,
        },
        include: {
            roles: {
                include: { role: true }
            }
        }
    });
    const formattedRoles = updatedUser.roles.map((userRole: any) => ({
        id: userRole.role.id,
        fullname: userRole.role.fullname,
        route: userRole.role.route,
        image: userRole.role.image,
    }));
    const { password, ...userData } = updatedUser;
    return {
        ...userData,
        image: buildImageUrl(userData.image),
        roles: formattedRoles
    };
};
export const findByEmail = async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
};
export const findById = async (id: number) => {
    const user = await prisma.user.findUnique({ where: { id: id } });
    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }
    const { password, ...userData } = user;
    return {
        ...userData,
        image: buildImageUrl(userData.image),
    };
};