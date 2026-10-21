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
exports.CreateProductDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const domain_enums_1 = require("../../../common/enums/domain.enums");
class CreateProductDto {
    type;
    sku;
    barcode;
    name;
    description;
    unitOfMeasure = domain_enums_1.UnitOfMeasure.UN;
    unit = 'UN';
    isBatchControlled = false;
    salePrice;
    costPrice = 0;
    minStock = 0;
    initialStock = 0;
    initialBatchCode;
    initialBatchExpiration;
    ncm;
    nbs;
    cest;
    cfopDefault;
    active = true;
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, class_validator_1.IsEnum)(domain_enums_1.ProductType, {
        message: 'O tipo do produto deve ser PRODUCT (físico) ou SERVICE (serviço).',
    }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O código SKU/Referência é obrigatório.' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "barcode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'O nome do produto/insumo é obrigatório.' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(domain_enums_1.UnitOfMeasure, {
        message: 'A unidade de medida deve ser uma das opções padrão: UN, KG, G, L, ML ou M.',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "unitOfMeasure", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'O controle de lote deve ser verdadeiro ou falso.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isBatchControlled", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }, { message: 'O preço de venda deve ser um número válido com no máximo 4 casas decimais.' }),
    (0, class_validator_1.IsPositive)({ message: 'O preço de venda deve ser maior que zero.' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "salePrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }, { message: 'O preço de custo deve ser um número com no máximo 4 casas decimais.' }),
    (0, class_validator_1.Min)(0, { message: 'O preço de custo não pode ser negativo.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "costPrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }, { message: 'O estoque mínimo aceita valores fracionados com até 4 casas decimais.' }),
    (0, class_validator_1.Min)(0, { message: 'O estoque mínimo não pode ser negativo.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "minStock", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }, { message: 'O saldo inicial aceita insumos fracionados com precisão de até 4 casas decimais (ex: 2.7500 kg).' }),
    (0, class_validator_1.Min)(0, { message: 'O saldo inicial não pode ser negativo.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "initialStock", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.isBatchControlled && o.initialStock > 0),
    (0, class_validator_1.IsString)({ message: 'O código do lote é obrigatório quando há saldo inicial em produto com controle de lote.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Informe o código do lote inicial.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "initialBatchCode", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.isBatchControlled && o.initialStock > 0),
    (0, class_validator_1.IsDateString)({}, { message: 'A data de validade do lote inicial deve estar no formato ISO (YYYY-MM-DD).' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "initialBatchExpiration", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "ncm", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "nbs", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "cest", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "cfopDefault", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "active", void 0);
//# sourceMappingURL=create-product.dto.js.map