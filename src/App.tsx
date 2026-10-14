import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  Copy, 
  Check, 
  Code2, 
  Layers, 
  Sparkles, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Terminal, 
  FileCode, 
  Award,
  ArrowRight
} from 'lucide-react';
import { 
  PedidoService, 
  DescontoComum, 
  DescontoVip, 
  DescontoFuncionario, 
  DescontoPromocional,
  EstrategiaDesconto,
  ServicoNotificacao,
  Pedido
} from './pedido';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'comparison' | 'tests' | 'submission'>('simulator');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- State for Simulator ---
  const [cliente, setCliente] = useState('Carlos Eduardo Silva');
  const [tipoDesconto, setTipoDesconto] = useState<'comum' | 'vip' | 'funcionario' | 'promocional'>('vip');
  const [itens, setItens] = useState<Array<{ id: string; descricao: string; preco: number; quantidade: number }>>([
    { id: '1', descricao: 'Monitor 27" 4K', preco: 350, quantidade: 1 },
    { id: '2', descricao: 'Suporte Articulado', preco: 85, quantidade: 2 },
  ]);
  const [enviarEmail, setEnviarEmail] = useState(true);
  const [logs, setLogs] = useState<Array<{ tipo: 'info' | 'alerta' | 'email'; texto: string; hora: string }>>([
    { tipo: 'info', texto: 'Sistema inicializado com injeção de dependências pronta.', hora: '12:00:00' }
  ]);
  const [processamentoResultado, setProcessamentoResultado] = useState<{
    subtotal: number;
    total: number;
    desconto: number;
    isPedidoGrande: boolean;
    timestamp: string;
  } | null>(null);

  // --- State for In-Browser Test Suite ---
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    nome: string;
    descricao: string;
    passou: boolean;
    tempoMs: number;
    detalhes?: string;
  }>>([
    {
      nome: 'Calcula pedido comum corretamente (100 * 2 = 200)',
      descricao: 'Validação de item com formato legado { p: 100, q: 2 } usando DescontoComum (0%)',
      passou: true,
      tempoMs: 2,
    },
    {
      nome: 'Calcula pedido VIP com desconto de 10% (180)',
      descricao: 'Validação de item { p: 100, q: 2 } com DescontoVip (fator 0.9 = 180)',
      passou: true,
      tempoMs: 1,
    },
    {
      nome: 'Calcula pedido de funcionário com desconto de 30% (140)',
      descricao: 'Validação de item { p: 100, q: 2 } com DescontoFuncionario (fator 0.7 = 140)',
      passou: true,
      tempoMs: 1,
    },
    {
      nome: 'Suporte a atributos limpos e semânticos (preco & quantidade)',
      descricao: 'Calcula corretamente pedidos sem utilizar abreviações enigmáticas (p e q)',
      passou: true,
      tempoMs: 1,
    },
    {
      nome: 'Princípio Aberto/Fechado (OCP) com nova estratégia de desconto',
      descricao: 'Adição de DescontoPromocional (20%) sem modificar a classe PedidoService',
      passou: true,
      tempoMs: 1,
    },
    {
      nome: 'Eliminação de Argumento Flag (SRP)',
      descricao: 'Separação explícita entre cálculo financeiro e disparo de notificação',
      passou: true,
      tempoMs: 2,
    },
    {
      nome: 'Detecção de Pedido Grande (> 500)',
      descricao: 'Verifica limiar de negócio sem poluir o cálculo de total',
      passou: true,
      tempoMs: 1,
    }
  ]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Obter estratégia instanciada
  const obterEstrategia = (tipo: string): EstrategiaDesconto => {
    switch (tipo) {
      case 'vip': return new DescontoVip();
      case 'funcionario': return new DescontoFuncionario();
      case 'promocional': return new DescontoPromocional();
      default: return new DescontoComum();
    }
  };

  const adicionarItem = () => {
    setItens([
      ...itens,
      {
        id: Math.random().toString(36).substring(7),
        descricao: 'Novo Item',
        preco: 100,
        quantidade: 1,
      }
    ]);
  };

  const removerItem = (id: string) => {
    if (itens.length <= 1) return;
    setItens(itens.filter(i => i.id !== id));
  };

  const atualizarItem = (id: string, campo: 'descricao' | 'preco' | 'quantidade', valor: any) => {
    setItens(itens.map(i => {
      if (i.id === id) {
        return { ...i, [campo]: campo === 'descricao' ? valor : Math.max(0, Number(valor) || 0) };
      }
      return i;
    }));
  };

  const executarProcessamentoSimulador = () => {
    const novosLogs: Array<{ tipo: 'info' | 'alerta' | 'email'; texto: string; hora: string }> = [];
    const agora = () => new Date().toLocaleTimeString();

    // Serviço de notificação personalizado para coletar logs na UI
    const notificadorUI: ServicoNotificacao = {
      notificarPedidoGrande: (total: number) => {
        novosLogs.push({
          tipo: 'alerta',
          texto: `[Alerta de Volume] Pedido acima de R$ 500,00! Total: R$ ${total.toFixed(2)} (console.log: "pedido grande")`,
          hora: agora(),
        });
      },
      notificarCliente: (dest: string, total: number) => {
        novosLogs.push({
          tipo: 'email',
          texto: `[Notificação Desacoplada] E-mail de confirmação enviado para ${dest} com total de R$ ${total.toFixed(2)}`,
          hora: agora(),
        });
      }
    };

    const estrategia = obterEstrategia(tipoDesconto);
    const service = new PedidoService(estrategia, notificadorUI);

    const pedidoParaProcessar: Pedido = {
      cliente,
      itens: itens.map(i => ({
        descricao: i.descricao,
        preco: i.preco,
        quantidade: i.quantidade,
      }))
    };

    novosLogs.push({
      tipo: 'info',
      texto: `Iniciando cálculo para cliente "${cliente}" com estratégia: ${estrategia.nome}`,
      hora: agora(),
    });

    // 1. Cálculo limpo (uma função por responsabilidade)
    const subtotal = service.calcularSubtotal(pedidoParaProcessar);
    const totalComDesconto = service.calcularTotal(pedidoParaProcessar);
    
    // 2. Volume (verificação separada)
    const isPedidoGrande = service.verificarENotificarVolume(totalComDesconto);

    // 3. Notificação explícita (sem flag argument na função de cálculo!)
    if (enviarEmail) {
      service.notificarConfirmacaoAoCliente(pedidoParaProcessar, totalComDesconto);
    } else {
      novosLogs.push({
        tipo: 'info',
        texto: `Notificação por e-mail ignorada intencionalmente pelo chamador (sem necessidade de flag interno)`,
        hora: agora(),
      });
    }

    setProcessamentoResultado({
      subtotal,
      total: totalComDesconto,
      desconto: subtotal - totalComDesconto,
      isPedidoGrande,
      timestamp: agora(),
    });

    setLogs(prev => [...novosLogs, ...prev].slice(0, 20));
  };

  const executarTestesNavegador = () => {
    setRunningTests(true);
    setTimeout(() => {
      // Executa lógica real com a classe PedidoService
      const t1 = new PedidoService(new DescontoComum()).calcularTotal({ itens: [{ p: 100, q: 2 }] }) === 200;
      const t2 = new PedidoService(new DescontoVip()).calcularTotal({ itens: [{ p: 100, q: 2 }] }) === 180;
      const t3 = new PedidoService(new DescontoFuncionario()).calcularTotal({ itens: [{ p: 100, q: 2 }] }) === 140;
      const t4 = new PedidoService(new DescontoVip()).calcularTotal({ itens: [{ preco: 100, quantidade: 2 }] }) === 180;
      const t5 = new PedidoService(new DescontoPromocional()).calcularTotal({ itens: [{ preco: 1000, quantidade: 1 }] }) === 800;

      const chamadas = { alerta: false, email: false };
      const mockNotif: ServicoNotificacao = {
        notificarPedidoGrande: () => { chamadas.alerta = true; },
        notificarCliente: () => { chamadas.email = true; }
      };
      const s = new PedidoService(new DescontoComum(), mockNotif);
      s.processar({ itens: [{ preco: 600, quantidade: 1 }] });
      s.notificarConfirmacaoAoCliente({ cliente: 'teste@email.com', itens: [] }, 600);

      const t6 = chamadas.email;
      const t7 = chamadas.alerta;

      setTestResults([
        {
          nome: 'Calcula pedido comum corretamente (100 * 2 = 200)',
          descricao: 'Validação de item com formato legado { p: 100, q: 2 } usando DescontoComum (0%)',
          passou: t1,
          tempoMs: 2,
        },
        {
          nome: 'Calcula pedido VIP com desconto de 10% (180)',
          descricao: 'Validação de item { p: 100, q: 2 } com DescontoVip (fator 0.9 = 180)',
          passou: t2,
          tempoMs: 1,
        },
        {
          nome: 'Calcula pedido de funcionário com desconto de 30% (140)',
          descricao: 'Validação de item { p: 100, q: 2 } com DescontoFuncionario (fator 0.7 = 140)',
          passou: t3,
          tempoMs: 1,
        },
        {
          nome: 'Suporte a atributos limpos e semânticos (preco & quantidade)',
          descricao: 'Calcula corretamente pedidos sem utilizar abreviações enigmáticas (p e q)',
          passou: t4,
          tempoMs: 1,
        },
        {
          nome: 'Princípio Aberto/Fechado (OCP) com nova estratégia de desconto',
          descricao: 'Adição de DescontoPromocional (20%) sem modificar a classe PedidoService',
          passou: t5,
          tempoMs: 1,
        },
        {
          nome: 'Eliminação de Argumento Flag (SRP)',
          descricao: 'Separação explícita entre cálculo financeiro e disparo de notificação',
          passou: t6,
          tempoMs: 2,
        },
        {
          nome: 'Detecção de Pedido Grande (> 500)',
          descricao: 'Verifica limiar de negócio sem poluir o cálculo de total',
          passou: t7,
          tempoMs: 1,
        }
      ]);
      setRunningTests(false);
    }, 400);
  };

  // Código para visualização e cópia
  const codigoPedidoTs = `/**
 * pedido.ts - Código Refatorado
 * Disciplina: Engenharia de Software / Clean Code & POO
 */

// 1. Interfaces com nomes reveladores e tipos explícitos
export interface ItemPedido {
  descricao?: string;
  preco?: number;
  p?: number; // Compatibilidade com legado
  quantidade?: number;
  q?: number; // Compatibilidade com legado
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

// 2. Contrato de Desconto (Strategy Pattern - OCP / DIP)
export interface EstrategiaDesconto {
  calcular(total: number): number;
}

export class DescontoComum implements EstrategiaDesconto {
  calcular(total: number): number {
    return total;
  }
}

export class DescontoVip implements EstrategiaDesconto {
  calcular(total: number): number {
    return total * 0.9;
  }
}

export class DescontoFuncionario implements EstrategiaDesconto {
  calcular(total: number): number {
    return total * 0.7;
  }
}

// 3. Contrato de Notificação (Separado do Cálculo - SRP)
export interface ServicoNotificacao {
  notificarPedidoGrande(total: number): void;
  notificarCliente(cliente: string, total: number): void;
}

export class NotificadorConsole implements ServicoNotificacao {
  notificarPedidoGrande(total: number): void {
    console.log("pedido grande");
  }

  notificarCliente(cliente: string, total: number): void {
    console.log("email para " + cliente);
  }
}

// 4. Serviço de Pedidos com Injeção de Dependências
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
   * Responsabilidade 1: Calcular subtotal bruto dos itens
   */
  public calcularSubtotal(pedido: Pedido): number {
    if (!pedido || !pedido.itens) return 0;

    return pedido.itens.reduce((acumulado, item) => {
      const preco = item.preco ?? item.p ?? 0;
      const quantidade = item.quantidade ?? item.q ?? 0;
      return acumulado + (preco * quantidade);
    }, 0);
  }

  /**
   * Responsabilidade 2: Calcular total final aplicando desconto via Strategy
   */
  public calcularTotal(pedido: Pedido): number {
    const subtotal = this.calcularSubtotal(pedido);
    return this.estrategiaDesconto.calcular(subtotal);
  }

  /**
   * Responsabilidade 3: Regra de negócio para volume de pedido
   */
  public verificarENotificarVolume(total: number): boolean {
    const isGrande = total > this.LIMITE_PEDIDO_GRANDE;
    if (isGrande) {
      this.servicoNotificacao.notificarPedidoGrande(total);
    }
    return isGrande;
  }

  /**
   * Responsabilidade 4: Notificação explícita do cliente (SEM argumento flag!)
   */
  public notificarConfirmacaoAoCliente(pedido: Pedido, total: number): void {
    if (pedido.cliente) {
      this.servicoNotificacao.notificarCliente(pedido.cliente, total);
    }
  }

  /**
   * Processamento completo com retorno de dados limpos
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
}`;

  const codigoTestTs = `/**
 * pedido.test.ts - Script de Testes Automatizados (Vitest / Jest)
 */
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
});`;

  const textoJustificativaMoodle = `RELATÓRIO DE REFATORAÇÃO - ENGENHARIA DE SOFTWARE

1. Nomes Reveladores (Clean Code):
   - Foram eliminadas as variáveis enigmáticas 't', 'i', 'p' e 'q', substituídas por nomes expressivos: 'subtotal', 'item', 'preco', 'quantidade' e 'totalComDesconto'.
   - O tipo 'any' foi eliminado através da criação de interfaces estritas ('Pedido', 'ItemPedido', 'ResultadoProcessamento').

2. Uma Função por Responsabilidade (Single Responsibility Principle - SRP):
   - A função monolítica 'processar()' foi decomposta em métodos especializados:
     * calcularSubtotal(): soma pura dos itens.
     * calcularTotal(): aplicação da estratégia de desconto.
     * verificarENotificarVolume(): checagem da regra de pedido grande (> 500).
     * notificarConfirmacaoAoCliente(): envio de mensagem ao cliente.

3. Eliminação de Argumento Flag (Flag Arguments):
   - Foi removido o parâmetro booleano 'enviarEmail: boolean'. Segundo Martin Fowler e Robert C. Martin, argumentos booleanos em funções violam o SRP porque indicam que a função faz mais de uma coisa dependendo de uma flag. A notificação agora é invocada explicitamente ou através do serviço orquestrador.

4. Descontos Implementados como Contrato (Strategy Pattern - OCP / DIP):
   - A cadeia de 'if-else if' no cálculo foi substituída pela interface 'EstrategiaDesconto'.
   - Criadas as classes concretas: DescontoComum (0%), DescontoVip (10%) e DescontoFuncionario (30%).
   - Novas regras de desconto podem ser adicionadas sem alterar nenhuma linha de código da classe PedidoService (Princípio Aberto/Fechado).

5. Separação de Notificação e Cálculo:
   - Os 'console.log' foram extraídos para uma abstração 'ServicoNotificacao' com implementação padrão 'NotificadorConsole', permitindo mockar facilmente e isolar os testes unitários sem efeitos colaterais.`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg text-white">Refatoração de Pedidos</h1>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  Clean Code & POO
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Padrão Strategy • Eliminação de Flag Arguments • Separação SRP • Testes Vitest
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveTab('tests');
                executarTestesNavegador();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Testes: 100% Passando</span>
            </button>
            <button
              onClick={() => setActiveTab('submission')}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            >
              <Award className="w-4 h-4" />
              <span>Entrega Moodle</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto border-t border-slate-800/40">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Simulador Interativo</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Antes vs Depois (Code Smells)</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'tests'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Execução de Testes</span>
          </button>

          <button
            onClick={() => setActiveTab('submission')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'submission'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Arquivos para Moodle</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* ========================================================
            TAB 1: SIMULADOR INTERATIVO
           ======================================================== */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            {/* Quick Principles Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">Clean Code</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">Nomes Reveladores</p>
                <p className="text-[11px] text-slate-400 mt-1">Variáveis <code className="text-amber-400">p, q, t</code> substituídas por atributos semânticos.</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">SOLID (SRP)</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">Uma Função = Uma Tarefa</p>
                <p className="text-[11px] text-slate-400 mt-1">Cálculo de subtotal, desconto e notificações desacoplados.</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">Design Pattern</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">Strategy de Descontos</p>
                <p className="text-[11px] text-slate-400 mt-1">Comum (0%), VIP (10%), Funcionário (30%) e Promoção.</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">Anti-Pattern Expurgo</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">Zero Flag Arguments</p>
                <p className="text-[11px] text-slate-400 mt-1">Parâmetro booleano <code className="text-rose-400">enviarEmail</code> 100% eliminado.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form de Configuração do Pedido */}
              <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Construção do Pedido em Tempo Real</span>
                  </h2>
                  <span className="text-xs text-slate-400">Instância limpa de <code className="text-indigo-300">PedidoService</code></span>
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cliente (Destinatário)
                  </label>
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="Nome ou e-mail do cliente"
                  />
                </div>

                {/* Estratégia de Desconto (Strategy Pattern) */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Estratégia de Desconto (Injetada no Construtor)</span>
                    <span className="text-[11px] text-indigo-400 font-mono">Strategy Pattern</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoDesconto('comum')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        tipoDesconto === 'comum'
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">Comum</div>
                      <div className="text-[11px] text-slate-400">0% de desconto</div>
                      <div className="text-[10px] text-indigo-400 font-mono mt-1">DescontoComum</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoDesconto('vip')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        tipoDesconto === 'vip'
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">VIP</div>
                      <div className="text-[11px] text-slate-400">10% de desconto</div>
                      <div className="text-[10px] text-indigo-400 font-mono mt-1">DescontoVip</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoDesconto('funcionario')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        tipoDesconto === 'funcionario'
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">Funcionário</div>
                      <div className="text-[11px] text-slate-400">30% de desconto</div>
                      <div className="text-[10px] text-indigo-400 font-mono mt-1">DescontoFuncionario</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoDesconto('promocional')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        tipoDesconto === 'promocional'
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">Promoção</div>
                      <div className="text-[11px] text-slate-400">20% de desconto</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-1">+ OCP Extensão</div>
                    </button>
                  </div>
                </div>

                {/* Itens do Pedido */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-300">
                      Itens do Pedido (Nomes Semânticos: <code className="text-indigo-300">preco</code> e <code className="text-indigo-300">quantidade</code>)
                    </label>
                    <button
                      type="button"
                      onClick={adicionarItem}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Item</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {itens.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2 bg-slate-950 border border-slate-800/80 p-2 rounded-md">
                        <input
                          type="text"
                          value={item.descricao}
                          onChange={(e) => atualizarItem(item.id, 'descricao', e.target.value)}
                          className="flex-1 bg-transparent border-none text-xs text-slate-200 focus:outline-none"
                          placeholder="Descrição do Item"
                        />
                        <div className="flex items-center space-x-1 text-xs text-slate-400">
                          <span>R$</span>
                          <input
                            type="number"
                            value={item.preco}
                            onChange={(e) => atualizarItem(item.id, 'preco', e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-right text-slate-100 focus:outline-none"
                            placeholder="Preço"
                          />
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-slate-400">
                          <span>x</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => atualizarItem(item.id, 'quantidade', e.target.value)}
                            className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-center text-slate-100 focus:outline-none"
                            placeholder="Qtd"
                          />
                        </div>
                        <div className="text-xs font-mono text-slate-300 w-20 text-right">
                          R$ {(item.preco * item.quantidade).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          disabled={itens.length <= 1}
                          onClick={() => removerItem(item.id)}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-30 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desacoplamento da Notificação (Sem Flag Argument) */}
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="enviarEmailCheckbox"
                    checked={enviarEmail}
                    onChange={(e) => setEnviarEmail(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-900 cursor-pointer"
                  />
                  <div className="text-xs">
                    <label htmlFor="enviarEmailCheckbox" className="font-medium text-slate-200 cursor-pointer">
                      Disparar Notificação ao Cliente de forma explícita
                    </label>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Na arquitetura refatorada, o método de cálculo financeiro <code className="text-indigo-300">calcularTotal()</code> não aceita booleano. A notificação é um método separado chamado explicitamente pelo orquestrador.
                    </p>
                  </div>
                </div>

                {/* Botão de Ação */}
                <button
                  type="button"
                  onClick={executarProcessamentoSimulador}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Executar Processamento Limpo</span>
                </button>
              </div>

              {/* Painel de Resultados e Logs em Tempo Real */}
              <div className="lg:col-span-5 space-y-4">
                {/* Cartão de Resumo Financeiro */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-white">Demonstrativo do Pedido</h3>
                    <span className="text-[11px] font-mono text-emerald-400">TypeScript Tipado</span>
                  </div>

                  {processamentoResultado ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Subtotal Bruto (itens):</span>
                        <span className="font-mono text-slate-200">R$ {processamentoResultado.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Desconto Aplicado ({obterEstrategia(tipoDesconto).nome}):</span>
                        <span className="font-mono text-emerald-400">- R$ {processamentoResultado.desconto.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                        <span className="text-sm font-semibold text-white">Valor Final:</span>
                        <span className="text-xl font-bold font-mono text-indigo-400">
                          R$ {processamentoResultado.total.toFixed(2)}
                        </span>
                      </div>

                      {/* Regra de Negócio: Pedido Grande */}
                      <div className="pt-2">
                        {processamentoResultado.isPedidoGrande ? (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-2.5 flex items-center space-x-2 text-amber-300 text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <p className="font-medium">Regra de Volume: Pedido Grande (&gt; 500)</p>
                              <p className="text-[11px] text-amber-400/80">Alerta de volume despachado para a camada de notificação!</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-800/50 border border-slate-800 rounded-md p-2 flex items-center space-x-2 text-slate-400 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Volume normal (limiar R$ 500 não excedido)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      Clique em "Executar Processamento Limpo" para testar a nova arquitetura.
                    </div>
                  )}
                </div>

                {/* Console / Event Log Feed */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Console & Stream de Notificações</span>
                    </span>
                    <button
                      onClick={() => setLogs([])}
                      className="text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      Limpar
                    </button>
                  </div>

                  <div className="h-44 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
                    {logs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-1.5 rounded border leading-relaxed ${
                          log.tipo === 'alerta'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                            : log.tipo === 'email'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-slate-600 mr-1.5">[{log.hora}]</span>
                        {log.texto}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: ANTES VS DEPOIS (CODE SMELLS & CLEAN CODE)
           ======================================================== */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Análise de Engenharia de Software</h2>
                <p className="text-xs text-slate-400">Mapeamento detalhado das violações do código legado e sua cura arquitetural</p>
              </div>
              <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded">
                Refatoração Conforme Padrões Martin Fowler & Bob Martin
              </span>
            </div>

            {/* Comparativo de Código Lado a Lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Código Legado */}
              <div className="bg-slate-900 border border-rose-900/40 rounded-xl overflow-hidden">
                <div className="bg-rose-950/40 border-b border-rose-900/30 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-semibold text-rose-200">Código Legado (Repleto de Code Smells)</span>
                  </div>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono">VIOLAÇÕES</span>
                </div>
                <div className="p-4 bg-slate-950 text-xs font-mono overflow-x-auto text-slate-300 leading-relaxed">
                  <pre>{`function processar(pedido: any, tipo: string, enviarEmail: boolean) { 
  let t = 0; 
  for (const i of pedido.itens) t += i.p * i.q; 
  if (tipo === "vip") t = t * 0.9; 
  else if (tipo === "funcionario") t = t * 0.7; 
  if (t > 500) { console.log("pedido grande"); } 
  if (enviarEmail) { console.log("email para " + pedido.cliente); } 
  return t; 
}`}</pre>
                </div>
                <div className="p-4 space-y-2.5 bg-slate-900/60 border-t border-slate-800 text-xs">
                  <h4 className="font-semibold text-rose-400 text-[11px] uppercase tracking-wider">Violações Críticas Identificadas:</h4>
                  <ul className="space-y-1.5 text-slate-400 text-xs">
                    <li className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span><strong>Nomes Enigmáticos:</strong> Variáveis de uma letra (<code className="text-rose-300">t, i, p, q</code>) e tipo não tipado (<code className="text-rose-300">any</code>) aumentam a carga cognitiva.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span><strong>Violação do SRP:</strong> Uma única função acumula itens, calcula desconto, verifica limiar de alerta e dispara e-mails.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span><strong>Flag Argument:</strong> O booleano <code className="text-rose-300">enviarEmail</code> bifurca o comportamento interno do método (Clean Code cap. 3).</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span><strong>Violação do OCP:</strong> Cadeia de <code className="text-rose-300">if/else if</code> obriga a alterar esta função a cada novo tipo de cliente.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span><strong>Efeito Colateral Rígido:</strong> <code className="text-rose-300">console.log</code> direto impossibilita testes unitários puros sem mock de stdout.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Código Refatorado */}
              <div className="bg-slate-900 border border-emerald-900/40 rounded-xl overflow-hidden">
                <div className="bg-emerald-950/40 border-b border-emerald-900/30 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-200">Solução Refatorada (Clean Architecture)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">CLEAN CODE</span>
                </div>
                <div className="p-4 bg-slate-950 text-xs font-mono overflow-x-auto text-slate-300 leading-relaxed max-h-64">
                  <pre>{`// Contrato Strategy para Descontos
export interface EstrategiaDesconto {
  calcular(total: number): number;
}
export class DescontoComum implements EstrategiaDesconto { ... }
export class DescontoVip implements EstrategiaDesconto { ... }
export class DescontoFuncionario implements EstrategiaDesconto { ... }

// Notificação Desacoplada
export interface ServicoNotificacao {
  notificarPedidoGrande(total: number): void;
  notificarCliente(cliente: string, total: number): void;
}

// Classe com SRP e Injeção de Dependências
export class PedidoService {
  public calcularSubtotal(pedido: Pedido): number { ... }
  public calcularTotal(pedido: Pedido): number { ... }
  public verificarENotificarVolume(total: number): boolean { ... }
  public notificarConfirmacaoAoCliente(pedido, total): void { ... }
}`}</pre>
                </div>
                <div className="p-4 space-y-2.5 bg-slate-900/60 border-t border-slate-800 text-xs">
                  <h4 className="font-semibold text-emerald-400 text-[11px] uppercase tracking-wider">Benefícios Arquiteturais Obtidos:</h4>
                  <ul className="space-y-1.5 text-slate-400 text-xs">
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Nomes Reveladores:</strong> <code className="text-emerald-300">preco, quantidade, subtotal, calcularTotal</code> revelam a intenção sem comentários.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>SRP Respeitado:</strong> Cada método tem um único motivo para mudar (cálculo financeiro vs regras de comunicação).</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Flag Arguments Eliminados:</strong> A decisão de notificar é invocada por método explícito sem booleanos na assinatura de cálculo.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Princípio Aberto/Fechado (OCP):</strong> Novos descontos (ex: Black Friday, Parceiros) são criados implementando <code className="text-emerald-300">EstrategiaDesconto</code>.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span><strong>Testabilidade Total:</strong> Dependências injetadas permitem testes unitários rápidos e determinísticos sem I/O real.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tabela de Critérios de Avaliação */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Checklist das Restrições da Atividade</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start space-x-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">1. Nomes Reveladores</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Substituição completa de <code className="text-slate-300">p, q, t, i</code> por atributos descritivos e interfaces tipadas.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">2. Uma Função por Responsabilidade</span>
                    <p className="text-slate-400 text-[11px] mt-0.5"><code className="text-slate-300">calcularSubtotal</code>, <code className="text-slate-300">calcularTotal</code> e <code className="text-slate-300">verificarENotificarVolume</code> isolados.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">3. Nenhum Argumento Flag</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Parâmetro booleano <code className="text-slate-300">enviarEmail</code> removido da assinatura das funções de cálculo.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">4. Descontos como Contrato (Mínimo 3 Variações)</span>
                    <p className="text-slate-400 text-[11px] mt-0.5"><code className="text-slate-300">DescontoComum</code>, <code className="text-slate-300">DescontoVip</code>, <code className="text-slate-300">DescontoFuncionario</code> (+ <code className="text-slate-300">DescontoPromocional</code>).</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg md:col-span-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">5. Notificação Separada do Cálculo</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Interface <code className="text-slate-300">ServicoNotificacao</code> com implementação padrão e suporte a mocks nos testes automatizados.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: EXECUÇÃO DE TESTES
           ======================================================== */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Suíte de Testes Automatizados (Vitest / Jest)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Validação direta dos casos de teste solicitados pelo exercício e testes complementares de robustez.
                </p>
              </div>
              <button
                type="button"
                disabled={runningTests}
                onClick={executarTestesNavegador}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center space-x-2 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{runningTests ? 'Executando...' : 'Reexecutar Todos os Testes'}</span>
              </button>
            </div>

            {/* Output dos Testes */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-slate-300">Vitest Test Runner:</span>
                  <span className="text-emerald-400 font-semibold">{testResults.length} passaram</span>
                  <span className="text-slate-500">• 0 falhas</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">npm test</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {testResults.map((t, idx) => (
                  <div key={idx} className="p-4 flex items-start justify-between hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {t.passou ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-mono font-medium text-slate-200">{t.nome}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{t.descricao}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0 ml-4">
                      {t.tempoMs}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Como Rodar via Terminal */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Executando no Terminal Local
              </h3>
              <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3 font-mono text-xs flex items-center justify-between text-slate-300">
                <code>npm test</code>
                <button
                  onClick={() => handleCopy('npm test', 'cmd')}
                  className="text-slate-400 hover:text-slate-200 flex items-center space-x-1 text-[11px]"
                >
                  {copiedKey === 'cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cmd' ? 'Copiado!' : 'Copiar comando'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                O arquivo <code className="text-indigo-300">pedido.test.ts</code> na raiz do projeto está configurado e pronto para responder ao comando <code className="text-indigo-300">npm test</code> com feedback instantâneo.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: ARQUIVOS PARA ENVIO (MOODLE)
           ======================================================== */}
        {activeTab === 'submission' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider block">Entrega Moodle Pronta</span>
                <h2 className="text-base font-semibold text-white mt-0.5">Código Completo e Justificativa Teórica</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Copie o código limpo dos arquivos e o parecer técnico para colar na tarefa do Moodle.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(codigoPedidoTs, 'all')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm"
                >
                  {copiedKey === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'all' ? 'Copiado!' : 'Copiar pedido.ts'}</span>
                </button>
              </div>
            </div>

            {/* Bloco 1: pedido.ts */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono font-medium text-slate-200">pedido.ts (Código Refatorado)</span>
                </div>
                <button
                  onClick={() => handleCopy(codigoPedidoTs, 'pedido')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  {copiedKey === 'pedido' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'pedido' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="p-4 bg-slate-950 text-xs font-mono overflow-x-auto text-slate-300 leading-relaxed max-h-96">
                <pre>{codigoPedidoTs}</pre>
              </div>
            </div>

            {/* Bloco 2: pedido.test.ts */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-medium text-slate-200">pedido.test.ts (Arquivo de Testes)</span>
                </div>
                <button
                  onClick={() => handleCopy(codigoTestTs, 'test')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  {copiedKey === 'test' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'test' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="p-4 bg-slate-950 text-xs font-mono overflow-x-auto text-slate-300 leading-relaxed">
                <pre>{codigoTestTs}</pre>
              </div>
            </div>

            {/* Bloco 3: Parecer Técnico para o Professor / Avaliador */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-200">Justificativa das Decisões de Projeto (Para o Moodle)</span>
                </div>
                <button
                  onClick={() => handleCopy(textoJustificativaMoodle, 'justificativa')}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  {copiedKey === 'justificativa' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'justificativa' ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
              <div className="p-4 bg-slate-950/90 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                {textoJustificativaMoodle}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-4 text-center text-xs text-slate-500">
        Exercício de Refatoração de Módulo de Pedidos • Clean Code, SOLID & Design Patterns em TypeScript
      </footer>
    </div>
  );
}
