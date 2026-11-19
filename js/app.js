// Controlador Principal da Aplicação (SPA Shell, Navegação, Modais e Notificações)

window.App = {
  abaAtiva: 'propostas',

  init() {
    Store.init();
    this.carregarPreferenciaSidebar();
    this.atualizarBadgesMenu();
    this.navegarPara('propostas');

    window.addEventListener('store-updated', () => {
      this.atualizarBadgesMenu();
    });

    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  },

  toggleSidebar() {
    const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem('calc_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    const borderIcon = document.getElementById('btn-sidebar-border-icon');
    if (borderIcon) {
      borderIcon.setAttribute('data-lucide', isCollapsed ? 'chevron-right' : 'chevron-left');
    }
    const iconEl = document.getElementById('btn-sidebar-toggle-icon');
    if (iconEl) {
      iconEl.setAttribute('data-lucide', isCollapsed ? 'chevron-right' : 'chevron-left');
    }
    if (window.lucide) window.lucide.createIcons();
  },

  carregarPreferenciaSidebar() {
    const isCollapsed = localStorage.getItem('calc_sidebar_collapsed') === 'true';
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
      const borderIcon = document.getElementById('btn-sidebar-border-icon');
      if (borderIcon) {
        borderIcon.setAttribute('data-lucide', 'chevron-right');
      }
      const iconEl = document.getElementById('btn-sidebar-toggle-icon');
      if (iconEl) {
        iconEl.setAttribute('data-lucide', 'chevron-right');
      }
    }
  },

  navegarPara(abaId) {
    this.abaAtiva = abaId;

    // Atualizar botões da Sidebar e Mobile Nav
    document.querySelectorAll('[data-tab-btn]').forEach((btn) => {
      if (btn.getAttribute('data-tab-btn') === abaId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Alternar visibilidade das seções
    document.querySelectorAll('.tab-section').forEach((sec) => {
      sec.classList.remove('active');
    });
    const targetSec = document.getElementById(`tab-${abaId}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Renderizar aba correspondente
    switch (abaId) {
      case 'insumos':
        Aba1Insumos.render();
        break;
      case 'servicos':
        Aba2Servicos.render();
        break;
      case 'drinques':
        Aba3Drinques.render();
        break;
      case 'clientes':
        Aba4Clientes.render();
        break;
      case 'propostas':
        Aba5Propostas.render();
        break;
      case 'checklist':
        Aba6Checklist.render();
        break;
      case 'utensilios':
        Aba7Utensilios.render();
        break;
      case 'funil':
        if (window.Aba8Funil) Aba8Funil.render();
        break;
    }

    this.atualizarBadgesMenu();
    if (window.lucide) window.lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  atualizarBadgesMenu() {
    const mapCount = {
      insumos: Store.state.insumos?.length || 0,
      servicos: Store.state.servicos?.length || 0,
      drinques: Store.state.drinques?.length || 0,
      clientes: Store.state.clientes?.length || 0,
      propostas: Store.state.propostas?.length || 0,
      checklist: Store.state.propostas?.length || 0,
      utensilios: Store.state.utensiliosPadrao?.length || 0,
      funil: Store.state.propostas?.length || 0
    };

    Object.keys(mapCount).forEach((key) => {
      const el = document.getElementById(`badge-count-${key}`);
      if (el) el.textContent = mapCount[key];
    });
  },

  abrirModal(htmlContent) {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;
    modalRoot.innerHTML = htmlContent;
    if (window.lucide) window.lucide.createIcons();
  },

  fecharModal() {
    if (window.Aba1Insumos) window.Aba1Insumos.editandoId = null;
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot) modalRoot.innerHTML = '';
  },

  mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const tipoNormalizado = tipo === 'erro' ? 'error' : tipo;
    const cores = {
      success: 'bg-slate-900 text-white border-blue-500',
      warning: 'bg-amber-600 text-white border-amber-400',
      error: 'bg-red-600 text-white border-red-400',
      info: 'bg-blue-700 text-white border-blue-400'
    };

    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-xl shadow-lg border-l-4 text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 ${
      cores[tipoNormalizado] || cores.success
    }`;
    toast.innerHTML = `
      <span>${mensagem}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(6px)';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  },

  exportarBackupJson() {
    const json = JSON.stringify(Store.state, null, 2);
    Aba1Insumos.downloadBlob(
      json,
      `Backup_Calculador_Eventos_${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    this.mostrarToast('Backup completo exportado!');
  },

  importarBackupJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.insumos)) {
          Store.state = parsed;
          Store.normalizarEstado();
          Store.save();
          if (window.Aba5Propostas) window.Aba5Propostas.propostaAtual = null;
          if (window.Aba6Checklist) window.Aba6Checklist.propostaSelecionadaId = null;
          if (window.Aba7Utensilios) window.Aba7Utensilios.propostaSelecionadaId = null;
          this.navegarPara(this.abaAtiva);
          this.mostrarToast('Backup restaurado e validado com sucesso!');
        } else {
          this.mostrarToast('Arquivo de backup inválido.', 'error');
        }
      } catch (err) {
        this.mostrarToast('Erro ao ler arquivo JSON.', 'error');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  },

  restaurarDadosDemonstracao() {
    if (!confirm('Deseja restaurar os dados de demonstração originais? Isso substituirá as alterações atuais.')) return;
    Store.resetToDefault();
    if (window.Aba5Propostas) window.Aba5Propostas.propostaAtual = null;
    if (window.Aba6Checklist) window.Aba6Checklist.propostaSelecionadaId = null;
    if (window.Aba7Utensilios) window.Aba7Utensilios.propostaSelecionadaId = null;
    this.navegarPara(this.abaAtiva);
    this.mostrarToast('Dados iniciais de exemplo restaurados!');
  },

  /**
   * Modal Rápido de Configuração do Rendimento de Fruta x Suco
   * Permite ajustar a conversão manual de "X un de fruta dá Y ml de suco"
   * diretamente a partir do Checklist (Aba 6) ou da Proposta (Aba 5)
   */
  abrirModalRendimentoFruta(sucoId) {
    const suco = (Store.state.insumos || []).find((i) => i.id === sucoId);
    if (!suco) {
      this.mostrarToast('Insumo de suco não encontrado.', 'error');
      return;
    }

    const cfg = suco.unificacaoCompraChecklist || {
      ativo: true,
      insumoBaseId: '',
      rendimentoQtdFruta: 1,
      rendimentoUnidadeFruta: 'un',
      rendimentoMlSuco: 35,
      pesoMedioUnidadeG: 80
    };

    const frutasCandidatas = (Store.state.insumos || []).filter((i) => i.id !== sucoId);

    let baseId = cfg.insumoBaseId;
    if (!baseId) {
      const match = frutasCandidatas.find((i) => {
        const d = (i.descricao || '').toLowerCase();
        return (d.includes('limão') || d.includes('limao')) && !d.includes('suco');
      });
      if (match) baseId = match.id;
    }

    const html = `
      <div class="modal-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <i data-lucide="citrus" class="w-5 h-5 text-white"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Rendimento Fruta x Suco</h3>
                <p class="text-xs text-amber-100">Unificação de compra no Checklist operacional</p>
              </div>
            </div>
            <button type="button" onclick="App.fecharModal()" class="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="App.salvarModalRendimentoFruta(event, '${suco.id}')" class="p-5 space-y-4">
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <div class="text-xs font-semibold text-amber-900 mb-1">Insumo: <strong>${suco.descricao}</strong> (${suco.unidade})</div>
              <p class="text-[11px] text-amber-800 leading-relaxed">
                Você usa o suco nos coquetéis, mas no mercado só compra a fruta <em>in natura</em>. 
                Defina o rendimento de extração para unificar a compra de quilos/unidades de fruta no Checklist sem duplicar itens.
              </p>
            </div>

            <div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
              <label class="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="modal-rend-ativo"
                  ${cfg.ativo ? 'checked' : ''}
                  onchange="App.atualizarPreviewModalRendimento('${suco.id}')"
                  class="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span>Unificar Compra como Fruta no Checklist</span>
              </label>
            </div>

            <div id="modal-rend-conteudo" class="space-y-4 ${cfg.ativo ? '' : 'opacity-40 pointer-events-none'}">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Fruta Base Comprada (Destino no Checklist) *</label>
                <select
                  id="modal-rend-base-id"
                  onchange="App.atualizarPreviewModalRendimento('${suco.id}')"
                  class="input-minimal text-xs font-medium"
                  required
                >
                  <option value="">Selecione a fruta (ex: Limão taiti)...</option>
                  ${frutasCandidatas
                    .map(
                      (f) =>
                        `<option value="${f.id}" ${f.id === baseId ? 'selected' : ''}>${f.descricao} (${f.unidade})</option>`
                    )
                    .join('')}
                </select>
              </div>

              <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <label class="block text-xs font-bold text-slate-800">
                  Regra de Rendimento Manual *
                </label>
                <div class="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    id="modal-rend-qtd-fruta"
                    value="${cfg.rendimentoQtdFruta || 1}"
                    oninput="App.atualizarPreviewModalRendimento('${suco.id}')"
                    class="input-minimal w-16 text-center font-bold text-xs"
                    required
                  />
                  <select
                    id="modal-rend-un-fruta"
                    onchange="App.atualizarPreviewModalRendimento('${suco.id}')"
                    class="input-minimal w-24 text-xs font-bold"
                  >
                    <option value="un" ${cfg.rendimentoUnidadeFruta === 'un' ? 'selected' : ''}>un (limões)</option>
                    <option value="kg" ${cfg.rendimentoUnidadeFruta === 'kg' ? 'selected' : ''}>kg</option>
                    <option value="g" ${cfg.rendimentoUnidadeFruta === 'g' ? 'selected' : ''}>g</option>
                  </select>
                  <span class="text-xs font-bold text-slate-600">rende</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    id="modal-rend-ml-suco"
                    value="${cfg.rendimentoMlSuco || 35}"
                    oninput="App.atualizarPreviewModalRendimento('${suco.id}')"
                    class="input-minimal w-20 text-center font-extrabold text-xs text-amber-800"
                    required
                  />
                  <span class="text-xs font-bold text-slate-700">ml de suco</span>
                </div>

                <div class="pt-2 border-t border-slate-200/80">
                  <div class="flex items-center justify-between gap-2">
                    <div>
                      <label class="block text-xs font-semibold text-slate-700">Peso médio por unidade da fruta</label>
                      <span class="text-[10px] text-slate-500">Usado se a fruta for comprada por quilo ou grama</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        step="any"
                        min="1"
                        id="modal-rend-peso-medio"
                        value="${cfg.pesoMedioUnidadeG || 80}"
                        oninput="App.atualizarPreviewModalRendimento('${suco.id}')"
                        class="input-minimal w-20 text-center font-bold text-xs"
                      />
                      <span class="text-xs text-slate-500 font-semibold">g / unidade</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Simulação Dinâmica em Tempo Real -->
              <div id="modal-rend-preview" class="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 font-medium space-y-1">
                <!-- Preenchido via atualizarPreviewModalRendimento -->
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onclick="App.fecharModal()" class="btn-secondary text-xs py-2 px-3.5">
                Cancelar
              </button>
              <button type="submit" class="btn-primary text-xs py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Salvar Rendimento</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.abrirModal(html);
    this.atualizarPreviewModalRendimento(suco.id);
  },

  atualizarPreviewModalRendimento(sucoId) {
    const previewEl = document.getElementById('modal-rend-preview');
    const container = document.getElementById('modal-rend-conteudo');
    const ativo = document.getElementById('modal-rend-ativo')?.checked;
    if (container) {
      if (ativo) {
        container.classList.remove('opacity-40', 'pointer-events-none');
      } else {
        container.classList.add('opacity-40', 'pointer-events-none');
      }
    }
    if (!previewEl) return;

    if (!ativo) {
      previewEl.innerHTML = `<span class="text-slate-500">Unificação desativada: o suco será listado diretamente como item independente no checklist.</span>`;
      return;
    }

    const baseId = document.getElementById('modal-rend-base-id')?.value;
    const baseFruit = (Store.state.insumos || []).find((i) => i.id === baseId);
    const qtdFruta = Number(document.getElementById('modal-rend-qtd-fruta')?.value) || 1;
    const unFruta = document.getElementById('modal-rend-un-fruta')?.value || 'un';
    const mlSuco = Number(document.getElementById('modal-rend-ml-suco')?.value) || 35;
    const pesoMedioG = Number(document.getElementById('modal-rend-peso-medio')?.value) || 80;

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
        <span>Simulação de Rendimento:</span>
      </div>
      <div>• <strong>1.000 ml de suco:</strong> precisa de ≈ <strong>${Store.formatNumber(conv1000.qtdFrutaNecessaria, 0)} ${conv1000.unidadeFruta}</strong> de ${baseFruit.descricao} (~${conv1000.numLimõesAprox} un)</div>
      <div>• <strong>4.000 ml de suco:</strong> precisa de ≈ <strong>${Store.formatNumber(conv4000.qtdFrutaNecessaria, 0)} ${conv4000.unidadeFruta}</strong> de ${baseFruit.descricao} (~${conv4000.numLimõesAprox} un)</div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  salvarModalRendimentoFruta(event, sucoId) {
    if (event) event.preventDefault();
    const ativo = document.getElementById('modal-rend-ativo')?.checked;
    const baseId = document.getElementById('modal-rend-base-id')?.value;
    const qtdFruta = Number(document.getElementById('modal-rend-qtd-fruta')?.value) || 1;
    const unFruta = document.getElementById('modal-rend-un-fruta')?.value || 'un';
    const mlSuco = Number(document.getElementById('modal-rend-ml-suco')?.value) || 35;
    const pesoMedioG = Number(document.getElementById('modal-rend-peso-medio')?.value) || 80;

    Store.salvarRendimentoFrutaSuco(sucoId, {
      ativo,
      insumoBaseId: baseId,
      rendimentoQtdFruta: qtdFruta,
      rendimentoUnidadeFruta: unFruta,
      rendimentoMlSuco: mlSuco,
      pesoMedioUnidadeG: pesoMedioG
    });

    this.fecharModal();
    this.mostrarToast('Rendimento de fruta x suco salvo com sucesso!');

    if (this.abaAtiva === 'checklist' && window.Aba6Checklist) {
      window.Aba6Checklist.render();
    } else if (this.abaAtiva === 'propostas' && window.Aba5Propostas) {
      window.Aba5Propostas.render();
    } else if (this.abaAtiva === 'insumos' && window.Aba1Insumos) {
      window.Aba1Insumos.render();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});

