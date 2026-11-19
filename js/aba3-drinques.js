// Aba 3: Criação de Drinques (Montagem Dinâmica)

const TAGS_SENSORIAIS_SUGERIDAS = [
  'Cítrico',
  'Refrescante',
  'Doce',
  'Seco',
  'Amargo Leve',
  'Encorpado',
  'Frutado',
  'Herbal',
  'Picante',
  'Cremoso',
  'Borbulhante',
  'Autoral'
];

window.Aba3Drinques = {
  filtroTexto: '',
  editandoId: null,
  fotoTemp: '',
  tagsTemp: [],
  ingredientesTemp: [],

  render() {
    const container = document.getElementById('tab-drinques');
    if (!container) return;

    const drinques = this.getDrinquesFiltrados();

    container.innerHTML = `
      <!-- Cabeçalho -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <i data-lucide="martini" class="w-4 h-4"></i>
            <span>Módulo 03 • Coquetelaria & Cardápio</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Criação de Drinques (Montagem Dinâmica)</h1>
          <p class="text-sm text-slate-500 mt-0.5">Monte o cardápio visual 1:1 com vínculo inteligente de ingredientes para precificação automática nas Linhas A, B e C.</p>
        </div>

        <div>
          <button onclick="Aba3Drinques.abrirModalDrinque()" class="btn-primary">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Criar Novo Drinque</span>
          </button>
        </div>
      </div>

      <!-- Busca -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input
            type="text"
            placeholder="Buscar drinque por nome, perfil sensorial (ex: Cítrico), guarnição ou ingrediente..."
            value="${this.filtroTexto}"
            oninput="Aba3Drinques.atualizarFiltroTexto(this.value)"
            class="input-minimal pl-9"
          />
        </div>
      </div>

      <!-- Grid de Cards de Drinques -->
      <div id="grid-drinques-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        ${this.renderCardsDrinques(drinques)}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  getDrinquesFiltrados() {
    const termo = (this.filtroTexto || '').toLowerCase().trim();
    return (Store.state.drinques || [])
      .filter((d) => {
        if (!termo) return true;
        const matchNome = (d.nome || '').toLowerCase().includes(termo);
        const matchGuarnicao = (d.guarnicao || '').toLowerCase().includes(termo);
        const matchTags = (d.perfilSensorial || []).some((t) => String(t || '').toLowerCase().includes(termo));
        const matchIngredientes = (d.ingredientes || []).some((ing) => {
          if ((ing.grupoGenerico || '').toLowerCase().includes(termo)) return true;
          const ins = Store.resolverInsumoPorLinha(ing, 'A');
          return ins && (ins.descricao || '').toLowerCase().includes(termo);
        });
        return matchNome || matchGuarnicao || matchTags || matchIngredientes;
      })
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));
  },

  renderCardsDrinques(drinques) {
    if (!drinques || drinques.length === 0) {
      return `
        <div class="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div class="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <i data-lucide="martini" class="w-8 h-8"></i>
          </div>
          <h3 class="text-base font-bold text-slate-800">Nenhum drinque encontrado</h3>
          <p class="text-xs text-slate-500 mt-1 mb-4">Adicione coquetéis ao seu catálogo para utilizá-los nos orçamentos.</p>
          <button onclick="Aba3Drinques.abrirModalDrinque()" class="btn-primary">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Criar Primeiro Drinque</span>
          </button>
        </div>
      `;
    }

    const defaultSvg = Store.getDefaultDrinkSvg();

    return drinques
      .map((d) => {
        const calcA = Store.calcularCustoDrinquePorLinha(d, 'A');
        const calcB = Store.calcularCustoDrinquePorLinha(d, 'B');
        const calcC = Store.calcularCustoDrinquePorLinha(d, 'C');
        const imgSrc = d.foto && d.foto.trim() ? d.foto : defaultSvg;

        return `
          <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition group">
            <!-- Imagem 1:1 -->
            <div class="aspect-square-box bg-blue-50/40 border-b border-slate-100">
              <img src="${imgSrc}" alt="${d.nome}" class="w-full h-full object-cover" />
              <div class="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-95">
                <button
                  onclick="Aba3Drinques.abrirModalDrinque('${d.id}')"
                  class="p-2 bg-white/90 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl shadow-sm transition"
                  title="Editar Drinque"
                >
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button
                  onclick="Aba3Drinques.excluirDrinque('${d.id}')"
                  class="p-2 bg-white/90 hover:bg-red-600 text-slate-600 hover:text-white rounded-xl shadow-sm transition"
                  title="Excluir Drinque"
                >
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Conteúdo -->
            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 class="font-bold text-slate-900 text-base leading-snug">${d.nome}</h3>

                <!-- Tags de Perfil Sensorial -->
                <div class="flex flex-wrap gap-1 mt-2">
                  ${(d.perfilSensorial || [])
                    .map(
                      (tag) =>
                        `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">${tag}</span>`
                    )
                    .join('')}
                </div>

                <!-- Guarnição -->
                <div class="mt-2.5 text-xs text-slate-600 flex items-start gap-1.5">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5"></i>
                  <span><strong class="text-slate-700">Guarnição:</strong> ${d.guarnicao || 'Sem guarnição'}</span>
                </div>

                <!-- Resumo de Ingredientes -->
                <div class="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                  <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Composição por Dose:</span>
                    ${(d.ingredientes || [])
                    .map((ing) => {
                      const insumoRef = Store.resolverInsumoPorLinha(ing, 'A');
                      const un = insumoRef ? insumoRef.unidade : 'ml';
                      const labelIng =
                        ing.tipoVinculo === 'GENERICO' && ing.grupoGenerico
                          ? `<span class="text-blue-700 font-semibold">${ing.grupoGenerico} (Linha A/B/C)</span>`
                          : insumoRef && insumoRef.producaoPropria
                          ? `<span class="text-slate-800 font-medium">${insumoRef.descricao}</span> <span class="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1 rounded">🧪 Próprio</span>`
                          : `<span>${insumoRef ? insumoRef.descricao : 'Insumo'}</span>`;
                      return `
                        <div class="flex items-center justify-between text-xs text-slate-600">
                          <span class="truncate pr-2">• ${labelIng}</span>
                          <span class="font-mono font-semibold text-slate-800 whitespace-nowrap">${ing.quantidade} ${un}</span>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </div>

              <!-- Comparativo de Custo por Dose nas 3 Linhas -->
              <div class="pt-3 border-t border-slate-100">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">Custo por Dose Estimado:</span>
                <div class="grid grid-cols-3 gap-1.5 text-center">
                  <div class="bg-blue-50/70 border border-blue-200 rounded-lg py-1 px-1.5">
                    <span class="block text-[10px] font-bold text-blue-800">Linha A</span>
                    <span class="text-xs font-bold text-blue-700">${Store.formatCurrency(calcA.custoDose)}</span>
                  </div>
                  <div class="bg-indigo-50/70 border border-indigo-200 rounded-lg py-1 px-1.5">
                    <span class="block text-[10px] font-bold text-indigo-800">Linha B</span>
                    <span class="text-xs font-bold text-indigo-700">${Store.formatCurrency(calcB.custoDose)}</span>
                  </div>
                  <div class="bg-slate-100 border border-slate-200 rounded-lg py-1 px-1.5">
                    <span class="block text-[10px] font-bold text-slate-700">Linha C</span>
                    <span class="text-xs font-bold text-slate-800">${Store.formatCurrency(calcC.custoDose)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  },

  atualizarFiltroTexto(val) {
    this.filtroTexto = val;
    const grid = document.getElementById('grid-drinques-container');
    if (grid) {
      grid.innerHTML = this.renderCardsDrinques(this.getDrinquesFiltrados());
      if (window.lucide) window.lucide.createIcons();
    }
  },

  abrirModalDrinque(id = null) {
    this.editandoId = id;
    const item = id ? Store.state.drinques.find((d) => d.id === id) : null;

    const nome = item ? item.nome : '';
    const guarnicao = item ? item.guarnicao : '';
    this.fotoTemp = item ? item.foto || '' : '';
    this.tagsTemp = item && item.perfilSensorial ? [...item.perfilSensorial] : ['Cítrico', 'Refrescante'];
    this.ingredientesTemp =
      item && item.ingredientes && item.ingredientes.length > 0
        ? JSON.parse(JSON.stringify(item.ingredientes))
        : [{ tipoVinculo: 'GENERICO', grupoGenerico: 'Gin', insumoId: 'ins-gin-a', quantidade: 50 }];

    const defaultSvg = Store.getDefaultDrinkSvg();

    const modalHtml = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8">
          <!-- Cabeçalho -->
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <i data-lucide="martini" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">${id ? 'Editar Drinque' : 'Montagem Dinâmica de Novo Drinque'}</h3>
                <p class="text-xs text-slate-500">Configure foto 1:1, perfil sensorial, guarnição e construtor inteligente de ingredientes.</p>
              </div>
            </div>
            <button onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Corpo -->
          <div class="p-6 max-h-[80vh] overflow-y-auto space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
              <!-- Coluna Foto 1:1 -->
              <div class="md:col-span-4 flex flex-col items-center">
                <label class="block text-xs font-semibold text-slate-700 self-start mb-1.5">Foto do Drinque (Proporção 1:1)</label>
                <div class="w-full max-w-[230px] rounded-2xl overflow-hidden border-2 border-dashed border-blue-200 bg-blue-50/30 relative">
                  <div class="aspect-square-box">
                    <img id="drk-foto-preview" src="${this.fotoTemp || defaultSvg}" alt="Preview" class="w-full h-full object-cover" />
                  </div>
                </div>

                <div class="flex items-center gap-2 mt-3 w-full max-w-[230px]">
                  <label class="btn-secondary flex-1 justify-center text-xs py-1.5 cursor-pointer">
                    <i data-lucide="camera" class="w-3.5 h-3.5 text-blue-600"></i>
                    <span>Enviar Foto</span>
                    <input type="file" accept="image/*" class="hidden" onchange="Aba3Drinques.processarUploadFotoQuadrada(event)" />
                  </label>
                  <button
                    type="button"
                    onclick="Aba3Drinques.removerFotoTemp()"
                    class="btn-secondary text-xs py-1.5 px-2.5 text-slate-500 hover:text-red-600"
                    title="Usar pictograma minimalista padrão"
                  >
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
                <p class="text-[11px] text-slate-400 text-center mt-1.5">Recorte 1:1 automático. Sem foto, exibe a taça minimalista azul.</p>
              </div>

              <!-- Coluna Dados do Drinque -->
              <div class="md:col-span-8 space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Nome do Drinque *</label>
                  <input
                    type="text"
                    id="drk-nome"
                    value="${nome}"
                    placeholder="Ex: Moscow Mule, Gin Tônica Tropical, Negroni..."
                    class="input-minimal font-semibold text-base"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Guarnição / Finalização</label>
                  <input
                    type="text"
                    id="drk-guarnicao"
                    value="${guarnicao}"
                    placeholder="Ex: Espuma de gengibre e raspa de limão tahiti"
                    class="input-minimal"
                  />
                </div>

                <!-- Perfil Sensorial -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Perfil Sensorial (Clique para ativar/desativar ou digite)</label>
                  <div id="drk-tags-container" class="flex flex-wrap gap-1.5 mb-2">
                    <!-- Tags renderizadas via JS -->
                  </div>
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      id="drk-nova-tag"
                      placeholder="Adicionar outra característica (ex: Defumado, Floral)..."
                      onkeydown="if(event.key==='Enter'){event.preventDefault();Aba3Drinques.adicionarTagCustom();}"
                      class="input-minimal text-xs py-1.5"
                    />
                    <button type="button" onclick="Aba3Drinques.adicionarTagCustom()" class="btn-secondary text-xs py-1.5 whitespace-nowrap">
                      + Tag
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Construtor de Ingredientes -->
            <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <i data-lucide="flask-conical" class="w-4 h-4 text-blue-600"></i>
                    Construtor de Ingredientes por Dose
                  </h4>
                  <p class="text-[11px] text-slate-500">
                    Vincule um <strong>Insumo Genérico</strong> (ex: Gin, Vodka) para precificar automaticamente pela Linha (A, B ou C) na proposta, ou escolha um <strong>Insumo Específico</strong>.
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <button type="button" onclick="Aba3Drinques.adicionarIngredienteTemp('GENERICO')" class="btn-secondary text-xs py-1.5 px-3">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 text-blue-600"></i>
                    <span>+ Base Dinâmica (Linha A/B/C)</span>
                  </button>
                  <button type="button" onclick="Aba3Drinques.adicionarIngredienteTemp('INSUMO')" class="btn-primary text-xs py-1.5 px-3">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                    <span>+ Insumo da Aba 1</span>
                  </button>
                </div>
              </div>

              <div id="lista-ingredientes-modal" class="space-y-2.5">
                <!-- Ingredientes renderizados via JS -->
              </div>

              <!-- Preview de Custo da Dose no Modal -->
              <div id="resumo-custo-drinque-modal" class="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <!-- Preenchido via JS -->
              </div>
            </div>
          </div>

          <!-- Rodapé -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button type="button" onclick="App.fecharModal()" class="btn-secondary">Cancelar</button>
            <button type="button" onclick="Aba3Drinques.salvarDrinque()" class="btn-primary">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Salvar Drinque</span>
            </button>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
    this.renderTagsModal();
    this.renderIngredientesModal();
  },

  /**
   * Faz o recorte quadrado automático 1:1 (400x400) da foto enviada pelo usuário
   */
  processarUploadFotoQuadrada(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Recorte central 1:1
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        this.fotoTemp = canvas.toDataURL('image/jpeg', 0.86);
        const preview = document.getElementById('drk-foto-preview');
        if (preview) preview.src = this.fotoTemp;
        App.mostrarToast('Foto ajustada automaticamente na proporção 1:1!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  removerFotoTemp() {
    this.fotoTemp = '';
    const preview = document.getElementById('drk-foto-preview');
    if (preview) preview.src = Store.getDefaultDrinkSvg();
  },

  renderTagsModal() {
    const container = document.getElementById('drk-tags-container');
    if (!container) return;

    const todasTags = Array.from(new Set([...TAGS_SENSORIAIS_SUGERIDAS, ...this.tagsTemp]));

    container.innerHTML = todasTags
      .map((tag) => {
        const ativa = this.tagsTemp.includes(tag);
        return `
          <button
            type="button"
            onclick="Aba3Drinques.toggleTag('${tag.replace(/'/g, "\\'")}')"
            class="px-2.5 py-1 rounded-full text-xs font-medium transition border ${
              ativa
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }"
          >
            ${ativa ? '✓ ' : '+ '}${tag}
          </button>
        `;
      })
      .join('');
  },

  toggleTag(tag) {
    if (this.tagsTemp.includes(tag)) {
      this.tagsTemp = this.tagsTemp.filter((t) => t !== tag);
    } else {
      this.tagsTemp.push(tag);
    }
    this.renderTagsModal();
  },

  adicionarTagCustom() {
    const input = document.getElementById('drk-nova-tag');
    const val = input?.value.trim();
    if (!val) return;
    if (!this.tagsTemp.includes(val)) {
      this.tagsTemp.push(val);
    }
    input.value = '';
    this.renderTagsModal();
  },

  sincronizarIngredientesTemp() {
    this.ingredientesTemp = this.ingredientesTemp.map((ing, idx) => {
      const elTipo = document.getElementById(`ing-tipo-${idx}`);
      const elVal = document.getElementById(`ing-valor-${idx}`);
      const elQtd = document.getElementById(`ing-qtd-${idx}`);

      const tipoVinculo = elTipo ? elTipo.value : ing.tipoVinculo;
      const quantidade = elQtd ? Number(elQtd.value) || 0 : ing.quantidade;

      if (tipoVinculo === 'GENERICO') {
        const grupoGenerico = elVal ? elVal.value : ing.grupoGenerico || 'Gin';
        const insumoMatch = Store.state.insumos.find(
          (i) => i.grupoGenerico && i.grupoGenerico.toLowerCase() === grupoGenerico.toLowerCase()
        );
        return {
          tipoVinculo: 'GENERICO',
          grupoGenerico,
          insumoId: insumoMatch ? insumoMatch.id : Store.state.insumos[0]?.id || '',
          quantidade
        };
      } else {
        const insumoId = elVal ? elVal.value : ing.insumoId;
        const insObj = Store.state.insumos.find((i) => i.id === insumoId);
        return {
          tipoVinculo: 'INSUMO',
          grupoGenerico: insObj?.grupoGenerico || '',
          insumoId,
          fixarMarcaEspecifica: true,
          quantidade
        };
      }
    });
  },

  adicionarIngredienteTemp(tipo = 'INSUMO') {
    this.sincronizarIngredientesTemp();
    if (tipo === 'GENERICO') {
      const primeiroGrupo = Store.state.gruposGenericos[0] || 'Gin';
      this.ingredientesTemp.push({
        tipoVinculo: 'GENERICO',
        grupoGenerico: primeiroGrupo,
        insumoId: 'ins-gin-a',
        quantidade: 50
      });
    } else {
      const primeiroInsumo = Store.state.insumos.find((i) => i.semLinha) || Store.state.insumos[0];
      this.ingredientesTemp.push({
        tipoVinculo: 'INSUMO',
        grupoGenerico: '',
        insumoId: primeiroInsumo ? primeiroInsumo.id : '',
        fixarMarcaEspecifica: true,
        quantidade: 25
      });
    }
    this.renderIngredientesModal();
  },

  removerIngredienteTemp(idx) {
    this.sincronizarIngredientesTemp();
    if (this.ingredientesTemp.length <= 1) {
      App.mostrarToast('O drinque precisa ter pelo menos 1 ingrediente.', 'warning');
      return;
    }
    this.ingredientesTemp.splice(idx, 1);
    this.renderIngredientesModal();
  },

  trocarTipoVinculoIngrediente(idx, novoTipo) {
    this.sincronizarIngredientesTemp();
    this.ingredientesTemp[idx].tipoVinculo = novoTipo;
    if (novoTipo === 'GENERICO') {
      this.ingredientesTemp[idx].grupoGenerico = Store.state.gruposGenericos[0] || 'Gin';
      this.ingredientesTemp[idx].fixarMarcaEspecifica = false;
    } else {
      const primeiroInsumo = Store.state.insumos[0];
      this.ingredientesTemp[idx].insumoId = primeiroInsumo ? primeiroInsumo.id : '';
      this.ingredientesTemp[idx].fixarMarcaEspecifica = true;
    }
    this.renderIngredientesModal();
  },

  renderIngredientesModal() {
    const container = document.getElementById('lista-ingredientes-modal');
    const resumoContainer = document.getElementById('resumo-custo-drinque-modal');
    if (!container) return;

    const grupos = Store.state.gruposGenericos || [];
    const insumos = Store.state.insumos || [];

    container.innerHTML = this.ingredientesTemp
      .map((ing, idx) => {
        const isGen = ing.tipoVinculo === 'GENERICO';
        const insumoRef = Store.resolverInsumoPorLinha(ing, 'A');
        const unidade = insumoRef ? insumoRef.unidade : 'ml';

        return `
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white p-2.5 rounded-xl border border-slate-200">
            <div class="sm:col-span-3">
              <label class="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Modo de Vínculo</label>
              <select
                id="ing-tipo-${idx}"
                onchange="Aba3Drinques.trocarTipoVinculoIngrediente(${idx}, this.value)"
                class="input-minimal py-1.5 text-xs font-medium"
              >
                <option value="GENERICO" ${isGen ? 'selected' : ''}>🔄 Dinâmico (Linha A/B/C)</option>
                <option value="INSUMO" ${!isGen ? 'selected' : ''}>📌 Insumo Específico</option>
              </select>
            </div>

            <div class="sm:col-span-5">
              <label class="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                ${isGen ? 'Grupo de Bebida Base (Muda conforme Linha A/B/C)' : 'Produto / Insumo Cadastrado na Aba 1'}
              </label>
              ${
                isGen
                  ? `
                <select
                  id="ing-valor-${idx}"
                  onchange="Aba3Drinques.sincronizarIngredientesTemp(); Aba3Drinques.renderIngredientesModal()"
                  class="input-minimal py-1.5 text-xs font-semibold text-blue-800 bg-blue-50/40"
                >
                  ${grupos
                    .map(
                      (g) =>
                        `<option value="${g}" ${ing.grupoGenerico === g ? 'selected' : ''}>${g} (Adapta Linha A / B / C)</option>`
                    )
                    .join('')}
                </select>
              `
                  : `
                <select
                  id="ing-valor-${idx}"
                  onchange="Aba3Drinques.sincronizarIngredientesTemp(); Aba3Drinques.renderIngredientesModal()"
                  class="input-minimal py-1.5 text-xs"
                >
                  ${insumos
                    .map(
                      (ins) =>
                        `<option value="${ins.id}" ${ing.insumoId === ins.id ? 'selected' : ''}>${ins.descricao} (${
                          ins.producaoPropria
                            ? '🧪 Produção Própria • ' + Store.formatCurrency(Store.getInsumoCustoInfo(ins).custoPorUnidadeBase) + '/' + ins.unidade
                            : ins.semLinha
                            ? 'Comum'
                            : 'Linha ' + ins.linha
                        })</option>`
                    )
                    .join('')}
                </select>
              `
              }
            </div>

            <div class="sm:col-span-3">
              <label class="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Dosagem por Drinque</label>
              <div class="relative">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  id="ing-qtd-${idx}"
                  value="${ing.quantidade}"
                  oninput="Aba3Drinques.sincronizarIngredientesTemp(); Aba3Drinques.atualizarPreviewCustosModal()"
                  class="input-minimal py-1.5 pr-10 text-xs font-bold"
                />
                <span class="text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">${unidade}</span>
              </div>
            </div>

            <div class="sm:col-span-1 flex items-end justify-end pt-4">
              <button
                type="button"
                onclick="Aba3Drinques.removerIngredienteTemp(${idx})"
                class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                title="Remover ingrediente"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    this.atualizarPreviewCustosModal();
    if (window.lucide) window.lucide.createIcons();
  },

  atualizarPreviewCustosModal() {
    const resumoContainer = document.getElementById('resumo-custo-drinque-modal');
    if (!resumoContainer) return;

    const mockDrinque = { ingredientes: this.ingredientesTemp };
    const cA = Store.calcularCustoDrinquePorLinha(mockDrinque, 'A');
    const cB = Store.calcularCustoDrinquePorLinha(mockDrinque, 'B');
    const cC = Store.calcularCustoDrinquePorLinha(mockDrinque, 'C');

    resumoContainer.innerHTML = `
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-blue-900 block">Custo Dose • Linha A (Premium)</span>
          <span class="text-[10px] text-blue-700">Marcas Linha A + Sem Linha</span>
        </div>
        <span class="text-sm font-extrabold text-blue-800">${Store.formatCurrency(cA.custoDose)}</span>
      </div>

      <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-indigo-900 block">Custo Dose • Linha B (Padrão)</span>
          <span class="text-[10px] text-indigo-700">Marcas Linha B + Sem Linha</span>
        </div>
        <span class="text-sm font-extrabold text-indigo-800">${Store.formatCurrency(cB.custoDose)}</span>
      </div>

      <div class="bg-slate-100 border border-slate-300 rounded-xl p-2.5 flex items-center justify-between">
        <div>
          <span class="text-[11px] font-bold text-slate-800 block">Custo Dose • Linha C (Econômica)</span>
          <span class="text-[10px] text-slate-600">Marcas Linha C + Sem Linha</span>
        </div>
        <span class="text-sm font-extrabold text-slate-900">${Store.formatCurrency(cC.custoDose)}</span>
      </div>
    `;
  },

  salvarDrinque() {
    this.sincronizarIngredientesTemp();

    const nome = document.getElementById('drk-nome')?.value.trim();
    const guarnicao = document.getElementById('drk-guarnicao')?.value.trim() || '';

    if (!nome) {
      App.mostrarToast('Informe o Nome do Drinque.', 'error');
      return;
    }

    if (!Array.isArray(this.ingredientesTemp) || this.ingredientesTemp.length === 0) {
      App.mostrarToast('Adicione pelo menos 1 ingrediente na receita do drinque.', 'error');
      return;
    }

    const ingInvalido = this.ingredientesTemp.some((ing) => {
      const qtd = Number(ing.quantidade);
      if (!Number.isFinite(qtd) || qtd <= 0) return true;
      if (ing.tipoVinculo === 'GENERICO') return !String(ing.grupoGenerico || '').trim();
      return !String(ing.insumoId || '').trim();
    });

    if (ingInvalido) {
      App.mostrarToast(
        'Verifique os ingredientes: selecione o produto/grupo e informe dosagem maior que zero.',
        'error'
      );
      return;
    }

    const dados = {
      id: this.editandoId || 'drk-' + Date.now(),
      nome,
      foto: this.fotoTemp || '',
      perfilSensorial: this.tagsTemp,
      guarnicao,
      ingredientes: this.ingredientesTemp.map((ing) => ({
        ...ing,
        quantidade: Number(ing.quantidade)
      }))
    };

    if (this.editandoId) {
      const idx = Store.state.drinques.findIndex((d) => d.id === this.editandoId);
      if (idx >= 0) Store.state.drinques[idx] = dados;
      App.mostrarToast('Drinque atualizado! Propostas vinculadas recalculadas automaticamente.');
    } else {
      Store.state.drinques.unshift(dados);
      App.mostrarToast('Novo drinque adicionado ao cardápio!');
    }

    Store.save();
    App.fecharModal();
    this.render();
  },

  excluirDrinque(id) {
    const item = Store.state.drinques.find((d) => d.id === id);
    if (!item) return;

    const propsAfetadas = (Store.state.propostas || []).filter((p) =>
      (p.coqueteis || []).some((c) => c.drinqueId === id)
    );
    const msg =
      propsAfetadas.length > 0
        ? `O drinque "${item.nome}" faz parte do cardápio de ${propsAfetadas.length} proposta(s) salva(s) (${propsAfetadas
            .map((p) => p.nomeEvento)
            .join(', ')}).\n\nDeseja realmente excluí-lo e removê-lo automaticamente dessas propostas?`
        : `Deseja realmente excluir o drinque "${item.nome}"?`;

    if (!confirm(msg)) return;

    Store.excluirDrinqueComIntegridade(id);
    this.render();
    App.mostrarToast('Drinque removido e propostas atualizadas.');
  }
};

