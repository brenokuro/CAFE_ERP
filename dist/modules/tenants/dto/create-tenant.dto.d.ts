import { TaxRegime } from '../../../common/enums/domain.enums';
export declare class CreateTenantDto {
    name: string;
    tradeName?: string;
    document: string;
    stateRegistration?: string;
    municipalRegistration?: string;
    taxRegime: TaxRegime;
    email: string;
    phone?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    ibgeCode?: string;
}
