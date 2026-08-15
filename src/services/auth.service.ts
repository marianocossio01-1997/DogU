import bcrypt from "bcryptjs";
import prisma from "../database/prismaClient.js";
import { AppError } from "../utils/AppError.js";
import { generateToken } from "../config/jwt.js";

export const register = async (data: any, file?: Express.Multer.File) => {
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
  const imagePath = file ? `/uploads/users/temp/${file.filename}` : null;

  const result = await prisma.$transaction(async (tx) => {
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
        image: user.image,
        notification_token: user.notification_token,
        role: selectedRole.id, // Retorna 'DRIVER' o 'CLIENT'
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

/* export const register = async (data: CreateUserInput & { role?: string }) => {
    const { fullname, email, phone, password, role } = data; 
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError("El correo electrónico ya está registrado", 400);
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const roleId = role === 'DRIVER' ? 'DRIVER' : 'CLIENT';
    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                fullname: fullname,
                email: email,
                phone: phone,
                password: hashPassword,
            }    
        });
        const selectedRole = await tx.role.findUnique({
            where: { id: roleId }
        });

        if (!selectedRole) {
            throw new AppError(`Rol ${roleId} no encontrado en la base de datos`, 404);
        }
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
                image: user.image,
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
        where: {email: data.email},
        include: {
            roles: {
                include: { 
                    role: true 
                }
            },
            driverCarInfo: true 
        }    
    });
    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
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
    const formattedRoles = roles.map((userRole) => ({
        id: userRole.role.id,
        fullname: userRole.role.fullname,
        route: userRole.role.route,
        image: userRole.role.image,
    }));
    const hasDriver = roles.some(r => r.role.id === 'DRIVER');
    const primaryRole = hasDriver ? 'DRIVER' : 'CLIENT';
    return {
        "token": `Bearer ${token}`,
        "user": {
            ...userData,
            image: userData.image ? `http://${process.env.HOST}:${process.env.PORT}${userData.image}` : null,
            role: primaryRole, 
            driverCarInfo: driverCarInfo ?? null,
            roles: formattedRoles
        }
    };
} */