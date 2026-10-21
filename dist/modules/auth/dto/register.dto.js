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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const domain_enums_1 = require("../../../common/enums/domain.enums");
class RegisterDto {
    companyName;
    companyTradeName;
    companyDocument;
    taxRegime;
    companyEmail;
    companyPhone;
    adminName;
    adminEmail;
    adminPassword;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'A Razão Social da empresa é obrigatória.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "companyName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "companyTradeName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O CNPJ/CPF da empresa é obrigatório.' }),
    (0, class_validator_1.Matches)(/^\d{11}|\d{14}$/, {
        message: 'O documento da empresa deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ), apenas números.',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "companyDocument", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(domain_enums_1.TaxRegime, { message: 'Regime tributário inválido.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "taxRegime", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'O e-mail da empresa deve ser válido.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "companyEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "companyPhone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O nome do usuário administrador é obrigatório.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "adminName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'O e-mail do usuário administrador deve ser válido.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "adminEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'A senha do usuário deve conter no mínimo 8 caracteres.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "adminPassword", void 0);
//# sourceMappingURL=register.dto.js.map