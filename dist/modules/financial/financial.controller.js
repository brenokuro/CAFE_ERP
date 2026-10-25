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
exports.FinancialController = void 0;
const common_1 = require("@nestjs/common");
const financial_service_1 = require("./financial.service");
const create_financial_record_dto_1 = require("./dto/create-financial-record.dto");
const create_bank_account_dto_1 = require("../banking/dto/create-bank-account.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const domain_enums_1 = require("../../common/enums/domain.enums");
const access_control_1 = require("../../common/guards/access-control");
const domain_enums_2 = require("../../common/enums/domain.enums");
let FinancialController = class FinancialController {
    financialService;
    constructor(financialService) {
        this.financialService = financialService;
    }
    async getCashFlow(startDate, endDate) {
        return this.financialService.getCashFlow({ startDate, endDate });
    }
    async reconcile(dto) {
        return this.financialService.reconcile(dto);
    }
    async createRecord(dto) {
        return this.financialService.createRecord(dto);
    }
    async settleRecord(id, dto) {
        return this.financialService.settleRecord(id, dto);
    }
    async findAllRecords(type, status, contactId, startDate, endDate) {
        return this.financialService.findAllRecords({
            type,
            status,
            contactId,
            startDate,
            endDate,
        });
    }
    async findOneRecord(id) {
        return this.financialService.findOneRecord(id);
    }
};
exports.FinancialController = FinancialController;
__decorate([
    (0, common_1.Get)('cash-flow'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "getCashFlow", null);
__decorate([
    (0, common_1.Post)('reconcile'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bank_account_dto_1.ReconcileTransactionDto]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "reconcile", null);
__decorate([
    (0, common_1.Post)('records'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_financial_record_dto_1.CreateFinancialRecordDto]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "createRecord", null);
__decorate([
    (0, common_1.Post)('records/:id/settle'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_financial_record_dto_1.SettleFinancialRecordDto]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "settleRecord", null);
__decorate([
    (0, common_1.Get)('records'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('contactId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "findAllRecords", null);
__decorate([
    (0, common_1.Get)('records/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "findOneRecord", null);
exports.FinancialController = FinancialController = __decorate([
    (0, common_1.Controller)('financial'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, access_control_1.CenterAccessGuard, access_control_1.RolesGuard),
    (0, access_control_1.Roles)(domain_enums_2.UserRole.ADMIN, domain_enums_2.UserRole.MANAGER, domain_enums_2.UserRole.FINANCIAL),
    __metadata("design:paramtypes", [financial_service_1.FinancialService])
], FinancialController);
//# sourceMappingURL=financial.controller.js.map