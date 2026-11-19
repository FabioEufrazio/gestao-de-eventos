// Aba 4: Cadastro de Clientes (CRM Simples)

window.Aba4Clientes = {
  filtroTexto: '',
  editandoId: null,
  callbackAposSalvar: null,

  render() {
    const container = document.getElementById('tab-clientes');
    if (!container) return;

    const clientes = this.getClientesFiltrados();

    container.innerHTML = `
      <!-- Cabeçalho -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <i data-lucide="users" class="w-4 h-4"></i>
            <span>Módulo 04 • Relacionamento & CRM</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Cadastro de Clientes</h1>
          <p class="text-sm text-slate-500 mt-0.5">Base enxuta de clientes e empresas para vínculo rápido nas propostas comerciais.</p>
        </div>

        <div>
          <button onclick="Aba4Clientes.abrirModalCliente()" class="btn-primary">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      <!-- Busca -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input
            type="text"
            placeholder="Buscar cliente por nome, empresa, WhatsApp, e-mail ou observação..."
            value="${this.filtroTexto}"
            oninput="Aba4Clientes.atualizarFiltroTexto(this.value)"
            class="input-minimal pl-9"
          />
        </div>
      </div>

      <!-- Tabela de Clientes -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-clean">
            <thead>
              <tr>
                <th><div class="flex items-center gap-1.5"><i data-lucide="user" class="w-3.5 h-3.5"></i> Nome Completo / Empresa</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="phone" class="w-3.5 h-3.5"></i> Contato (WhatsApp)</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="mail" class="w-3.5 h-3.5"></i> E-mail</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="file-text" class="w-3.5 h-3.5"></i> Observações / Preferências</div></th>
                <th><div class="flex items-center gap-1.5"><i data-lucide="folder-kanban" class="w-3.5 h-3.5"></i> Propostas / Eventos</div></th>
                <th class="text-right"><div class="flex items-center justify-end gap-1.5"><i data-lucide="sliders" class="w-3.5 h-3.5"></i> Ações</div></th>
              </tr>
            </thead>
            <tbody id="tabela-clientes-body">
              ${this.renderLinhasClientes(clientes)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  getClientesFiltrados() {
    const termo = (this.filtroTexto || '').toLowerCase().trim();
    return (Store.state.clientes || []).filter((c) => {
      if (!termo) return true;
      return (
        (c.nome || '').toLowerCase().includes(termo) ||
        (c.contato || '').toLowerCase().includes(termo) ||
        (c.email || '').toLowerCase().includes(termo) ||
        (c.observacoes || '').toLowerCase().includes(termo)
      );
    });
  },

  renderLinhasClientes(clientes) {
    if (!clientes || clientes.length === 0) {
      return `
        <tr>
          <td colspan="6" class="text-center py-12 text-slate-400">
            <div class="flex flex-col items-center justify-center gap-2">
              <i data-lucide="users" class="w-10 h-10 text-slate-300"></i>
              <p class="text-sm font-medium text-slate-600">Nenhum cliente encontrado.</p>
            </div>
          </td>
        </tr>
      `;
    }

    return clientes
      .map((c) => {
        const propostasCli = (Store.state.propostas || []).filter((p) => p.clienteId === c.id);
        const qtdPropostas = propostasCli.length;
        const resumoStatusHtml = propostasCli
          .map((pr) => {
            const st = pr.status || 'Em Aberto';
            const cor =
              st === 'Aprovada'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : st === 'Em Negociação'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : st === 'Realizada'
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : st === 'Cancelada'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-blue-50 text-blue-700 border-blue-200';
            return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cor}" title="${pr.codigo || ''} • ${pr.nomeEvento || ''}: ${st}">${pr.codigo || 'PROP'}: ${st}</span>`;
          })
          .join('');

        return `
          <tr>
            <td class="font-semibold text-slate-900">${c.nome}</td>
            <td class="whitespace-nowrap">
              <span class="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                ${c.contato || '-'}
              </span>
            </td>
            <td class="text-slate-600">${c.email || '-'}</td>
            <td class="text-xs text-slate-500 max-w-xs">${c.observacoes || '-'}</td>
            <td>
              <div class="flex flex-col items-start gap-1.5">
                <button
                  type="button"
                  onclick="Aba4Clientes.verPropostasDoCliente('${c.id}')"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    qtdPropostas > 0
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 shadow-2xs cursor-pointer hover:scale-102'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200 cursor-pointer'
                  }"
                  title="${qtdPropostas > 0 ? 'Ver e comparar as propostas deste cliente lado a lado' : 'Criar primeira proposta para este cliente'}"
                >
                  <i data-lucide="folder-open" class="w-3.5 h-3.5 text-blue-600"></i>
                  <span>${qtdPropostas} ${qtdPropostas === 1 ? 'proposta' : 'propostas'}</span>
                  <i data-lucide="chevron-right" class="w-3 h-3 text-blue-400"></i>
                </button>
                ${
                  resumoStatusHtml
                    ? `<div class="flex flex-wrap gap-1">${resumoStatusHtml}</div>`
                    : ''
                }
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div class="inline-flex items-center gap-1">
                <button
                  type="button"
                  onclick="Aba4Clientes.verPropostasDoCliente('${c.id}')"
                  class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Ver e comparar propostas deste cliente lado a lado"
                >
                  <i data-lucide="columns-2" class="w-4 h-4 text-blue-600"></i>
                </button>
                <button
                  type="button"
                  onclick="Aba4Clientes.abrirModalCliente('${c.id}')"
                  class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Editar Cliente"
                >
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button
                  type="button"
                  onclick="Aba4Clientes.excluirCliente('${c.id}')"
                  class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Excluir Cliente"
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
    const tbody = document.getElementById('tabela-clientes-body');
    if (tbody) {
      tbody.innerHTML = this.renderLinhasClientes(this.getClientesFiltrados());
      if (window.lucide) window.lucide.createIcons();
    }
  },

  verPropostasDoCliente(clienteId) {
    if (window.Aba5Propostas && window.Aba5Propostas.abrirComparativoPropostasCliente) {
      window.Aba5Propostas.abrirComparativoPropostasCliente(clienteId);
    } else {
      App.mostrarToast('Módulo de propostas não disponível.', 'error');
    }
  },

  aplicarMascaraTelefone(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (v.length > 6) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }
    input.value = v;
  },

  abrirModalCliente(id = null, callback = null) {
    this.editandoId = id;
    this.callbackAposSalvar = callback;

    const item = id ? Store.state.clientes.find((c) => c.id === id) : null;
    const nome = item ? item.nome : '';
    const contato = item ? item.contato : '';
    const email = item ? item.email : '';
    const observacoes = item ? item.observacoes : '';

    const modalHtml = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <i data-lucide="user-check" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">${id ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h3>
                <p class="text-xs text-slate-500">Dados de contato e histórico de preferências.</p>
              </div>
            </div>
            <button onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Nome Completo / Empresa *</label>
              <input
                type="text"
                id="cli-nome"
                value="${nome}"
                placeholder="Ex: Juliana Martins & Pedro / TechNova Ltda"
                class="input-minimal"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Contato (Telefone / WhatsApp) *</label>
                <input
                  type="text"
                  id="cli-contato"
                  value="${contato}"
                  oninput="Aba4Clientes.aplicarMascaraTelefone(this)"
                  placeholder="(11) 99999-0000"
                  class="input-minimal"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">E-mail <span class="text-slate-400 font-normal">(Opcional)</span></label>
                <input
                  type="email"
                  id="cli-email"
                  value="${email}"
                  placeholder="cliente@email.com (opcional)"
                  class="input-minimal"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Observações e Preferências</label>
              <textarea
                id="cli-observacoes"
                rows="3"
                placeholder="Preferências de bebidas, restrições, detalhes do espaço..."
                class="input-minimal"
              >${observacoes}</textarea>
            </div>
          </div>

          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button type="button" onclick="App.fecharModal()" class="btn-secondary">Cancelar</button>
            <button type="button" onclick="Aba4Clientes.salvarCliente()" class="btn-primary">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Salvar Cliente</span>
            </button>
          </div>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
  },

  salvarCliente() {
    const nome = document.getElementById('cli-nome')?.value.trim();
    const contato = document.getElementById('cli-contato')?.value.trim() || '';
    const email = document.getElementById('cli-email')?.value.trim() || '';
    const observacoes = document.getElementById('cli-observacoes')?.value.trim() || '';

    if (!nome) {
      App.mostrarToast('Informe o Nome Completo ou Empresa do cliente.', 'error');
      return;
    }

    if (!contato) {
      App.mostrarToast('Informe o Contato (Telefone / WhatsApp) do cliente.', 'error');
      return;
    }

    // E-mail é 100% opcional (não bloqueia salvamento do cliente)
    const dados = {
      id: this.editandoId || 'cli-' + Date.now(),
      nome,
      contato,
      email,
      observacoes
    };

    if (this.editandoId) {
      const idx = Store.state.clientes.findIndex((c) => c.id === this.editandoId);
      if (idx >= 0) Store.state.clientes[idx] = dados;
      App.mostrarToast('Cliente atualizado com sucesso!');
    } else {
      Store.state.clientes.unshift(dados);
      App.mostrarToast('Novo cliente cadastrado!');
    }

    Store.save();
    App.fecharModal();
    this.render();

    if (typeof this.callbackAposSalvar === 'function') {
      this.callbackAposSalvar(dados);
      this.callbackAposSalvar = null;
    }
  },

  excluirCliente(id) {
    const item = Store.state.clientes.find((c) => c.id === id);
    if (!item) return;

    const propsVinculadas = (Store.state.propostas || []).filter((p) => p.clienteId === id);
    const msg =
      propsVinculadas.length > 0
        ? `O cliente "${item.nome}" está vinculado a ${propsVinculadas.length} proposta(s) salva(s).\n\nDeseja realmente excluí-lo? (As propostas serão mantidas sem cliente vinculado).`
        : `Deseja realmente excluir o cliente "${item.nome}"?`;

    if (!confirm(msg)) return;

    Store.excluirClienteComIntegridade(id);
    this.render();
    App.mostrarToast('Cliente excluído e propostas atualizadas.');
  }
};

