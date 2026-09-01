/**
 * Validates a school access password.
 * Must be exactly 8 characters long and contain at least one letter, one digit, and one symbol.
 */
export function validateSchoolPassword(password: string): string | null {
  const pwd = password.trim();
  
  if (pwd.length !== 8) {
    return "Le mot de passe doit comporter exactement 8 caractères.";
  }

  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

  if (!hasLetter || !hasDigit || !hasSymbol) {
    const missing: string[] = [];
    if (!hasLetter) missing.push("au moins une lettre");
    if (!hasDigit) missing.push("au moins un chiffre");
    if (!hasSymbol) missing.push("au moins un symbole (ex: @, #, $, !, %, &)");

    return `Le mot de passe doit obligatoirement inclure : ${missing.join(', ')}.`;
  }

  return null; // Valid
}

/**
 * Helper to generate a default valid 8-character password if needed (e.g. for automatic fallback)
 */
export function generateValidPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$%!&*?";

  const l = letters[Math.floor(Math.random() * letters.length)];
  const d1 = digits[Math.floor(Math.random() * digits.length)];
  const d2 = digits[Math.floor(Math.random() * digits.length)];
  const s = symbols[Math.floor(Math.random() * symbols.length)];
  const rest = "2026"; // 4 chars

  return `${l}${d1}${s}${d2}${rest}`; // e.g. A5@82026 -> 8 chars, letter + digit + symbol!
}
