# 📘 Documentação Técnica: Refatoração do Módulo de Pedidos

> **Disciplina / Tópico:** Engenharia de Software, Programação Orientada a Objetos (POO) & Boas Práticas de Clean Code  
> **Linguagem & Ferramental:** TypeScript, Node.js, Vitest / Jest, React, Tailwind CSS  
> **Padrões de Projeto Aplicados:** Strategy Pattern (GoF), Dependency Injection (DIP), Single Responsibility Principle (SRP), Open/Closed Principle (OCP)

---

## 1. Contexto e Objetivo

O exercício propõe a refatoração de um módulo legado de cálculo de pedidos e disparo de notificações que, apesar de funcional, apresenta sérias dívidas técnicas (*technical debt*), acoplamento indevido e diversas violações das boas práticas de engenharia de software e POO.

### 1.1 Código Legado Analisado
```typescript
function processar(pedido: any, tipo: string, enviarEmail: boolean) { 
  let t = 0; 
  for (const i of pedido.itens) t += i.p * i.q; 
  if (tipo === "vip") t = t * 0.9; 
  else if (tipo === "funcionario") t = t * 0.7; 
  if (t > 500) { console.log("pedido grande"); } 
  if (enviarEmail) { console.log("email para " + pedido.cliente); } 
  return t; 
}
```

---

## 2. Diagnóstico de Code Smells e Violações Arquiteturais

| Item | Code Smell / Violação | Impacto Negativo | Resolução na Refatoração |
| :--- | :--- | :--- | :--- |
| **1** | **Nomes Enigmáticos / Abreviações** (`t`, `i`, `p`, `q`, `any`) | Alta carga cognitiva, perda de contexto e ausência de *type safety*. | Substituição por `subtotal`, `item`, `preco`, `quantidade` e interfaces tipadas (`Pedido`, `ItemPedido`). |
| **2** | **Violação do SRP (Single Responsibility Principle)** | Uma única função acumulava cálculo de itens, cálculo de descontos, regra de volume e I/O de comunicação. | Decomposição em métodos coesos: `calcularSubtotal()`, `calcularTotal()`, `verificarENotificarVolume()`. |
| **3** | **Argumento Flag (*Flag Argument*)** (`enviarEmail: boolean`) | Divide a função em duas ramificações comportamentais distintas (Clean Code, cap. 3). | Remoção do parâmetro booleano. Disparo de notificação passa a ser uma chamada explícita do orquestrador. |
| **4** | **Violação do OCP (Open/Closed Principle)** | Uso de `if (tipo === "vip") ... else if (tipo === "funcionario")`. | Aplicação do **Strategy Pattern** via interface `EstrategiaDesconto`, aberta para extensão e fechada para modificação. |
| **5** | **Acoplamento Rígido com I/O (`console.log`)** | Impossibilita testes unitários puros sem efeitos colaterais e impede substituição por gateways de e-mail reais. | Inversão de dependência com a interface `ServicoNotificacao` e injeção via construtor. |

---

## 3. Arquitetura da Solução

### 3.1 Diagrama de Classes e Relações

```text
       ┌────────────────────────┐
       │   EstrategiaDesconto   │ <<interface>>
       ├────────────────────────┤
       │ + calcular(t): number  │
       └───────────▲────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────────┐
    │              │              │                  │
┌───┴────────────┐ ┌──┴─────────┐ ┌──┴─────────────┐ ┌──┴───────────────┐
│ DescontoComum  │ │DescontoVip │ │DescontoFunciona│ │DescontoPromocao  │
│ factor: 1.0    │ │factor: 0.9 │ │factor: 0.7     │ │factor: 0.8       │
└────────────────┘ └────────────┘ └────────────────┘ └──────────────────┘

       ┌────────────────────────┐
       │   ServicoNotificacao   │ <<interface>>
       ├────────────────────────┤
       │ + notificarPedidoG...  │
       │ + notificarCliente...  │
       └───────────▲────────────┘
                   │
       ┌───────────┴────────────┐
       │   NotificadorConsole   │ (ou Mocks para Testes)
       └────────────────────────┘

                   ▲
                   │ (injeção de dependência via construtor)
       ┌───────────┴────────────┐
       │     PedidoService      │
       ├────────────────────────┤
       │ - estrategiaDesconto   │
       │ - servicoNotificacao   │
       │ - LIMITE_PEDIDO_GRANDE │
       ├────────────────────────┤
       │ + calcularSubtotal()   │
       │ + calcularTotal()      │
       │ + verificarENotificar()│
       │ + notificarCliente()   │
       │ + processar()          │
       └────────────────────────┘
```

---

## 4. Especificação da API (`src/pedido.ts`)

### 4.1 Modelos de Dados

