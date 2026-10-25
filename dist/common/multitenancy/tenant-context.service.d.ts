export interface TenantSession {
    tenantId: string;
    userId: string;
    userRole: string;
    isPrimaryAdmin?: boolean;
    centerId?: string;
}
export declare class TenantContextService {
    private static readonly storage;
    static runWithContext<R>(session: TenantSession, callback: () => R): R;
    static getSession(): TenantSession | undefined;
    static setSession(session: TenantSession): void;
    static getTenantId(): string;
    static getUserId(): string | undefined;
    static getCenterId(): string;
}
