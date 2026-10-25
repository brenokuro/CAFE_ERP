// src/modules/products/products.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProductType } from '../../common/enums/domain.enums';
import { CenterAccessGuard, Roles, RolesGuard } from '../../common/guards/access-control';
import { UserRole } from '../../common/enums/domain.enums';

@Controller('products')
@UseGuards(JwtAuthGuard, CenterAccessGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.PURCHASING, UserRole.FINANCIAL, UserRole.STOCK, UserRole.OPERATOR)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STOCK)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  async findAll(
    @Query('type') type?: ProductType,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll({
      type,
      lowStockOnly: lowStockOnly === 'true',
      search,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STOCK)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STOCK)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
