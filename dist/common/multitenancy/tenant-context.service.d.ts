export interface TenantSession {
    tenantId: string;
    userId: string;
    userRole: string;
}
export declare class TenantContextService {
    private static readonly storage;
    static runWithContext<R>(session: TenantSession, callback: () => R): R;
    static getSession(): TenantSession | undefined;
    static getTenantId(): string;
    static getUserId(): string | undefined;
}
