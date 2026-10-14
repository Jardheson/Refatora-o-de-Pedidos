import { describe, test, expect, vi } from 'vitest';
import { 
  PedidoService, 
  DescontoComum, 
  DescontoVip, 
  DescontoFuncionario, 
  DescontoPromocional,
  ServicoNotificacao 
} from './pedido';

describe('Testes de Validação da Refatoração do Módulo de Pedidos', () => {

  // Testes exigidos pelo exercício:
  test('Calcula pedido comum corretamente (100 * 2 = 200)', () => {
    const pedido = { itens: [{ p: 100, q: 2 }] };
    const service = new PedidoService(new DescontoComum());
    expect(service.calcularTotal(pedido)).toBe(200);
  });

  test('Calcula pedido VIP com desconto de 10% (180)', () => {
    const pedido = { itens: [{ p: 100, q: 2 }] };
    const service = new PedidoService(new DescontoVip());
    expect(service.calcularTotal(pedido)).toBe(180);
  });

  test('Calcula pedido de funcionário com desconto de 30% (140)', () => {
    const pedido = { itens: [{ p: 100, q: 2 }] };
    const service = new PedidoService(new DescontoFuncionario());
    expect(service.calcularTotal(pedido)).toBe(140);
  });

  // Testes adicionais de boas práticas de engenharia de software:
  test('Calcula itens com propriedades limpas e semânticas (preco e quantidade)', () => {
    const pedido = {
      cliente: 'Maria Silva',
      itens: [
        { descricao: 'Teclado Mecânico', preco: 250, quantidade: 2 }, // 500
        { descricao: 'Mouse Óptico', preco: 100, quantidade: 1 }      // 100 -> Total 600
      ]
    };
    const serviceVip = new PedidoService(new DescontoVip());
    expect(serviceVip.calcularSubtotal(pedido)).toBe(600);
    expect(serviceVip.calcularTotal(pedido)).toBe(540); // 600 * 0.9 = 540
  });

  test('Permite adicionar nova estratégia sem alterar o serviço (Princípio Aberto/Fechado - OCP)', () => {
    const pedido = { itens: [{ preco: 1000, quantidade: 1 }] };
    const service = new PedidoService(new DescontoPromocional());
    expect(service.calcularTotal(pedido)).toBe(800); // 20% OFF
  });

  test('Serviço de notificação é desacoplado e mockável via Injeção de Dependência', () => {
    const mockNotificador: ServicoNotificacao = {
      notificarPedidoGrande: vi.fn(),
      notificarCliente: vi.fn()
    };

    const service = new PedidoService(new DescontoComum(), mockNotificador);
    const pedidoGrande = {
      cliente: 'Carlos Dev',
      itens: [{ preco: 600, quantidade: 1 }]
    };

    const resultado = service.processar(pedidoGrande);
    expect(resultado.isPedidoGrande).toBe(true);
    expect(mockNotificador.notificarPedidoGrande).toHaveBeenCalledWith(600);

    // Notificação explícita sem argumento flag booleano
    service.notificarConfirmacaoAoCliente(pedidoGrande, resultado.totalComDesconto);
    expect(mockNotificador.notificarCliente).toHaveBeenCalledWith('Carlos Dev', 600);
  });

  test('Não aciona alerta de pedido grande para valores <= 500', () => {
    const mockNotificador: ServicoNotificacao = {
      notificarPedidoGrande: vi.fn(),
      notificarCliente: vi.fn()
    };

    const service = new PedidoService(new DescontoComum(), mockNotificador);
    const pedidoPequeno = { itens: [{ preco: 250, quantidade: 2 }] }; // 500

    const resultado = service.processar(pedidoPequeno);
    expect(resultado.isPedidoGrande).toBe(false);
    expect(mockNotificador.notificarPedidoGrande).not.toHaveBeenCalled();
  });
});
