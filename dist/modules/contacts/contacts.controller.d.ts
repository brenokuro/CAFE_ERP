import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactRole } from '../../common/enums/domain.enums';
export declare class ContactsController {
    private readonly contactsService;
    constructor(contactsService: ContactsService);
    create(dto: CreateContactDto): Promise<any>;
    findAll(role?: ContactRole, search?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateContactDto): Promise<any>;
    remove(id: string): Promise<any>;
}
