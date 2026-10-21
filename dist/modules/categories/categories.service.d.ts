import { PrismaService } from '../../common/database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { AccountCategoryType } from '../../common/enums/domain.enums';
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCategoryDto): Promise<any>;
    findAll(type?: AccountCategoryType): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateCategoryDto): Promise<any>;
    remove(id: string): Promise<any>;
}
