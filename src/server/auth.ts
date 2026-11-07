import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'gkedit_ai_secure_jwt_token_secret_key_2026';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: 'creator' | 'editor' | 'developer' | 'explorer';
  preferredLanguage: 'telugu' | 'english' | 'tanglish' | 'adaptive';
  createdAt: string;
}

// In-memory user database.
export const usersDb: Map<string, User> = new Map();

// Creator email can be configured via environment variable CREATOR_EMAIL or matching master email securely on server
const CREATOR_EMAIL_DEFAULT = 'narsimha2141@gmail.com';

export function isCreatorEmail(email: string): boolean {
  if (!email) return false;
  const target = (process.env.CREATOR_EMAIL || process.env.VITE_CREATOR_EMAIL || process.env.NEXT_PUBLIC_CREATOR_EMAIL || CREATOR_EMAIL_DEFAULT).toLowerCase().trim();
  return email.toLowerCase().trim() === target;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_gkedit_salt_2026').digest('hex');
}

export function generateToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Set of revoked/blacklisted JWT tokens upon logout
export const revokedTokens: Set<string> = new Set();

export function revokeToken(token: string): boolean {
  if (!token) return false;
  const cleanToken = token.trim();
  revokedTokens.add(cleanToken);
  return true;
}

export function isTokenRevoked(token: string): boolean {
  if (!token) return true;
  return revokedTokens.has(token.trim());
}

export function findUserByEmail(email: string): User | undefined {
  if (!email) return undefined;
  return usersDb.get(email.toLowerCase().trim());
}

export function findUserById(id: string): User | undefined {
  if (!id) return undefined;
  for (const user of usersDb.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

export function verifyToken(token: string): { sub: string; email: string; name: string; role: string } | null {
  try {
    if (!token) return null;
    const cleanToken = token.trim();
    if (isTokenRevoked(cleanToken)) {
      return null;
    }
    const decoded = jwt.verify(cleanToken, JWT_SECRET) as {
      sub: string;
      email: string;
      name: string;
      role: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

// Create a guest session on the server side without any client-exposed passwords
export function createGuestUser(): { user: User; token: string } {
  const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
  const guestUser: User = {
    id: guestId,
    name: 'Explorer',
    email: `${guestId}@guest.gkedit.ai`,
    passwordHash: '',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
    role: 'explorer',
    preferredLanguage: 'adaptive',
    createdAt: new Date().toISOString(),
  };
  usersDb.set(guestUser.email, guestUser);
  const token = generateToken(guestUser);
  return { user: guestUser, token };
}
