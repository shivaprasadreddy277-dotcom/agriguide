import { scrypt, randomBytes, timingSafeEqual } from "crypto";

const N = 16384; // Cost factor (memory/CPU hardness)
const r = 8;     // Block size
const p = 1;     // Parallelization factor
const keyLen = 64;

/**
 * Hashes a plaintext password using crypto.scrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    scrypt(password, salt, keyLen, { N, r, p }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt$${N}$${r}$${p}$${salt}$${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verifies a plaintext password against a stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const parts = hash.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") {
      return resolve(false);
    }
    const costN = parseInt(parts[1], 10);
    const blockR = parseInt(parts[2], 10);
    const parallelP = parseInt(parts[3], 10);
    const salt = parts[4];
    const key = parts[5];

    scrypt(password, salt, keyLen, { N: costN, r: blockR, p: parallelP }, (err, derivedKey) => {
      if (err) return reject(err);
      const inputKey = Buffer.from(derivedKey.toString("hex"), "hex");
      const targetKey = Buffer.from(key, "hex");
      
      if (inputKey.length !== targetKey.length) {
        return resolve(false);
      }
      resolve(timingSafeEqual(inputKey, targetKey));
    });
  });
}
