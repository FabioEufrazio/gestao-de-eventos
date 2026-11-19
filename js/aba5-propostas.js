// Aba 5: Criar Nova Proposta (Orçamentador Comercial e Gerador de PDF)

window.Aba5Propostas = {
  propostaAtual: null,
  modoVisualizacao: 'EDITOR', // 'EDITOR' ou 'LISTA'
  filtroBuscaLista: '',
  filtroStatusLista: 'TODOS',
  painelFinanceiroRecuado: localStorage.getItem('calc_painel_recuado') === 'true',

  togglePainelFinanceiro() {
    this.painelFinanceiroRecuado = !this.painelFinanceiroRecuado;
    localStorage.setItem('calc_painel_recuado', this.painelFinanceiroRecuado ? 'true' : 'false');
    this.render();
  },

  initPropostaVazia() {
    return {
      id: null,
      codigo: Store.gerarProximoCodigoProposta(),
      clienteId: '',
      nomeEvento: '',
      dataEvento: new Date().toISOString().slice(0, 10),
      localEvento: '',
      numConvidados: 100,
      duracaoHoras: 6,
      linhaInsumos: 'A',
      escalacaoBebidas: {},
      qtdBartenders: 2,
      fatoresConsumoPersonalizados: {},
      status: 'Em Aberto',
      estoqueBaixado: false,
      coqueteis: [],
      servicos: [],
      ajustesInsumosCoqueteis: {},
      perifericos: [],
      observacoesProposta: 'Serviço completo de coquetelaria com estrutura de bar, equipe uniformizada, insumos selecionados e cardápio personalizado.',
      timelineNegociacao: [],
      fluxoCaixa: [],
      criadoEm: new Date().toISOString()
    };
  },

  render() {
    const container = document.getElementById('tab-propostas');
    if (!container) return;

    if (!this.propostaAtual) {
      // Carrega a primeira proposta salva para demonstração imediata ou cria uma nova
      if (Store.state.propostas && Store.state.propostas.length > 0) {
        this.propostaAtual = JSON.parse(JSON.stringify(Store.state.propostas[0]));
      } else {
        this.propostaAtual = this.initPropostaVazia();
      }
    }

    this.sincronizarIntegridadePropostaAtual();
    const p = this.propostaAtual;

    // Sincroniza o gelo da proposta pelo consumo dos bartenders caso ainda tenha o valor antigo
    if (p.perifericos) {
      const qtdB = Number(p.qtdBartenders) || 2;
      p.perifericos.forEach((itemPer) => {
        const ins = (Store.state.insumos || []).find((i) => i.id === itemPer.insumoId);
        if (ins && (ins.categoria === 'Gelo' || (ins.descricao || '').toLowerCase().includes('gelo'))) {
          if (itemPer.quantidade === 120 && qtdB === 3) {
            itemPer.quantidade = 90;
          }
        }
      });
    }

    const consolidado = Store.consolidarProposta(p);
    const clientes = Store.state.clientes || [];
    const clienteObj = clientes.find((c) => c.id === p.clienteId);
    const drinquesDisponiveis = [...(Store.state.drinques || [])].sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
    );

    // Mantém a lista de coquetéis selecionados na proposta em ordem alfabética
    if (Array.isArray(p.coqueteis) && p.coqueteis.length > 1) {
      const mapaNomes = new Map(drinquesDisponiveis.map((d) => [d.id, d.nome || '']));
      p.coqueteis.sort((a, b) => (mapaNomes.get(a.drinqueId) || '').localeCompare(mapaNomes.get(b.drinqueId) || '', 'pt-BR', { sensitivity: 'base' }));
    }

    const servicosDisponiveis = Store.state.servicos || [];
    const insumosDisponiveis = Store.state.insumos || [];
    const propostasSalvas = Store.state.propostas || [];

    if (this.modoVisualizacao === 'LISTA') {
      container.innerHTML = this.renderListaHtml(propostasSalvas, clientes, p);
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <!-- Identificação do Módulo Comercial -->
      <div class="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
        <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
        <span>Módulo 05 • Orçamentador & Proposta Comercial</span>
      </div>

      <!-- Barra Superior da Proposta -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Esquerda: Cliente em Alto Destaque + Identificação + Seletor de Proposta em Baixo -->
        <div class="space-y-2.5 min-w-0 flex-1">
          <!-- Linha do Nome do Cliente em Destaque -->
          <div class="flex items-center gap-2.5 flex-wrap">
            <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <i data-lucide="user" class="w-5 h-5"></i>
            </div>
            
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Cliente:</span>
              <h2 class="text-xl font-black text-slate-900 tracking-tight">
                ${clienteObj ? clienteObj.nome : '<span class="text-amber-600 italic font-semibold">Nenhum cliente selecionado</span>'}
              </h2>

              ${
                clienteObj?.contato
                  ? `<span class="inline-flex items-center gap-1 text-xs text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      <i data-lucide="phone" class="w-3 h-3 text-slate-400"></i>
                      <span>${clienteObj.contato}</span>
                    </span>`
                  : ''
              }

              <span class="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs shrink-0">
                ${p.codigo || 'NOVA'}
              </span>

              <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                p.status === 'Aprovada'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : p.status === 'Em Negociação'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : p.status === 'Realizada'
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                  : p.status === 'Cancelada'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }">
                ${p.status || 'Em Aberto'}
              </span>

              ${
                clienteObj
                  ? (() => {
                      const propostasDesteCli = (Store.state.propostas || []).filter((pr) => pr.clienteId === clienteObj.id);
                      if (propostasDesteCli.length > 1) {
                        return `
                          <button
                            type="button"
                            onclick="Aba5Propostas.abrirComparativoPropostasCliente('${clienteObj.id}')"
                            class="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-lg transition shadow-2xs hover:scale-102 cursor-pointer"
                            title="Ver e comparar as ${propostasDesteCli.length} propostas deste cliente lado a lado"
                          >
                            <i data-lucide="columns-2" class="w-3.5 h-3.5 text-blue-600"></i>
                            <span>Ver Lado a Lado (${propostasDesteCli.length})</span>
                          </button>
                        `;
                      }
                      return '';
                    })()
                  : ''
              }
            </div>
          </div>

          <!-- Linha de Baixo: Seletor com a Pastinha + Nome do Evento -->
          <div class="flex items-center gap-3 flex-wrap">
            <!-- Campo com a Pastinha (em baixo do nome) -->
            <div class="flex items-center bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-white rounded-xl px-2.5 py-1.5 shadow-2xs transition" title="Alternar proposta salva">
              <i data-lucide="folder-open" class="w-4 h-4 text-blue-600 mr-2 shrink-0"></i>
              <span class="text-xs font-semibold text-slate-500 mr-1.5">Proposta:</span>
              <select
                onchange="Aba5Propostas.carregarPropostaPorId(this.value)"
                class="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-1 max-w-[240px] sm:max-w-xs truncate"
              >
                <option value="__NOVA__" ${!p.id ? 'selected' : ''}>+ [Nova Proposta em Branco]</option>
                ${propostasSalvas
                  .map(
                    (prop) =>
                      `<option value="${prop.id}" ${p.id === prop.id ? 'selected' : ''}>${prop.codigo} • ${
                        prop.nomeEvento
                      } (${prop.status || 'Em Aberto'})</option>`
                  )
                  .join('')}
              </select>
            </div>

            ${
              p.nomeEvento
                ? `<span class="text-xs text-slate-600 font-medium flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 shadow-2xs">
                    <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-600"></i>
                    <span class="text-slate-400 text-[11px]">Evento:</span>
                    <strong class="text-slate-800 font-bold">${p.nomeEvento}</strong>
                  </span>`
                : ''
            }
          </div>
        </div>

        <!-- Direita: Botões de Ação (Mantidos) -->
        <div class="flex flex-wrap items-center gap-2 shrink-0 lg:self-center">
          <!-- Histórico / Ver Todas -->
          <button
            type="button"
            onclick="Aba5Propostas.alternarModoVisualizacao('LISTA')"
            class="btn-secondary text-xs py-2 px-3 font-semibold"
            title="Ver todas as propostas salvas no histórico"
          >
            <i data-lucide="layout-list" class="w-4 h-4 text-blue-600"></i>
            <span>Histórico (${propostasSalvas.length})</span>
          </button>

          <!-- Nova Proposta em Branco -->
          <button
            type="button"
            onclick="Aba5Propostas.solicitarNovaProposta()"
            class="btn-secondary text-xs py-2 px-3 font-semibold"
            title="Criar nova proposta em branco"
          >
            <i data-lucide="file-plus" class="w-4 h-4 text-blue-600"></i>
            <span>Nova</span>
          </button>

          <!-- Exportar PDF Comercial -->
          <button
            type="button"
            onclick="Aba5Propostas.exportarPdfCliente()"
            class="btn-primary text-xs py-2 px-3.5 font-bold shadow-xs"
            title="Exportar PDF comercial para o cliente"
          >
            <i data-lucide="file-check-2" class="w-4 h-4"></i>
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      ${this.renderBarraVersoesNegociacao(p, clienteObj)}

      <!-- Layout Principal: 8 Colunas (ou 12 se recuado) + 4 Colunas (Resumo Financeiro Sticky) -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        <!-- COLUNA ESQUERDA (8 ou 12 cols se painel recuado): Dados do Evento + Composição -->
        <div class="${this.painelFinanceiroRecuado ? 'xl:col-span-12' : 'xl:col-span-8'} space-y-6">

          <!-- BLOCO 1: Cabeçalho do Evento & Seleção da Linha (A, B, C) -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <i data-lucide="calendar-heart" class="w-4 h-4"></i>
                </div>
                <div>
                  <h2 class="text-base font-bold text-slate-900">1. Parâmetros e Dados do Evento</h2>
                  <p class="text-xs text-slate-500">Código: <strong class="font-mono text-slate-700">${p.codigo}</strong></p>
                </div>
              </div>

              <!-- Status da Proposta -->
              <div class="flex items-center gap-2">
                <label class="text-xs font-semibold text-slate-600">Status:</label>
                <select
                  onchange="Aba5Propostas.atualizarCampo('status', this.value)"
                  class="input-minimal py-1 px-2.5 text-xs font-bold w-auto ${
                    p.status === 'Aprovada'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : p.status === 'Em Negociação'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : p.status === 'Realizada'
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                      : p.status === 'Cancelada'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }"
                >
                  ${['Em Aberto', 'Em Negociação', 'Aprovada', 'Realizada', 'Cancelada']
                    .map((st) => `<option value="${st}" ${p.status === st ? 'selected' : ''}>${st}</option>`)
                    .join('')}
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
              <!-- Cliente com botão + rápido -->
              <div class="md:col-span-6">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Cliente (Aba 4) *</label>
                <div class="flex items-center gap-1.5">
                  <select
                    onchange="Aba5Propostas.atualizarCampo('clienteId', this.value)"
                    class="input-minimal flex-1"
                  >
                    <option value="">Selecione um cliente...</option>
                    ${clientes
                      .map(
                        (c) =>
                          `<option value="${c.id}" ${p.clienteId === c.id ? 'selected' : ''}>${c.nome}${
                            c.contato ? ' • ' + c.contato : ''
                          }</option>`
                      )
                      .join('')}
                  </select>
                  <button
                    type="button"
                    onclick="Aba5Propostas.cadastrarClienteRapido()"
                    class="btn-secondary px-2.5 py-2 shrink-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                    title="Cadastrar novo cliente agora"
                  >
                    <i data-lucide="user-plus" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              <!-- Nome do Evento -->
              <div class="md:col-span-6">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nome do Evento *</label>
                <input
                  type="text"
                  value="${p.nomeEvento}"
                  oninput="Aba5Propostas.atualizarCampoSemRender('nomeEvento', this.value)"
                  placeholder="Ex: Casamento Juliana & Pedro"
                  class="input-minimal font-semibold"
                />
              </div>

              <!-- Data -->
              <div class="md:col-span-3">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Data do Evento</label>
                <input
                  type="date"
                  value="${p.dataEvento}"
                  onchange="Aba5Propostas.atualizarCampoSemRender('dataEvento', this.value)"
                  class="input-minimal"
                />
              </div>

              <!-- Duração -->
              <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Duração (Horas)</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value="${p.duracaoHoras}"
                  onchange="Aba5Propostas.atualizarCampo('duracaoHoras', Number(this.value))"
                  class="input-minimal text-center font-semibold"
                />
              </div>

              <!-- Local do Evento -->
              <div class="md:col-span-7">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Local / Espaço do Evento</label>
                <input
                  type="text"
                  value="${p.localEvento}"
                  oninput="Aba5Propostas.atualizarCampoSemRender('localEvento', this.value)"
                  placeholder="Ex: Espaço Villa Cantareira - São Paulo/SP"
                  class="input-minimal"
                />
              </div>

              <!-- Número de Convidados -->
              <div class="md:col-span-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label class="block text-xs font-bold text-slate-700 mb-1">Número de Convidados *</label>
                <div class="relative">
                  <i data-lucide="users" class="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2"></i>
                  <input
                    type="number"
                    min="1"
                    value="${p.numConvidados}"
                    onchange="Aba5Propostas.alterarConvidados(Number(this.value))"
                    class="input-minimal pl-9 font-extrabold text-base text-slate-900"
                  />
                </div>
              </div>

              <!-- Bartenders Trabalhando -->
              <div class="md:col-span-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label class="block text-xs font-bold text-slate-700 mb-1">Bartenders Trabalhando *</label>
                <div class="relative">
                  <i data-lucide="user-check" class="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2"></i>
                  <input
                    type="number"
                    min="1"
                    value="${consolidado.qtdBartenders}"
                    onchange="Aba5Propostas.atualizarQtdBartenders(Number(this.value))"
                    class="input-minimal pl-9 font-extrabold text-base text-slate-900"
                    placeholder="2"
                  />
                </div>
              </div>
            </div>

            <!-- SELETOR DE LINHA DE INSUMOS (A, B, C) -->
            <div class="mt-5 pt-4 border-t border-slate-100">
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i data-lucide="layers" class="w-4 h-4 text-blue-600"></i>
                  Seleção da Linha de Insumos (Recalcula Marcas e Custos Automaticamente)
                </label>
                <span class="text-[11px] text-slate-500">Itens "Sem Linha" entram em todas as opções</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                ${[
                  {
                    id: 'A',
                    titulo: 'Linha A • Premium',
                    sub: 'Tanqueray, Absolut, Havana Club...',
                    corAtiva: 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20'
                  },
                  {
                    id: 'B',
                    titulo: 'Linha B • Padrão',
                    sub: 'Beefeater, Smirnoff, Bacardi...',
                    corAtiva: 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600/20'
                  },
                  {
                    id: 'C',
                    titulo: 'Linha C • Econômica',
                    sub: 'Seagers, Orloff, Montilla...',
                    corAtiva: 'border-slate-700 bg-slate-100 ring-2 ring-slate-600/20'
                  }
                ]
                  .map(
                    (l) => `
                  <button
                    type="button"
                    onclick="Aba5Propostas.selecionarLinha('${l.id}')"
                    class="text-left p-3.5 rounded-xl border transition flex items-start justify-between ${
                      p.linhaInsumos === l.id ? l.corAtiva : 'border-slate-200 bg-white hover:bg-slate-50'
                    }"
                  >
                    <div>
                      <span class="block text-sm font-bold text-slate-900">${l.titulo}</span>
                      <span class="block text-[11px] text-slate-500 mt-0.5">${l.sub}</span>
                    </div>
                    <div class="w-5 h-5 rounded-full border flex items-center justify-center ${
                      p.linhaInsumos === l.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }">
                      ${p.linhaInsumos === l.id ? '✓' : ''}
                    </div>
                  </button>
                `
                  )
                  .join('')}
              </div>

