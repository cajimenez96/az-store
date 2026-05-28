// Utility functions for token management
// DEPRECATED: Use bcryptjs for password hashing in lib/actions/user.actions.ts
// Do not use hash() / compare() for passwords — use bcryptjs instead

// Simple token storage (stored as-is in DB, protected by HTTPS + DB security)
export const encryptToken = async (token: string): Promise<string> => {
  return token;
};

export const decryptToken = async (encryptedToken: string): Promise<string> => {
  return encryptedToken;
};
// // Use Web Crypto API compatible with Edge Functions

// const encoder = new TextEncoder();
// const salt = crypto.getRandomValues(new Uint8Array(16)).join('');

// // Hash function
// export const hash = async (plainPassword: string): Promise<string> => {
//   const passwordData = encoder.encode(plainPassword + salt);
//   const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
//   return Array.from(new Uint8Array(hashBuffer))
//     .map((b) => b.toString(16).padStart(2, '0'))
//     .join('');
// };

// // Compare function
// export const compare = async (
//   plainPassword: string,
//   encryptedPassword: string
// ): Promise<boolean> => {
//   const hashedPassword = await hash(plainPassword);
//   return hashedPassword === encryptedPassword;
// };
