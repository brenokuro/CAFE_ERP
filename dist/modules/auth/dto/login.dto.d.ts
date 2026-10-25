export declare class LoginDto {
    email: string;
    password: string;
    tenantId?: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        isPrimaryAdmin: boolean;
    };
    tenant: {
        id: string;
        name: string;
        document: string;
    };
}
