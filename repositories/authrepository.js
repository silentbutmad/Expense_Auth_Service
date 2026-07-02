import { prisma } from "../models/db.js";

export const findUserByMobile = (mobile_number) =>
  prisma.user.findUnique({ where: { mobile_number } });

export const findUserById = (user_id) =>
  prisma.user.findUnique({ where: { user_id } });

export const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

export const createUser = (data) =>
  prisma.user.create({ data });

export const updateUser = (user_id, data) =>
  prisma.user.update({ where: { user_id }, data });

export const deleteUser = (user_id) =>
  prisma.user.delete({ where: { user_id } });
