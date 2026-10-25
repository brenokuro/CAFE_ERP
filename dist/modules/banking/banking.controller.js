"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankingController = void 0;
const common_1 = require("@nestjs/common");
const banking_service_1 = require("./banking.service");
const create_bank_account_dto_1 = require("./dto/create-bank-account.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const access_control_1 = require("../../common/guards/access-control");
const domain_enums_1 = require("../../common/enums/domain.enums");
let BankingController = class BankingController {
    bankingService;
    constructor(bankingService) {
        this.bankingService = bankingService;
    }
    async createAccount(dto) {
        return this.bankingService.createAccount(dto);
    }
    async findAllAccounts() {
        return this.bankingService.findAllAccounts();
    }
    async createTransaction(dto) {
        return this.bankingService.createTransaction(dto);
    }
    async findTransactions(id, reconciled) {
        return this.bankingService.findTransactions(id, reconciled !== undefined ? reconciled === 'true' : undefined);
    }
};
exports.BankingController = BankingController;
__decorate([
    (0, common_1.Post)('accounts'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bank_account_dto_1.CreateBankAccountDto]),
    __metadata("design:returntype", Promise)
], BankingController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)('accounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BankingController.prototype, "findAllAccounts", null);
__decorate([
    (0, common_1.Post)('transactions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bank_account_dto_1.CreateBankTransactionDto]),
    __metadata("design:returntype", Promise)
], BankingController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('accounts/:id/transactions'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('reconciled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BankingController.prototype, "findTransactions", null);
exports.BankingController = BankingController = __decorate([
    (0, common_1.Controller)('banking'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, access_control_1.CenterAccessGuard, access_control_1.RolesGuard),
    (0, access_control_1.Roles)(domain_enums_1.UserRole.ADMIN, domain_enums_1.UserRole.MANAGER, domain_enums_1.UserRole.FINANCIAL),
    __metadata("design:paramtypes", [banking_service_1.BankingService])
], BankingController);
//# sourceMappingURL=banking.controller.js.map