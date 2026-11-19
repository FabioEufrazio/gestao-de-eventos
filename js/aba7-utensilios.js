// Aba 7: Ambiente Global de Utensílios & Checklist de Utensílios por Proposta/Evento
// Permite gerenciar o acervo fixo global (mesmo sem cliente/proposta), gerenciar categorias,
// importar utensílios para propostas específicas e controlar quantidades (Ex: Tenho 1 de 3 -> Completar 2) e pendências.

window.Aba7Utensilios = {
  modoAmbiente: 'GLOBAL', // 'GLOBAL' | 'EVENTO'
  propostaSelecionadaId: null,
  filtroTexto: '',
  filtroCategoria: 'TODAS',
  filtroStatus: 'TODOS',
  categoriaEditandoIdx: null,
  retornoModalUtensilio: null, // Guarda rascunho caso abra o gerenciador de categorias de dentro do modal de utensílio

  esc(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  obterCategorias() {
    if (!Array.isArray(Store.state.categoriasUtensilios) || Store.state.categoriasUtensilios.length === 0) {
      Store.state.categoriasUtensilios = [
        'Preparo & Barware',
        'Bar & Balcão',
        'Corte & Mise en Place',
        'Térmicos & Armazenamento',
        'Acessórios & Apoio',
        'Outros'
      ];
    }
    return Store.state.categoriasUtensilios;
  },

  sincronizarSelecaoProposta() {
    const propostas = Store.state.propostas || [];
    if (propostas.length === 0) {
      this.propostaSelecionadaId = null;
    } else if (!this.propostaSelecionadaId || !propostas.some((p) => p.id === this.propostaSelecionadaId)) {
      this.propostaSelecionadaId = propostas[0].id;
    }

    if (this.propostaSelecionadaId && this.modoAmbiente === 'EVENTO') {
      const chk = Store.state.checklistsUtensilios?.[this.propostaSelecionadaId];
      const nuncaInicializado =
        !chk || (!chk.inicializado && !chk.limpoManualmente && (!chk.itens || chk.itens.length === 0));
      if (nuncaInicializado) {
        Store.importarUtensiliosGlobaisParaProposta(this.propostaSelecionadaId, {
          dimensionarPorBartenders: true,
          modo: 'SUBSTITUIR'
        });
      } else if (Array.isArray(chk.itens) && chk.itens.length > 0) {
        Store.sincronizarUtensiliosComAcervoGlobal(this.propostaSelecionadaId, {
          respeitarManual: true
        });
      }
    }
  },

  alternarModoAmbiente(modo) {
    if (modo !== 'GLOBAL' && modo !== 'EVENTO') return;
    this.modoAmbiente = modo;
    // Ajustar filtroStatus caso seja exclusivo do outro modo
    if (modo === 'GLOBAL' && ['PENDENTES_IDA', 'CONFERIDOS_IDA', 'PENDENTES_VOLTA'].includes(this.filtroStatus)) {
      this.filtroStatus = 'TODOS';
    }
    if (modo === 'EVENTO' && ['POR_BARTENDER', 'FIXOS_EVENTO'].includes(this.filtroStatus)) {
      this.filtroStatus = 'TODOS';
    }
    this.render();
  },

  itemPossuiPendencia(it, campoNecessario = 'quantidade') {
    const nec = Math.max(1, Number(it[campoNecessario]) || 1);
    const tenho = it.qtdTenho !== undefined ? Math.max(0, Number(it.qtdTenho) || 0) : nec;
    return Boolean(it.pendente) || tenho < nec;
  },

  filtrarListaItens(itens, modo) {
    const termo = (this.filtroTexto || '').toLowerCase().trim();
    const campoNec = modo === 'GLOBAL' ? 'quantidadeBase' : 'quantidade';

    return (itens || []).filter((it) => {
      if (this.filtroCategoria !== 'TODAS' && it.categoria !== this.filtroCategoria) return false;

      const nec = Math.max(1, Number(it[campoNec]) || 1);
      const tenho = it.qtdTenho !== undefined ? Math.max(0, Number(it.qtdTenho) || 0) : nec;
      const faltaQtd = tenho < nec;
      const pendenteGeral = Boolean(it.pendente) || faltaQtd;

      if (this.filtroStatus === 'PENDENTES_GERAL' && !pendenteGeral) return false;
      if (this.filtroStatus === 'FALTA_COMPLETAR' && !faltaQtd) return false;
      if (this.filtroStatus === 'MARCADOS_PENDENTE' && !it.pendente) return false;
      if (this.filtroStatus === 'COMPLETOS' && pendenteGeral) return false;

      if (modo === 'EVENTO') {
        if (this.filtroStatus === 'PENDENTES_IDA' && it.conferidoIda) return false;
        if (this.filtroStatus === 'CONFERIDOS_IDA' && !it.conferidoIda) return false;
        if (this.filtroStatus === 'PENDENTES_VOLTA' && it.conferidoVolta) return false;
      } else {
        if (this.filtroStatus === 'POR_BARTENDER' && !it.porBartender) return false;
        if (this.filtroStatus === 'FIXOS_EVENTO' && it.porBartender) return false;
      }

      if (termo) {
        const matchDesc = (it.descricao || '').toLowerCase().includes(termo);
        const matchCat = (it.categoria || '').toLowerCase().includes(termo);
        const matchObs = (it.observacoes || '').toLowerCase().includes(termo);
        if (!matchDesc && !matchCat && !matchObs) return false;
      }

      return true;
    });
  },

  render() {
    const container = document.getElementById('tab-utensilios');
    if (!container) return;

    this.sincronizarSelecaoProposta();

    const categoriasDisponiveis = this.obterCategorias();
    if (this.filtroCategoria !== 'TODAS' && !categoriasDisponiveis.includes(this.filtroCategoria)) {
      this.filtroCategoria = 'TODAS';
    }

    const propostas = Store.state.propostas || [];
    const utensiliosGlobais = Store.state.utensiliosPadrao || [];
    const proposta = propostas.find((p) => p.id === this.propostaSelecionadaId) || null;
    const isGlobal = this.modoAmbiente === 'GLOBAL';

    container.innerHTML = `
      <!-- Cabeçalho -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <div>
          <div class="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <i data-lucide="wrench" class="w-4 h-4"></i>
            <span>Módulo 07 • Acervo Global & Checklists de Equipamentos de Bar</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Utensílios & Equipamentos de Bar</h1>
          <p class="text-sm text-slate-500 mt-0.5">
            Cadastre seus utensílios fixos no <strong>Ambiente Global</strong>, importe para cada proposta e controle o que está completo, pendente ou precisa completar.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onclick="Aba7Utensilios.abrirModalCategorias()"
            class="btn-secondary"
            title="Criar, renomear ou excluir categorias de utensílios"
          >
            <i data-lucide="tags" class="w-4 h-4 text-blue-600"></i>
            <span>Categorias</span>
          </button>

          ${
            isGlobal
              ? `
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalImportarParaProposta()"
              class="btn-secondary border-indigo-300 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100"
              title="Importar utensílios do Ambiente Global para uma Proposta específica"
            >
              <i data-lucide="import" class="w-4 h-4 text-indigo-700"></i>
              <span>Importar p/ Proposta</span>
            </button>

            <button
              type="button"
              onclick="Aba7Utensilios.exportarUtensiliosExcel()"
              class="btn-secondary"
            >
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i>
              <span>Excel / CSV</span>
            </button>

            <button
              type="button"
              onclick="Aba7Utensilios.exportarUtensiliosPdf()"
              class="btn-secondary"
              title="Imprimir relação do Acervo Global em PDF"
            >
              <i data-lucide="printer" class="w-4 h-4 text-slate-700"></i>
              <span>PDF Acervo</span>
            </button>

            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalUtensilioGlobal()"
              class="btn-primary"
            >
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Novo Utensílio Global</span>
            </button>
          `
              : proposta
                ? `
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalSalvarNoGlobal('${this.esc(proposta.id)}')"
              class="btn-secondary border-blue-300 bg-blue-50/80 text-blue-900 hover:bg-blue-100"
              title="Copiar / Salvar os utensílios desta proposta no Acervo Global permanente"
            >
              <i data-lucide="cloud-upload" class="w-4 h-4 text-blue-700"></i>
              <span>Salvar no Acervo Global</span>
            </button>

            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalImportarParaProposta('${this.esc(proposta.id)}')"
              class="btn-secondary border-indigo-300 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100"
              title="Importar utensílios salvos no Ambiente Global para esta proposta"
            >
              <i data-lucide="import" class="w-4 h-4 text-indigo-700"></i>
              <span>Importar do Global</span>
            </button>

            <button
              type="button"
              onclick="Aba7Utensilios.sincronizarComAcervoGlobal()"
              class="btn-secondary border-emerald-300 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100"
              title="Puxa e atualiza o saldo disponível (Tenho) de todos os itens com base no Acervo Global"
            >
              <i data-lucide="refresh-cw" class="w-4 h-4 text-emerald-700"></i>
              <span>Puxar Saldo do Acervo</span>
            </button>

            ${
              (Store.state.checklistsUtensilios?.[proposta.id]?.itens?.length || 0) > 0
                ? `
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalApagarTudoEvento()"
              class="btn-secondary border-red-300 bg-red-50/80 text-red-700 hover:bg-red-100"
              title="Apagar todos os utensílios desta proposta (não afeta o Ambiente Global)"
            >
              <i data-lucide="trash-2" class="w-4 h-4 text-red-600"></i>
              <span>Apagar Tudo</span>
            </button>
            `
                : ''
            }

            <button
              type="button"
              onclick="Aba7Utensilios.exportarUtensiliosExcel()"
              class="btn-secondary"
            >
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i>
              <span>Excel / CSV</span>
            </button>

            <button
              type="button"
              onclick="Aba7Utensilios.exportarUtensiliosPdf()"
              class="btn-secondary border-blue-200 bg-blue-50/70 text-blue-800"
              title="Gera o Checklist de Utensílios do Evento em PDF"
            >
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Imprimir Checklist (PDF)</span>
            </button>

            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalUtensilio()"
              class="btn-primary"
            >
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Adicionar Utensílio</span>
            </button>
          `
                : ''
          }
        </div>
      </div>

      <!-- Seletor de Ambiente: Global vs Por Proposta -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onclick="Aba7Utensilios.alternarModoAmbiente('GLOBAL')"
          class="text-left p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
            isGlobal
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 shadow-xs'
          }"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isGlobal ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
            }">
              <i data-lucide="globe" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <div class="text-sm font-extrabold truncate">Ambiente Global (Acervo Base)</div>
              <div class="text-xs truncate ${isGlobal ? 'text-blue-100' : 'text-slate-500'}">
                Utensílios salvos permanentemente (independe de cliente ou evento)
              </div>
            </div>
          </div>
          <span class="text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
            isGlobal ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
          }">
            ${utensiliosGlobais.length} itens
          </span>
        </button>

        <button
          type="button"
          onclick="Aba7Utensilios.alternarModoAmbiente('EVENTO')"
          class="text-left p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
            !isGlobal
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 shadow-xs'
          }"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              !isGlobal ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
            }">
              <i data-lucide="clipboard-list" class="w-5 h-5"></i>
            </div>
            <div class="min-w-0">
              <div class="text-sm font-extrabold truncate">Checklist por Proposta / Evento</div>
              <div class="text-xs truncate ${!isGlobal ? 'text-blue-100' : 'text-slate-500'}">
                Importe utensílios do Global e avalie a necessidade de cada proposta
              </div>
            </div>
          </div>
          <span class="text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
            !isGlobal ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
          }">
            ${propostas.length} ${propostas.length === 1 ? 'proposta' : 'propostas'}
          </span>
        </button>
      </div>

      <!-- Painel de Seleção de Proposta + Busca e Filtros -->
      <div class="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm space-y-4">
        ${
          !isGlobal
            ? `
          <div class="pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div class="flex-1">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Proposta / Evento Selecionado (Aba 5)
              </label>
              <select
                onchange="Aba7Utensilios.selecionarProposta(this.value)"
                class="input-minimal font-semibold text-slate-900"
              >
                ${
                  propostas.length === 0
                    ? `<option value="">Nenhuma proposta salva na Aba 5</option>`
                    : propostas
                        .map((prop) => {
                          const qtdItensProp = Store.state.checklistsUtensilios?.[prop.id]?.itens?.length || 0;
                          const sufixoKit = qtdItensProp > 0 ? ` • ${qtdItensProp} utensílios` : ' • Sem kit importado';
                          return `<option value="${this.esc(prop.id)}" ${
                            this.propostaSelecionadaId === prop.id ? 'selected' : ''
                          }>${this.esc(prop.codigo)} • ${this.esc(prop.nomeEvento)} (${prop.numConvidados} conv.)${sufixoKit}</option>`;
                        })
                        .join('')
                }
              </select>
            </div>
            ${
              proposta
                ? `
              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <span class="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  👥 Equipe: <strong>${Store.calcularBartendersProposta(proposta)} bartender(s)</strong>
                </span>
                <button
                  type="button"
                  onclick="Aba7Utensilios.abrirModalImportarParaProposta('${this.esc(proposta.id)}')"
                  class="btn-secondary border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 py-2 px-3 text-xs font-bold"
                >
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Importar Utensílios do Global</span>
                </button>
                ${
                  (Store.state.checklistsUtensilios?.[proposta.id]?.itens?.length || 0) > 0
                    ? `
                  <button
                    type="button"
                    onclick="Aba7Utensilios.abrirModalApagarTudoEvento()"
                    class="btn-secondary border-red-300 bg-red-50 text-red-700 hover:bg-red-100 py-2 px-3 text-xs font-bold"
                    title="Apagar todos os utensílios desta proposta"
                  >
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    <span>Apagar Tudo</span>
                  </button>
                `
                    : ''
                }
              </div>
            `
                : ''
            }
          </div>
        `
            : ''
        }

        <!-- Linha de Busca, Categoria e Status -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div class="md:col-span-5">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Buscar Utensílio
            </label>
            <div class="relative">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
              <input
                type="text"
                id="input-busca-utensilios"
                placeholder="Buscar por nome, categoria ou observações..."
                value="${this.esc(this.filtroTexto)}"
                oninput="Aba7Utensilios.atualizarFiltroTexto(this.value)"
                class="input-minimal pl-9 pr-8"
              />
              <button
                type="button"
                id="btn-limpar-busca-utensilios"
                onclick="Aba7Utensilios.limparBusca()"
                style="${this.filtroTexto ? '' : 'display:none;'}"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                title="Limpar busca"
              >
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <div class="md:col-span-4">
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Categoria
              </label>
              <button
                type="button"
                onclick="Aba7Utensilios.abrirModalCategorias()"
                class="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <i data-lucide="settings-2" class="w-3 h-3"></i>
                <span>Criar / Editar</span>
              </button>
            </div>
            <select
              onchange="Aba7Utensilios.filtrarCategoria(this.value)"
              class="input-minimal"
            >
              <option value="TODAS" ${this.filtroCategoria === 'TODAS' ? 'selected' : ''}>Todas as Categorias (${categoriasDisponiveis.length})</option>
              ${categoriasDisponiveis
                .map(
                  (c) =>
                    `<option value="${this.esc(c)}" ${this.filtroCategoria === c ? 'selected' : ''}>${this.esc(c)}</option>`
                )
                .join('')}
            </select>
          </div>

          <div class="md:col-span-3">
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Status / Pendências
              </label>
              ${
                this.filtroCategoria !== 'TODAS' || this.filtroStatus !== 'TODOS' || this.filtroTexto
                  ? `<button type="button" onclick="Aba7Utensilios.limparTodosFiltros()" class="text-[11px] font-semibold text-amber-700 hover:underline">Limpar filtros</button>`
                  : ''
              }
            </div>
            <select
              onchange="Aba7Utensilios.filtrarStatus(this.value)"
              class="input-minimal"
            >
              <option value="TODOS" ${this.filtroStatus === 'TODOS' ? 'selected' : ''}>Todos os Status</option>
              <option value="PENDENTES_GERAL" ${this.filtroStatus === 'PENDENTES_GERAL' ? 'selected' : ''}>⚠️ Pendentes ou Falta Completar</option>
              <option value="FALTA_COMPLETAR" ${this.filtroStatus === 'FALTA_COMPLETAR' ? 'selected' : ''}>🟠 Falta Completar Quantidade (Ex: 1 de 3)</option>
              <option value="MARCADOS_PENDENTE" ${this.filtroStatus === 'MARCADOS_PENDENTE' ? 'selected' : ''}>⏳ Marcados como Pendente</option>
              <option value="COMPLETOS" ${this.filtroStatus === 'COMPLETOS' ? 'selected' : ''}>✅ Quantidade Completa (OK)</option>
              ${
                !isGlobal
                  ? `
                <option value="PENDENTES_IDA" ${this.filtroStatus === 'PENDENTES_IDA' ? 'selected' : ''}>📦 Pendentes de Saída (Ida)</option>
                <option value="CONFERIDOS_IDA" ${this.filtroStatus === 'CONFERIDOS_IDA' ? 'selected' : ''}>✔️ Conferidos para Saída (Ida)</option>
                <option value="PENDENTES_VOLTA" ${this.filtroStatus === 'PENDENTES_VOLTA' ? 'selected' : ''}>🔄 Pendentes de Retorno (Volta)</option>
              `
                  : ''
              }
            </select>
          </div>
        </div>
      </div>

      <!-- Área Dinâmica (KPIs + Tabela), atualizada sem perder foco da busca -->
      <div id="utensilios-area-resultados">
        ${this.renderConteudoDinamico()}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderConteudoDinamico() {
    if (this.modoAmbiente === 'GLOBAL') {
      return this.renderVisaoGlobal();
    }

    const propostas = Store.state.propostas || [];
    const proposta = propostas.find((p) => p.id === this.propostaSelecionadaId) || null;
    if (!proposta) {
      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <i data-lucide="file-question" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
          <h3 class="text-base font-bold text-slate-800">Nenhuma proposta cadastrada na Aba 5</h3>
          <p class="text-xs text-slate-500 mt-1 mb-5 max-w-md mx-auto">
            Você ainda pode cadastrar e organizar todos os seus utensílios agora mesmo no <strong>Ambiente Global</strong>, ou criar uma proposta na Aba 5 para montar o checklist do evento.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <button type="button" onclick="Aba7Utensilios.alternarModoAmbiente('GLOBAL')" class="btn-secondary">
              <i data-lucide="globe" class="w-4 h-4 text-blue-600"></i>
              <span>Ir para o Ambiente Global</span>
            </button>
            <button type="button" onclick="App.navegarPara('propostas')" class="btn-primary">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Criar Proposta na Aba 5</span>
            </button>
          </div>
        </div>
      `;
    }

    const checklist = Store.obterChecklistUtensilios(proposta.id);
    return this.renderVisaoEvento(proposta, checklist);
  },

  renderBadgeSituacao(it, campoNecessario, isGlobal) {
    const nec = Math.max(1, Math.round(Number(it[campoNecessario]) || 1));
    const tenho = it.qtdTenho !== undefined ? Math.max(0, Math.round(Number(it.qtdTenho) || 0)) : nec;
    const faltam = Math.max(0, nec - tenho);
    const un = this.esc(it.unidade || 'un');
    const fnTogglePend = isGlobal
      ? `Aba7Utensilios.alternarPendenteGlobal('${this.esc(it.id)}')`
      : `Aba7Utensilios.alternarPendenteEvento('${this.esc(it.id)}')`;

    if (faltam > 0) {
      const corBadge =
        tenho === 0
          ? 'bg-red-50 text-red-800 border-red-200'
          : 'bg-amber-50 text-amber-900 border-amber-300';
      return `
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${corBadge}" title="Necessário: ${nec} ${un} | Tenho: ${tenho} ${un}">
            <span>${it.pendente ? '⏳' : '⚠️'}</span>
            <span class="font-extrabold">+${faltam} ${un}</span>
          </span>
        </div>
      `;
    }

    if (it.pendente) {
      return `
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            ⏳ Pendente (${tenho}/${nec} ${un})
          </span>
          <button
            type="button"
            onclick="${fnTogglePend}"
            class="text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
            title="Remover marcação de pendente"
          >
            ✓ Resolver
          </button>
        </div>
      `;
    }

    return `
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          ✅ Completo (${tenho}/${nec})
        </span>
        <button
          type="button"
          onclick="${fnTogglePend}"
          class="text-[11px] font-medium px-2 py-0.5 rounded-md text-slate-500 hover:text-amber-800 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition"
          title="Deixar este item marcado como Pendente"
        >
          ⏳ Pendente
        </button>
      </div>
    `;
  },

  renderVisaoGlobal() {
    const todos = Store.state.utensiliosPadrao || [];
    const filtrados = this.filtrarListaItens(todos, 'GLOBAL');
    const categorias = this.obterCategorias();

    const itensComPendencia = todos.filter((it) => this.itemPossuiPendencia(it, 'quantidadeBase'));
    const unidadesFaltantes = todos.reduce((acc, it) => {
      const nec = Math.max(1, Number(it.quantidadeBase) || 1);
      const tenho = it.qtdTenho !== undefined ? Math.max(0, Number(it.qtdTenho) || 0) : nec;
      return acc + Math.max(0, nec - tenho);
    }, 0);

    return `
      <!-- KPIs do Ambiente Global -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Utensílios no Acervo Global</span>
            <div class="text-2xl font-extrabold text-slate-900 mt-0.5">${todos.length} <span class="text-xs font-normal text-slate-500">em ${categorias.length} categorias</span></div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <i data-lucide="boxes" class="w-5 h-5"></i>
          </div>
        </div>

        <div
          onclick="Aba7Utensilios.filtrarStatus('${this.filtroStatus === 'PENDENTES_GERAL' ? 'TODOS' : 'PENDENTES_GERAL'}')"
          class="cursor-pointer rounded-xl p-4 border shadow-xs flex items-center justify-between transition ${
            itensComPendencia.length > 0
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/70'
              : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
          }"
          title="Clique para filtrar itens pendentes ou incompletos"
        >
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider ${
              itensComPendencia.length > 0 ? 'text-amber-900' : 'text-emerald-800'
            } block">Pendentes / Completar no Acervo</span>
            <div class="text-2xl font-extrabold ${
              itensComPendencia.length > 0 ? 'text-amber-900' : 'text-emerald-800'
            } mt-0.5">
              ${itensComPendencia.length}
              <span class="text-xs font-medium">
                ${
                  unidadesFaltantes > 0
                    ? `• faltam ${unidadesFaltantes} un`
                    : itensComPendencia.length > 0
                      ? '• marcados pendentes'
                      : '• acervo em dia'
                }
              </span>
            </div>
          </div>
          <div class="w-10 h-10 rounded-xl ${
            itensComPendencia.length > 0 ? 'bg-amber-200/70 text-amber-900' : 'bg-emerald-100 text-emerald-700'
          } flex items-center justify-center">
            <i data-lucide="${itensComPendencia.length > 0 ? 'alert-triangle' : 'check-circle-2'}" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">Usar em um Evento</span>
            <p class="text-xs text-indigo-800 mt-0.5">Envie os utensílios para uma proposta e ajuste lá a necessidade.</p>
          </div>
          <button
            type="button"
            onclick="Aba7Utensilios.abrirModalImportarParaProposta()"
            class="btn-primary bg-indigo-600 hover:bg-indigo-700 py-2 px-3 text-xs font-bold shrink-0"
          >
            <i data-lucide="import" class="w-4 h-4"></i>
            <span>Importar p/ Proposta</span>
          </button>
        </div>
      </div>

      <!-- Tabela do Ambiente Global -->
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <i data-lucide="globe" class="w-4 h-4 text-blue-600"></i>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-800">
              Catálogo Global de Utensílios (Salvo Permanentemente)
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
              ${filtrados.length} de ${todos.length} exibidos
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalCategorias()"
              class="text-xs font-semibold text-slate-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <i data-lucide="tags" class="w-3.5 h-3.5"></i>
              <span>Gerenciar Categorias</span>
            </button>
            <span class="text-slate-300">|</span>
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalUtensilioGlobal()"
              class="text-xs font-bold text-blue-700 hover:underline"
            >
              + Cadastrar Utensílio Global
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-clean">
            <thead>
              <tr>
                <th>Utensílio / Equipamento</th>
                <th>Categoria</th>
                <th class="text-center w-44">Qtd. Base Sugerida</th>
                <th class="text-center w-36" title="Quantas unidades você possui hoje no seu acervo">Tenho no Acervo</th>
                <th>Status / Pendência</th>
                <th class="text-right w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                if (filtrados.length === 0) {
                  return `
                    <tr>
                      <td colspan="6" class="text-center py-12 text-slate-400">
                        <div class="flex flex-col items-center gap-2">
                          <i data-lucide="search-x" class="w-9 h-9 text-slate-300"></i>
                          <p class="text-sm font-semibold text-slate-600">Nenhum utensílio encontrado no Ambiente Global.</p>
                          <button type="button" onclick="Aba7Utensilios.abrirModalUtensilioGlobal()" class="text-xs font-bold text-blue-600 hover:underline">
                            + Cadastrar novo utensílio no Ambiente Global
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }

                const grupos = {};
                filtrados.forEach((it) => {
                  const cat = (it.categoria || 'Outros').trim();
                  if (!grupos[cat]) grupos[cat] = [];
                  grupos[cat].push(it);
                });

                const catsOrdenadas = Object.keys(grupos).sort((a, b) => {
                  if (a === 'Outros') return 1;
                  if (b === 'Outros') return -1;
                  return a.localeCompare(b, 'pt-BR');
                });

                return catsOrdenadas
                  .map((cat) => {
                    const itensCat = grupos[cat].sort((a, b) =>
                      (a.descricao || '').localeCompare(b.descricao || '', 'pt-BR')
                    );

                    const headerCat = `
                      <tr class="bg-slate-100/90 border-y-2 border-slate-200">
                        <td colspan="6" class="py-2 px-4">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                              <span class="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                              <span class="text-xs font-bold uppercase tracking-wider text-slate-800">${this.esc(cat)}</span>
                              <span class="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                ${itensCat.length} ${itensCat.length === 1 ? 'item' : 'itens'}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    `;

                    const linhas = itensCat
                      .map((it) => {
                        const nec = Math.max(1, Math.round(Number(it.quantidadeBase) || 1));
                        const tenho = it.qtdTenho !== undefined ? Math.max(0, Math.round(Number(it.qtdTenho) || 0)) : nec;
                        const temPendencia = Boolean(it.pendente) || tenho < nec;
                        const temFator = Boolean(it.temFator !== undefined ? it.temFator : it.porBartender);
                        const fator = temFator ? Math.max(1, Math.round(Number(it.fatorBartender || it.quantidadeBase || 1))) : 0;

                        return `
                          <tr class="${temPendencia ? 'bg-amber-50/30' : ''}">
                            <td>
                              <div class="font-bold text-slate-900 text-sm">${this.esc(it.descricao)}</div>
                              <div class="flex flex-wrap items-center gap-1.5 mt-1">
                                <button
                                  type="button"
                                  onclick="Aba7Utensilios.toggleFatorItem('${this.esc(it.id)}')"
                                  class="inline-flex items-center gap-1 text-[11px] font-bold ${
                                    temFator
                                      ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100'
                                      : 'text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200'
                                  } px-1.5 py-0.5 rounded transition"
                                  title="${
                                    temFator
                                      ? `Fator: ${fator} ${this.esc(it.unidade)} por bartender ao importar. Clique para alternar para sem fator.`
                                      : 'Item de uso coletivo por toda a equipe (sem fator). Clique para ativar fator por bartender.'
                                  }"
                                >
                                  <i data-lucide="${temFator ? 'users' : 'shield'}" class="w-3 h-3"></i>
                                  <span>${temFator ? `Fator: ${fator} ${this.esc(it.unidade)}/bar` : 'Sem Fator • Equipe'}</span>
                                </button>
                                ${
                                  it.observacoes
                                    ? `<span class="text-xs text-slate-500">• ${this.esc(it.observacoes)}</span>`
                                    : ''
                                }
                              </div>
                            </td>
                            <td class="whitespace-nowrap">
                              <span class="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                ${this.esc(it.categoria)}
                              </span>
                            </td>
                            <td class="text-center whitespace-nowrap">
                              <div class="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  value="${nec}"
                                  onchange="Aba7Utensilios.atualizarQtdBaseGlobal('${this.esc(it.id)}', this.value)"
                                  class="w-16 text-center text-xs font-extrabold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg py-1 px-1.5"
                                />
                                <span class="text-xs text-slate-500">${this.esc(it.unidade)}</span>
                              </div>
                            </td>
                            <td class="text-center whitespace-nowrap">
                              <div class="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value="${tenho}"
                                  onchange="Aba7Utensilios.atualizarQtdTenhoGlobal('${this.esc(it.id)}', this.value)"
                                  class="w-16 text-center text-xs font-extrabold rounded-lg py-1 px-1.5 border ${
                                    tenho < nec
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : 'bg-white text-slate-800 border-slate-300'
                                  }"
                                />
                                <span class="text-xs text-slate-500">${this.esc(it.unidade)}</span>
                              </div>
                            </td>
                            <td>
                              ${this.renderBadgeSituacao(it, 'quantidadeBase', true)}
                            </td>
                            <td class="text-right whitespace-nowrap">
                              <div class="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onclick="Aba7Utensilios.abrirModalImportarParaProposta(null, ['${this.esc(it.id)}'])"
                                  class="p-1.5 rounded text-indigo-600 hover:bg-indigo-50 transition"
                                  title="Importar este utensílio para uma proposta"
                                >
                                  <i data-lucide="import" class="w-4 h-4"></i>
                                </button>
                                <button
                                  type="button"
                                  onclick="Aba7Utensilios.abrirModalUtensilioGlobal('${this.esc(it.id)}')"
                                  class="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                  title="Editar utensílio global"
                                >
                                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                                </button>
                                <button
                                  type="button"
                                  onclick="Aba7Utensilios.duplicarUtensilioGlobal('${this.esc(it.id)}')"
                                  class="p-1.5 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                                  title="Duplicar utensílio global"
                                >
                                  <i data-lucide="copy" class="w-4 h-4"></i>
                                </button>
                                <button
                                  type="button"
                                  onclick="Aba7Utensilios.excluirUtensilioGlobal('${this.esc(it.id)}')"
                                  class="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                  title="Excluir utensílio global"
                                >
                                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        `;
                      })
                      .join('');

                    return headerCat + linhas;
                  })
                  .join('');
              })()}
            </tbody>
          </table>
        </div>

        <div class="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <i data-lucide="globe" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-xs font-bold text-slate-800 block">Ambiente Global independente de propostas</span>
              <span class="text-[11px] text-slate-500">Tudo o que você cadastrar aqui fica salvo como matriz para importar em qualquer evento futuro.</span>
            </div>
          </div>
          <button
            type="button"
            onclick="Aba7Utensilios.abrirModalUtensilioGlobal()"
            class="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
          >
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Novo Utensílio Global</span>
          </button>
        </div>
      </div>
    `;
  },

  renderVisaoEvento(proposta, checklist) {
    const itens = checklist?.itens || [];
    const itensFiltrados = this.filtrarListaItens(itens, 'EVENTO');
    const qtdBartenders = Store.calcularBartendersProposta(proposta);
    const totalGlobais = (Store.state.utensiliosPadrao || []).length;

    // Estado inicial da proposta antes de importar utensílios do Ambiente Global
    if (itens.length === 0) {
      return `
        <div class="bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-10 text-center shadow-xs mb-6">
          <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <i data-lucide="import" class="w-7 h-7"></i>
          </div>
          <h3 class="text-lg font-extrabold text-slate-900">
            Importe os utensílios para "${this.esc(proposta.nomeEvento)}"
          </h3>
          <p class="text-xs text-slate-600 mt-1.5 max-w-xl mx-auto leading-relaxed">
            Esta proposta ainda está com o checklist de utensílios vazio. Importe os itens do seu <strong>Ambiente Global</strong> (${totalGlobais} utensílios disponíveis) e ajuste aqui mesmo as quantidades necessárias, o que você já tem e o que precisa completar.
          </p>

          <div class="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onclick="Aba7Utensilios.importarTodosRapido('${this.esc(proposta.id)}')"
              class="btn-primary bg-indigo-600 hover:bg-indigo-700 py-2.5 px-4 text-xs font-bold shadow-sm"
            >
              <i data-lucide="zap" class="w-4 h-4"></i>
              <span>Importar Todo o Kit Global (${qtdBartenders} Bartender${qtdBartenders > 1 ? 's' : ''})</span>
            </button>

            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalImportarParaProposta('${this.esc(proposta.id)}')"
              class="btn-secondary border-indigo-300 text-indigo-900 hover:bg-indigo-50 py-2.5 px-4 text-xs font-bold"
            >
              <i data-lucide="list-checks" class="w-4 h-4 text-indigo-600"></i>
              <span>Escolher Quais Utensílios Importar...</span>
            </button>

            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalUtensilio()"
              class="btn-secondary py-2.5 px-4 text-xs font-semibold"
            >
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Adicionar Utensílio Avulso</span>
            </button>
          </div>
        </div>
      `;
    }

    const totalItens = itens.length;
    const totalIda = itens.filter((i) => i.conferidoIda).length;
    const totalVolta = itens.filter((i) => i.conferidoVolta).length;
    const percIda = totalItens > 0 ? Math.round((totalIda / totalItens) * 100) : 0;
    const percVolta = totalItens > 0 ? Math.round((totalVolta / totalItens) * 100) : 0;

    const itensComPendencia = itens.filter((i) => this.itemPossuiPendencia(i, 'quantidade'));
    const unidadesACompletar = itens.reduce((acc, i) => {
      const nec = Math.max(1, Number(i.quantidade) || 1);
      const tenho = i.qtdTenho !== undefined ? Math.max(0, Number(i.qtdTenho) || 0) : nec;
      return acc + Math.max(0, nec - tenho);
    }, 0);

    return `
      <!-- Indicadores do Evento -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div class="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total no Evento</span>
          <div class="text-xl font-extrabold text-slate-900 mt-0.5">${totalItens} <span class="text-xs font-normal text-slate-500">utensílios no kit</span></div>
        </div>

        <div
          onclick="Aba7Utensilios.filtrarStatus('${this.filtroStatus === 'PENDENTES_GERAL' ? 'TODOS' : 'PENDENTES_GERAL'}')"
          class="cursor-pointer p-3.5 rounded-xl border shadow-xs transition ${
            itensComPendencia.length > 0
              ? 'bg-amber-50/80 border-amber-300 hover:bg-amber-100/70'
              : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
          }"
          title="Clique para filtrar apenas utensílios pendentes ou a completar"
        >
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider ${
              itensComPendencia.length > 0 ? 'text-amber-900' : 'text-emerald-800'
            }">Pendentes / A Completar</span>
            <i data-lucide="${itensComPendencia.length > 0 ? 'alert-circle' : 'check-circle-2'}" class="w-4 h-4 ${
              itensComPendencia.length > 0 ? 'text-amber-700' : 'text-emerald-600'
            }"></i>
          </div>
          <div class="text-xl font-extrabold ${
            itensComPendencia.length > 0 ? 'text-amber-900' : 'text-emerald-800'
          } mt-0.5">
            ${itensComPendencia.length}
            <span class="text-xs font-medium">
              ${
                unidadesACompletar > 0
                  ? `• +${unidadesACompletar} un`
                  : itensComPendencia.length > 0
                    ? '• marcados pendentes'
                    : '• tudo completo'
              }
            </span>
          </div>
        </div>

        <div class="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">Conferência Saída (Ida)</span>
            <span class="text-xs font-extrabold text-blue-700">${percIda}%</span>
          </div>
          <div class="text-xl font-extrabold text-blue-900 mt-0.5">${totalIda} <span class="text-xs font-normal text-blue-700">de ${totalItens} conferidos</span></div>
          <div class="w-full bg-blue-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${percIda}%"></div>
          </div>
        </div>

        <div class="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Conferência Retorno (Volta)</span>
            <span class="text-xs font-extrabold text-emerald-700">${percVolta}%</span>
          </div>
          <div class="text-xl font-extrabold text-emerald-900 mt-0.5">${totalVolta} <span class="text-xs font-normal text-emerald-700">de ${totalItens} devolvidos</span></div>
          <div class="w-full bg-emerald-200/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div class="bg-emerald-600 h-1.5 rounded-full" style="width: ${percVolta}%"></div>
          </div>
        </div>
      </div>

      <!-- Dimensionamento de Bartenders & Utensílios -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/80 border border-indigo-200/90 rounded-2xl p-4 mb-5 shadow-xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <i data-lucide="users" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-indigo-950 uppercase tracking-wider">Dimensionamento da Equipe</span>
              <span class="text-[11px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-full shadow-2xs">
                Cálculo Dinâmico de Utensílios
              </span>
            </div>
            <p class="text-xs text-indigo-900/80 mt-0.5">
              Itens <strong>com fator</strong> multiplicam automaticamente pelo nº de bartenders. Itens <strong>sem fator</strong> são de uso coletivo da equipe.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-indigo-200 shadow-xs">
          <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <i data-lucide="user-check" class="w-4 h-4 text-indigo-600"></i>
            <span>Bartenders no Evento:</span>
          </span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick="Aba7Utensilios.alterarBartendersEvento('${this.esc(proposta.id)}', ${Math.max(1, qtdBartenders - 1)})"
              class="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center transition border border-indigo-200"
              title="Diminuir bartenders (-1)"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value="${qtdBartenders}"
              onchange="Aba7Utensilios.alterarBartendersEvento('${this.esc(proposta.id)}', this.value)"
              class="w-12 text-center text-sm font-black text-indigo-950 bg-indigo-50/50 border border-indigo-300 rounded-lg py-1 px-1 focus:ring-2 focus:ring-indigo-500"
              title="Altere a quantidade de bartenders para recalcular os utensílios com fator"
            />
            <button
              type="button"
              onclick="Aba7Utensilios.alterarBartendersEvento('${this.esc(proposta.id)}', ${qtdBartenders + 1})"
              class="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center transition border border-indigo-200"
              title="Aumentar bartenders (+1)"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <!-- Tabela de Utensílios do Evento -->
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-700">
              ${this.esc(checklist.nomeLista || 'Checklist de Utensílios')}
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
              ${itensFiltrados.length} de ${totalItens} listados
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalSalvarNoGlobal('${this.esc(proposta.id)}')"
              class="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
              title="Copiar / Salvar os utensílios desta proposta no Acervo Global permanente"
            >
              <i data-lucide="cloud-upload" class="w-3.5 h-3.5"></i>
              <span>Salvar no Acervo Global</span>
            </button>
            <span class="text-slate-300">|</span>
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalImportarParaProposta('${this.esc(proposta.id)}')"
              class="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1"
            >
              <i data-lucide="import" class="w-3.5 h-3.5"></i>
              <span>Importar do Global</span>
            </button>
            <span class="text-slate-300">|</span>
            <button
              type="button"
              onclick="Aba7Utensilios.marcarTodosIda(true)"
              class="text-xs font-semibold text-blue-700 hover:underline"
            >
              ✓ Conferir Todos (Ida)
            </button>
            <span class="text-slate-300">|</span>
            <button
              type="button"
              onclick="Aba7Utensilios.marcarTodosVolta(true)"
              class="text-xs font-semibold text-emerald-700 hover:underline"
            >
              ✓ Devolver Todos (Volta)
            </button>
            <span class="text-slate-300">|</span>
            <button
              type="button"
              onclick="Aba7Utensilios.desmarcarTodos()"
              class="text-xs font-semibold text-slate-500 hover:underline"
            >
              Desmarcar Ida/Volta
            </button>
            <span class="text-slate-300">|</span>
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalApagarTudoEvento()"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
              title="Apagar todos os utensílios desta proposta"
            >
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Apagar Tudo</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-clean">
            <thead>
              <tr>
                <th class="w-14 text-center" title="Conferido ao carregar para o evento">Ida</th>
                <th class="w-14 text-center" title="Conferido no retorno pós-evento">Volta</th>
                <th>Utensílio / Equipamento de Bar</th>
                <th class="text-center w-32" title="Quantidade total necessária para este evento">Necessário</th>
                <th class="text-center w-32" title="Quantidade que você já tem separada/disponível">Tenho</th>
                <th>Status / Pendência</th>
                <th class="text-center w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                if (itensFiltrados.length === 0) {
                  return `<tr><td colspan="7" class="text-center py-10 text-slate-400">Nenhum utensílio encontrado para os filtros aplicados.</td></tr>`;
                }

                const grupos = {};
                itensFiltrados.forEach((it) => {
                  const cat = (it.categoria || 'Outros').trim();
                  if (!grupos[cat]) grupos[cat] = [];
                  grupos[cat].push(it);
                });

                const categorias = Object.keys(grupos).sort((a, b) => {
                  if (a === 'Outros') return 1;
                  if (b === 'Outros') return -1;
                  return a.localeCompare(b, 'pt-BR');
                });

                return categorias
                  .map((cat) => {
                    const itensCat = grupos[cat].sort((a, b) =>
                      (a.descricao || '').localeCompare(b.descricao || '', 'pt-BR')
                    );

                    const pendentesCat = itensCat.filter((i) => this.itemPossuiPendencia(i, 'quantidade')).length;

                    const headerCat = `
                      <tr class="bg-slate-100/90 border-y-2 border-slate-200">
                        <td colspan="7" class="py-2 px-4">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                              <span class="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                              <span class="text-xs font-bold uppercase tracking-wider text-slate-800">${this.esc(cat)}</span>
                              <span class="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
                                ${itensCat.length} ${itensCat.length === 1 ? 'item' : 'itens'}
                              </span>
                              ${
                                pendentesCat > 0
                                  ? `<span class="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">${pendentesCat} a completar / pendente</span>`
                                  : ''
                              }
                            </div>
                            <span class="text-[11px] text-slate-500 font-medium">
                              ${itensCat.filter((i) => i.conferidoIda).length}/${itensCat.length} ida • ${
                                itensCat.filter((i) => i.conferidoVolta).length
                              }/${itensCat.length} volta
                            </span>
                          </div>
                        </td>
                      </tr>
                    `;

                    const linhasItens = itensCat
                      .map((it) => {
                        const nec = Math.max(1, Math.round(Number(it.quantidade) || 1));
                        const tenho = it.qtdTenho !== undefined ? Math.max(0, Math.round(Number(it.qtdTenho) || 0)) : nec;
                        const temPendencia = Boolean(it.pendente) || tenho < nec;
                        const temFator = Boolean(it.temFator !== undefined ? it.temFator : it.porBartender);
                        const fator = temFator ? Math.max(1, Math.round(Number(it.fatorBartender || 1))) : 0;

                        const rowBg = it.conferidoVolta
                          ? 'bg-emerald-50/40'
                          : temPendencia
                            ? 'bg-amber-50/35'
                            : it.conferidoIda
                              ? 'bg-blue-50/30'
                              : '';

                        return `
                          <tr class="${rowBg}">
                            <td class="text-center">
                              <input
                                type="checkbox"
                                ${it.conferidoIda ? 'checked' : ''}
                                onchange="Aba7Utensilios.toggleCheckIda('${this.esc(it.id)}', this.checked)"
                                class="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                title="Marcar como conferido para levar ao evento"
                              />
                            </td>
                            <td class="text-center">
                              <input
                                type="checkbox"
                                ${it.conferidoVolta ? 'checked' : ''}
                                onchange="Aba7Utensilios.toggleCheckVolta('${this.esc(it.id)}', this.checked)"
                                class="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                title="Marcar como devolvido no retorno"
                              />
                            </td>
                            <td>
                              <div class="font-bold text-slate-900 text-sm ${it.conferidoVolta ? 'line-through text-slate-500' : ''}">
                                ${this.esc(it.descricao)}
                              </div>
                              <div class="flex flex-wrap items-center gap-1.5 mt-1">
                                <span class="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                                  ${this.esc(it.categoria)}
                                </span>
                                <button
                                  type="button"
                                  onclick="Aba7Utensilios.toggleFatorItem('${this.esc(it.id)}')"
                                  class="inline-flex items-center gap-1 text-[11px] font-bold ${
                                    temFator
                                      ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100'
                                      : 'text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200'
                                  } px-1.5 py-0.5 rounded transition"
                                  title="${
                                    temFator
                                      ? `Fator: ${fator} ${this.esc(it.unidade)} por bartender (${fator} × ${qtdBartenders} bar = ${nec} ${this.esc(it.unidade)}). Clique para mudar para sem fator.`
                                      : 'Item de uso coletivo por toda a equipe (sem fator). Clique para ativar fator por bartender.'
                                  }"
                                >
                                  <i data-lucide="${temFator ? 'users' : 'shield'}" class="w-3 h-3"></i>
                                  <span>${temFator ? `Fator: ${fator} ${this.esc(it.unidade)}/bar` : 'Sem Fator • Equipe'}</span>
                                </button>
                                ${
                                  it.observacoes
                                    ? `<span class="text-xs text-slate-600">• ${this.esc(it.observacoes)}</span>`
                                    : ''
                                }
                              </div>
                            </td>
                            <td class="text-center whitespace-nowrap">
                              <div class="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  value="${nec}"
                                  onchange="Aba7Utensilios.atualizarQuantidadeEvento('${this.esc(it.id)}', this.value)"
                                  class="w-16 text-center text-xs font-extrabold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg py-1 px-1.5"
                                  title="Quantidade necessária para este evento"
                                />
                                <span class="text-xs text-slate-500">${this.esc(it.unidade)}</span>
                              </div>
                            </td>
                            <td class="text-center whitespace-nowrap">
                              <div class="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value="${tenho}"
                                  onchange="Aba7Utensilios.atualizarQtdTenhoEvento('${this.esc(it.id)}', this.value)"
                                  class="w-16 text-center text-xs font-extrabold rounded-lg py-1 px-1.5 border ${
                                    tenho < nec
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : 'bg-white text-slate-800 border-slate-300'
                                  }"
                                  title="Quantos você tem disponíveis/separados (Ex: tenho 1 de 3)"
                                />
                                <span class="text-xs text-slate-500">${this.esc(it.unidade)}</span>
                              </div>
                            </td>
                            <td>
                              ${this.renderBadgeSituacao(it, 'quantidade', false)}
                            </td>
                            <td class="text-center whitespace-nowrap">
                              <div class="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onclick="Aba7Utensilios.salvarItemIndividualNoGlobal('${this.esc(it.id)}')"
                                  class="p-1.5 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                                  title="Salvar este utensílio no Acervo Global permanente"
                                >
                                  <i data-lucide="cloud-upload" class="w-4 h-4"></i>
                                </button>
                                <button
                                  type="button"
                                  onclick="Aba7Utensilios.abrirModalUtensilio('${this.esc(it.id)}')"
                                  class="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                  title="Editar utensílio"
                                >
                                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                                </button>
                                <button
                                  type="button"
                                  onclick="Aba7Utensilios.duplicarUtensilio('${this.esc(it.id)}')"
                                  class="p-1.5 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                                  title="Duplicar utensílio"
                                >
                                  <i data-lucide="copy" class="w-4 h-4"></i>
                                </button>
                                <button
                                  type="button"
                                  onclick="Aba7Utensilios.excluirUtensilio('${this.esc(it.id)}')"
                                  class="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                  title="Excluir utensílio desta proposta"
                                >
                                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        `;
                      })
                      .join('');

                    return headerCat + linhasItens;
                  })
                  .join('');
              })()}
            </tbody>
          </table>
        </div>

        <!-- Rodapé da tabela -->
        <div class="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <i data-lucide="wrench" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-xs font-bold text-slate-800 block">Ajuste livremente a necessidade desta proposta</span>
              <span class="text-[11px] text-slate-500">Alterações feitas aqui afetam apenas este evento — seu Ambiente Global permanece intacto.</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalApagarTudoEvento()"
              class="btn-secondary border-red-300 bg-red-50 text-red-700 hover:bg-red-100 py-2 px-3 text-xs font-bold flex items-center gap-1.5"
              title="Apagar todos os utensílios desta proposta"
            >
              <i data-lucide="trash-2" class="w-4 h-4 text-red-600"></i>
              <span>Apagar Tudo</span>
            </button>
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalSalvarNoGlobal('${this.esc(proposta.id)}')"
              class="btn-secondary border-blue-300 text-blue-900 py-2 px-3 text-xs font-bold flex items-center gap-1.5"
              title="Salvar os utensílios desta proposta no Acervo Global permanente"
            >
              <i data-lucide="cloud-upload" class="w-4 h-4 text-blue-600"></i>
              <span>Salvar no Acervo Global</span>
            </button>
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalImportarParaProposta('${this.esc(proposta.id)}')"
              class="btn-secondary border-indigo-300 text-indigo-900 py-2 px-3 text-xs font-bold"
            >
              <i data-lucide="import" class="w-4 h-4 text-indigo-600"></i>
              <span>Importar do Global</span>
            </button>
            <button
              type="button"
              onclick="Aba7Utensilios.abrirModalUtensilio()"
              class="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Adicionar Utensílio</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ==================== BUSCA E FILTROS ====================

  atualizarFiltroTexto(valor) {
    this.filtroTexto = valor || '';
    const btnLimpar = document.getElementById('btn-limpar-busca-utensilios');
    if (btnLimpar) {
      btnLimpar.style.display = this.filtroTexto ? '' : 'none';
    }
    const area = document.getElementById('utensilios-area-resultados');
    if (area) {
      area.innerHTML = this.renderConteudoDinamico();
      if (window.lucide) window.lucide.createIcons();
    }
  },

  limparBusca() {
    this.filtroTexto = '';
    this.render();
    const input = document.getElementById('input-busca-utensilios');
    if (input) input.focus();
  },

  limparTodosFiltros() {
    this.filtroTexto = '';
    this.filtroCategoria = 'TODAS';
    this.filtroStatus = 'TODOS';
    this.render();
  },

  selecionarProposta(id) {
    this.propostaSelecionadaId = id;
    this.modoAmbiente = 'EVENTO';
    this.render();
  },

  filtrarCategoria(cat) {
    this.filtroCategoria = cat;
    this.render();
  },

  filtrarStatus(status) {
    this.filtroStatus = status;
    this.render();
  },

  // ==================== AÇÕES INLINE: AMBIENTE GLOBAL ====================

  atualizarQtdBaseGlobal(itemId, valorRaw) {
    const num = Number(valorRaw);
    if (!Number.isFinite(num) || num < 1) {
      App.mostrarToast('A quantidade base deve ser de pelo menos 1.', 'warning');
      this.render();
      return;
    }
    const item = (Store.state.utensiliosPadrao || []).find((u) => u.id === itemId);
    if (!item) return;

    item.quantidadeBase = Math.round(num);
    const temFator = Boolean(item.temFator !== undefined ? item.temFator : item.porBartender);
    if (temFator) {
      item.fatorBartender = Math.round(num);
    }
    Store.save();
    this.render();
  },

  alterarBartendersEvento(propostaId, valorRaw) {
    const prop = (Store.state.propostas || []).find((p) => p.id === propostaId);
    if (!prop) return;
    const num = Math.max(1, Math.round(Number(valorRaw) || 1));
    prop.qtdBartenders = num;

    // Sincroniza também no serviço de bartender da lista de serviços da proposta se houver
    if (Array.isArray(prop.servicos)) {
      const srvBartender = prop.servicos.find((s) => {
        const ref = (Store.state.servicos || []).find((x) => x.id === s.servicoId);
        return ref && (ref.descricao || '').toLowerCase().includes('bartender');
      });
      if (srvBartender) {
        srvBartender.quantidade = num;
      }
    }

    Store.recalcularUtensiliosPropostaPorBartenders(propostaId, num);
    Store.save();
    this.render();
    App.mostrarToast(`Equipe atualizada para ${num} bartender${num > 1 ? 's' : ''}! Utensílios com fator recalculados.`);
  },

  sincronizarComAcervoGlobal() {
    if (!this.propostaSelecionadaId) return;
    const total = Store.sincronizarUtensiliosComAcervoGlobal(this.propostaSelecionadaId);
    this.render();
    App.mostrarToast(
      total > 0
        ? `${total} utensílio(s) sincronizado(s) com as quantidades do Acervo Global!`
        : 'As quantidades (Tenho) já estão 100% atualizadas com o Acervo Global.'
    );
  },

  toggleFatorItem(itemId) {
    if (this.modoAmbiente === 'GLOBAL') {
      const item = (Store.state.utensiliosPadrao || []).find((u) => u.id === itemId);
      if (!item) return;
      const novoFator = !item.temFator && !item.porBartender;
      item.temFator = novoFator;
      item.porBartender = novoFator;
      if (novoFator && (!item.fatorBartender || item.fatorBartender <= 0)) {
        item.fatorBartender = Math.max(1, Math.round(Number(item.quantidadeBase) || 1));
      }
      Store.save();
      this.render();
      App.mostrarToast(
        novoFator
          ? `"${item.descricao}" configurado com fator de ${item.fatorBartender} ${item.unidade}/bartender.`
          : `"${item.descricao}" configurado como sem fator (uso da equipe toda).`
      );
    } else {
      if (!this.propostaSelecionadaId) return;
      const chk = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
      if (!chk) return;
      const item = (chk.itens || []).find((i) => i.id === itemId);
      if (!item) return;
      const prop = (Store.state.propostas || []).find((p) => p.id === this.propostaSelecionadaId);
      const bartenders = Store.calcularBartendersProposta(prop);

      const novoFator = !item.temFator && !item.porBartender;
      item.temFator = novoFator;
      item.porBartender = novoFator;
      if (novoFator) {
        if (!item.fatorBartender || item.fatorBartender <= 0) {
          const deduzido = Math.max(1, Math.round((Number(item.quantidade) || 1) / bartenders));
          item.fatorBartender = deduzido;
        }
        item.quantidade = Math.max(1, Math.round(item.fatorBartender * bartenders));
      }
      Store.save();
      this.render();
      App.mostrarToast(
        novoFator
          ? `"${item.descricao}" agora tem fator de ${item.fatorBartender} ${item.unidade}/bar (${item.quantidade} ${item.unidade} para ${bartenders} bartenders).`
          : `"${item.descricao}" agora é sem fator (uso da equipe toda).`
      );
    }
  },

  atualizarQtdTenhoGlobal(itemId, valorRaw) {
    const num = Number(valorRaw);
    if (!Number.isFinite(num) || num < 0) {
      App.mostrarToast('A quantidade em acervo não pode ser negativa.', 'warning');
      this.render();
      return;
    }
    const item = (Store.state.utensiliosPadrao || []).find((u) => u.id === itemId);
    if (!item) return;

    item.qtdTenho = Math.round(num);
    Store.save();
    this.render();
  },

  alternarRegraBartenderGlobal(itemId) {
    const item = (Store.state.utensiliosPadrao || []).find((u) => u.id === itemId);
    if (!item) return;
    item.porBartender = !item.porBartender;
    Store.save();
    this.render();
  },

  alternarPendenteGlobal(itemId) {
    const item = (Store.state.utensiliosPadrao || []).find((u) => u.id === itemId);
    if (!item) return;
    item.pendente = !item.pendente;
    Store.save();
    this.render();
  },

  completarItemGlobal(itemId) {
    const item = (Store.state.utensiliosPadrao || []).find((u) => u.id === itemId);
    if (!item) return;
    item.qtdTenho = Math.max(1, Math.round(Number(item.quantidadeBase) || 1));
    item.pendente = false;
    Store.save();
    this.render();
    App.mostrarToast(`"${item.descricao}" marcado como completo no acervo!`);
  },

  // ==================== AÇÕES INLINE: CHECKLIST DO EVENTO ====================

  atualizarQuantidadeEvento(itemId, valorRaw) {
    if (!this.propostaSelecionadaId) return;
    const num = Number(valorRaw);
    if (!Number.isFinite(num) || num < 1) {
      App.mostrarToast('A quantidade necessária deve ser de pelo menos 1.', 'warning');
      this.render();
      return;
    }
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    const item = (checklist.itens || []).find((i) => i.id === itemId);
    if (!item) return;

    const qtdAntiga = Math.max(1, Math.round(Number(item.quantidade) || 1));
    const novaQtd = Math.round(num);
    // Se reduziu a necessidade e antes estava completo (qtdTenho === qtdAntiga), acompanha para baixo
    if (novaQtd < qtdAntiga && item.qtdTenho === qtdAntiga) {
      item.qtdTenho = novaQtd;
    }
    item.quantidade = novaQtd;

    const temFator = Boolean(item.temFator !== undefined ? item.temFator : item.porBartender);
    if (temFator) {
      const prop = (Store.state.propostas || []).find((p) => p.id === this.propostaSelecionadaId);
      const bartenders = Store.calcularBartendersProposta(prop);
      item.fatorBartender = Math.max(1, Math.round(novaQtd / bartenders));
    }

    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    this.render();
  },

  atualizarQtdTenhoEvento(itemId, valorRaw) {
    if (!this.propostaSelecionadaId) return;
    const num = Number(valorRaw);
    if (!Number.isFinite(num) || num < 0) {
      App.mostrarToast('A quantidade disponível não pode ser negativa.', 'warning');
      this.render();
      return;
    }
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    const item = (checklist.itens || []).find((i) => String(i.id) === String(itemId));
    if (!item) return;

    item.qtdTenho = Math.round(num);
    item.qtdTenhoManual = true;
    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    this.render();
  },

  alternarPendenteEvento(itemId) {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    const item = (checklist.itens || []).find((i) => String(i.id) === String(itemId));
    if (!item) return;

    item.pendente = !item.pendente;
    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    this.render();
  },

  completarItemEvento(itemId) {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    const item = (checklist.itens || []).find((i) => String(i.id) === String(itemId));
    if (!item) return;

    item.qtdTenho = Math.max(1, Math.round(Number(item.quantidade) || 1));
    item.qtdTenhoManual = true;
    item.pendente = false;
    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    this.render();
    App.mostrarToast(`"${item.descricao}" marcado como completo (${item.qtdTenho}/${item.quantidade})!`);
  },

  toggleCheckIda(itemId, checked) {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    const item = (checklist.itens || []).find((i) => i.id === itemId);
    if (item) {
      item.conferidoIda = checked;
      Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
      this.render();
    }
  },

  toggleCheckVolta(itemId, checked) {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    const item = (checklist.itens || []).find((i) => i.id === itemId);
    if (item) {
      item.conferidoVolta = checked;
      Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
      this.render();
    }
  },

  marcarTodosIda(status) {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    (checklist.itens || []).forEach((i) => {
      i.conferidoIda = status;
    });
    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    this.render();
    App.mostrarToast(status ? 'Todos os utensílios marcados para saída (ida)!' : 'Conferência de saída desmarcada.');
  },

  marcarTodosVolta(status) {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    (checklist.itens || []).forEach((i) => {
      i.conferidoVolta = status;
    });
    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    this.render();
    App.mostrarToast(status ? 'Todos os utensílios conferidos no retorno (volta)!' : 'Devolução desmarcada.');
  },

  desmarcarTodos() {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    (checklist.itens || []).forEach((i) => {
      i.conferidoIda = false;
      i.conferidoVolta = false;
    });
    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    this.render();
    App.mostrarToast('Conferência de ida/volta zerada.');
  },

  limparListaEvento() {
    this.abrirModalApagarTudoEvento();
  },

  abrirModalApagarTudoEvento() {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist || !checklist.itens?.length) {
      App.mostrarToast('A lista de utensílios desta proposta já está vazia.', 'warning');
      return;
    }

    const proposta = (Store.state.propostas || []).find((p) => p.id === this.propostaSelecionadaId);
    const nomeEvento = proposta ? proposta.nomeEvento : 'esta proposta';
    const total = checklist.itens.length;

    const modalHtml = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
          <div class="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-red-950">Apagar Todos os Utensílios?</h3>
                <p class="text-[11px] text-red-700 font-medium">${total} utensílio(s) em "${this.esc(nomeEvento)}"</p>
              </div>
            </div>
            <button type="button" onclick="App.fecharModal()" class="text-red-400 hover:text-red-700 p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <p class="text-xs text-slate-700 leading-relaxed">
              Tem certeza que deseja <strong>apagar todos os ${total} utensílios</strong> do checklist de
              <strong>"${this.esc(nomeEvento)}"</strong>?
            </p>
            <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <i data-lucide="shield-check" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5"></i>
              <span>Seu <strong>Ambiente Global (Acervo Base)</strong> permanecerá 100% intacto. Apenas a lista deste cliente será esvaziada.</span>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onclick="App.fecharModal()"
                class="btn-secondary py-2 px-4 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onclick="Aba7Utensilios.confirmarApagarTudoEvento()"
                class="py-2 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
                <span>Sim, Apagar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
    if (window.lucide) window.lucide.createIcons();
  },

  confirmarApagarTudoEvento() {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    checklist.itens = [];
    checklist.inicializado = true;
    checklist.limpoManualmente = true;
    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    App.fecharModal();
    this.render();
    App.mostrarToast('Todos os utensílios desta proposta foram apagados!');
  },

  resetarKitPadrao() {
    if (!this.propostaSelecionadaId) return;
    if (
      !confirm(
        'Deseja reimportar todos os utensílios do Ambiente Global dimensionados para esta proposta? Alterações manuais serão substituídas.'
      )
    )
      return;

    Store.resetarChecklistUtensiliosParaPadrao(this.propostaSelecionadaId);
    this.render();
    App.mostrarToast('Utensílios reimportados do Ambiente Global!');
  },

  // ==================== GERENCIADOR DE CATEGORIAS (CRIAR, EDITAR, EXCLUIR) ====================

  abrirModalCategorias(contextoRetorno = null) {
    if (contextoRetorno) {
      this.retornoModalUtensilio = contextoRetorno;
    }
    this.categoriaEditandoIdx = null;
    this.renderizarModalCategorias();
  },

  abrirCategoriasDeDentroDoModalUtensilio(modoModal) {
    const rascunho = {
      modoModal,
      id: document.getElementById('modal-utensilio-id')?.value || '',
      descricao: document.getElementById('modal-utensilio-descricao')?.value || '',
      categoria: document.getElementById('modal-utensilio-categoria')?.value || '',
      unidade: document.getElementById('modal-utensilio-unidade')?.value || 'un',
      quantidade: document.getElementById('modal-utensilio-qtd')?.value || 1,
      qtdTenho: document.getElementById('modal-utensilio-tenho')?.value ?? 1,
      pendente: document.getElementById('modal-utensilio-pendente')?.checked || false,
      porBartender: document.getElementById('modal-utensilio-por-bartender')?.checked || false,
      conferidoIda: document.getElementById('modal-utensilio-ida')?.checked || false,
      conferidoVolta: document.getElementById('modal-utensilio-volta')?.checked || false,
      observacoes: document.getElementById('modal-utensilio-obs')?.value || ''
    };
    this.abrirModalCategorias(rascunho);
  },

  fecharModalCategorias() {
    const rascunho = this.retornoModalUtensilio;
    this.retornoModalUtensilio = null;
    this.categoriaEditandoIdx = null;

    if (rascunho) {
      if (rascunho.modoModal === 'GLOBAL') {
        this.abrirModalUtensilioGlobal(rascunho.id || null, rascunho);
      } else {
        this.abrirModalUtensilio(rascunho.id || null, rascunho);
      }
      return;
    }

    App.fecharModal();
  },

  renderizarModalCategorias() {
    const categorias = this.obterCategorias();

    const linhasHtml = categorias
      .map((cat, idx) => {
        const uso = Store.contarUsoCategoriaUtensilio(cat);
        const editando = this.categoriaEditandoIdx === idx;

        if (editando) {
          return `
            <div class="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-300">
              <input
                type="text"
                id="input-editar-cat-${idx}"
                value="${this.esc(cat)}"
                onkeydown="if(event.key==='Enter'){event.preventDefault();Aba7Utensilios.salvarEdicaoCategoria(${idx});}"
                class="input-minimal text-xs font-semibold flex-1 bg-white"
              />
              <button
                type="button"
                onclick="Aba7Utensilios.salvarEdicaoCategoria(${idx})"
                class="btn-primary py-1.5 px-3 text-xs font-bold shrink-0"
              >
                Salvar
              </button>
              <button
                type="button"
                onclick="Aba7Utensilios.cancelarEdicaoCategoria()"
                class="btn-secondary py-1.5 px-2.5 text-xs shrink-0"
              >
                Cancelar
              </button>
            </div>
          `;
        }

        return `
          <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition">
            <div class="min-w-0">
              <div class="text-xs font-bold text-slate-900 truncate">${this.esc(cat)}</div>
              <div class="text-[11px] text-slate-500">
                ${uso.global} no global • ${uso.propostas} em propostas
              </div>
            </div>
            <div class="inline-flex items-center gap-1 shrink-0">
              <button
                type="button"
                onclick="Aba7Utensilios.iniciarEdicaoCategoria(${idx})"
                class="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                title="Renomear categoria"
              >
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button
                type="button"
                onclick="Aba7Utensilios.excluirCategoriaPorIndice(${idx})"
                class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Excluir categoria"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    const modalHtml = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]">
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <i data-lucide="tags" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">Gerenciar Categorias de Utensílios</h3>
                <p class="text-[11px] text-slate-500">Crie, renomeie ou exclua categorias do Global e das Propostas</p>
              </div>
            </div>
            <button type="button" onclick="Aba7Utensilios.fecharModalCategorias()" class="text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-4 overflow-y-auto">
            <!-- Criar nova categoria -->
            <form onsubmit="Aba7Utensilios.criarCategoriaSubmit(event)" class="flex items-center gap-2">
              <input
                type="text"
                id="input-nova-categoria-utensilio"
                placeholder="Nome da nova categoria (Ex: Taças & Cristais, Elétricos...)"
                class="input-minimal text-xs font-medium flex-1"
              />
              <button type="submit" class="btn-primary py-2 px-3.5 text-xs font-bold shrink-0">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Criar</span>
              </button>
            </form>

            <!-- Lista de categorias -->
            <div class="space-y-2">
              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Categorias Cadastradas (${categorias.length})
              </div>
              <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                ${linhasHtml}
              </div>
            </div>
          </div>

          <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
            <button type="button" onclick="Aba7Utensilios.fecharModalCategorias()" class="btn-primary py-2 px-4 text-xs font-bold">
              Concluir
            </button>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
    if (this.categoriaEditandoIdx !== null) {
      const inp = document.getElementById(`input-editar-cat-${this.categoriaEditandoIdx}`);
      if (inp) inp.focus();
    }
  },

  criarCategoriaSubmit(event) {
    event.preventDefault();
    const inp = document.getElementById('input-nova-categoria-utensilio');
    const nome = inp?.value || '';
    const res = Store.adicionarCategoriaUtensilio(nome);
    if (!res.ok) {
      App.mostrarToast(res.erro, 'warning');
      return;
    }
    if (this.retornoModalUtensilio) {
      this.retornoModalUtensilio.categoria = res.categoria;
    }
    this.render();
    this.renderizarModalCategorias();
    App.mostrarToast(`Categoria "${res.categoria}" criada com sucesso!`);
  },

  iniciarEdicaoCategoria(idx) {
    this.categoriaEditandoIdx = idx;
    this.renderizarModalCategorias();
  },

  cancelarEdicaoCategoria() {
    this.categoriaEditandoIdx = null;
    this.renderizarModalCategorias();
  },

  salvarEdicaoCategoria(idx) {
    const categorias = this.obterCategorias();
    const nomeAntigo = categorias[idx];
    if (!nomeAntigo) return;

    const inp = document.getElementById(`input-editar-cat-${idx}`);
    const nomeNovo = inp?.value || '';
    const res = Store.renomearCategoriaUtensilio(nomeAntigo, nomeNovo);
    if (!res.ok) {
      App.mostrarToast(res.erro, 'warning');
      return;
    }

    if (this.filtroCategoria === nomeAntigo) {
      this.filtroCategoria = res.categoria;
    }
    if (this.retornoModalUtensilio && this.retornoModalUtensilio.categoria === nomeAntigo) {
      this.retornoModalUtensilio.categoria = res.categoria;
    }

    this.categoriaEditandoIdx = null;
    this.render();
    this.renderizarModalCategorias();
    App.mostrarToast(`Categoria atualizada para "${res.categoria}"!`);
  },

  excluirCategoriaPorIndice(idx) {
    const categorias = this.obterCategorias();
    const nomeAlvo = categorias[idx];
    if (!nomeAlvo) return;

    if (categorias.length <= 1) {
      App.mostrarToast('Mantenha pelo menos uma categoria cadastrada.', 'warning');
      return;
    }

    const uso = Store.contarUsoCategoriaUtensilio(nomeAlvo);
    const destinoSugerido =
      categorias.find((c, i) => i !== idx && c.toLowerCase() === 'outros') ||
      categorias.find((_, i) => i !== idx);

    const msgConfirm =
      uso.total > 0
        ? `A categoria "${nomeAlvo}" possui ${uso.total} utensílio(s) vinculado(s). Ao excluir, eles serão movidos automaticamente para "${destinoSugerido}". Deseja continuar?`
        : `Deseja realmente excluir a categoria "${nomeAlvo}"?`;

    if (!confirm(msgConfirm)) return;

    const res = Store.excluirCategoriaUtensilio(nomeAlvo, destinoSugerido);
    if (!res.ok) {
      App.mostrarToast(res.erro, 'error');
      return;
    }

    if (this.filtroCategoria === nomeAlvo) {
      this.filtroCategoria = 'TODAS';
    }
    if (this.retornoModalUtensilio && this.retornoModalUtensilio.categoria === nomeAlvo) {
      this.retornoModalUtensilio.categoria = res.destino;
    }

    this.categoriaEditandoIdx = null;
    this.render();
    this.renderizarModalCategorias();
    App.mostrarToast(`Categoria "${nomeAlvo}" excluída.`);
  },

  // ==================== IMPORTAÇÃO DO AMBIENTE GLOBAL PARA PROPOSTA ====================

  importarTodosRapido(propostaId) {
    const globais = Store.state.utensiliosPadrao || [];
    if (globais.length === 0) {
      App.mostrarToast('O Ambiente Global está vazio. Cadastre utensílios lá primeiro.', 'warning');
      this.alternarModoAmbiente('GLOBAL');
      return;
    }

    const res = Store.importarUtensiliosGlobaisParaProposta(propostaId, {
      dimensionarPorBartenders: true,
      modo: 'MESCLAR'
    });
    if (!res) return;

    this.propostaSelecionadaId = propostaId;
    this.modoAmbiente = 'EVENTO';
    this.render();
    App.mostrarToast(`${res.adicionados} utensílio(s) importados para a proposta! Ajuste a necessidade abaixo.`);
  },

  abrirModalImportarParaProposta(propostaPreId = null, idsPreSelecionados = null) {
    const propostas = Store.state.propostas || [];
    if (propostas.length === 0) {
      App.mostrarToast('Crie e salve uma proposta na Aba 5 antes de importar os utensílios para um evento.', 'warning');
      return;
    }

    const globais = Store.state.utensiliosPadrao || [];
    if (globais.length === 0) {
      App.mostrarToast('Nenhum utensílio cadastrado no Ambiente Global para importar.', 'warning');
      return;
    }

    const destinoId =
      propostaPreId && propostas.some((p) => p.id === propostaPreId)
        ? propostaPreId
        : this.propostaSelecionadaId && propostas.some((p) => p.id === this.propostaSelecionadaId)
          ? this.propostaSelecionadaId
          : propostas[0].id;

    this._estadoModalImportacao = {
      propostaId: destinoId,
      dimensionarPorBartenders: true,
      modo: 'MESCLAR',
      busca: '',
      selecionados: new Set(Array.isArray(idsPreSelecionados) ? idsPreSelecionados : globais.map((u) => u.id))
    };

    this.renderizarModalImportacao();
  },

  renderizarModalImportacao() {
    const st = this._estadoModalImportacao;
    if (!st) return;

    const propostas = Store.state.propostas || [];
    const prop = propostas.find((p) => p.id === st.propostaId) || propostas[0];
    const qtdBartenders = Store.calcularBartendersProposta(prop);
    const checklistDestino = Store.obterChecklistUtensilios(prop.id);
    const itensExistentes = checklistDestino?.itens || [];
    const globais = Store.state.utensiliosPadrao || [];

    const termo = (st.busca || '').toLowerCase().trim();
    const globaisFiltrados = globais.filter((u) => {
      if (!termo) return true;
      return (
        (u.descricao || '').toLowerCase().includes(termo) ||
        (u.categoria || '').toLowerCase().includes(termo)
      );
    });

    const linhasHtml = globaisFiltrados
      .map((ut) => {
        const marcado = st.selecionados.has(ut.id);
        const jaNaProposta = itensExistentes.some(
          (it) =>
            (it.utensilioGlobalId && it.utensilioGlobalId === ut.id) ||
            (it.descricao || '').trim().toLowerCase() === (ut.descricao || '').trim().toLowerCase()
        );
        const qtdBase = Math.max(1, Math.round(Number(ut.quantidadeBase) || 1));
        const qtdCalculada =
          st.dimensionarPorBartenders && ut.porBartender ? Math.max(1, Math.round(qtdBase * qtdBartenders)) : qtdBase;
        const acervo = ut.qtdTenho !== undefined ? Math.max(0, Math.round(Number(ut.qtdTenho) || 0)) : qtdCalculada;
        const vaiFaltar = acervo < qtdCalculada;

        return `
          <label class="flex items-center justify-between gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
            marcado ? 'bg-indigo-50/50 border-indigo-300' : 'bg-white border-slate-200 hover:bg-slate-50'
          }">
            <div class="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                ${marcado ? 'checked' : ''}
                onchange="Aba7Utensilios.toggleItemModalImportacao('${this.esc(ut.id)}', this.checked)"
                class="w-4 h-4 text-indigo-600 rounded"
              />
              <div class="min-w-0">
                <div class="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5 flex-wrap">
                  <span>${this.esc(ut.descricao)}</span>
                  ${
                    jaNaProposta
                      ? `<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">Já na proposta</span>`
                      : ''
                  }
                </div>
                <div class="text-[11px] text-slate-500">
                  ${this.esc(ut.categoria)} • Acervo: ${acervo} ${this.esc(ut.unidade)}
                  ${
                    vaiFaltar
                      ? `<span class="text-amber-700 font-semibold"> (Terá ${acervo} de ${qtdCalculada} → +${
                          qtdCalculada - acervo
                        })</span>`
                      : ''
                  }
                </div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-xs font-extrabold text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                ${qtdCalculada} ${this.esc(ut.unidade)}
              </span>
            </div>
          </label>
        `;
      })
      .join('');

    const modalHtml = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <i data-lucide="import" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold">Importar Utensílios do Ambiente Global</h3>
                <p class="text-[11px] text-indigo-200">Selecione a proposta de destino e os equipamentos desejados</p>
              </div>
            </div>
            <button type="button" onclick="App.fecharModal()" class="text-indigo-200 hover:text-white p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-4 overflow-y-auto">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">1. Proposta de Destino *</label>
                <select
                  onchange="Aba7Utensilios.atualizarCampoModalImportacao('propostaId', this.value)"
                  class="input-minimal text-xs font-semibold"
                >
                  ${propostas
                    .map(
                      (p) =>
                        `<option value="${this.esc(p.id)}" ${p.id === prop.id ? 'selected' : ''}>${this.esc(
                          p.codigo
                        )} • ${this.esc(p.nomeEvento)} (${Store.calcularBartendersProposta(p)} bar)</option>`
                    )
                    .join('')}
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">2. Se já houver itens na proposta</label>
                <select
                  onchange="Aba7Utensilios.atualizarCampoModalImportacao('modo', this.value)"
                  class="input-minimal text-xs font-medium"
                >
                  <option value="MESCLAR" ${st.modo === 'MESCLAR' ? 'selected' : ''}>Adicionar apenas os que faltam (Preservar atuais)</option>
                  <option value="SUBSTITUIR" ${st.modo === 'SUBSTITUIR' ? 'selected' : ''}>Substituir lista da proposta pelos selecionados</option>
                </select>
              </div>
            </div>

            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200 cursor-pointer">
              <input
                type="checkbox"
                ${st.dimensionarPorBartenders ? 'checked' : ''}
                onchange="Aba7Utensilios.atualizarCampoModalImportacao('dimensionarPorBartenders', this.checked)"
                class="w-4 h-4 text-blue-600 rounded"
              />
              <div class="text-xs text-slate-800">
                <strong>Multiplicar utensílios "por Bartender" pela equipe do evento (${qtdBartenders} bartender${
                  qtdBartenders > 1 ? 's' : ''
                })</strong>
                <span class="block text-[11px] text-slate-500">Se desmarcado, importa a quantidade base exata do Global para você ajustar manualmente.</span>
              </div>
            </label>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div class="relative flex-1 min-w-[200px]">
                <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input
                  type="text"
                  id="input-busca-modal-importacao"
                  placeholder="Filtrar utensílios para importar..."
                  value="${this.esc(st.busca)}"
                  oninput="Aba7Utensilios.filtrarBuscaModalImportacao(this.value)"
                  class="input-minimal pl-8 py-1.5 text-xs"
                />
              </div>
              <div class="flex items-center gap-2 text-xs">
                <button type="button" onclick="Aba7Utensilios.selecionarTodosModalImportacao(true)" class="font-bold text-indigo-700 hover:underline">
                  Marcar todos
                </button>
                <span class="text-slate-300">|</span>
                <button type="button" onclick="Aba7Utensilios.selecionarTodosModalImportacao(false)" class="font-semibold text-slate-500 hover:underline">
                  Desmarcar
                </button>
              </div>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
              ${linhasHtml || `<p class="text-center text-xs text-slate-400 py-6">Nenhum utensílio corresponde à busca.</p>`}
            </div>
          </div>

          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <span class="text-xs font-semibold text-slate-600">
              <strong>${st.selecionados.size}</strong> utensílio(s) selecionado(s)
            </span>
            <div class="flex items-center gap-2">
              <button type="button" onclick="App.fecharModal()" class="btn-secondary py-2 px-3 text-xs">
                Cancelar
              </button>
              <button
                type="button"
                onclick="Aba7Utensilios.confirmarImportacaoParaProposta()"
                class="btn-primary bg-indigo-600 hover:bg-indigo-700 py-2 px-4 text-xs font-bold"
              >
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Importar para a Proposta</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
  },

  atualizarCampoModalImportacao(campo, valor) {
    if (!this._estadoModalImportacao) return;
    this._estadoModalImportacao[campo] = valor;
    this.renderizarModalImportacao();
  },

  filtrarBuscaModalImportacao(valor) {
    if (!this._estadoModalImportacao) return;
    this._estadoModalImportacao.busca = valor || '';
    this.renderizarModalImportacao();
    const inp = document.getElementById('input-busca-modal-importacao');
    if (inp) {
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
  },

  toggleItemModalImportacao(id, checked) {
    if (!this._estadoModalImportacao) return;
    if (checked) {
      this._estadoModalImportacao.selecionados.add(id);
    } else {
      this._estadoModalImportacao.selecionados.delete(id);
    }
    this.renderizarModalImportacao();
  },

  selecionarTodosModalImportacao(marcar) {
    if (!this._estadoModalImportacao) return;
    if (marcar) {
      (Store.state.utensiliosPadrao || []).forEach((u) => this._estadoModalImportacao.selecionados.add(u.id));
    } else {
      this._estadoModalImportacao.selecionados.clear();
    }
    this.renderizarModalImportacao();
  },

  confirmarImportacaoParaProposta() {
    const st = this._estadoModalImportacao;
    if (!st) return;

    if (st.selecionados.size === 0) {
      App.mostrarToast('Selecione pelo menos 1 utensílio para importar.', 'warning');
      return;
    }

    const res = Store.importarUtensiliosGlobaisParaProposta(st.propostaId, {
      idsSelecionados: Array.from(st.selecionados),
      dimensionarPorBartenders: st.dimensionarPorBartenders,
      modo: st.modo
    });

    if (!res) {
      App.mostrarToast('Não foi possível importar para a proposta selecionada.', 'error');
      return;
    }

    this.propostaSelecionadaId = st.propostaId;
    this.modoAmbiente = 'EVENTO';
    this._estadoModalImportacao = null;
    App.fecharModal();
    this.render();

    if (res.adicionados === 0 && res.ignorados > 0) {
      App.mostrarToast('Todos os utensílios selecionados já estavam na proposta!', 'info');
    } else {
      App.mostrarToast(`${res.adicionados} utensílio(s) importado(s)! Agora ajuste as necessidades do evento.`);
    }
  },

  // ==================== SALVAR UTENSÍLIOS DA PROPOSTA NO ACERVO GLOBAL ====================

  salvarItemIndividualNoGlobal(itemId) {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;
    const item = (checklist.itens || []).find((i) => i.id === itemId);
    if (!item) return;

    const res = Store.exportarUtensiliosPropostaParaGlobal(this.propostaSelecionadaId, {
      idsSelecionados: [itemId],
      atualizarExistentes: true
    });

    this.render();
    if (res.adicionados > 0) {
      App.mostrarToast(`"${item.descricao}" salvo com sucesso no Acervo Global!`);
    } else if (res.atualizados > 0) {
      App.mostrarToast(`"${item.descricao}" atualizado no Acervo Global!`);
    } else {
      App.mostrarToast(`"${item.descricao}" já consta no Acervo Global!`);
    }
  },

  abrirModalSalvarNoGlobal(propostaPreId = null) {
    const propostas = Store.state.propostas || [];
    const propId =
      propostaPreId && propostas.some((p) => p.id === propostaPreId)
        ? propostaPreId
        : this.propostaSelecionadaId && propostas.some((p) => p.id === this.propostaSelecionadaId)
          ? this.propostaSelecionadaId
          : propostas[0]?.id || null;

    if (!propId) {
      App.mostrarToast('Selecione uma proposta com utensílios.', 'warning');
      return;
    }

    const checklist = Store.obterChecklistUtensilios(propId);
    const itens = checklist?.itens || [];
    if (itens.length === 0) {
      App.mostrarToast('Esta proposta não possui nenhum utensílio no checklist para salvar.', 'warning');
      return;
    }

    this._estadoModalSalvarGlobal = {
      propostaId: propId,
      atualizarExistentes: false,
      busca: '',
      selecionados: new Set(itens.map((i) => i.id))
    };

    this.renderizarModalSalvarNoGlobal();
  },

  renderizarModalSalvarNoGlobal() {
    const st = this._estadoModalSalvarGlobal;
    if (!st) return;

    const propostas = Store.state.propostas || [];
    const prop = propostas.find((p) => p.id === st.propostaId);
    if (!prop) return;

    const checklist = Store.obterChecklistUtensilios(prop.id);
    const itens = checklist?.itens || [];
    const globais = Store.state.utensiliosPadrao || [];

    const termo = (st.busca || '').toLowerCase().trim();
    const itensFiltrados = itens.filter((it) => {
      if (!termo) return true;
      return (
        (it.descricao || '').toLowerCase().includes(termo) ||
        (it.categoria || '').toLowerCase().includes(termo)
      );
    });

    let countNovos = 0;
    let countExistentes = 0;

    const linhasHtml = itensFiltrados
      .map((it) => {
        const marcado = st.selecionados.has(it.id);
        const jaNoGlobal = globais.some(
          (u) =>
            (it.utensilioGlobalId && u.id === it.utensilioGlobalId) ||
            String(u.descricao || '').trim().toLowerCase() === String(it.descricao || '').trim().toLowerCase()
        );

        if (marcado) {
          if (jaNoGlobal) countExistentes++;
          else countNovos++;
        }

        return `
          <label class="flex items-center justify-between gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
            marcado ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'
          }">
            <div class="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                ${marcado ? 'checked' : ''}
                onchange="Aba7Utensilios.toggleItemModalSalvarGlobal('${this.esc(it.id)}', this.checked)"
                class="w-4 h-4 text-blue-600 rounded"
              />
              <div class="min-w-0">
                <div class="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5 flex-wrap">
                  <span>${this.esc(it.descricao)}</span>
                  ${
                    jaNoGlobal
                      ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Já existe no Global</span>`
                      : `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">★ Novo no Global</span>`
                  }
                </div>
                <div class="text-[11px] text-slate-500">
                  Categoria: ${this.esc(it.categoria)} • Tenho: ${it.qtdTenho !== undefined ? it.qtdTenho : it.quantidade} ${this.esc(it.unidade)}
                  ${it.observacoes ? ` • ${this.esc(it.observacoes)}` : ''}
                </div>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-xs font-extrabold text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                ${it.quantidade} ${this.esc(it.unidade)}
              </span>
            </div>
          </label>
        `;
      })
      .join('');

    const modalHtml = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <i data-lucide="cloud-upload" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold">Salvar Utensílios no Acervo Global</h3>
                <p class="text-[11px] text-slate-300">
                  Exportar checklist de <strong>${this.esc(prop.nomeEvento)}</strong> para o acervo permanente
                </p>
              </div>
            </div>
            <button type="button" onclick="App.fecharModal()" class="text-slate-400 hover:text-white p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-4 overflow-y-auto">
            <div class="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <div class="font-bold flex items-center gap-1.5">
                <i data-lucide="info" class="w-3.5 h-3.5 text-blue-600"></i>
                <span>Economize tempo cadastrando uma única vez</span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Todos os utensílios marcados abaixo serão copiados diretamente para o seu <strong>Ambiente Global</strong>. Assim, eles estarão sempre disponíveis para qualquer evento futuro sem precisar cadastrar tudo de novo!
              </p>
            </div>

            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                ${st.atualizarExistentes ? 'checked' : ''}
                onchange="Aba7Utensilios.atualizarCampoModalSalvarGlobal('atualizarExistentes', this.checked)"
                class="w-4 h-4 text-blue-600 rounded"
              />
              <div class="text-xs text-slate-800">
                <strong>Atualizar utensílios que já existem no Acervo Global</strong>
                <span class="block text-[11px] text-slate-500">Se marcado, atualiza a quantidade base e observações dos itens que já constam no global. Se desmarcado, mantém os itens existentes e cadastra apenas os novos.</span>
              </div>
            </label>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div class="relative flex-1 min-w-[200px]">
                <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input
                  type="text"
                  id="input-busca-modal-salvar-global"
                  placeholder="Filtrar utensílios deste evento..."
                  value="${this.esc(st.busca)}"
                  oninput="Aba7Utensilios.filtrarBuscaModalSalvarGlobal(this.value)"
                  class="input-minimal pl-8 py-1.5 text-xs"
                />
              </div>
              <div class="flex items-center gap-2 text-xs">
                <button type="button" onclick="Aba7Utensilios.selecionarTodosModalSalvarGlobal(true)" class="font-bold text-blue-700 hover:underline">
                  Marcar todos
                </button>
                <span class="text-slate-300">|</span>
                <button type="button" onclick="Aba7Utensilios.selecionarTodosModalSalvarGlobal(false)" class="font-semibold text-slate-500 hover:underline">
                  Desmarcar
                </button>
              </div>
            </div>

            <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
              ${linhasHtml || `<p class="text-center text-xs text-slate-400 py-6">Nenhum utensílio corresponde à busca.</p>`}
            </div>
          </div>

          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span class="text-xs font-semibold text-slate-600">
              <strong>${st.selecionados.size}</strong> selecionado(s)
              <span class="text-slate-400 font-normal">(${countNovos} novos • ${countExistentes} existentes)</span>
            </span>
            <div class="flex items-center gap-2">
              <button type="button" onclick="App.fecharModal()" class="btn-secondary py-2 px-3 text-xs">
                Cancelar
              </button>
              <button
                type="button"
                onclick="Aba7Utensilios.confirmarSalvarNoGlobal()"
                class="btn-primary py-2 px-4 text-xs font-bold"
              >
                <i data-lucide="cloud-upload" class="w-4 h-4"></i>
                <span>Salvar no Acervo Global</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
  },

  atualizarCampoModalSalvarGlobal(campo, valor) {
    if (!this._estadoModalSalvarGlobal) return;
    this._estadoModalSalvarGlobal[campo] = valor;
    this.renderizarModalSalvarNoGlobal();
  },

  filtrarBuscaModalSalvarGlobal(valor) {
    if (!this._estadoModalSalvarGlobal) return;
    this._estadoModalSalvarGlobal.busca = valor || '';
    this.renderizarModalSalvarNoGlobal();
    const inp = document.getElementById('input-busca-modal-salvar-global');
    if (inp) {
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
  },

  toggleItemModalSalvarGlobal(id, checked) {
    if (!this._estadoModalSalvarGlobal) return;
    if (checked) {
      this._estadoModalSalvarGlobal.selecionados.add(id);
    } else {
      this._estadoModalSalvarGlobal.selecionados.delete(id);
    }
    this.renderizarModalSalvarNoGlobal();
  },

  selecionarTodosModalSalvarGlobal(marcar) {
    if (!this._estadoModalSalvarGlobal) return;
    const propId = this._estadoModalSalvarGlobal.propostaId;
    const checklist = Store.obterChecklistUtensilios(propId);
    const itens = checklist?.itens || [];
    if (marcar) {
      itens.forEach((it) => this._estadoModalSalvarGlobal.selecionados.add(it.id));
    } else {
      this._estadoModalSalvarGlobal.selecionados.clear();
    }
    this.renderizarModalSalvarNoGlobal();
  },

  confirmarSalvarNoGlobal() {
    const st = this._estadoModalSalvarGlobal;
    if (!st) return;

    if (st.selecionados.size === 0) {
      App.mostrarToast('Selecione pelo menos 1 utensílio para salvar no Acervo Global.', 'warning');
      return;
    }

    const res = Store.exportarUtensiliosPropostaParaGlobal(st.propostaId, {
      idsSelecionados: Array.from(st.selecionados),
      atualizarExistentes: st.atualizarExistentes
    });

    this._estadoModalSalvarGlobal = null;
    App.fecharModal();
    this.render();

    const partes = [];
    if (res.adicionados > 0) partes.push(`${res.adicionados} novo(s)`);
    if (res.atualizados > 0) partes.push(`${res.atualizados} atualizado(s)`);
    if (res.mantidos > 0) partes.push(`${res.mantidos} já existiam`);

    App.mostrarToast(
      `Utensílios salvos no Acervo Global com sucesso! (${partes.join(', ')} • Total no acervo: ${res.total})`
    );
  },

  // ==================== MODAL DE UTENSÍLIO: AMBIENTE GLOBAL ====================

  abrirModalUtensilioGlobal(itemId = null, rascunho = null) {
    const item = itemId ? (Store.state.utensiliosPadrao || []).find((i) => i.id === itemId) : null;
    const categorias = this.obterCategorias();

    const descricao = rascunho ? rascunho.descricao : item ? item.descricao : '';
    const categoriaAtual = rascunho ? rascunho.categoria : item?.categoria || categorias[0];
    const unidade = rascunho ? rascunho.unidade : item ? item.unidade : 'un';
    const qtdBase = rascunho ? Number(rascunho.quantidade) || 1 : item ? item.quantidadeBase : 1;
    const qtdTenho =
      rascunho && rascunho.qtdTenho !== undefined
        ? Number(rascunho.qtdTenho)
        : item && item.qtdTenho !== undefined
          ? item.qtdTenho
          : qtdBase;
    const temFator = rascunho
      ? Boolean(rascunho.temFator !== undefined ? rascunho.temFator : rascunho.porBartender)
      : item
        ? Boolean(item.temFator !== undefined ? item.temFator : item.porBartender)
        : false;
    const fatorBartender = rascunho && rascunho.fatorBartender !== undefined
      ? Math.max(1, Math.round(Number(rascunho.fatorBartender) || 1))
      : item && item.fatorBartender !== undefined && item.fatorBartender > 0
        ? Math.max(1, Math.round(Number(item.fatorBartender)))
        : item && item.quantidadeBase
          ? Math.max(1, Math.round(Number(item.quantidadeBase)))
          : 1;
    const porBartender = temFator;
    const pendente = rascunho ? Boolean(rascunho.pendente) : item ? Boolean(item.pendente) : false;
    const observacoes = rascunho ? rascunho.observacoes : item ? item.observacoes || '' : '';

    const modalHtml = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <i data-lucide="globe" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  ${item ? 'Editar Utensílio do Ambiente Global' : 'Novo Utensílio no Ambiente Global'}
                </h3>
                <p class="text-[11px] text-slate-500">Fica salvo permanentemente para importar em qualquer proposta</p>
              </div>
            </div>
            <button type="button" onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="Aba7Utensilios.salvarUtensilioGlobal(event)" class="p-6 space-y-4">
            <input type="hidden" id="modal-utensilio-id" value="${item ? this.esc(item.id) : ''}" />

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Nome do Utensílio / Equipamento *</label>
              <input
                type="text"
                id="modal-utensilio-descricao"
                required
                value="${this.esc(descricao)}"
                placeholder="Ex: Coqueteleira Boston Inox, Tapete de Balcão, Caixa Térmica..."
                class="input-minimal text-sm font-medium"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700">Categoria *</label>
                  <button
                    type="button"
                    onclick="Aba7Utensilios.abrirCategoriasDeDentroDoModalUtensilio('GLOBAL')"
                    class="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    + Gerenciar
                  </button>
                </div>
                <select id="modal-utensilio-categoria" class="input-minimal text-xs font-medium">
                  ${categorias
                    .map(
                      (cat) =>
                        `<option value="${this.esc(cat)}" ${categoriaAtual === cat ? 'selected' : ''}>${this.esc(
                          cat
                        )}</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Unidade *</label>
                <input
                  type="text"
                  id="modal-utensilio-unidade"
                  required
                  value="${this.esc(unidade)}"
                  oninput="Aba7Utensilios.atualizarPreviewCompletarModal()"
                  placeholder="Ex: un, kit, jogo, peça"
                  class="input-minimal text-xs"
                />
              </div>
            </div>

            <!-- Regra de Fator por Bartender ou Uso da Equipe -->
            <div class="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70 space-y-3">
              <div class="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Regra de Uso no Bar</span>
                <span id="badge-tipo-regra" class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  temFator ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                }">
                  ${temFator ? 'Multiplica por Bartender' : 'Sem Fator (Equipe Toda Usa)'}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label class="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                  temFator ? 'bg-white border-indigo-400 shadow-xs' : 'bg-white/60 border-slate-200 opacity-80'
                }">
                  <input
                    type="radio"
                    name="modal-regra-fator"
                    id="modal-radio-com-fator"
                    value="COM_FATOR"
                    ${temFator ? 'checked' : ''}
                    onchange="Aba7Utensilios.alternarRegraFatorModal(true)"
                    class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div class="text-xs font-bold text-slate-900">Com Fator p/ Bartender</div>
                    <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Multiplica pelo nº de bartenders (ex: coqueteleira, tapete, dosador, pinça).
                    </p>
                  </div>
                </label>

                <label class="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                  !temFator ? 'bg-white border-indigo-400 shadow-xs' : 'bg-white/60 border-slate-200 opacity-80'
                }">
                  <input
                    type="radio"
                    name="modal-regra-fator"
                    id="modal-radio-sem-fator"
                    value="SEM_FATOR"
                    ${!temFator ? 'checked' : ''}
                    onchange="Aba7Utensilios.alternarRegraFatorModal(false)"
                    class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div class="text-xs font-bold text-slate-900">Sem Fator (Uso da Equipe)</div>
                    <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Toda a equipe usa em conjunto (ex: caixa térmica, tábua, cooler).
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Campo Único de Quantidade + Quantidade no Acervo -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label id="lbl-modal-utensilio-qtd" class="block text-xs font-semibold text-slate-700 mb-1">
                  ${temFator ? 'Fator por Bartender *' : 'Quantidade Fixa p/ o Evento *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  id="modal-utensilio-qtd"
                  value="${temFator ? fatorBartender : qtdBase}"
                  oninput="Aba7Utensilios.atualizarPreviewCompletarModal()"
                  class="input-minimal text-xs font-bold text-blue-700"
                />
                <span id="hint-modal-utensilio-qtd" class="text-[10px] text-slate-500 block mt-1">
                  ${temFator ? 'Quantas unidades cada bartender precisa para trabalhar' : 'Quantidade total fixa que a equipe toda usa'}
                </span>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Quantidade que Tenho no Acervo *</label>
                <input
                  type="number"
                  min="0"
                  required
                  id="modal-utensilio-tenho"
                  value="${qtdTenho}"
                  oninput="Aba7Utensilios.atualizarPreviewCompletarModal()"
                  class="input-minimal text-xs font-bold text-slate-900"
                />
                <span class="text-[10px] text-slate-500 block mt-1">Saldo físico disponível hoje no seu acervo</span>
              </div>
            </div>

            <div id="modal-preview-completar" class="rounded-xl p-3 text-xs"></div>

            <div class="pt-1">
              <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  id="modal-utensilio-pendente"
                  ${pendente ? 'checked' : ''}
                  onchange="Aba7Utensilios.atualizarPreviewCompletarModal()"
                  class="w-4 h-4 text-amber-600 rounded"
                />
                <span><strong>Deixar marcado como Pendente</strong> (ex: precisa comprar, repor ou manutenção)</span>
              </label>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Observações / Detalhes</label>
              <input
                type="text"
                id="modal-utensilio-obs"
                value="${this.esc(observacoes)}"
                placeholder="Ex: Inox 30cm, verificar vedação, guardar na caixa azul..."
                class="input-minimal text-xs"
              />
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onclick="App.fecharModal()" class="btn-secondary py-2 px-3 text-xs">
                Cancelar
              </button>
              <button type="submit" class="btn-primary py-2 px-4 text-xs font-bold">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>${item ? 'Salvar no Ambiente Global' : 'Cadastrar no Ambiente Global'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
    this.atualizarPreviewCompletarModal();
  },

  salvarUtensilioGlobal(event) {
    event.preventDefault();
    const id = document.getElementById('modal-utensilio-id')?.value;
    const descricao = document.getElementById('modal-utensilio-descricao')?.value.trim();
    const categoria = document.getElementById('modal-utensilio-categoria')?.value || 'Outros';
    const unidade = document.getElementById('modal-utensilio-unidade')?.value.trim() || 'un';
    const qtdDigitada = Number(document.getElementById('modal-utensilio-qtd')?.value);
    const tenhoBruto = Number(document.getElementById('modal-utensilio-tenho')?.value);
    const regraFator = document.querySelector('input[name="modal-regra-fator"]:checked')?.value || 'SEM_FATOR';
    const temFator = regraFator === 'COM_FATOR';
    const pendente = document.getElementById('modal-utensilio-pendente')?.checked || false;
    const observacoes = document.getElementById('modal-utensilio-obs')?.value.trim() || '';

    if (!descricao) {
      App.mostrarToast('Informe o nome do utensílio.', 'error');
      return;
    }
    if (!Number.isFinite(qtdDigitada) || qtdDigitada < 1) {
      App.mostrarToast('A quantidade / fator deve ser de pelo menos 1.', 'error');
      return;
    }
    if (!Number.isFinite(tenhoBruto) || tenhoBruto < 0) {
      App.mostrarToast('A quantidade em acervo não pode ser negativa.', 'error');
      return;
    }

    const fatorBartender = temFator ? Math.max(1, Math.round(qtdDigitada)) : 0;
    const quantidadeBase = Math.max(1, Math.round(qtdDigitada));
    const qtdTenho = Math.round(tenhoBruto);

    if (!Array.isArray(Store.state.utensiliosPadrao)) {
      Store.state.utensiliosPadrao = [];
    }

    if (id) {
      const idx = Store.state.utensiliosPadrao.findIndex((u) => u.id === id);
      if (idx !== -1) {
        Store.state.utensiliosPadrao[idx] = {
          ...Store.state.utensiliosPadrao[idx],
          descricao,
          categoria,
          unidade,
          quantidadeBase,
          qtdTenho,
          temFator,
          porBartender: temFator,
          fatorBartender,
          pendente,
          observacoes
        };
        App.mostrarToast('Utensílio atualizado no Ambiente Global!');
      }
    } else {
      Store.state.utensiliosPadrao.push({
        id: `ut-global-${Date.now()}`,
        descricao,
        categoria,
        unidade,
        quantidadeBase,
        qtdTenho,
        temFator,
        porBartender: temFator,
        fatorBartender,
        pendente,
        observacoes
      });
      App.mostrarToast('Utensílio salvo no Ambiente Global!');
    }

    Store.save();
    App.fecharModal();
    this.render();
  },

  duplicarUtensilioGlobal(itemId) {
    const item = (Store.state.utensiliosPadrao || []).find((i) => i.id === itemId);
    if (!item) return;

    const clone = {
      ...JSON.parse(JSON.stringify(item)),
      id: `ut-global-${Date.now()}`,
      descricao: `${item.descricao} (Cópia)`
    };

    Store.state.utensiliosPadrao.push(clone);
    Store.save();
    this.render();
    App.mostrarToast('Utensílio duplicado no Ambiente Global!');
  },

  excluirUtensilioGlobal(itemId) {
    const item = (Store.state.utensiliosPadrao || []).find((i) => i.id === itemId);
    if (!item) return;

    if (!confirm(`Deseja realmente excluir "${item.descricao}" do Ambiente Global?`)) return;

    Store.state.utensiliosPadrao = Store.state.utensiliosPadrao.filter((i) => i.id !== itemId);
    Store.save();
    this.render();
    App.mostrarToast('Utensílio removido do Ambiente Global.');
  },

  // ==================== MODAL DE UTENSÍLIO: CHECKLIST DO EVENTO ====================

  atualizarPreviewCompletarModal() {
    const box = document.getElementById('modal-preview-completar');
    if (!box) return;

    const regraFator = document.querySelector('input[name="modal-regra-fator"]:checked')?.value || 'SEM_FATOR';
    const temFator = regraFator === 'COM_FATOR';
    const inputQtd = document.getElementById('modal-utensilio-qtd');
    const valorDigitado = Math.max(1, Math.round(Number(inputQtd?.value) || 1));
    const un = this.esc(document.getElementById('modal-utensilio-unidade')?.value.trim() || 'un');
    const hintQtd = document.getElementById('hint-modal-utensilio-qtd');

    let bartenders = 1;
    let nec = valorDigitado;
    let descFator = '';

    if (this.modoAmbiente === 'EVENTO' && this.propostaSelecionadaId) {
      const prop = (Store.state.propostas || []).find((p) => p.id === this.propostaSelecionadaId);
      bartenders = Store.calcularBartendersProposta(prop);
      if (temFator) {
        nec = Math.max(1, Math.round(valorDigitado * bartenders));
        descFator = ` <span class="text-indigo-800 font-normal">(${valorDigitado} ${un}/bar × ${bartenders} bartenders = ${nec} ${un})</span>`;
        if (hintQtd) {
          hintQtd.innerHTML = `Total no evento: <strong>${nec} ${un}</strong> (${valorDigitado} ${un} × ${bartenders} bartenders)`;
        }
      } else {
        nec = valorDigitado;
        descFator = ` <span class="text-slate-600 font-normal">(Sem fator • Uso da equipe toda)</span>`;
        if (hintQtd) {
          hintQtd.textContent = 'Quantidade fixa necessária para a equipe toda no evento';
        }
      }
    } else {
      // AMBIENTE GLOBAL
      if (temFator) {
        descFator = ` <span class="text-indigo-800 font-normal">(Fator: ${valorDigitado} ${un}/bartender)</span>`;
        if (hintQtd) {
          hintQtd.textContent = `Cada bartender precisará de ${valorDigitado} ${un} para trabalhar`;
        }
      } else {
        descFator = ` <span class="text-slate-600 font-normal">(Sem fator • Uso coletivo da equipe)</span>`;
        if (hintQtd) {
          hintQtd.textContent = 'Quantidade fixa necessária para a equipe toda';
        }
      }
    }

    const tenhoRaw = Number(document.getElementById('modal-utensilio-tenho')?.value);
    const tenho = Number.isFinite(tenhoRaw) && tenhoRaw >= 0 ? Math.round(tenhoRaw) : 0;
    const pendente = document.getElementById('modal-utensilio-pendente')?.checked || false;
    const faltam = Math.max(0, nec - tenho);

    if (faltam > 0) {
      box.className = 'rounded-xl p-3 text-xs font-semibold bg-amber-50 border border-amber-300 text-amber-900';
      box.innerHTML = `⚠️ De <strong>${nec} ${un}</strong>${descFator}, você tem <strong>${tenho} ${un}</strong> — precisa de <strong>+${faltam} ${un}</strong>.`;
    } else if (pendente) {
      box.className = 'rounded-xl p-3 text-xs font-semibold bg-amber-50 border border-amber-300 text-amber-900';
      box.innerHTML = `⏳ Quantidade informada (${tenho}/${nec} ${un})${descFator}, porém o item ficará sinalizado como <strong>Pendente</strong>.`;
    } else {
      box.className = 'rounded-xl p-3 text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800';
      box.innerHTML = `✅ Quantidade completa (<strong>${tenho} de ${nec} ${un}</strong> disponíveis)${descFator}.`;
    }
  },

  alternarRegraFatorModal(comFator) {
    const badge = document.getElementById('badge-tipo-regra');
    const radioCom = document.getElementById('modal-radio-com-fator');
    const radioSem = document.getElementById('modal-radio-sem-fator');
    const lblQtd = document.getElementById('lbl-modal-utensilio-qtd');
    if (radioCom) radioCom.checked = comFator;
    if (radioSem) radioSem.checked = !comFator;
    if (badge) {
      badge.textContent = comFator ? 'Multiplica por Bartender' : 'Sem Fator (Equipe Toda Usa)';
      badge.className = `text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        comFator ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
      }`;
    }

    if (lblQtd) {
      lblQtd.textContent = comFator
        ? 'Fator por Bartender *'
        : (this.modoAmbiente === 'GLOBAL' ? 'Quantidade Fixa p/ o Evento *' : 'Quantidade Necessária no Evento *');
    }

    this.atualizarPreviewCompletarModal();
  },

  abrirModalUtensilio(itemId = null, rascunho = null) {
    if (!this.propostaSelecionadaId) {
      App.mostrarToast('Selecione um evento primeiro.', 'error');
      return;
    }
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;
    const item = itemId ? (checklist.itens || []).find((i) => i.id === itemId) : null;
    const categorias = this.obterCategorias();
    const prop = (Store.state.propostas || []).find((p) => p.id === this.propostaSelecionadaId);
    const bartenders = Store.calcularBartendersProposta(prop);

    const descricao = rascunho ? rascunho.descricao : item ? item.descricao : '';
    const categoriaAtual = rascunho ? rascunho.categoria : item?.categoria || categorias[0];
    const unidade = rascunho ? rascunho.unidade : item ? item.unidade : 'un';
    const quantidade = rascunho ? Number(rascunho.quantidade) || 1 : item ? item.quantidade : 1;
    const qtdTenho =
      rascunho && rascunho.qtdTenho !== undefined
        ? Number(rascunho.qtdTenho)
        : item && item.qtdTenho !== undefined
          ? item.qtdTenho
          : quantidade;
    const temFator = rascunho
      ? Boolean(rascunho.temFator !== undefined ? rascunho.temFator : rascunho.porBartender)
      : item
        ? Boolean(item.temFator !== undefined ? item.temFator : item.porBartender)
        : false;
    let fatorBartender = rascunho && rascunho.fatorBartender !== undefined
      ? Math.max(1, Math.round(Number(rascunho.fatorBartender) || 1))
      : item && item.fatorBartender !== undefined && item.fatorBartender > 0
        ? Math.max(1, Math.round(Number(item.fatorBartender)))
        : item && item.quantidade
          ? Math.max(1, Math.round(Number(item.quantidade) / bartenders))
          : 1;

    const pendente = rascunho ? Boolean(rascunho.pendente) : item ? Boolean(item.pendente) : false;
    const conferidoIda = rascunho ? Boolean(rascunho.conferidoIda) : Boolean(item?.conferidoIda);
    const conferidoVolta = rascunho ? Boolean(rascunho.conferidoVolta) : Boolean(item?.conferidoVolta);
    const observacoes = rascunho ? rascunho.observacoes : item ? item.observacoes || '' : '';

    const modalHtml = `
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <i data-lucide="${item ? 'edit-3' : 'plus-circle'}" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  ${item ? 'Editar Utensílio da Proposta' : 'Adicionar Utensílio à Proposta'}
                </h3>
                <p class="text-[11px] text-slate-500">Defina a necessidade, quantos você tem e se há pendência</p>
              </div>
            </div>
            <button type="button" onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="Aba7Utensilios.salvarUtensilio(event)" class="p-6 space-y-4">
            <input type="hidden" id="modal-utensilio-id" value="${item ? this.esc(item.id) : ''}" />

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Nome do Utensílio / Equipamento *</label>
              <input
                type="text"
                id="modal-utensilio-descricao"
                required
                value="${this.esc(descricao)}"
                placeholder="Ex: Coqueteleira Boston Inox, Tapete de Balcão, Caixa Térmica..."
                class="input-minimal text-sm font-medium"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700">Categoria *</label>
                  <button
                    type="button"
                    onclick="Aba7Utensilios.abrirCategoriasDeDentroDoModalUtensilio('EVENTO')"
                    class="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    + Gerenciar
                  </button>
                </div>
                <select id="modal-utensilio-categoria" class="input-minimal text-xs font-medium">
                  ${categorias
                    .map(
                      (cat) =>
                        `<option value="${this.esc(cat)}" ${categoriaAtual === cat ? 'selected' : ''}>${this.esc(
                          cat
                        )}</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Unidade *</label>
                <input
                  type="text"
                  id="modal-utensilio-unidade"
                  required
                  value="${this.esc(unidade)}"
                  oninput="Aba7Utensilios.atualizarPreviewCompletarModal()"
                  placeholder="Ex: un, kit, jogo, peça"
                  class="input-minimal text-xs"
                />
              </div>
            </div>

            <!-- Regra de Fator por Bartender ou Uso da Equipe -->
            <div class="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70 space-y-3">
              <div class="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Regra de Uso no Evento</span>
                <span id="badge-tipo-regra" class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  temFator ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                }">
                  ${temFator ? 'Multiplica por Bartender' : 'Sem Fator (Equipe Toda Usa)'}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label class="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                  temFator ? 'bg-white border-indigo-400 shadow-xs' : 'bg-white/60 border-slate-200 opacity-80'
                }">
                  <input
                    type="radio"
                    name="modal-regra-fator"
                    id="modal-radio-com-fator"
                    value="COM_FATOR"
                    ${temFator ? 'checked' : ''}
                    onchange="Aba7Utensilios.alternarRegraFatorModal(true)"
                    class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div class="text-xs font-bold text-slate-900">Com Fator p/ Bartender</div>
                    <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Multiplica pelos ${bartenders} bartenders (ex: coqueteleira, tapete, dosador, pinça).
                    </p>
                  </div>
                </label>

                <label class="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                  !temFator ? 'bg-white border-indigo-400 shadow-xs' : 'bg-white/60 border-slate-200 opacity-80'
                }">
                  <input
                    type="radio"
                    name="modal-regra-fator"
                    id="modal-radio-sem-fator"
                    value="SEM_FATOR"
                    ${!temFator ? 'checked' : ''}
                    onchange="Aba7Utensilios.alternarRegraFatorModal(false)"
                    class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div class="text-xs font-bold text-slate-900">Sem Fator (Uso da Equipe)</div>
                    <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Toda a equipe usa em conjunto (ex: caixa térmica, tábua, cooler).
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Campo Único de Quantidade + Saldo no Evento -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label id="lbl-modal-utensilio-qtd" class="block text-xs font-semibold text-slate-700 mb-1">
                  ${temFator ? 'Fator por Bartender *' : 'Quantidade Necessária no Evento *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  id="modal-utensilio-qtd"
                  value="${temFator ? (fatorBartender || Math.max(1, Math.round(quantidade / bartenders))) : quantidade}"
                  oninput="Aba7Utensilios.atualizarPreviewCompletarModal()"
                  class="input-minimal text-xs font-bold text-blue-700"
                />
                <span id="hint-modal-utensilio-qtd" class="text-[10px] text-slate-500 block mt-1">
                  ${temFator ? `Multiplica pelos ${bartenders} bartenders no evento` : 'Quantidade fixa para a equipe toda'}
                </span>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Quantidade que Tenho *</label>
                <input
                  type="number"
                  min="0"
                  required
                  id="modal-utensilio-tenho"
                  value="${qtdTenho}"
                  oninput="Aba7Utensilios.atualizarPreviewCompletarModal()"
                  class="input-minimal text-xs font-bold text-slate-900"
                />
                <span class="text-[10px] text-slate-500 block mt-1">Disponível para este evento</span>
              </div>
            </div>

            <div id="modal-preview-completar" class="rounded-xl p-3 text-xs"></div>

            <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label class="inline-flex items-center gap-2 text-xs font-semibold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  id="modal-utensilio-pendente"
                  ${pendente ? 'checked' : ''}
                  onchange="Aba7Utensilios.atualizarPreviewCompletarModal()"
                  class="w-4 h-4 text-amber-600 rounded"
                />
                <span>Deixar marcado como Pendente</span>
              </label>

              <div class="flex items-center gap-3">
                <label class="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" id="modal-utensilio-ida" ${conferidoIda ? 'checked' : ''} class="w-3.5 h-3.5 text-blue-600 rounded" />
                  <span>Saída OK</span>
                </label>
                <label class="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" id="modal-utensilio-volta" ${conferidoVolta ? 'checked' : ''} class="w-3.5 h-3.5 text-emerald-600 rounded" />
                  <span>Retorno OK</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Observações / Detalhes de Estado</label>
              <input
                type="text"
                id="modal-utensilio-obs"
                value="${this.esc(observacoes)}"
                placeholder="Ex: Alugar +2 unidades, pegar emprestado, caixa vermelha #2..."
                class="input-minimal text-xs"
              />
            </div>

            ${
              !item
                ? `
              <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                <input type="checkbox" id="modal-utensilio-salvar-global" class="w-4 h-4 text-blue-600 rounded" />
                <span>Salvar este utensílio também no <strong>Ambiente Global</strong> para futuros eventos</span>
              </label>
            `
                : ''
            }

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onclick="App.fecharModal()" class="btn-secondary py-2 px-3 text-xs">
                Cancelar
              </button>
              <button type="submit" class="btn-primary py-2 px-4 text-xs font-bold">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>${item ? 'Salvar Alterações' : 'Adicionar Utensílio'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
    this.atualizarPreviewCompletarModal();
  },

  salvarUtensilio(event) {
    event.preventDefault();
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    const id = document.getElementById('modal-utensilio-id')?.value;
    const descricao = document.getElementById('modal-utensilio-descricao')?.value.trim();
    const categoria = document.getElementById('modal-utensilio-categoria')?.value || 'Outros';
    const unidade = document.getElementById('modal-utensilio-unidade')?.value.trim() || 'un';
    const qtdDigitada = Number(document.getElementById('modal-utensilio-qtd')?.value);
    const tenhoBruto = Number(document.getElementById('modal-utensilio-tenho')?.value);
    const regraFator = document.querySelector('input[name="modal-regra-fator"]:checked')?.value || 'SEM_FATOR';
    const temFator = regraFator === 'COM_FATOR';
    const pendente = document.getElementById('modal-utensilio-pendente')?.checked || false;
    const conferidoIda = document.getElementById('modal-utensilio-ida')?.checked || false;
    const conferidoVolta = document.getElementById('modal-utensilio-volta')?.checked || false;
    const observacoes = document.getElementById('modal-utensilio-obs')?.value.trim() || '';
    const salvarNoGlobal = document.getElementById('modal-utensilio-salvar-global')?.checked || false;

    if (!descricao) {
      App.mostrarToast('Informe o nome do utensílio.', 'error');
      return;
    }

    if (!Number.isFinite(qtdDigitada) || qtdDigitada < 1) {
      App.mostrarToast('A quantidade / fator deve ser de pelo menos 1.', 'error');
      return;
    }

    if (!Number.isFinite(tenhoBruto) || tenhoBruto < 0) {
      App.mostrarToast('A quantidade disponível não pode ser negativa.', 'error');
      return;
    }

    const prop = (Store.state.propostas || []).find((p) => p.id === this.propostaSelecionadaId);
    const bartenders = Store.calcularBartendersProposta(prop);
    const fatorBartender = temFator ? Math.max(1, Math.round(qtdDigitada)) : 0;
    const quantidade = temFator ? Math.max(1, Math.round(fatorBartender * bartenders)) : Math.round(qtdDigitada);
    const qtdTenho = Math.round(tenhoBruto);

    if (id) {
      const idx = (checklist.itens || []).findIndex((i) => String(i.id) === String(id));
      if (idx !== -1) {
        checklist.itens[idx] = {
          ...checklist.itens[idx],
          descricao,
          categoria,
          unidade,
          quantidade,
          qtdTenho,
          qtdTenhoManual: true,
          temFator,
          porBartender: temFator,
          fatorBartender,
          pendente,
          conferidoIda,
          conferidoVolta,
          observacoes
        };
        App.mostrarToast('Utensílio atualizado com sucesso!');
      }
    } else {
      let globalIdVinculado = '';
      if (salvarNoGlobal) {
        if (!Array.isArray(Store.state.utensiliosPadrao)) Store.state.utensiliosPadrao = [];
        const jaExisteGlobal = Store.state.utensiliosPadrao.find(
          (u) => (u.descricao || '').trim().toLowerCase() === descricao.toLowerCase()
        );
        if (jaExisteGlobal) {
          globalIdVinculado = jaExisteGlobal.id;
        } else {
          globalIdVinculado = `ut-global-${Date.now()}`;
          Store.state.utensiliosPadrao.push({
            id: globalIdVinculado,
            descricao,
            categoria,
            unidade,
            quantidadeBase: temFator ? fatorBartender : quantidade,
            qtdTenho,
            temFator,
            porBartender: temFator,
            fatorBartender: temFator ? fatorBartender : 0,
            pendente: false,
            observacoes
          });
        }
      }

      checklist.itens.push({
        id: `ut-${Date.now()}`,
        utensilioGlobalId: globalIdVinculado,
        descricao,
        categoria,
        unidade,
        quantidade,
        qtdTenho,
        qtdTenhoManual: true,
        temFator,
        porBartender: temFator,
        fatorBartender: temFator ? fatorBartender : 0,
        pendente,
        conferidoIda,
        conferidoVolta,
        observacoes
      });
      App.mostrarToast(
        salvarNoGlobal ? 'Utensílio adicionado à proposta e salvo no Ambiente Global!' : 'Utensílio adicionado à proposta!'
      );
    }

    checklist.inicializado = true;
    checklist.limpoManualmente = checklist.itens.length === 0;
    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    App.fecharModal();
    this.render();
  },

  duplicarUtensilio(itemId) {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    const item = (checklist.itens || []).find((i) => String(i.id) === String(itemId));
    if (!item) return;

    const clone = {
      ...JSON.parse(JSON.stringify(item)),
      id: `ut-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      utensilioGlobalId: '',
      descricao: `${item.descricao} (Cópia)`,
      conferidoIda: false,
      conferidoVolta: false
    };

    checklist.itens.push(clone);
    checklist.inicializado = true;
    checklist.limpoManualmente = false;
    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    this.render();
    App.mostrarToast('Utensílio duplicado com sucesso!');
  },

  excluirUtensilio(itemId) {
    if (!this.propostaSelecionadaId) return;
    const checklist = Store.obterChecklistUtensilios(this.propostaSelecionadaId);
    if (!checklist) return;

    const idAlvo = String(itemId);
    const item = (checklist.itens || []).find((i) => String(i.id) === idAlvo);
    if (!item) return;

    const scrollY = typeof window !== 'undefined' && typeof window.scrollY === 'number' ? window.scrollY : 0;
    checklist.itens = (checklist.itens || []).filter((i) => String(i.id) !== idAlvo);
    checklist.inicializado = true;
    checklist.limpoManualmente = checklist.itens.length === 0;
    Store.salvarChecklistUtensilios(this.propostaSelecionadaId, checklist);
    this.render();
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, scrollY);
    }
    App.mostrarToast(`"${item.descricao}" removido desta proposta.`);
  },

  // ==================== EXPORTAÇÃO EXCEL / CSV & PDF ====================

  exportarUtensiliosExcel() {
    if (this.modoAmbiente === 'GLOBAL') {
      const globais = Store.state.utensiliosPadrao || [];
      const planilha = globais.map((it) => {
        const base = Math.max(1, Number(it.quantidadeBase) || 1);
        const tenho = it.qtdTenho !== undefined ? Math.max(0, Number(it.qtdTenho) || 0) : base;
        const faltam = Math.max(0, base - tenho);
        const situacao =
          faltam > 0
            ? `+${faltam} (${tenho}/${base})`
            : it.pendente
              ? 'PENDENTE'
              : 'OK';

        return {
          Utensilio: it.descricao,
          Categoria: it.categoria,
          QtdBase: base,
          RegraEvento: it.porBartender ? 'Por Bartender' : 'Fixo por Evento',
          TenhoNoAcervo: tenho,
          FaltaCompletar: faltam,
          Unidade: it.unidade,
          Situacao: situacao,
          Observacoes: it.observacoes || ''
        };
      });

      if (window.XLSX) {
        const ws = XLSX.utils.json_to_sheet(planilha);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Acervo_Global');
        XLSX.writeFile(wb, 'Acervo_Global_Utensilios.xlsx');
        App.mostrarToast('Planilha do Acervo Global exportada!');
      } else {
        const csv =
          '\uFEFFUtensilio;Categoria;QtdBase;RegraEvento;TenhoNoAcervo;FaltaCompletar;Unidade;Situacao;Observacoes\n' +
          planilha
            .map(
              (r) =>
                `"${r.Utensilio}";"${r.Categoria}";${r.QtdBase};"${r.RegraEvento}";${r.TenhoNoAcervo};${r.FaltaCompletar};"${r.Unidade}";"${r.Situacao}";"${r.Observacoes}"`
            )
            .join('\n');
        Aba1Insumos.downloadBlob(csv, 'Acervo_Global_Utensilios.csv', 'text/csv;charset=utf-8;');
      }
      return;
    }

    const prop = Store.state.propostas.find((p) => p.id === this.propostaSelecionadaId);
    if (!prop) return;
    const checklist = Store.obterChecklistUtensilios(prop.id);
    if (!checklist) return;

    const planilha = (checklist.itens || []).map((it) => {
      const nec = Math.max(1, Number(it.quantidade) || 1);
      const tenho = it.qtdTenho !== undefined ? Math.max(0, Number(it.qtdTenho) || 0) : nec;
      const faltam = Math.max(0, nec - tenho);
      const situacao =
        faltam > 0
          ? `+${faltam} (${tenho}/${nec})`
          : it.pendente
            ? 'PENDENTE'
            : 'OK';

      return {
        SaidaIda: it.conferidoIda ? 'OK' : 'PENDENTE',
        RetornoVolta: it.conferidoVolta ? 'OK' : 'PENDENTE',
        Utensilio: it.descricao,
        Categoria: it.categoria,
        Necessario: nec,
        Tenho: tenho,
        FaltaCompletar: faltam,
        Unidade: it.unidade,
        Situacao: situacao,
        Observacoes: it.observacoes || ''
      };
    });

    if (window.XLSX) {
      const ws = XLSX.utils.json_to_sheet(planilha);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Utensilios');
      XLSX.writeFile(wb, `Checklist_Utensilios_${prop.codigo}.xlsx`);
      App.mostrarToast('Planilha de Utensílios exportada!');
    } else {
      const csv =
        '\uFEFFSaidaIda;RetornoVolta;Utensilio;Categoria;Necessario;Tenho;FaltaCompletar;Unidade;Situacao;Observacoes\n' +
        planilha
          .map(
            (r) =>
              `${r.SaidaIda};${r.RetornoVolta};"${r.Utensilio}";"${r.Categoria}";${r.Necessario};${r.Tenho};${r.FaltaCompletar};"${r.Unidade}";"${r.Situacao}";"${r.Observacoes}"`
          )
          .join('\n');
      Aba1Insumos.downloadBlob(csv, `Checklist_Utensilios_${prop.codigo}.csv`, 'text/csv;charset=utf-8;');
    }
  },

  exportarUtensiliosPdf() {
    if (this.modoAmbiente === 'GLOBAL') {
      const fakePropostaGlobal = {
        codigo: 'GLOBAL',
        nomeEvento: 'Acervo Global de Utensílios',
        numConvidados: '—',
        dataEvento: new Date().toLocaleDateString('pt-BR'),
        isGlobal: true
      };
      const fakeChecklistGlobal = {
        nomeLista: 'Catálogo & Acervo Global de Utensílios de Bar',
        itens: (Store.state.utensiliosPadrao || []).map((ut) => ({
          ...ut,
          quantidade: ut.quantidadeBase,
          qtdTenho: ut.qtdTenho !== undefined ? ut.qtdTenho : ut.quantidadeBase,
          conferidoIda: false,
          conferidoVolta: false
        }))
      };
      if (window.PdfGenerator && window.PdfGenerator.exportarChecklistUtensilios) {
        window.PdfGenerator.exportarChecklistUtensilios(fakePropostaGlobal, fakeChecklistGlobal);
      } else {
        window.print();
      }
      return;
    }

    const prop = Store.state.propostas.find((p) => p.id === this.propostaSelecionadaId);
    if (!prop) return;
    const checklist = Store.obterChecklistUtensilios(prop.id);
    if (!checklist) return;

    if (window.PdfGenerator && window.PdfGenerator.exportarChecklistUtensilios) {
      window.PdfGenerator.exportarChecklistUtensilios(prop, checklist);
    } else {
      window.print();
    }
  }
};
