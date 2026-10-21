import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { AccountCategoryType } from '../../common/enums/domain.enums';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(dto: CreateCategoryDto): Promise<any>;
    findAll(type?: AccountCategoryType): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateCategoryDto): Promise<any>;
    remove(id: string): Promise<any>;
}
