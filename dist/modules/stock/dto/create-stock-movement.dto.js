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
exports.PaginatedStockMovementResponseDto = exports.StockMovementFilterDto = exports.StockMovementQueryDto = exports.CreateManualStockMovementDto = exports.CreateStockMovementDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const domain_enums_1 = require("../../../common/enums/domain.enums");
class CreateStockMovementDto {
    productId;
    product_id;
    movementTypeCode;
    movement_type_code;
    quantity;
    batchId;
    batch_id;
    batchCode;
    batch_code;
    expirationDate;
    expiration_date;
    documentNumber;
    document_number;
    reason;
    unitCost;
    unit_cost;
    referenceType;
    referenceId;
    salesOrderId;
    purchaseOrderId;
}
exports.CreateStockMovementDto = CreateStockMovementDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'O ID do produto (productId) deve ser um UUID válido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'O ID do produto (productId) é obrigatório.' }),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.product_id),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "product_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(domain_enums_1.MovementTypeCode, {
        message: 'Código de movimento inválido. Utilize um código padronizado: 101 (Entrada Compra), 201 (Consumo Produção/Uso Interno), 202 (Estorno Produção), 301 (Transferência), 501 (Baixa Perda/Avaria/Validade), 502 (Estorno Perda), 601 (Saída Venda), 602 (Devolução Venda).',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'O código do tipo de movimento (movementTypeCode) é obrigatório.' }),
    (0, class_transformer_1.Transform)(({ value, obj }) => String(value || obj.movement_type_code || '')),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "movementTypeCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "movement_type_code", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }, { message: 'A quantidade (quantity) aceita frações com até 4 casas decimais (ex: 0.3500 kg, 1.2500 L).' }),
    (0, class_validator_1.IsPositive)({ message: 'A quantidade movimentada (quantity) deve ser estritamente maior que zero.' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateStockMovementDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'O ID do lote (batchId) deve ser um UUID válido.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.batch_id),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "batchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "batch_id", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'O código do lote (batchCode) deve ser um texto.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.batch_code),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "batchCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "batch_code", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'A data de validade (expirationDate) deve estar no formato ISO YYYY-MM-DD.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.expiration_date),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "expirationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "expiration_date", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'O número do documento (documentNumber) deve ser uma string identificadora.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.document_number),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "documentNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "document_number", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => {
        const code = String(o.movementTypeCode || o.movement_type_code || '');
        return [
            domain_enums_1.MovementTypeCode.OUT_LOSS,
            domain_enums_1.MovementTypeCode.IN_LOSS_REV,
            domain_enums_1.MovementTypeCode.IN_PRODUCTION_REV,
            '501',
            '502',
            '202',
        ].includes(code);
    }),
    (0, class_validator_1.IsString)({ message: 'A justificativa (reason) deve ser um texto descritivo.' }),
    (0, class_validator_1.IsNotEmpty)({
        message: 'A justificativa (reason) é estritamente obrigatória para movimentações de perda/avaria/validade (501) ou estornos (202, 502). Ex: "Filamento úmido / insumo vencido".',
    }),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }, { message: 'O custo unitário (unitCost) deve ter no máximo 4 casas decimais.' }),
    (0, class_validator_1.Min)(0, { message: 'O custo unitário não pode ser negativo.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_transformer_1.Transform)(({ value, obj }) => (value !== undefined ? value : obj.unit_cost)),
    __metadata("design:type", Number)
], CreateStockMovementDto.prototype, "unitCost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateStockMovementDto.prototype, "unit_cost", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(domain_enums_1.StockReferenceType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "referenceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "referenceId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "salesOrderId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "purchaseOrderId", void 0);
class CreateManualStockMovementDto extends CreateStockMovementDto {
}
exports.CreateManualStockMovementDto = CreateManualStockMovementDto;
class StockMovementQueryDto {
    productId;
    product_id;
    movementTypeCode;
    movement_type_code;
    userId;
    user_id;
    batchId;
    batch_id;
    documentNumber;
    document_number;
    startDate;
    start_date;
    endDate;
    end_date;
    page = 1;
    limit = 20;
}
exports.StockMovementQueryDto = StockMovementQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'O filtro productId deve ser um UUID válido.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.product_id),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "product_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.movement_type_code),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "movementTypeCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "movement_type_code", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'O filtro userId deve ser um UUID válido.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.user_id),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.batch_id),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "batchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "batch_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.document_number),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "documentNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "document_number", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'A data inicial (startDate) deve ser uma data válida ISO 8601.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.start_date),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "start_date", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'A data final (endDate) deve ser uma data válida ISO 8601.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value, obj }) => value || obj.end_date),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StockMovementQueryDto.prototype, "end_date", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'O número da página (page) deve ser um inteiro.' }),
    (0, class_validator_1.Min)(1, { message: 'A página deve ser maior ou igual a 1.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], StockMovementQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'O limite por página (limit) deve ser um inteiro.' }),
    (0, class_validator_1.Min)(1, { message: 'O limite mínimo por página é 1.' }),
    (0, class_validator_1.Max)(100, { message: 'O limite máximo por página é 100.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], StockMovementQueryDto.prototype, "limit", void 0);
class StockMovementFilterDto extends StockMovementQueryDto {
}
exports.StockMovementFilterDto = StockMovementFilterDto;
class PaginatedStockMovementResponseDto {
    data;
    meta;
}
exports.PaginatedStockMovementResponseDto = PaginatedStockMovementResponseDto;
//# sourceMappingURL=create-stock-movement.dto.js.map