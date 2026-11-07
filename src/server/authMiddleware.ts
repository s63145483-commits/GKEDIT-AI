import type { Request, Response, NextFunction } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { verifyToken, isTokenRevoked } from './auth.ts';

export interface AuthenticatedUserPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
  rawToken?: string;
}

/**
 * Extracts Bearer JWT token from HTTP Authorization header.
 */
export function extractBearerToken(req: IncomingMessage | Request): string | null {
  const authHeader = (req.headers['authorization'] || (req as any).headers?.authorization) as string | undefined;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  const parts = authHeader.trim().split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1].trim();
  }
  return null;
}

/**
 * Express Middleware: Ensures request has a valid, non-revoked JWT Bearer token.
 * Populates req.user with decoded payload.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized: Authentication required. Bearer JWT token is missing.',
      code: 'AUTH_TOKEN_MISSING',
    });
    return;
  }

  if (isTokenRevoked(token)) {
    res.status(401).json({
      error: 'Unauthorized: Session has expired or token has been revoked. Please sign in again.',
      code: 'AUTH_TOKEN_REVOKED',
    });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired JWT token. Please sign in again.',
      code: 'AUTH_TOKEN_INVALID',
    });
    return;
  }

  (req as AuthenticatedRequest).user = decoded;
  (req as AuthenticatedRequest).rawToken = token;
  next();
}

// Alias for authenticateToken
export const requireAuth = authenticateToken;

/**
 * Express Middleware: Checks that the authenticated user possesses one of the allowed roles.
 */
export function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        error: 'Unauthorized: Authentication required.',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access restricted. Required role: [${roles.join(', ')}], current role: ${authReq.user.role}`,
        code: 'AUTH_FORBIDDEN',
      });
      return;
    }

    next();
  };
}

/**
 * Express Middleware: Optional authentication. Attaches user if token is valid,
 * but allows unauthenticated requests to proceed.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (token && !isTokenRevoked(token)) {
    const decoded = verifyToken(token);
    if (decoded) {
      (req as AuthenticatedRequest).user = decoded;
      (req as AuthenticatedRequest).rawToken = token;
    }
  }
  next();
}

/**
 * Low-level Helper for IncomingMessage / ServerResponse (apiHandler.ts)
 * Validates JWT token and sends 401 response if missing or invalid.
 */
export function requireAuthOrRespond(
  req: IncomingMessage,
  res: ServerResponse
): AuthenticatedUserPayload | null {
  const token = extractBearerToken(req);

  if (!token) {
    res.writeHead(401, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(
      JSON.stringify({
        error: 'Unauthorized: Authentication required. Bearer JWT token is missing.',
        code: 'AUTH_TOKEN_MISSING',
      })
    );
    return null;
  }

  if (isTokenRevoked(token)) {
    res.writeHead(401, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(
      JSON.stringify({
        error: 'Unauthorized: Session has expired or token was revoked. Please sign in again.',
        code: 'AUTH_TOKEN_REVOKED',
      })
    );
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.writeHead(401, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(
      JSON.stringify({
        error: 'Unauthorized: Invalid or expired JWT token. Please sign in again.',
        code: 'AUTH_TOKEN_INVALID',
      })
    );
    return null;
  }

  return decoded;
}

/**
 * Low-level Helper: Verifies user role and sends 403 if insufficient permissions.
 */
export function requireRoleOrRespond(
  user: AuthenticatedUserPayload,
  res: ServerResponse,
  allowedRoles: string[]
): boolean {
  if (!allowedRoles.includes(user.role)) {
    res.writeHead(403, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(
      JSON.stringify({
        error: `Forbidden: Access restricted. Required role: [${allowedRoles.join(', ')}], current role: ${user.role}`,
        code: 'AUTH_FORBIDDEN',
      })
    );
    return false;
  }
  return true;
}
