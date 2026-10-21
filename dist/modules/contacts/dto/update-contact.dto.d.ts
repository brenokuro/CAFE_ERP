import { ContactRole, PersonType } from '../../../common/enums/domain.enums';
export declare class UpdateContactDto {
    personType?: PersonType;
    role?: ContactRole;
    name?: string;
    tradeName?: string;
    document?: string;
    stateRegistration?: string;
    municipalRegistration?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    creditLimit?: number;
    notes?: string;
    active?: boolean;
}
