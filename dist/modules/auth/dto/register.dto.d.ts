import { TaxRegime } from '../../../common/enums/domain.enums';
export declare class RegisterDto {
    companyName: string;
    companyTradeName?: string;
    companyDocument: string;
    taxRegime: TaxRegime;
    companyEmail: string;
    companyPhone?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
}
