// Aba 1: Controle e Cadastro de Produtos / Insumos (Incluindo Insumos Compostos / Produção Própria)

window.Aba1Insumos = {
  filtroTexto: '',
  filtroCategoria: 'TODAS',
  filtroLinha: 'TODAS',
  editandoId: null,
  producaoPropriaTemp: false,
  rendimentoFinalTemp: 1000,
  subReceitaTemp: [],
  fornecedoresTemp: [],
  fornecedorAtivoTemp: 'MENOR_PRECO',
  ultimaUnidadeSelecionadaTemp: 'ml',
  unidadesPadraoFixas: ['ml', 'L', 'g', 'kg', 'un', 'pct', 'cx'],

  esc(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  obterUnidadesMedida(unidadeExtra = null) {
    if (!Array.isArray(Store.state.unidadesMedida) || Store.state.unidadesMedida.length === 0) {
      Store.state.unidadesMedida = [...this.unidadesPadraoFixas];
    }
    this.unidadesPadraoFixas.forEach((padrao) => {
      if (!Store.state.unidadesMedida.some((u) => String(u).toLowerCase() === padrao.toLowerCase())) {
        Store.state.unidadesMedida.push(padrao);
      }
    });
    if (unidadeExtra && unidadeExtra !== '__NOVA_UNIDADE__') {
      const limpo = String(unidadeExtra).trim();
      if (limpo && !Store.state.unidadesMedida.some((u) => String(u).toLowerCase() === limpo.toLowerCase())) {
        Store.state.unidadesMedida.push(limpo);
      }
    }
    return Store.state.unidadesMedida;
  },

  renderOpcoesSelectUnidade(selecionada) {
    const lista = this.obterUnidadesMedida(selecionada);
    const sel = String(selecionada || 'ml').trim();
    const opcoes = lista
      .map((u) => {
        const isSel = String(u).toLowerCase() === sel.toLowerCase();
        return `<option value="${this.esc(u)}" ${isSel ? 'selected' : ''}>${this.esc(u)}</option>`;
      })
      .join('');
    return `${opcoes}<option value="__NOVA_UNIDADE__">+ Criar nova unidade...</option>`;
  },

  renderChipsUnidadesPersonalizadas() {
    const todas = this.obterUnidadesMedida();
    const personalizadas = todas.filter(
      (u) => !this.unidadesPadraoFixas.some((p) => p.toLowerCase() === String(u).toLowerCase())
    );
    if (personalizadas.length === 0) {
      return `<p class="text-[11px] text-slate-500">Unidades padrão ativas: <strong>ml, L, g, kg, un, pct, cx</strong>. As novas unidades criadas ficarão salvas permanentemente aqui.</p>`;
    }
    return `
      <div class="flex flex-wrap items-center gap-1.5 pt-1">
        <span class="text-[11px] font-semibold text-slate-600 mr-1">Unidades criadas:</span>
        ${personalizadas
          .map(
            (u) => `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-blue-800 border border-blue-200 shadow-2xs">
            <span>${this.esc(u)}</span>
            <button
              type="button"
              onclick="Aba1Insumos.excluirUnidadePersonalizadaModal('${this.esc(u)}')"
              class="text-slate-400 hover:text-red-600 ml-0.5 leading-none font-black"
              title="Remover unidade personalizada '${this.esc(u)}'"
            >×</button>
          </span>
        `
          )
          .join('')}
      </div>
    `;
  },

  render() {
    const container = document.getElementById('tab-insumos');
    if (!container) return;

    const categorias = Store.state.categoriasInsumos || [];
    const insumos = this.getInsumosFiltrados();

    const totalItens = Store.state.insumos.length;
    const qtdLinhaA = Store.state.insumos.filter((i) => !i.semLinha && !i.producaoPropria && i.linha === 'A').length;
    const qtdLinhaB = Store.state.insumos.filter((i) => !i.semLinha && !i.producaoPropria && i.linha === 'B').length;
    const qtdLinhaC = Store.state.insumos.filter((i) => !i.semLinha && !i.producaoPropria && i.linha === 'C').length;
    const qtdSemLinha = Store.state.insumos.filter((i) => i.semLinha && !i.producaoPropria).length;
    const qtdProdPropria = Store.state.insumos.filter((i) => i.producaoPropria).length;

    container.innerHTML = `
      <!-- Cabeçalho da Aba -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <i data-lucide="package" class="w-4 h-4"></i>
            <span>Módulo 01 • Suprimentos, Matérias-Primas & Sub-receitas</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Controle e Cadastro de Produtos / Insumos</h1>
          <p class="text-sm text-slate-500 mt-0.5">Gerencie bebidas, matérias-primas, múltiplos fornecedores e crie <strong>Insumos de Produção Própria (Sub-receitas)</strong>.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button onclick="Aba1Insumos.baixarModeloPlanilha()" class="btn-secondary" title="Baixar modelo de planilha para importação">
            <i data-lucide="file-down" class="w-4 h-4 text-slate-600"></i>
            <span>Modelo Planilha</span>
          </button>

          <label class="btn-secondary cursor-pointer" title="Importar insumos ou atualizar estoque via Excel (.xlsx) ou CSV">
            <i data-lucide="upload" class="w-4 h-4 text-blue-600"></i>
            <span>Importar .XLSX / .CSV</span>
            <input type="file" accept=".csv,.xlsx,.xls" class="hidden" onchange="Aba1Insumos.importarPlanilha(event)" />
          </label>

          <button onclick="Aba1Insumos.exportarPlanilhaEstoque()" class="btn-secondary" title="Exportar base de insumos">
            <i data-lucide="download" class="w-4 h-4 text-slate-600"></i>
            <span>Exportar</span>
          </button>

          <button onclick="Aba1Insumos.abrirModalMargemCategorias()" class="btn-secondary border-emerald-300 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 font-semibold" title="Definir margem de lucro de uma só vez por categoria de insumo">
            <i data-lucide="percent" class="w-4 h-4 text-emerald-700"></i>
            <span>Margem por Categoria</span>
          </button>

          <button onclick="Aba1Insumos.abrirModalEscalacao()" class="btn-secondary border-blue-300 bg-blue-50/70 text-blue-800 hover:bg-blue-100 font-semibold" title="Visualizar e definir quais bebidas são as titulares das Linhas A, B e C">
            <i data-lucide="wine" class="w-4 h-4 text-blue-700"></i>
            <span>Escalação de Bebidas</span>
          </button>

          <button onclick="Aba1Insumos.abrirModalInsumo(null, true)" class="btn-secondary border-blue-300 bg-blue-50/70 text-blue-800 hover:bg-blue-100">
            <i data-lucide="flask-conical" class="w-4 h-4 text-blue-700"></i>
            <span>+ Insumo Próprio (Sub-receita)</span>
          </button>

          <button onclick="Aba1Insumos.abrirModalInsumo(null, false)" class="btn-primary">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Novo Insumo</span>
          </button>
        </div>
      </div>

      <!-- Cards de Resumo Rápido e Seletores de Linha -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div
          onclick="Aba1Insumos.selecionarTodosInsumos()"
          class="cursor-pointer bg-white border rounded-xl p-3.5 shadow-sm flex items-center justify-between transition hover:border-blue-400 ${
            this.filtroLinha === 'TODAS' && this.filtroCategoria === 'TODAS' && !this.filtroTexto
              ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/40'
              : 'border-slate-200'
          }"
          title="Clique para selecionar e exibir todos os insumos"
        >
          <div>
            <span class="text-xs font-semibold ${this.filtroLinha === 'TODAS' ? 'text-blue-700' : 'text-slate-500'} block">Todos os Insumos</span>
            <span class="text-xl font-bold text-slate-900">${totalItens}</span>
          </div>
          <div class="w-9 h-9 rounded-lg ${this.filtroLinha === 'TODAS' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'} flex items-center justify-center">
            <i data-lucide="boxes" class="w-5 h-5"></i>
          </div>
        </div>

        <div
          onclick="Aba1Insumos.atualizarFiltroLinha('PROD_PROPRIA')"
          class="cursor-pointer bg-blue-50/60 border rounded-xl p-3.5 shadow-sm flex items-center justify-between transition hover:border-blue-500 ${
            this.filtroLinha === 'PROD_PROPRIA'
              ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-100/70'
              : 'border-blue-200'
          }"
          title="Filtrar Insumos de Produção Própria"
        >
          <div>
            <span class="text-xs text-blue-800 font-semibold block">Produção Própria</span>
            <span class="text-xl font-extrabold text-blue-700">${qtdProdPropria}</span>
          </div>
          <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <i data-lucide="flask-conical" class="w-4 h-4"></i>
          </div>
        </div>

        <div
          onclick="Aba1Insumos.atualizarFiltroLinha('A')"
          class="cursor-pointer bg-white border rounded-xl p-3.5 shadow-sm flex items-center justify-between transition hover:border-blue-400 ${
            this.filtroLinha === 'A'
              ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/40'
              : 'border-slate-200'
          }"
          title="Filtrar Linha A (Premium)"
        >
          <div>
            <span class="text-xs text-slate-500 block">Linha A (Premium)</span>
            <span class="text-xl font-bold text-blue-700">${qtdLinhaA}</span>
          </div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full badge-linha-a">A</span>
        </div>

        <div
          onclick="Aba1Insumos.atualizarFiltroLinha('B')"
          class="cursor-pointer bg-white border rounded-xl p-3.5 shadow-sm flex items-center justify-between transition hover:border-indigo-400 ${
            this.filtroLinha === 'B'
              ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/40'
              : 'border-slate-200'
          }"
          title="Filtrar Linha B (Padrão)"
        >
          <div>
            <span class="text-xs text-slate-500 block">Linha B (Padrão)</span>
            <span class="text-xl font-bold text-indigo-700">${qtdLinhaB}</span>
          </div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full badge-linha-b">B</span>
        </div>

        <div
          onclick="Aba1Insumos.atualizarFiltroLinha('C')"
          class="cursor-pointer bg-white border rounded-xl p-3.5 shadow-sm flex items-center justify-between transition hover:border-slate-500 ${
            this.filtroLinha === 'C'
              ? 'ring-2 ring-slate-700 border-slate-700 bg-slate-100'
              : 'border-slate-200'
          }"
          title="Filtrar Linha C (Econômica)"
        >
          <div>
            <span class="text-xs text-slate-500 block">Linha C (Econômica)</span>
            <span class="text-xl font-bold text-slate-700">${qtdLinhaC}</span>
          </div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full badge-linha-c">C</span>
        </div>

        <div
          onclick="Aba1Insumos.atualizarFiltroLinha('SEM_LINHA')"
          class="cursor-pointer bg-white border rounded-xl p-3.5 shadow-sm flex items-center justify-between transition hover:border-emerald-400 ${
            this.filtroLinha === 'SEM_LINHA'
              ? 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/40'
              : 'border-slate-200'
          }"
          title="Filtrar Insumos Sem Linha (Uso Comum)"
        >
          <div>
            <span class="text-xs text-slate-500 block">Uso Comum / Base</span>
            <span class="text-xl font-bold text-emerald-700">${qtdSemLinha}</span>
          </div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full badge-sem-linha">Comum</span>
        </div>
      </div>

      <!-- Barra de Filtros -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div class="md:col-span-5 relative">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input
              type="text"
              placeholder="Buscar por código, descrição, sub-receita, grupo ou fornecedor..."
              value="${this.filtroTexto}"
              oninput="Aba1Insumos.atualizarFiltroTexto(this.value)"
              class="input-minimal pl-9"
            />
          </div>

          <div class="md:col-span-4">
            <select onchange="Aba1Insumos.atualizarFiltroCategoria(this.value)" class="input-minimal">
              <option value="TODAS" ${this.filtroCategoria === 'TODAS' ? 'selected' : ''}>Todas as Categorias</option>
              ${categorias
                .map((c) => `<option value="${c}" ${this.filtroCategoria === c ? 'selected' : ''}>${c}</option>`)
                .join('')}
            </select>
          </div>

          <div class="md:col-span-3">
            <select onchange="Aba1Insumos.atualizarFiltroLinha(this.value)" class="input-minimal">
              <option value="TODAS" ${this.filtroLinha === 'TODAS' ? 'selected' : ''}>Todas as Linhas / Tipos</option>
              <option value="PROD_PROPRIA" ${this.filtroLinha === 'PROD_PROPRIA' ? 'selected' : ''}>🧪 Produção Própria (Sub-receitas)</option>
              <option value="A" ${this.filtroLinha === 'A' ? 'selected' : ''}>Linha A (Premium)</option>
              <option value="B" ${this.filtroLinha === 'B' ? 'selected' : ''}>Linha B (Padrão)</option>
              <option value="C" ${this.filtroLinha === 'C' ? 'selected' : ''}>Linha C (Econômica)</option>
              <option value="SEM_LINHA" ${this.filtroLinha === 'SEM_LINHA' ? 'selected' : ''}>Insumo Sem Linha (Uso Comum)</option>
            </select>
          </div>
        </div>

        ${
          this.filtroCategoria !== 'TODAS'
            ? (() => {
                const catAtual = this.filtroCategoria;
                const itensCat = (Store.state.insumos || []).filter((i) => i.categoria === catAtual);
                const margemCatSalva = Store.state.margensCategorias?.[catAtual] ?? (itensCat[0]?.margemLucro || 0);
                const qtdIndividuais = itensCat.filter((i) => i.margemIndividualPersonalizada).length;
                return `
                  <div class="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-emerald-50/60 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                    <div class="flex items-center gap-2">
                      <span class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <i data-lucide="percent" class="w-3.5 h-3.5"></i>
                      </span>
                      <div>
                        <span class="text-xs font-bold text-emerald-950 block">
                          Margem Rápida para a categoria "${this.esc(catAtual)}" (${itensCat.length} itens)
                        </span>
                        <span class="text-[11px] text-emerald-800">
                          Altere de uma só vez os itens desta categoria${qtdIndividuais > 0 ? ` • <strong>${qtdIndividuais} item(ns) com ajuste individual</strong>` : ''}.
                        </span>
                      </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <div class="flex items-center gap-1">
                        ${[0, 15, 25, 30, 50, 100]
                          .map(
                            (pct) => `
                          <button
                            type="button"
                            onclick="document.getElementById('input-rapido-margem-cat-filtro').value='${pct}'; Aba1Insumos.aplicarMargemRapidaFiltroCategoria('${this.esc(catAtual)}')"
                            class="px-2 py-1 rounded text-[11px] font-bold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-600 hover:text-white transition"
                          >${pct === 0 ? '0%' : '+' + pct + '%'}</button>
                        `
                          )
                          .join('')}
                      </div>
                      <div class="relative w-24">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          id="input-rapido-margem-cat-filtro"
                          value="${margemCatSalva}"
                          class="input-minimal py-1 pr-6 text-xs font-extrabold text-emerald-950 bg-white border-emerald-400"
                        />
                        <span class="text-xs font-bold text-emerald-700 absolute right-2 top-1/2 -translate-y-1/2">%</span>
                      </div>
                      <button
                        type="button"
                        onclick="Aba1Insumos.aplicarMargemRapidaFiltroCategoria('${this.esc(catAtual)}')"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition"
                      >
                        Aplicar em ${this.esc(catAtual)}
                      </button>
                    </div>
                  </div>
                `;
              })()
            : ''
        }
      </div>

      <!-- Tabela de Insumos -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-clean">
            <thead>
              <tr>
                <th><div class="flex items-center gap-1.5"><i data-lucide="hash" class="w-3.5 h-3.5"></i> Código</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="tag" class="w-3.5 h-3.5"></i> Produto / Insumo / Sub-receita</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="layers" class="w-3.5 h-3.5"></i> Classificação</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="archive" class="w-3.5 h-3.5"></i> Saldo em Estoque</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="calculator" class="w-3.5 h-3.5"></i> Origem de Custo (Fornecedor / Sub-receita)</div></th>
                <th class="text-right"><div class="flex items-center justify-end gap-1.5"><i data-lucide="sliders" class="w-3.5 h-3.5"></i> Ações</div></th>
              </tr>
            </thead>
            <tbody id="tabela-insumos-body">
              ${this.renderLinhasTabela(insumos)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  getInsumosFiltrados() {
    const termo = (this.filtroTexto || '').toLowerCase().trim();
    return (Store.state.insumos || []).filter((item) => {
      if (this.filtroCategoria !== 'TODAS' && item.categoria !== this.filtroCategoria) return false;
      if (this.filtroLinha !== 'TODAS') {
        if (this.filtroLinha === 'PROD_PROPRIA') {
          if (!item.producaoPropria) return false;
        } else if (this.filtroLinha === 'SEM_LINHA') {
          if (!item.semLinha) return false;
        } else {
          if (item.semLinha || item.linha !== this.filtroLinha) return false;
        }
      }
      if (termo) {
        const matchCod = (item.codigo || '').toLowerCase().includes(termo);
        const matchDesc = (item.descricao || '').toLowerCase().includes(termo);
        const matchGrupo = (item.grupoGenerico || '').toLowerCase().includes(termo);
        const matchForn = (item.fornecedores || []).some((f) => (f.nome || '').toLowerCase().includes(termo));
        return matchCod || matchDesc || matchGrupo || matchForn;
      }
      return true;
    });
  },

  renderLinhasTabela(insumos) {
    if (!insumos || insumos.length === 0) {
      return `
        <tr>
          <td colspan="6" class="text-center py-12 text-slate-400">
            <div class="flex flex-col items-center justify-center gap-2">
              <i data-lucide="package-search" class="w-10 h-10 text-slate-300"></i>
              <p class="text-sm font-medium text-slate-600">Nenhum insumo encontrado para os filtros aplicados.</p>
              <button onclick="Aba1Insumos.abrirModalInsumo()" class="text-blue-600 hover:underline text-xs font-semibold mt-1">
                + Cadastrar novo insumo agora
              </button>
            </div>
          </td>
        </tr>
      `;
    }

    return insumos
      .map((item) => {
        const custoInfo = Store.getInsumoCustoInfo(item);
        const volEmb = item.producaoPropria
          ? Number(item.rendimentoFinal) || 1
          : Number(item.volumeEmbalagem) || 1;
        const qtdEmbEstoque = volEmb > 1 ? (Number(item.estoqueAtual) / volEmb).toFixed(1).replace('.0', '') : null;

        let badgeLinha = '';
        if (item.producaoPropria) {
          badgeLinha = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">🧪 Produção Própria</span>`;
        } else if (item.semLinha) {
          badgeLinha = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium badge-sem-linha">Sem Linha • Comum</span>`;
        } else if (item.linha === 'A') {
          badgeLinha = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-linha-a">Linha A • Premium</span>`;
        } else if (item.linha === 'B') {
          badgeLinha = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-linha-b">Linha B • Padrão</span>`;
        } else {
          badgeLinha = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-linha-c">Linha C • Econômica</span>`;
        }

        const qtdFornecedores = (item.fornecedores || []).length;
        const qtdIngredientesSub = (item.subReceita || []).length;

        return `
          <tr>
            <td class="font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">${item.codigo}</td>
            <td>
              <div class="font-semibold text-slate-900 flex items-center gap-1.5">
                <span>${item.descricao}</span>
              </div>
              <div class="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span>${item.categoria}</span>
                <span>•</span>
                <span>${item.producaoPropria ? `Rendimento Receita: ${volEmb} ${item.unidade}` : `Emb: ${volEmb} ${item.unidade}`}</span>
                ${(() => {
                  const grupoGen = item.grupoGenerico || Store.inferirGrupoGenerico(item.descricao, item.categoria);
                  if (!grupoGen) return '';
                  return `
                    <span class="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded text-[11px] font-medium">Vínculo: ${grupoGen}</span>
                    ${
                      !item.semLinha
                        ? item.escalado
                          ? `<button type="button" onclick="Aba1Insumos.escalarBebida('${item.id}')" class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs hover:bg-emerald-200 transition" title="Bebida Titular/Escalada da Linha ${item.linha} para ${grupoGen}"><i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-600"></i> ⭐ Escalada (${item.linha})</button>`
                          : `<button type="button" onclick="Aba1Insumos.escalarBebida('${item.id}')" class="inline-flex items-center gap-1 bg-slate-100 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-medium transition" title="Clique para escalar esta bebida como titular da Linha ${item.linha}"><i data-lucide="arrow-up-circle" class="w-3 h-3"></i> Escalar (${item.linha})</button>`
                        : ''
                    }
                  `;
                })()}
              </div>
            </td>
            <td class="whitespace-nowrap">${badgeLinha}</td>
            <td class="whitespace-nowrap">
              <div class="flex items-center gap-2">
                <div>
                  <span class="font-bold text-slate-900">${Store.formatNumber(item.estoqueAtual)} ${item.unidade}</span>
                  ${
                    qtdEmbEstoque
                      ? `<span class="block text-xs text-slate-500">≈ ${qtdEmbEstoque} ${
                          item.producaoPropria ? 'lotes' : 'emb.'
                        } (${volEmb}${item.unidade})</span>`
                      : ''
                  }
                </div>
              </div>
            </td>
            <td>
              ${
                item.producaoPropria
                  ? `
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-slate-800" title="Custo real de produção (Inventário / Checklist)">${Store.formatCurrency(custoInfo.custoRealEmbalagem ?? custoInfo.precoEmbalagem)}</span>
                    <span class="text-xs text-slate-500">/ lote de ${custoInfo.rendimentoFinal}${item.unidade}</span>
                    <span class="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Custo Real
                    </span>
                  </div>
                  ${
                    custoInfo.margemLucro > 0
                      ? `
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-md" title="Valor final com margem repassado na Proposta do Cliente">
                        💰 Repasse: ${Store.formatCurrency(custoInfo.precoEmbalagem)} (+${Store.formatNumber(custoInfo.margemLucro, 1).replace(',0', '')}%)${item.margemIndividualPersonalizada ? ' • Individual' : ''}
                      </span>
                    </div>
                  `
                      : ''
                  }
                  <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <span>Sub-receita com ${qtdIngredientesSub} insumos base</span>
                  </div>
                </div>
              `
                  : custoInfo.fornecedorAtivo
                  ? `
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-slate-800" title="Custo real de compra no inventário / Checklist">${Store.formatCurrency(custoInfo.custoRealEmbalagem ?? custoInfo.precoEmbalagem)}</span>
                    <span class="text-xs text-slate-500">/ ${custoInfo.tamanhoEmbalagem}${item.unidade}</span>
                    ${
                      custoInfo.menorFornecedor &&
                      custoInfo.fornecedorAtivo.id === custoInfo.menorFornecedor.id
                        ? `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.5 rounded" title="Custo Real no Checklist">★ Custo Real</span>`
                        : `<span class="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-1.5 py-0.5 rounded">Custo Fixado</span>`
                    }
                  </div>
                  ${
                    custoInfo.margemLucro > 0
                      ? `
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-md" title="Valor final com margem repassado na Proposta do Cliente (Lucro: +${Store.formatCurrency(custoInfo.lucroEmbalagem)}/emb.)">
                        💰 Cliente: ${Store.formatCurrency(custoInfo.precoEmbalagem)} (+${Store.formatNumber(custoInfo.margemLucro, 1).replace(',0', '')}%)${item.margemIndividualPersonalizada ? ' • Individual' : ''}
                      </span>
                    </div>
                  `
                      : ''
                  }
                  <div class="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                    <span class="font-medium">${custoInfo.fornecedorAtivo.nome}</span>
                    <span class="text-slate-400">(${qtdFornecedores} forn.)</span>
                  </div>
                </div>
              `
                  : `<span class="text-xs text-slate-400 italic">Sem fornecedor</span>`
              }
            </td>
            <td class="text-right whitespace-nowrap">
              <div class="inline-flex items-center gap-1">
                <button
                  onclick="Aba1Insumos.abrirModalInsumo('${item.id}')"
                  class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Editar Insumo / Sub-receita"
                >
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button
                  onclick="Aba1Insumos.excluirInsumo('${item.id}')"
                  class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Excluir Insumo"
                >
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  },

  atualizarFiltroTexto(val) {
    this.filtroTexto = val;
    const tbody = document.getElementById('tabela-insumos-body');
    if (tbody) {
      tbody.innerHTML = this.renderLinhasTabela(this.getInsumosFiltrados());
      if (window.lucide) window.lucide.createIcons();
    }
  },

  atualizarFiltroCategoria(val) {
    this.filtroCategoria = val;
    this.render();
  },

  atualizarFiltroLinha(val) {
    this.filtroLinha = val;
    this.render();
  },

  selecionarTodosInsumos() {
    this.filtroLinha = 'TODAS';
    this.filtroCategoria = 'TODAS';
    this.filtroTexto = '';
    this.render();
    App.mostrarToast('Exibindo todos os insumos cadastrados.');
  },

  abrirModalInsumo(id = null, iniciarComoProducaoPropria = false) {
    if (window.Store && typeof Store.desduplicarCodigosInsumos === 'function') {
      Store.desduplicarCodigosInsumos();
    }
    const idStr = id ? String(id).trim() : null;
    this.editandoId = idStr;
    const item = idStr ? Store.state.insumos.find((i) => String(i.id) === idStr) : null;

    const codigo = item ? item.codigo : Store.gerarProximoSkuInsumo();
    const descricao = item ? item.descricao : '';
    const unidade = item ? item.unidade : 'ml';
    this.ultimaUnidadeSelecionadaTemp = unidade;
    this.obterUnidadesMedida(unidade);
    const volumeEmbalagem = item ? item.volumeEmbalagem : iniciarComoProducaoPropria ? 1000 : 750;
    const categoria = item
      ? item.categoria
      : iniciarComoProducaoPropria
      ? 'Xaropes & Sub-receitas'
      : Store.state.categoriasInsumos[0] || 'Destilados';
    const estoqueAtual = item ? item.estoqueAtual : 0;
    const semLinha = item ? Boolean(item.semLinha) : iniciarComoProducaoPropria ? true : false;
    const linha = item && !item.semLinha ? item.linha : 'A';
    const grupoGenerico = item ? item.grupoGenerico || '' : '';
    const consumoPorBartender = item
      ? Number(item.consumoPorBartender) || Store.getFatorConsumoPadrao(item)
      : Store.getFatorConsumoPadrao({ unidade, descricao, categoria });

    this.producaoPropriaTemp = item ? Boolean(item.producaoPropria) : Boolean(iniciarComoProducaoPropria);
    this.rendimentoFinalTemp = item
      ? Number(item.rendimentoFinal) || Number(item.volumeEmbalagem) || 1000
      : 1000;

    // Inicializar ingredientes da sub-receita
    const primeiroInsumoBase =
      Store.state.insumos.find((i) => String(i.id) !== String(idStr) && !i.producaoPropria) || Store.state.insumos[0];
    this.subReceitaTemp =
      item && Array.isArray(item.subReceita) && item.subReceita.length > 0
        ? JSON.parse(JSON.stringify(item.subReceita))
        : primeiroInsumoBase
        ? [{ insumoBaseId: primeiroInsumoBase.id, quantidade: 500 }]
        : [];

    this.fornecedorAtivoTemp = item ? item.fornecedorAtivoId || 'MENOR_PRECO' : 'MENOR_PRECO';
    const margemPadraoCat = Number(Store.state.margensCategorias?.[categoria]) || 0;
    this.margemLucroTemp =
      item && Number.isFinite(Number(item.margemLucro)) && Number(item.margemLucro) >= 0
        ? Number(item.margemLucro)
        : margemPadraoCat;
    this.margemAlteradaManualmenteNoModal = Boolean(item?.margemIndividualPersonalizada);
    this.fornecedoresTemp =
      item && item.fornecedores && item.fornecedores.length > 0
        ? JSON.parse(JSON.stringify(item.fornecedores))
        : [{ id: 'f-' + Date.now(), nome: 'Fornecedor Principal', preco: 0, tamanhoEmbalagem: volumeEmbalagem }];

    const categorias = Store.state.categoriasInsumos || [];
    const grupos = Store.state.gruposGenericos || [];

    const unifCfg = (item && item.unificacaoCompraChecklist) || {
      ativo: false,
      insumoBaseId: '',
      rendimentoQtdFruta: 1,
      rendimentoUnidadeFruta: 'un',
      rendimentoMlSuco: 35,
      pesoMedioUnidadeG: 80
    };
    const frutasDisponiveis = (Store.state.insumos || []).filter((i) => String(i.id) !== String(idStr));
    let baseFruitId = unifCfg.insumoBaseId;
    if (!baseFruitId) {
      const match = frutasDisponiveis.find((i) => {
        const d = (i.descricao || '').toLowerCase();
        return (d.includes('limão') || d.includes('limao')) && !d.includes('suco');
      });
      if (match) baseFruitId = match.id;
    }

    const modalHtml = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
          <!-- Campo oculto para garantir persistência do ID na edição -->
          <input type="hidden" id="ins-id" value="${idStr || ''}" />

          <!-- Cabeçalho Modal -->
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <i data-lucide="package-plus" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">${
                  idStr ? 'Editar Produto / Insumo' : 'Cadastrar Novo Produto / Insumo'
                }</h3>
                <p class="text-xs text-slate-500">Cadastre insumos comprados de fornecedores ou <strong>Insumos de Produção Própria (Sub-receitas)</strong>.</p>
              </div>
            </div>
            <button onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Corpo do Formulário -->
          <div class="p-6 max-h-[80vh] overflow-y-auto space-y-5">
            <!-- TOGGLE PRINCIPAL: Insumo de Produção Própria (Sub-receita) -->
            <div class="p-4 rounded-xl border-2 transition ${
              this.producaoPropriaTemp
                ? 'border-blue-600 bg-blue-50/70'
                : 'border-slate-200 bg-slate-50/70'
            } flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-lg ${
                  this.producaoPropriaTemp ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                } flex items-center justify-center shrink-0 mt-0.5">
                  <i data-lucide="flask-conical" class="w-5 h-5"></i>
                </div>
                <div>
                  <label for="ins-producao-propria-toggle" class="text-sm font-bold text-slate-900 cursor-pointer block">
                    Insumo de Produção Própria (Sub-receita)
                  </label>
                  <p class="text-xs text-slate-600 mt-0.5">
                    Marque esta opção para xaropes, espumas, cordiais, infusões ou pré-batching produzidos internamente a partir de outros insumos base.
                  </p>
                </div>
              </div>

              <label class="inline-flex items-center gap-2 cursor-pointer shrink-0 bg-white px-3.5 py-2 rounded-xl border border-slate-300 shadow-sm">
                <input
                  type="checkbox"
                  id="ins-producao-propria-toggle"
                  ${this.producaoPropriaTemp ? 'checked' : ''}
                  onchange="Aba1Insumos.alternarModoProducaoPropria(this.checked)"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span class="text-xs font-bold text-slate-800">Sub-receita Ativa</span>
              </label>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div class="sm:col-span-3">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Código / SKU *</label>
                <input type="text" id="ins-codigo" value="${codigo}" class="input-minimal font-mono" />
              </div>

              <div class="sm:col-span-9">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Descrição do Produto / Insumo *</label>
                <input type="text" id="ins-descricao" value="${descricao}" placeholder="Ex: Xarope Artesanal de Gengibre, Espuma Cítrica, Gin Tanqueray..." class="input-minimal" oninput="Aba1Insumos.aoDigitarDescricao(this.value)" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div class="sm:col-span-4">
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700">Categoria *</label>
                  <button type="button" onclick="Aba1Insumos.criarNovaCategoriaPrompt()" class="text-[11px] font-semibold text-blue-600 hover:underline">+ Nova Categoria</button>
                </div>
                <select id="ins-categoria" class="input-minimal">
                  ${categorias
                    .map((c) => `<option value="${c}" ${c === categoria ? 'selected' : ''}>${c}</option>`)
                    .join('')}
                </select>
              </div>

              <div class="sm:col-span-4">
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700">Unidade de Medida Final *</label>
                  <button
                    type="button"
                    onclick="Aba1Insumos.abrirCriadorUnidadeModal()"
                    class="text-[11px] font-semibold text-blue-600 hover:underline whitespace-nowrap"
                    title="Criar ou gerenciar unidades de medida"
                  >
                    + Nova Unidade
                  </button>
                </div>
                <select id="ins-unidade" onchange="Aba1Insumos.aoAlterarSelectUnidade(this.value)" class="input-minimal font-semibold">
                  ${this.renderOpcoesSelectUnidade(unidade)}
                </select>
              </div>

              <div class="sm:col-span-4" id="box-volume-embalagem" style="${this.producaoPropriaTemp ? 'display:none;' : ''}">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Volume de 1 Embalagem</label>
                <div class="relative">
                  <input type="number" step="any" min="0.01" id="ins-volume-emb" value="${volumeEmbalagem}" oninput="Aba1Insumos.atualizarDicaVolumeEmbalagem()" class="input-minimal pr-12" />
                  <span id="label-emb-un" class="text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">${this.esc(unidade)}</span>
                </div>
                <span id="dica-volume-emb" class="text-[11px] text-slate-400">Ex: 750 para garrafa de 750ml</span>
                <div id="aviso-volume-emb-incoerente" style="display:none;" class="text-[11px] text-amber-800 bg-amber-50 border border-amber-300 rounded-lg p-2 mt-1.5 font-medium leading-tight"></div>
              </div>

              <div class="sm:col-span-4" id="box-rendimento-final" style="${this.producaoPropriaTemp ? '' : 'display:none;'}">
                <label class="block text-xs font-bold text-blue-800 mb-1">Rendimento Final da Receita *</label>
                <div class="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    id="ins-rendimento-final"
                    value="${this.rendimentoFinalTemp}"
                    oninput="Aba1Insumos.atualizarRendimentoFinal(this.value)"
                    class="input-minimal pr-12 font-bold border-blue-400 bg-blue-50/40 text-blue-900"
                  />
                  <span id="label-rend-un" class="text-xs font-bold text-blue-700 absolute right-3 top-1/2 -translate-y-1/2">${this.esc(unidade)}</span>
                </div>
                <span class="text-[11px] text-blue-600">Ex: Rende 1.200 ml ou 1.000 g no final</span>
              </div>
            </div>

            <!-- Criador Inline de Nova Unidade de Medida -->
            <div id="box-nova-unidade-inline" style="display:none;" class="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <i data-lucide="ruler" class="w-3.5 h-3.5 text-blue-600"></i>
                  <span>Nova Unidade de Medida</span>
                </span>
                <button
                  type="button"
                  onclick="Aba1Insumos.fecharCriadorUnidadeModal()"
                  class="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Fechar
                </button>
              </div>
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  id="input-nova-unidade-medida"
                  maxlength="20"
                  placeholder="Digite a nova unidade (ex: garrafa, lata, maço, dose, fardo, sachê...)"
                  onkeydown="if(event.key==='Enter'){event.preventDefault();Aba1Insumos.salvarNovaUnidadeModal();}"
                  class="input-minimal bg-white text-xs font-semibold flex-1"
                />
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onclick="Aba1Insumos.salvarNovaUnidadeModal()"
                    class="btn-primary py-2 px-3.5 text-xs font-bold whitespace-nowrap"
                  >
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                    <span>Salvar Unidade</span>
                  </button>
                  <button
                    type="button"
                    onclick="Aba1Insumos.fecharCriadorUnidadeModal()"
                    class="btn-secondary py-2 px-3 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              <div id="lista-unidades-personalizadas-modal">
                ${this.renderChipsUnidadesPersonalizadas()}
              </div>
            </div>

            <!-- SEÇÃO A: CONSTRUTOR DE SUB-RECEITA (Visível quando Produção Própria = true) -->
            <div id="secao-sub-receita-modal" class="border-2 border-blue-500 bg-blue-50/30 rounded-xl p-4 space-y-4" style="${
              this.producaoPropriaTemp ? '' : 'display:none;'
            }">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 class="text-xs font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <i data-lucide="flask-round" class="w-4 h-4 text-blue-600"></i>
                    Composição da Sub-receita (Insumos Base Utilizados)
                  </h4>
                  <p class="text-[11px] text-slate-600">
                    Selecione as matérias-primas cadastradas na Aba 1 e informe a quantidade usada para produzir o lote.
                  </p>
                </div>

                <button
                  type="button"
                  onclick="Aba1Insumos.adicionarIngredienteSubReceitaTemp()"
                  class="btn-primary text-xs py-1.5 px-3 shrink-0"
                >
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>+ Adicionar Insumo Base</span>
                </button>
              </div>

              <div id="lista-sub-receita-modal" class="space-y-2">
                <!-- Ingredientes base renderizados via JS -->
              </div>

              <!-- Painel de Cálculo Automático de Custo da Sub-receita -->
              <div id="resumo-calculo-sub-receita" class="bg-white border border-blue-200 rounded-xl p-3.5 shadow-sm">
                <!-- Preenchido em tempo real via JS -->
              </div>
            </div>

            <!-- SEÇÃO B: MÚLTIPLOS FORNECEDORES (Visível quando Produção Própria = false) -->
            <div id="secao-fornecedores-modal" class="border border-slate-200 rounded-xl p-4" style="${
              this.producaoPropriaTemp ? 'display:none;' : ''
            }">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <i data-lucide="truck" class="w-4 h-4 text-blue-600"></i>
                    Fornecedores e Comparador de Preços
                  </h4>
                  <p class="text-[11px] text-slate-500">Adicione múltiplos fornecedores. O sistema destaca automaticamente o de menor custo.</p>
                </div>

                <button type="button" onclick="Aba1Insumos.adicionarFornecedorTemp()" class="btn-secondary text-xs py-1.5 px-3">
                  <i data-lucide="plus" class="w-3.5 h-3.5 text-blue-600"></i>
                  <span>Adicionar Fornecedor</span>
                </button>
              </div>

              <div class="mb-3 flex items-center gap-2 bg-blue-50/70 border border-blue-200 rounded-lg px-3 py-2">
                <i data-lucide="calculator" class="w-4 h-4 text-blue-600 shrink-0"></i>
                <span class="text-xs font-medium text-slate-700">Regra de Custo Base para Orçamentos:</span>
                <select
                  id="ins-fornecedor-ativo-select"
                  onchange="Aba1Insumos.alterarRegraFornecedorAtivo(this.value)"
                  class="input-minimal py-1 text-xs max-w-xs"
                ></select>
              </div>

              <div id="lista-fornecedores-modal" class="space-y-2.5"></div>
            </div>

            <!-- PAINEL DE MARGEM DE LUCRO & REPASSE AO CLIENTE -->
            <div class="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-blue-50/80 border-2 border-emerald-300/80 rounded-xl p-4 shadow-2xs">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div>
                  <h4 class="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <i data-lucide="trending-up" class="w-4 h-4 text-emerald-600"></i>
                    <span>Margem de Lucro & Valor de Repasse ao Cliente</span>
                  </h4>
                  <p class="text-[11px] text-slate-600">
                    O <strong>Custo Real</strong> fica no <strong>Checklist de Compras</strong>. O <strong>Valor Final c/ Margem</strong> é repassado para a <strong>Proposta do Cliente</strong>.
                  </p>
                </div>

                <!-- Botões rápidos de margem -->
                <div class="flex flex-wrap items-center gap-1 shrink-0">
                  <span class="text-[10px] font-bold text-slate-500 mr-1">Atalhos:</span>
                  ${[0, 15, 25, 30, 50, 100]
                    .map(
                      (pct) => `
                    <button
                      type="button"
                      onclick="Aba1Insumos.aplicarPresetMargemModal(${pct})"
                      class="px-2 py-0.5 rounded-md text-[11px] font-bold border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-600 hover:text-white transition"
                    >
                      ${pct === 0 ? '0%' : `+${pct}%`}
                    </button>
                  `
                    )
                    .join('')}
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                <!-- Coluna 1: Custo Real Inventário -->
                <div class="bg-white/90 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">1. Custo Real (Inventário)</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Checklist</span>
                  </div>
                  <div class="my-1">
                    <span id="modal-custo-real-ativo-display" class="text-lg font-extrabold text-slate-800">R$ 0,00</span>
                    <span id="modal-custo-real-tam-display" class="text-xs text-slate-500 font-medium">/ emb.</span>
                  </div>
                  <span id="modal-custo-real-unit-display" class="text-[11px] text-slate-400">Usado no Checklist de Compras</span>
                </div>

                <!-- Coluna 2: Margem de Lucro (%) -->
                <div class="bg-white border border-emerald-300 rounded-xl p-3 flex flex-col justify-between">
                  <label for="ins-margem-lucro" class="text-[11px] font-bold text-emerald-900 uppercase tracking-wide block">
                    2. Margem de Lucro (%)
                  </label>
                  <div class="relative my-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="ins-margem-lucro"
                      value="${this.margemLucroTemp}"
                      oninput="Aba1Insumos.aoDigitarMargemLucroModal(this.value)"
                      placeholder="0"
                      class="input-minimal pr-8 font-extrabold text-base text-emerald-800 bg-emerald-50/40 border-emerald-300 text-center"
                    />
                    <span class="text-xs font-extrabold text-emerald-700 absolute right-3 top-1/2 -translate-y-1/2">%</span>
                  </div>
                  <span class="text-[11px] text-emerald-700 font-medium">Digite a % desejada sobre o custo</span>
                </div>

                <!-- Coluna 3: Valor Final Repassado ao Cliente (R$) -->
                <div class="bg-emerald-700 text-white rounded-xl p-3 flex flex-col justify-between shadow-sm">
                  <div class="flex items-center justify-between">
                    <label for="ins-preco-repasse" class="text-[11px] font-bold text-emerald-100 uppercase tracking-wide">
                      3. Valor Final p/ Cliente
                    </label>
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-200">Proposta</span>
                  </div>
                  <div class="relative my-1">
                    <span class="text-xs font-extrabold text-emerald-200 absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="ins-preco-repasse"
                      value="0.00"
                      oninput="Aba1Insumos.aoDigitarPrecoRepasseModal(this.value)"
                      class="input-minimal pl-8 font-extrabold text-base text-slate-900 bg-white border-emerald-400 text-center"
                    />
                  </div>
                  <span id="modal-lucro-emb-display" class="text-[11px] text-emerald-100 font-semibold">
                    Lucro: R$ 0,00 / emb.
                  </span>
                </div>
              </div>
            </div>

            <!-- FATOR DE CONSUMO OPERACIONAL POR BARTENDER (BASE 5H) -->
            <div class="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <label class="block text-xs font-bold text-blue-900 mb-0.5">
                  Fator de Consumo por Bartender (Turno Base 5h) *
                </label>
                <p class="text-[11px] text-slate-600">
                  Volume médio consumido por <strong>1 bartender em 5 horas</strong> de festa (ex: 4.000 ml para Vodka, 1.500 ml para Espuma, 30 kg para Gelo).
                </p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  id="ins-consumo-bartender"
                  value="${consumoPorBartender}"
                  class="input-minimal w-28 font-extrabold text-blue-800 text-center bg-white border-blue-300"
                />
                <span id="label-fator-un" class="text-xs font-bold text-blue-700">${unidade}</span>
              </div>
            </div>

            <!-- Estoque e Grupo Genérico -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div class="sm:col-span-6">
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Saldo Pronto em Estoque (<span id="label-est-un">${unidade}</span>)
                </label>
                <div class="flex items-center gap-2">
                  <input type="number" step="any" id="ins-estoque" value="${estoqueAtual}" class="input-minimal font-semibold" />
                  <button type="button" onclick="Aba1Insumos.somarEmbalagemEstoque(1)" class="btn-secondary text-xs py-2 px-2.5 whitespace-nowrap" title="Adicionar +1 embalagem/lote ao saldo">
                    +1 Lote/Emb.
                  </button>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Informe quanto já há pronto/disponível na unidade base.</p>
              </div>

              <div class="sm:col-span-6">
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700">Vínculo de Insumo Genérico (Opcional)</label>
                  <button type="button" onclick="Aba1Insumos.criarNovoGrupoGenericoPrompt()" class="text-[11px] font-semibold text-blue-600 hover:underline">+ Novo Tipo</button>
                </div>
                <select id="ins-grupo-generico" class="input-minimal" onchange="Aba1Insumos.aoMudarGrupoOuLinhaModal()">
                  <option value="">Sem vínculo genérico (Item específico)</option>
                  ${grupos
                    .map((g) => `<option value="${g}" ${g === grupoGenerico ? 'selected' : ''}>${g}</option>`)
                    .join('')}
                </select>
                <p class="text-[11px] text-slate-500 mt-1">Permite trocar automaticamente entre marcas A, B e C nos drinques.</p>

                <div id="wrapper-ins-escalado" class="mt-2.5 ${grupoGenerico && !semLinha ? '' : 'hidden'}">
                  <label class="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 cursor-pointer select-none hover:bg-emerald-100/60 transition">
                    <input
                      type="checkbox"
                      id="ins-escalado"
                      ${item && item.escalado ? 'checked' : ''}
                      class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div class="text-xs">
                      <span class="font-bold text-emerald-900 block">⭐ Escalar esta bebida como Titular da Linha</span>
                      <span class="text-[11px] text-emerald-700 block">Será a marca padrão selecionada quando drinques usarem este grupo na Linha do evento.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- UNIFICAÇÃO DE COMPRA NO CHECKLIST (Fruta x Suco) -->
            <div class="border border-amber-200 bg-amber-50/40 rounded-xl p-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <i data-lucide="citrus" class="w-4 h-4 text-amber-600"></i>
                    Unificação de Compra no Checklist (Fruta x Suco)
                  </h4>
                  <p class="text-[11px] text-slate-600">
                    Se ativado, ao invés de comprar o suco pronto, o Checklist calcula quantos quilos/unidades da fruta base devem ser comprados.
                  </p>
                </div>
                <label class="inline-flex items-center gap-2 cursor-pointer select-none bg-amber-100/70 border border-amber-300 px-3 py-1.5 rounded-lg shrink-0">
                  <input
                    type="checkbox"
                    id="ins-unificacao-ativo"
                    ${unifCfg.ativo ? 'checked' : ''}
                    onchange="Aba1Insumos.toggleUnificacaoFrutaModal(this.checked)"
                    class="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span class="text-xs font-bold text-amber-900">Unificar Compra no Checklist</span>
                </label>
              </div>

              <div id="container-campos-unificacao" class="mt-3 space-y-3 ${unifCfg.ativo ? '' : 'hidden'}">
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div class="sm:col-span-6">
                    <label class="block text-xs font-bold text-slate-700 mb-1">
                      Fruta Base de Compra (Insumo bruto que você compra) *
                    </label>
                    <select id="ins-unificacao-base-id" onchange="Aba1Insumos.atualizarPreviewUnificacaoModal()" class="input-minimal text-xs font-medium">
                      <option value="">Selecione a fruta base (ex: Limão taiti)...</option>
                      ${frutasDisponiveis
                        .map(
                          (f) =>
                            `<option value="${f.id}" ${f.id === baseFruitId ? 'selected' : ''}>${f.descricao} (${f.unidade})</option>`
                        )
                        .join('')}
                    </select>
                  </div>

                  <div class="sm:col-span-6">
                    <label class="block text-xs font-bold text-slate-700 mb-1">
                      Regra de Rendimento Manual *
                    </label>
                    <div class="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        id="ins-unificacao-qtd-fruta"
                        value="${unifCfg.rendimentoQtdFruta || 1}"
                        oninput="Aba1Insumos.atualizarPreviewUnificacaoModal()"
                        class="input-minimal w-16 text-center font-bold text-xs"
                      />
                      <select
                        id="ins-unificacao-un-fruta"
                        onchange="Aba1Insumos.atualizarPreviewUnificacaoModal()"
                        class="input-minimal w-24 text-xs font-bold"
                      >
                        <option value="un" ${unifCfg.rendimentoUnidadeFruta === 'un' ? 'selected' : ''}>un (frutas)</option>
                        <option value="kg" ${unifCfg.rendimentoUnidadeFruta === 'kg' ? 'selected' : ''}>kg</option>
                        <option value="g" ${unifCfg.rendimentoUnidadeFruta === 'g' ? 'selected' : ''}>g</option>
                      </select>
                      <span class="text-xs font-bold text-slate-600">rende</span>
                      <input
                        type="number"
                        step="any"
                        min="1"
                        id="ins-unificacao-ml-suco"
                        value="${unifCfg.rendimentoMlSuco || 35}"
                        oninput="Aba1Insumos.atualizarPreviewUnificacaoModal()"
                        class="input-minimal w-20 text-center font-extrabold text-xs text-amber-800"
                      />
                      <span class="text-xs font-bold text-slate-700">ml suco</span>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2 border-t border-amber-200/60">
                  <div class="sm:col-span-6">
                    <label class="block text-xs font-semibold text-slate-700 mb-0.5">
                      Peso médio da unidade da fruta
                    </label>
                    <div class="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        min="1"
                        id="ins-unificacao-peso-medio"
                        value="${unifCfg.pesoMedioUnidadeG || 80}"
                        oninput="Aba1Insumos.atualizarPreviewUnificacaoModal()"
                        class="input-minimal w-20 text-center font-bold text-xs"
                      />
                      <span class="text-xs text-slate-500 font-semibold">g / unidade</span>
                    </div>
                    <span class="text-[10px] text-slate-500">Usado se a fruta for comprada por kg ou g</span>
                  </div>

                  <div class="sm:col-span-6">
                    <div id="preview-unificacao-modal" class="bg-amber-100/70 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-950 font-medium space-y-1">
                      <!-- Simulação em tempo real -->
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Classificação de Linha (A, B, C ou Sem Linha) -->
            <div class="border border-slate-200 rounded-xl p-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i data-lucide="award" class="w-4 h-4 text-blue-600"></i>
                  Classificação de Linha de Atendimento
                </label>

                <label class="inline-flex items-center gap-2 cursor-pointer select-none bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <input
                    type="checkbox"
                    id="ins-sem-linha"
                    ${semLinha ? 'checked' : ''}
                    onchange="Aba1Insumos.toggleSemLinhaModal(this.checked)"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span class="text-xs font-semibold text-emerald-800">Insumo sem linha (Uso Comum / Universal)</span>
                </label>
              </div>

              <div id="container-selecao-linha" class="grid grid-cols-1 sm:grid-cols-3 gap-3 ${
                semLinha ? 'opacity-40 pointer-events-none' : ''
              }">
                <label class="flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer hover:bg-blue-50/50 transition ${
                  linha === 'A' ? 'border-blue-600 bg-blue-50/40' : 'border-slate-200'
                }">
                  <input type="radio" name="ins-linha-radio" value="A" ${linha === 'A' ? 'checked' : ''} class="text-blue-600" />
                  <div>
                    <span class="block text-sm font-bold text-blue-900">Linha A (Premium)</span>
                    <span class="text-[11px] text-slate-500">Rótulos importados / topo de linha</span>
                  </div>
                </label>

                <label class="flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer hover:bg-indigo-50/50 transition ${
                  linha === 'B' ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-200'
                }">
                  <input type="radio" name="ins-linha-radio" value="B" ${linha === 'B' ? 'checked' : ''} class="text-indigo-600" />
                  <div>
                    <span class="block text-sm font-bold text-indigo-900">Linha B (Padrão)</span>
                    <span class="text-[11px] text-slate-500">Marcas consagradas / standard</span>
                  </div>
                </label>

                <label class="flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer hover:bg-slate-100 transition ${
                  linha === 'C' ? 'border-slate-600 bg-slate-100' : 'border-slate-200'
                }">
                  <input type="radio" name="ins-linha-radio" value="C" ${linha === 'C' ? 'checked' : ''} class="text-slate-700" />
                  <div>
                    <span class="block text-sm font-bold text-slate-800">Linha C (Econômica)</span>
                    <span class="text-[11px] text-slate-500">Custo-benefício / eventos de alto giro</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Rodapé Modal -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button type="button" onclick="App.fecharModal()" class="btn-secondary">Cancelar</button>
            <button type="button" onclick="Aba1Insumos.salvarInsumo()" class="btn-primary">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Salvar Produto / Insumo</span>
            </button>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
    this.renderFornecedoresNoModal();
    this.renderSubReceitaNoModal();
    this.atualizarPreviewUnificacaoModal();
    this.atualizarDicaVolumeEmbalagem();
  },

  toggleUnificacaoFrutaModal(checked) {
    const container = document.getElementById('container-campos-unificacao');
    if (container) {
      if (checked) {
        container.classList.remove('hidden');
      } else {
        container.classList.add('hidden');
      }
    }
    this.atualizarPreviewUnificacaoModal();
  },

  atualizarPreviewUnificacaoModal() {
    const previewEl = document.getElementById('preview-unificacao-modal');
    if (!previewEl) return;

    const ativo = document.getElementById('ins-unificacao-ativo')?.checked;
    if (!ativo) {
      previewEl.innerHTML = `<span class="text-slate-500">Unificação desativada: este item será comprado exatamente como cadastrado.</span>`;
      return;
    }

    const baseId = document.getElementById('ins-unificacao-base-id')?.value;
    const baseFruit = (Store.state.insumos || []).find((i) => i.id === baseId);
    const qtdFruta = Number(document.getElementById('ins-unificacao-qtd-fruta')?.value) || 1;
    const unFruta = document.getElementById('ins-unificacao-un-fruta')?.value || 'un';
    const mlSuco = Number(document.getElementById('ins-unificacao-ml-suco')?.value) || 35;
    const pesoMedioG = Number(document.getElementById('ins-unificacao-peso-medio')?.value) || 80;

    if (!baseFruit) {
      previewEl.innerHTML = `<span class="text-amber-800">Selecione a fruta base acima para ver a simulação.</span>`;
      return;
    }

    const cfgMock = {
      ativo: true,
      insumoBaseId: baseId,
      rendimentoQtdFruta: qtdFruta,
      rendimentoUnidadeFruta: unFruta,
      rendimentoMlSuco: mlSuco,
      pesoMedioUnidadeG: pesoMedioG
    };
    const sucoMock = { unificacaoCompraChecklist: cfgMock };

    const conv1000 = Store.calcularConversaoFrutaSuco(sucoMock, 1000, baseFruit);
    const conv4000 = Store.calcularConversaoFrutaSuco(sucoMock, 4000, baseFruit);

    previewEl.innerHTML = `
      <div class="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
        <i data-lucide="info" class="w-3.5 h-3.5 text-amber-700"></i>
        <span>Simulação de Rendimento no Checklist:</span>
      </div>
      <div>• <strong>1.000 ml deste suco:</strong> exige ≈ <strong>${Store.formatNumber(conv1000.qtdFrutaNecessaria, 0)} ${conv1000.unidadeFruta}</strong> de ${baseFruit.descricao} (~${conv1000.numLimõesAprox} un)</div>
      <div>• <strong>4.000 ml deste suco:</strong> exige ≈ <strong>${Store.formatNumber(conv4000.qtdFrutaNecessaria, 0)} ${conv4000.unidadeFruta}</strong> de ${baseFruit.descricao} (~${conv4000.numLimõesAprox} un)</div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  alternarModoProducaoPropria(checked) {
    this.producaoPropriaTemp = checked;
    const secaoSub = document.getElementById('secao-sub-receita-modal');
    const secaoForn = document.getElementById('secao-fornecedores-modal');
    const boxVolEmb = document.getElementById('box-volume-embalagem');
    const boxRendFinal = document.getElementById('box-rendimento-final');
    const chkSemLinha = document.getElementById('ins-sem-linha');

    if (secaoSub) secaoSub.style.display = checked ? '' : 'none';
    if (secaoForn) secaoForn.style.display = checked ? 'none' : '';
    if (boxVolEmb) boxVolEmb.style.display = checked ? 'none' : '';
    if (boxRendFinal) boxRendFinal.style.display = checked ? '' : 'none';

    if (checked && chkSemLinha && !chkSemLinha.checked) {
      chkSemLinha.checked = true;
      this.toggleSemLinhaModal(true);
    }

    this.renderSubReceitaNoModal();
  },

  atualizarRendimentoFinal(val) {
    this.rendimentoFinalTemp = Math.max(0.01, Number(val) || 1);
    this.sincronizarInputsSubReceitaTemp();
    this.atualizarResumoCustoSubReceitaModal();
  },

  aoAlterarSelectUnidade(val) {
    if (val === '__NOVA_UNIDADE__') {
      const sel = document.getElementById('ins-unidade');
      if (sel) sel.value = this.ultimaUnidadeSelecionadaTemp || 'ml';
      this.abrirCriadorUnidadeModal();
      return;
    }
    const valLimpo = val || 'ml';
    this.ultimaUnidadeSelecionadaTemp = valLimpo;

    // Se for novo insumo e o usuário mudou para kg/un/L, sugere volume 1 para evitar confusão com 750ml/1000g
    const inputVol = document.getElementById('ins-volume-emb');
    if (inputVol && !this.editandoId && (Number(inputVol.value) === 750 || Number(inputVol.value) === 1000)) {
      if (['kg', 'L', 'un', 'pct', 'cx'].includes(valLimpo)) {
        inputVol.value = 1;
      } else if (valLimpo === 'ml') {
        inputVol.value = 750;
      }
    }

    this.atualizarLabelsUnidade();
  },

  abrirCriadorUnidadeModal() {
    const box = document.getElementById('box-nova-unidade-inline');
    if (box) {
      box.style.display = '';
      if (window.lucide) window.lucide.createIcons();
    }
    const input = document.getElementById('input-nova-unidade-medida');
    if (input) {
      input.focus();
      input.select();
    }
  },

  fecharCriadorUnidadeModal() {
    const box = document.getElementById('box-nova-unidade-inline');
    if (box) box.style.display = 'none';
    const input = document.getElementById('input-nova-unidade-medida');
    if (input) input.value = '';
  },

  salvarNovaUnidadeModal() {
    const input = document.getElementById('input-nova-unidade-medida');
    const valorLimpo = String(input?.value || '').trim();
    if (!valorLimpo) {
      App.mostrarToast('Digite o nome ou sigla da nova unidade de medida.', 'warning');
      if (input) input.focus();
      return;
    }

    const lista = this.obterUnidadesMedida();
    const existente = lista.find((u) => String(u).toLowerCase() === valorLimpo.toLowerCase());
    const unidadeFinal = existente || valorLimpo;

    if (!existente) {
      Store.state.unidadesMedida.push(unidadeFinal);
      Store.save();
    }

    this.ultimaUnidadeSelecionadaTemp = unidadeFinal;
    const sel = document.getElementById('ins-unidade');
    if (sel) {
      sel.innerHTML = this.renderOpcoesSelectUnidade(unidadeFinal);
      sel.value = unidadeFinal;
    }

    const chips = document.getElementById('lista-unidades-personalizadas-modal');
    if (chips) {
      chips.innerHTML = this.renderChipsUnidadesPersonalizadas();
    }

    this.atualizarLabelsUnidade();
    this.fecharCriadorUnidadeModal();
    App.mostrarToast(
      existente
        ? `Unidade "${unidadeFinal}" já existe e foi selecionada!`
        : `Nova unidade "${unidadeFinal}" criada e selecionada!`
    );
  },

  excluirUnidadePersonalizadaModal(unidadeAlvo) {
    const alvoStr = String(unidadeAlvo || '').trim();
    if (!alvoStr) return;

    if (this.unidadesPadraoFixas.some((p) => p.toLowerCase() === alvoStr.toLowerCase())) {
      App.mostrarToast('As unidades padrão do sistema não podem ser removidas.', 'warning');
      return;
    }

    const emUso = (Store.state.insumos || []).filter(
      (i) => String(i.unidade || '').toLowerCase() === alvoStr.toLowerCase()
    );
    if (emUso.length > 0) {
      App.mostrarToast(
        `A unidade "${alvoStr}" está em uso por ${emUso.length} insumo(s) e não pode ser excluída.`,
        'warning'
      );
      return;
    }

    Store.state.unidadesMedida = (Store.state.unidadesMedida || []).filter(
      (u) => String(u).toLowerCase() !== alvoStr.toLowerCase()
    );
    Store.save();

    if (String(this.ultimaUnidadeSelecionadaTemp).toLowerCase() === alvoStr.toLowerCase()) {
      this.ultimaUnidadeSelecionadaTemp = 'ml';
    }

    const sel = document.getElementById('ins-unidade');
    if (sel) {
      sel.innerHTML = this.renderOpcoesSelectUnidade(this.ultimaUnidadeSelecionadaTemp);
      sel.value = this.ultimaUnidadeSelecionadaTemp;
    }

    const chips = document.getElementById('lista-unidades-personalizadas-modal');
    if (chips) {
      chips.innerHTML = this.renderChipsUnidadesPersonalizadas();
    }

    this.atualizarLabelsUnidade();
    App.mostrarToast(`Unidade "${alvoStr}" removida.`);
  },

  atualizarLabelsUnidade() {
    const rawUn = document.getElementById('ins-unidade')?.value;
    const un = rawUn && rawUn !== '__NOVA_UNIDADE__' ? rawUn : this.ultimaUnidadeSelecionadaTemp || 'ml';
    const l1 = document.getElementById('label-emb-un');
    const l2 = document.getElementById('label-est-un');
    const l3 = document.getElementById('label-rend-un');
    const l4 = document.getElementById('label-fator-un');
    if (l1) l1.textContent = un;
    if (l2) l2.textContent = un;
    if (l3) l3.textContent = un;
    if (l4) l4.textContent = un;
    this.atualizarDicaVolumeEmbalagem(un);
    this.atualizarResumoCustoSubReceitaModal();
  },

  atualizarDicaVolumeEmbalagem(unidadeForcada) {
    const rawUn = unidadeForcada || document.getElementById('ins-unidade')?.value;
    const un = String(rawUn && rawUn !== '__NOVA_UNIDADE__' ? rawUn : this.ultimaUnidadeSelecionadaTemp || 'ml').trim();
    const unLower = un.toLowerCase();
    const dicaEl = document.getElementById('dica-volume-emb');
    const inputVol = document.getElementById('ins-volume-emb');
    const vol = Number(inputVol?.value) || 0;
    const avisoEl = document.getElementById('aviso-volume-emb-incoerente');

    if (dicaEl) {
      if (unLower === 'kg') dicaEl.textContent = 'Ex: 1 para embalagem de 1kg (ou 0.5 para 500g)';
      else if (unLower === 'l') dicaEl.textContent = 'Ex: 1 para garrafa de 1L (ou 5 para galão 5L)';
      else if (unLower === 'g') dicaEl.textContent = 'Ex: 500 para pacote de 500g (ou 1000 para 1kg)';
      else if (unLower === 'un') dicaEl.textContent = 'Ex: 1 para compra unitária avulsa';
      else if (unLower === 'pct' || unLower === 'cx') dicaEl.textContent = 'Ex: 1 para 1 pacote ou caixa';
      else dicaEl.textContent = 'Ex: 750 para garrafa de 750ml';
    }

    if (avisoEl) {
      if (unLower === 'kg' && vol >= 50) {
        avisoEl.innerHTML = `⚠️ <b>Atenção ao cálculo:</b> A unidade é <b>kg</b> e o volume de 1 embalagem informado é <b>${vol} kg</b> (${(vol / 1000).toLocaleString('pt-BR')} toneladas). Se sua embalagem for de 1 kg, digite <b>1</b>. Se deixar ${vol}, o sistema entenderá que 1 embalagem tem ${vol} kg!`;
        avisoEl.style.display = 'block';
      } else if (unLower === 'l' && vol >= 50) {
        avisoEl.innerHTML = `⚠️ <b>Atenção:</b> A unidade é <b>L</b> e o volume é <b>${vol} Litros</b>. Se a garrafa for de 1 Litro, digite <b>1</b>.`;
        avisoEl.style.display = 'block';
      } else if (unLower === 'un' && vol >= 50) {
        avisoEl.innerHTML = `⚠️ <b>Atenção:</b> A unidade é <b>un</b> e o volume é <b>${vol} unidades</b>. Se cada compra for unitária (1 fruta, 1 unidade), digite <b>1</b>.`;
        avisoEl.style.display = 'block';
      } else {
        avisoEl.style.display = 'none';
      }
    }
    this.atualizarPainelMargemRepasseModal();
  },

  somarEmbalagemEstoque(qtdEmb) {
    const vol = this.producaoPropriaTemp
      ? Number(document.getElementById('ins-rendimento-final')?.value) || 1000
      : Number(document.getElementById('ins-volume-emb')?.value) || 1;
    const inputEst = document.getElementById('ins-estoque');
    if (inputEst) {
      inputEst.value = (Number(inputEst.value) || 0) + vol * qtdEmb;
    }
  },

  toggleSemLinhaModal(checked) {
    const box = document.getElementById('container-selecao-linha');
    if (box) {
      if (checked) {
        box.classList.add('opacity-40', 'pointer-events-none');
      } else {
        box.classList.remove('opacity-40', 'pointer-events-none');
      }
    }
  },

  // --- Lógica do Construtor de Sub-receitas (Insumos Base) ---
  sincronizarInputsSubReceitaTemp() {
    this.subReceitaTemp = this.subReceitaTemp.map((item, idx) => {
      const selBase = document.getElementById(`sub-base-id-${idx}`);
      const inpQtd = document.getElementById(`sub-base-qtd-${idx}`);
      return {
        insumoBaseId: selBase ? selBase.value : item.insumoBaseId,
        quantidade: inpQtd ? Number(inpQtd.value) || 0 : item.quantidade
      };
    });
  },

  getCandidatosSubReceita() {
    const idAtual = (document.getElementById('ins-id')?.value || this.editandoId)
      ? String(document.getElementById('ins-id')?.value || this.editandoId).trim()
      : null;
    return (Store.state.insumos || []).filter(
      (i) => String(i.id) !== String(idAtual) && (!idAtual || !Store.insumoDependeDe(i.id, idAtual))
    );
  },

  adicionarIngredienteSubReceitaTemp() {
    this.sincronizarInputsSubReceitaTemp();
    const candidatos = this.getCandidatosSubReceita();
    const padrao = candidatos.find((i) => !i.producaoPropria) || candidatos[0];
    if (!padrao) return;

    this.subReceitaTemp.push({
      insumoBaseId: padrao.id,
      quantidade: 100
    });
    this.renderSubReceitaNoModal();
  },

  removerIngredienteSubReceitaTemp(idx) {
    this.sincronizarInputsSubReceitaTemp();
    if (this.subReceitaTemp.length <= 1) {
      App.mostrarToast('A sub-receita deve ter pelo menos 1 insumo base.', 'warning');
      return;
    }
    this.subReceitaTemp.splice(idx, 1);
    this.renderSubReceitaNoModal();
  },

  renderSubReceitaNoModal() {
    const container = document.getElementById('lista-sub-receita-modal');
    if (!container) return;

    const insumosCandidatos = this.getCandidatosSubReceita();

    container.innerHTML = this.subReceitaTemp
      .map((item, idx) => {
        const insumoSelecionado = insumosCandidatos.find((i) => i.id === item.insumoBaseId) || insumosCandidatos[0];
        const unBase = insumoSelecionado ? insumoSelecionado.unidade : 'g';
        const infoBase = insumoSelecionado ? Store.getInsumoCustoInfo(insumoSelecionado) : { custoPorUnidadeBase: 0 };
        const subtotalItem = (Number(item.quantidade) || 0) * infoBase.custoPorUnidadeBase;

        return `
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
            <div class="sm:col-span-6">
              <label class="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Insumo Base (Matéria-Prima da Aba 1)</label>
              <select
                id="sub-base-id-${idx}"
                onchange="Aba1Insumos.sincronizarInputsSubReceitaTemp(); Aba1Insumos.renderSubReceitaNoModal()"
                class="input-minimal py-1.5 text-xs font-medium"
              >
                ${insumosCandidatos
                  .map((ins) => {
                    const cInfo = Store.getInsumoCustoInfo(ins);
                    return `<option value="${ins.id}" ${item.insumoBaseId === ins.id ? 'selected' : ''}>
                      ${ins.descricao} (${Store.formatCurrency(cInfo.precoEmbalagem)}/${cInfo.tamanhoEmbalagem}${ins.unidade})
                    </option>`;
                  })
                  .join('')}
              </select>
            </div>

            <div class="sm:col-span-3">
              <label class="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Qtd. Usada na Receita</label>
              <div class="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  id="sub-base-qtd-${idx}"
                  value="${item.quantidade}"
                  oninput="Aba1Insumos.sincronizarInputsSubReceitaTemp(); Aba1Insumos.atualizarResumoCustoSubReceitaModal()"
                  class="input-minimal py-1.5 pr-10 text-xs font-bold"
                />
                <span class="text-xs font-semibold text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">${unBase}</span>
              </div>
            </div>

            <div class="sm:col-span-2 text-right">
              <span class="block text-[10px] font-semibold uppercase text-slate-400">Custo Prop.</span>
              <span id="sub-base-custo-label-${idx}" class="text-xs font-bold text-blue-700">${Store.formatCurrency(subtotalItem)}</span>
            </div>

            <div class="sm:col-span-1 flex items-end justify-end pt-3">
              <button
                type="button"
                onclick="Aba1Insumos.removerIngredienteSubReceitaTemp(${idx})"
                class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                title="Remover insumo base"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    this.atualizarResumoCustoSubReceitaModal();
    if (window.lucide) window.lucide.createIcons();
  },

  atualizarResumoCustoSubReceitaModal() {
    const resumoEl = document.getElementById('resumo-calculo-sub-receita');
    if (!resumoEl) return;

    const rawUn = document.getElementById('ins-unidade')?.value;
    const unidadeFinal = rawUn && rawUn !== '__NOVA_UNIDADE__' ? rawUn : this.ultimaUnidadeSelecionadaTemp || 'ml';
    const rendimento = Math.max(0.01, Number(document.getElementById('ins-rendimento-final')?.value) || this.rendimentoFinalTemp || 1000);

    let somaCustoIngredientes = 0;
    this.subReceitaTemp.forEach((item, idx) => {
      const insBase = (Store.state.insumos || []).find((i) => i.id === item.insumoBaseId);
      const qtd = Number(item.quantidade) || 0;
      const cInfo = insBase ? Store.getInsumoCustoInfo(insBase) : { custoPorUnidadeBase: 0 };
      const sub = qtd * cInfo.custoPorUnidadeBase;
      somaCustoIngredientes += sub;

      const labelItem = document.getElementById(`sub-base-custo-label-${idx}`);
      if (labelItem) labelItem.textContent = Store.formatCurrency(sub);
    });

    const custoPorUnidade = somaCustoIngredientes / rendimento;

    resumoEl.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span class="text-[10px] font-bold uppercase text-slate-500 block">Soma dos Insumos Base</span>
          <span class="text-base font-extrabold text-slate-900">${Store.formatCurrency(somaCustoIngredientes)}</span>
          <span class="text-[11px] text-slate-400 block">Custo total da batelada/receita</span>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <span class="text-[10px] font-bold uppercase text-slate-500 block">÷ Rendimento Final</span>
          <span class="text-base font-extrabold text-blue-800">${Store.formatNumber(rendimento)} ${unidadeFinal}</span>
          <span class="text-[11px] text-slate-400 block">Volume/peso obtido no preparo</span>
        </div>

        <div class="p-2.5 rounded-lg bg-blue-600 text-white">
          <span class="text-[10px] font-bold uppercase text-blue-200 block">= Custo Final Calculado</span>
          <span class="text-base font-extrabold">${Store.formatCurrency(custoPorUnidade)} / ${unidadeFinal}</span>
          <span class="text-[11px] text-blue-100 block">(${Store.formatCurrency(custoPorUnidade * 100)} a cada 100${unidadeFinal})</span>
        </div>
      </div>
    `;

    this.atualizarPainelMargemRepasseModal();
  },

  criarNovaCategoriaPrompt() {
    const nova = prompt('Digite o nome da nova categoria de insumos:');
    if (nova && nova.trim()) {
      const nomeLimpo = nova.trim();
      if (!Store.state.categoriasInsumos.includes(nomeLimpo)) {
        Store.state.categoriasInsumos.push(nomeLimpo);
        Store.save();
      }
      const select = document.getElementById('ins-categoria');
      if (select) {
        select.innerHTML = Store.state.categoriasInsumos
          .map((c) => `<option value="${c}" ${c === nomeLimpo ? 'selected' : ''}>${c}</option>`)
          .join('');
      }
    }
  },

  criarNovoGrupoGenericoPrompt() {
    const novo = prompt('Digite o nome do grupo genérico (ex: Tequila, Licor de Laranja, Vermute):');
    if (novo && novo.trim()) {
      const nomeLimpo = novo.trim();
      if (!Store.state.gruposGenericos.includes(nomeLimpo)) {
        Store.state.gruposGenericos.push(nomeLimpo);
        Store.save();
      }
      const select = document.getElementById('ins-grupo-generico');
      if (select) {
        select.innerHTML =
          `<option value="">Sem vínculo genérico (Item específico)</option>` +
          Store.state.gruposGenericos
            .map((g) => `<option value="${g}" ${g === nomeLimpo ? 'selected' : ''}>${g}</option>`)
            .join('');
      }
    }
  },

  sincronizarInputsFornecedoresTemp() {
    this.fornecedoresTemp = this.fornecedoresTemp.map((f, idx) => {
      const elNome = document.getElementById(`forn-nome-${idx}`);
      const elPreco = document.getElementById(`forn-preco-${idx}`);
      const elTam = document.getElementById(`forn-tam-${idx}`);
      const precoNum = elPreco ? Number(String(elPreco.value || '').replace(',', '.')) : NaN;
      const tamNum = elTam ? Number(String(elTam.value || '').replace(',', '.')) : NaN;
      return {
        ...f,
        nome: elNome ? elNome.value : f.nome,
        preco: Number.isFinite(precoNum) && precoNum >= 0 ? precoNum : f.preco,
        tamanhoEmbalagem: Number.isFinite(tamNum) && tamNum > 0 ? tamNum : f.tamanhoEmbalagem
      };
    });
  },

  adicionarFornecedorTemp() {
    this.sincronizarInputsFornecedoresTemp();
    const volPadrao = Number(document.getElementById('ins-volume-emb')?.value) || 750;
    this.fornecedoresTemp.push({
      id: 'f-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      nome: `Fornecedor ${this.fornecedoresTemp.length + 1}`,
      preco: 0,
      tamanhoEmbalagem: volPadrao
    });
    this.renderFornecedoresNoModal();
  },

  removerFornecedorTemp(idx) {
    this.sincronizarInputsFornecedoresTemp();
    if (this.fornecedoresTemp.length <= 1) {
      App.mostrarToast('Mantenha pelo menos 1 fornecedor cadastrado.', 'warning');
      return;
    }
    this.fornecedoresTemp.splice(idx, 1);
    this.renderFornecedoresNoModal();
  },

  alterarRegraFornecedorAtivo(val) {
    this.sincronizarInputsFornecedoresTemp();
    this.fornecedorAtivoTemp = val;
    this.renderFornecedoresNoModal();
  },

  renderFornecedoresNoModal() {
    const container = document.getElementById('lista-fornecedores-modal');
    const selectAtivo = document.getElementById('ins-fornecedor-ativo-select');
    if (!container) return;

    let menorId = null;
    let menorCustoUnit = Infinity;
    this.fornecedoresTemp.forEach((f) => {
      const preco = Number(f.preco) || 0;
      const tam = Number(f.tamanhoEmbalagem) || 1;
      const unit = preco / tam;
      if (preco > 0 && unit < menorCustoUnit) {
        menorCustoUnit = unit;
        menorId = f.id;
      }
    });

    if (selectAtivo) {
      selectAtivo.innerHTML = `
        <option value="MENOR_PRECO" ${this.fornecedorAtivoTemp === 'MENOR_PRECO' ? 'selected' : ''}>
          Automático: Usar sempre o Fornecedor de Menor Custo ★
        </option>
        ${this.fornecedoresTemp
          .map(
            (f) => `
          <option value="${f.id}" ${this.fornecedorAtivoTemp === f.id ? 'selected' : ''}>
            Fixar: ${f.nome || 'Fornecedor'} (${Store.formatCurrency(f.preco)})
          </option>
        `
          )
          .join('')}
      `;
    }

    container.innerHTML = this.fornecedoresTemp
      .map((f, idx) => {
        const isMenor = f.id === menorId;
        const isEscolhido =
          (this.fornecedorAtivoTemp === 'MENOR_PRECO' && isMenor) || this.fornecedorAtivoTemp === f.id;

        return `
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-2.5 rounded-xl border ${
            isMenor ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'
          }">
            <div class="sm:col-span-5">
              <div class="flex items-center justify-between mb-1">
                <label class="text-[11px] font-semibold text-slate-600">Nome do Fornecedor</label>
                <div class="flex items-center gap-1">
                  ${
                    isMenor
                      ? `<span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">★ Menor Preço</span>`
                      : ''
                  }
                  ${
                    isEscolhido
                      ? `<span class="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Custo Ativo</span>`
                      : ''
                  }
                </div>
              </div>
              <input
                type="text"
                id="forn-nome-${idx}"
                value="${f.nome}"
                oninput="Aba1Insumos.sincronizarInputsFornecedoresTemp()"
                placeholder="Ex: Atacadão Distribuidora"
                class="input-minimal py-1.5 text-xs"
              />
            </div>

            <div class="sm:col-span-3">
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">Preço de Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="forn-preco-${idx}"
                value="${f.preco}"
                oninput="Aba1Insumos.sincronizarInputsFornecedoresTemp(); Aba1Insumos.atualizarPainelMargemRepasseModal()"
                onchange="Aba1Insumos.sincronizarInputsFornecedoresTemp(); Aba1Insumos.renderFornecedoresNoModal()"
                class="input-minimal py-1.5 text-xs font-semibold"
              />
            </div>

            <div class="sm:col-span-3">
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">Tam. Embalagem</label>
              <input
                type="number"
                step="any"
                min="0.01"
                id="forn-tam-${idx}"
                value="${f.tamanhoEmbalagem}"
                oninput="Aba1Insumos.sincronizarInputsFornecedoresTemp(); Aba1Insumos.atualizarPainelMargemRepasseModal()"
                onchange="Aba1Insumos.sincronizarInputsFornecedoresTemp(); Aba1Insumos.renderFornecedoresNoModal()"
                class="input-minimal py-1.5 text-xs"
              />
            </div>

            <div class="sm:col-span-1 flex items-end justify-end pt-4">
              <button
                type="button"
                onclick="Aba1Insumos.removerFornecedorTemp(${idx})"
                class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                title="Remover fornecedor"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    this.atualizarPainelMargemRepasseModal();
    if (window.lucide) window.lucide.createIcons();
  },

  obterCustoRealAtivoModal() {
    const rawUn = document.getElementById('ins-unidade')?.value;
    const unidade = rawUn && rawUn !== '__NOVA_UNIDADE__' ? rawUn : this.ultimaUnidadeSelecionadaTemp || 'ml';
    const isProducaoPropria = Boolean(document.getElementById('ins-producao-propria-toggle')?.checked);

    if (isProducaoPropria) {
      const rendimento = Math.max(0.01, Number(document.getElementById('ins-rendimento-final')?.value) || this.rendimentoFinalTemp || 1000);
      let somaCustoIngredientes = 0;
      (this.subReceitaTemp || []).forEach((item) => {
        const insBase = (Store.state.insumos || []).find((i) => i.id === item.insumoBaseId);
        const qtd = Number(item.quantidade) || 0;
        const cInfo = insBase ? Store.getInsumoCustoInfo(insBase) : { custoRealPorUnidadeBase: 0, custoPorUnidadeBase: 0 };
        const custoUnit = cInfo.custoRealPorUnidadeBase ?? cInfo.custoPorUnidadeBase ?? 0;
        somaCustoIngredientes += qtd * custoUnit;
      });
      return {
        custoReal: Math.round(somaCustoIngredientes * 100) / 100,
        tamanho: rendimento,
        unidade
      };
    }

    const lista = this.fornecedoresTemp || [];
    if (lista.length === 0) {
      const vol = Math.max(0.01, Number(document.getElementById('ins-volume-emb')?.value) || 750);
      return { custoReal: 0, tamanho: vol, unidade };
    }

    let menorFornecedor = lista[0];
    let menorCustoUnit = Infinity;
    lista.forEach((f) => {
      const preco = Number(f.preco) || 0;
      const tam = Number(f.tamanhoEmbalagem) || Number(document.getElementById('ins-volume-emb')?.value) || 1;
      const unit = preco / tam;
      if (preco > 0 && unit < menorCustoUnit) {
        menorCustoUnit = unit;
        menorFornecedor = f;
      }
    });

    let escolhido = menorFornecedor;
    if (this.fornecedorAtivoTemp && this.fornecedorAtivoTemp !== 'MENOR_PRECO') {
      const fixo = lista.find((f) => f.id === this.fornecedorAtivoTemp);
      if (fixo) escolhido = fixo;
    }

    const custoReal = Math.max(0, Number(escolhido?.preco) || 0);
    const tamanho = Math.max(0.01, Number(escolhido?.tamanhoEmbalagem) || Number(document.getElementById('ins-volume-emb')?.value) || 1);
    return { custoReal, tamanho, unidade };
  },

  atualizarPainelMargemRepasseModal(origem = 'custo') {
    const { custoReal, tamanho, unidade } = this.obterCustoRealAtivoModal();
    const margem = Math.max(0, Number(this.margemLucroTemp) || 0);
    const precoRepasse = Math.round(custoReal * (1 + margem / 100) * 100) / 100;
    const lucroEmb = Math.max(0, Math.round((precoRepasse - custoReal) * 100) / 100);
    const custoUnitRepasse = tamanho > 0 ? precoRepasse / tamanho : 0;

    const elCustoReal = document.getElementById('modal-custo-real-ativo-display');
    const elTam = document.getElementById('modal-custo-real-tam-display');
    const elUnit = document.getElementById('modal-custo-real-unit-display');
    const elInputMargem = document.getElementById('ins-margem-lucro');
    const elInputRepasse = document.getElementById('ins-preco-repasse');
    const elLucroEmb = document.getElementById('modal-lucro-emb-display');

    if (elCustoReal) elCustoReal.textContent = Store.formatCurrency(custoReal);
    if (elTam) elTam.textContent = `/ ${tamanho}${unidade}`;
    if (elUnit) elUnit.textContent = `Custo Real: ${Store.formatCurrency(tamanho > 0 ? custoReal / tamanho : 0)}/${unidade} (vai para o Checklist)`;

    if (origem !== 'margemInput' && elInputMargem) {
      elInputMargem.value = margem;
    }
    if (origem !== 'repasseInput' && elInputRepasse) {
      elInputRepasse.value = precoRepasse;
    }
    if (elLucroEmb) {
      elLucroEmb.innerHTML =
        margem > 0
          ? `Lucro: <strong>+ ${Store.formatCurrency(lucroEmb)}</strong> / emb. • (${Store.formatCurrency(custoUnitRepasse)}/${unidade} na proposta)`
          : `Sem margem adicional (Repasse = Custo Real)`;
    }
  },

  aoDigitarMargemLucroModal(val) {
    const num = Number(String(val ?? '').replace(',', '.'));
    this.margemLucroTemp = Number.isFinite(num) && num >= 0 ? Math.round(num * 100) / 100 : 0;
    this.margemAlteradaManualmenteNoModal = true;
    this.atualizarPainelMargemRepasseModal('margemInput');
  },

  aoDigitarPrecoRepasseModal(val) {
    const precoDigitado = Number(String(val ?? '').replace(',', '.'));
    const { custoReal, tamanho, unidade } = this.obterCustoRealAtivoModal();
    if (Number.isFinite(precoDigitado) && precoDigitado >= 0 && custoReal > 0) {
      const novaMargem = Math.max(0, Math.round(((precoDigitado - custoReal) / custoReal) * 10000) / 100);
      this.margemLucroTemp = novaMargem;
    } else {
      this.margemLucroTemp = 0;
    }
    this.margemAlteradaManualmenteNoModal = true;
    const elInputMargem = document.getElementById('ins-margem-lucro');
    if (elInputMargem) elInputMargem.value = this.margemLucroTemp;

    const precoRepasse = Number.isFinite(precoDigitado) && precoDigitado >= 0 ? precoDigitado : custoReal;
    const lucroEmb = Math.max(0, Math.round((precoRepasse - custoReal) * 100) / 100);
    const custoUnitRepasse = tamanho > 0 ? precoRepasse / tamanho : 0;
    const elLucroEmb = document.getElementById('modal-lucro-emb-display');
    if (elLucroEmb) {
      elLucroEmb.innerHTML =
        this.margemLucroTemp > 0
          ? `Lucro: <strong>+ ${Store.formatCurrency(lucroEmb)}</strong> / emb. • (${Store.formatCurrency(custoUnitRepasse)}/${unidade} na proposta)`
          : `Sem margem adicional (Repasse = Custo Real)`;
    }
  },

  aplicarPresetMargemModal(pct) {
    this.margemLucroTemp = Math.max(0, Number(pct) || 0);
    this.margemAlteradaManualmenteNoModal = true;
    const elInputMargem = document.getElementById('ins-margem-lucro');
    if (elInputMargem) elInputMargem.value = this.margemLucroTemp;
    this.atualizarPainelMargemRepasseModal('custo');
  },

  salvarInsumo() {
    try {
      this.sincronizarInputsFornecedoresTemp();
      this.sincronizarInputsSubReceitaTemp();

      const codigo = document.getElementById('ins-codigo')?.value.trim();
      const descricao = document.getElementById('ins-descricao')?.value.trim();
      const categoria = document.getElementById('ins-categoria')?.value || 'Outros';
      const boxNovaUn = document.getElementById('box-nova-unidade-inline');
      const inputNovaUn = document.getElementById('input-nova-unidade-medida');
      const digitadoNovaUn = boxNovaUn && boxNovaUn.style.display !== 'none' ? String(inputNovaUn?.value || '').trim() : '';
      const unidadeSelect = document.getElementById('ins-unidade')?.value;
      const unidade =
        digitadoNovaUn ||
        (unidadeSelect && unidadeSelect !== '__NOVA_UNIDADE__'
          ? unidadeSelect
          : this.ultimaUnidadeSelecionadaTemp || 'ml');
      this.obterUnidadesMedida(unidade);
      const producaoPropria = Boolean(document.getElementById('ins-producao-propria-toggle')?.checked);

      const idInput = document.getElementById('ins-id')?.value;
      const idEditando = (idInput !== undefined && idInput !== '' ? idInput : this.editandoId)
        ? String(idInput || this.editandoId).trim()
        : null;

      if (!codigo || !descricao) {
        App.mostrarToast('Preencha o Código (SKU) e a Descrição do insumo.', 'error');
        return;
      }

      const skuDuplicado = (Store.state.insumos || []).some(
        (i) => String(i.id) !== String(idEditando) && String(i.codigo || '').trim().toLowerCase() === codigo.toLowerCase()
      );
      if (skuDuplicado) {
        App.mostrarToast(`Já existe outro insumo cadastrado com o código "${codigo}".`, 'error');
        return;
      }

      const rendBruto = Number(String(document.getElementById('ins-rendimento-final')?.value || '').replace(',', '.'));
      const volBruto = Number(String(document.getElementById('ins-volume-emb')?.value || '').replace(',', '.'));
      const consBruto = Number(String(document.getElementById('ins-consumo-bartender')?.value || '').replace(',', '.'));
      const estRaw = document.getElementById('ins-estoque')?.value;
      const estBruto = estRaw === '' || estRaw === undefined ? 0 : Number(String(estRaw).replace(',', '.'));

      if (producaoPropria && (!Number.isFinite(rendBruto) || rendBruto <= 0)) {
        App.mostrarToast('O Rendimento Final da sub-receita deve ser maior que zero.', 'error');
        return;
      }

      if (!producaoPropria && (!Number.isFinite(volBruto) || volBruto <= 0)) {
        App.mostrarToast('O Volume/Tamanho da Embalagem deve ser maior que zero.', 'error');
        return;
      }

      if (!Number.isFinite(consBruto) || consBruto <= 0) {
        App.mostrarToast('O Fator de Consumo por Bartender deve ser maior que zero.', 'error');
        return;
      }

      if (!Number.isFinite(estBruto) || estBruto < 0) {
        App.mostrarToast('O saldo de Estoque Atual não pode ser negativo.', 'error');
        return;
      }

      const rendimentoFinal = producaoPropria ? rendBruto : volBruto;
      const volumeEmbalagem = producaoPropria ? rendimentoFinal : volBruto;
      const consumoPorBartender = consBruto;
      const estoqueAtual = estBruto;

      const semLinha = Boolean(document.getElementById('ins-sem-linha')?.checked);
      const linhaRadio = document.querySelector('input[name="ins-linha-radio"]:checked')?.value || 'A';
      const linha = semLinha ? 'SEM_LINHA' : linhaRadio;
      const escalado = Boolean(document.getElementById('ins-escalado')?.checked);

      let grupoGenerico = document.getElementById('ins-grupo-generico')?.value || '';
      if (!grupoGenerico && !semLinha) {
        grupoGenerico = Store.inferirGrupoGenerico(descricao, categoria);
      }

      let subReceitaFinal = [];
      let fornecedoresFinais = [];

    if (producaoPropria) {
      if (!this.subReceitaTemp || this.subReceitaTemp.length === 0) {
        App.mostrarToast('Adicione pelo menos 1 Insumo Base na sub-receita.', 'error');
        return;
      }

      const possuiQtdInvalida = this.subReceitaTemp.some(
        (s) => !s.insumoBaseId || !Number.isFinite(Number(s.quantidade)) || Number(s.quantidade) <= 0
      );
      if (possuiQtdInvalida) {
        App.mostrarToast('Todos os insumos base da sub-receita devem ter quantidade maior que zero.', 'error');
        return;
      }

      // Unificar eventuais insumos base repetidos somando suas quantidades
      const mapaSub = {};
      this.subReceitaTemp.forEach((s) => {
        mapaSub[s.insumoBaseId] = (mapaSub[s.insumoBaseId] || 0) + Number(s.quantidade);
      });
      subReceitaFinal = Object.entries(mapaSub).map(([insumoBaseId, quantidade]) => ({
        insumoBaseId,
        quantidade
      }));

      if (idEditando && Store.subReceitaCriaCiclo(idEditando, subReceitaFinal)) {
        App.mostrarToast(
          'Referência circular detectada! Um insumo base selecionado já depende desta sub-receita.',
          'error'
        );
        return;
      }
    } else {
      if (!this.fornecedoresTemp || this.fornecedoresTemp.length === 0) {
        App.mostrarToast('Informe pelo menos 1 fornecedor para o insumo.', 'error');
        return;
      }

      const fornInvalido = this.fornecedoresTemp.some(
        (f) =>
          !String(f.nome || '').trim() ||
          !Number.isFinite(Number(f.preco)) ||
          Number(f.preco) < 0 ||
          !Number.isFinite(Number(f.tamanhoEmbalagem)) ||
          Number(f.tamanhoEmbalagem) <= 0
      );
      if (fornInvalido) {
        App.mostrarToast(
          'Verifique os fornecedores: informe nome válido, embalagem maior que zero e preço não negativo.',
          'error'
        );
        return;
      }

      fornecedoresFinais = this.fornecedoresTemp.map((f) => ({
        ...f,
        nome: String(f.nome).trim(),
        preco: Number(f.preco),
        tamanhoEmbalagem: Number(f.tamanhoEmbalagem)
      }));

      // Guardrail preventivo: alerta se o usuário digitou embalagem gigante em kg/L/un (ex: 1000kg em vez de 1kg)
      const unLower = String(unidade || '').trim().toLowerCase();
      const temVolIncoerente = !producaoPropria && (
        (unLower === 'kg' && (volumeEmbalagem >= 50 || fornecedoresFinais.some((f) => f.tamanhoEmbalagem >= 50))) ||
        (unLower === 'l' && (volumeEmbalagem >= 50 || fornecedoresFinais.some((f) => f.tamanhoEmbalagem >= 50))) ||
        (unLower === 'un' && (volumeEmbalagem >= 50 || fornecedoresFinais.some((f) => f.tamanhoEmbalagem >= 50)))
      );
      if (temVolIncoerente) {
        const maiorVol = Math.max(volumeEmbalagem, ...fornecedoresFinais.map((f) => f.tamanhoEmbalagem));
        const confirmou = window.confirm(
          `⚠️ Atenção ao volume da embalagem:\n\n` +
          `A unidade do insumo é "${unidade}", mas o volume informado para 1 embalagem é de ${maiorVol} ${unidade}!\n\n` +
          `• Se a sua embalagem de compra for de 1 ${unidade} (ex: pacote de 1kg ou 1 garrafa de 1L), clique em "Cancelar" e ajuste o volume para 1.\n` +
          `• Deixar ${maiorVol} fará o sistema calcular que cada embalagem comprada tem ${maiorVol} ${unidade} (${(maiorVol / 1000).toLocaleString('pt-BR')} toneladas).\n\n` +
          `Deseja realmente salvar com ${maiorVol} ${unidade} por embalagem?`
        );
        if (!confirmou) {
          const inputVol = document.getElementById('ins-volume-emb');
          if (inputVol) {
            inputVol.focus();
            inputVol.select();
          }
          return;
        }
      }
    }

    const unifAtivo = Boolean(document.getElementById('ins-unificacao-ativo')?.checked);
    const unifBaseId = document.getElementById('ins-unificacao-base-id')?.value || '';
    const unifQtdFruta = Math.max(0.01, Number(document.getElementById('ins-unificacao-qtd-fruta')?.value) || 1);
    const unifUnFruta = document.getElementById('ins-unificacao-un-fruta')?.value || 'un';
    const unifMlSuco = Math.max(0.1, Number(document.getElementById('ins-unificacao-ml-suco')?.value) || 35);
    const unifPesoMedio = Math.max(1, Number(document.getElementById('ins-unificacao-peso-medio')?.value) || 80);

    const margemRaw = document.getElementById('ins-margem-lucro')?.value;
    const margemParsed = margemRaw !== undefined && margemRaw !== '' ? Number(String(margemRaw).replace(',', '.')) : Number(this.margemLucroTemp);
    const margemLucro = Number.isFinite(margemParsed) && margemParsed >= 0 ? Math.round(margemParsed * 100) / 100 : 0;
    const margemCatPadrao = Store.state.margensCategorias?.[categoria];
    const isPersonalizada =
      Boolean(this.margemAlteradaManualmenteNoModal) ||
      (margemCatPadrao !== undefined && Math.abs(margemLucro - Number(margemCatPadrao)) > 0.01);

    const dados = {
      id: idEditando || 'ins-' + Date.now(),
      codigo,
      descricao,
      categoria,
      unidade,
      volumeEmbalagem,
      consumoPorBartender,
      estoqueAtual,
      margemLucro,
      margemIndividualPersonalizada: isPersonalizada,
      semLinha,
      linha,
      grupoGenerico,
      escalado,
      producaoPropria,
      rendimentoFinal,
      subReceita: subReceitaFinal,
      fornecedorAtivoId: this.fornecedorAtivoTemp || 'MENOR_PRECO',
      fornecedores: fornecedoresFinais,
      unificacaoCompraChecklist: {
        ativo: unifAtivo,
        insumoBaseId: unifBaseId,
        rendimentoQtdFruta: unifQtdFruta,
        rendimentoUnidadeFruta: unifUnFruta,
        rendimentoMlSuco: unifMlSuco,
        pesoMedioUnidadeG: unifPesoMedio
      }
    };

    if (idEditando) {
      const idx = Store.state.insumos.findIndex((i) => String(i.id) === String(idEditando));
      if (idx >= 0) {
        Store.state.insumos[idx] = { ...Store.state.insumos[idx], ...dados, id: idEditando };
      } else {
        Store.state.insumos.unshift({ ...dados, id: idEditando });
      }
      App.mostrarToast('Insumo atualizado! Propostas e fichas técnicas recalculadas automaticamente.');
    } else {
      Store.state.insumos.unshift(dados);
      App.mostrarToast(
        producaoPropria
          ? 'Insumo de Produção Própria (Sub-receita) cadastrado!'
          : 'Novo insumo cadastrado com sucesso!'
      );
    }

    if (grupoGenerico && !semLinha) {
      if (escalado) {
        Store.escalarInsumo(dados.id);
      } else if (!idEditando) {
        const outros = Store.getCandidatosBebidasPorLinha(grupoGenerico, linha);
        if (outros.length <= 1) {
          Store.escalarInsumo(dados.id);
        }
      }
    }

    this.editandoId = null;
    Store.save();
    App.fecharModal();
    this.render();
    } catch (err) {
      console.error('Erro ao salvar insumo:', err);
      App.mostrarToast('Erro ao salvar insumo: ' + (err?.message || err), 'error');
    }
  },

  excluirInsumo(id) {
    const item = Store.state.insumos.find((i) => i.id === id);
    if (!item) return;

    const uso = Store.verificarUsoInsumo(id);
    const avisos = [];
    if (uso.drinquesAfetados.length > 0) {
      avisos.push(`• ${uso.drinquesAfetados.length} drinque(s): ${uso.drinquesAfetados.map((d) => d.nome).join(', ')}`);
    }
    if (uso.subReceitasAfetadas.length > 0) {
      avisos.push(
        `• ${uso.subReceitasAfetadas.length} sub-receita(s): ${uso.subReceitasAfetadas.map((s) => s.descricao).join(', ')}`
      );
    }
    if (uso.propostasAfetadas.length > 0) {
      avisos.push(
        `• ${uso.propostasAfetadas.length} proposta(s) salva(s): ${uso.propostasAfetadas.map((p) => p.nomeEvento).join(', ')}`
      );
    }

    const msgConfirm =
      avisos.length > 0
        ? `Atenção: O insumo "${item.descricao}" está vinculado a:\n${avisos.join(
            '\n'
          )}\n\nAo excluir, ele será removido automaticamente desses vínculos sem quebrar propostas. Deseja continuar?`
        : `Deseja realmente excluir o insumo "${item.descricao}"?`;

    if (!confirm(msgConfirm)) return;

    Store.excluirInsumoComIntegridade(id);
    this.render();
    App.mostrarToast('Insumo removido e referências atualizadas com segurança.');
  },

  importarPlanilha(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    reader.onload = (e) => {
      try {
        let rows = [];
        if (window.XLSX) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
        } else if (isCsv) {
          const text = new TextDecoder('utf-8').decode(e.target.result);
          rows = this.parseCsvSimples(text);
        }

        if (!rows || rows.length === 0) {
          App.mostrarToast('A planilha enviada está vazia ou em formato inválido.', 'error');
          return;
        }

        let inseridos = 0;
        let atualizados = 0;

        rows.forEach((r) => {
          const codigo = String(r.Codigo || r.Código || r.SKU || r.codigo || '').trim() || Store.gerarProximoSkuInsumo();
          const descricao = String(r.Descricao || r.Descrição || r.Produto || r.descricao || '').trim();
          if (!descricao) return;

          const unidade = String(r.Unidade || r.unidade || 'ml').trim() || 'ml';
          const volBruto = Number(String(r.VolumeEmbalagem || r.Embalagem || r.volume || 750).replace(',', '.'));
          const volumeEmbalagem = Number.isFinite(volBruto) && volBruto > 0 ? volBruto : 1;
          const categoria = String(r.Categoria || r.categoria || 'Outros').trim() || 'Outros';
          const estBruto = Number(String(r.Estoque || r.Saldo || r.estoque || 0).replace(',', '.'));
          const estoqueAtual = Number.isFinite(estBruto) && estBruto >= 0 ? estBruto : 0;
          const linhaRaw = String(r.Linha || r.linha || 'SEM_LINHA').toUpperCase().trim();
          const semLinha = linhaRaw === 'SEM_LINHA' || linhaRaw === 'COMUM' || linhaRaw === '';
          const linha = semLinha ? 'SEM_LINHA' : ['A', 'B', 'C'].includes(linhaRaw) ? linhaRaw : 'B';
          const grupoGenerico = String(r.GrupoGenerico || r.Grupo || '').trim();
          const fornecedorNome = String(r.Fornecedor || r.fornecedor || 'Fornecedor Padrão').trim() || 'Fornecedor Padrão';
          const precoBruto = Number(String(r.Preco || r.Preço || r.Custo || 0).replace(',', '.'));
          const preco = Number.isFinite(precoBruto) && precoBruto >= 0 ? precoBruto : 0;

          if (!Store.state.categoriasInsumos.includes(categoria)) {
            Store.state.categoriasInsumos.push(categoria);
          }
          this.obterUnidadesMedida(unidade);

          const existente = Store.state.insumos.find(
            (i) =>
              String(i.codigo || '').toLowerCase() === codigo.toLowerCase() ||
              String(i.descricao || '').toLowerCase() === descricao.toLowerCase()
          );

          if (existente) {
            existente.estoqueAtual = estoqueAtual;
            existente.volumeEmbalagem = volumeEmbalagem;
            if (preco > 0 && !existente.producaoPropria) {
              if (!Array.isArray(existente.fornecedores)) existente.fornecedores = [];
              const fornExistente = existente.fornecedores.find(
                (f) => String(f.nome || '').toLowerCase() === fornecedorNome.toLowerCase()
              );
              if (fornExistente) {
                fornExistente.preco = preco;
                fornExistente.tamanhoEmbalagem = volumeEmbalagem;
              } else {
                existente.fornecedores.push({
                  id: 'f-' + Date.now() + '-' + Math.random(),
                  nome: fornecedorNome,
                  preco,
                  tamanhoEmbalagem: volumeEmbalagem
                });
              }
            }
            atualizados++;
          } else {
            Store.state.insumos.push({
              id: 'ins-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              codigo,
              descricao,
              unidade,
              volumeEmbalagem,
              categoria,
              estoqueAtual,
              linha,
              semLinha,
              grupoGenerico,
              producaoPropria: false,
              rendimentoFinal: volumeEmbalagem,
              subReceita: [],
              fornecedorAtivoId: 'MENOR_PRECO',
              fornecedores: [
                {
                  id: 'f-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                  nome: fornecedorNome,
                  preco,
                  tamanhoEmbalagem: volumeEmbalagem
                }
              ]
            });
            inseridos++;
          }
        });

        Store.save();
        this.render();
        App.mostrarToast(`Importação concluída: ${inseridos} novos e ${atualizados} atualizados!`);
      } catch (err) {
        console.error(err);
        App.mostrarToast('Erro ao processar planilha. Verifique o formato.', 'error');
      } finally {
        event.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  },

  parseCsvSimples(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const sep = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map((line) => {
      const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] || '';
      });
      return obj;
    });
  },

  baixarModeloPlanilha() {
    const modelo = [
      {
        Codigo: 'INS-090',
        Descricao: "Gin Hendrick's Importado",
        Categoria: 'Destilados',
        Unidade: 'ml',
        VolumeEmbalagem: 750,
        Estoque: 1500,
        Linha: 'A',
        GrupoGenerico: 'Gin',
        Fornecedor: 'Empório Bebidas SP',
        Preco: 189.90
      },
      {
        Codigo: 'INS-091',
        Descricao: 'Laranja Bahia Fresca',
        Categoria: 'Frutas & Botânicos',
        Unidade: 'kg',
        VolumeEmbalagem: 1,
        Estoque: 10,
        Linha: 'SEM_LINHA',
        GrupoGenerico: '',
        Fornecedor: 'CEASA Hortifruti',
        Preco: 6.50
      }
    ];

    if (window.XLSX) {
      const ws = XLSX.utils.json_to_sheet(modelo);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Modelo_Insumos');
      XLSX.writeFile(wb, 'Modelo_Importacao_Insumos.xlsx');
    } else {
      const csv =
        'Codigo;Descricao;Categoria;Unidade;VolumeEmbalagem;Estoque;Linha;GrupoGenerico;Fornecedor;Preco\n' +
        'INS-090;Gin Hendricks;Destilados;ml;750;1500;A;Gin;Emporio SP;189.90';
      this.downloadBlob(csv, 'Modelo_Importacao_Insumos.csv', 'text/csv;charset=utf-8;');
    }
  },

  exportarPlanilhaEstoque() {
    const dados = Store.state.insumos.map((i) => {
      const custoInfo = Store.getInsumoCustoInfo(i);
      return {
        Codigo: i.codigo,
        Descricao: i.descricao,
        Categoria: i.categoria,
        Unidade: i.unidade,
        VolumeOuRendimento: i.producaoPropria ? i.rendimentoFinal : i.volumeEmbalagem,
        Estoque: i.estoqueAtual,
        Tipo: i.producaoPropria ? 'PRODUCAO_PROPRIA' : i.semLinha ? 'SEM_LINHA' : `LINHA_${i.linha}`,
        GrupoGenerico: i.grupoGenerico || '',
        OrigemOuFornecedor: custoInfo.fornecedorAtivo?.nome || '',
        CustoRealInventarioEmb: Number((custoInfo.custoRealEmbalagem || 0).toFixed(2)),
        MargemLucroPct: Number((custoInfo.margemLucro || 0).toFixed(2)),
        PrecoRepasseClienteEmb: Number((custoInfo.precoEmbalagem || 0).toFixed(2)),
        CustoUnitarioRepasse: Number((custoInfo.custoPorUnidadeBase || 0).toFixed(4))
      };
    });

    if (window.XLSX) {
      const ws = XLSX.utils.json_to_sheet(dados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Estoque_Insumos');
      XLSX.writeFile(wb, 'Estoque_Insumos_Calculador_Eventos.xlsx');
      App.mostrarToast('Planilha de Estoque exportada com sucesso!');
    } else {
      const csv =
        '\uFEFFCodigo;Descricao;Categoria;Unidade;VolumeOuRendimento;Estoque;Tipo;GrupoGenerico;OrigemOuFornecedor;CustoLoteOuEmbalagem;CustoUnitario\n' +
        dados
          .map(
            (r) =>
              `${r.Codigo};"${String(r.Descricao).replace(/"/g, '""')}";"${r.Categoria}";${r.Unidade};${r.VolumeOuRendimento};${r.Estoque};${r.Tipo};"${r.GrupoGenerico}";"${r.OrigemOuFornecedor}";${r.CustoLoteOuEmbalagem};${r.CustoUnitario}`
          )
          .join('\n');
      this.downloadBlob(csv, 'Estoque_Insumos_Calculador_Eventos.csv', 'text/csv;charset=utf-8;');
      App.mostrarToast('Planilha CSV de Estoque exportada com sucesso!');
    }
  },

  escalarBebida(insumoId) {
    const ins = (Store.state.insumos || []).find((i) => i.id === insumoId);
    if (!ins) return;
    Store.escalarInsumo(insumoId);
    this.render();
    App.mostrarToast(`Bebida "${ins.descricao}" agora é a titular escalada da Linha ${ins.linha} para ${ins.grupoGenerico}!`);
  },

  aoDigitarDescricao(val) {
    const sel = document.getElementById('ins-grupo-generico');
    const semLinha = document.getElementById('ins-sem-linha')?.checked;
    if (!sel || semLinha) return;
    if (!sel.value) {
      const cat = document.getElementById('ins-categoria')?.value;
      const inferido = Store.inferirGrupoGenerico(val, cat);
      if (inferido) {
        sel.value = inferido;
        this.aoMudarGrupoOuLinhaModal();
      }
    }
  },

  aoMudarGrupoOuLinhaModal() {
    const grupo = document.getElementById('ins-grupo-generico')?.value;
    const semLinha = Boolean(document.getElementById('ins-sem-linha')?.checked);
    const wrap = document.getElementById('wrapper-ins-escalado');
    if (wrap) {
      if (grupo && !semLinha) {
        wrap.classList.remove('hidden');
      } else {
        wrap.classList.add('hidden');
      }
    }
  },

  abrirModalEscalacao() {
    const grupos = Store.state.gruposGenericos || [];
    const linhas = ['A', 'B', 'C'];

    const modalHtml = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">
          <!-- Cabeçalho -->
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <i data-lucide="wine" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900">Painel Geral de Escalação de Bebidas</h3>
                <p class="text-xs text-slate-500">Defina qual rótulo de bebida será o titular padrão de cada Linha (A, B e C) quando os drinques forem adicionados às propostas.</p>
              </div>
            </div>
            <button onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Conteúdo -->
          <div class="p-6 overflow-y-auto flex-1">
            <div class="overflow-x-auto">
              <table class="table-minimal">
                <thead>
                  <tr>
                    <th class="w-44 font-bold text-slate-800">Grupo / Bebida Base</th>
                    <th class="font-bold text-blue-700">Linha A • Premium</th>
                    <th class="font-bold text-indigo-700">Linha B • Padrão</th>
                    <th class="font-bold text-slate-700">Linha C • Econômica</th>
                  </tr>
                </thead>
                <tbody>
                  ${grupos
                    .map((grupo) => {
                      return `
                      <tr>
                        <td class="font-bold text-slate-900 align-middle">
                          <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                            <span>${grupo}</span>
                          </div>
                        </td>
                        ${linhas
                          .map((linha) => {
                            const candidatos = Store.getCandidatosBebidasPorLinha(grupo, linha);
                            const escalado = candidatos.find((c) => c.escalado) || candidatos[0];

                            if (candidatos.length === 0) {
                              return `
                                <td class="text-xs text-slate-400 italic">
                                  Nenhum cadastrado
                                </td>
                              `;
                            }

                            if (candidatos.length === 1) {
                              return `
                                <td>
                                  <div class="text-xs font-semibold text-slate-800">${candidatos[0].descricao}</div>
                                  <div class="text-[10px] text-slate-500">${Store.formatCurrency(Store.getInsumoCustoInfo(candidatos[0]).precoEmbalagem)} • Único rótulo</div>
                                </td>
                              `;
                            }

                            return `
                              <td>
                                <select
                                  onchange="Aba1Insumos.escalarBebidaNoModal(this.value)"
                                  class="input-minimal text-xs py-1.5 px-2 font-semibold text-slate-800 border-blue-300 focus:bg-white bg-blue-50/40"
                                >
                                  ${candidatos
                                    .map((c) => {
                                      const info = Store.getInsumoCustoInfo(c);
                                      return `
                                        <option value="${c.id}" ${c.id === escalado?.id ? 'selected' : ''}>
                                          ${c.descricao} (${Store.formatCurrency(info.precoEmbalagem)})${c.escalado ? ' ⭐ Titular' : ''}
                                        </option>
                                      `;
                                    })
                                    .join('')}
                                </select>
                                <span class="text-[10px] text-slate-500 mt-0.5 block">${candidatos.length} opções cadastradas</span>
                              </td>
                            `;
                          })
                          .join('')}
                      </tr>
                    `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span class="text-xs text-slate-500">As alterações feitas aqui definem os titulares padrão e podem ser personalizadas dentro de cada proposta.</span>
            <button onclick="App.fecharModal()" class="btn-primary text-xs py-2 px-5">
              Concluir
            </button>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
  },

  escalarBebidaNoModal(insumoId) {
    const ins = (Store.state.insumos || []).find((i) => i.id === insumoId);
    if (!ins) return;
    Store.escalarInsumo(insumoId);
    this.render();
    App.mostrarToast(`"${ins.descricao}" definida como titular da Linha ${ins.linha} para ${ins.grupoGenerico}!`);
  },

  aplicarMargemRapidaFiltroCategoria(categoria) {
    const input = document.getElementById('input-rapido-margem-cat-filtro');
    const val = Number(String(input?.value ?? '').replace(',', '.'));
    if (!Number.isFinite(val) || val < 0) {
      App.mostrarToast('Informe uma margem percentual válida (0% ou maior).', 'error');
      return;
    }
    const { atualizados, preservados, margemLimpa } = Store.aplicarMargemPorCategoria(categoria, val, true);
    this.render();
    App.mostrarToast(
      `Margem de +${margemLimpa}% aplicada em ${atualizados} item(ns) de "${categoria}"${
        preservados > 0 ? ` (${preservados} item(ns) com ajuste individual mantido)` : ''
      }!`
    );
  },

  abrirModalMargemCategorias() {
    const categorias = Store.state.categoriasInsumos || [];
    const insumos = Store.state.insumos || [];

    const linhasCategoriasHtml = categorias
      .map((cat, idx) => {
        const itensCat = insumos.filter((i) => i.categoria === cat);
        const qtdTotal = itensCat.length;
        const itensIndividuais = itensCat.filter((i) => i.margemIndividualPersonalizada);
        const qtdInd = itensIndividuais.length;

        const margemSalvaCat =
          Store.state.margensCategorias?.[cat] !== undefined
            ? Number(Store.state.margensCategorias[cat])
            : itensCat.find((i) => !i.margemIndividualPersonalizada)?.margemLucro ??
              itensCat[0]?.margemLucro ??
              0;

        // Resumo de margens atuais na categoria
        const margensUnicas = Array.from(new Set(itensCat.map((i) => Number(i.margemLucro) || 0))).sort((a, b) => a - b);
        let resumoMargem = 'Sem itens';
        if (qtdTotal > 0) {
          if (margensUnicas.length === 1) {
            resumoMargem = margensUnicas[0] > 0 ? `Todos em +${margensUnicas[0]}%` : `Todos em 0% (Custo Real)`;
          } else {
            resumoMargem = `De +${margensUnicas[0]}% a +${margensUnicas[margensUnicas.length - 1]}%`;
          }
        }

        return `
          <div class="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition shadow-2xs">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              <div class="lg:col-span-5">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-bold text-slate-900 text-sm">${this.esc(cat)}</span>
                  <span class="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    ${qtdTotal} ${qtdTotal === 1 ? 'item' : 'itens'}
                  </span>
                  <span class="text-[11px] font-bold ${
                    margemSalvaCat > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                  } px-2 py-0.5 rounded-md">
                    ${resumoMargem}
                  </span>
                </div>
                ${
                  qtdInd > 0
                    ? `
                  <div class="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                    <span>🎯 <strong>${qtdInd} ${qtdInd === 1 ? 'insumo ajustado' : 'insumos ajustados'} individualmente:</strong> ${itensIndividuais
                      .slice(0, 3)
                      .map((x) => `${this.esc(x.descricao)} (+${x.margemLucro || 0}%)`)
                      .join(', ')}${qtdInd > 3 ? '...' : ''}</span>
                    <button
                      type="button"
                      onclick="Aba1Insumos.igualarIndividuaisDaCategoriaModal('${this.esc(cat)}', ${idx})"
                      class="text-[10px] font-bold text-blue-700 hover:underline ml-auto whitespace-nowrap"
                      title="Faz com que todos os itens desta categoria passem a seguir a margem da categoria"
                    >
                      Igualar todos à categoria
                    </button>
                  </div>
                `
                    : `<span class="text-[11px] text-slate-400 block mt-0.5">Qualquer item pode ser alterado individualmente depois sem afetar os demais.</span>`
                }
              </div>

              <div class="lg:col-span-4 flex flex-wrap items-center gap-1">
                ${[0, 15, 25, 30, 50, 100]
                  .map(
                    (pct) => `
                  <button
                    type="button"
                    onclick="document.getElementById('cat-margem-input-${idx}').value='${pct}'"
                    class="px-2 py-1 rounded text-[11px] font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition"
                  >${pct === 0 ? '0%' : '+' + pct + '%'}</button>
                `
                  )
                  .join('')}
              </div>

              <div class="lg:col-span-3 flex items-center gap-2 justify-end">
                <div class="relative w-28">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    id="cat-margem-input-${idx}"
                    data-categoria="${this.esc(cat)}"
                    value="${margemSalvaCat}"
                    class="input-minimal py-1.5 pr-7 text-sm font-extrabold text-emerald-950 border-emerald-400 focus:ring-emerald-500"
                  />
                  <span class="text-xs font-bold text-emerald-700 absolute right-2.5 top-1/2 -translate-y-1/2">%</span>
                </div>
                <button
                  type="button"
                  onclick="Aba1Insumos.aplicarMargemUnicaCategoriaModal('${this.esc(cat)}', ${idx})"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition whitespace-nowrap"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    const modalHtml = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">
          <!-- Cabeçalho -->
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <i data-lucide="percent" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900">Margem de Lucro em Lote por Categoria</h3>
                <p class="text-xs text-slate-500">Defina a margem de repasse ao cliente de uma só vez por categoria. Você continua livre para ajustar qualquer insumo individualmente.</p>
              </div>
            </div>
            <button onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Barra Superior: Opção de Preservar Individuais + Atalho p/ Todas as Categorias -->
          <div class="px-6 py-3.5 bg-emerald-50/70 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <label class="flex items-start sm:items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                id="chk-preservar-individuais-modal"
                checked
                class="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 mt-0.5 sm:mt-0"
              />
              <div>
                <span class="text-xs font-bold text-emerald-950 block">🔒 Manter margem dos itens ajustados individualmente</span>
                <span class="text-[11px] text-emerald-800 block">Se marcado, insumos que você editou um por um não serão sobrescritos ao aplicar a margem da categoria.</span>
              </div>
            </label>

            <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs shrink-0">
              <span class="text-[11px] font-bold text-slate-700 whitespace-nowrap">Preencher todas com:</span>
              <div class="relative w-20">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  id="input-margem-todas-cats-modal"
                  placeholder="Ex: 30"
                  class="input-minimal py-1 pr-5 text-xs font-extrabold text-emerald-900"
                />
                <span class="text-[11px] font-bold text-emerald-700 absolute right-2 top-1/2 -translate-y-1/2">%</span>
              </div>
              <button
                type="button"
                onclick="Aba1Insumos.preencherInputsTodasCategoriasModal()"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition whitespace-nowrap"
              >
                Preencher Tudo
              </button>
            </div>
          </div>

          <!-- Lista de Categorias -->
          <div class="p-6 overflow-y-auto flex-1 space-y-2.5 bg-slate-50/40">
            ${linhasCategoriasHtml}
          </div>

          <!-- Rodapé -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span class="text-xs text-slate-500">
              💡 O <strong>Checklist de Compras</strong> continuará exibindo o Custo Real de Inventário (sem margem).
            </span>
            <div class="flex items-center gap-2">
              <button type="button" onclick="App.fecharModal()" class="btn-secondary text-xs py-2 px-4">
                Fechar
              </button>
              <button
                type="button"
                onclick="Aba1Insumos.salvarTodasMargensCategoriasModal()"
                class="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs py-2 px-5 font-bold"
              >
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Salvar Todas as Categorias</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
  },

  preencherInputsTodasCategoriasModal() {
    const val = Number(String(document.getElementById('input-margem-todas-cats-modal')?.value ?? '').replace(',', '.'));
    if (!Number.isFinite(val) || val < 0) {
      App.mostrarToast('Digite um percentual válido para preencher todas as categorias.', 'warning');
      return;
    }
    const inputs = document.querySelectorAll('[id^="cat-margem-input-"]');
    inputs.forEach((inp) => {
      inp.value = val;
    });
    App.mostrarToast(`Campos preenchidos com +${val}%. Clique em "Salvar Todas as Categorias" para confirmar.`);
  },

  aplicarMargemUnicaCategoriaModal(categoria, idx) {
    const inp = document.getElementById(`cat-margem-input-${idx}`);
    const val = Number(String(inp?.value ?? '').replace(',', '.'));
    if (!Number.isFinite(val) || val < 0) {
      App.mostrarToast('Informe uma margem válida (0% ou maior).', 'error');
      return;
    }
    const preservar = Boolean(document.getElementById('chk-preservar-individuais-modal')?.checked);
    const { atualizados, preservados, margemLimpa } = Store.aplicarMargemPorCategoria(categoria, val, preservar);
    this.render();
    this.abrirModalMargemCategorias();
    App.mostrarToast(
      `Categoria "${categoria}" atualizada para +${margemLimpa}% (${atualizados} itens atualizados${
        preservados > 0 ? `, ${preservados} individuais preservados` : ''
      })!`
    );
  },

  igualarIndividuaisDaCategoriaModal(categoria, idx) {
    const inp = document.getElementById(`cat-margem-input-${idx}`);
    const val = Number(String(inp?.value ?? '').replace(',', '.'));
    const margem = Number.isFinite(val) && val >= 0 ? val : Number(Store.state.margensCategorias?.[categoria]) || 0;
    const { atualizados, margemLimpa } = Store.aplicarMargemPorCategoria(categoria, margem, false);
    this.render();
    this.abrirModalMargemCategorias();
    App.mostrarToast(`Todos os ${atualizados} itens de "${categoria}" foram igualados para +${margemLimpa}%!`);
  },

  salvarTodasMargensCategoriasModal() {
    const preservar = Boolean(document.getElementById('chk-preservar-individuais-modal')?.checked);
    const inputs = document.querySelectorAll('[id^="cat-margem-input-"]');
    let totalAtualizados = 0;
    let totalPreservados = 0;

    inputs.forEach((inp) => {
      const cat = inp.getAttribute('data-categoria');
      const val = Number(String(inp.value ?? '').replace(',', '.'));
      if (cat && Number.isFinite(val) && val >= 0) {
        const res = Store.aplicarMargemPorCategoria(cat, val, preservar);
        totalAtualizados += res.atualizados;
        totalPreservados += res.preservados;
      }
    });

    App.fecharModal();
    this.render();
    App.mostrarToast(
      `Margens por categoria salvas! ${totalAtualizados} insumo(s) atualizado(s)${
        totalPreservados > 0 ? ` e ${totalPreservados} item(ns) com margem individual preservado(s)` : ''
      }.`
    );
  },

  downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
