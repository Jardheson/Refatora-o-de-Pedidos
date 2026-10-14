import { test, expect } from 'vitest';
import { PedidoService, DescontoComum, DescontoVip, DescontoFuncionario } from './pedido';

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
