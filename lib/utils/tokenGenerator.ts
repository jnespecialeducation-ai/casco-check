const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateLinkToken(minLen = 10, maxLen = 14): string {
  const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
  let result = "";
  for (let i = 0; i < len; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}
