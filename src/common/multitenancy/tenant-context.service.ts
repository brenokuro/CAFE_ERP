// src/common/multitenancy/tenant-context.service.ts
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantSession {
  tenantId: string;
  userId: string;
  userRole: string;
  isPrimaryAdmin?: boolean;
  centerId?: string;
}

/**
 * Serviço que gerencia o contexto de execução da requisição atual utilizando
 * AsyncLocalStorage do Node.js. Isso permite que qualquer camada da aplicação
 * (Services, Repositories, Prisma Extensions) acesse o tenantId atual de forma
 * segura, assíncrona e desacoplada do objeto Request do Express/Fastify.
 */
export class TenantContextService {
  private static readonly storage = new AsyncLocalStorage<TenantSession>();

  /**
   * Executa uma função dentro do contexto de um tenant e usuário específico.
   */
  public static runWithContext<R>(session: TenantSession, callback: () => R): R {
    return this.storage.run(session, callback);
  }

  /**
   * Retorna a sessão ativa no contexto assíncrono.
   */
  public static getSession(): TenantSession | undefined {
    return this.storage.getStore();
  }

  /** Atualiza a sessão criada no middleware depois que o JWT foi validado. */
  public static setSession(session: TenantSession): void {
    const current = this.storage.getStore();
    if (!current) {
      throw new Error('TenantContextError: contexto da requisição não inicializado.');
    }
    Object.assign(current, session);
  }

  /**
   * Retorna o ID do Tenant da requisição atual. Lança exceção se não houver contexto ativo.
   */
  public static getTenantId(): string {
    const session = this.storage.getStore();
    if (!session || !session.tenantId) {
      throw new Error(
        'TenantContextError: Nenhuma identificação de Tenant encontrada para esta requisição.',
      );
    }
    return session.tenantId;
  }

  /**
   * Retorna o ID do Usuário da requisição atual.
   */
  public static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  public static getCenterId(): string {
    const centerId = this.storage.getStore()?.centerId;
    if (!centerId) {
      throw new Error('CenterContextError: nenhum centro autorizado foi selecionado.');
    }
    return centerId;
  }
}
