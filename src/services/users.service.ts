import prisma from "../database/prismaClient.js";
import type { UpdateUserInput } from "../validators/user.validator.js";
import { AppError } from "../utils/AppError.js";

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
export const update = async (
    id: number, 
    data: UpdateUserInput & { brand?: string; plate?: string; color?: string }, 
    file?: Express.Multer.File
) => {
    const user = await prisma.user.findUnique({ where: { id: id } });
    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }
    let imagePath = user.image;
    if (file) {
        imagePath = `/uploads/users/${file.filename}`;  
    }
    const { brand, plate, color, ...userDataInput } = data;
    const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
            where: { id: id },
            data: {
                fullname: userDataInput.fullname ?? user.fullname,
                phone: userDataInput.phone ?? user.phone,
                image: imagePath,
            },
            include: {
                roles: {
                    include: { role: true }
                },
                driverCarInfo: true
            }
        });
        let updatedCar = updatedUser.driverCarInfo;
        if (brand || plate || color) {
            updatedCar = await tx.driverCarInfo.upsert({
                where: { id_driver: id },
                update: {
                    ...(brand && { brand }),
                    ...(plate && { plate }),
                    ...(color && { color }),
                },
                create: {
                    id_driver: id,
                    brand: brand || '',
                    plate: plate || '',
                    color: color || '',
                }
            });
        }
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
            roles: formattedRoles,
            driverCarInfo: updatedCar ?? null,
        };
    });
    return result;
};
/* export const update = async (
    id: number, 
    data: UpdateUserInput & { brand?: string; plate?: string; color?: string }, 
    file?: Express.Multer.File
) => {
    const user = await prisma.user.findUnique({ where: { id: id } });
    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }
    let imagePath = user.image;
    if (file) {
        imagePath = `/uploads/users/${file.filename}`;  
    }
    const { brand, plate, color, ...userDataInput } = data;
    const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
            where: { id: id },
            data: {
                fullname: userDataInput.fullname ?? user.fullname,
                phone: userDataInput.phone ?? user.phone,
                image: imagePath,
            },
            include: {
                roles: {
                    include: { role: true }
                },
                driverCarInfo: true
            }
        });
        let updatedCar = updatedUser.driverCarInfo;
        if (brand || plate || color) {
            updatedCar = await tx.driverCarInfo.upsert({
                where: { id_driver: id },
                update: {
                    ...(brand && { brand }),
                    ...(plate && { plate }),
                    ...(color && { color }),
                },
                create: {
                    id_driver: id,
                    brand: brand || '',
                    plate: plate || '',
                    color: color || '',
                }
            });
        }
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
            roles: formattedRoles,
            driverCarInfo: updatedCar ?? null,
        };
    });

    return result;
}; */
export const findByEmail = async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
};
export const findById = async (id: number) => {
    const user = await prisma.user.findUnique({ 
        where: { id: id },
        include: { driverCarInfo: true }
    });
    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }
    const { password, ...userData } = user;
    return {
        ...userData,
        image: buildImageUrl(userData.image),
    };
};