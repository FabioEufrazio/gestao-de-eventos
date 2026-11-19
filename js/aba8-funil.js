// Aba 8: Funil de Vendas & Panorama Geral (Pipeline Comercial, Kanban e Análise Financeira)

window.Aba8Funil = {
  modoVisao: 'KANBAN', // 'KANBAN' ou 'TABELA'
  filtroBusca: '',
  filtroStatus: 'TODOS',
  filtroLinha: 'TODAS',
  filtroPeriodo: 'TODOS', // 'TODOS', 'PROXIMOS_30', 'MES_ATUAL', 'FUTUROS', 'PASSADOS'
  evitarDuplicidadeClienteNoResumo: false,
  draggedPropostaId: null,

  ETAPAS: [
    {
      id: 'Em Aberto',
      titulo: '1. Em Aberto / Enviadas',
      curto: 'Em Aberto',
      descricao: 'Orçamentos criados aguardando retorno inicial',
      icone: 'send',
      corHeader: 'bg-blue-600 text-white',
      corBgCol: 'bg-blue-50/40 border-blue-200',
      corBadge: 'bg-blue-100 text-blue-800 border-blue-300',
      corBarra: 'bg-blue-600',
      corTexto: 'text-blue-700'
    },
    {
      id: 'Em Negociação',
      titulo: '2. Em Negociação',
      curto: 'Em Negociação',
      descricao: 'Cliente analisando opções, ajustes ou degustação',
      icone: 'message-square-more',
      corHeader: 'bg-amber-500 text-white',
      corBgCol: 'bg-amber-50/40 border-amber-200',
      corBadge: 'bg-amber-100 text-amber-800 border-amber-300',
      corBarra: 'bg-amber-500',
      corTexto: 'text-amber-700'
    },
    {
      id: 'Aprovada',
      titulo: '3. Aprovadas / Fechadas',
      curto: 'Aprovada',
      descricao: 'Contrato fechado e evento confirmado na agenda',
      icone: 'check-circle-2',
      corHeader: 'bg-emerald-600 text-white',
      corBgCol: 'bg-emerald-50/40 border-emerald-200',
      corBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      corBarra: 'bg-emerald-600',
      corTexto: 'text-emerald-700'
    },
    {
      id: 'Realizada',
      titulo: '4. Eventos Realizados',
      curto: 'Realizada',
      descricao: 'Eventos já executados e finalizados com sucesso',
      icone: 'party-popper',
      corHeader: 'bg-indigo-600 text-white',
      corBgCol: 'bg-indigo-50/40 border-indigo-200',
      corBadge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      corBarra: 'bg-indigo-600',
      corTexto: 'text-indigo-700'
    },
    {
      id: 'Cancelada',
      titulo: '5. Perdidas / Canceladas',
      curto: 'Cancelada',
      descricao: 'Propostas declinadas, sem fechamento ou opções descartadas',
      icone: 'x-circle',
      corHeader: 'bg-slate-600 text-white',
      corBgCol: 'bg-slate-100/70 border-slate-200',
      corBadge: 'bg-red-100 text-red-800 border-red-300',
      corBarra: 'bg-red-500',
      corTexto: 'text-red-700'
    }
  ],

  esc(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  normalizarStatus(status) {
    const st = String(status || 'Em Aberto').trim();
    if (this.ETAPAS.some((e) => e.id === st)) return st;
    return 'Em Aberto';
  },

  getInfoEtapa(status) {
    const st = this.normalizarStatus(status);
    return this.ETAPAS.find((e) => e.id === st) || this.ETAPAS[0];
  },

  formatarDataBR(dataStr) {
    if (!dataStr) return 'Sem data';
    const partes = String(dataStr).split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  },

  calcularDiasAteEvento(dataStr) {
    if (!dataStr) return null;
    const partes = String(dataStr).split('T')[0].split('-');
    if (partes.length !== 3) return null;
    const dataEv = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    if (isNaN(dataEv.getTime())) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diffMs = dataEv.getTime() - hoje.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  },

  obterPropostasEnriquecidas() {
    const propostas = Store.state.propostas || [];
    const clientes = Store.state.clientes || [];

    // Conta quantas propostas cada cliente possui no total
    const contagemPorCliente = {};
    propostas.forEach((p) => {
      if (p.clienteId) {
        contagemPorCliente[p.clienteId] = (contagemPorCliente[p.clienteId] || 0) + 1;
      }
    });

    return propostas.map((p) => {
      const cli = clientes.find((c) => c.id === p.clienteId);
      const consolidado = Store.consolidarProposta(p);
      const statusNorm = this.normalizarStatus(p.status);
      const numConvidados = Math.max(1, Number(p.numConvidados) || 100);
      const valorTotal = Number(consolidado.custoTotalEvento) || 0;
      const custoRealInsumos = Number(consolidado.custoRealTotalInsumos ?? consolidado.custoTotalInsumos) || 0;
      const valorRepasseInsumos = Number(consolidado.custoTotalInsumos) || 0;
      const lucroInsumos = Number(consolidado.lucroTotalInsumos) || Math.max(0, valorRepasseInsumos - custoRealInsumos);
      const custoServicos = Number(consolidado.custoTotalServicos) || 0;
      const custoRealTotal = custoRealInsumos + custoServicos;
      const valorPorConvidado = valorTotal / numConvidados;
      const diasAteEvento = this.calcularDiasAteEvento(p.dataEvento);
      const qtdOpcoesCliente = p.clienteId ? contagemPorCliente[p.clienteId] || 1 : 1;

      return {
        proposta: p,
        id: p.id,
        codigo: p.codigo || 'PROP',
        nomeEvento: p.nomeEvento || 'Evento sem nome',
        dataEvento: p.dataEvento || '',
        localEvento: p.localEvento || '',
        status: statusNorm,
        linhaInsumos: p.linhaInsumos || 'A',
        numConvidados,
        duracaoHoras: Number(p.duracaoHoras) || 6,
        qtdBartenders: Number(consolidado.qtdBartenders || p.qtdBartenders) || 2,
        qtdDrinques: (p.coqueteis || []).length,
        cliente: cli || null,
        clienteNome: cli ? cli.nome : 'Sem cliente vinculado',
        clienteContato: cli ? cli.contato || '' : '',
        qtdOpcoesCliente,
        valorTotal,
        valorRepasseInsumos,
        custoRealInsumos,
        lucroInsumos,
        custoServicos,
        custoRealTotal,
        valorPorConvidado,
        diasAteEvento
      };
    });
  },

  filtrarPropostas(listaEnriquecida) {
    const q = (this.filtroBusca || '').toLowerCase().trim();
    const st = this.filtroStatus || 'TODOS';
    const linha = this.filtroLinha || 'TODAS';
    const per = this.filtroPeriodo || 'TODOS';

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    return listaEnriquecida.filter((item) => {
      if (st !== 'TODOS' && item.status !== st) return false;
      if (linha !== 'TODAS' && item.linhaInsumos !== linha) return false;

      if (per !== 'TODOS') {
        const dias = item.diasAteEvento;
        if (per === 'PROXIMOS_30') {
          if (dias === null || dias < 0 || dias > 30) return false;
        } else if (per === 'FUTUROS') {
          if (dias !== null && dias < 0) return false;
        } else if (per === 'PASSADOS') {
          if (dias === null || dias >= 0) return false;
        } else if (per === 'MES_ATUAL') {
          if (!item.dataEvento) return false;
          const partes = String(item.dataEvento).split('T')[0].split('-');
          if (Number(partes[0]) !== anoAtual || Number(partes[1]) - 1 !== mesAtual) return false;
        }
      }

      if (q) {
        const texto = `${item.codigo} ${item.nomeEvento} ${item.clienteNome} ${item.clienteContato} ${item.localEvento}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }

      return true;
    });
  },

  calcularMetricasFunil(itensFiltrados) {
    const porEtapa = {};
    this.ETAPAS.forEach((et) => {
      porEtapa[et.id] = {
        etapa: et,
        itens: [],
        qtd: 0,
        somaValorTotal: 0,
        somaCustoReal: 0,
        somaLucroInsumos: 0,
        somaServicos: 0,
        somaConvidados: 0
      };
    });

    itensFiltrados.forEach((it) => {
      const grupo = porEtapa[it.status] || porEtapa['Em Aberto'];
      grupo.itens.push(it);
      grupo.qtd += 1;
      grupo.somaValorTotal += it.valorTotal;
      grupo.somaCustoReal += it.custoRealTotal;
      grupo.somaLucroInsumos += it.lucroInsumos;
      grupo.somaServicos += it.custoServicos;
      grupo.somaConvidados += it.numConvidados;
    });

    const qtdTotal = itensFiltrados.length;
    const valorBrutoTotal = itensFiltrados.reduce((acc, i) => acc + i.valorTotal, 0);

    // Propostas em negociação / abertas (Pipeline Ativo)
    const itensPipelineAtivo = [
      ...porEtapa['Em Aberto'].itens,
      ...porEtapa['Em Negociação'].itens
    ];
    const valorPipelineBruto = itensPipelineAtivo.reduce((acc, i) => acc + i.valorTotal, 0);

    // Valor líquido por cliente no pipeline (maior proposta ou média quando um mesmo cliente tem 2+ opções lado a lado em aberto)
    const mapaClientesPipeline = {};
    itensPipelineAtivo.forEach((it) => {
      const chaveCli = it.proposta.clienteId || `sem-cli-${it.id}`;
      if (!mapaClientesPipeline[chaveCli] || it.valorTotal > mapaClientesPipeline[chaveCli].valorTotal) {
        mapaClientesPipeline[chaveCli] = it;
      }
    });
    const valorPipelineUnicoPorCliente = Object.values(mapaClientesPipeline).reduce((acc, i) => acc + i.valorTotal, 0);
    const qtdClientesPipeline = Object.keys(mapaClientesPipeline).length;

    // Propostas Ganhas (Aprovadas + Realizadas)
    const itensGanhos = [
      ...porEtapa['Aprovada'].itens,
      ...porEtapa['Realizada'].itens
    ];
    const qtdGanhos = itensGanhos.length;
    const receitaConfirmada = itensGanhos.reduce((acc, i) => acc + i.valorTotal, 0);
    const custoRealConfirmado = itensGanhos.reduce((acc, i) => acc + i.custoRealTotal, 0);
    const lucroInsumosConfirmado = itensGanhos.reduce((acc, i) => acc + i.lucroInsumos, 0);
    const ticketMedioGanho = qtdGanhos > 0 ? receitaConfirmada / qtdGanhos : 0;

    // Taxa de conversão por propostas e por clientes únicos
    const qtdPerdidas = porEtapa['Cancelada'].qtd;
    const taxaConversaoGeral = qtdTotal > 0 ? (qtdGanhos / qtdTotal) * 100 : 0;
    const clientesUnicosTotal = new Set(itensFiltrados.map((i) => i.proposta.clienteId || i.id)).size;
    const clientesUnicosGanhos = new Set(itensGanhos.map((i) => i.proposta.clienteId || i.id)).size;
    const taxaConversaoClientes = clientesUnicosTotal > 0 ? (clientesUnicosGanhos / clientesUnicosTotal) * 100 : 0;

    // Totais financeiros gerais de todas as propostas (exceto canceladas para projeção operacional)
    const itensValidos = itensFiltrados.filter((i) => i.status !== 'Cancelada');
    const somaValorValidos = itensValidos.reduce((acc, i) => acc + i.valorTotal, 0);
    const somaCustoRealValidos = itensValidos.reduce((acc, i) => acc + i.custoRealTotal, 0);
    const somaLucroInsumosValidos = itensValidos.reduce((acc, i) => acc + i.lucroInsumos, 0);

    return {
      porEtapa,
      qtdTotal,
      valorBrutoTotal,
      itensPipelineAtivo,
      valorPipelineBruto,
      valorPipelineUnicoPorCliente,
      qtdClientesPipeline,
      itensGanhos,
      qtdGanhos,
      receitaConfirmada,
      custoRealConfirmado,
      lucroInsumosConfirmado,
      ticketMedioGanho,
      qtdPerdidas,
      taxaConversaoGeral,
      clientesUnicosTotal,
      clientesUnicosGanhos,
      taxaConversaoClientes,
      somaValorValidos,
      somaCustoRealValidos,
      somaLucroInsumosValidos
    };
  },

  render() {
    const container = document.getElementById('tab-funil');
    if (!container) return;

    const todasEnriquecidas = this.obterPropostasEnriquecidas();
    const filtradas = this.filtrarPropostas(todasEnriquecidas);
    const metricas = this.calcularMetricasFunil(filtradas);

    container.innerHTML = `
      <!-- Cabeçalho do Funil Comercial -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
            <i data-lucide="filter" class="w-4 h-4"></i>
            <span>Módulo 08 • Inteligência Comercial & Pipeline de Eventos</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Funil de Vendas & Panorama Geral</h1>
          <p class="text-sm text-slate-500 mt-0.5">
            Acompanhe o estágio de cada proposta, valores em negociação, receitas aprovadas, custos reais e taxa de fechamento.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Alternador Kanban x Tabela -->
          <div class="inline-flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300/80">
            <button
              type="button"
              onclick="Aba8Funil.alternarModoVisao('KANBAN')"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                this.modoVisao === 'KANBAN'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }"
            >
              <i data-lucide="kanban" class="w-3.5 h-3.5"></i>
              <span>Quadro Funil (Kanban)</span>
            </button>
            <button
              type="button"
              onclick="Aba8Funil.alternarModoVisao('TABELA')"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                this.modoVisao === 'TABELA'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }"
            >
              <i data-lucide="table-2" class="w-3.5 h-3.5"></i>
              <span>Tabela Financeira Geral</span>
            </button>
          </div>

          <button
            type="button"
            onclick="Aba8Funil.exportarPlanilhaFunil()"
            class="btn-secondary text-xs py-2 px-3 font-semibold"
            title="Exportar relatório completo do funil em Excel (.xlsx) ou CSV"
          >
            <i data-lucide="download" class="w-4 h-4 text-slate-600"></i>
            <span>Exportar Funil</span>
          </button>

          <button
            type="button"
            onclick="App.navegarPara('propostas'); Aba5Propostas.solicitarNovaProposta();"
            class="btn-primary text-xs py-2 px-3.5 font-bold"
          >
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Nova Proposta</span>
          </button>
        </div>
      </div>

      <!-- 1. CARDS DE KPIs EXECUTIVOS (PANORAMA FINANCEIRO) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <!-- Card 1: Total no Funil Ativo (Em Aberto + Em Negociação) -->
        <div class="bg-white border border-blue-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 block">
                Em Aberto & Negociação
              </span>
              <div class="text-2xl font-black text-slate-900 mt-1 font-mono">
                ${Store.formatCurrency(metricas.valorPipelineBruto)}
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <i data-lucide="hourglass" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-xs">
            <div class="flex items-center justify-between text-slate-600">
              <span>Propostas aguardando:</span>
              <strong class="text-slate-900">${metricas.itensPipelineAtivo.length} proposta(s) (${metricas.qtdClientesPipeline} cliente(s))</strong>
            </div>
            ${
              Math.abs(metricas.valorPipelineBruto - metricas.valorPipelineUnicoPorCliente) > 0.01
                ? `<div class="flex items-center justify-between text-[11px] text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded" title="Desconta opções duplicadas lado a lado do mesmo cliente, considerando 1 opção principal por cliente">
                    <span>Potencial real (1 opção/cliente):</span>
                    <strong class="font-mono">${Store.formatCurrency(metricas.valorPipelineUnicoPorCliente)}</strong>
                  </div>`
                : `<div class="text-[11px] text-slate-400">Potencial ativo na mesa para fechamento</div>`
            }
          </div>
        </div>

        <!-- Card 2: Receita Confirmada (Aprovadas + Realizadas) -->
        <div class="bg-emerald-50/60 border border-emerald-300 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Receita Fechada (Aprovadas + Realizadas)
              </span>
              <div class="text-2xl font-black text-emerald-950 mt-1 font-mono">
                ${Store.formatCurrency(metricas.receitaConfirmada)}
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <i data-lucide="badge-dollar-sign" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="mt-2.5 pt-2.5 border-t border-emerald-200/80 flex flex-col gap-1 text-xs">
            <div class="flex items-center justify-between text-emerald-900">
              <span>Eventos fechados:</span>
              <strong>${metricas.qtdGanhos} evento(s) • Ticket Médio: ${Store.formatCurrency(metricas.ticketMedioGanho)}</strong>
            </div>
            <div class="flex items-center justify-between text-[11px] text-emerald-800">
              <span>Custo Real: <strong>${Store.formatCurrency(metricas.custoRealConfirmado)}</strong></span>
              <span>Margem Insumos: <strong>+${Store.formatCurrency(metricas.lucroInsumosConfirmado)}</strong></span>
            </div>
          </div>
        </div>

        <!-- Card 3: Volume Geral & Margem Embutida (Propostas Ativas + Fechadas) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Volume Total Orçado (Sem Canceladas)
              </span>
              <div class="text-2xl font-black text-slate-900 mt-1 font-mono">
                ${Store.formatCurrency(metricas.somaValorValidos)}
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shrink-0">
              <i data-lucide="wallet" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-xs">
            <div class="flex items-center justify-between text-slate-600">
              <span>Custo Real (Insumos + Equipe):</span>
              <strong class="font-mono text-slate-800">${Store.formatCurrency(metricas.somaCustoRealValidos)}</strong>
            </div>
            <div class="flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
              <span>Lucro Embutido nos Insumos:</span>
              <strong class="font-mono">+ ${Store.formatCurrency(metricas.somaLucroInsumosValidos)}</strong>
            </div>
          </div>
        </div>

        <!-- Card 4: Taxa de Conversão & Desempenho do Funil -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 block">
                Taxa de Conversão (Fechamento)
              </span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="text-2xl font-black text-indigo-950">${Store.formatNumber(metricas.taxaConversaoClientes, 1).replace(',0', '')}%</span>
                <span class="text-xs font-semibold text-slate-500">por cliente</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <i data-lucide="trending-up" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-xs">
            <div class="flex items-center justify-between text-slate-600">
              <span>Clientes convertidos:</span>
              <strong class="text-slate-900">${metricas.clientesUnicosGanhos} de ${metricas.clientesUnicosTotal} clientes</strong>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-500">
              <span>Por propostas: <strong>${Store.formatNumber(metricas.taxaConversaoGeral, 1).replace(',0', '')}%</strong> (${metricas.qtdGanhos}/${metricas.qtdTotal})</span>
              <span class="text-red-600 font-semibold">${metricas.qtdPerdidas} cancelada(s)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. TERMÔMETRO VISUAL DE ETAPAS DO FUNIL -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <i data-lucide="bar-chart-horizontal" class="w-4 h-4 text-blue-600"></i>
            <h2 class="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Distribuição de Propostas e Valores por Etapa do Funil
            </h2>
          </div>
          <span class="text-[11px] text-slate-500">
            Clique em qualquer etapa abaixo para filtrar ou use o seletor de status em cada proposta para avançar no funil
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          ${this.ETAPAS.map((et) => {
            const dadosEtapa = metricas.porEtapa[et.id];
            const pctValor =
              metricas.valorBrutoTotal > 0 ? Math.round((dadosEtapa.somaValorTotal / metricas.valorBrutoTotal) * 100) : 0;
            const isFiltroAtivo = this.filtroStatus === et.id;

            return `
              <div
                onclick="Aba8Funil.toggleFiltroStatusCard('${et.id}')"
                class="cursor-pointer rounded-xl p-3 border transition-all ${
                  isFiltroAtivo
                    ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/30 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                }"
                title="Clique para filtrar apenas propostas em '${et.curto}'"
              >
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span class="inline-flex items-center gap-1.5 text-xs font-bold ${et.corTexto}">
                    <i data-lucide="${et.icone}" class="w-3.5 h-3.5"></i>
                    <span>${et.curto}</span>
                  </span>
                  <span class="text-xs font-extrabold px-2 py-0.5 rounded-full border ${et.corBadge}">
                    ${dadosEtapa.qtd}
                  </span>
                </div>
                <div class="text-base font-black text-slate-900 font-mono">
                  ${Store.formatCurrency(dadosEtapa.somaValorTotal)}
                </div>
                <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden my-1.5">
                  <div class="h-full ${et.corBarra} transition-all" style="width: ${Math.max(dadosEtapa.qtd > 0 ? 6 : 0, pctValor)}%"></div>
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-500">
                  <span>${pctValor}% do volume</span>
                  <span>${dadosEtapa.somaConvidados} conv.</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 3. BARRA DE FILTROS DO FUNIL -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-xs">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div class="md:col-span-4 relative">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input
              type="text"
              value="${this.esc(this.filtroBusca)}"
              oninput="Aba8Funil.setFiltroBusca(this.value)"
              placeholder="Buscar por cliente, evento, código, telefone ou local..."
              class="input-minimal pl-9 text-xs py-2"
            />
          </div>

          <div class="md:col-span-3">
            <select onchange="Aba8Funil.setFiltroStatus(this.value)" class="input-minimal text-xs py-2">
              <option value="TODOS" ${this.filtroStatus === 'TODOS' ? 'selected' : ''}>Todas as Etapas do Funil</option>
              ${this.ETAPAS.map(
                (et) => `<option value="${et.id}" ${this.filtroStatus === et.id ? 'selected' : ''}>Etapa: ${et.curto}</option>`
              ).join('')}
            </select>
          </div>

          <div class="md:col-span-2">
            <select onchange="Aba8Funil.setFiltroLinha(this.value)" class="input-minimal text-xs py-2">
              <option value="TODAS" ${this.filtroLinha === 'TODAS' ? 'selected' : ''}>Todas as Linhas (A, B, C)</option>
              <option value="A" ${this.filtroLinha === 'A' ? 'selected' : ''}>Linha A • Premium</option>
              <option value="B" ${this.filtroLinha === 'B' ? 'selected' : ''}>Linha B • Padrão</option>
              <option value="C" ${this.filtroLinha === 'C' ? 'selected' : ''}>Linha C • Econômica</option>
            </select>
          </div>

          <div class="md:col-span-3 flex items-center gap-2">
            <select onchange="Aba8Funil.setFiltroPeriodo(this.value)" class="input-minimal text-xs py-2 flex-1">
              <option value="TODOS" ${this.filtroPeriodo === 'TODOS' ? 'selected' : ''}>Qualquer Data de Evento</option>
              <option value="PROXIMOS_30" ${this.filtroPeriodo === 'PROXIMOS_30' ? 'selected' : ''}>📅 Próximos 30 dias</option>
              <option value="MES_ATUAL" ${this.filtroPeriodo === 'MES_ATUAL' ? 'selected' : ''}>📆 Eventos deste Mês</option>
              <option value="FUTUROS" ${this.filtroPeriodo === 'FUTUROS' ? 'selected' : ''}>⏳ Eventos Futuros</option>
              <option value="PASSADOS" ${this.filtroPeriodo === 'PASSADOS' ? 'selected' : ''}>🕓 Eventos Passados</option>
            </select>
            ${
              this.filtroBusca || this.filtroStatus !== 'TODOS' || this.filtroLinha !== 'TODAS' || this.filtroPeriodo !== 'TODOS'
                ? `<button
                    type="button"
                    onclick="Aba8Funil.limparFiltros()"
                    class="btn-secondary py-2 px-2.5 text-xs text-slate-600 hover:text-red-600 shrink-0"
                    title="Limpar todos os filtros"
                  >
                    <i data-lucide="filter-x" class="w-4 h-4"></i>
                  </button>`
                : ''
            }
          </div>
        </div>
      </div>

      <!-- 4. CONTEÚDO PRINCIPAL: KANBAN OU TABELA FINANCEIRA -->
      <div id="funil-conteudo-dinamico">
        ${
          this.modoVisao === 'KANBAN'
            ? this.renderVisaoKanban(metricas)
            : this.renderVisaoTabela(filtradas, metricas)
        }
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderVisaoKanban(metricas) {
    return `
      <div class="flex gap-5 overflow-x-auto pb-5 pt-1 px-0.5 items-stretch select-none" style="scrollbar-width: thin;">
        ${this.ETAPAS.map((et) => {
          const grupo = metricas.porEtapa[et.id];
          const itensOrdenados = [...grupo.itens].sort((a, b) => {
            if (!a.dataEvento) return 1;
            if (!b.dataEvento) return -1;
            return String(a.dataEvento).localeCompare(String(b.dataEvento));
          });

          return `
            <div
              class="min-w-[330px] w-[330px] sm:min-w-[360px] sm:w-[360px] shrink-0 rounded-2xl border ${et.corBgCol} flex flex-col min-h-[480px] max-h-[80vh] transition-all shadow-xs"
              ondragover="event.preventDefault(); this.classList.add('ring-2', 'ring-blue-500');"
              ondragleave="this.classList.remove('ring-2', 'ring-blue-500');"
              ondrop="this.classList.remove('ring-2', 'ring-blue-500'); Aba8Funil.aoSoltarCardNaColuna(event, '${et.id}')"
            >
              <!-- Cabeçalho da Coluna Kanban -->
              <div class="p-4 rounded-t-2xl ${et.corHeader} shadow-2xs shrink-0">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 font-extrabold text-sm tracking-wide uppercase">
                    <i data-lucide="${et.icone}" class="w-4 h-4"></i>
                    <span>${et.curto}</span>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-white">
                    ${grupo.qtd}
                  </span>
                </div>
                <div class="mt-2.5 pt-2.5 border-t border-white/20 flex items-baseline justify-between">
                  <span class="text-[11px] uppercase font-semibold opacity-90">Total na Etapa:</span>
                  <span class="text-base font-black font-mono">${Store.formatCurrency(grupo.somaValorTotal)}</span>
                </div>
              </div>

              <!-- Lista de Cards da Coluna -->
              <div class="p-3.5 space-y-3 overflow-y-auto flex-1">
                ${
                  itensOrdenados.length === 0
                    ? `
                  <div class="border-2 border-dashed border-slate-300/70 rounded-xl p-8 text-center my-2">
                    <p class="text-xs font-semibold text-slate-400">Nenhuma proposta em "${et.curto}"</p>
                    <p class="text-[11px] text-slate-400 mt-1">Arraste um card para cá para mudar de etapa.</p>
                  </div>
                `
                    : itensOrdenados.map((item) => this.renderCardKanban(item)).join('')
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderCardKanban(item) {
    const versoes = Array.isArray(item.proposta?.versoesNegociacao)
      ? item.proposta.versoesNegociacao
      : [];
    const temHistoricoVersoes = versoes.length > 1;
    const temCardsDuplicadosCliente = item.qtdOpcoesCliente > 1 && item.proposta?.clienteId;

    const calcFinanceiro = Store.calcularFluxoCaixaProposta(item.proposta);
    const notasTimeline = Array.isArray(item.proposta?.timelineNegociacao) ? item.proposta.timelineNegociacao : [];
    const qtdNotas = notasTimeline.length;

    return `
      <div
        draggable="true"
        ondragstart="Aba8Funil.aoIniciarDragCard(event, '${item.id}')"
        onclick="Aba5Propostas.abrirParaEdicao('${item.id}')"
        class="bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 p-4 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group space-y-2.5"
        title="Clique para abrir a proposta ou arraste para outra coluna do funil"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <!-- Nome da Pessoa (Cliente) -->
            <div class="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition leading-snug break-words">
              ${this.esc(item.clienteNome)}
            </div>
            <!-- Nome do Evento -->
            <div class="text-xs font-medium text-slate-500 mt-1 leading-relaxed break-words">
              ${this.esc(item.nomeEvento)}
            </div>
          </div>

          <!-- Valor da Proposta -->
          <div class="text-right shrink-0 flex flex-col items-end gap-1">
            <span class="inline-block text-base font-black text-blue-700 bg-blue-50/80 border border-blue-200 px-2.5 py-1 rounded-lg font-mono">
              ${Store.formatCurrency(item.valorTotal)}
            </span>
            ${
              temHistoricoVersoes
                ? `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md" title="Esta proposta possui ${versoes.length} versões salvas no histórico interno">
                    <i data-lucide="history" class="w-3 h-3"></i>
                    <span>${versoes.length} versões</span>
                  </span>`
                : ''
            }
          </div>
        </div>

        <!-- RESUMO FINANCEIRO & % PAGO NO CARD -->
        <div class="pt-2 border-t border-slate-100 space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-bold flex items-center gap-1 ${
              calcFinanceiro.statusPagamento === 'QUITADO'
                ? 'text-emerald-700'
                : calcFinanceiro.statusPagamento === 'PARCIAL'
                ? 'text-blue-700'
                : 'text-slate-500'
            }">
              <i data-lucide="${calcFinanceiro.statusPagamento === 'QUITADO' ? 'check-circle' : 'circle-dollar-sign'}" class="w-3.5 h-3.5"></i>
              <span>${calcFinanceiro.percentualPago}% pago</span>
            </span>
            <span class="text-[11px] font-semibold text-slate-500">
              ${
                calcFinanceiro.faltaPagar > 0
                  ? `Falta <strong class="text-amber-700">${Store.formatCurrency(calcFinanceiro.faltaPagar)}</strong>`
                  : '<span class="text-emerald-700 font-bold">100% Quitado</span>'
              }
            </span>
          </div>

          <!-- Barra de Progresso do Pagamento -->
          <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              class="h-1.5 rounded-full transition-all duration-300 ${
                calcFinanceiro.statusPagamento === 'QUITADO'
                  ? 'bg-emerald-500'
                  : calcFinanceiro.statusPagamento === 'PARCIAL'
                  ? 'bg-blue-600'
                  : 'bg-slate-300'
              }"
              style="width: ${Math.max(calcFinanceiro.percentualPago > 0 ? 3 : 0, calcFinanceiro.percentualPago)}%"
            ></div>
          </div>

          <!-- Rodapé do Card: Saldo em Caixa + Botões de Atalho -->
          <div class="flex items-center justify-between pt-1 text-[10px]">
            <span class="text-slate-500 flex items-center gap-1 font-medium" title="Saldo líquido atual em caixa (Entradas - Saídas)">
              <i data-lucide="wallet" class="w-3 h-3 text-slate-400"></i>
              <span>Caixa: <strong class="${calcFinanceiro.saldoEmCaixa < 0 ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}">${Store.formatCurrency(calcFinanceiro.saldoEmCaixa)}</strong></span>
            </span>

            <div class="flex items-center gap-1.5">
              ${
                qtdNotas > 0
                  ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold" title="${qtdNotas} anotação(ões) na linha do tempo">
                      <i data-lucide="message-square" class="w-2.5 h-2.5 text-indigo-600"></i>
                      <span>${qtdNotas}</span>
                    </span>`
                  : ''
              }

              <button
                type="button"
                onclick="event.stopPropagation(); Aba8Funil.abrirModalRapido('${item.id}')"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 font-bold transition shadow-2xs cursor-pointer"
                title="Abrir gestão rápida de pagamentos e anotações"
              >
                <i data-lucide="sliders-horizontal" class="w-3 h-3 text-blue-600"></i>
                <span>Gestão Rápida</span>
              </button>
            </div>
          </div>
        </div>

        ${
          temCardsDuplicadosCliente
            ? `
          <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span class="text-[10px] text-amber-700 font-semibold">
              ${item.qtdOpcoesCliente} propostas p/ este cliente
            </span>
            <button
              type="button"
              onclick="event.stopPropagation(); Aba5Propostas.unificarPropostasDoCliente('${item.proposta.clienteId}')"
              class="text-[10px] font-extrabold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition flex items-center gap-1"
              title="Juntar as propostas deste cliente em 1 único card com histórico de versões (v1, v2...)"
            >
              <i data-lucide="git-merge" class="w-3 h-3"></i>
              <span>Unificar em 1 c/ Histórico</span>
            </button>
          </div>
        `
            : ''
        }
      </div>
    `;
  },

  renderVisaoTabela(filtradas, metricas) {
    if (filtradas.length === 0) {
      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <i data-lucide="filter-x" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
          <h3 class="text-sm font-bold text-slate-800">Nenhuma proposta encontrada para os filtros selecionados</h3>
          <p class="text-xs text-slate-500 mt-1">Limpe os filtros ou cadastre uma nova proposta.</p>
        </div>
      `;
    }

    const somaConv = filtradas.reduce((acc, i) => acc + i.numConvidados, 0);
    const somaCustoRealIns = filtradas.reduce((acc, i) => acc + i.custoRealInsumos, 0);
    const somaLucroIns = filtradas.reduce((acc, i) => acc + i.lucroInsumos, 0);
    const somaRepasseIns = filtradas.reduce((acc, i) => acc + i.valorRepasseInsumos, 0);
    const somaServicos = filtradas.reduce((acc, i) => acc + i.custoServicos, 0);
    const somaTotal = filtradas.reduce((acc, i) => acc + i.valorTotal, 0);

    return `
      <div class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-clean text-xs">
            <thead>
              <tr>
                <th>Código / Data</th>
                <th>Cliente & Evento</th>
                <th>Escopo / Linha</th>
                <th class="text-right">Custo Real Insumos</th>
                <th class="text-right">Margem Insumos</th>
                <th class="text-right">Serviços & Equipe</th>
                <th class="text-right">Valor Final (Cliente)</th>
                <th class="text-center w-44">Status no Funil</th>
                <th class="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${filtradas
                .map((item) => {
                  const et = this.getInfoEtapa(item.status);
                  return `
                    <tr class="hover:bg-slate-50/90 transition">
                      <td class="whitespace-nowrap">
                        <div class="font-mono font-bold text-blue-700">${this.esc(item.codigo)}</div>
                        <div class="text-[11px] text-slate-500">${this.formatarDataBR(item.dataEvento)}</div>
                      </td>
                      <td>
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>${this.esc(item.clienteNome)}</span>
                          ${
                            item.qtdOpcoesCliente > 1 && item.proposta.clienteId
                              ? `<button
                                  type="button"
                                  onclick="Aba5Propostas.abrirComparativoPropostasCliente('${item.proposta.clienteId}')"
                                  class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                  title="Comparar as ${item.qtdOpcoesCliente} opções deste cliente lado a lado"
                                >
                                  ${item.qtdOpcoesCliente} opções
                                </button>`
                              : ''
                          }
                        </div>
                        <div class="text-xs text-slate-600">${this.esc(item.nomeEvento)}</div>
                        ${item.clienteContato ? `<div class="text-[11px] text-slate-400">${this.esc(item.clienteContato)}</div>` : ''}
                      </td>
                      <td class="whitespace-nowrap">
                        <div>
                          <strong>${item.numConvidados}</strong> conv. • <strong>${item.duracaoHoras}h</strong> • ${item.qtdBartenders} bar
                        </div>
                        <div class="text-[11px] text-slate-500">
                          Linha <strong>${this.esc(item.linhaInsumos)}</strong> • 🍸 ${item.qtdDrinques} drinques
                        </div>
                      </td>
                      <td class="text-right font-mono text-slate-700 whitespace-nowrap">
                        ${Store.formatCurrency(item.custoRealInsumos)}
                      </td>
                      <td class="text-right font-mono whitespace-nowrap">
                        ${
                          item.lucroInsumos > 0.01
                            ? `<span class="font-bold text-emerald-700">+${Store.formatCurrency(item.lucroInsumos)}</span>`
                            : `<span class="text-slate-400">R$ 0,00</span>`
                        }
                      </td>
                      <td class="text-right font-mono text-slate-700 whitespace-nowrap">
                        ${Store.formatCurrency(item.custoServicos)}
                      </td>
                      <td class="text-right whitespace-nowrap">
                        <div class="font-mono font-black text-slate-900 text-sm">${Store.formatCurrency(item.valorTotal)}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${Store.formatCurrency(item.valorPorConvidado)}/conv.</div>
                      </td>
                      <td class="text-center">
                        <select
                          onchange="Aba8Funil.alterarStatusProposta('${item.id}', this.value)"
                          class="input-minimal py-1 px-2 text-xs font-bold border ${et.corBadge} cursor-pointer"
                        >
                          ${this.ETAPAS.map(
                            (e) => `<option value="${e.id}" ${item.status === e.id ? 'selected' : ''}>${e.curto}</option>`
                          ).join('')}
                        </select>
                      </td>
                      <td class="text-right whitespace-nowrap">
                        <div class="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onclick="Aba5Propostas.abrirParaEdicao('${item.id}')"
                            class="btn-secondary py-1 px-2 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 font-bold"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onclick="Aba5Propostas.exportarPdfPorId('${item.id}')"
                            class="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Exportar PDF"
                          >
                            <i data-lucide="file-down" class="w-3.5 h-3.5"></i>
                          </button>
                          <button
                            type="button"
                            onclick="Aba5Propostas.irParaChecklistPorId('${item.id}')"
                            class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                            title="Abrir Checklist de Compras"
                          >
                            <i data-lucide="clipboard-check" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
            <tfoot>
              <tr class="bg-slate-900 text-white font-bold text-xs">
                <td colspan="2" class="py-3 px-4">
                  TOTAL DAS PROPOSTAS LISTADAS (${filtradas.length} propostas)
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                  ${Store.formatNumber(somaConv)} convidados
                </td>
                <td class="py-3 px-4 text-right font-mono whitespace-nowrap text-slate-200">
                  ${Store.formatCurrency(somaCustoRealIns)}
                </td>
                <td class="py-3 px-4 text-right font-mono whitespace-nowrap text-emerald-300">
                  +${Store.formatCurrency(somaLucroIns)}
                </td>
                <td class="py-3 px-4 text-right font-mono whitespace-nowrap text-slate-200">
                  ${Store.formatCurrency(somaServicos)}
                </td>
                <td class="py-3 px-4 text-right font-mono text-base font-black text-blue-300 whitespace-nowrap">
                  ${Store.formatCurrency(somaTotal)}
                </td>
                <td colspan="2" class="py-3 px-4 text-right text-[11px] text-slate-300">
                  Repasse Insumos: ${Store.formatCurrency(somaRepasseIns)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  },

  alternarModoVisao(modo) {
    this.modoVisao = modo;
    this.render();
  },

  setFiltroBusca(val) {
    this.filtroBusca = val;
    this.render();
    const input = document.querySelector('#tab-funil input[type="text"]');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  },

  setFiltroStatus(st) {
    this.filtroStatus = st;
    this.render();
  },

  toggleFiltroStatusCard(st) {
    this.filtroStatus = this.filtroStatus === st ? 'TODOS' : st;
    this.render();
  },

  setFiltroLinha(linha) {
    this.filtroLinha = linha;
    this.render();
  },

  setFiltroPeriodo(per) {
    this.filtroPeriodo = per;
    this.render();
  },

  limparFiltros() {
    this.filtroBusca = '';
    this.filtroStatus = 'TODOS';
    this.filtroLinha = 'TODAS';
    this.filtroPeriodo = 'TODOS';
    this.render();
  },

  alterarStatusProposta(propostaId, novoStatus) {
    const prop = (Store.state.propostas || []).find((p) => p.id === propostaId);
    if (!prop) return;
    prop.status = novoStatus;
    if (window.Aba5Propostas && window.Aba5Propostas.propostaAtual && window.Aba5Propostas.propostaAtual.id === propostaId) {
      window.Aba5Propostas.propostaAtual.status = novoStatus;
    }
    Store.save();
    this.render();
    App.mostrarToast(`Status de "${prop.nomeEvento || prop.codigo}" atualizado para "${novoStatus}"!`);
  },

  aoIniciarDragCard(event, propostaId) {
    this.draggedPropostaId = propostaId;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', propostaId);
      event.dataTransfer.effectAllowed = 'move';
    }
  },

  aoSoltarCardNaColuna(event, novoStatus) {
    event.preventDefault();
    const id = (event.dataTransfer && event.dataTransfer.getData('text/plain')) || this.draggedPropostaId;
    this.draggedPropostaId = null;
    if (!id) return;
    this.alterarStatusProposta(id, novoStatus);
  },

  exportarPlanilhaFunil() {
    const enriquecidas = this.filtrarPropostas(this.obterPropostasEnriquecidas());
    if (enriquecidas.length === 0) {
      App.mostrarToast('Nenhuma proposta para exportar.', 'warning');
      return;
    }

    const dados = enriquecidas.map((it) => ({
      Codigo: it.codigo,
      StatusFunil: it.status,
      DataEvento: this.formatarDataBR(it.dataEvento),
      Cliente: it.clienteNome,
      Contato: it.clienteContato,
      Evento: it.nomeEvento,
      Local: it.localEvento,
      LinhaBebidas: it.linhaInsumos,
      Convidados: it.numConvidados,
      HorasEvento: it.duracaoHoras,
      Bartenders: it.qtdBartenders,
      QtdDrinques: it.qtdDrinques,
      CustoRealInsumos: Number(it.custoRealInsumos.toFixed(2)),
      MargemLucroInsumos: Number(it.lucroInsumos.toFixed(2)),
      ValorRepasseInsumos: Number(it.valorRepasseInsumos.toFixed(2)),
      CustoServicosEquipe: Number(it.custoServicos.toFixed(2)),
      CustoRealTotalEvento: Number(it.custoRealTotal.toFixed(2)),
      ValorFinalPropostaCliente: Number(it.valorTotal.toFixed(2)),
      ValorPorConvidado: Number(it.valorPorConvidado.toFixed(2))
    }));

    if (window.XLSX) {
      const ws = XLSX.utils.json_to_sheet(dados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Funil_Propostas');
      XLSX.writeFile(wb, `Funil_Comercial_Eventos_${new Date().toISOString().slice(0, 10)}.xlsx`);
      App.mostrarToast('Relatório do Funil exportado em Excel (.xlsx)!');
    } else if (window.Aba1Insumos) {
      const headers = Object.keys(dados[0]).join(';');
      const rows = dados.map((r) => Object.values(r).join(';')).join('\n');
      window.Aba1Insumos.downloadBlob('\uFEFF' + headers + '\n' + rows, 'Funil_Comercial_Eventos.csv', 'text/csv;charset=utf-8;');
      App.mostrarToast('Relatório do Funil exportado em CSV!');
    }
  },

  abaModalRapidoAtiva: 'caixa',

  formatarDataHoraBR(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return (
        d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' às ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return isoStr;
    }
  },

  abrirModalRapido(propostaId, aba = null) {
    const p = (Store.state.propostas || []).find((x) => x.id === propostaId);
    if (!p) {
      App.mostrarToast('Proposta não encontrada.', 'warning');
      return;
    }

    if (aba) this.abaModalRapidoAtiva = aba;
    const abaAtiva = this.abaModalRapidoAtiva || 'caixa';
    const cli = (Store.state.clientes || []).find((c) => c.id === p.clienteId);
    const calc = Store.calcularFluxoCaixaProposta(p);
    const timeline = Array.isArray(p.timelineNegociacao) ? p.timelineNegociacao : [];
    const movs = Array.isArray(p.fluxoCaixa) ? p.fluxoCaixa : [];
    const dataAtual = new Date().toISOString().slice(0, 16);

    const html = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop overflow-y-auto" onclick="if(event.target === this) App.fecharModal()">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
          <div class="p-6 space-y-4">
            <!-- Cabeçalho do Modal -->
            <div class="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">${p.codigo || 'PROP'}</span>
                  <h3 class="text-base font-extrabold text-slate-900">${this.esc(p.nomeEvento || 'Evento')}</h3>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  Cliente: <strong class="text-slate-800">${this.esc(cli ? cli.nome : 'Sem cliente')}</strong>
                  ${cli && cli.contato ? ` • Tel: ${this.esc(cli.contato)}` : ''}
                </p>
              </div>
              <button type="button" onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

        <!-- Alternador de Abas do Modal Rápido -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              onclick="Aba8Funil.abrirModalRapido('${p.id}', 'caixa')"
              class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                abaAtiva === 'caixa'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }"
            >
              <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
              <span>Fluxo de Caixa (${calc.percentualPago}% Pago)</span>
            </button>

            <button
              type="button"
              onclick="Aba8Funil.abrirModalRapido('${p.id}', 'timeline')"
              class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                abaAtiva === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }"
            >
              <i data-lucide="history" class="w-3.5 h-3.5"></i>
              <span>Linha do Tempo (${timeline.length})</span>
            </button>
          </div>

          <button
            type="button"
            onclick="App.fecharModal(); Aba5Propostas.abrirParaEdicao('${p.id}')"
            class="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Abrir Proposta Completa</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- CONTEÚDO DA ABA SELECIONADA -->
        ${
          abaAtiva === 'caixa'
            ? `
          <!-- CONTEÚDO DO FLUXO DE CAIXA -->
          <div class="space-y-4">
            <!-- 4 Cards Resumo -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Proposta</span>
                <span class="text-sm sm:text-base font-black text-slate-900 font-mono block">${Store.formatCurrency(calc.valorTotal)}</span>
              </div>
              <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Recebido (${calc.percentualPago}%)</span>
                <span class="text-sm sm:text-base font-black text-emerald-700 font-mono block">${Store.formatCurrency(calc.totalEntradas)}</span>
              </div>
              <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Falta Pagar</span>
                <span class="text-sm sm:text-base font-black text-amber-700 font-mono block">${Store.formatCurrency(calc.faltaPagar)}</span>
              </div>
              <div class="bg-blue-50/70 border border-blue-200 rounded-xl p-2.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">Saldo em Caixa</span>
                <span class="text-sm sm:text-base font-black ${calc.saldoEmCaixa < 0 ? 'text-rose-600' : 'text-blue-700'} font-mono block">${Store.formatCurrency(calc.saldoEmCaixa)}</span>
              </div>
            </div>

            <!-- Barra de Progresso -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Progresso do Pagamento</span>
                <span>${calc.percentualPago}% concluído</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="h-2 rounded-full ${calc.statusPagamento === 'QUITADO' ? 'bg-emerald-500' : 'bg-blue-600'}" style="width: ${calc.percentualPago}%"></div>
              </div>
            </div>

            <!-- Formulário Rápido de Lançamento -->
            <form onsubmit="Aba8Funil.salvarMovimentacaoRapida(event, '${p.id}')" class="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5">
              <span class="block text-xs font-bold text-slate-700">+ Novo Lançamento Financeiro:</span>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select id="modal-rapido-tipo" class="input-minimal py-1 px-2 text-xs font-semibold">
                  <option value="ENTRADA">🟢 Entrada (Recebimento)</option>
                  <option value="SAIDA">🔴 Saída (Despesa)</option>
                </select>
                <input
                  type="number"
                  id="modal-rapido-valor"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Valor R$"
                  class="input-minimal py-1 px-2 text-xs font-mono font-bold"
                />
                <input
                  type="text"
                  id="modal-rapido-motivo"
                  required
                  placeholder="Motivo (ex: Sinal 50%, Gelo)"
                  class="input-minimal py-1 px-2 text-xs"
                />
                <button type="submit" class="btn-primary py-1 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 justify-center">
                  Salvar
                </button>
              </div>
            </form>

            <!-- Lista de Movimentações -->
            <div class="space-y-1 max-h-48 overflow-y-auto">
              ${
                movs.length === 0
                  ? `<p class="text-xs text-slate-400 text-center py-4">Nenhum lançamento no caixa deste evento.</p>`
                  : movs
                      .map(
                        (m) => `
                    <div class="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 text-xs hover:border-slate-300 transition">
                      <div class="flex items-center gap-2">
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold ${m.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                          ${m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                        </span>
                        <span class="font-semibold text-slate-800">${this.esc(m.motivo)}</span>
                        <span class="text-[10px] text-slate-400 font-mono">${this.formatarDataHoraBR(m.dataHora)}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-bold ${m.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-rose-600'}">
                          ${m.tipo === 'ENTRADA' ? '+' : '-'}${Store.formatCurrency(m.valor)}
                        </span>
                        <button
                          type="button"
                          onclick="Aba8Funil.excluirMovimentacaoRapida('${p.id}', '${m.id}')"
                          class="text-slate-400 hover:text-rose-600 p-0.5"
                          title="Excluir"
                        >
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </div>
                  `
                      )
                      .join('')
              }
            </div>
          </div>
        `
            : `
          <!-- CONTEÚDO DA LINHA DO TEMPO -->
          <div class="space-y-4">
            <!-- Formulário Rápido de Anotação -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-700">Nova Anotação ou Acordo Combinado:</label>
              <div class="flex gap-2">
                <textarea
                  id="modal-rapido-input-timeline"
                  rows="2"
                  placeholder="Ex: Cliente confirmou degustação. Solicitou desconto para fechar à vista..."
                  class="input-minimal text-xs flex-1"
                ></textarea>
                <button
                  type="button"
                  onclick="Aba8Funil.adicionarAnotacaoRapida('${p.id}')"
                  class="btn-primary py-2 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shrink-0 self-end"
                >
                  Adicionar
                </button>
              </div>
            </div>

            <!-- Lista da Linha do Tempo -->
            <div class="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              ${
                timeline.length === 0
                  ? `<p class="text-xs text-slate-400 text-center py-6">Nenhuma anotação registrada ainda.</p>`
                  : timeline
                      .map(
                        (item) => `
                    <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div class="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-100">
                        <span class="font-bold text-indigo-700 font-mono">${this.formatarDataHoraBR(item.dataHora)}</span>
                        <button
                          type="button"
                          onclick="Aba8Funil.excluirAnotacaoRapida('${p.id}', '${item.id}')"
                          class="text-slate-400 hover:text-rose-600"
                          title="Excluir"
                        >
                          <i data-lucide="trash-2" class="w-3 h-3"></i>
                        </button>
                      </div>
                      <div class="text-slate-800 whitespace-pre-line leading-relaxed font-normal">${this.esc(item.texto)}</div>
                    </div>
                  `
                      )
                      .join('')
              }
            </div>
          </div>
        `
        }
          </div>
        </div>
      </div>
    `;

    App.abrirModal(html);
  },

  salvarMovimentacaoRapida(event, propostaId) {
    if (event) event.preventDefault();
    const tipo = document.getElementById('modal-rapido-tipo')?.value || 'ENTRADA';
    const valorNum = parseFloat(document.getElementById('modal-rapido-valor')?.value || '0');
    const motivo = document.getElementById('modal-rapido-motivo')?.value || '';

    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      App.mostrarToast('Por favor, informe um valor válido.', 'warning');
      return;
    }

    Store.adicionarMovimentacaoCaixa(propostaId, {
      tipo,
      valor: valorNum,
      motivo,
      formaPagamento: 'Pix',
      dataHora: new Date().toISOString()
    });

    this.render();
    if (window.Aba5Propostas && Aba5Propostas.propostaAtual && Aba5Propostas.propostaAtual.id === propostaId) {
      Aba5Propostas.propostaAtual = JSON.parse(
        JSON.stringify(Store.state.propostas.find((x) => x.id === propostaId))
      );
      if (App.abaAtiva === 'propostas') Aba5Propostas.render();
    }
    this.abrirModalRapido(propostaId, 'caixa');
    App.mostrarToast('Lançamento registrado com sucesso!', 'success');
  },

  excluirMovimentacaoRapida(propostaId, movId) {
    if (!confirm('Deseja excluir este lançamento?')) return;
    Store.excluirMovimentacaoCaixa(propostaId, movId);
    this.render();
    if (window.Aba5Propostas && Aba5Propostas.propostaAtual && Aba5Propostas.propostaAtual.id === propostaId) {
      Aba5Propostas.propostaAtual = JSON.parse(
        JSON.stringify(Store.state.propostas.find((x) => x.id === propostaId))
      );
      if (App.abaAtiva === 'propostas') Aba5Propostas.render();
    }
    this.abrirModalRapido(propostaId, 'caixa');
    App.mostrarToast('Lançamento excluído!', 'info');
  },

  adicionarAnotacaoRapida(propostaId) {
    const el = document.getElementById('modal-rapido-input-timeline');
    const texto = el ? el.value : '';

    if (!texto || !texto.trim()) {
      App.mostrarToast('Digite o texto da anotação.', 'warning');
      return;
    }

    Store.adicionarAnotacaoTimeline(propostaId, texto.trim());
    this.render();
    if (window.Aba5Propostas && Aba5Propostas.propostaAtual && Aba5Propostas.propostaAtual.id === propostaId) {
      Aba5Propostas.propostaAtual = JSON.parse(
        JSON.stringify(Store.state.propostas.find((x) => x.id === propostaId))
      );
      if (App.abaAtiva === 'propostas') Aba5Propostas.render();
    }
    this.abrirModalRapido(propostaId, 'timeline');
    App.mostrarToast('Anotação registrada!', 'success');
  },

  excluirAnotacaoRapida(propostaId, timelineId) {
    if (!confirm('Deseja excluir esta anotação?')) return;
    Store.excluirAnotacaoTimeline(propostaId, timelineId);
    this.render();
    if (window.Aba5Propostas && Aba5Propostas.propostaAtual && Aba5Propostas.propostaAtual.id === propostaId) {
      Aba5Propostas.propostaAtual = JSON.parse(
        JSON.stringify(Store.state.propostas.find((x) => x.id === propostaId))
      );
      if (App.abaAtiva === 'propostas') Aba5Propostas.render();
    }
    this.abrirModalRapido(propostaId, 'timeline');
    App.mostrarToast('Anotação excluída!', 'info');
  }
};

