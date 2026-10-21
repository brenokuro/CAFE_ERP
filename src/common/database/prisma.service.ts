// src/common/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createMultiTenantPrismaExtension } from '../multitenancy/prisma-tenant.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Cliente estendido com regras automáticas de multi-tenancy
  private _extendedClient: any;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Banco de dados PostgreSQL conectado com sucesso.');
    } catch (error: any) {
      console.warn('⚠️ PostgreSQL não conectado no momento:', error.message);
      console.warn('📌 Servidor HTTP ativo e disponível para requisições.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Retorna a instância do Prisma com o plugin de Multi-Tenancy ativo.
   * Utilizar esta propriedade nos Services para garantir o isolamento estrito.
   */
  get client() {
    if (!this._extendedClient) {
      this._extendedClient = this.$extends(createMultiTenantPrismaExtension());
    }
    return this._extendedClient;
  }
}
