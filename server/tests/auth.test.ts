import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/security/hashing.js";

describe("Password Hashing & Hashing Security Tests", () => {
  it("should generate a secure format and successfully verify correct passwords", async () => {
    const password = "FarmerPassword789";
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash.startsWith("scrypt$")).toBe(true);
    
    const isCorrect = await verifyPassword(password, hash);
    expect(isCorrect).toBe(true);
  });

  it("should reject incorrect passwords", async () => {
    const password = "FarmerPassword789";
    const hash = await hashPassword(password);
    
    const isCorrect = await verifyPassword("WrongPassword123", hash);
    expect(isCorrect).toBe(false);
  });

  it("should reject malformed hash formats safely", async () => {
    const badHash = "scrypt$16384$8$1$somesalt";
    const isCorrect = await verifyPassword("FarmerPassword789", badHash);
    expect(isCorrect).toBe(false);
  });
});
