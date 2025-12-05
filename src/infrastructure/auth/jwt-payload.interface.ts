export interface JwtPayload {
  sub: string; // userId
  role: 'CLIENT' | 'ADMIN' | 'MANAGER';
  permissions: string[];
}