```typescript
export interface ItemPedido {
  descricao?: string;
  preco?: number;
  p?: number; // Suporte retrocompatível
  quantidade?: number;
  q?: number; // Suporte retrocompatível
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
}
```

### 4.2 Estratégias de Desconto (Strategy Pattern)

- **`EstrategiaDesconto`** *(interface)*: Contrato único que define o método `calcular(total: number): number`.
- **`DescontoComum`**: Retorna o total integral (`total * 1.0`), aplicado a clientes comuns.
- **`DescontoVip`**: Aplica 10% de abatimento (`total * 0.9`).
- **`DescontoFuncionario`**: Aplica 30% de abatimento (`total * 0.7`).
- **`DescontoPromocional`**: Extensão extra com 20% de desconto (`total * 0.8`), provando a extensibilidade sem modificar classes existentes (OCP).

### 4.3 Camada de Notificação Desacoplada

- **`ServicoNotificacao`** *(interface)*:
  - `notificarPedidoGrande(total: number): void`
  - `notificarCliente(cliente: string, total: number): void`
- **`NotificadorConsole`**: Implementação padrão que emite logs no console sem travar o processamento.

### 4.4 Classe de Serviço (`PedidoService`)

- **`constructor(estrategiaDesconto, servicoNotificacao)`**: Injeta as dependências via inversão de controle (IoC).
- **`calcularSubtotal(pedido: Pedido): number`**: Realiza apenas a soma aritmética ponderada dos itens.
- **`calcularTotal(pedido: Pedido): number`**: Aplica a estratégia de desconto ativa sobre o subtotal.
- **`verificarENotificarVolume(total: number): boolean`**: Valida se o montante ultrapassa R$ 500,00 e aciona o notificador.
- **`notificarConfirmacaoAoCliente(pedido: Pedido, total: number): void`**: Dispara a confirmação para o cliente de forma explícita, sem boolean flags.
- **`processar(pedido: Pedido): ResultadoProcessamento`**: Método orquestrador que devolve um objeto estruturado com todos os cálculos e indicadores.

---

## 5. Casos de Testes Automatizados (`pedido.test.ts`)

Os testes validam com precisão as especificações do exercício:

```typescript
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
```

### 5.1 Testes Complementares Implementados (`src/pedido.test.ts`)
1. **Atributos Limpos:** Validação usando nomes semânticos (`preco` e `quantidade`).
2. **Princípio Aberto/Fechado:** Validação de novas estratégias sem alterar `PedidoService`.
3. **Isolamento de Efeitos Colaterais:** Uso de mocks (`vi.fn()`) para testar notificações sem chamadas ao `console.log`.
4. **Limiar de Pedido Grande:** Verificação de que valores `<= 500` não acionam alerta de pedido grande.

---

## 6. Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (versão 18 ou superior)
- Gerenciador de pacotes npm

### Instalação das Dependências
```bash
npm install
```

### Executar Testes Automatizados (Feedback Imediato)
```bash
npm test
```
*Saída esperada:*
```text
✓ src/pedido.test.ts (7 tests)
✓ pedido.test.ts (3 tests)
Test Files  2 passed (2)
     Tests  10 passed (10)
```

### Iniciar Aplicação Web Interativa
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador para utilizar o **Simulador Interativo**, visualizar o **Comparativo Antes vs Depois** e testar a suíte ao vivo.

---

## 7. Modelo de Texto para Envio no Moodle

```text
Prezado(a) Professor(a),

Segue a entrega do exercício de refatoração do módulo de pedidos.

Decisões de Engenharia de Software Adotadas:
1. Nomes Reveladores: Eliminou-se o uso de abreviações crípticas ('t', 'i', 'p', 'q') e o tipo 'any', adotando interfaces TypeScript tipadas e semânticas ('preco', 'quantidade', 'subtotal').
2. Princípio da Responsabilidade Única (SRP): A função monolítica 'processar()' foi dividida em métodos com propósito único: 'calcularSubtotal()', 'calcularTotal()', 'verificarENotificarVolume()' e 'notificarConfirmacaoAoCliente()'.
3. Eliminação de Argumento Flag: Foi eliminado o parâmetro booleano 'enviarEmail', que dividia o comportamento do método. A notificação agora é chamada explicitamente.
4. Strategy Pattern (Contrato de Descontos): Criada a interface 'EstrategiaDesconto' com as implementações 'DescontoComum', 'DescontoVip' e 'DescontoFuncionario', respeitando o Princípio Aberto/Fechado (OCP).
5. Desacoplamento de Notificação: Criada a interface 'ServicoNotificacao', permitindo mockar disparos e isolar totalmente a lógica matemática de efeitos colaterais.

Os testes foram executados com Vitest ('npm test') com 100% de sucesso.
```
