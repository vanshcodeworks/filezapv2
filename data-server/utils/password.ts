import bcrypt from "bcryptjs";

export async function hashFilePassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyFilePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}