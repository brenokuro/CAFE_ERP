import { AccountCategoryType } from '../../../common/enums/domain.enums';
export declare class CreateCategoryDto {
    code: string;
    name: string;
    type: AccountCategoryType;
    parentId?: string;
    active?: boolean;
}
export declare class UpdateCategoryDto {
    code?: string;
    name?: string;
    type?: AccountCategoryType;
    parentId?: string;
    active?: boolean;
}