</div>
          </div>

          <!-- BLOCO 2: Seleção de Coquetéis (Cardápio do Evento) -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <i data-lucide="martini" class="w-4 h-4"></i>
                </div>
                <div>
                  <h2 class="text-base font-bold text-slate-900">2. Coquetéis Selecionados (Aba 3)</h2>
                  <p class="text-xs text-slate-500">Cardápio de drinques selecionados para o atendimento do bar.</p>
                </div>
              </div>

              <!-- Adicionar Drinque -->
              <div class="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onclick="Aba5Propostas.abrirPainelDrinques()"
                  class="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-sm font-semibold"
                >
                  <i data-lucide="check-square" class="w-4 h-4"></i>
                  <span>Painel de Drinques (Seleção em Massa)</span>
                </button>
                <select id="select-add-coquetel" class="input-minimal py-1.5 text-xs w-48">
                  <option value="">+ Adicionar individual...</option>
                  ${drinquesDisponiveis
                    .map((d) => `<option value="${d.id}">${d.nome}</option>`)
                    .join('')}
                </select>
                <button
                  type="button"
                  onclick="Aba5Propostas.adicionarCoquetel()"
                  class="btn-secondary py-1.5 px-2.5 text-xs whitespace-nowrap text-blue-700 border-blue-200 hover:bg-blue-50"
                  title="Adicionar o drinque selecionado no menu"
                >
                  Adicionar
                </button>
              </div>
            </div>

            ${(() => {
              if ((p.coqueteis || []).length === 0) return '';
              const gruposDosCoqueteis = Store.getGruposBebidasDosCoqueteis(p);
              const gruposComOpcoes = gruposDosCoqueteis
                .map((g) => {
                  const candidatos = Store.getCandidatosBebidasPorLinha(g, p.linhaInsumos);
                  const insumoAtual = Store.resolverInsumoPorLinha({ grupoGenerico: g }, p.linhaInsumos, p.escalacaoBebidas);
                  const titularPadrao = candidatos.find((c) => c.escalado) || candidatos[0];
                  const foiCustomizado = Boolean(insumoAtual && titularPadrao && insumoAtual.id !== titularPadrao.id);
                  return { grupo: g, candidatos, insumoAtual, foiCustomizado };
                })
                .filter((item) => item.candidatos.length > 1);

              if (gruposComOpcoes.length === 0) return '';

              const temCustomizado = gruposComOpcoes.some((item) => item.foiCustomizado);

              const botoesMarcas = gruposComOpcoes
                .map(({ grupo, candidatos, insumoAtual }) => {
                  const optionsHtml = candidatos
                    .map((c) => {
                      const info = Store.getInsumoCustoInfo(c);
                      const isSel = c.id === insumoAtual?.id;
                      return '<option value="' + c.id + '" ' + (isSel ? 'selected' : '') + '>' +
                        c.descricao + ' (' + Store.formatCurrency(info.precoEmbalagem) + ')' +
                        (c.escalado ? ' ⭐' : '') +
                      '</option>';
                    })
                    .join('');

                  return '<div class="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">' +
                    '<span class="text-slate-500 font-semibold text-[11px]">' + grupo + ':</span>' +
                    '<select onchange="Aba5Propostas.trocarBebidaEscalada(\'' + grupo + '\', this.value)" class="text-xs font-bold text-blue-900 bg-transparent border-0 focus:ring-0 cursor-pointer p-0 pr-4" title="Alternar entre as marcas de ' + grupo + ' disponíveis na Linha ' + p.linhaInsumos + '">' +
                      optionsHtml +
                    '</select>' +
                  '</div>';
                })
                .join('');

              const botaoRestaurarHtml = temCustomizado
                ? '<button type="button" onclick="Aba5Propostas.restaurarEscalacaoPadrao()" class="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium" title="Voltar aos rótulos titulares padrão da Linha">Restaurar padrão</button>'
                : '';

              return '<div class="mb-3.5 px-3.5 py-2 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-wrap items-center justify-between gap-2.5">' +
                '<div class="flex items-center gap-2.5 flex-wrap">' +
                  '<span class="font-bold text-slate-800 text-xs flex items-center gap-1.5">' +
                    '<i data-lucide="sparkles" class="w-3.5 h-3.5 text-blue-600"></i>' +
                    '<span>Rótulos em Uso (Linha ' + p.linhaInsumos + '):</span>' +
                  '</span>' +
                  botoesMarcas +
                '</div>' +
                botaoRestaurarHtml +
              '</div>';
            })()}

            ${
              (p.coqueteis || []).length === 0
                ? `
              <div class="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p class="text-xs text-slate-500 mb-3">Nenhum drinque selecionado ainda. Abra o painel de seleção em massa ou escolha individualmente acima para compor o cardápio.</p>
                <button
                  type="button"
                  onclick="Aba5Propostas.abrirPainelDrinques()"
                  class="btn-primary py-2 px-4 text-xs inline-flex items-center gap-2 font-semibold shadow-sm"
                >
                  <i data-lucide="check-square" class="w-4 h-4"></i>
                  <span>Abrir Painel de Seleção de Drinques</span>
                </button>
              </div>
            `
                : `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${p.coqueteis
                  .map((coq, idx) => {
                    const drinque = drinquesDisponiveis.find((d) => d.id === coq.drinqueId);
                    if (!drinque) return '';
                    const calcLinha = Store.calcularCustoDrinquePorLinha(drinque, p.linhaInsumos, p.escalacaoBebidas);
                    const imgSrc = drinque.foto && drinque.foto.trim() ? drinque.foto : Store.getDefaultDrinkSvg();

                    return `
                      <div class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                        <img src="${imgSrc}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                            <h4 class="text-sm font-bold text-slate-900 truncate">${drinque.nome}</h4>
                            <button
                              type="button"
                              onclick="Aba5Propostas.removerCoquetel(${idx})"
                              class="text-slate-400 hover:text-red-600 p-1"
                              title="Remover do cardápio"
                            >
                              <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                          </div>
                          <div class="text-[11px] text-slate-500 mt-1 flex items-center justify-between gap-1 flex-wrap">
                            <span>Custo Ref. Dose (Linha ${p.linhaInsumos}): <strong class="text-blue-700">${Store.formatCurrency(calcLinha.custoDose)}</strong></span>
                            ${(() => {
                              const ingDestilado = (drinque.ingredientes || []).find((ing) => {
                                const ins = Store.resolverInsumoPorLinha(ing, p.linhaInsumos, p.escalacaoBebidas);
                                const g = ing.grupoGenerico || (ins ? (ins.grupoGenerico || Store.inferirGrupoGenerico(ins.descricao, ins.categoria)) : '');
                                return Boolean(g && (!ins || !ins.semLinha));
                              });
                              if (!ingDestilado) return '';
                              const insResolvido = Store.resolverInsumoPorLinha(ingDestilado, p.linhaInsumos, p.escalacaoBebidas);
                              if (!insResolvido) return '';
                              return `<span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium truncate max-w-[170px]" title="${insResolvido.descricao}">🥃 ${insResolvido.descricao}</span>`;
                            })()}
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            `
            }
          </div>

          <!-- BLOCO 3: Listagem Automática de Insumos dos Coquetéis (Editável) -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <i data-lucide="flask-round" class="w-4 h-4"></i>
                </div>
                <div>
                  <h2 class="text-base font-bold text-slate-900">3. Insumos Consolidados dos Coquetéis (Linha ${p.linhaInsumos})</h2>
                  <p class="text-xs text-slate-500">Calculado automaticamente pelo consumo dos bartenders em ${p.duracaoHoras}h de evento. Você pode ajustar quantidades manualmente se desejar.</p>
                </div>
              </div>

              ${
                Object.keys(p.ajustesInsumosCoqueteis || {}).length > 0 ||
                Object.keys(p.fatoresConsumoPersonalizados || {}).length > 0
                  ? `
                <button
                  type="button"
                  onclick="Aba5Propostas.resetarAjustesInsumos()"
                  class="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  Restaurar Cálculo Automático
                </button>
              `
                  : ''
              }
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse table-clean">
                <thead>
                  <tr>
                    <th>Insumo (Marca Resolvida p/ Linha ${p.linhaInsumos})</th>
                    <th class="w-44">
                      <div class="flex items-center gap-1">
                        <span>Fator / Bartender</span>
                        <span class="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-bold">5h</span>
                      </div>
                      <div class="text-[10px] font-normal text-slate-400" title="Alterações aqui personalizam apenas este evento. O cadastro original na Aba 1 nunca é modificado.">(editável neste evento)</div>
                    </th>
                    <th>
                      <div>Volume Calculado</div>
                      <div class="text-[10px] font-normal text-slate-400 lowercase">
                        ${
                          (p.modoCalculoVolume || 'BARTENDER') === 'BARTENDER'
                            ? `(${consolidado.qtdBartenders} bar × fator × ${p.duracaoHoras || 5}h/5)`
                            : '(doses × ml da receita)'
                        }
                      </div>
                    </th>
                    <th>Qtd. Final (Editável)</th>
                    <th>Equiv. Embalagens</th>
                    <th class="text-right">Subtotal Custo</th>
                  </tr>
                </thead>
                <tbody>
                  ${(() => {
                    if (consolidado.listaInsumosCoqueteis.length === 0) {
                      return `<tr><td colspan="6" class="text-center py-6 text-xs text-slate-400">Selecione coquetéis acima para visualizar a explosão de insumos.</td></tr>`;
                    }

                    // Agrupar insumos por categoria e ordenar
                    const grupos = {};
                    consolidado.listaInsumosCoqueteis.forEach((item) => {
                      const cat = (item.insumo && item.insumo.categoria) ? item.insumo.categoria.trim() : 'Outros';
                      if (!grupos[cat]) grupos[cat] = [];
                      grupos[cat].push(item);
                    });

                    const categorias = Object.keys(grupos).sort((a, b) => {
                      if (a === 'Outros') return 1;
                      if (b === 'Outros') return -1;
                      return a.localeCompare(b, 'pt-BR');
                    });

                    return categorias
                      .map((cat) => {
                        const itens = grupos[cat];
                        // Ordenar itens dentro da categoria alfabeticamente
                        itens.sort((a, b) => {
                          const descA = (a.insumo?.descricao || '').replace(/\s*\((?:produção própria|sub-receita|matéria-prima)\)/gi, '').trim();
                          const descB = (b.insumo?.descricao || '').replace(/\s*\((?:produção própria|sub-receita|matéria-prima)\)/gi, '').trim();
                          return descA.localeCompare(descB, 'pt-BR');
                        });

                        const subtotalCat = itens.reduce((acc, it) => acc + (it.custoTotal || 0), 0);

                        const headerCategoria = `
                          <tr class="bg-slate-100/90 border-y-2 border-slate-200">
                            <td colspan="6" class="py-2.5 px-3">
                              <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                  <span class="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                                  <span class="text-xs font-bold uppercase tracking-wider text-slate-800">${cat}</span>
                                  <span class="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
                                    ${itens.length} ${itens.length === 1 ? 'item' : 'itens'}
                                  </span>
                                </div>
                                <div class="text-xs font-semibold text-slate-600">
                                  Subtotal Categoria: <strong class="text-slate-900">${Store.formatCurrency(subtotalCat)}</strong>
                                </div>
                              </div>
                            </td>
                          </tr>
                        `;

                        const linhasItens = itens
                          .map((item) => {
                            const nomeLimpo = (item.insumo.descricao || '')
                              .replace(/\s*\((?:produção própria|sub-receita|matéria-prima)\)/gi, '')
                              .trim();

                            // Detecção de Unificação de Fruta x Suco para exibição visual
                            const convSuco = Store.calcularConversaoFrutaSuco(item.insumo, item.quantidadeFinal);
                            const sucosVinculados = (consolidado.listaInsumosCoqueteis || []).filter(
                              (other) =>
                                other.insumo?.unificacaoCompraChecklist?.ativo &&
                                other.insumo.unificacaoCompraChecklist.insumoBaseId === item.insumo.id
                            );
                            let badgeUnificacaoHtml = '';
                            if (convSuco && convSuco.insumoFruta) {
                              badgeUnificacaoHtml = `
                                <div class="mt-1.5 flex flex-wrap items-center justify-between gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-2 py-1 rounded text-xs">
                                  <span>🍋 <strong>Unificado no Checklist:</strong> ≈ ${Store.formatNumber(convSuco.qtdFrutaNecessaria, 0)} ${convSuco.unidadeFruta} de ${convSuco.insumoFruta.descricao} (~${convSuco.numLimõesAprox} un)</span>
                                  <button type="button" onclick="App.abrirModalRendimentoFruta('${item.insumo.id}')" class="text-xs text-blue-700 hover:text-blue-900 font-bold hover:underline" title="Ajustar rendimento fruta x suco">⚙️ Rendimento</button>
                                </div>
                              `;
                            } else if (sucosVinculados.length > 0) {
                              let totalFrutaParaSuco = 0;
                              let totalMlSuco = 0;
                              sucosVinculados.forEach((s) => {
                                const c = Store.calcularConversaoFrutaSuco(s.insumo, s.quantidadeFinal, item.insumo);
                                if (c) {
                                  totalFrutaParaSuco += c.qtdFrutaNecessaria;
                                  totalMlSuco += s.quantidadeFinal;
                                }
                              });
                              const totalFinalChecklist = item.quantidadeFinal + totalFrutaParaSuco;
                              badgeUnificacaoHtml = `
                                <div class="mt-1.5 flex flex-wrap items-center justify-between gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 px-2 py-1 rounded text-xs">
                                  <span>🛒 <strong>Total no Checklist:</strong> ${Store.formatNumber(totalFinalChecklist, 0)} ${item.insumo.unidade} (${Store.formatNumber(item.quantidadeFinal, 0)} ${item.insumo.unidade} fruta + ${Store.formatNumber(totalFrutaParaSuco, 0)} ${item.insumo.unidade} p/ ${Store.formatNumber(totalMlSuco, 0)} ml suco)</span>
                                  <button type="button" onclick="App.abrirModalRendimentoFruta('${sucosVinculados[0].insumo.id}')" class="text-xs text-blue-700 hover:text-blue-900 font-bold hover:underline" title="Ajustar rendimento fruta x suco">⚙️ Rendimento</button>
                                </div>
                              `;
                            }

                            return `
                              <tr>
                                <td>
                                  ${
                                    item.isProducaoPropria
                                      ? `
                                    <div class="font-bold text-indigo-700 text-sm">
                                      ${nomeLimpo}
                                    </div>
                                    <div class="text-[11px] text-slate-500 mt-0.5">
                                      <span class="text-indigo-600 font-semibold">Produção Própria</span> • Lote: ${item.volumeEmbalagem}${item.insumo.unidade} (${Store.formatCurrency(item.precoEmbalagem)}/lote)
                                    </div>
                                    ${badgeUnificacaoHtml}
                                  `
                                      : `
                                    <div class="font-semibold text-slate-900 text-sm">
                                      ${nomeLimpo}
                                    </div>
                                    <div class="text-[11px] text-slate-500 mt-0.5">
                                      ${
                                        item.insumo.semLinha
                                          ? '<span class="text-emerald-700 font-medium">Uso Comum</span>'
                                          : `<span class="text-blue-700 font-semibold">Linha ${item.insumo.linha}</span>`
                                      } • Forn: ${item.fornecedorNome} (${Store.formatCurrency(item.precoEmbalagem)}/${item.volumeEmbalagem}${item.insumo.unidade})
                                    </div>
                                    ${(() => {
                                      const grupo = item.insumo.grupoGenerico || Store.inferirGrupoGenerico(item.insumo.descricao, item.insumo.categoria);
                                      if (!grupo || item.insumo.semLinha) return '';
                                      const candidatosGrupo = Store.getCandidatosBebidasPorLinha(grupo, p.linhaInsumos);
                                      if (candidatosGrupo.length <= 1) return '';
                                      return `
                                        <div class="mt-1 flex items-center gap-1.5">
                                          <span class="text-[10px] text-slate-500 font-medium">Trocar marca:</span>
                                          <select
                                            onchange="Aba5Propostas.trocarBebidaEscalada('${grupo}', this.value)"
                                            class="text-[11px] py-0.5 px-2 font-semibold border border-blue-300 rounded-lg bg-blue-50/50 text-blue-900 cursor-pointer hover:bg-blue-100/70"
                                            title="Trocar a marca de ${grupo} nesta proposta"
                                          >
                                            ${candidatosGrupo
                                              .map((c) => {
                                                const info = Store.getInsumoCustoInfo(c);
                                                return `
                                                <option value="${c.id}" ${c.id === item.insumo.id ? 'selected' : ''}>
                                                  ${c.descricao} (${Store.formatCurrency(info.precoEmbalagem)})${c.escalado ? ' ⭐ Titular' : ''}
                                                </option>
                                              `;
                                              })
                                              .join('')}
                                          </select>
                                        </div>
                                      `;
                                    })()}
                                    ${badgeUnificacaoHtml}
                                  `
                                  }
                                </td>
                                <td>
                                  <div class="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      step="any"
                                      min="0.1"
                                      value="${item.fatorBase5h}"
                                      onchange="Aba5Propostas.atualizarFatorConsumoInsumo('${item.insumoId}', this.value)"
                                      class="input-minimal py-1 px-1.5 w-20 text-xs font-bold text-center ${
                                        item.temFatorCustom
                                          ? 'text-amber-900 bg-amber-50 border-amber-400 focus:bg-white ring-1 ring-amber-300'
                                          : 'text-blue-700 bg-blue-50/70 border-blue-300 focus:bg-white'
                                      }"
                                      title="${
                                        item.temFatorCustom
                                          ? `Fator personalizado exclusivamente para este evento. O cadastro na Aba 1 permanece intacto (${Store.formatNumber(item.fatorOriginalPadrao)} ${item.insumo.unidade}).`
                                          : `Fator padrão da Aba 1 (${Store.formatNumber(item.fatorOriginalPadrao)} ${item.insumo.unidade}). Altere para personalizar apenas nesta proposta.`
                                      }"
                                    />
                                    <span class="text-xs text-slate-500 font-medium">${item.insumo.unidade}</span>
                                    ${
                                      item.temFatorCustom
                                        ? `
                                      <button
                                        type="button"
                                        onclick="Aba5Propostas.restaurarFatorConsumoOriginal('${item.insumoId}')"
                                        class="text-amber-700 hover:text-amber-900 hover:bg-amber-100 p-1 rounded text-xs transition-colors font-bold"
                                        title="Restaurar para o fator original da Aba 1 (${Store.formatNumber(item.fatorOriginalPadrao)} ${item.insumo.unidade})"
                                      >
                                        ↺
                                      </button>
                                    `
                                        : ''
                                    }
                                  </div>
                                  ${
                                    item.temFatorCustom
                                      ? `
                                    <div class="text-[10px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                                      <span>★ Evento</span>
                                      <span class="text-slate-400 font-normal">(Aba 1: ${Store.formatNumber(item.fatorOriginalPadrao)})</span>
                                    </div>
                                  `
                                      : `
                                    <div class="text-[10px] text-slate-400 mt-0.5">
                                      Padrão Aba 1
                                    </div>
                                  `
                                  }
                                </td>
                                <td class="text-xs text-slate-600 font-mono whitespace-nowrap">
                                  <span class="font-bold text-slate-900">${Store.formatNumber(item.quantidadeCalculada)} ${item.insumo.unidade}</span>
                                  <div class="text-[10px] text-slate-400 font-sans mt-0.5">${(item.origens || []).join('<br>')}</div>
                                </td>
                                <td>
                                  <div class="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      value="${item.quantidadeFinal}"
                                      onchange="Aba5Propostas.ajustarQuantidadeInsumoCoquetel('${item.insumoId}', this.value)"
                                      class="input-minimal py-1 px-2 w-24 text-xs font-bold ${
                                        item.editadoManualmente ? 'border-amber-400 bg-amber-50/50' : ''
                                      }"
                                    />
                                    <span class="text-xs text-slate-500">${item.insumo.unidade}</span>
                                  </div>
                                </td>
                                <td class="text-xs text-slate-700">
                                  <div class="font-bold text-slate-800">
                                    ≈ ${item.qtdEmbalagens} ${item.isProducaoPropria ? 'lote(s)' : 'emb.'} (${item.volumeEmbalagem}${item.insumo.unidade})
                                  </div>
                                  ${
                                    item.volumeEmbalagem > 1 && item.volumeTotalLevado
                                      ? `<div class="text-[11px] text-blue-700 font-semibold mt-0.5">Total levado: ${Store.formatNumber(item.volumeTotalLevado, 0)} ${item.insumo.unidade}</div>`
                                      : ''
                                  }
                                </td>
                                <td class="text-right">
                                  <div class="font-extrabold text-slate-900">${Store.formatCurrency(item.custoTotal)}</div>
                                  ${
                                    item.volumeEmbalagem > 1 && item.custoProporcional !== undefined && Math.abs(item.custoProporcional - item.custoTotal) > 0.01
                                      ? `<div class="text-[10px] text-slate-400 font-medium mt-0.5" title="Custo proporcional exato do ml consumido nos drinques">Prop: ${Store.formatCurrency(item.custoProporcional)}</div>`
                                      : ''
                                  }
                                </td>
                              </tr>
                            `;
                          })
                          .join('');

                        return headerCategoria + linhasItens;
                      })
                      .join('');
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          <!-- BLOCO 4: Insumos Periféricos / Outros (Gelo, Canudos, Guardanapos, Copos) -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <i data-lucide="package-check" class="w-4 h-4"></i>
                </div>
                <div>
                  <h2 class="text-base font-bold text-slate-900">4. Insumos Periféricos / Descartáveis & Gelo</h2>
                  <p class="text-xs text-slate-500">Adicione canudos, guardanapos, gelo cubo, copos descartáveis ou itens extras.</p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onclick="Aba5Propostas.sugerirPerifericosAutomatico()"
                  class="btn-secondary py-1.5 px-2.5 text-xs text-blue-700 border-blue-200 bg-blue-50/50"
                  title="Calcula gelo (30kg por bartender), canudos e guardanapos automaticamente"
                >
                  <i data-lucide="wand-2" class="w-3.5 h-3.5"></i>
                  <span>Dimensionar Gelo & Descartáveis</span>
                </button>
              </div>
            </div>

            <!-- Barra para adicionar periférico -->
            <div class="flex flex-col sm:flex-row items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <select id="select-add-periferico" class="input-minimal py-1.5 text-xs flex-1">
                <option value="">Escolher insumo periférico / extra da Aba 1...</option>
                ${insumosDisponiveis
                  .map(
                    (ins) =>
                      `<option value="${ins.id}">${ins.descricao} (${ins.unidade} • ${Store.formatCurrency(
                        Store.getInsumoCustoInfo(ins).precoEmbalagem
                      )}/${ins.volumeEmbalagem}${ins.unidade})</option>`
                  )
                  .join('')}
              </select>
              <input
                type="number"
                id="qtd-add-periferico"
                placeholder="Quantidade"
                value="100"
                min="1"
                class="input-minimal py-1.5 text-xs w-full sm:w-28 font-semibold"
              />
              <button
                type="button"
                onclick="Aba5Propostas.adicionarPeriferico()"
                class="btn-primary py-1.5 px-3 text-xs w-full sm:w-auto justify-center"
              >
                + Incluir
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse table-clean">
                <thead>
                  <tr>
                    <th>Item Periférico / Extra</th>
                    <th>Quantidade</th>
                    <th>Equiv. Compra</th>
                    <th class="text-right">Custo Subtotal</th>
                    <th class="text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    consolidado.listaPerifericos.length === 0
                      ? `<tr><td colspan="5" class="text-center py-6 text-xs text-slate-400">Nenhum item periférico adicionado.</td></tr>`
                      : consolidado.listaPerifericos
                          .map(
                            (per) => `
                        <tr>
                          <td class="font-semibold text-slate-900">${per.insumo.descricao}</td>
                          <td>
                            <div class="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                value="${per.quantidade}"
                                onchange="Aba5Propostas.atualizarQtdPeriferico(${per.indiceOriginal}, this.value)"
                                class="input-minimal py-1 px-2 w-24 text-xs font-bold"
                              />
                              <span class="text-xs text-slate-500">${per.insumo.unidade}</span>
                            </div>
                          </td>
                          <td class="text-xs text-slate-700">
                            <div class="font-bold text-slate-800">
                              ≈ ${per.qtdEmbalagens} emb. (${per.volumeEmbalagem}${per.insumo.unidade})
                            </div>
                            ${
                              per.volumeEmbalagem > 1 && per.volumeTotalLevado
                                ? `<div class="text-[11px] text-blue-700 font-semibold mt-0.5">Total levado: ${Store.formatNumber(per.volumeTotalLevado, 0)} ${per.insumo.unidade}</div>`
                                : ''
                            }
                          </td>
                          <td class="text-right">
                            <div class="font-extrabold text-slate-900">${Store.formatCurrency(per.custoTotal)}</div>
                            ${
                              per.volumeEmbalagem > 1 && per.custoProporcional !== undefined && Math.abs(per.custoProporcional - per.custoTotal) > 0.01
                                ? `<div class="text-[10px] text-slate-400 font-medium mt-0.5" title="Custo proporcional exato">Prop: ${Store.formatCurrency(per.custoProporcional)}</div>`
                                : ''
                            }
                          </td>
                          <td class="text-right">
                            <button
                              type="button"
                              onclick="Aba5Propostas.removerPeriferico(${per.indiceOriginal})"
                              class="text-slate-400 hover:text-red-600 p-1"
                            >
                              <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                          </td>
                        </tr>
                      `
                          )
                          .join('')
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- BLOCO 4.5 (EXCLUSIVO VISÃO INTERNA): Detalhamento de Produção Própria (Mise en Place / Explosão de Sub-receitas) -->
          <div class="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-blue-100">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <i data-lucide="flask-conical" class="w-5 h-5"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-base font-bold text-slate-900">Detalhamento de Produção Própria (Mise en Place)</h2>
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Visão Interna • Oculto no PDF do Cliente
                    </span>
                  </div>
                  <p class="text-xs text-slate-500">
                    Explosão automática das sub-receitas em <strong>Insumos Base (Matérias-Primas Brutas)</strong> para produzir o volume exigido pelo evento.
                  </p>
                </div>
              </div>
            </div>

            ${
              consolidado.detalhamentoProducaoPropria.length === 0
                ? `
              <div class="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p class="text-xs text-slate-500">Nenhum drinque desta proposta utiliza Insumos de Produção Própria (Sub-receitas).</p>
              </div>
            `
                : `
              <div class="space-y-4">
                <!-- Cards de Explosão por Sub-receita -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  ${consolidado.detalhamentoProducaoPropria
                    .map(
                      (sub) => `
                    <div class="border border-blue-200 bg-blue-50/30 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div class="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-blue-200/70">
                          <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Sub-receita Preparada</span>
                            <h4 class="font-bold text-slate-900 text-sm">${sub.insumoProprio.descricao}</h4>
                            ${
                              sub.destinacoes && sub.destinacoes.length > 1
                                ? `
                              <div class="mt-1.5 space-y-1 bg-white/80 p-2 rounded-lg border border-blue-200/60 text-[11px]">
                                <span class="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Destinação do Volume:</span>
                                ${sub.destinacoes
                                  .map(
                                    (d) => `
                                  <div class="flex items-center justify-between gap-3 text-slate-600">
                                    <span>• ${d.origemTexto}:</span>
                                    <span class="font-bold text-blue-900">${Store.formatNumber(d.quantidade)} ${d.unidade}</span>
                                  </div>
                                `
                                  )
                                  .join('')}
                              </div>
                            `
                                : `
                              <span class="text-[11px] text-slate-500 block mt-0.5">Destinação: ${sub.origens.join(', ')}</span>
                            `
                            }
                          </div>
                          <div class="text-right bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 shrink-0">
                            <span class="text-[10px] font-bold uppercase text-slate-400 block">Total a Produzir</span>
                            <span class="text-sm font-extrabold text-blue-800">${Store.formatNumber(sub.quantidadeTotalNecessaria)} ${sub.unidade}</span>
                            <span class="block text-[10px] text-slate-500">(${Store.formatNumber(sub.fatorMultiplicador, 2)}x receita de ${sub.rendimentoReceita}${sub.unidade})</span>
                          </div>
                        </div>

                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                          Explosão de Matérias-Primas Brutas para produzir ${Store.formatNumber(sub.quantidadeTotalNecessaria)} ${sub.unidade}:
                        </span>
                        <div class="space-y-1.5">
                          ${sub.ingredientesExplodidos
                            .map(
                              (ing) => `
                            <div class="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                              <div>
                                <span class="font-semibold text-slate-800">${ing.insumoBase.descricao}</span>
                                ${
                                  ing.isSubReceitaFilha
                                    ? `<span class="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded ml-1">Sub-receita Intermediária</span>`
                                    : ''
                                }
                                <span class="text-[10px] text-slate-400 block">Receita base: ${ing.qtdPorReceita}${ing.unidade} p/ cada ${sub.rendimentoReceita}${sub.unidade}</span>
                              </div>
                              <div class="text-right">
                                <span class="font-extrabold text-blue-700">${Store.formatNumber(ing.qtdBrutaNecessaria, 1).replace(',0', '')} ${ing.unidade}</span>
                                <span class="block text-[10px] text-slate-500">${Store.formatCurrency(ing.custoSubtotalBruto)}</span>
                              </div>
                            </div>
                          `
                            )
                            .join('')}
                        </div>
                      </div>

                      <div class="mt-3 pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
                        <span class="font-semibold text-slate-600">Custo Total do Preparo:</span>
                        <span class="font-extrabold text-slate-900">${Store.formatCurrency(sub.custoTotalSubReceita)}</span>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>

                <!-- Tabela Consolidada de Todas as Matérias-Primas Brutas da Produção Própria -->
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                    <i data-lucide="boxes" class="w-4 h-4 text-blue-600"></i>
                    Soma Consolidada de Matérias-Primas Brutas (Insumos Base para Produção Própria)
                  </h4>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse table-clean bg-white rounded-lg overflow-hidden">
                      <thead>
                        <tr>
                          <th>Matéria-Prima Bruta (Insumo Base)</th>
                          <th>Destinação nas Sub-receitas</th>
                          <th>Total Bruto Necessário</th>
                          <th class="text-right">Custo Proporcional</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${consolidado.listaMateriasPrimasConsolidadas
                          .map(
                            (mp) => `
                          <tr>
                            <td class="font-semibold text-slate-900">${mp.insumoBase.descricao}</td>
                            <td class="text-xs text-slate-600">
                              <div class="flex flex-wrap gap-1">
                                ${mp.subReceitasOrigem
                                  .map(
                                    (origem) => `
                                  <span class="inline-flex items-center bg-slate-100/80 border border-slate-200/80 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                                    ${origem}
                                  </span>
                                `
                                  )
                                  .join('')}
                              </div>
                            </td>
                            <td class="font-extrabold text-blue-700 whitespace-nowrap">
                              ${Store.formatNumber(mp.quantidadeTotalBruta, 1).replace(',0', '')} ${mp.insumoBase.unidade}
                            </td>
                            <td class="text-right font-bold text-slate-900">${Store.formatCurrency(mp.custoTotalBruto)}</td>
                          </tr>
                        `
                          )
                          .join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            `
            }
          </div>

          <!-- BLOCO 5: Serviços, Equipe e Logística (Aba 2) -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <i data-lucide="users" class="w-4 h-4"></i>
                </div>
                <div>
                  <h2 class="text-base font-bold text-slate-900">5. Equipe, Estrutura e Logística (Aba 2)</h2>
                  <p class="text-xs text-slate-500">Dimensione bartenders, barbacks, copeiros, frete e balcões.</p>
                </div>
              </div>

              <button
                type="button"
                onclick="Aba5Propostas.dimensionarEquipeAutomatico()"
                class="btn-secondary py-1.5 px-2.5 text-xs text-blue-700 border-blue-200 bg-blue-50/50"
                title="Aplica as regras de convidados por profissional cadastradas na Aba 2"
              >
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                <span>Dimensionar Equipe p/ ${p.numConvidados} Convidados</span>
              </button>
            </div>

            <!-- Barra para adicionar serviço -->
            <div class="flex flex-col sm:flex-row items-center gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <select id="select-add-servico" class="input-minimal py-1.5 text-xs flex-1">
                <option value="">Escolher serviço cadastrado na Aba 2...</option>
                ${servicosDisponiveis
                  .map((s) => {
                    const vhText = Number(s.valorHora) > 0 ? ` • ${Store.formatCurrency(s.valorHora)}/h` : '';
                    return `<option value="${s.id}">${s.descricao} (${s.categoria}${vhText} • Diária ${Store.formatCurrency(
                      s.valorUnitario
                    )})</option>`;
                  })
                  .join('')}
              </select>
              <input
                type="number"
                id="qtd-add-servico"
                value="1"
                min="1"
                class="input-minimal py-1.5 text-xs w-full sm:w-24 font-semibold text-center"
              />
              <button
                type="button"
                onclick="Aba5Propostas.adicionarServico()"
                class="btn-primary py-1.5 px-3 text-xs w-full sm:w-auto justify-center"
              >
                + Adicionar
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse table-clean">
                <thead>
                  <tr>
                    <th>Serviço / Função</th>
                    <th class="text-center">Quantidade</th>
                    <th class="text-center">Valor / Hora (R$)</th>
                    <th class="text-center">Duração</th>
                    <th class="text-center">Valor / Profissional (R$)</th>
                    <th class="text-right">Subtotal</th>
                    <th class="text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    consolidado.listaServicos.length === 0
                      ? `<tr><td colspan="7" class="text-center py-6 text-xs text-slate-400">Nenhum serviço adicionado.</td></tr>`
                      : consolidado.listaServicos
                          .map(
                            (srv) => `
                        <tr>
                          <td>
                            <div class="font-semibold text-slate-900">${srv.servico.descricao}</div>
                            <div class="text-[11px] text-slate-500">${srv.servico.categoria}</div>
                          </td>
                          <td class="text-center">
                            <input
                              type="number"
                              min="1"
                              value="${srv.quantidade}"
                              onchange="Aba5Propostas.atualizarItemServico(${srv.indiceOriginal}, 'quantidade', this.value)"
                              class="input-minimal py-1 px-2 w-16 text-xs font-bold text-center mx-auto"
                            />
                          </td>
                          <td class="text-center">
                            <div class="inline-flex items-center justify-center gap-1">
                              <span class="text-xs text-slate-400 font-semibold">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value="${srv.valorHora > 0 ? srv.valorHora : ''}"
                                placeholder="Fixo"
                                title="Valor cobrado por hora do profissional. Ao mudar a duração do evento no topo, o valor total do profissional recalcula automaticamente."
                                onchange="Aba5Propostas.atualizarItemServico(${srv.indiceOriginal}, 'valorHora', this.value)"
                                class="input-minimal py-1 px-2 w-24 text-xs font-bold text-emerald-700 bg-emerald-50/50 border-emerald-200 text-center"
                              />
                            </div>
                          </td>
                          <td class="text-center whitespace-nowrap">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/70" title="Duração das horas do evento configurada no topo da proposta">
                              ${p.duracaoHoras || 5}h
                            </span>
                          </td>
                          <td class="text-center">
                            <div class="inline-flex items-center justify-center gap-1">
                              <span class="text-xs text-slate-400 font-semibold">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value="${srv.valorUnitario}"
                                title="Valor total por profissional no evento (${p.duracaoHoras || 5}h × R$ ${srv.valorHora || 0}/h). Editável diretamente."
                                onchange="Aba5Propostas.atualizarItemServico(${srv.indiceOriginal}, 'valorUnitario', this.value)"
                                class="input-minimal py-1 px-2 w-28 text-xs font-semibold text-center"
                              />
                            </div>
                          </td>
                          <td class="text-right font-bold text-slate-900">${Store.formatCurrency(srv.custoTotal)}</td>
                          <td class="text-right">
                            <button
                              type="button"
                              onclick="Aba5Propostas.removerServico(${srv.indiceOriginal})"
                              class="text-slate-400 hover:text-red-600 p-1"
                              title="Remover serviço"
                            >
                              <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                          </td>
                        </tr>
                      `
                          )
                          .join('')
                  }
                </tbody>
              </table>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100">
              <label class="block text-xs font-semibold text-slate-700 mb-1">Observações Comerciais (Exibidas no rodapé do PDF do Cliente)</label>
              <textarea
                rows="2"
                oninput="Aba5Propostas.atualizarCampoSemRender('observacoesProposta', this.value)"
                class="input-minimal text-xs"
              >${p.observacoesProposta || ''}</textarea>
            </div>
          </div>

          <!-- BLOCO 6: Linha do Tempo & Histórico da Negociação -->
          ${this.renderBlocoTimelineNegociacao(p)}

          <!-- BLOCO 7: Fluxo de Caixa do Evento & Gestão de Pagamentos -->
          ${this.renderBlocoFluxoCaixa(p, consolidado)}
        </div>

        <!-- COLUNA DIREITA (4 cols): Resumo Financeiro (Visão Interna) & Ações -->
        ${
          this.painelFinanceiroRecuado
            ? `
          <!-- Botão Flutuante de Reabertura do Resumo Financeiro quando recuado -->
          <div class="fixed right-6 bottom-6 z-40">
            <button
              type="button"
              onclick="Aba5Propostas.togglePainelFinanceiro()"
              class="btn-primary shadow-2xl py-3 px-5 text-sm font-bold flex items-center gap-2.5 rounded-2xl border-2 border-white/20 bg-blue-600 hover:bg-blue-700 hover:scale-105 transition"
              title="Expandir Resumo Financeiro na lateral"
            >
              <i data-lucide="chevrons-left" class="w-5 h-5"></i>
              <span>Abrir Resumo Financeiro (${Store.formatCurrency(consolidado.custoTotalEvento)})</span>
            </button>
          </div>
        `
            : `
        <div class="xl:col-span-4 xl:sticky xl:top-6 space-y-5">
          <div class="bg-white border-2 border-blue-600 rounded-2xl shadow-md overflow-hidden">
            <!-- Header do Painel Financeiro com botão de recuo -->
            <div class="bg-blue-600 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-blue-200 block">Uso Exclusivo Interno</span>
                <h3 class="text-lg font-bold">Resumo Financeiro</h3>
              </div>
              <button
                type="button"
                onclick="Aba5Propostas.togglePainelFinanceiro()"
                class="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white border border-blue-400/80 transition flex items-center gap-1 text-xs font-semibold"
                title="Recuar Painel Financeiro para abrir largura máxima na tela"
              >
                <span>Recuar</span>
                <i data-lucide="chevrons-right" class="w-4 h-4"></i>
              </button>
            </div>

            <div class="p-5 space-y-4">
              <!-- Custos Detalhados -->
              <div class="space-y-2.5 text-sm">
                <div class="flex items-center justify-between text-slate-600">
                  <span>Insumos dos Coquetéis (Linha ${p.linhaInsumos})</span>
                  <span class="font-semibold text-slate-900">${Store.formatCurrency(consolidado.custoInsumosCoqueteis)}</span>
                </div>

                <div class="flex items-center justify-between text-slate-600">
                  <span>Insumos Periféricos & Gelo</span>
                  <span class="font-semibold text-slate-900">${Store.formatCurrency(consolidado.custoPerifericos)}</span>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-slate-100 font-semibold text-slate-800">
                  <span>Custo Total de Insumos (Emb. Fechadas)</span>
                  <span class="text-blue-700">${Store.formatCurrency(consolidado.custoTotalInsumos)}</span>
                </div>
                ${
                  consolidado.lucroTotalInsumos > 0.01
                    ? `
                  <div class="flex items-center justify-between text-[11px] bg-emerald-50/80 border border-emerald-200 text-emerald-800 px-2.5 py-1.5 rounded-lg">
                    <span>Custo Real Inventário: <strong>${Store.formatCurrency(consolidado.custoRealTotalInsumos)}</strong></span>
                    <span class="font-bold text-emerald-700">Margem Insumos: +${Store.formatCurrency(consolidado.lucroTotalInsumos)}</span>
                  </div>
                `
                    : ''
                }

                <div class="flex items-center justify-between font-semibold text-slate-800">
                  <span>Custo Total de Serviços</span>
                  <span class="text-blue-700">${Store.formatCurrency(consolidado.custoTotalServicos)}</span>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between mt-3 shadow-md">
                  <div>
                    <span class="text-xs text-slate-300 block font-bold uppercase tracking-wider">Custo Total do Evento</span>
                    <span class="text-[11px] text-slate-400">Arredondado p/ embalagens fechadas compradas</span>
                  </div>
                  <span class="text-xl font-extrabold text-blue-300">${Store.formatCurrency(consolidado.custoTotalEvento)}</span>
                </div>

                ${
                  consolidado.custoProporcionalTotalEvento && Math.abs(consolidado.custoProporcionalTotalEvento - consolidado.custoTotalEvento) > 0.01
                    ? `
                  <div class="text-[11px] text-slate-500 text-right pt-0.5">
                    Custo proporcional exato consumido: <strong class="text-slate-700">${Store.formatCurrency(consolidado.custoProporcionalTotalEvento)}</strong>
                  </div>
                `
                    : ''
                }

                ${(() => {
                  const fc = Store.calcularFluxoCaixaProposta(p);
                  return `
                    <div class="mt-3 p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
                      <div class="flex items-center justify-between text-xs font-bold">
                        <span class="text-slate-700 flex items-center gap-1.5">
                          <i data-lucide="wallet" class="w-3.5 h-3.5 text-blue-600"></i>
                          <span>Status de Pagamento</span>
                        </span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          fc.statusPagamento === 'QUITADO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : fc.statusPagamento === 'PARCIAL'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }">
                          ${fc.percentualPago}% Pago
                        </span>
                      </div>
                      <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div class="h-2 rounded-full transition-all duration-300 ${
                          fc.statusPagamento === 'QUITADO'
                            ? 'bg-emerald-500'
                            : fc.statusPagamento === 'PARCIAL'
                            ? 'bg-blue-600'
                            : 'bg-slate-300'
                        }" style="width: ${fc.percentualPago}%"></div>
                      </div>
                      <div class="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 font-medium">
                        <span>Recebido: <strong class="text-slate-800">${Store.formatCurrency(fc.totalEntradas)}</strong></span>
                        <span>Falta: <strong class="${fc.faltaPagar > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}">${Store.formatCurrency(fc.faltaPagar)}</strong></span>
                      </div>
                    </div>
                  `;
                })()}
              </div>

              <!-- Botões Principais -->
              <div class="pt-3 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  onclick="Aba5Propostas.salvarPropostaAtual()"
                  class="w-full btn-primary justify-center py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                  title="Salva a proposta preservando automaticamente as versões anteriores no histórico desta negociação"
                >
                  <i data-lucide="save" class="w-4 h-4"></i>
                  <span>${p.id ? 'Salvar Alterações da Proposta' : 'Salvar Proposta no Histórico'}</span>
                </button>

                <button
                  type="button"
                  onclick="Aba5Propostas.criarNovaVersaoDestaProposta(true)"
                  class="w-full btn-secondary justify-center py-2 text-xs font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border-indigo-200"
                  title="Guarda a negociação atual no histórico (v1, v2...) dentro desta mesma proposta para testar outras linhas/valores sem perder a anterior e sem duplicar no Funil"
                >
                  <i data-lucide="git-branch-plus" class="w-4 h-4 text-indigo-600"></i>
                  <span>+ Criar Nova Versão desta Proposta (v1, v2...)</span>
                </button>

                ${
                  Array.isArray(p.versoesNegociacao) && p.versoesNegociacao.length > 1
                    ? `
                  <button
                    type="button"
                    onclick="Aba5Propostas.abrirModalComparativoVersoes()"
                    class="w-full btn-secondary justify-center py-2 text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border-blue-200"
                    title="Comparar todas as versões anteriores desta proposta lado a lado e alternar entre elas com 1 clique"
                  >
                    <i data-lucide="history" class="w-4 h-4 text-blue-600"></i>
                    <span>Histórico de Versões desta Proposta (${p.versoesNegociacao.length})</span>
                  </button>
                `
                    : ''
                }

                <button
                  type="button"
                  onclick="Aba5Propostas.duplicarPropostaAtual()"
                  class="w-full btn-secondary justify-center py-2 text-xs font-semibold text-slate-600 hover:text-blue-700"
                  title="Cria outra proposta separada (use quando o cliente pedir orçamento para um segundo evento diferente)"
                >
                  <i data-lucide="copy" class="w-4 h-4 text-slate-500"></i>
                  <span>Duplicar p/ Outro Evento Separado</span>
                </button>

                ${
                  clienteObj && (Store.state.propostas || []).filter((pr) => pr.clienteId === clienteObj.id).length > 1
                    ? `
                  <button
                    type="button"
                    onclick="Aba5Propostas.abrirComparativoPropostasCliente('${clienteObj.id}')"
                    class="w-full btn-secondary justify-center py-2 text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100 border-blue-200"
                    title="Comparar todas as propostas deste cliente lado a lado"
                  >
                    <i data-lucide="columns-2" class="w-4 h-4 text-blue-600"></i>
                    <span>Ver Propostas deste Cliente Lado a Lado</span>
                  </button>
                `
                    : ''
                }

                <button
                  type="button"
                  onclick="Aba5Propostas.irParaChecklistDestaProposta()"
                  class="w-full btn-secondary justify-center py-2.5 text-sm font-bold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                >
                  <i data-lucide="clipboard-check" class="w-4 h-4 text-emerald-600"></i>
                  <span>Abrir no Checklist & Lista de Compras (Aba 6)</span>
                </button>

                <button
                  type="button"
                  onclick="Aba5Propostas.exportarPdfCliente()"
                  class="w-full btn-secondary justify-center py-2 text-xs text-slate-600 hover:text-blue-700"
                >
                  <i data-lucide="file-text" class="w-4 h-4 text-blue-600"></i>
                  <span>Gerar Espelho da Proposta em PDF</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Lista Rápida de Propostas Salvas -->
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <i data-lucide="history" class="w-4 h-4 text-blue-600"></i>
              Histórico de Propostas Salvas (${propostasSalvas.length})
            </h4>
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
              ${propostasSalvas
                .map((prop) => {
                  const cli = clientes.find((c) => c.id === prop.clienteId);
                  const isAtiva = p.id === prop.id;
                  return `
                    <div class="p-2.5 rounded-xl border ${
                      isAtiva ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
                    } flex items-center justify-between gap-2">
                      <div class="min-w-0 cursor-pointer flex-1" onclick="Aba5Propostas.carregarPropostaPorId('${prop.id}')">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-bold text-slate-900 truncate">${prop.nomeEvento || 'Sem nome'}</span>
                          <span class="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-blue-100 text-blue-800">Linha ${prop.linhaInsumos}</span>
                        </div>
                        <div class="text-[11px] text-slate-500 truncate">${cli ? cli.nome : '-'} • ${prop.numConvidados} conv.</div>
                      </div>
                      <button
                        type="button"
                        onclick="Aba5Propostas.excluirPropostaSalva('${prop.id}')"
                        class="text-slate-400 hover:text-red-600 p-1 shrink-0"
                        title="Excluir proposta"
                      >
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  `;
                })
                .join('')}
            </div>
            <button
              type="button"
              onclick="Aba5Propostas.alternarModoVisualizacao('LISTA')"
              class="w-full mt-3 btn-secondary py-2 text-xs text-blue-700 font-bold border-blue-200 hover:bg-blue-50 flex items-center justify-center gap-1.5 transition"
            >
              <i data-lucide="layout-list" class="w-3.5 h-3.5"></i>
              <span>Gerenciar Todas em Tabela (${propostasSalvas.length})</span>
            </button>
          </div>
        </div>
        `
        }

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  sincronizarIntegridadePropostaAtual() {
    const p = this.propostaAtual;
    if (!p) return;

    if (!p.escalacaoBebidas || typeof p.escalacaoBebidas !== 'object') {
      p.escalacaoBebidas = {};
    }

    const insIds = new Set((Store.state.insumos || []).map((i) => i.id));
    const srvIds = new Set((Store.state.servicos || []).map((s) => s.id));
    const drkIds = new Set((Store.state.drinques || []).map((d) => d.id));
    const cliIds = new Set((Store.state.clientes || []).map((c) => c.id));

    if (p.clienteId && !cliIds.has(p.clienteId)) p.clienteId = '';
    if (Array.isArray(p.coqueteis)) {
      p.coqueteis = p.coqueteis.filter((c) => c && drkIds.has(c.drinqueId));
    } else {
      p.coqueteis = [];
    }
    if (Array.isArray(p.perifericos)) {
      p.perifericos = p.perifericos.filter((per) => per && insIds.has(per.insumoId));
    } else {
      p.perifericos = [];
    }
    if (Array.isArray(p.servicos)) {
      p.servicos = p.servicos.filter((srv) => srv && srvIds.has(srv.servicoId));
      p.servicos.forEach((srv) => {
        if (srv.valorHora === undefined || srv.valorHora === null) {
          const ref = (Store.state.servicos || []).find((s) => s.id === srv.servicoId);
          if (ref && Number(ref.valorHora) > 0) {
            srv.valorHora = Number(ref.valorHora);
          } else if (p.duracaoHoras > 0 && Number(srv.valorUnitario) > 0 && ref && ref.categoria === 'Mão de Obra') {
            srv.valorHora = Math.round((Number(srv.valorUnitario) / Number(p.duracaoHoras)) * 100) / 100;
          } else {
            srv.valorHora = 0;
          }
        }
      });
    } else {
      p.servicos = [];
    }

    if (!Array.isArray(p.timelineNegociacao)) p.timelineNegociacao = [];
    if (!Array.isArray(p.fluxoCaixa)) p.fluxoCaixa = [];

    // Sincronizar estado de baixa de estoque se a proposta já estiver salva
    if (p.id) {
      const salva = (Store.state.propostas || []).find((x) => x.id === p.id);
      if (salva) {
        p.estoqueBaixado = Boolean(salva.estoqueBaixado);
        p.movimentacaoEstoque = salva.movimentacaoEstoque
          ? JSON.parse(JSON.stringify(salva.movimentacaoEstoque))
          : undefined;
        if (Array.isArray(salva.timelineNegociacao) && p.timelineNegociacao.length === 0) {
          p.timelineNegociacao = salva.timelineNegociacao;
        }
        if (Array.isArray(salva.fluxoCaixa) && p.fluxoCaixa.length === 0) {
          p.fluxoCaixa = salva.fluxoCaixa;
        }
      }
    }
  },

  recalcularGeloPorBartendersEDuracao() {
    if (!this.propostaAtual || !Array.isArray(this.propostaAtual.perifericos)) return;
    const qtd = Math.max(1, Number(this.propostaAtual.qtdBartenders) || 2);
    const duracaoHoras = Math.max(0.5, Number(this.propostaAtual.duracaoHoras) || 5);
    const fatorHoras = duracaoHoras / 5;

    this.propostaAtual.perifericos.forEach((p) => {
      const ins = (Store.state.insumos || []).find((i) => i.id === p.insumoId);
      if (ins && (ins.categoria === 'Gelo' || (ins.descricao || '').toLowerCase().includes('gelo'))) {
        const fatorGelo = Number(ins.consumoPorBartender) || 30;
        p.quantidade = Math.max(1, Math.round(qtd * fatorGelo * fatorHoras));
      }
    });
  },

  atualizarCampo(campo, valor) {
    if (!this.propostaAtual) return;
    if (campo === 'duracaoHoras') {
      const dur = Number(valor);
      this.propostaAtual.duracaoHoras = Number.isFinite(dur) ? Math.min(48, Math.max(0.5, dur)) : 5;

      // Sincroniza e recalcula serviços que utilizam valor hora por profissional
      if (Array.isArray(this.propostaAtual.servicos)) {
        this.propostaAtual.servicos.forEach((srv) => {
          let vHora = Number(srv.valorHora);
          if (!Number.isFinite(vHora) || vHora <= 0) {
            const refSrv = (Store.state.servicos || []).find((s) => s.id === srv.servicoId);
            if (refSrv && Number(refSrv.valorHora) > 0) {
              vHora = Number(refSrv.valorHora);
              srv.valorHora = vHora;
            }
          }
          if (Number.isFinite(vHora) && vHora > 0) {
            srv.valorUnitario = Math.round(this.propostaAtual.duracaoHoras * vHora * 100) / 100;
          }
        });
      }

      this.recalcularGeloPorBartendersEDuracao();
    } else if (campo === 'clienteId') {
      this.propostaAtual.clienteId = valor;
      const cli = (Store.state.clientes || []).find((c) => c.id === valor);
      if (cli && cli.nome) {
        if (
          !this.propostaAtual.nomeEvento ||
          !this.propostaAtual.nomeEvento.trim() ||
          this.propostaAtual.nomeEvento.startsWith('Evento ')
        ) {
          this.propostaAtual.nomeEvento = `Evento ${cli.nome.trim()}`;
        }
      }
    } else if (campo === 'status') {
      this.propostaAtual.status = valor;
      if (this.propostaAtual.id) {
        const propSalva = (Store.state.propostas || []).find((p) => p.id === this.propostaAtual.id);
        if (propSalva) {
          propSalva.status = valor;
          Store.save();
          App.mostrarToast(`Status alterado para "${valor}" (atualizado no Funil e CRM)!`);
        }
      }
    } else {
      this.propostaAtual[campo] = valor;
    }
    this.render();
  },

  alterarStatusPropostaDireto(propostaId, novoStatus, clienteIdModal = null) {
    const prop = (Store.state.propostas || []).find((p) => p.id === propostaId);
    if (!prop) return;
    prop.status = novoStatus;
    if (this.propostaAtual && this.propostaAtual.id === propostaId) {
      this.propostaAtual.status = novoStatus;
    }
    Store.save();
    if (clienteIdModal) {
      this.abrirComparativoPropostasCliente(clienteIdModal);
    }
    if (window.Aba4Clientes && App.abaAtiva === 'clientes') {
      window.Aba4Clientes.render();
    } else if (window.Aba8Funil && App.abaAtiva === 'funil') {
      window.Aba8Funil.render();
    } else if (App.abaAtiva === 'propostas') {
      this.render();
    }
    App.mostrarToast(`Status de "${prop.nomeEvento || prop.codigo}" atualizado para "${novoStatus}"!`);
  },

  atualizarCampoSemRender(campo, valor) {
    if (!this.propostaAtual) return;
    this.propostaAtual[campo] = valor;
  },

  alterarConvidados(novosConvidados) {
    if (!this.propostaAtual) return;
    const conv = Number(novosConvidados);
    if (!Number.isFinite(conv) || conv < 1) {
      App.mostrarToast('O número de convidados deve ser de pelo menos 1.', 'warning');
      this.propostaAtual.numConvidados = 1;
    } else {
      this.propostaAtual.numConvidados = Math.round(conv);
    }
    this.render();
  },

  selecionarLinha(linha) {
    if (!this.propostaAtual) return;
    if (!['A', 'B', 'C'].includes(linha)) return;
    const linhaAnterior = this.propostaAtual.linhaInsumos;
    this.propostaAtual.linhaInsumos = linha;

    if (linhaAnterior !== linha) {
      if (!this.propostaAtual.escalacaoBebidas || typeof this.propostaAtual.escalacaoBebidas !== 'object') {
        this.propostaAtual.escalacaoBebidas = {};
      }
      const insumos = Store.state.insumos || [];
      // Remove rótulos da escalação que pertenciam à linha anterior
      Object.keys(this.propostaAtual.escalacaoBebidas).forEach((grupo) => {
        const idAtual = this.propostaAtual.escalacaoBebidas[grupo];
        const ins = insumos.find((i) => i.id === idAtual);
        if (ins && !ins.semLinha && ins.linha !== linha) {
          delete this.propostaAtual.escalacaoBebidas[grupo];
        }
      });

      // Atualiza os grupos utilizados para os novos titulares da linha escolhida
      const gruposUsados = Store.getGruposBebidasDosCoqueteis(this.propostaAtual);
      gruposUsados.forEach((grupo) => {
        if (!this.propostaAtual.escalacaoBebidas[grupo]) {
          const titular = Store.resolverInsumoPorLinha({ grupoGenerico: grupo }, linha, {});
          if (titular && titular.id) {
            this.propostaAtual.escalacaoBebidas[grupo] = titular.id;
          }
        }
      });
    }

    this.render();
    App.mostrarToast(`Linha ${linha} selecionada! Rótulos, insumos e custos recalculados.`);
  },

  trocarBebidaEscalada(grupo, insumoId) {
    if (!this.propostaAtual) return;
    if (!this.propostaAtual.escalacaoBebidas || typeof this.propostaAtual.escalacaoBebidas !== 'object') {
      this.propostaAtual.escalacaoBebidas = {};
    }
    this.propostaAtual.escalacaoBebidas[grupo] = insumoId;
    this.render();
    const ins = (Store.state.insumos || []).find((i) => i.id === insumoId);
    App.mostrarToast(`Rótulo de ${grupo} alterado para "${ins?.descricao || 'Novo rótulo'}" na proposta!`);
  },

  restaurarEscalacaoPadrao() {
    if (!this.propostaAtual) return;
    this.propostaAtual.escalacaoBebidas = {};
    this.render();
    App.mostrarToast('Escalação de bebidas restaurada para os padrões titulares da Linha!');
  },

  cadastrarClienteRapido() {
    Aba4Clientes.abrirModalCliente(null, (novoCliente) => {
      if (this.propostaAtual && novoCliente) {
        this.propostaAtual.clienteId = novoCliente.id;
        this.render();
      }
    });
  },

  ordenarCoqueteisProposta() {
    if (!this.propostaAtual || !Array.isArray(this.propostaAtual.coqueteis)) return;
    const mapaNomes = new Map((Store.state.drinques || []).map((d) => [d.id, d.nome || '']));
    this.propostaAtual.coqueteis.sort((a, b) => {
      const nomeA = mapaNomes.get(a.drinqueId) || '';
      const nomeB = mapaNomes.get(b.drinqueId) || '';
      return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
    });
  },

  adicionarCoquetel() {
    const sel = document.getElementById('select-add-coquetel');
    const drinqueId = sel?.value;
    if (!drinqueId) {
      App.mostrarToast('Selecione um drinque para adicionar ao evento.', 'warning');
      return;
    }
    if (this.propostaAtual.coqueteis.some((c) => c.drinqueId === drinqueId)) {
      App.mostrarToast('Este drinque já faz parte do cardápio do evento.', 'warning');
      return;
    }
    this.propostaAtual.coqueteis.push({ drinqueId });
    this.ordenarCoqueteisProposta();
    this.render();
  },

  removerCoquetel(idx) {
    if (!this.propostaAtual || !Array.isArray(this.propostaAtual.coqueteis)) return;
    if (idx >= 0 && idx < this.propostaAtual.coqueteis.length) {
      this.propostaAtual.coqueteis.splice(idx, 1);
      this.render();
    }
  },

  abrirPainelDrinques() {
    if (!this.propostaAtual) return;
    const p = this.propostaAtual;
    const linha = p.linhaInsumos || 'A';
    const todosDrinques = [...(Store.state.drinques || [])].sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
    );

    const coqueteisIniciais = new Set((p.coqueteis || []).map((c) => c.drinqueId));

    const modalHtml = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">
          <!-- Cabeçalho -->
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <i data-lucide="martini" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900">Catálogo de Drinques • Seleção do Cardápio</h3>
                <p class="text-xs text-slate-500">Marque as caixas para selecionar os drinques em ordem alfabética ou use o botão para marcar todos.</p>
              </div>
            </div>
            <button onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Barra de Ferramentas / Filtros -->
          <div class="px-6 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
            <div class="relative flex-1">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
              <input
                type="text"
                id="painel-busca-drinque"
                placeholder="Buscar drinque por nome ou perfil sensorial..."
                oninput="Aba5Propostas.filtrarDrinquesModal(this.value)"
                class="input-minimal pl-9 py-1.5 text-xs w-full"
              />
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <!-- Botão Marcar Todos Checkbox -->
              <label class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer select-none text-xs font-bold text-blue-900 transition">
                <input
                  type="checkbox"
                  id="chk-painel-marcar-todos"
                  onchange="Aba5Propostas.toggleMarcarTodosDrinques(this.checked)"
                  class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Selecionar Todos</span>
              </label>

              <!-- Botão Desmarcar Todos -->
              <button
                type="button"
                onclick="Aba5Propostas.desmarcarTodosDrinques()"
                class="btn-secondary py-1.5 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                title="Desmarcar todas as caixas"
              >
                Limpar
              </button>

              <!-- Contador -->
              <div class="text-xs font-bold text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg shadow-xs">
                <span id="painel-count-selecionados">0</span> de ${todosDrinques.length} selecionado(s)
              </div>
            </div>
          </div>

          <!-- Grid de Drinques (Rolável) -->
          <div class="p-5 overflow-y-auto flex-1 bg-slate-50/30">
            <div id="painel-grid-drinques" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              ${todosDrinques
                .map((d) => {
                  const isJaNaProposta = coqueteisIniciais.has(d.id);
                  const calcLinha = Store.calcularCustoDrinquePorLinha(d, linha, p.escalacaoBebidas);
                  const imgSrc = d.foto && d.foto.trim() ? d.foto : Store.getDefaultDrinkSvg();
                  const perfil = (d.perfilSensorial || []).slice(0, 2).join(' • ');

                  return `
                    <div
                      class="drinque-card-item flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isJaNaProposta
                          ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-400'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }"
                      data-id="${d.id}"
                      data-nome="${(d.nome || '').toLowerCase()}"
                      data-busca="${(d.nome || '').toLowerCase()} ${(d.perfilSensorial || []).join(' ').toLowerCase()} ${(d.guarnicao || '').toLowerCase()}"
                      onclick="Aba5Propostas.toggleCardDrinquePainel(this, event)"
                    >
                      <input
                        type="checkbox"
                        value="${d.id}"
                        class="drinque-card-chk w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                        ${isJaNaProposta ? 'checked' : ''}
                        onclick="event.stopPropagation()"
                        onchange="Aba5Propostas.aoMudarChkDrinque(this, event)"
                      />
                      <img
                        src="${imgSrc}"
                        alt="${d.nome}"
                        class="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-1">
                          <h4 class="text-xs font-bold text-slate-900 truncate" title="${d.nome}">${d.nome}</h4>
                        </div>
                        <div class="text-[10px] text-slate-500 truncate mt-0.5">${perfil || 'Coquetel'}</div>
                        <div class="text-[10px] text-blue-700 font-semibold mt-0.5">
                          Dose (Linha ${linha}): ${Store.formatCurrency(calcLinha.custoDose)}
                        </div>
                      </div>
                    </div>
                  `;
                })
                .join('')}
            </div>

            <div id="painel-drinques-vazio" class="hidden text-center py-10">
              <i data-lucide="search-x" class="w-8 h-8 text-slate-400 mx-auto mb-2"></i>
              <p class="text-xs text-slate-500">Nenhum drinque corresponde à busca.</p>
            </div>
          </div>

          <!-- Rodapé do Modal -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onclick="App.fecharModal()"
              class="btn-secondary text-xs py-2 px-4"
            >
              Cancelar
            </button>

            <button
              type="button"
              onclick="Aba5Propostas.confirmarSelecaoPainelDrinques()"
              class="btn-primary text-xs py-2 px-5 flex items-center gap-2 font-bold shadow-sm"
            >
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Adicionar <span id="painel-btn-count-num">0</span> Drinque(s) à Proposta</span>
            </button>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
    this.atualizarContadorPainelDrinques();
  },

  toggleCardDrinquePainel(cardEl, event) {
    const chk = cardEl.querySelector('.drinque-card-chk');
    if (!chk) return;
    chk.checked = !chk.checked;
    this.atualizarEstiloCardDrinque(cardEl, chk.checked);
    this.atualizarContadorPainelDrinques();
  },

  aoMudarChkDrinque(chk, event) {
    const cardEl = chk.closest('.drinque-card-item');
    if (cardEl) {
      this.atualizarEstiloCardDrinque(cardEl, chk.checked);
    }
    this.atualizarContadorPainelDrinques();
  },

  atualizarEstiloCardDrinque(cardEl, isChecked) {
    if (isChecked) {
      cardEl.classList.add('border-blue-500', 'bg-blue-50/50', 'ring-1', 'ring-blue-400');
      cardEl.classList.remove('border-slate-200', 'bg-white');
    } else {
      cardEl.classList.remove('border-blue-500', 'bg-blue-50/50', 'ring-1', 'ring-blue-400');
      cardEl.classList.add('border-slate-200', 'bg-white');
    }
  },

  toggleMarcarTodosDrinques(marcar) {
    const cards = document.querySelectorAll('.drinque-card-item');
    cards.forEach((card) => {
      if (card.style.display !== 'none') {
        const chk = card.querySelector('.drinque-card-chk');
        if (chk) {
          chk.checked = marcar;
          this.atualizarEstiloCardDrinque(card, marcar);
        }
      }
    });
    this.atualizarContadorPainelDrinques();
  },

  desmarcarTodosDrinques() {
    const master = document.getElementById('chk-painel-marcar-todos');
    if (master) master.checked = false;
    this.toggleMarcarTodosDrinques(false);
  },

  filtrarDrinquesModal(termo) {
    const q = (termo || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.drinque-card-item');
    let visiveis = 0;
    cards.forEach((card) => {
      const busca = card.getAttribute('data-busca') || '';
      const match = !q || busca.includes(q);
      card.style.display = match ? 'flex' : 'none';
      if (match) visiveis++;
    });

    const vazioEl = document.getElementById('painel-drinques-vazio');
    if (vazioEl) {
      if (visiveis === 0) {
        vazioEl.classList.remove('hidden');
      } else {
        vazioEl.classList.add('hidden');
      }
    }
  },

  atualizarContadorPainelDrinques() {
    const allChks = Array.from(document.querySelectorAll('.drinque-card-chk'));
    const checkedChks = allChks.filter((c) => c.checked);
    const countEl = document.getElementById('painel-count-selecionados');
    const btnCountEl = document.getElementById('painel-btn-count-num');
    const masterChk = document.getElementById('chk-painel-marcar-todos');

    if (countEl) countEl.textContent = checkedChks.length;
    if (btnCountEl) btnCountEl.textContent = checkedChks.length;

    if (masterChk && allChks.length > 0) {
      masterChk.checked = checkedChks.length === allChks.length;
      masterChk.indeterminate = checkedChks.length > 0 && checkedChks.length < allChks.length;
    }
  },

  confirmarSelecaoPainelDrinques() {
    const checkboxes = Array.from(document.querySelectorAll('.drinque-card-chk:checked'));
    const idsSelecionados = checkboxes.map((cb) => cb.value);

    if (!this.propostaAtual) return;
    if (!Array.isArray(this.propostaAtual.coqueteis)) {
      this.propostaAtual.coqueteis = [];
    }

    if (idsSelecionados.length === 0 && this.propostaAtual.coqueteis.length > 0) {
      if (!confirm('Nenhum drinque foi marcado. Deseja remover todos os drinques do cardápio da proposta?')) {
        return;
      }
    }

    this.propostaAtual.coqueteis = idsSelecionados.map((drinqueId) => ({ drinqueId }));
    this.ordenarCoqueteisProposta();

    App.fecharModal();
    this.render();
    App.mostrarToast(`${idsSelecionados.length} drinque(s) configurado(s) na proposta em ordem alfabética!`);
  },

  ajustarQuantidadeInsumoCoquetel(insumoId, novoValor) {
    if (!this.propostaAtual) return;
    if (!this.propostaAtual.ajustesInsumosCoqueteis) {
      this.propostaAtual.ajustesInsumosCoqueteis = {};
    }

    if (novoValor === '' || novoValor === null || novoValor === undefined) {
      delete this.propostaAtual.ajustesInsumosCoqueteis[insumoId];
      this.render();
      return;
    }

    const num = Number(novoValor);
    if (!Number.isFinite(num) || num < 0) {
      App.mostrarToast('A quantidade do insumo não pode ser negativa ou inválida.', 'warning');
      this.render();
      return;
    }

    this.propostaAtual.ajustesInsumosCoqueteis[insumoId] = num;
    this.render();
  },

  atualizarFatorConsumoInsumo(insumoId, novoFator) {
    if (!this.propostaAtual) return;
    if (!this.propostaAtual.fatoresConsumoPersonalizados) {
      this.propostaAtual.fatoresConsumoPersonalizados = {};
    }

    const num = Number(novoFator);
    if (!Number.isFinite(num) || num <= 0) {
      App.mostrarToast('O fator de consumo por bartender deve ser maior que zero.', 'warning');
      this.render();
      return;
    }

    this.propostaAtual.fatoresConsumoPersonalizados[insumoId] = num;

    // Remove qualquer override manual antigo deste insumo para que o novo fator passe a valer imediatamente
    if (this.propostaAtual.ajustesInsumosCoqueteis && this.propostaAtual.ajustesInsumosCoqueteis[insumoId] !== undefined) {
      delete this.propostaAtual.ajustesInsumosCoqueteis[insumoId];
    }
    this.render();
    App.mostrarToast('Fator de consumo por bartender atualizado!');
  },

  restaurarFatorConsumoOriginal(insumoId) {
    if (!this.propostaAtual || !this.propostaAtual.fatoresConsumoPersonalizados) return;
    delete this.propostaAtual.fatoresConsumoPersonalizados[insumoId];
    if (this.propostaAtual.ajustesInsumosCoqueteis && this.propostaAtual.ajustesInsumosCoqueteis[insumoId] !== undefined) {
      delete this.propostaAtual.ajustesInsumosCoqueteis[insumoId];
    }
    this.render();
    App.mostrarToast('Fator restaurado para o padrão original da Aba 1.');
  },

  atualizarQtdBartenders(val) {
    if (!this.propostaAtual) return;
    const num = Number(val);
    const qtd = Number.isFinite(num) && num >= 1 ? Math.round(num) : 1;
    this.propostaAtual.qtdBartenders = qtd;

    // Sincroniza também no serviço de bartender da lista de serviços se houver
    if (this.propostaAtual.servicos) {
      const srvBartender = this.propostaAtual.servicos.find((s) => {
        const ref = (Store.state.servicos || []).find((x) => x.id === s.servicoId);
        return ref && (ref.descricao || '').toLowerCase().includes('bartender');
      });
      if (srvBartender) {
        srvBartender.quantidade = qtd;
      }
    }

    // Sincroniza o Gelo na tabela de periféricos pelo novo número de bartenders (30kg base 5h)
    this.recalcularGeloPorBartendersEDuracao();

    if (this.propostaAtual.id) {
      Store.recalcularUtensiliosPropostaPorBartenders(this.propostaAtual.id, qtd);
    }

    this.render();
  },

  resetarAjustesInsumos() {
    this.propostaAtual.ajustesInsumosCoqueteis = {};
    this.propostaAtual.fatoresConsumoPersonalizados = {};
    this.render();
    App.mostrarToast('Quantidades e fatores restaurados para os padrões operacionais.');
  },

  adicionarPeriferico() {
    const sel = document.getElementById('select-add-periferico');
    const qtdInput = document.getElementById('qtd-add-periferico');
    const insumoId = sel?.value;
    const qtdNum = Number(qtdInput?.value);

    if (!insumoId) {
      App.mostrarToast('Selecione um insumo periférico.', 'warning');
      return;
    }

    if (!Number.isFinite(qtdNum) || qtdNum <= 0) {
      App.mostrarToast('Informe uma quantidade maior que zero para o periférico.', 'warning');
      return;
    }

    const quantidade = qtdNum;
    const existente = this.propostaAtual.perifericos.find((p) => p.insumoId === insumoId);
    if (existente) {
      existente.quantidade = (Number(existente.quantidade) || 0) + quantidade;
    } else {
      this.propostaAtual.perifericos.push({ insumoId, quantidade });
    }
    this.render();
  },

  atualizarQtdPeriferico(idx, qtdRaw) {
    if (!this.propostaAtual?.perifericos?.[idx]) return;
    const qtd = Number(qtdRaw);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      App.mostrarToast('A quantidade do item periférico deve ser maior que zero.', 'warning');
      this.render();
      return;
    }
    this.propostaAtual.perifericos[idx].quantidade = qtd;
    this.render();
  },

  removerPeriferico(idx) {
    if (!this.propostaAtual?.perifericos) return;
    if (idx >= 0 && idx < this.propostaAtual.perifericos.length) {
      this.propostaAtual.perifericos.splice(idx, 1);
      this.render();
    }
  },

  sugerirPerifericosAutomatico() {
    const conv = Math.max(1, Number(this.propostaAtual.numConvidados) || 100);
    const qtdBartenders = Math.max(1, Number(this.propostaAtual.qtdBartenders) || 2);
    const duracaoHoras = Math.max(0.5, Number(this.propostaAtual.duracaoHoras) || 5);
    const fatorHoras = duracaoHoras / 5;
    const novosPerifericos = [];

    // Gelo: calculado pelo Fator por Bartender (30kg por bartender em 5h)
    const insGelo = Store.state.insumos.find(
      (i) => i.id === 'ins-gelo' || i.categoria === 'Gelo' || (i.descricao || '').toLowerCase().includes('gelo')
    );
    if (insGelo) {
      const fatorGelo = Number(insGelo.consumoPorBartender) || 30;
      const qtdGelo = Math.max(1, Math.round(qtdBartenders * fatorGelo * fatorHoras));
      novosPerifericos.push({ insumoId: insGelo.id, quantidade: qtdGelo });
    }

    // Canudo: ~3.5 por convidado
    const insCanudo = Store.state.insumos.find(
      (i) => i.id === 'ins-canudo' || (i.descricao || '').toLowerCase().includes('canudo')
    );
    if (insCanudo) {
      novosPerifericos.push({ insumoId: insCanudo.id, quantidade: Math.ceil((conv * 3.5) / 100) * 100 });
    }

    // Guardanapo: ~5 por convidado
    const insGuard = Store.state.insumos.find(
      (i) => i.id === 'ins-guardanapo' || (i.descricao || '').toLowerCase().includes('guardanapo')
    );
    if (insGuard) {
      novosPerifericos.push({ insumoId: insGuard.id, quantidade: Math.ceil((conv * 5) / 50) * 50 });
    }

    this.propostaAtual.perifericos = novosPerifericos;
    this.render();
    App.mostrarToast(`Gelo calculado por bartenders (${qtdBartenders} bar × 30kg) e descartáveis dimensionados!`);
  },

  adicionarServico() {
    const sel = document.getElementById('select-add-servico');
    const qtdInput = document.getElementById('qtd-add-servico');
    const servicoId = sel?.value;
    const qtdNum = Number(qtdInput?.value);

    if (!servicoId) {
      App.mostrarToast('Selecione um serviço para adicionar.', 'warning');
      return;
    }

    if (!Number.isFinite(qtdNum) || qtdNum < 1) {
      App.mostrarToast('Informe uma quantidade válida (mínimo 1) para o serviço.', 'warning');
      return;
    }

    const quantidade = Math.round(qtdNum);
    const srvRef = Store.state.servicos.find((s) => s.id === servicoId);
    const duracao = Math.max(0.5, Number(this.propostaAtual.duracaoHoras) || 5);

    let valorHora = 0;
    if (srvRef && Number(srvRef.valorHora) > 0) {
      valorHora = Number(srvRef.valorHora);
    } else if (srvRef && Number(srvRef.valorUnitario) > 0 && duracao > 0 && srvRef.categoria === 'Mão de Obra') {
      valorHora = Math.round((Number(srvRef.valorUnitario) / duracao) * 100) / 100;
    }

    let valUnit = 0;
    if (valorHora > 0 && duracao > 0) {
      valUnit = Math.round(duracao * valorHora * 100) / 100;
    } else if (srvRef) {
      valUnit = Number(srvRef.valorUnitario) || 0;
    }

    const existente = this.propostaAtual.servicos.find((s) => s.servicoId === servicoId);
    if (existente) {
      existente.quantidade = (Number(existente.quantidade) || 0) + quantidade;
      if (valorHora > 0 && (!existente.valorHora || Number(existente.valorHora) <= 0)) {
        existente.valorHora = valorHora;
        existente.valorUnitario = valUnit;
      }
    } else {
      this.propostaAtual.servicos.push({
        servicoId,
        quantidade,
        valorHora,
        valorUnitario: valUnit
      });
    }

    if (srvRef && (srvRef.descricao || '').toLowerCase().includes('bartender')) {
      const itemBart = this.propostaAtual.servicos.find((s) => s.servicoId === servicoId);
      if (itemBart) {
        this.propostaAtual.qtdBartenders = itemBart.quantidade;
        this.recalcularGeloPorBartendersEDuracao();
        if (this.propostaAtual.id) {
          Store.recalcularUtensiliosPropostaPorBartenders(this.propostaAtual.id, itemBart.quantidade);
        }
      }
    }

    this.render();
  },

  atualizarItemServico(idx, campo, valorRaw) {
    const item = this.propostaAtual?.servicos?.[idx];
    if (!item) return;

    const duracao = Math.max(0.5, Number(this.propostaAtual.duracaoHoras) || 5);
    const num = Number(valorRaw);

    if (campo === 'quantidade') {
      if (!Number.isFinite(num) || num < 1) {
        App.mostrarToast('A quantidade do serviço deve ser de pelo menos 1.', 'warning');
        this.render();
        return;
      }
      item.quantidade = Math.round(num);

      // Se editou a linha de Bartender, sincroniza qtdBartenders e Gelo
      const srvRef = (Store.state.servicos || []).find((s) => s.id === item.servicoId);
      if (srvRef && (srvRef.descricao || '').toLowerCase().includes('bartender')) {
        this.propostaAtual.qtdBartenders = item.quantidade;
        this.recalcularGeloPorBartendersEDuracao();
        if (this.propostaAtual.id) {
          Store.recalcularUtensiliosPropostaPorBartenders(this.propostaAtual.id, item.quantidade);
        }
      }
    } else if (campo === 'valorHora') {
      if (valorRaw === '' || valorRaw === null || valorRaw === undefined) {
        item.valorHora = 0;
      } else if (!Number.isFinite(num) || num < 0) {
        App.mostrarToast('O valor por hora do profissional não pode ser negativo.', 'warning');
        this.render();
        return;
      } else {
        item.valorHora = Math.round(num * 100) / 100;
        if (item.valorHora > 0) {
          item.valorUnitario = Math.round(duracao * item.valorHora * 100) / 100;
        }
      }
    } else if (campo === 'valorUnitario') {
      if (!Number.isFinite(num) || num < 0) {
        App.mostrarToast('O valor por profissional não pode ser negativo.', 'warning');
        this.render();
        return;
      }
      item.valorUnitario = Math.round(num * 100) / 100;
      // Ao editar o total do profissional, recalcula também a taxa por hora correspondente
      if (duracao > 0) {
        item.valorHora = Math.round((item.valorUnitario / duracao) * 100) / 100;
      }
    } else {
      item[campo] = valorRaw;
    }

    this.render();
  },

  removerServico(idx) {
    if (!this.propostaAtual?.servicos) return;
    if (idx >= 0 && idx < this.propostaAtual.servicos.length) {
      this.propostaAtual.servicos.splice(idx, 1);
      this.render();
    }
  },

  dimensionarEquipeAutomatico() {
    const conv = Math.max(1, Number(this.propostaAtual.numConvidados) || 100);
    const duracao = Math.max(0.5, Number(this.propostaAtual.duracaoHoras) || 5);
    const servicosDimensionados = [];
    let novoQtdBartenders = null;

    (Store.state.servicos || []).forEach((s) => {
      const regra = Number(s.convidadosPorUnidade) || 0;
      const qtdSugerida = regra > 0 ? Math.max(1, Math.ceil(conv / regra)) : 1;

      let valorHora = 0;
      if (Number(s.valorHora) > 0) {
        valorHora = Number(s.valorHora);
      } else if (Number(s.valorUnitario) > 0 && duracao > 0 && s.categoria === 'Mão de Obra') {
        valorHora = Math.round((Number(s.valorUnitario) / duracao) * 100) / 100;
      }

      let valUnit = 0;
      if (valorHora > 0 && duracao > 0) {
        valUnit = Math.round(duracao * valorHora * 100) / 100;
      } else {
        valUnit = Number(s.valorUnitario) || 0;
      }

      servicosDimensionados.push({
        servicoId: s.id,
        quantidade: qtdSugerida,
        valorHora,
        valorUnitario: valUnit
      });

      if ((s.descricao || '').toLowerCase().includes('bartender')) {
        novoQtdBartenders = qtdSugerida;
      }
    });

    this.propostaAtual.servicos = servicosDimensionados;
    if (novoQtdBartenders !== null) {
      this.propostaAtual.qtdBartenders = novoQtdBartenders;
      this.recalcularGeloPorBartendersEDuracao();
      if (this.propostaAtual.id) {
        Store.recalcularUtensiliosPropostaPorBartenders(this.propostaAtual.id, novoQtdBartenders);
      }
    }

    this.render();
    App.mostrarToast(`Equipe e estrutura dimensionadas automaticamente para ${conv} convidados (${duracao}h de evento)!`);
  },

  solicitarNovaProposta() {
    if (this.temConteudoRelevante()) {
      this.abrirModalConfirmacaoNovaProposta('__NOVA__');
    } else {
      this.executarCriacaoNovaProposta();
    }
  },

  criarNovaPropostaLimpa() {
    this.solicitarNovaProposta();
  },

  temConteudoRelevante(prop = this.propostaAtual) {
    if (!prop) return false;

    // Se for uma proposta já salva no histórico, verifica se houve modificações em relação ao Store
    if (prop.id) {
      const original = (Store.state.propostas || []).find((p) => p.id === prop.id);
      if (!original) return true;
      return JSON.stringify(prop) !== JSON.stringify(original);
    }

    // Se for uma proposta nova (ainda não salva no histórico):
    const temCoqueteis = Array.isArray(prop.coqueteis) && prop.coqueteis.length > 0;
    const temNome = Boolean(prop.nomeEvento && prop.nomeEvento.trim());
    const temCliente = Boolean(prop.clienteId);
    const temLocal = Boolean(prop.localEvento && prop.localEvento.trim());
    const temPerifericos = Array.isArray(prop.perifericos) && prop.perifericos.length > 0;
    const temServicos = Array.isArray(prop.servicos) && prop.servicos.length > 0;
    const temFatoresCustom =
      prop.fatoresConsumoPersonalizados && Object.keys(prop.fatoresConsumoPersonalizados).length > 0;
    const temAjustes =
      prop.ajustesInsumosCoqueteis && Object.keys(prop.ajustesInsumosCoqueteis).length > 0;

    return (
      temCoqueteis ||
      temNome ||
      temCliente ||
      temLocal ||
      temPerifericos ||
      temServicos ||
      temFatoresCustom ||
      temAjustes
    );
  },

  abrirModalConfirmacaoNovaProposta(destinoPropostaId = '__NOVA__') {
    const p = this.propostaAtual;
    const cli = (Store.state.clientes || []).find((c) => c.id === p?.clienteId);
    const nomeProposta = p?.nomeEvento || (cli ? `Evento de ${cli.nome}` : `Proposta ${p?.codigo || ''}`);
    const qtdCoq = p?.coqueteis?.length || 0;
    const consolidado = p ? Store.consolidarProposta(p) : { custoTotalEvento: 0 };
    const ehNovaProposta = destinoPropostaId === '__NOVA__';

    const html = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div class="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <i data-lucide="alert-triangle" class="w-5 h-5"></i>
              </div>
              <h3 class="font-bold text-base">Salvar Proposta em Andamento?</h3>
            </div>
            <button type="button" onclick="App.fecharModal()" class="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <p class="text-sm text-slate-700 leading-relaxed">
              Você possui dados montados na proposta atual <strong>"${nomeProposta}"</strong>.
            </p>

            <div class="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 space-y-1.5">
              <div class="flex justify-between">
                <span class="text-amber-800">Código:</span>
                <strong class="font-mono">${p?.codigo || '-'}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-amber-800">Cliente:</span>
                <strong>${cli ? cli.nome : 'Não selecionado'}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-amber-800">Coquetéis Selecionados:</span>
                <strong>${qtdCoq} coquetel(is)</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-amber-800">Convidados / Duração:</span>
                <strong>${p?.numConvidados || 100} conv. • ${p?.duracaoHoras || 6}h</strong>
              </div>
              <div class="flex justify-between pt-1 border-t border-amber-200/60 font-bold text-slate-900">
                <span>Custo Total Estimado:</span>
                <span>${Store.formatCurrency(consolidado.custoTotalEvento)}</span>
              </div>
            </div>

            <p class="text-xs text-slate-500 leading-relaxed">
              Para não perder o que você já montou, recomendamos salvá-la no Histórico antes de continuar:
            </p>

            <div class="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onclick="Aba5Propostas.salvarEContinuar('${destinoPropostaId}')"
                class="w-full btn-primary justify-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                <i data-lucide="save" class="w-4 h-4 mr-1.5"></i>
                <span>Salvar Atual no Histórico e ${ehNovaProposta ? 'Abrir Nova em Branco' : 'Trocar Proposta'}</span>
              </button>

              <button
                type="button"
                onclick="Aba5Propostas.descartarEContinuar('${destinoPropostaId}')"
                class="w-full btn-secondary justify-center py-2 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold text-xs"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5 mr-1.5 text-red-500"></i>
                <span>Descartar Alterações e Continuar</span>
              </button>

              <button
                type="button"
                onclick="App.fecharModal()"
                class="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1"
              >
                Permanecer na Proposta Atual (Cancelar)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(html);
  },

  salvarEContinuar(destinoId) {
    const ok = this.salvarPropostaAtual();
    if (!ok) return;
    App.fecharModal();
    if (destinoId === '__NOVA__') {
      this.executarCriacaoNovaProposta();
    } else {
      this.executarCarregarProposta(destinoId);
    }
  },

  descartarEContinuar(destinoId) {
    App.fecharModal();
    if (destinoId === '__NOVA__') {
      this.executarCriacaoNovaProposta();
    } else {
      this.executarCarregarProposta(destinoId);
    }
  },

  executarCriacaoNovaProposta() {
    this.propostaAtual = this.initPropostaVazia();
    this.modoVisualizacao = 'EDITOR';
    this.render();
    App.mostrarToast(`Formulário limpo pronto para a nova proposta ${this.propostaAtual.codigo}.`);
  },

  executarCarregarProposta(id) {
    const prop = Store.state.propostas.find((p) => p.id === id);
    if (prop) {
      this.propostaAtual = JSON.parse(JSON.stringify(prop));
      this.modoVisualizacao = 'EDITOR';
      this.render();
      App.mostrarToast(`Proposta ${prop.codigo} carregada com sucesso.`);
    }
  },

  carregarPropostaPorId(id) {
    if (id === '__NOVA__') {
      this.solicitarNovaProposta();
      return;
    }
    if (this.propostaAtual && this.propostaAtual.id === id) {
      return;
    }
    if (this.temConteudoRelevante()) {
      this.abrirModalConfirmacaoNovaProposta(id);
    } else {
      this.executarCarregarProposta(id);
    }
  },

  salvarPropostaAtual() {
    const p = this.propostaAtual;
    if (!p) return false;

    if (!p.clienteId) {
      App.mostrarToast('Por favor, selecione um cliente antes de salvar a proposta.', 'warning');
      return false;
    }

    // Se o nome do evento estiver vazio, gera automaticamente a partir do cliente ou código
    if (!p.nomeEvento || !p.nomeEvento.trim()) {
      const cli = (Store.state.clientes || []).find((c) => c.id === p.clienteId);
      if (cli && cli.nome) {
        p.nomeEvento = `Evento ${cli.nome.trim()}`;
      } else {
        p.nomeEvento = `Proposta ${p.codigo || 'Sem Código'}`;
      }
    } else {
      p.nomeEvento = p.nomeEvento.trim();
    }

    // Congelar permanentemente na proposta a escalação de todas as marcas em uso (protege histórico)
    if (!p.escalacaoBebidas || typeof p.escalacaoBebidas !== 'object') {
      p.escalacaoBebidas = {};
    }
    const insumos = Store.state.insumos || [];
    // Limpar marcas que pertençam a outra linha para não corromper a proposta salva
    Object.keys(p.escalacaoBebidas).forEach((grupo) => {
      const idAtual = p.escalacaoBebidas[grupo];
      const ins = insumos.find((i) => i.id === idAtual);
      if (ins && !ins.semLinha && ins.linha !== p.linhaInsumos) {
        delete p.escalacaoBebidas[grupo];
      }
    });

    const gruposUsados = Store.getGruposBebidasDosCoqueteis(p);
    gruposUsados.forEach((grupo) => {
      if (!p.escalacaoBebidas[grupo]) {
        const resolvido = Store.resolverInsumoPorLinha({ grupoGenerico: grupo }, p.linhaInsumos, p.escalacaoBebidas);
        if (resolvido && resolvido.id) {
          p.escalacaoBebidas[grupo] = resolvido.id;
        }
      }
    });

    this.sincronizarIntegridadePropostaAtual();
    const consolidadoAtual = Store.consolidarProposta(p);

    if (p.id) {
      const idx = Store.state.propostas.findIndex((item) => item.id === p.id);
      if (idx >= 0) {
        const anterior = Store.state.propostas[idx];
        Store.garantirHistoricoVersoesProposta(anterior);

        if (!Array.isArray(p.versoesNegociacao) || p.versoesNegociacao.length === 0) {
          p.versoesNegociacao = JSON.parse(JSON.stringify(anterior.versoesNegociacao || []));
          p.versaoAtivaId = anterior.versaoAtivaId;
        }

        // Verifica se houve mudança de valor ou configuração em relação à versão ativa anterior
        const consolidadoAnt = Store.consolidarProposta(anterior);
        const mudouNegociacao =
          Math.abs(consolidadoAtual.custoTotalEvento - consolidadoAnt.custoTotalEvento) > 0.5 ||
          p.linhaInsumos !== anterior.linhaInsumos ||
          Number(p.numConvidados) !== Number(anterior.numConvidados) ||
          Number(p.duracaoHoras) !== Number(anterior.duracaoHoras) ||
          Number(p.qtdBartenders) !== Number(anterior.qtdBartenders) ||
          (p.coqueteis || []).length !== (anterior.coqueteis || []).length;

        if (mudouNegociacao) {
          // Garante que a configuração anterior fique intacta no histórico e cria uma nova versão
          const proxNum = (p.versoesNegociacao.reduce((max, v) => Math.max(max, Number(v.numero) || 0), 0) || 1) + 1;
          const novaVerId = 'ver-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          p.versoesNegociacao.push({
            versaoId: novaVerId,
            numero: proxNum,
            rotulo: Store.gerarRotuloResumoVersao(p, proxNum),
            nota: `Revisão ${proxNum} (${new Date().toLocaleDateString('pt-BR')})`,
            criadoEm: new Date().toISOString(),
            valorTotalSnapshot: consolidadoAtual.custoTotalEvento,
            dados: Store.extrairSnapshotProposta(p)
          });
          p.versaoAtivaId = novaVerId;
        } else {
          // Atualiza os dados da versão ativa atual
          const verAtiva =
            p.versoesNegociacao.find((v) => v.versaoId === p.versaoAtivaId) ||
            p.versoesNegociacao[p.versoesNegociacao.length - 1];
          if (verAtiva) {
            verAtiva.rotulo = Store.gerarRotuloResumoVersao(p, verAtiva.numero || 1);
            verAtiva.valorTotalSnapshot = consolidadoAtual.custoTotalEvento;
            verAtiva.dados = Store.extrairSnapshotProposta(p);
            p.versaoAtivaId = verAtiva.versaoId;
          }
        }

        const copia = JSON.parse(JSON.stringify(p));
        // Preservar estado operacional de reserva de estoque gerenciado pela Aba 6
        if (anterior.estoqueBaixado !== undefined) copia.estoqueBaixado = anterior.estoqueBaixado;
        if (anterior.movimentacaoEstoque !== undefined) {
          copia.movimentacaoEstoque = JSON.parse(JSON.stringify(anterior.movimentacaoEstoque));
        }
        if ((!copia.timelineNegociacao || copia.timelineNegociacao.length === 0) && Array.isArray(anterior.timelineNegociacao)) {
          copia.timelineNegociacao = JSON.parse(JSON.stringify(anterior.timelineNegociacao));
        }
        if ((!copia.fluxoCaixa || copia.fluxoCaixa.length === 0) && Array.isArray(anterior.fluxoCaixa)) {
          copia.fluxoCaixa = JSON.parse(JSON.stringify(anterior.fluxoCaixa));
        }
        Store.state.propostas[idx] = copia;
      } else {
        Store.garantirHistoricoVersoesProposta(p);
        Store.state.propostas.unshift(JSON.parse(JSON.stringify(p)));
      }
    } else {
      p.id = 'prop-' + Date.now();
      p.estoqueBaixado = false;
      p.movimentacaoEstoque = {};
      p.versoesNegociacao = [];
      Store.garantirHistoricoVersoesProposta(p);
      Store.state.propostas.unshift(JSON.parse(JSON.stringify(p)));
      // Inicializa o checklist de utensílios com os itens e saldo do Acervo Global
      Store.importarUtensiliosGlobaisParaProposta(p.id, {
        dimensionarPorBartenders: true,
        modo: 'SUBSTITUIR'
      });
    }

    Store.save();
    this.render();
    const qtdVer = Array.isArray(p.versoesNegociacao) ? p.versoesNegociacao.length : 1;
    App.mostrarToast(
      qtdVer > 1
        ? `Proposta salva! Versão anterior mantida no histórico (${qtdVer} versões salvas nesta proposta).`
        : `Proposta "${p.nomeEvento}" (${p.codigo}) salva com sucesso!`
    );
    return true;
  },

  salvarComoNovaProposta() {
    const p = this.propostaAtual;
    if (!p) return false;

    p.id = null;
    p.codigo = Store.gerarProximoCodigoProposta();
    p.estoqueBaixado = false;
    p.movimentacaoEstoque = {};
    p.criadoEm = new Date().toISOString();

    return this.salvarPropostaAtual();
  },

  duplicarPropostaAtual() {
    if (!this.propostaAtual) return;
    if (!this.propostaAtual.id) {
      this.salvarPropostaAtual();
    }
    this.duplicarProposta(this.propostaAtual.id, true);
  },

  duplicarProposta(id, abrirLadoALado = true) {
    const prop = (Store.state.propostas || []).find((p) => p.id === id);
    if (!prop) return;

    const copia = JSON.parse(JSON.stringify(prop));
    copia.id = 'prop-' + Date.now();
    copia.codigo = Store.gerarProximoCodigoProposta();
    copia.nomeEvento = `Cópia de ${prop.nomeEvento || 'Proposta'}`;
    copia.status = 'Em Aberto';
    copia.estoqueBaixado = false;
    copia.movimentacaoEstoque = {};
    copia.criadoEm = new Date().toISOString();

    Store.state.propostas.unshift(copia);
    Store.save();

    // Copiar utensílios se houver
    const chk = Store.obterChecklistUtensilios(id);
    if (chk && Array.isArray(chk.itens)) {
      Store.state.checklistsUtensilios[copia.id] = JSON.parse(JSON.stringify(chk));
      Store.save();
    }

    this.propostaAtual = JSON.parse(JSON.stringify(copia));
    this.modoVisualizacao = 'EDITOR';
    this.render();

    if (abrirLadoALado && copia.clienteId) {
      this.abrirComparativoPropostasCliente(copia.clienteId);
      App.mostrarToast(`Proposta duplicada (${copia.codigo})! Exibindo opções lado a lado.`);
    } else {
      App.mostrarToast(`Proposta duplicada com sucesso como "${copia.codigo}"!`);
    }
  },

  alternarModoVisualizacao(modo) {
    this.modoVisualizacao = modo;
    this.render();
  },

  setFiltroBusca(val) {
    this.filtroBuscaLista = val;
    const wrapper = document.getElementById('tabela-propostas-wrapper');
    if (wrapper) {
      const propostasSalvas = Store.state.propostas || [];
      const clientes = Store.state.clientes || [];
      wrapper.innerHTML = this.renderCorpoTabelaListaHtml(propostasSalvas, clientes, this.propostaAtual);
      if (window.lucide) window.lucide.createIcons();
    } else {
      this.render();
    }
  },

  setFiltroStatus(st) {
    this.filtroStatusLista = st;
    this.render();
  },

  abrirParaEdicao(id) {
    const prop = (Store.state.propostas || []).find((p) => p.id === id);
    if (!prop) return;
    this.propostaAtual = JSON.parse(JSON.stringify(prop));
    this.modoVisualizacao = 'EDITOR';
    if (window.App && window.App.abaAtiva !== 'propostas') {
      window.App.navegarPara('propostas');
    } else {
      this.render();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  exportarPdfPorId(id) {
    const prop = (Store.state.propostas || []).find((p) => p.id === id);
    if (!prop) return;
    if (window.PdfGenerator) {
      window.PdfGenerator.exportarPropostaCliente(prop);
    }
  },

  irParaChecklistPorId(id) {
    if (window.Aba6Checklist) {
      window.Aba6Checklist.propostaSelecionadaId = id;
    }
    App.navegarPara('checklist');
  },

  formatarDataBR(dataStr) {
    if (!dataStr) return '-';
    const partes = String(dataStr).split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  },

  renderListaHtml(propostasSalvas, clientes, propostaAtual) {
    const st = this.filtroStatusLista || 'TODOS';

    const totalAbertas = propostasSalvas.filter((p) => (p.status || 'Em Aberto') === 'Em Aberto').length;
    const totalAprovadas = propostasSalvas.filter((p) => p.status === 'Aprovada').length;
    const totalRealizadas = propostasSalvas.filter((p) => p.status === 'Realizada').length;

    return `
      <!-- Cabeçalho da Lista de Propostas -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <div class="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <i data-lucide="folder-kanban" class="w-4 h-4"></i>
            <span>Módulo 05 • Gestão e Histórico Comercial</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Histórico de Propostas & Eventos</h1>
          <p class="text-sm text-slate-500 mt-0.5">Gerencie todos os orçamentos criados, acompanhe status de negociação, duplique para novos eventos ou edite.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          ${
            propostaAtual
              ? `
            <button
              type="button"
              onclick="Aba5Propostas.alternarModoVisualizacao('EDITOR')"
              class="btn-secondary text-xs py-2 px-3.5 border-blue-200 text-blue-700 bg-blue-50/70 hover:bg-blue-100 font-bold"
            >
              <i data-lucide="edit-3" class="w-4 h-4 text-blue-600"></i>
              <span>Voltar ao Editor (${propostaAtual.codigo || 'Proposta'})</span>
            </button>
          `
              : ''
          }

          <button
            type="button"
            onclick="Aba5Propostas.solicitarNovaProposta()"
            class="btn-primary text-xs py-2 px-4 shadow-sm font-bold flex items-center gap-1.5"
          >
            <i data-lucide="file-plus" class="w-4 h-4"></i>
            <span>Nova Proposta em Branco</span>
          </button>
        </div>
      </div>

      <!-- Barra de Abas / Modos de Visualização -->
      <div class="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
        <button
          type="button"
          onclick="Aba5Propostas.alternarModoVisualizacao('LISTA')"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-xs"
        >
          <i data-lucide="layout-list" class="w-4 h-4"></i>
          <span>Todas as Propostas Salvas (${propostasSalvas.length})</span>
        </button>

        <button
          type="button"
          onclick="Aba5Propostas.alternarModoVisualizacao('EDITOR')"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          <i data-lucide="file-pen" class="w-4 h-4"></i>
          <span>Editor da Proposta ${propostaAtual?.codigo ? `(${propostaAtual.codigo})` : ''}</span>
        </button>
      </div>

      <!-- Cartões Resumo / KPIs -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div class="text-xs font-semibold text-slate-500">Total de Propostas</div>
          <div class="text-2xl font-bold text-slate-900 mt-1">${propostasSalvas.length}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">no histórico local</div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div class="text-xs font-semibold text-blue-600">Em Aberto / Negociação</div>
          <div class="text-2xl font-bold text-blue-700 mt-1">${totalAbertas}</div>
          <div class="text-[11px] text-blue-500 mt-0.5">aguardando aprovação</div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div class="text-xs font-semibold text-emerald-600">Aprovadas</div>
          <div class="text-2xl font-bold text-emerald-700 mt-1">${totalAprovadas}</div>
          <div class="text-[11px] text-emerald-500 mt-0.5">fechadas pelo cliente</div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div class="text-xs font-semibold text-indigo-600">Realizadas</div>
          <div class="text-2xl font-bold text-indigo-700 mt-1">${totalRealizadas}</div>
          <div class="text-[11px] text-indigo-500 mt-0.5">eventos concluídos</div>
        </div>
      </div>

      <!-- Filtros e Busca -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="relative flex-1 max-w-md">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input
            id="input-busca-propostas-lista"
            type="text"
            value="${this.filtroBuscaLista || ''}"
            oninput="Aba5Propostas.setFiltroBusca(this.value)"
            placeholder="Buscar por nome do evento, cliente ou código..."
            class="input-minimal pl-9 text-xs py-2 w-full"
          />
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          ${['TODOS', 'Em Aberto', 'Em Negociação', 'Aprovada', 'Realizada', 'Cancelada']
            .map((statusOp) => {
              const ativo = st === statusOp;
              const rotulo = statusOp === 'TODOS' ? 'Todas' : statusOp;
              return `
                <button
                  type="button"
                  onclick="Aba5Propostas.setFiltroStatus('${statusOp}')"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    ativo
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }"
                >
                  ${rotulo}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Tabela / Cards de Propostas -->
      <div id="tabela-propostas-wrapper" class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        ${this.renderCorpoTabelaListaHtml(propostasSalvas, clientes, propostaAtual)}
      </div>
    `;
  },

  renderCorpoTabelaListaHtml(propostasSalvas, clientes, propostaAtual) {
    const q = (this.filtroBuscaLista || '').toLowerCase().trim();
    const st = this.filtroStatusLista || 'TODOS';

    const filtradas = propostasSalvas.filter((p) => {
      const matchStatus = st === 'TODOS' || (p.status || 'Em Aberto') === st;
      if (!matchStatus) return false;
      if (!q) return true;

      const cli = clientes.find((c) => c.id === p.clienteId);
      const str = `${p.codigo || ''} ${p.nomeEvento || ''} ${cli?.nome || ''} ${p.localEvento || ''}`.toLowerCase();
      return str.includes(q);
    });

    if (filtradas.length === 0) {
      return `
        <div class="py-12 px-4 text-center">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <i data-lucide="folder-search" class="w-6 h-6"></i>
          </div>
          <h3 class="text-sm font-bold text-slate-800">Nenhuma proposta encontrada</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            ${
              propostasSalvas.length === 0
                ? 'Você ainda não possui propostas salvas no histórico. Clique abaixo para criar a primeira!'
                : 'Nenhuma proposta corresponde aos filtros de busca selecionados.'
            }
          </p>
          <div class="mt-4">
            <button
              type="button"
              onclick="Aba5Propostas.solicitarNovaProposta()"
              class="btn-primary text-xs py-2 px-4 font-bold"
            >
              <i data-lucide="plus" class="w-4 h-4 mr-1"></i>
              <span>Criar Nova Proposta em Branco</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse table-clean text-xs">
          <thead>
            <tr>
              <th class="w-32">Código / Data</th>
              <th>Evento / Cliente</th>
              <th>Configuração do Evento</th>
              <th>Coquetéis</th>
              <th class="text-right">Custo Estimado</th>
              <th class="text-center w-28">Status</th>
              <th class="text-right w-44">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${filtradas
              .map((prop) => {
                const cli = clientes.find((c) => c.id === prop.clienteId);
                const consolidado = Store.consolidarProposta(prop);
                const isAtivaNoEditor = propostaAtual && propostaAtual.id === prop.id;
                const statusClass =
                  prop.status === 'Aprovada'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : prop.status === 'Em Negociação'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : prop.status === 'Cancelada'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : prop.status === 'Realizada'
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300';

                return `
                  <tr class="hover:bg-slate-50/80 transition-colors ${
                    isAtivaNoEditor ? 'bg-blue-50/30' : ''
                  }">
                    <td>
                      <div class="font-mono font-bold text-blue-700 text-xs">${prop.codigo || '-'}</div>
                      <div class="text-[11px] text-slate-500 mt-0.5">${Aba5Propostas.formatarDataBR(prop.dataEvento)}</div>
                      ${
                        isAtivaNoEditor
                          ? '<span class="inline-block mt-1 text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">Em Edição</span>'
                          : ''
                      }
                    </td>
                    <td>
                      <div class="font-bold text-slate-900 text-sm">${prop.nomeEvento || 'Sem Nome'}</div>
                      <div class="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                        <i data-lucide="user" class="w-3 h-3 text-slate-400"></i>
                        <span>${cli ? cli.nome : 'Sem cliente'}</span>
                        ${cli?.contato ? `<span class="text-slate-400">• ${cli.contato}</span>` : ''}
                      </div>
                    </td>
                    <td class="text-slate-600">
                      <div><strong>${prop.numConvidados || 100}</strong> conv. • <strong>${prop.duracaoHoras || 6}h</strong> de evento</div>
                      <div class="text-slate-400 text-[11px] mt-0.5">${prop.qtdBartenders || 2} bar • Linha ${prop.linhaInsumos || 'A'}</div>
                    </td>
                    <td>
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        🍸 ${(prop.coqueteis || []).length} selecionado(s)
                      </span>
                    </td>
                    <td class="text-right font-mono font-bold text-slate-900 text-sm">
                      ${Store.formatCurrency(consolidado.custoTotalEvento)}
                    </td>
                    <td class="text-center">
                      <span class="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusClass}">
                        ${prop.status || 'Em Aberto'}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onclick="Aba5Propostas.abrirParaEdicao('${prop.id}')"
                          class="btn-secondary py-1 px-2 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 font-bold"
                          title="Abrir no Editor"
                        >
                          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onclick="Aba5Propostas.duplicarProposta('${prop.id}')"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Duplicar proposta como nova"
                        >
                          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        </button>

                        <button
                          type="button"
                          onclick="Aba5Propostas.exportarPdfPorId('${prop.id}')"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Exportar PDF para o Cliente"
                        >
                          <i data-lucide="file-down" class="w-3.5 h-3.5"></i>
                        </button>

                        <button
                          type="button"
                          onclick="Aba5Propostas.irParaChecklistPorId('${prop.id}')"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          title="Abrir Checklist & Compras deste evento"
                        >
                          <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
                        </button>

                        <button
                          type="button"
                          onclick="Aba5Propostas.excluirPropostaSalva('${prop.id}')"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Excluir proposta"
                        >
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  excluirPropostaSalva(id) {
    const prop = Store.state.propostas.find((p) => p.id === id);
    if (!prop) return;

    const avisoEstoque = prop.estoqueBaixado
      ? '\n\nNota: Os insumos reservados no estoque para este evento serão estornados automaticamente para a Aba 1.'
      : '';
    if (!confirm(`Deseja realmente excluir a proposta "${prop.nomeEvento}" (${prop.codigo}) do histórico? Esta ação é irreversível.${avisoEstoque}`)) return;

    Store.excluirPropostaComIntegridade(id);
    if (this.propostaAtual && this.propostaAtual.id === id) {
      this.propostaAtual = Store.state.propostas[0]
        ? JSON.parse(JSON.stringify(Store.state.propostas[0]))
        : this.initPropostaVazia();
    }
    this.render();
    App.mostrarToast(`Proposta "${prop.nomeEvento}" (${prop.codigo}) excluída com sucesso.`);
  },

  exportarPdfCliente() {
    if (!this.propostaAtual) return;
    if (!this.propostaAtual.nomeEvento || !this.propostaAtual.nomeEvento.trim()) {
      this.propostaAtual.nomeEvento = 'Proposta de Coquetelaria & Bar';
    }
    this.salvarPropostaAtual();
    if (window.PdfGenerator) {
      window.PdfGenerator.exportarPropostaCliente(this.propostaAtual);
    }
  },

  irParaChecklistDestaProposta() {
    const ok = this.salvarPropostaAtual();
    if (!ok) return;
    if (window.Aba6Checklist) {
      window.Aba6Checklist.propostaSelecionadaId = this.propostaAtual.id;
    }
    App.navegarPara('checklist');
  },

  abrirComparativoPropostasCliente(clienteId) {
    if (!clienteId) return;
    const cliente = (Store.state.clientes || []).find((c) => c.id === clienteId);
    if (!cliente) {
      App.mostrarToast('Cliente não encontrado.', 'error');
      return;
    }

    const propostas = (Store.state.propostas || []).filter((p) => p.clienteId === clienteId);

    if (propostas.length === 0) {
      const modalHtml = `
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center animate-fade-in border border-slate-200">
            <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4 border border-blue-100 shadow-2xs">
              <i data-lucide="folder-search" class="w-7 h-7"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-900">Nenhuma Proposta Encontrada</h3>
            <p class="text-xs text-slate-500 mt-1 mb-5">
              O cliente <strong class="text-slate-800 font-semibold">${cliente.nome}</strong> ainda não possui propostas salvas no histórico.
            </p>
            <div class="flex items-center justify-center gap-2">
              <button type="button" onclick="App.fecharModal()" class="btn-secondary text-xs py-2 px-4">Fechar</button>
              <button
                type="button"
                onclick="Aba5Propostas.solicitarNovaPropostaParaCliente('${cliente.id}')"
                class="btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5"
              >
                <i data-lucide="file-plus" class="w-4 h-4"></i>
                <span>Criar Proposta Agora</span>
              </button>
            </div>
          </div>
        </div>
      `;
      App.abrirModal(modalHtml);
      return;
    }

    const numCols =
      propostas.length === 1
        ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
        : propostas.length === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : propostas.length === 3
        ? 'grid-cols-1 md:grid-cols-3'
        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';

    const cardsHtml = propostas
      .map((prop, idx) => {
        const consolidado = Store.consolidarProposta(prop);
        const isAtivaNoEditor = this.propostaAtual && this.propostaAtual.id === prop.id;
        const custoPorConvidado = consolidado.custoTotalEvento / (prop.numConvidados || 1);
        const statusClass =
          prop.status === 'Aprovada'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : prop.status === 'Em Negociação'
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : prop.status === 'Cancelada'
            ? 'bg-red-50 text-red-700 border-red-200'
            : prop.status === 'Realizada'
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : 'bg-blue-50 text-blue-700 border-blue-200';

        const coqueteisNomes = (prop.coqueteis || []).map((c) => {
          const dr = (Store.state.drinques || []).find((d) => d.id === c.drinqueId);
          return dr ? dr.nome : 'Drinque';
        });

        return `
          <div class="bg-white border-2 ${
            isAtivaNoEditor
              ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
              : 'border-slate-200 hover:border-slate-300 shadow-sm'
          } rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition min-w-[280px]">
            
            <!-- Topo do Card -->
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                  ${prop.codigo || 'PROP'}
                </span>
                <select
                  onchange="Aba5Propostas.alterarStatusPropostaDireto('${prop.id}', this.value, '${cliente.id}')"
                  class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-none ${statusClass}"
                  title="Alterar status desta proposta no Funil e CRM"
                >
                  ${['Em Aberto', 'Em Negociação', 'Aprovada', 'Realizada', 'Cancelada']
                    .map((st) => `<option value="${st}" ${(prop.status || 'Em Aberto') === st ? 'selected' : ''}>${st}</option>`)
                    .join('')}
                </select>
              </div>

              <div class="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <span class="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Opção ${idx + 1}</span>
                ${
                  isAtivaNoEditor
                    ? '<span class="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">Em Edição</span>'
                    : ''
                }
              </div>

              <h4 class="font-bold text-slate-900 text-base leading-tight mb-1" title="${prop.nomeEvento || 'Sem Nome'}">
                ${prop.nomeEvento || 'Sem Nome do Evento'}
              </h4>

              <div class="text-xs text-slate-500 flex items-center gap-1 mb-3">
                <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>${Aba5Propostas.formatarDataBR(prop.dataEvento)} • ${prop.duracaoHoras || 5}h de evento</span>
              </div>

              <!-- Box Valor Total -->
              <div class="bg-slate-900 text-white rounded-xl p-3.5 my-3 shadow-inner">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custo Total</span>
                  <span class="text-xl font-black text-blue-300 font-mono">${Store.formatCurrency(
                    consolidado.custoTotalEvento
                  )}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-slate-400 mt-1 pt-1.5 border-t border-slate-800">
                  <span>Por Convidado (${prop.numConvidados || 100} conv.):</span>
                  <span class="font-bold text-slate-200 font-mono">${Store.formatCurrency(custoPorConvidado)}</span>
                </div>
              </div>

              <!-- Especificações -->
              <div class="space-y-1.5 text-xs py-2 border-b border-slate-100">
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">Linha de Bebidas:</span>
                  <span class="font-bold px-2 py-0.5 rounded text-[11px] ${
                    prop.linhaInsumos === 'A'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : prop.linhaInsumos === 'C'
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }">Linha ${prop.linhaInsumos || 'A'} (${
          prop.linhaInsumos === 'A' ? 'Premium' : prop.linhaInsumos === 'C' ? 'Econômica' : 'Padrão'
        })</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">Equipe de Bar:</span>
                  <span class="font-semibold text-slate-800">${consolidado.qtdBartenders || 2} bartenders</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">Insumos (Bebidas + Periféricos):</span>
                  <span class="font-semibold text-slate-800 font-mono">${Store.formatCurrency(
                    consolidado.custoTotalInsumos
                  )}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-500">Serviços / Equipe:</span>
                  <span class="font-semibold text-slate-800 font-mono">${Store.formatCurrency(
                    consolidado.custoTotalServicos
                  )}</span>
                </div>
              </div>

              <!-- Coquetéis -->
              <div class="my-3">
                <div class="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>🍸 Coquetéis (${coqueteisNomes.length}):</span>
                </div>
                <div class="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                  ${
                    coqueteisNomes.length === 0
                      ? '<span class="text-slate-400 italic text-[11px]">Nenhum coquetel adicionado</span>'
                      : coqueteisNomes
                          .map(
                            (nome) =>
                              `<span class="inline-block bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200">${nome}</span>`
                          )
                          .join('')
                  }
                </div>
              </div>
            </div>

            <!-- Botões de Ação do Card -->
            <div class="space-y-1.5 pt-3 border-t border-slate-100 mt-3">
              <button
                type="button"
                onclick="Aba5Propostas.abrirParaEdicao('${prop.id}'); App.fecharModal();"
                class="w-full btn-primary justify-center py-2 text-xs font-bold shadow-xs flex items-center gap-1.5"
                title="Abrir esta proposta no editor para personalizar"
              >
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                <span>${isAtivaNoEditor ? 'Continuar Editando' : 'Abrir no Editor'}</span>
              </button>

              <div class="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onclick="Aba5Propostas.duplicarProposta('${prop.id}', true)"
                  class="btn-secondary justify-center py-1.5 px-2 text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50"
                  title="Duplicar proposta para criar outra opção lado a lado"
                >
                  <i data-lucide="copy" class="w-3.5 h-3.5 text-blue-600 mr-1"></i>
                  <span>Duplicar</span>
                </button>

                <button
                  type="button"
                  onclick="Aba5Propostas.exportarPdfPorId('${prop.id}')"
                  class="btn-secondary justify-center py-1.5 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  title="Exportar PDF desta proposta para o cliente"
                >
                  <i data-lucide="file-down" class="w-3.5 h-3.5 text-slate-600 mr-1"></i>
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onclick="Aba5Propostas.excluirPropostaDoComparativo('${prop.id}', '${cliente.id}')"
                  class="btn-secondary justify-center py-1.5 px-2 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:border-red-200"
                  title="Excluir esta proposta"
                >
                  <i data-lucide="trash-2" class="w-3.5 h-3.5 mr-1"></i>
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    const modalHtml = `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div class="bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in my-auto">
          <!-- Cabeçalho do Modal -->
          <div class="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0">
            <div>
              <div class="flex items-center gap-1.5 text-blue-700 text-xs font-bold uppercase tracking-wider mb-0.5">
                <i data-lucide="columns-2" class="w-4 h-4"></i>
                <span>Comparativo de Propostas • Visão Lado a Lado</span>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-xl font-black text-slate-900">${cliente.nome}</h3>
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  ${propostas.length} ${propostas.length === 1 ? 'proposta' : 'propostas registradas'}
                </span>
                ${
                  cliente.contato
                    ? `<span class="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <i data-lucide="phone" class="w-3 h-3 text-slate-400"></i>
                        <span>${cliente.contato}</span>
                      </span>`
                    : ''
                }
              </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              ${
                propostas.length > 1
                  ? `<button
                      type="button"
                      onclick="Aba5Propostas.unificarPropostasDoCliente('${cliente.id}')"
                      class="btn-secondary text-xs py-2 px-3 font-bold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 flex items-center gap-1.5"
                      title="Juntar estas propostas em 1 único card no Funil mantendo todas como versões (v1, v2...) no histórico da mesma proposta"
                    >
                      <i data-lucide="git-merge" class="w-4 h-4 text-indigo-600"></i>
                      <span>Unificar em 1 Proposta c/ Histórico (v1, v2...)</span>
                    </button>`
                  : ''
              }
              <button
                type="button"
                onclick="Aba5Propostas.solicitarNovaPropostaParaCliente('${cliente.id}')"
                class="btn-secondary text-xs py-2 px-3 font-bold text-blue-700 border-blue-200 hover:bg-blue-50 flex items-center gap-1.5"
                title="Criar uma nova proposta separada para outro evento deste cliente"
              >
                <i data-lucide="file-plus" class="w-4 h-4 text-blue-600"></i>
                <span>+ Nova Proposta (Outro Evento)</span>
              </button>
              <button
                type="button"
                onclick="App.fecharModal()"
                class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                title="Fechar comparativo"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Conteúdo: Cards Lado a Lado -->
          <div class="p-5 overflow-x-auto overflow-y-auto flex-1">
            <div class="grid ${numCols} gap-5 items-stretch">
              ${cardsHtml}

              <!-- Card para Adicionar Nova Opção Lado a Lado -->
              <div class="border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-white/60 bg-white/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition min-h-[350px]">
                <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100 shadow-2xs">
                  <i data-lucide="copy-plus" class="w-6 h-6"></i>
                </div>
                <h4 class="font-bold text-slate-800 text-sm mb-1">Criar Mais Uma Opção</h4>
                <p class="text-xs text-slate-500 max-w-xs mb-4">
                  Duplique uma das opções existentes ou inicie uma nova para comparar valores e coquetéis lado a lado.
                </p>
                <div class="space-y-2 w-full max-w-xs">
                  ${
                    propostas.length > 0
                      ? `<button
                          type="button"
                          onclick="Aba5Propostas.duplicarProposta('${propostas[0].id}', true)"
                          class="w-full btn-secondary justify-center text-xs py-2 font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 shadow-2xs"
                        >
                          <i data-lucide="copy" class="w-3.5 h-3.5 text-blue-600 mr-1.5"></i>
                          <span>Duplicar Última Opção</span>
                        </button>`
                      : ''
                  }
                  <button
                    type="button"
                    onclick="Aba5Propostas.solicitarNovaPropostaParaCliente('${cliente.id}')"
                    class="w-full btn-primary justify-center text-xs py-2 font-bold shadow-xs"
                  >
                    <i data-lucide="plus" class="w-3.5 h-3.5 mr-1.5"></i>
                    <span>Nova em Branco</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Rodapé do Modal -->
          <div class="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>Dica: Clique em <strong>Abrir no Editor</strong> em qualquer opção para personalizar as marcas, coquetéis ou convidados.</span>
            <button type="button" onclick="App.fecharModal()" class="btn-secondary text-xs py-1.5 px-4 font-semibold">
              Fechar
            </button>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
  },

  excluirPropostaDoComparativo(id, clienteId) {
    const prop = Store.state.propostas.find((p) => p.id === id);
    if (!prop) return;

    if (!confirm(`Deseja realmente excluir a proposta "${prop.nomeEvento}" (${prop.codigo})? Esta ação é irreversível.`)) return;

    Store.excluirPropostaComIntegridade(id);
    if (this.propostaAtual && this.propostaAtual.id === id) {
      this.propostaAtual = Store.state.propostas[0]
        ? JSON.parse(JSON.stringify(Store.state.propostas[0]))
        : this.initPropostaVazia();
    }
    
    // Se o cliente ainda tem propostas, reabre o modal de comparativo atualizado
    const restantes = (Store.state.propostas || []).filter((p) => p.clienteId === clienteId);
    if (restantes.length > 0) {
      this.abrirComparativoPropostasCliente(clienteId);
    } else {
      App.fecharModal();
    }

    if (window.Aba4Clientes && App.abaAtiva === 'clientes') {
      window.Aba4Clientes.render();
    }
    App.mostrarToast(`Proposta "${prop.nomeEvento}" (${prop.codigo}) excluída com sucesso.`);
  },

  solicitarNovaPropostaParaCliente(clienteId) {
    App.fecharModal();
    const cli = (Store.state.clientes || []).find((c) => c.id === clienteId);
    this.propostaAtual = this.initPropostaVazia();
    if (cli) {
      this.propostaAtual.clienteId = cli.id;
      this.propostaAtual.nomeEvento = `Evento ${cli.nome.trim()}`;
    }
    this.modoVisualizacao = 'EDITOR';
    if (App.abaAtiva !== 'propostas') {
      App.navegarPara('propostas');
    } else {
      this.render();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    App.mostrarToast(`Nova proposta iniciada para ${cli ? cli.nome : 'o cliente'}!`);
  },

  abrirModalRendimentoFruta(sucoId) {
    if (window.App && window.App.abrirModalRendimentoFruta) {
      window.App.abrirModalRendimentoFruta(sucoId);
    }
  },

  // =========================================================================
  // HISTÓRICO DE VERSÕES DA MESMA PROPOSTA (v1, v2, v3... SEM DUPLICAR NO FUNIL)
  // =========================================================================

  renderBarraVersoesNegociacao(p, clienteObj) {
    if (!p) return '';
    Store.garantirHistoricoVersoesProposta(p);
    const versoes = Array.isArray(p.versoesNegociacao) ? p.versoesNegociacao : [];
    const propostasMesmoCliente = clienteObj
      ? (Store.state.propostas || []).filter((prop) => prop.clienteId === clienteObj.id)
      : [];

    const versaoAtivaId = p.versaoAtivaId || (versoes[versoes.length - 1] && versoes[versoes.length - 1].versaoId);

    return `
      <div class="bg-white border-2 border-indigo-200/90 rounded-2xl p-3.5 sm:p-4 mb-5 shadow-2xs">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <!-- Título e Explicação -->
          <div class="flex items-start sm:items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-black">
              <i data-lucide="history" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-black uppercase tracking-wider text-indigo-800">
                  Histórico de Versões desta Negociação (Mesmo Evento)
                </span>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  ${versoes.length} ${versoes.length === 1 ? 'versão salva' : 'versões salvas'}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Clique em qualquer versão abaixo para <strong>voltar imediatamente</strong> aos valores, convidados e drinques daquela negociação sem perder as demais.
              </p>
            </div>
          </div>

          <!-- Botões de Ação de Versão -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onclick="Aba5Propostas.criarNovaVersaoDestaProposta(false)"
              class="btn-secondary text-xs py-1.5 px-3 font-bold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer"
              title="Congelar a configuração atual no histórico e abrir uma nova versão (v${versoes.length + 1}) dentro desta mesma proposta"
            >
              <i data-lucide="git-branch-plus" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>+ Nova Versão (v${versoes.length + 1})</span>
            </button>

            ${
              versoes.length > 0
                ? `<button
                    type="button"
                    onclick="Aba5Propostas.abrirModalComparativoVersoes()"
                    class="btn-secondary text-xs py-1.5 px-3 font-bold text-slate-700 border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                    title="Comparar todas as versões desta proposta lado a lado"
                  >
                    <i data-lucide="columns-2" class="w-3.5 h-3.5 text-indigo-600"></i>
                    <span>Comparar Versões (${versoes.length})</span>
                  </button>`
                : ''
            }
          </div>
        </div>

        <!-- Pílulas das Versões (v1, v2, v3...) -->
        ${
          versoes.length > 0
            ? `
          <div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1" style="scrollbar-width: thin;">
            ${versoes
              .map((ver, idx) => {
                const isAtiva = ver.versaoId === versaoAtivaId;
                const numVer = ver.numero || idx + 1;
                const d = ver.dados || {};
                const conv = Number(d.numConvidados) || Number(p.numConvidados) || 0;
                const lin = d.linhaInsumos || d.linhaSelecionada || p.linhaInsumos || 'A';
                const valorCalculado = Number(ver.valorTotalSnapshot) || (ver.dados ? Store.consolidarProposta({ ...p, ...ver.dados }).custoTotalEvento : 0);
                const dataCriacaoCurta = ver.criadoEm
                  ? new Date(ver.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  : '';

                return `
                  <div class="inline-flex items-center rounded-xl border transition-all shrink-0 ${
                    isAtiva
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200'
                      : 'bg-slate-50 hover:bg-indigo-50/70 text-slate-700 border-slate-200 hover:border-indigo-300'
                  }">
                    <button
                      type="button"
                      onclick="Aba5Propostas.ativarVersaoProposta('${ver.versaoId}', false)"
                      class="px-3 py-2 text-left flex items-center gap-2.5 cursor-pointer"
                      title="${isAtiva ? 'Versão ativa no momento' : `Clique para restaurar a Versão v${numVer} (${Store.formatCurrency(valorCalculado)})`}"
                    >
                      <span class="px-1.5 py-0.5 rounded-md text-[11px] font-black uppercase ${
                        isAtiva ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                      }">
                        v${numVer}
                      </span>
                      <div class="leading-tight">
                        <div class="text-xs font-extrabold flex items-center gap-1.5">
                          <span class="font-mono">${Store.formatCurrency(valorCalculado)}</span>
                          ${
                            isAtiva
                              ? `<span class="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-400/30 text-emerald-100 border border-emerald-300/40">Ativa</span>`
                              : ''
                          }
                        </div>
                        <div class="text-[10px] ${isAtiva ? 'text-indigo-100' : 'text-slate-500'}">
                          Linha ${lin} • ${conv} conv.${dataCriacaoCurta ? ` • ${dataCriacaoCurta}` : ''}
                        </div>
                      </div>
                    </button>
                  </div>
                `;
              })
              .join('')}
          </div>
        `
            : ''
        }

        <!-- Alerta se o cliente já tinha múltiplas propostas separadas cadastradas antes -->
        ${
          propostasMesmoCliente.length > 1
            ? `
          <div class="mt-3 pt-2.5 border-t border-amber-200/80 bg-amber-50/80 -mx-3.5 -mb-3.5 sm:-mx-4 sm:-mb-4 px-4 py-2.5 rounded-b-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div class="flex items-center gap-2 text-xs text-amber-900">
              <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span>
                <strong>${clienteObj.nome}</strong> possui <strong>${propostasMesmoCliente.length} propostas separadas</strong> no sistema. Se forem negociações do <strong>mesmo evento</strong>, unifique-as em 1 única proposta com histórico (v1, v2...) para não duplicar no Funil:
              </span>
            </div>
            <button
              type="button"
              onclick="Aba5Propostas.unificarPropostasDoCliente('${clienteObj.id}')"
              class="btn-secondary text-xs py-1.5 px-3 font-extrabold text-indigo-800 bg-white border-indigo-300 hover:bg-indigo-50 shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <i data-lucide="git-merge" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>Unificar as ${propostasMesmoCliente.length} Propostas em Versões (v1, v2...)</span>
            </button>
          </div>
        `
            : ''
        }
      </div>
    `;
  },

  criarNovaVersaoDestaProposta(abrirComparativo = false) {
    try {
      if (!this.propostaAtual) {
        App.mostrarToast('Abra ou selecione uma proposta primeiro.', 'erro');
        return;
      }

      // Se a proposta ainda não tiver ID salvo no Store, salva primeiro para gerar ID
      if (!this.propostaAtual.id) {
        if (!this.propostaAtual.nomeEvento || !this.propostaAtual.nomeEvento.trim()) {
          const cli = (Store.state.clientes || []).find((c) => c.id === this.propostaAtual.clienteId);
          this.propostaAtual.nomeEvento = cli ? `Evento ${cli.nome}` : 'Novo Evento';
        }
        this.salvarPropostaAtual();
      }

      const p = this.propostaAtual;
      Store.garantirHistoricoVersoesProposta(p);

      const consolidadoAtual = Store.consolidarProposta(p);
      const snapAtual = Store.extrairSnapshotProposta(p);

      // Atualiza o snapshot da versão ativa atual com o estado atual exato antes de abrir a nova versão
      const idxAtiva = p.versoesNegociacao.findIndex((v) => v.versaoId === p.versaoAtivaId);
      if (idxAtiva >= 0) {
        const verAtiva = p.versoesNegociacao[idxAtiva];
        verAtiva.valorTotalSnapshot = consolidadoAtual.custoTotalEvento;
        verAtiva.dados = JSON.parse(JSON.stringify(snapAtual));
        verAtiva.rotulo = Store.gerarRotuloResumoVersao(p, verAtiva.numero || idxAtiva + 1);
      }

      // Calcula o próximo número sequencial de versão (ex.: v1 -> v2)
      const proxNumero =
        p.versoesNegociacao.reduce((max, v, i) => Math.max(max, Number(v.numero) || i + 1), 0) + 1;
      const novaVerId = Store.gerarId ? Store.gerarId('ver') : 'ver-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

      // Clona os dados atuais para a nova versão
      const novaVersaoObj = {
        versaoId: novaVerId,
        numero: proxNumero,
        rotulo: `${Store.gerarRotuloResumoVersao(p, proxNumero)} (Em edição)`,
        nota: `Revisão ${proxNumero}`,
        observacao: `Versão ${proxNumero} em negociação`,
        criadoEm: new Date().toISOString(),
        valorTotalSnapshot: consolidadoAtual.custoTotalEvento,
        dados: JSON.parse(JSON.stringify(snapAtual))
      };

      p.versoesNegociacao.push(novaVersaoObj);
      p.versaoAtivaId = novaVerId;
      p.atualizadoEm = new Date().toISOString();

      // Salva no Store para persistência imediata
      const idxStore = (Store.state.propostas || []).findIndex((prop) => prop.id === p.id);
      if (idxStore >= 0) {
        Store.state.propostas[idxStore] = JSON.parse(JSON.stringify(p));
      } else {
        Store.state.propostas.unshift(JSON.parse(JSON.stringify(p)));
      }
      Store.save();

      this.render();
      if (abrirComparativo) {
        this.abrirModalComparativoVersoes();
      }
      App.mostrarToast(
        `Versão v${proxNumero} criada com sucesso! Você pode alterar linhas, convidados ou drinques à vontade; a versão v${proxNumero - 1} está salva no histórico.`
      );
    } catch (err) {
      console.error('Erro ao criar nova versão:', err);
      App.mostrarToast(`Erro ao criar versão: ${err.message}`, 'erro');
    }
  },

  ativarVersaoProposta(versaoId, fecharModal = false) {
    try {
      if (!this.propostaAtual) return;
      const p = this.propostaAtual;
      Store.garantirHistoricoVersoesProposta(p);

      const verAlvo = (p.versoesNegociacao || []).find((v) => v.versaoId === versaoId);
      if (!verAlvo || !verAlvo.dados) {
        App.mostrarToast('Versão não encontrada no histórico.', 'erro');
        return;
      }

      // Antes de trocar, salva o estado atual na versão que estava ativa (para não perder alterações)
      const verAnterior = (p.versoesNegociacao || []).find((v) => v.versaoId === p.versaoAtivaId);
      if (verAnterior && verAnterior.versaoId !== versaoId) {
        const consolidadoAtual = Store.consolidarProposta(p);
        const snapAnterior = Store.extrairSnapshotProposta(p);
        verAnterior.valorTotalSnapshot = consolidadoAtual.custoTotalEvento;
        verAnterior.dados = JSON.parse(JSON.stringify(snapAnterior));
        verAnterior.rotulo = Store.gerarRotuloResumoVersao(p, verAnterior.numero || 1);
      }

      // Aplica o snapshot da versão escolhida na proposta atual
      Store.aplicarSnapshotEmProposta(p, verAlvo.dados, verAlvo.versaoId);

      // Sincroniza imediatamente no Store para que o Funil de Vendas e o CRM reflitam o valor da versão restaurada
      if (p.id) {
        const idxStore = (Store.state.propostas || []).findIndex((prop) => prop.id === p.id);
        if (idxStore >= 0) {
          Store.state.propostas[idxStore] = JSON.parse(JSON.stringify(p));
          Store.save();
        }
      }

      if (fecharModal) {
        App.fecharModal();
      }

      this.render();
      if (window.Aba8Funil && App.abaAtiva === 'funil') {
        window.Aba8Funil.render();
      }
      if (window.Aba4Clientes && App.abaAtiva === 'clientes') {
        window.Aba4Clientes.render();
      }

      const val = Number(verAlvo.valorTotalSnapshot) || Store.consolidarProposta(p).custoTotalEvento;
      App.mostrarToast(
        `Negociação restaurada para a Versão v${verAlvo.numero || 1} (${Store.formatCurrency(val)})!`
      );
    } catch (err) {
      console.error('Erro ao ativar versão:', err);
      App.mostrarToast(`Erro ao ativar versão: ${err.message}`, 'erro');
    }
  },

  renomearVersaoProposta(versaoId) {
    if (!this.propostaAtual) return;
    const p = this.propostaAtual;
    const ver = (p.versoesNegociacao || []).find((v) => v.versaoId === versaoId);
    if (!ver) return;

    const novoRotulo = prompt(
      `Digite uma identificação ou anotação para a Versão v${ver.numero || 1}:`,
      ver.observacao || ver.rotulo || ''
    );
    if (novoRotulo === null) return;

    ver.observacao = novoRotulo.trim();
    if (p.id) {
      const idxStore = (Store.state.propostas || []).findIndex((prop) => prop.id === p.id);
      if (idxStore >= 0) {
        Store.state.propostas[idxStore] = JSON.parse(JSON.stringify(p));
        Store.save();
      }
    }
    this.abrirModalComparativoVersoes();
    this.render();
  },

  excluirVersaoProposta(versaoId) {
    if (!this.propostaAtual) return;
    const p = this.propostaAtual;
    const versoes = p.versoesNegociacao || [];
    if (versoes.length <= 1) {
      App.mostrarToast('A proposta precisa manter pelo menos 1 versão ativa.', 'erro');
      return;
    }

    const ver = versoes.find((v) => v.versaoId === versaoId);
    if (!ver) return;
    if (!confirm(`Deseja remover a Versão v${ver.numero || 1} (${Store.formatCurrency(ver.valorTotalSnapshot || 0)}) do histórico desta proposta?`)) {
      return;
    }

    p.versoesNegociacao = versoes.filter((v) => v.versaoId !== versaoId);
    if (p.versaoAtivaId === versaoId) {
      const ultima = p.versoesNegociacao[p.versoesNegociacao.length - 1];
      if (ultima) {
        Store.aplicarSnapshotEmProposta(p, ultima.dados, ultima.versaoId);
      }
    }

    if (p.id) {
      const idxStore = (Store.state.propostas || []).findIndex((prop) => prop.id === p.id);
      if (idxStore >= 0) {
        Store.state.propostas[idxStore] = JSON.parse(JSON.stringify(p));
        Store.save();
      }
    }

    this.render();
    this.abrirModalComparativoVersoes();
    App.mostrarToast(`Versão v${ver.numero || 1} removida do histórico.`);
  },

  abrirModalComparativoVersoes() {
    if (!this.propostaAtual) return;
    const p = this.propostaAtual;
    Store.garantirHistoricoVersoesProposta(p);

    const versoes = p.versoesNegociacao || [];
    const cli = (Store.state.clientes || []).find((c) => c.id === p.clienteId);
    const numCols =
      versoes.length === 1
        ? 'grid-cols-1 max-w-xl mx-auto'
        : versoes.length === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

    const cardsHtml = versoes
      .map((ver, idx) => {
        const isAtiva = ver.versaoId === p.versaoAtivaId;
        const numVer = ver.numero || idx + 1;
        const d = ver.dados || {};
        const tempProp = { ...p, ...d };
        let calc = null;
        try {
          calc = Store.consolidarProposta(tempProp);
        } catch (e) {
          calc = null;
        }
        const valorTotal = calc ? calc.custoTotalEvento : Number(ver.valorTotalSnapshot) || 0;
        const convidados = Number(d.numConvidados) || Number(p.numConvidados) || 1;
        const custoConvidado = convidados > 0 ? valorTotal / convidados : 0;
        const custoInsumos = calc ? calc.custoTotalInsumos : 0;
        const custoServicos = calc ? calc.custoTotalServicos : 0;

        const drinquesNomes = (d.coqueteis || [])
          .map((item) => {
            const drId = typeof item === 'object' ? (item.drinqueId || item.id) : item;
            const dr = (Store.state.drinques || []).find((x) => x.id === drId);
            return dr ? dr.nome : null;
          })
          .filter(Boolean);

        const dataHoraStr = ver.criadoEm
          ? new Date(ver.criadoEm).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '—';

        return `
          <div class="bg-white rounded-2xl border-2 ${
            isAtiva ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-indigo-300'
          } shadow-xs flex flex-col justify-between overflow-hidden transition-all">
            <div>
              <!-- Topo da Versão -->
              <div class="p-4 border-b border-slate-100 ${isAtiva ? 'bg-indigo-50/70' : 'bg-slate-50/60'}">
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase ${
                      isAtiva ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                    }">
                      Versão v${numVer}
                    </span>
                    ${
                      isAtiva
                        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Ativa no Orçamento / Funil
                          </span>`
                        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            Guardada no Histórico
                          </span>`
                    }
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      onclick="Aba5Propostas.renomearVersaoProposta('${ver.versaoId}')"
                      class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      title="Anotar observação nesta versão"
                    >
                      <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                    </button>
                    ${
                      versoes.length > 1
                        ? `<button
                            type="button"
                            onclick="Aba5Propostas.excluirVersaoProposta('${ver.versaoId}')"
                            class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Excluir esta versão do histórico"
                          >
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                          </button>`
                        : ''
                    }
                  </div>
                </div>

                <h4 class="font-bold text-slate-900 text-sm">${ver.rotulo || `Versão v${numVer}`}</h4>
                ${
                  ver.observacao
                    ? `<p class="text-xs text-indigo-700 font-semibold mt-0.5">"${ver.observacao}"</p>`
                    : ''
                }
                <p class="text-[11px] text-slate-400 mt-1">Registrada em ${dataHoraStr}</p>
              </div>

              <!-- Bloco de Valor da Versão -->
              <div class="p-4 bg-slate-900 text-white">
                <div class="flex items-baseline justify-between">
                  <span class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Valor desta Versão</span>
                  <span class="text-2xl font-black text-emerald-400 font-mono">${Store.formatCurrency(valorTotal)}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-slate-300 mt-1.5 pt-1.5 border-t border-slate-800">
                  <span>Por Convidado: <strong class="text-white font-mono">${Store.formatCurrency(custoConvidado)}</strong></span>
                  <span>Insumos: <strong class="text-slate-200 font-mono">${Store.formatCurrency(custoInsumos)}</strong></span>
                </div>
              </div>

              <!-- Parâmetros Comparativos -->
              <div class="p-4 space-y-3 text-xs">
                <div class="grid grid-cols-2 gap-2">
                  <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span class="text-[10px] text-slate-400 uppercase font-bold block">Convidados / Horas</span>
                    <span class="font-bold text-slate-800 text-sm">${d.numConvidados || p.numConvidados || 0} conv. • ${d.duracaoHoras || d.horasFesta || p.duracaoHoras || 5}h</span>
                  </div>
                  <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span class="text-[10px] text-slate-400 uppercase font-bold block">Linha & Equipe</span>
                    <span class="font-bold text-indigo-700 text-sm">Linha ${d.linhaInsumos || d.linhaSelecionada || p.linhaInsumos || 'A'} • ${d.qtdBartenders || d.numBartenders || p.qtdBartenders || 1} bart.</span>
                  </div>
                </div>

                <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span class="text-slate-500 font-medium">Serviços & Equipe:</span>
                  <span class="font-bold text-slate-800 font-mono">${Store.formatCurrency(custoServicos)}</span>
                </div>

                <!-- Cardápio de Drinques desta Versão -->
                <div>
                  <span class="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                    Cardápio Selecionado (${drinquesNomes.length} drinques)
                  </span>
                  <div class="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                    ${
                      drinquesNomes.length > 0
                        ? drinquesNomes
                            .map(
                              (n) =>
                                `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200">${n}</span>`
                            )
                            .join('')
                        : '<span class="text-slate-400 italic">Nenhum drinque selecionado</span>'
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Rodapé de Ação da Versão -->
            <div class="p-3.5 bg-slate-50 border-t border-slate-200/80">
              ${
                isAtiva
                  ? `
                <div class="w-full py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center justify-center gap-1.5">
                  <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
                  <span>Esta é a Versão Ativa na Proposta</span>
                </div>
              `
                  : `
                <button
                  type="button"
                  onclick="Aba5Propostas.ativarVersaoProposta('${ver.versaoId}', true)"
                  class="w-full btn-primary justify-center text-xs py-2.5 font-extrabold bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                  <span>Voltar / Restaurar Versão v${numVer} (${Store.formatCurrency(valorTotal)})</span>
                </button>
              `
              }
            </div>
          </div>
        `;
      })
      .join('');

    const modalHtml = `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div class="bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in my-auto">
          <!-- Cabeçalho -->
          <div class="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0">
            <div>
              <div class="flex items-center gap-1.5 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-0.5">
                <i data-lucide="history" class="w-4 h-4"></i>
                <span>Histórico de Negociação • Mesma Proposta (${p.codigo || 'Rascunho'})</span>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-xl font-black text-slate-900">${p.nomeEvento || 'Proposta'}</h3>
                ${
                  cli
                    ? `<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">${cli.nome}</span>`
                    : ''
                }
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  ${versoes.length} ${versoes.length === 1 ? 'versão no histórico' : 'versões no histórico'}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="Aba5Propostas.criarNovaVersaoDestaProposta(true)"
                class="btn-secondary text-xs py-2 px-3 font-bold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 flex items-center gap-1.5"
              >
                <i data-lucide="git-branch-plus" class="w-4 h-4 text-indigo-600"></i>
                <span>+ Criar Nova Versão (v${versoes.length + 1})</span>
              </button>
              <button
                type="button"
                onclick="App.fecharModal()"
                class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Lista Lado a Lado de Versões -->
          <div class="p-5 overflow-x-auto overflow-y-auto flex-1">
            <div class="grid ${numCols} gap-5 items-stretch">
              ${cardsHtml}
            </div>
          </div>

          <!-- Rodapé -->
          <div class="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>
              <strong>Como funciona:</strong> Todas as versões acima pertencem ao <strong>mesmo card no Funil de Vendas</strong>. Ao clicar em <em>Voltar / Restaurar Versão</em>, o orçamento assume aquele valor na hora sem perder as outras versões.
            </span>
            <button type="button" onclick="App.fecharModal()" class="btn-secondary text-xs py-1.5 px-4 font-semibold">
              Fechar
            </button>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
  },

  unificarPropostasDoCliente(clienteId) {
    const cli = (Store.state.clientes || []).find((c) => c.id === clienteId);
    const propostasCli = (Store.state.propostas || []).filter((p) => p.clienteId === clienteId);
    if (propostasCli.length <= 1) {
      App.mostrarToast('Este cliente possui apenas 1 proposta cadastrada.', 'erro');
      return;
    }

    // Ordena da mais antiga para a mais recente para que v1 seja a primeira proposta e a última fique ativa
    const ordenadas = [...propostasCli].sort((a, b) =>
      String(a.criadoEm || '').localeCompare(String(b.criadoEm || ''))
    );

    const resumoLista = ordenadas
      .map((prop, i) => {
        let val = 0;
        try {
          val = Store.consolidarProposta(prop).custoTotalEvento;
        } catch (e) {
          val = 0;
        }
        return `• v${i + 1}: "${prop.nomeEvento}" — ${Store.formatCurrency(val)}`;
      })
      .join('\n');

    if (
      !confirm(
        `Deseja unificar as ${ordenadas.length} propostas de ${cli ? cli.nome : 'este cliente'} em 1 ÚNICA PROPOSTA com Histórico de Versões (v1, v2...)?\n\n` +
          `${resumoLista}\n\n` +
          `O que vai acontecer:\n` +
          `1. No Funil de Vendas ficará apenas 1 card para este evento (sem duplicar valores na etapa).\n` +
          `2. Todas as propostas acima ficarão salvas como versões (v1, v2...) dentro da mesma proposta para você alternar quando quiser.`
      )
    ) {
      return;
    }

    const base = ordenadas[0];
    const idsSecundarias = ordenadas.slice(1).map((p) => p.id);
    const res = Store.unificarPropostasEmVersoes(base.id, idsSecundarias);
    const propBase = res && res.proposta ? res.proposta : (res && res.id ? res : base);

    if (propBase) {
      this.propostaAtual = JSON.parse(JSON.stringify(propBase));
      App.fecharModal();
      this.render();
      if (window.Aba8Funil && App.abaAtiva === 'funil') {
        window.Aba8Funil.render();
      }
      if (window.Aba4Clientes && App.abaAtiva === 'clientes') {
        window.Aba4Clientes.render();
      }
      const totalVer = Array.isArray(propBase.versoesNegociacao) ? propBase.versoesNegociacao.length : 2;
      App.mostrarToast(
        `Propostas de ${cli ? cli.nome : 'cliente'} unificadas com sucesso! As ${totalVer} versões (v1..v${totalVer}) estão salvas no histórico desta proposta.`
      );
    }
  },

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

  anotacaoEmEdicaoId: null,

  renderBlocoTimelineNegociacao(p) {
    const timeline = Array.isArray(p.timelineNegociacao) ? p.timelineNegociacao : [];

    return `
      <!-- BLOCO 6: Linha do Tempo & Histórico da Negociação -->
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <i data-lucide="history" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-slate-900">6. Linha do Tempo da Negociação</h2>
                <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">${timeline.length} registro(s)</span>
              </div>
              <p class="text-xs text-slate-500">Histórico de anotações, combinados com o cliente e decisões registradas com data e hora.</p>
            </div>
          </div>
        </div>

        <!-- Campo para Adicionar Nova Anotação -->
        <div class="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <label class="block text-xs font-bold text-slate-700">Nova Anotação ou Acordo Combinado:</label>
          <div class="flex flex-col sm:flex-row gap-2">
            <textarea
              id="input-nova-anotacao-timeline"
              rows="2"
              placeholder="Ex: Cliente pediu para incluir Aperol Spritz na degustação. Combinamos parcelar a entrada em 2x..."
              class="input-minimal text-xs flex-1 bg-white"
            ></textarea>
            <button
              type="button"
              onclick="Aba5Propostas.adicionarAnotacaoTimeline()"
              class="btn-primary py-2 px-4 text-xs font-bold shrink-0 self-end sm:self-auto flex items-center justify-center gap-1.5"
            >
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>Adicionar Registro</span>
            </button>
          </div>
        </div>

        <!-- Listagem da Linha do Tempo -->
        <div class="space-y-3">
          ${
            timeline.length === 0
              ? `
            <div class="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400">
              <i data-lucide="message-square-plus" class="w-8 h-8 mx-auto mb-1.5 text-slate-300"></i>
              <p class="text-xs font-medium">Nenhuma anotação registrada nesta proposta.</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Use o campo acima para salvar observações importantes combinadas com o cliente.</p>
            </div>
          `
              : `
            <div class="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
              ${timeline
                .map((item) => {
                  const estaEditando = this.anotacaoEmEdicaoId === item.id;
                  return `
                  <div class="relative bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-indigo-300 transition group">
                    <!-- Marcador Circular da Linha do Tempo -->
                    <div class="absolute -left-[27px] top-3.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 shadow-xs"></div>

                    <!-- Cabeçalho do Card de Anotação -->
                    <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/60 mb-2">
                      <div class="flex items-center gap-2">
                        <span class="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                          <i data-lucide="calendar" class="w-3 h-3"></i>
                          <span>${this.formatarDataHoraBR(item.dataHora)}</span>
                        </span>
                        ${
                          item.editadoEm
                            ? `<span class="text-[10px] text-slate-400 italic" title="Editado em ${this.formatarDataHoraBR(item.editadoEm)}">(editado)</span>`
                            : ''
                        }
                      </div>

                      <div class="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                        ${
                          estaEditando
                            ? ''
                            : `
                          <button
                            type="button"
                            onclick="Aba5Propostas.iniciarEdicaoAnotacaoTimeline('${item.id}')"
                            class="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition"
                            title="Editar anotação"
                          >
                            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                          </button>
                        `
                        }
                        <button
                          type="button"
                          onclick="Aba5Propostas.excluirAnotacaoTimeline('${item.id}')"
                          class="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition"
                          title="Excluir anotação"
                        >
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </div>

                    <!-- Conteúdo do Registro -->
                    ${
                      estaEditando
                        ? `
                      <div class="space-y-2 mt-2">
                        <textarea
                          id="input-editar-timeline-${item.id}"
                          rows="3"
                          class="input-minimal text-xs w-full bg-white"
                        >${item.texto}</textarea>
                        <div class="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onclick="Aba5Propostas.cancelarEdicaoAnotacaoTimeline()"
                            class="btn-secondary py-1 px-2.5 text-xs"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onclick="Aba5Propostas.salvarEdicaoAnotacaoTimeline('${item.id}')"
                            class="btn-primary py-1 px-3 text-xs bg-indigo-600 hover:bg-indigo-700"
                          >
                            Salvar Alteração
                          </button>
                        </div>
                      </div>
                    `
                        : `
                      <div class="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                        ${item.texto}
                      </div>
                    `
                    }
                  </div>
                `;
                })
                .join('')}
            </div>
          `
          }
        </div>
      </div>
    `;
  },

  renderBlocoFluxoCaixa(p, consolidado) {
    const calc = Store.calcularFluxoCaixaProposta(p);
    const movs = Array.isArray(p.fluxoCaixa) ? p.fluxoCaixa : [];

    return `
      <!-- BLOCO 7: Fluxo de Caixa do Evento & Gestão de Pagamentos -->
      <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i data-lucide="wallet" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-slate-900">7. Fluxo de Caixa & Pagamentos do Evento</h2>
                <span class="text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
                  calc.statusPagamento === 'QUITADO'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : calc.statusPagamento === 'PARCIAL'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }">
                  ${calc.percentualPago}% Pago
                </span>
              </div>
              <p class="text-xs text-slate-500">Controle entradas (recebimentos do cliente) e saídas imediatas com saldo em caixa em tempo real.</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick="Aba5Propostas.abrirModalNovaMovimentacao('ENTRADA')"
              class="btn-primary py-1.5 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
            >
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>+ Entrada (Recebimento)</span>
            </button>
            <button
              type="button"
              onclick="Aba5Propostas.abrirModalNovaMovimentacao('SAIDA')"
              class="btn-secondary py-1.5 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center gap-1.5"
            >
              <i data-lucide="minus" class="w-3.5 h-3.5"></i>
              <span>- Saída (Despesa)</span>
            </button>
          </div>
        </div>

        <!-- 4 CARDS DE KPIs FINANCEIROS -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- 1. Valor Total da Proposta -->
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total do Evento</span>
            <span class="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5 block">
              ${Store.formatCurrency(calc.valorTotal)}
            </span>
            <span class="text-[10px] text-slate-400">Valor fechado da proposta</span>
          </div>

          <!-- 2. Total Recebido -->
          <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Recebido (Entradas)</span>
              <span class="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">${calc.percentualPago}%</span>
            </div>
            <span class="text-base sm:text-lg font-black text-emerald-700 font-mono mt-0.5 block">
              ${Store.formatCurrency(calc.totalEntradas)}
            </span>
            <span class="text-[10px] text-emerald-600 font-medium">Sinal e parcelas pagas</span>
          </div>

          <!-- 3. Falta Pagar (Saldo Devedor) -->
          <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
            <span class="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">Falta Pagar</span>
            <span class="text-base sm:text-lg font-black text-amber-700 font-mono mt-0.5 block">
              ${Store.formatCurrency(calc.faltaPagar)}
            </span>
            <span class="text-[10px] text-amber-700 font-medium">
              ${calc.faltaPagar === 0 ? '✅ 100% Quitado' : `${100 - calc.percentualPago}% pendente`}
            </span>
          </div>

          <!-- 4. Saldo Atual em Caixa -->
          <div class="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
            <span class="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">Saldo em Caixa</span>
            <span class="text-base sm:text-lg font-black ${calc.saldoEmCaixa < 0 ? 'text-rose-600' : 'text-blue-700'} font-mono mt-0.5 block">
              ${Store.formatCurrency(calc.saldoEmCaixa)}
            </span>
            <span class="text-[10px] text-blue-600 font-medium">Entradas menos saídas</span>
          </div>
        </div>

        <!-- Barra de Progresso Visual de Quitação -->
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
          <div class="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Progresso dos Pagamentos do Cliente</span>
            <span class="font-bold text-slate-900">${calc.percentualPago}% concluído (${Store.formatCurrency(calc.totalEntradas)} de ${Store.formatCurrency(calc.valorTotal)})</span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              class="h-2.5 rounded-full transition-all duration-500 ${
                calc.statusPagamento === 'QUITADO'
                  ? 'bg-emerald-500'
                  : calc.statusPagamento === 'PARCIAL'
                  ? 'bg-blue-600'
                  : 'bg-slate-300'
              }"
              style="width: ${calc.percentualPago}%"
            ></div>
          </div>
        </div>

        <!-- EXTRATO DE MOVIMENTAÇÕES (TABELA) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Extrato de Lançamentos (${movs.length})</h3>
            ${
              movs.length > 0
                ? `<span class="text-[11px] text-slate-500">Total de saídas registradas: <strong class="text-rose-600">${Store.formatCurrency(calc.totalSaidas)}</strong></span>`
                : ''
            }
          </div>

          ${
            movs.length === 0
              ? `
            <div class="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400">
              <i data-lucide="receipt" class="w-8 h-8 mx-auto mb-1.5 text-slate-300"></i>
              <p class="text-xs font-medium">Nenhum lançamento no fluxo de caixa desta proposta.</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Clique em "+ Entrada" acima para registrar o sinal de fechamento ou parcelas pagas.</p>
            </div>
          `
              : `
            <div class="overflow-x-auto rounded-xl border border-slate-200">
              <table class="w-full text-left border-collapse table-clean text-xs">
                <thead>
                  <tr class="bg-slate-50 text-slate-600">
                    <th class="py-2 px-3">Data / Hora</th>
                    <th class="py-2 px-3">Tipo</th>
                    <th class="py-2 px-3">Motivo / Descrição</th>
                    <th class="py-2 px-3">Forma de Pagto</th>
                    <th class="py-2 px-3 text-right">Valor</th>
                    <th class="py-2 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${movs
                    .map(
                      (m) => `
                    <tr class="hover:bg-slate-50/60 transition">
                      <td class="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        ${this.formatarDataHoraBR(m.dataHora)}
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          m.tipo === 'ENTRADA'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }">
                          <i data-lucide="${m.tipo === 'ENTRADA' ? 'arrow-down-left' : 'arrow-up-right'}" class="w-3 h-3"></i>
                          <span>${m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</span>
                        </span>
                      </td>
                      <td class="py-2.5 px-3 font-semibold text-slate-900">
                        ${m.motivo || 'Sem descrição'}
                      </td>
                      <td class="py-2.5 px-3 text-slate-600">
                        ${m.formaPagamento || 'Pix'}
                      </td>
                      <td class="py-2.5 px-3 text-right font-mono font-black ${
                        m.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-rose-600'
                      }">
                        ${m.tipo === 'ENTRADA' ? '+' : '-'}${Store.formatCurrency(m.valor)}
                      </td>
                      <td class="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onclick="Aba5Propostas.excluirMovimentacaoCaixa('${m.id}')"
                          class="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Excluir lançamento"
                        >
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
          }
        </div>
      </div>
    `;
  },

  adicionarAnotacaoTimeline() {
    const p = this.propostaAtual;
    if (!p) return;

    const input = document.getElementById('input-nova-anotacao-timeline');
    const texto = input ? input.value : '';

    if (!texto || !texto.trim()) {
      App.mostrarToast('Por favor, digite o texto da anotação.', 'warning');
      return;
    }

    if (p.id) {
      Store.adicionarAnotacaoTimeline(p.id, texto.trim());
      const propGlobal = (Store.state.propostas || []).find((x) => x.id === p.id);
      if (propGlobal) {
        p.timelineNegociacao = propGlobal.timelineNegociacao;
      }
    } else {
      if (!Array.isArray(p.timelineNegociacao)) p.timelineNegociacao = [];
      p.timelineNegociacao.unshift({
        id: 'tl-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        dataHora: new Date().toISOString(),
        texto: texto.trim(),
        editadoEm: null
      });
      Store.save();
    }

    this.render();
    App.mostrarToast('Anotação registrada na linha do tempo!', 'success');
  },

  iniciarEdicaoAnotacaoTimeline(id) {
    this.anotacaoEmEdicaoId = id;
    this.render();
    setTimeout(() => {
      const el = document.getElementById(`input-editar-timeline-${id}`);
      if (el) el.focus();
    }, 50);
  },

  cancelarEdicaoAnotacaoTimeline() {
    this.anotacaoEmEdicaoId = null;
    this.render();
  },

  salvarEdicaoAnotacaoTimeline(id) {
    const p = this.propostaAtual;
    if (!p || !Array.isArray(p.timelineNegociacao)) return;

    const el = document.getElementById(`input-editar-timeline-${id}`);
    const novoTexto = el ? el.value : '';

    if (!novoTexto || !novoTexto.trim()) {
      App.mostrarToast('O texto da anotação não pode ficar vazio.', 'warning');
      return;
    }

    if (p.id) {
      Store.editarAnotacaoTimeline(p.id, id, novoTexto);
      const propGlobal = (Store.state.propostas || []).find((x) => x.id === p.id);
      if (propGlobal) {
        p.timelineNegociacao = propGlobal.timelineNegociacao;
      }
    } else {
      const item = p.timelineNegociacao.find((x) => x.id === id);
      if (item) {
        item.texto = novoTexto.trim();
        item.editadoEm = new Date().toISOString();
      }
      Store.save();
    }

    this.anotacaoEmEdicaoId = null;
    this.render();
    App.mostrarToast('Anotação atualizada!', 'success');
  },

  excluirAnotacaoTimeline(id) {
    if (!confirm('Deseja realmente excluir esta anotação da linha do tempo?')) return;

    const p = this.propostaAtual;
    if (!p || !Array.isArray(p.timelineNegociacao)) return;

    if (p.id) {
      Store.excluirAnotacaoTimeline(p.id, id);
      const propGlobal = (Store.state.propostas || []).find((x) => x.id === p.id);
      if (propGlobal) {
        p.timelineNegociacao = propGlobal.timelineNegociacao;
      }
    } else {
      const idx = p.timelineNegociacao.findIndex((x) => x.id === id);
      if (idx !== -1) {
        p.timelineNegociacao.splice(idx, 1);
      }
      Store.save();
    }

    this.render();
    App.mostrarToast('Anotação excluída!', 'info');
  },

  abrirModalNovaMovimentacao(tipoPadrao = 'ENTRADA') {
    const p = this.propostaAtual;
    if (!p) return;

    const calc = Store.calcularFluxoCaixaProposta(p);
    const dataAtual = new Date().toISOString().slice(0, 16);

    const html = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop overflow-y-auto" onclick="if(event.target === this) App.fecharModal()">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg ${tipoPadrao === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center font-bold">
                  <i data-lucide="${tipoPadrao === 'ENTRADA' ? 'arrow-down-left' : 'arrow-up-right'}" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-base font-bold text-slate-900">Registrar Lançamento Financeiro</h3>
                  <p class="text-xs text-slate-500">${p.nomeEvento || 'Proposta'} • Total: ${Store.formatCurrency(calc.valorTotal)}</p>
                </div>
              </div>
              <button type="button" onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>

            <form id="form-movimentacao-caixa" onsubmit="Aba5Propostas.salvarMovimentacaoCaixa(event)" class="space-y-3.5">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Tipo de Movimentação:</label>
                  <select id="modal-mov-tipo" class="input-minimal text-xs font-semibold" onchange="Aba5Propostas.ajustarSugestaoMotivo(this.value)">
                    <option value="ENTRADA" ${tipoPadrao === 'ENTRADA' ? 'selected' : ''}>🟢 Entrada (Recebimento)</option>
                    <option value="SAIDA" ${tipoPadrao === 'SAIDA' ? 'selected' : ''}>🔴 Saída (Despesa do Evento)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Valor (R$):</label>
                  <input
                    type="number"
                    id="modal-mov-valor"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value="${tipoPadrao === 'ENTRADA' && calc.faltaPagar > 0 ? (calc.totalEntradas === 0 ? Math.round(calc.valorTotal * 0.5 * 100) / 100 : calc.faltaPagar) : ''}"
                    class="input-minimal text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Motivo / Descrição:</label>
                <input
                  type="text"
                  id="modal-mov-motivo"
                  required
                  placeholder="${tipoPadrao === 'ENTRADA' ? 'Ex: Sinal de 50% para reserva de data' : 'Ex: Compra de gelo emergencial'}"
                  value="${tipoPadrao === 'ENTRADA' ? (calc.totalEntradas === 0 ? 'Sinal 50% (Reserva de Data)' : 'Segunda Parcela') : 'Despesa Operacional'}"
                  class="input-minimal text-xs"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Forma de Pagamento:</label>
                  <select id="modal-mov-forma" class="input-minimal text-xs">
                    <option value="Pix" selected>Pix</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro em Espécie</option>
                    <option value="Transferência / TED">Transferência / TED</option>
                    <option value="Boleto">Boleto Bancário</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Data e Hora:</label>
                  <input
                    type="datetime-local"
                    id="modal-mov-datahora"
                    value="${dataAtual}"
                    class="input-minimal text-xs font-mono"
                  />
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onclick="App.fecharModal()" class="btn-secondary py-2 px-3 text-xs">
                  Cancelar
                </button>
                <button type="submit" class="btn-primary py-2 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700">
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(html);
  },

  ajustarSugestaoMotivo(tipo) {
    const input = document.getElementById('modal-mov-motivo');
    if (!input) return;
    if (tipo === 'ENTRADA') {
      input.placeholder = 'Ex: Sinal de 50% para reserva de data';
      input.value = 'Pagamento do Cliente';
    } else {
      input.placeholder = 'Ex: Compra de gelo emergencial, frete extra...';
      input.value = 'Despesa Operacional';
    }
  },

  salvarMovimentacaoCaixa(event) {
    if (event) event.preventDefault();
    const p = this.propostaAtual;
    if (!p) return;

    const tipo = document.getElementById('modal-mov-tipo')?.value || 'ENTRADA';
    const valorNum = parseFloat(document.getElementById('modal-mov-valor')?.value || '0');
    const motivo = document.getElementById('modal-mov-motivo')?.value || '';
    const forma = document.getElementById('modal-mov-forma')?.value || 'Pix';
    const dataHoraRaw = document.getElementById('modal-mov-datahora')?.value;

    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      App.mostrarToast('Por favor, informe um valor válido maior que zero.', 'warning');
      return;
    }

    const dataHora = dataHoraRaw ? new Date(dataHoraRaw).toISOString() : new Date().toISOString();

    const dadosMov = {
      tipo,
      valor: valorNum,
      motivo: motivo.trim() || (tipo === 'SAIDA' ? 'Despesa Operacional' : 'Pagamento do Cliente'),
      formaPagamento: forma,
      dataHora
    };

    if (p.id) {
      Store.adicionarMovimentacaoCaixa(p.id, dadosMov);
      const propGlobal = (Store.state.propostas || []).find((x) => x.id === p.id);
      if (propGlobal) {
        p.fluxoCaixa = propGlobal.fluxoCaixa;
      }
    } else {
      if (!Array.isArray(p.fluxoCaixa)) p.fluxoCaixa = [];
      p.fluxoCaixa.unshift({
        id: 'mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        ...dadosMov
      });
      Store.save();
    }

    App.fecharModal();
    this.render();
    if (window.Aba8Funil && App.abaAtiva === 'funil') {
      window.Aba8Funil.render();
    }
    App.mostrarToast(`Lançamento de ${Store.formatCurrency(valorNum)} registrado com sucesso!`, 'success');
  },

  excluirMovimentacaoCaixa(movId) {
    if (!confirm('Deseja realmente excluir este lançamento financeiro?')) return;

    const p = this.propostaAtual;
    if (!p || !Array.isArray(p.fluxoCaixa)) return;

    if (p.id) {
      Store.excluirMovimentacaoCaixa(p.id, movId);
      const propGlobal = (Store.state.propostas || []).find((x) => x.id === p.id);
      if (propGlobal) {
        p.fluxoCaixa = propGlobal.fluxoCaixa;
      }
    } else {
      const idx = p.fluxoCaixa.findIndex((x) => x.id === movId);
      if (idx !== -1) {
        p.fluxoCaixa.splice(idx, 1);
      }
      Store.save();
    }

    this.render();
    if (window.Aba8Funil && App.abaAtiva === 'funil') {
      window.Aba8Funil.render();
    }
    App.mostrarToast('Lançamento financeiro removido!', 'info');
  }
};

