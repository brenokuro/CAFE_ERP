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
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const stock_service_1 = require("./stock.service");
const create_stock_movement_dto_1 = require("./dto/create-stock-movement.dto");
const create_batch_dto_1 = require("./dto/create-batch.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let StockController = class StockController {
    stockService;
    constructor(stockService) {
        this.stockService = stockService;
    }
    async createMovement(dto) {
        return this.stockService.createMovement(dto);
    }
    async createManualAdjustment(dto) {
        return this.stockService.createMovement(dto);
    }
    async getMovements(query) {
        return this.stockService.getMovements(query);
    }
    async getProductBatches(productId) {
        return this.stockService.getProductBatches(productId);
    }
    async createBatch(dto) {
        return this.stockService.createBatch(dto);
    }
};
exports.StockController = StockController;
__decorate([
    (0, common_1.Post)('movements'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_movement_dto_1.CreateStockMovementDto]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "createMovement", null);
__decorate([
    (0, common_1.Post)('adjustments'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_movement_dto_1.CreateStockMovementDto]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "createManualAdjustment", null);
__decorate([
    (0, common_1.Get)('movements'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_movement_dto_1.StockMovementQueryDto]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "getMovements", null);
__decorate([
    (0, common_1.Get)('products/:id/batches'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "getProductBatches", null);
__decorate([
    (0, common_1.Post)('batches'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_batch_dto_1.CreateProductBatchDto]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "createBatch", null);
exports.StockController = StockController = __decorate([
    (0, common_1.Controller)('stock'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [stock_service_1.StockService])
], StockController);
//# sourceMappingURL=stock.controller.js.map