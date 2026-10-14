/**
 * Módulo de Pedidos Refatorado
 * 
 * Princípios aplicados:
 * - Nomes Reveladores (Clean Code)
 * - Responsabilidade Única (SRP - SOLID)
 * - Eliminação de Argumentos Flag (Flag Arguments)
 * - Padrão Estratégia (Strategy Pattern - OCP / DIP)
 * - Segregação e Injeção de Dependências
 */

// ==========================================
// 1. Modelos e Interfaces de Dados
// ==========================================

export interface ItemPedido {
  /** Descrição opcional do produto */
  descricao?: string;
  /** Preço unitário (ou 'p' para compatibilidade com formato legado) */
  preco?: number;
  p?: number;
  /** Quantidade (ou 'q' para compatibilidade com formato legado) */
  quantidade?: number;
  q?: number;
}

export interface Pedido {
  cliente?: string;
  itens: ItemPedido[];
}

export interface ResultadoProcessamento {
  subtotal: number;
  totalComDesconto: number;
  descontoAplicado: number;
  isPedidoGrande: boolean;
  clienteNotificado?: boolean;
}

// ==========================================
// 2. Contrato de Estratégias de Desconto (Strategy Pattern)
// ==========================================

export interface EstrategiaDesconto {
  readonly nome: string;
  readonly percentual: number;
  calcular(total: number): number;
}

/** Desconto padrão para clientes comuns (0% de desconto) */
export class DescontoComum implements EstrategiaDesconto {
  readonly nome = 'Comum (Sem Desconto)';
  readonly percentual = 0;

  calcular(total: number): number {
    return total;
  }
}

/** Desconto para clientes VIP (10% de desconto) */
export class DescontoVip implements EstrategiaDesconto {
  readonly nome = 'VIP (10% de Desconto)';
  readonly percentual = 0.10;

  calcular(total: number): number {
    return total * 0.9;
  }
}

/** Desconto para funcionários (30% de desconto) */
export class DescontoFuncionario implements EstrategiaDesconto {
  readonly nome = 'Funcionário (30% de Desconto)';
  readonly percentual = 0.30;

  calcular(total: number): number {
    return total * 0.7;
  }
}

/** Desconto promocional especial (20% de desconto - demonstração de OCP) */
export class DescontoPromocional implements EstrategiaDesconto {
  readonly nome = 'Promocional (20% de Desconto)';
  readonly percentual = 0.20;

  calcular(total: number): number {
    return total * 0.8;
  }
}

// ==========================================
// 3. Contrato de Notificação (Desacoplamento do Cálculo)
// ==========================================

export interface ServicoNotificacao {
  notificarPedidoGrande(total: number): void;
  notificarCliente(destinatario: string, total: number): void;
}

export class NotificadorConsole implements ServicoNotificacao {
  private readonly logs: string[] = [];

  notificarPedidoGrande(total: number): void {
    const mensagem = `[Alerta] Pedido grande detectado! Total: R$ ${total.toFixed(2)}`;
    this.logs.push(mensagem);
    console.log("pedido grande");
  }

  notificarCliente(destinatario: string, total: number): void {
    const mensagem = `[Email] Enviando confirmação do pedido (Total: R$ ${total.toFixed(2)}) para: ${destinatario}`;
    this.logs.push(mensagem);
    console.log("email para " + destinatario);
  }

  obterHistoricoLogs(): string[] {
    return [...this.logs];
  }
}

// ==========================================
// 4. Serviço Principal de Pedidos
// ==========================================

export class PedidoService {
  private estrategiaDesconto: EstrategiaDesconto;
  private servicoNotificacao: ServicoNotificacao;
  private readonly LIMITE_PEDIDO_GRANDE = 500;

  constructor(
    estrategiaDesconto: EstrategiaDesconto = new DescontoComum(),
    servicoNotificacao: ServicoNotificacao = new NotificadorConsole()
  ) {
    this.estrategiaDesconto = estrategiaDesconto;
    this.servicoNotificacao = servicoNotificacao;
  }

  /**
   * Altera a estratégia de desconto em tempo de execução
   */
  public definirEstrategiaDesconto(estrategia: EstrategiaDesconto): void {
    this.estrategiaDesconto = estrategia;
  }

  /**
   * Altera o serviço de notificação
   */
  public definirServicoNotificacao(notificador: ServicoNotificacao): void {
    this.servicoNotificacao = notificador;
  }

  /**
   * Responsabilidade 1: Calcular o subtotal bruto a partir dos itens do pedido.
   * Suporta tanto as propriedades limpas (preco/quantidade) quanto legadas (p/q).
   */
  public calcularSubtotal(pedido: Pedido): number {
    if (!pedido || !pedido.itens || pedido.itens.length === 0) {
      return 0;
    }

    return pedido.itens.reduce((acumulador, item) => {
      const precoUnitario = item.preco ?? item.p ?? 0;
      const quantidade = item.quantidade ?? item.q ?? 0;
      return acumulador + (precoUnitario * quantidade);
    }, 0);
  }

  /**
   * Responsabilidade 2: Calcular o valor final aplicando o desconto injetado.
   * Método testado automaticamente pelo Vitest/Jest conforme especificação.
   */
  public calcularTotal(pedido: Pedido): number {
    const subtotal = this.calcularSubtotal(pedido);
    return this.estrategiaDesconto.calcular(subtotal);
  }

  /**
   * Responsabilidade 3: Verificar regra de negócio de volume e alertar se for pedido grande.
   */
  public verificarENotificarVolume(total: number): boolean {
    const isGrande = total > this.LIMITE_PEDIDO_GRANDE;
    if (isGrande) {
      this.servicoNotificacao.notificarPedidoGrande(total);
    }
    return isGrande;
  }

  /**
   * Responsabilidade 4: Notificação explícita do cliente (sem flag boolean!).
   * O chamador executa intencionalmente quando necessário, sem acoplar cálculo a envio.
   */
  public notificarConfirmacaoAoCliente(pedido: Pedido, total: number): void {
    if (pedido.cliente) {
      this.servicoNotificacao.notificarCliente(pedido.cliente, total);
    }
  }

  /**
   * Processamento orquestrado sem flags: calcula, valida regras e gera resultado rico.
   */
  public processar(pedido: Pedido): ResultadoProcessamento {
    const subtotal = this.calcularSubtotal(pedido);
    const totalComDesconto = this.calcularTotal(pedido);
    const isPedidoGrande = this.verificarENotificarVolume(totalComDesconto);

    return {
      subtotal,
      totalComDesconto,
      descontoAplicado: subtotal - totalComDesconto,
      isPedidoGrande,
    };
  }
}
