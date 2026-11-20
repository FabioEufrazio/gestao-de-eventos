/**
 * Tela Home / Painel Inicial
 * Gestão de Eventos — Coquetelaria & Bar
 */

window.TelaHome = {
  termoBusca: '',

  esc(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  formatarDataBR(dataStr) {
    if (!dataStr) return 'Sem data';
    const partes = String(dataStr).split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  },

  formatarDataExtensoHoje() {
    try {
      const agora = new Date();
      const formatador = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const str = formatador.format(agora);
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return new Date().toLocaleDateString('pt-BR');
    }
  },

  aoDigitarBusca(valor) {
    this.termoBusca = valor || '';
    const containerResultados = document.getElementById('home-resultados-busca');
    const containerRecentes = document.getElementById('home-secao-recentes');
    const btnLimpar = document.getElementById('btn-limpar-busca-home');

    if (btnLimpar) {
      btnLimpar.style.display = this.termoBusca.trim() ? 'flex' : 'none';
    }

    if (!containerResultados) return;

    if (!this.termoBusca.trim()) {
      containerResultados.innerHTML = '';
      containerResultados.classList.add('hidden');
      if (containerRecentes) containerRecentes.classList.remove('hidden');
      return;
    }

    const resultados = this.buscarPropostasEClientes(this.termoBusca);
    containerResultados.classList.remove('hidden');
    if (containerRecentes) containerRecentes.classList.add('hidden');

    containerResultados.innerHTML = this.renderResultadosBuscaHtml(resultados);
    if (window.lucide) window.lucide.createIcons();
  },

  limparBusca() {
    const input = document.getElementById('input-busca-home');
    if (input) {
      input.value = '';
      input.focus();
    }
    this.aoDigitarBusca('');
  },

  buscarPropostasEClientes(termo) {
    const q = termo.toLowerCase().trim();
    const propostas = Store.state.propostas || [];
    const clientes = Store.state.clientes || [];

    const mapaClientes = new Map(clientes.map((c) => [c.id, c]));

    const matchesProposta = [];

    propostas.forEach((p) => {
      const cli = mapaClientes.get(p.clienteId);
      const cliNome = cli ? cli.nome : '';
      const cliContato = cli ? cli.contato || '' : '';
      const cod = p.codigo || '';
      const evento = p.nomeEvento || '';
      const local = p.localEvento || '';

      const matchTexto =
        cliNome.toLowerCase().includes(q) ||
        cliContato.toLowerCase().includes(q) ||
        cod.toLowerCase().includes(q) ||
        evento.toLowerCase().includes(q) ||
        local.toLowerCase().includes(q);

      if (matchTexto) {
        matchesProposta.push({
          tipo: 'PROPOSTA',
          propostaId: p.id,
          codigo: p.codigo,
          nomeEvento: p.nomeEvento,
          dataEvento: p.dataEvento,
          status: p.status || 'Em Aberto',
          clienteNome: cliNome || 'Sem cliente vinculado',
          clienteContato: cliContato,
          valorTotal: Store.consolidarProposta(p).custoTotalEvento
        });
      }
    });

    return matchesProposta;
  },

  renderResultadosBuscaHtml(resultados) {
    if (resultados.length === 0) {
      return `
        <div class="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <i data-lucide="search-x" class="w-6 h-6"></i>
          </div>
          <h4 class="text-sm font-bold text-slate-800">Nenhum resultado encontrado para "${this.esc(this.termoBusca)}"</h4>
          <p class="text-xs text-slate-500 max-w-md mx-auto">
            Verifique a grafia ou tente buscar pelo nome da pessoa, nome do evento ou código (ex: PROP-2026-16).
          </p>
          <div class="pt-2">
            <button
              type="button"
              onclick="TelaHome.criarNovaProposta()"
              class="btn-primary py-1.5 px-3.5 text-xs inline-flex items-center gap-1.5"
            >
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Criar Nova Proposta com esse nome</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
          <span>Encontrado(s) ${resultados.length} resultado(s):</span>
          <span class="text-slate-400 text-[11px]">Clique para abrir a proposta</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${resultados
            .map(
              (r) => `
            <div
              onclick="TelaHome.abrirProposta('${r.propostaId}')"
              class="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-start justify-between gap-3"
            >
              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">${this.esc(r.codigo)}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.status === 'Aprovada'
                      ? 'bg-emerald-100 text-emerald-800'
                      : r.status === 'Em Negociação'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }">
                    ${this.esc(r.status)}
                  </span>
                </div>

                <div class="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition truncate">
                  ${this.esc(r.clienteNome)}
                </div>

                <div class="text-xs text-slate-500 truncate flex items-center gap-1.5">
                  <i data-lucide="calendar" class="w-3 h-3 text-slate-400"></i>
                  <span>${this.esc(r.nomeEvento)}</span>
                  <span>•</span>
                  <span>${this.formatarDataBR(r.dataEvento)}</span>
                </div>
              </div>

              <div class="text-right shrink-0 flex flex-col items-end justify-between h-full pt-1">
                <span class="text-sm font-black text-blue-700 font-mono">
                  ${Store.formatCurrency(r.valorTotal)}
                </span>
                <span class="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition mt-2">
                  <span>Abrir</span>
                  <i data-lucide="arrow-right" class="w-3 h-3"></i>
                </span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  },

  criarNovaProposta() {
    if (window.Aba5Propostas) {
      Aba5Propostas.executarCriacaoNovaProposta();
    }
    App.navegarPara('propostas');
  },

  abrirProposta(id) {
    if (window.Aba5Propostas) {
      Aba5Propostas.abrirParaEdicao(id);
    }
    App.navegarPara('propostas');
  },

  render() {
    const container = document.getElementById('tab-home');
    if (!container) return;

    const totalPropostas = (Store.state.propostas || []).length;
    const totalClientes = (Store.state.clientes || []).length;
    const propostasRecentes = (Store.state.propostas || []).slice(0, 6);
    const dataExtenso = this.formatarDataExtensoHoje();

    container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
        <!-- 1. CABEÇALHO DE BOAS-VINDAS -->
        <div class="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <!-- Detalhe decorativo de fundo -->
          <div class="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

          <div class="relative z-10 space-y-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 border border-white/20">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-blue-200"></i>
              <span>${dataExtenso}</span>
            </div>

            <div>
              <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Gestão de Eventos</h1>
              <p class="text-sm text-blue-100 mt-1 max-w-xl leading-relaxed">
                Bem-vindo ao seu painel operacional. Inicie uma nova proposta, busque clientes cadastrados ou acesse os orçamentos em andamento.
              </p>
            </div>

            <!-- Mini estatísticas da conta -->
            <div class="flex items-center gap-4 pt-2 text-xs font-semibold text-blue-100 flex-wrap">
              <span class="flex items-center gap-1.5">
                <i data-lucide="file-text" class="w-4 h-4 text-blue-300"></i>
                <strong>${totalPropostas}</strong> propostas criadas
              </span>
              <span>•</span>
              <span class="flex items-center gap-1.5">
                <i data-lucide="users" class="w-4 h-4 text-blue-300"></i>
                <strong>${totalClientes}</strong> clientes no CRM
              </span>
              <span>•</span>
              <span class="flex items-center gap-1.5">
                <i data-lucide="martini" class="w-4 h-4 text-blue-300"></i>
                <strong>${(Store.state.drinques || []).length}</strong> drinques no cardápio
              </span>
            </div>
          </div>
        </div>

        <!-- 2. CAMPO DE BUSCA CENTRAL INTELIGENTE -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2">
          <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <i data-lucide="search" class="w-4 h-4 text-blue-600"></i>
            <span>Buscar Clientes ou Propostas</span>
          </label>

          <div class="relative flex items-center">
            <i data-lucide="search" class="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none"></i>
            <input
              type="text"
              id="input-busca-home"
              value="${this.esc(this.termoBusca)}"
              placeholder="Digite o nome do cliente, nome do evento ou código (ex: Sabrina, Casamento, PROP-2026-16)..."
              oninput="TelaHome.aoDigitarBusca(this.value)"
              class="w-full pl-12 pr-10 py-3 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl font-medium placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
            />
            <button
              type="button"
              id="btn-limpar-busca-home"
              onclick="TelaHome.limparBusca()"
              style="display: ${this.termoBusca ? 'flex' : 'none'};"
              class="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              title="Limpar busca"
            >
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <p class="text-[11px] text-slate-400">Dica: ao clicar em qualquer cliente ou proposta na busca, você será encaminhado diretamente para ela.</p>
        </div>

        <!-- CONTAINER DE RESULTADOS DA BUSCA (DINÂMICO) -->
        <div id="home-resultados-busca" class="${this.termoBusca ? '' : 'hidden'}"></div>

        <!-- 3. BOTÕES DE AÇÕES RÁPIDAS (3 CARDS) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Card 1: Criar Nova Proposta -->
          <button
            type="button"
            onclick="TelaHome.criarNovaProposta()"
            class="bg-white hover:bg-blue-50/50 border border-slate-200/90 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition text-left group flex flex-col justify-between"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                <i data-lucide="file-plus-2" class="w-5 h-5"></i>
              </div>
              <span class="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Em Branco
              </span>
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition">Criar Nova Proposta</h3>
              <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Inicie um orçamento limpo do zero com novo código gerado automaticamente.
              </p>
            </div>
          </button>

          <!-- Card 2: Clientes (CRM) -->
          <button
            type="button"
            onclick="App.navegarPara('clientes')"
            class="bg-white hover:bg-indigo-50/50 border border-slate-200/90 hover:border-indigo-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition text-left group flex flex-col justify-between"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                <i data-lucide="users" class="w-5 h-5"></i>
              </div>
              <span class="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                ${totalClientes} clientes
              </span>
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-slate-900 group-hover:text-indigo-700 transition">Base de Clientes (CRM)</h3>
              <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Acesse a lista de clientes, dados de contato e histórico de eventos.
              </p>
            </div>
          </button>

          <!-- Card 3: Funil de Vendas -->
          <button
            type="button"
            onclick="App.navegarPara('funil')"
            class="bg-white hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition text-left group flex flex-col justify-between"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                <i data-lucide="kanban" class="w-5 h-5"></i>
              </div>
              <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Pipeline
              </span>
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition">Funil de Vendas</h3>
              <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Acompanhe o status das negociações, fechamentos e pagamentos no Kanban.
              </p>
            </div>
          </button>
        </div>

        <!-- 4. SEÇÃO DE PROPOSTAS RECENTES -->
        <div id="home-secao-recentes" class="space-y-3 ${this.termoBusca ? 'hidden' : ''}">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i>
              </div>
              <h2 class="text-sm font-extrabold text-slate-900">Propostas Recentes & Em Andamento</h2>
            </div>
            <button
              type="button"
              onclick="Aba5Propostas.alternarModoVisualizacao('LISTA'); App.navegarPara('propostas');"
              class="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
            >
              <span>Ver todas (${totalPropostas})</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          ${
            propostasRecentes.length === 0
              ? `
            <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              <p class="text-xs font-semibold">Nenhuma proposta cadastrada ainda.</p>
              <button
                type="button"
                onclick="TelaHome.criarNovaProposta()"
                class="btn-primary mt-2 py-1.5 px-3 text-xs"
              >
                + Criar Primeira Proposta
              </button>
            </div>
          `
              : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${propostasRecentes
                .map((p) => {
                  const cli = (Store.state.clientes || []).find((c) => c.id === p.clienteId);
                  const consolidado = Store.consolidarProposta(p);
                  return `
                  <div
                    onclick="TelaHome.abrirProposta('${p.id}')"
                    class="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 p-4 shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between space-y-3"
                    title="Clique para abrir e editar esta proposta"
                  >
                    <div>
                      <div class="flex items-center justify-between gap-2 mb-1.5">
                        <span class="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">${this.esc(p.codigo)}</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'Aprovada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Em Negociação'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }">
                          ${this.esc(p.status || 'Em Aberto')}
                        </span>
                      </div>

                      <div class="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition truncate">
                        ${this.esc(cli ? cli.nome : 'Sem cliente')}
                      </div>

                      <div class="text-xs text-slate-500 truncate mt-0.5">
                        ${this.esc(p.nomeEvento || 'Evento')}
                      </div>
                    </div>

                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span class="text-[11px] text-slate-400 font-medium">
                        ${this.formatarDataBR(p.dataEvento)}
                      </span>
                      <span class="font-mono font-black text-sm text-slate-900 group-hover:text-blue-700 transition">
                        ${Store.formatCurrency(consolidado.custoTotalEvento)}
                      </span>
                    </div>
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

    if (window.lucide) window.lucide.createIcons();
  }
};
