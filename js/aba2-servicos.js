// Aba 2: Cadastro de Serviços (Mão de Obra, Estrutura e Logística)

window.Aba2Servicos = {
  filtroTexto: '',
  filtroCategoria: 'TODAS',
  editandoId: null,

  render() {
    const container = document.getElementById('tab-servicos');
    if (!container) return;

    const categorias = Store.state.categoriasServicos || [];
    const servicos = this.getServicosFiltrados();

    container.innerHTML = `
      <!-- Cabeçalho -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <i data-lucide="user-check" class="w-4 h-4"></i>
            <span>Módulo 02 • Equipe, Estrutura & Taxas</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Cadastro de Serviços Operacionais</h1>
          <p class="text-sm text-slate-500 mt-0.5">Configure custos de mão de obra (Bartenders, Barbacks, Copeiros), frete, estrutura e regras de dimensionamento.</p>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="Aba2Servicos.gerenciarCategoriasPrompt()" class="btn-secondary">
            <i data-lucide="folder-plus" class="w-4 h-4 text-blue-600"></i>
            <span>Nova Categoria</span>
          </button>
          <button onclick="Aba2Servicos.abrirModalServico()" class="btn-primary">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Novo Serviço</span>
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div class="md:col-span-8 relative">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input
              type="text"
              placeholder="Buscar serviço por descrição, categoria ou observações..."
              value="${this.filtroTexto}"
              oninput="Aba2Servicos.atualizarFiltroTexto(this.value)"
              class="input-minimal pl-9"
            />
          </div>
          <div class="md:col-span-4">
            <select onchange="Aba2Servicos.atualizarFiltroCategoria(this.value)" class="input-minimal">
              <option value="TODAS" ${this.filtroCategoria === 'TODAS' ? 'selected' : ''}>Todas as Categorias de Serviço</option>
              ${categorias
                .map((c) => `<option value="${c}" ${this.filtroCategoria === c ? 'selected' : ''}>${c}</option>`)
                .join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Tabela de Serviços -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-clean">
            <thead>
              <tr>
                <th><div class="flex items-center gap-1.5"><i data-lucide="briefcase" class="w-3.5 h-3.5"></i> Descrição do Serviço</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="tag" class="w-3.5 h-3.5"></i> Categoria</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="users" class="w-3.5 h-3.5"></i> Regra Dimensionamento</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="clock" class="w-3.5 h-3.5"></i> Valor / Hora (R$)</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="dollar-sign" class="w-3.5 h-3.5"></i> Valor Diária / Base</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="file-text" class="w-3.5 h-3.5"></i> Observações</div></th>
                <th class="text-right"><div class="flex items-center justify-end gap-1.5"><i data-lucide="sliders" class="w-3.5 h-3.5"></i> Ações</div></th>
              </tr>
            </thead>
            <tbody id="tabela-servicos-body">
              ${this.renderLinhasServicos(servicos)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  getServicosFiltrados() {
    const termo = (this.filtroTexto || '').toLowerCase().trim();
    return (Store.state.servicos || []).filter((s) => {
      if (this.filtroCategoria !== 'TODAS' && s.categoria !== this.filtroCategoria) return false;
      if (termo) {
        return (
          (s.descricao || '').toLowerCase().includes(termo) ||
          (s.categoria || '').toLowerCase().includes(termo) ||
          (s.observacoes || '').toLowerCase().includes(termo)
        );
      }
      return true;
    });
  },

  renderLinhasServicos(servicos) {
    if (!servicos || servicos.length === 0) {
      return `
        <tr>
          <td colspan="7" class="text-center py-12 text-slate-400">
            <div class="flex flex-col items-center justify-center gap-2">
              <i data-lucide="user-plus" class="w-10 h-10 text-slate-300"></i>
              <p class="text-sm font-medium text-slate-600">Nenhum serviço encontrado.</p>
            </div>
          </td>
        </tr>
      `;
    }

    return servicos
      .map(
        (s) => `
        <tr>
          <td class="font-semibold text-slate-900">${s.descricao}</td>
          <td>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              ${s.categoria}
            </span>
          </td>
          <td class="text-xs text-slate-600">
            ${
              Number(s.convidadosPorUnidade) > 0
                ? `<span class="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">1 a cada ${s.convidadosPorUnidade} conv.</span>`
                : `<span class="text-slate-400">Taxa fixa / Manual</span>`
            }
          </td>
          <td class="whitespace-nowrap">
            ${
              Number(s.valorHora) > 0
                ? `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">${Store.formatCurrency(s.valorHora)}/h</span>`
                : `<span class="text-xs text-slate-400 font-medium">Fixo / -</span>`
            }
          </td>
          <td class="font-bold text-blue-700 whitespace-nowrap">${Store.formatCurrency(s.valorUnitario)}</td>
          <td class="text-xs text-slate-500 max-w-xs">${s.observacoes || '-'}</td>
          <td class="text-right whitespace-nowrap">
            <div class="inline-flex items-center gap-1">
              <button
                onclick="Aba2Servicos.abrirModalServico('${s.id}')"
                class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Editar Serviço"
              >
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button
                onclick="Aba2Servicos.excluirServico('${s.id}')"
                class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Excluir Serviço"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `
      )
      .join('');
  },

  atualizarFiltroTexto(val) {
    this.filtroTexto = val;
    const tbody = document.getElementById('tabela-servicos-body');
    if (tbody) {
      tbody.innerHTML = this.renderLinhasServicos(this.getServicosFiltrados());
      if (window.lucide) window.lucide.createIcons();
    }
  },

  atualizarFiltroCategoria(val) {
    this.filtroCategoria = val;
    this.render();
  },

  gerenciarCategoriasPrompt() {
    const nova = prompt('Digite o nome da nova Categoria de Serviço (ex: Locação de Vidrarias, Segurança):');
    if (nova && nova.trim()) {
      const limpo = nova.trim();
      if (!Store.state.categoriasServicos.includes(limpo)) {
        Store.state.categoriasServicos.push(limpo);
        Store.save();
        this.render();
        App.mostrarToast(`Categoria "${limpo}" adicionada!`);
      }
    }
  },

  abrirModalServico(id = null) {
    this.editandoId = id;
    const item = id ? Store.state.servicos.find((s) => s.id === id) : null;
    const categorias = Store.state.categoriasServicos || [];

    const descricao = item ? item.descricao : '';
    const categoria = item ? item.categoria : categorias[0] || 'Mão de Obra';
    const valorUnitario = item ? item.valorUnitario : '';
    const valorHora = item ? (item.valorHora !== undefined && item.valorHora !== null ? item.valorHora : '') : '';
    const convidadosPorUnidade = item ? item.convidadosPorUnidade || 0 : 0;
    const observacoes = item ? item.observacoes || '' : '';

    const modalHtml = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <i data-lucide="briefcase" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">${id ? 'Editar Serviço' : 'Novo Serviço Operacional'}</h3>
                <p class="text-xs text-slate-500">Mão de obra, transporte, estrutura ou taxas.</p>
              </div>
            </div>
            <button onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Descrição do Serviço *</label>
              <input
                type="text"
                id="srv-descricao"
                value="${descricao}"
                placeholder="Ex: Bartender Profissional, Barback, Frete..."
                class="input-minimal"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700">Categoria *</label>
                  <button
                    type="button"
                    onclick="Aba2Servicos.criarCategoriaNoModal()"
                    class="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    + Nova
                  </button>
                </div>
                <select id="srv-categoria" class="input-minimal">
                  ${categorias
                    .map((c) => `<option value="${c}" ${c === categoria ? 'selected' : ''}>${c}</option>`)
                    .join('')}
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Valor Hora (R$/h)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="srv-valor-hora"
                  value="${valorHora}"
                  placeholder="Ex: 30.00"
                  oninput="Aba2Servicos.aoDigitarValorHora(this.value)"
                  class="input-minimal font-semibold text-emerald-700 bg-emerald-50/30 border-emerald-200"
                />
                <span class="text-[10px] text-slate-400 block mt-0.5">Base por hora evento</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Valor Diária (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="srv-valor"
                  value="${valorUnitario}"
                  placeholder="Ex: 180.00"
                  oninput="Aba2Servicos.aoDigitarValorUnitario(this.value)"
                  class="input-minimal font-semibold"
                />
                <span class="text-[10px] text-slate-400 block mt-0.5">Base padrão (ex: 6h)</span>
              </div>
            </div>

            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Regra de Dimensionamento Automático (Opcional)
              </label>
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-600">Sugerir 1 unidade a cada</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  id="srv-regra-convidados"
                  value="${convidadosPorUnidade}"
                  class="input-minimal w-24 text-center font-semibold"
                />
                <span class="text-xs text-slate-600">convidados (0 = quantidade fixa/manual)</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
              <textarea
                id="srv-observacoes"
                rows="3"
                placeholder="Ex: Bartender para até 50 convidados, turno de 6 horas..."
                class="input-minimal"
              >${observacoes}</textarea>
            </div>
          </div>

          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button type="button" onclick="App.fecharModal()" class="btn-secondary">Cancelar</button>
            <button type="button" onclick="Aba2Servicos.salvarServico()" class="btn-primary">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Salvar Serviço</span>
            </button>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
  },

  criarCategoriaNoModal() {
    const nova = prompt('Nome da nova categoria de serviço:');
    if (nova && nova.trim()) {
      const limpo = nova.trim();
      if (!Store.state.categoriasServicos.includes(limpo)) {
        Store.state.categoriasServicos.push(limpo);
        Store.save();
      }
      const sel = document.getElementById('srv-categoria');
      if (sel) {
        sel.innerHTML = Store.state.categoriasServicos
          .map((c) => `<option value="${c}" ${c === limpo ? 'selected' : ''}>${c}</option>`)
          .join('');
      }
    }
  },

  aoDigitarValorHora(val) {
    const num = Number(val);
    const inpUnit = document.getElementById('srv-valor');
    if (inpUnit && Number.isFinite(num) && num > 0) {
      if (!inpUnit.value || Number(inpUnit.value) === 0) {
        inpUnit.value = (num * 6).toFixed(2);
      }
    }
  },

  aoDigitarValorUnitario(val) {
    const num = Number(val);
    const inpHora = document.getElementById('srv-valor-hora');
    if (inpHora && Number.isFinite(num) && num > 0) {
      if (!inpHora.value || Number(inpHora.value) === 0) {
        inpHora.value = (num / 6).toFixed(2);
      }
    }
  },

  salvarServico() {
    const descricao = document.getElementById('srv-descricao')?.value.trim();
    const categoria = document.getElementById('srv-categoria')?.value || 'Mão de Obra';
    const valorRaw = document.getElementById('srv-valor')?.value;
    const valorUnitario = valorRaw === '' || valorRaw === undefined ? NaN : Number(valorRaw);
    const valorHoraRaw = document.getElementById('srv-valor-hora')?.value;
    const valorHora =
      valorHoraRaw !== '' && valorHoraRaw !== undefined && Number.isFinite(Number(valorHoraRaw))
        ? Math.max(0, Number(valorHoraRaw))
        : 0;
    const regraRaw = document.getElementById('srv-regra-convidados')?.value;
    const convidadosPorUnidade = regraRaw === '' || regraRaw === undefined ? 0 : Number(regraRaw);
    const observacoes = document.getElementById('srv-observacoes')?.value.trim() || '';

    if (!descricao) {
      App.mostrarToast('Informe a descrição do serviço.', 'error');
      return;
    }

    if (!Number.isFinite(valorUnitario) || valorUnitario < 0) {
      App.mostrarToast('Informe um Valor Diária / Base válido (maior ou igual a R$ 0,00).', 'error');
      return;
    }

    if (!Number.isFinite(convidadosPorUnidade) || convidadosPorUnidade < 0) {
      App.mostrarToast('A regra de convidados por unidade não pode ser negativa.', 'error');
      return;
    }

    const dados = {
      id: this.editandoId || 'srv-' + Date.now(),
      descricao,
      categoria,
      valorHora: Math.round(valorHora * 100) / 100,
      valorUnitario: Math.round(valorUnitario * 100) / 100,
      convidadosPorUnidade: Math.round(convidadosPorUnidade),
      observacoes
    };

    if (this.editandoId) {
      const idx = Store.state.servicos.findIndex((s) => s.id === this.editandoId);
      const valorAntigo = idx >= 0 ? Number(Store.state.servicos[idx].valorUnitario) : null;
      const valorHoraAntigo = idx >= 0 ? Number(Store.state.servicos[idx].valorHora) : null;
      if (idx >= 0) Store.state.servicos[idx] = dados;

      // Sincronizar o novo valor padrão nas propostas salvas e na proposta em edição (quando não houve override customizado diferente)
      const atualizarPrecoServicoProp = (prop) => {
        if (!prop || !Array.isArray(prop.servicos)) return;
        prop.servicos.forEach((s) => {
          if (s.servicoId === this.editandoId) {
            if (s.valorUnitario === undefined || s.valorUnitario === null || Number(s.valorUnitario) === valorAntigo) {
              s.valorUnitario = dados.valorUnitario;
            }
            if (s.valorHora === undefined || s.valorHora === null || Number(s.valorHora) === valorHoraAntigo) {
              s.valorHora = dados.valorHora;
            }
          }
        });
      };
      (Store.state.propostas || []).forEach(atualizarPrecoServicoProp);
      if (window.Aba5Propostas?.propostaAtual) {
        atualizarPrecoServicoProp(window.Aba5Propostas.propostaAtual);
      }

      App.mostrarToast('Serviço atualizado e propostas sincronizadas!');
    } else {
      Store.state.servicos.push(dados);
      App.mostrarToast('Novo serviço cadastrado!');
    }

    Store.save();
    App.fecharModal();
    this.render();
  },

  excluirServico(id) {
    const item = Store.state.servicos.find((s) => s.id === id);
    if (!item) return;

    const propsAfetadas = (Store.state.propostas || []).filter((p) =>
      (p.servicos || []).some((s) => s.servicoId === id)
    );
    const msg =
      propsAfetadas.length > 0
        ? `O serviço "${item.descricao}" está presente em ${propsAfetadas.length} proposta(s) salva(s) (${propsAfetadas
            .map((p) => p.nomeEvento)
            .join(', ')}).\n\nDeseja realmente excluí-lo e removê-lo automaticamente dessas propostas?`
        : `Deseja realmente excluir o serviço "${item.descricao}"?`;

    if (!confirm(msg)) return;

    Store.excluirServicoComIntegridade(id);
    this.render();
    App.mostrarToast('Serviço excluído e propostas atualizadas.');
  }
};

