// lib/auth/password.ts
import { Argon2id } from "oslo/password"; // Use Argon2id (recommended) or Bcrypt from oslo

const argon2 = new Argon2id();

export async function hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
}

export async function verifyPassword(hashedPassword: string, plainTextPassword: string): Promise<boolean> {
    return await argon2.verify(hashedPassword, plainTextPassword);
}

// If you prefer bcrypt:
// import { Bcrypt } from "oslo/password";
// const bcrypt = new Bcrypt();
// export async function hashPassword(password: string): Promise<string> {
//     return await bcrypt.hash(password);
// }
// export async function verifyPassword(hashedPassword: string, plainTextPassword: string): Promise<boolean> {
//     return await bcrypt.verify(hashedPassword, plainTextPassword);
// }