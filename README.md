# Refatoração do Módulo de Pedidos (Clean Code & POO)

Projeto de engenharia de software focado na refatoração de código legado de pedidos, aplicando princípios **Clean Code**, **SOLID** e o padrão de projeto **Strategy**.

## 🚀 Como Executar

### 1. Testes Automatizados (Feedback Imediato)
```bash
npm test
```
Executa a suíte completa de testes no Vitest (10 testes cobrindo todos os cenários exigidos e casos extras de borda).

### 2. Painel Interativo Web
```bash
npm run dev
```
Acesse `http://localhost:3000` para abrir o simulador em tempo real, comparador de código lado a lado, executor de testes no navegador e exportador para Moodle.

---

## 📂 Arquivos Principais

- [`pedido.ts`](./pedido.ts) ou [`src/pedido.ts`](./src/pedido.ts): Implementação refatorada com `EstrategiaDesconto`, `ServicoNotificacao` e `PedidoService`.
- [`pedido.test.ts`](./pedido.test.ts): Casos de teste formais solicitados para entrega no Moodle.
- [`src/pedido.test.ts`](./src/pedido.test.ts): Bateria estendida de testes unitários com mocks e validações de OCP.
- [`DOCUMENTACAO.md`](./DOCUMENTACAO.md): Documentação técnica completa com diagramas, análise de code smells e justificativas teóricas.

---

## 🎯 Padrões e Práticas Aplicadas

1. **Nomes Reveladores:** Variáveis expressivas substituindo `p`, `q`, `t`, `i`.
2. **Responsabilidade Única (SRP):** Funções especializadas e independentes para cálculo, desconto, volume e notificação.
3. **Sem Argumentos Flag:** Eliminação do parâmetro booleano `enviarEmail`.
4. **Strategy Pattern:** Descontos como contrato via interface `EstrategiaDesconto` (`DescontoComum`, `DescontoVip`, `DescontoFuncionario`, `DescontoPromocional`).
5. **Notificação Desacoplada:** Interface `ServicoNotificacao` isolada de regras de negócio financeiras.
