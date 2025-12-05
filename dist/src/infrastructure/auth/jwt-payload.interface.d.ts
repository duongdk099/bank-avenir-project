export interface JwtPayload {
    sub: string;
    role: 'CLIENT' | 'ADMIN' | 'MANAGER';
    permissions: string[];
}
