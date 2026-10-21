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
exports.ProductBatchResponseDto = exports.CreateProductBatchDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateProductBatchDto {
    productId;
    product_id;
    batchCode;
    batch_code;
    expirationDate;
    expiration_date;
    initialQuantity = 0;
    initial_quantity;
}
exports.CreateProductBatchDto = CreateProductBatchDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'O ID do produto (productId) deve ser um UUID válido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'O ID do produto é obrigatório para cadastrar um lote.' }),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.product_id),
    __metadata("design:type", String)
], CreateProductBatchDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductBatchDto.prototype, "product_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O código do lote (batchCode) é obrigatório (ex: "LOT-2026-A1").' }),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.batch_code),
    __metadata("design:type", String)
], CreateProductBatchDto.prototype, "batchCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductBatchDto.prototype, "batch_code", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'A data de validade (expirationDate) deve ser válida no formato YYYY-MM-DD.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.expiration_date),
    __metadata("design:type", String)
], CreateProductBatchDto.prototype, "expirationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductBatchDto.prototype, "expiration_date", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }, { message: 'A quantidade inicial do lote aceita até 4 casas decimais.' }),
    (0, class_validator_1.Min)(0, { message: 'A quantidade inicial do lote não pode ser negativa.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_transformer_1.Transform)(({ value, obj }) => (value !== undefined ? value : obj.initial_quantity)),
    __metadata("design:type", Number)
], CreateProductBatchDto.prototype, "initialQuantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateProductBatchDto.prototype, "initial_quantity", void 0);
class ProductBatchResponseDto {
    id;
    tenantId;
    productId;
    batchCode;
    expirationDate;
    quantity;
    daysUntilExpiration;
    status;
    createdAt;
    updatedAt;
}
exports.ProductBatchResponseDto = ProductBatchResponseDto;
//# sourceMappingURL=create-batch.dto.js.map