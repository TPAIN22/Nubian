import { isValidPhone, digitsOnly, normalizePhone } from "@/utils/phoneValidator";

describe("phoneValidator", () => {
  describe("normalizePhone", () => {
    it("trims whitespace", () => {
      expect(normalizePhone("  0912345678  ")).toBe("0912345678");
    });
    it("returns empty string for nullish", () => {
      expect(normalizePhone(null)).toBe("");
      expect(normalizePhone(undefined)).toBe("");
    });
  });

  describe("digitsOnly", () => {
    it("strips non-digit characters", () => {
      expect(digitsOnly("+249 (091) 234-5678")).toBe("2490912345678");
    });
    it("returns empty for empty input", () => {
      expect(digitsOnly("")).toBe("");
    });
  });

  describe("isValidPhone", () => {
    it.each([
      ["0912345678"],
      ["+249912345678"],
      ["00249 912 345 678"],
      ["(091) 234-5678"],
    ])("accepts valid: %s", (input) => {
      expect(isValidPhone(input)).toBe(true);
    });

    it.each([
      ["", "empty"],
      ["   ", "whitespace only"],
      ["abc1234567", "letters mixed"],
      ["12345", "too short"],
      ["1234567890123456", "too long"],
      ["091-abc-5678", "embedded letters"],
      [null, "null"],
      [undefined, "undefined"],
    ])("rejects %s (%s)", (input) => {
      expect(isValidPhone(input as any)).toBe(false);
    });
  });
});
