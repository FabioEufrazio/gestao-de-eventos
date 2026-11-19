// Aba 6: Checklist e Lista de Compras por Evento (Com Consolidação de Matérias-Primas de Produção Própria)

window.Aba6Checklist = {
  propostaSelecionadaId: null,
  filtroStatusItem: 'TODOS', // 'TODOS', 'A_COMPRAR', 'PENDENTES_CHECK'
  explodirSubReceitasEmMateriasPrimas: true, // Quando ativo, consolida os Insumos Base (matérias-primas) na lista de compras

  render() {
    const container = document.getElementById('tab-checklist');
    if (!container) return;

    const propostas = Store.state.propostas || [];
    if (
      (!this.propostaSelecionadaId || !propostas.some((p) => p.id === this.propostaSelecionadaId)) &&
      propostas.length > 0
    ) {
      this.propostaSelecionadaId = propostas[0].id;
    } else if (propostas.length === 0) {
      this.propostaSelecionadaId = null;
    }

    const proposta = propostas.find((p) => p.id === this.propostaSelecionadaId) || null;
    const dadosChecklist = proposta ? this.gerarDadosConsolidadosChecklist(proposta) : null;

    container.innerHTML = `
      <!-- Cabeçalho -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <i data-lucide="clipboard-check" class="w-4 h-4"></i>
            <span>Módulo 06 • Operação, Matérias-Primas & Suprimentos</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Checklist e Lista de Compras por Evento</h1>
          <p class="text-sm text-slate-500 mt-0.5">Consolida bebidas, periféricos e as <strong>Matérias-Primas (Insumos Base)</strong> necessárias para produzir os insumos próprios do evento.</p>
        </div>

        ${
          proposta
            ? `
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onclick="Aba6Checklist.alternarBaixaEstoque('${proposta.id}')"
              class="btn-secondary ${
                proposta.estoqueBaixado
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-blue-200 bg-blue-50/70 text-blue-800'
              }"
              title="Desconta ou estorna os itens deste evento no saldo da Aba 1"
            >
              <i data-lucide="${proposta.estoqueBaixado ? 'rotate-ccw' : 'package-minus'}" class="w-4 h-4"></i>
              <span>${proposta.estoqueBaixado ? 'Estoque Reservado (Desfazer)' : 'Reservar / Baixar Estoque'}</span>
            </button>

            <button
              type="button"
              onclick="Aba6Checklist.exportarChecklistExcel()"
              class="btn-secondary"
            >
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i>
              <span>Exportar Excel / CSV</span>
            </button>

            <button
              type="button"
              onclick="Aba6Checklist.exportarChecklistPdf()"
              class="btn-primary"
            >
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Exportar Lista em PDF</span>
            </button>
          </div>
        `
            : ''
        }
      </div>

      <!-- Barra de Seleção do Evento, Nome da Lista e Modo de Explosão -->
      <div class="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div class="md:col-span-5">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              1. Selecionar Evento Salvo (Aba 5)
            </label>
            <select
              onchange="Aba6Checklist.selecionarProposta(this.value)"
              class="input-minimal font-semibold text-slate-900"
            >
              ${
                propostas.length === 0
                  ? `<option value="">Nenhuma proposta salva na Aba 5</option>`
                  : propostas
                      .map(
                        (prop) =>
                          `<option value="${prop.id}" ${
                            this.propostaSelecionadaId === prop.id ? 'selected' : ''
                          }>${prop.codigo} • ${prop.nomeEvento} (${prop.numConvidados} conv. • Linha ${
                            prop.linhaInsumos
                          })</option>`
                      )
                      .join('')
              }
            </select>
          </div>

          <div class="md:col-span-5">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              2. Nome da Lista Operacional (Editável)
            </label>
            <input
              type="text"
              value="${dadosChecklist ? dadosChecklist.nomeLista : ''}"
              oninput="Aba6Checklist.atualizarNomeLista(this.value)"
              placeholder="Checklist - Nome do Evento"
              ${!proposta ? 'disabled' : ''}
              class="input-minimal font-medium"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Filtrar Itens
            </label>
            <select
              onchange="Aba6Checklist.alterarFiltro(this.value)"
              class="input-minimal"
            >
              <option value="TODOS" ${this.filtroStatusItem === 'TODOS' ? 'selected' : ''}>Todos os Itens</option>
              <option value="A_COMPRAR" ${this.filtroStatusItem === 'A_COMPRAR' ? 'selected' : ''}>Apenas A Comprar</option>
              <option value="PENDENTES_CHECK" ${this.filtroStatusItem === 'PENDENTES_CHECK' ? 'selected' : ''}>Não Marcados [ ]</option>
            </select>
          </div>
        </div>

        <!-- Toggle de Explosão de Produção Própria em Matérias-Primas Base -->
        <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex items-center gap-2 text-xs text-slate-600">
            <i data-lucide="flask-conical" class="w-4 h-4 text-blue-600 shrink-0"></i>
            <span>
              <strong>Regra de Produção Própria no Checklist:</strong> Desmembrar automaticamente os insumos próprios (xaropes, espumas) em suas <strong>Matérias-Primas Base</strong> para compra e cruzamento com o estoque.
            </span>
          </div>

          <label class="inline-flex items-center gap-2 cursor-pointer select-none bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl shrink-0">
            <input
              type="checkbox"
              ${this.explodirSubReceitasEmMateriasPrimas ? 'checked' : ''}
              onchange="Aba6Checklist.toggleExplodirMateriasPrimas(this.checked)"
              class="w-4 h-4 text-blue-600 rounded"
            />
            <span class="text-xs font-bold text-blue-900">Consolidar Insumos Base (Matérias-Primas)</span>
          </label>
        </div>
      </div>

      ${
        !proposta
          ? `
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <i data-lucide="clipboard-list" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
          <h3 class="text-base font-bold text-slate-800">Nenhum evento selecionado</h3>
          <p class="text-xs text-slate-500 mt-1 mb-4">Crie e salve uma proposta na Aba 5 para gerar automaticamente o Checklist e Lista de Compras.</p>
          <button onclick="App.navegarPara('propostas')" class="btn-primary">Ir para Aba 5 (Criar Proposta)</button>
        </div>
      `
          : this.renderConteudoChecklist(proposta, dadosChecklist)
      }
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  toggleExplodirMateriasPrimas(checked) {
    this.explodirSubReceitasEmMateriasPrimas = checked;
    this.render();
  },

  gerarDadosConsolidadosChecklist(proposta) {
    const consolidado = Store.consolidarProposta(proposta);
    const checklistSalvo = Store.state.checklists[proposta.id] || {
      nomeLista: `Checklist - ${proposta.nomeEvento} (${proposta.dataEvento || 'Sem data'})`,
      itensMarcados: {}
    };

    const mapaUnificado = {};

    const acumularItemNoMapa = (insumo, qtd, descricaoOrigem, isFrutaUnificadaDeSuco = false, dadosSuco = null) => {
      if (!insumo || qtd <= 0) return;
      if (!mapaUnificado[insumo.id]) {
        mapaUnificado[insumo.id] = {
          insumo,
          quantidadeNecessaria: 0,
          origensSet: new Set(),
          qtdFrutaDireta: 0,
          qtdFrutaParaSuco: 0,
          sucoOrigens: []
        };
      }
      const entry = mapaUnificado[insumo.id];
      entry.quantidadeNecessaria += qtd;
      if (isFrutaUnificadaDeSuco && dadosSuco) {
        entry.qtdFrutaParaSuco += qtd;
        entry.sucoOrigens.push(dadosSuco);
      } else {
        entry.qtdFrutaDireta += qtd;
        entry.origensSet.add(descricaoOrigem);
      }
    };

    // Processador recursivo para explodir sub-receitas multi-nível em matérias-primas brutas de compra
    const processarItemParaChecklist = (insumo, qtd, descricaoOrigem, visitados = new Set()) => {
      if (!insumo || qtd <= 0) return;
      if (visitados.has(insumo.id)) return;

      // 1. Unificação de Compra de Fruta x Suco (ex: Suco de Limão -> Limão taiti in natura)
      if (insumo.unificacaoCompraChecklist && insumo.unificacaoCompraChecklist.ativo && insumo.unificacaoCompraChecklist.insumoBaseId) {
        const conv = Store.calcularConversaoFrutaSuco(insumo, qtd);
        if (conv && conv.insumoFruta) {
          acumularItemNoMapa(conv.insumoFruta, conv.qtdFrutaNecessaria, descricaoOrigem, true, {
            sucoInsumo: insumo,
            qtdMlSuco: qtd,
            qtdFrutaConvertida: conv.qtdFrutaNecessaria,
            numLimoesAprox: conv.numLimõesAprox,
            textoResumoRegra: conv.textoResumoRegra
          });
          return;
        }
      }

      // 2. Se for produção própria e explode receitas
      if (this.explodirSubReceitasEmMateriasPrimas && insumo.producaoPropria) {
        const novosVisitados = new Set(visitados);
        novosVisitados.add(insumo.id);
        const rendimento = Math.max(0.0001, Number(insumo.rendimentoFinal) || Number(insumo.volumeEmbalagem) || 1);
        const fator = qtd / rendimento;

        (insumo.subReceita || []).forEach((comp) => {
          const insBase = (Store.state.insumos || []).find((i) => i.id === comp.insumoBaseId);
          if (insBase) {
            const qtdBruta = (Number(comp.quantidade) || 0) * fator;
            processarItemParaChecklist(
              insBase,
              qtdBruta,
              `p/ ${insumo.descricao.replace(/\s*\(.*?\)/g, '')}`,
              novosVisitados
            );
          }
        });
      } else {
        acumularItemNoMapa(insumo, qtd, descricaoOrigem, false);
      }
    };

    // 1. Processar Insumos dos Coquetéis
    consolidado.listaInsumosCoqueteis.forEach((item) => {
      processarItemParaChecklist(item.insumo, item.quantidadeFinal, 'Coquetéis');
    });

    // 2. Processar Insumos Periféricos
    consolidado.listaPerifericos.forEach((per) => {
      processarItemParaChecklist(per.insumo, per.quantidade, 'Periféricos / Extras');
    });

    const itens = Object.values(mapaUnificado).map((entry) => {
      const ins = entry.insumo;
      const qtdNecessaria = Math.ceil(Math.max(0, Number(entry.quantidadeNecessaria) || 0) * 10) / 10;
      const estoqueAtual = Math.max(0, Number(ins.estoqueAtual) || 0);
      const qtdReservadaEvento =
        proposta.estoqueBaixado && proposta.movimentacaoEstoque
          ? Math.max(0, Number(proposta.movimentacaoEstoque[ins.id]) || 0)
          : 0;
      const estoqueConsiderado = estoqueAtual + qtdReservadaEvento;
      const aComprar = Math.max(0, Math.round((qtdNecessaria - estoqueConsiderado) * 100) / 100);

      const custoInfo = Store.getInsumoCustoInfo(ins);
      const volBruto = ins.producaoPropria
        ? Number(ins.rendimentoFinal) || Number(ins.volumeEmbalagem)
        : Number(ins.volumeEmbalagem) || custoInfo.tamanhoEmbalagem;
      const volEmb = Number.isFinite(volBruto) && volBruto > 0 ? volBruto : 1;

      const embNecessarias = volEmb > 1 ? Math.ceil(qtdNecessaria / volEmb) : Math.ceil(qtdNecessaria);
      const embAComprar = aComprar > 0 ? (volEmb > 1 ? Math.ceil(aComprar / volEmb) : Math.ceil(aComprar)) : 0;

      const custoRealUnit = custoInfo.custoRealPorUnidadeBase ?? custoInfo.custoPorUnidadeBase;
      const custoRealEmb = custoInfo.custoRealEmbalagem ?? custoInfo.precoEmbalagem;

      const custoEstimadoExato = aComprar * custoRealUnit;
      const custoEstimadoEmbalagens = embAComprar * custoRealEmb;

      const marcado = Boolean(checklistSalvo.itensMarcados?.[ins.id]);
      const origensLista = Array.from(entry.origensSet);

      // Formatar origem concisa e limpa (sem textos gigantescos)
      let origemTexto = origensLista.join(' + ') || 'Evento';
      let unificacaoFrutaSuco = null;

      if (entry.sucoOrigens && entry.sucoOrigens.length > 0) {
        const totalMlSuco = entry.sucoOrigens.reduce((acc, s) => acc + s.qtdMlSuco, 0);
        const totalNumLimoes = entry.sucoOrigens.reduce((acc, s) => acc + (s.numLimoesAprox || 0), 0);
        const qtdSucoConvertida = entry.qtdFrutaParaSuco;
        const qtdDireta = entry.qtdFrutaDireta;

        if (qtdDireta > 0) {
          origemTexto = `${Store.formatNumber(qtdDireta, 0)} ${ins.unidade} fruta nos drinques + ${Store.formatNumber(qtdSucoConvertida, 0)} ${ins.unidade} p/ ${Store.formatNumber(totalMlSuco, 0)} ml suco (~${totalNumLimoes} un)`;
        } else {
          origemTexto = `${Store.formatNumber(qtdSucoConvertida, 0)} ${ins.unidade} p/ ${Store.formatNumber(totalMlSuco, 0)} ml suco (~${totalNumLimoes} un)`;
        }

        unificacaoFrutaSuco = {
          isUnificado: true,
          sucoId: entry.sucoOrigens[0].sucoInsumo.id,
          sucoNome: entry.sucoOrigens[0].sucoInsumo.descricao,
          qtdDireta,
          qtdSucoConvertida,
          totalMlSuco,
          totalNumLimoes,
          detalhes: entry.sucoOrigens
        };
      }

      return {
        insumoId: ins.id,
        codigo: ins.codigo,
        descricao: ins.descricao,
        categoria: ins.categoria,
        unidade: ins.unidade,
        volumeEmbalagem: volEmb,
        isProducaoPropria: Boolean(ins.producaoPropria),
        origem: origemTexto,
        isMateriaPrimaSubReceita: origensLista.some((o) => o.startsWith('p/ ')),
        isItemExtra: false,
        unificacaoFrutaSuco,
        qtdNecessaria,
        embNecessarias,
        estoqueAtual,
        qtdReservadaEvento,
        aComprar,
        embAComprar,
        custoUnitario: custoRealUnit,
        precoEmbalagem: custoRealEmb,
        fornecedorNome: custoInfo.fornecedorAtivo?.nome || '-',
        custoEstimado: custoEstimadoExato,
        custoEstimadoEmbalagens,
        marcado
      };
    });

    // 3. Processar Insumos Extras / Avulsos adicionados manualmente no checklist
    (checklistSalvo.itensExtras || []).forEach((extra) => {
      const extraId = extra.id;
      const qtdBruta = Number(extra.quantidade ?? extra.qtdNecessaria ?? 1);
      const qtdNecessaria = Math.ceil((Number.isFinite(qtdBruta) && qtdBruta > 0 ? qtdBruta : 1) * 10) / 10;
      const estBruto = Number(extra.estoqueAtual);
      const estoqueAtual = Number.isFinite(estBruto) && estBruto >= 0 ? estBruto : 0;
      const aComprar = Math.max(0, Math.round((qtdNecessaria - estoqueAtual) * 100) / 100);
      const custoInformado = Math.max(0, Number(extra.custoEstimado) || 0);
      const custoUnitario = custoInformado > 0 && qtdNecessaria > 0 ? custoInformado / qtdNecessaria : 0;
      const custoEfetivoCompra = aComprar > 0 ? custoUnitario * aComprar : 0;
      const volBruto = Number(extra.volumeEmbalagem);
      const volEmb = Number.isFinite(volBruto) && volBruto > 0 ? volBruto : 1;
      const embNecessarias = volEmb > 1 ? Math.ceil(qtdNecessaria / volEmb) : Math.ceil(qtdNecessaria);
      const embAComprar = aComprar > 0 ? (volEmb > 1 ? Math.ceil(aComprar / volEmb) : Math.ceil(aComprar)) : 0;
      const marcado = Boolean(checklistSalvo.itensMarcados?.[extraId]);

      itens.push({
        insumoId: extraId,
        id: extraId,
        codigo: extra.codigo || 'EXTRA',
        descricao: extra.descricao,
        categoria: extra.categoria || 'Outros',
        unidade: extra.unidade || 'un',
        volumeEmbalagem: volEmb,
        isProducaoPropria: false,
        origem: 'Item Extra / Avulso',
        isMateriaPrimaSubReceita: false,
        isItemExtra: true,
        qtdNecessaria,
        embNecessarias,
        estoqueAtual,
        qtdReservadaEvento: 0,
        aComprar,
        embAComprar,
        custoUnitario,
        precoEmbalagem: custoInformado,
        fornecedorNome: extra.fornecedorNome || '-',
        custoEstimado: custoEfetivoCompra,
        custoEstimadoEmbalagens: custoEfetivoCompra,
        marcado
      });
    });

    // Ordenar itens por categoria e ordem alfabética (A-Z)
    itens.sort((a, b) => {
      const catA = (a.categoria || 'Outros').trim();
      const catB = (b.categoria || 'Outros').trim();
      if (catA !== catB) {
        if (catA === 'Outros') return 1;
        if (catB === 'Outros') return -1;
        return catA.localeCompare(catB, 'pt-BR');
      }
      const descA = (a.descricao || '').replace(/\s*\((?:produção própria|sub-receita|matéria-prima)\)/gi, '').trim();
      const descB = (b.descricao || '').replace(/\s*\((?:produção própria|sub-receita|matéria-prima)\)/gi, '').trim();
      return descA.localeCompare(descB, 'pt-BR');
    });

    const itensFiltrados = itens.filter((it) => {
      if (this.filtroStatusItem === 'A_COMPRAR') return it.aComprar > 0;
      if (this.filtroStatusItem === 'PENDENTES_CHECK') return !it.marcado;
      return true;
    });

    const totalItens = itens.length;
    const totalMarcados = itens.filter((i) => i.marcado).length;
    const totalItensAComprar = itens.filter((i) => i.aComprar > 0).length;
    const somaCustoEstimado = itens.reduce((acc, i) => acc + i.custoEstimado, 0);
    const somaCustoEmbalagens = itens.reduce((acc, i) => acc + i.custoEstimadoEmbalagens, 0);

    return {
      nomeLista: checklistSalvo.nomeLista,
      itens,
      itensFiltrados,
      detalhamentoProducaoPropria: consolidado.detalhamentoProducaoPropria || [],
      totalItens,
      totalMarcados,
      totalItensAComprar,
      somaCustoEstimado,
      somaCustoEmbalagens
    };
  },

  renderConteudoChecklist(proposta, dados) {
    const progresso = dados.totalItens > 0 ? Math.round((dados.totalMarcados / dados.totalItens) * 100) : 0;

    return `
      <!-- Resumo Operacional do Checklist -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-semibold text-slate-500">Progresso de Conferência</span>
            <span class="text-xs font-bold text-blue-700">${progresso}%</span>
          </div>
          <div class="text-xl font-extrabold text-slate-900">${dados.totalMarcados} / ${dados.totalItens} itens</div>
          <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div class="h-full bg-blue-600 transition-all" style="width: ${progresso}%"></div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span class="text-xs font-semibold text-slate-500 block">Status de Estoque</span>
          <div class="text-xl font-extrabold ${dados.totalItensAComprar > 0 ? 'text-amber-600' : 'text-emerald-600'} mt-1">
            ${dados.totalItensAComprar > 0 ? `${dados.totalItensAComprar} itens p/ comprar` : '100% em Estoque!'}
          </div>
          <span class="text-[11px] text-slate-400">Cruzamento em tempo real com a Aba 1</span>
        </div>

        <div class="bg-blue-50/70 border border-blue-200 rounded-xl p-4 shadow-sm">
          <span class="text-xs font-semibold text-blue-800 block">Desembolso em Embalagens Fechadas (Custo Real)</span>
          <div class="text-xl font-extrabold text-blue-900 mt-1">${Store.formatCurrency(dados.somaCustoEmbalagens)}</div>
          <span class="text-[11px] text-blue-700">Custo real de inventário • Arredondado p/ embalagens inteiras</span>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span class="text-xs font-semibold text-slate-500 block">Custo Proporcional Exato (Custo Real)</span>
          <div class="text-xl font-extrabold text-slate-700 mt-1">${Store.formatCurrency(dados.somaCustoEstimado)}</div>
          <span class="text-[11px] text-slate-400">Custo real de compra do consumo exato em ml/g</span>
        </div>
      </div>

      <!-- Quadro Resumo de Produção Própria (Mise en Place) do Evento -->
      ${
        dados.detalhamentoProducaoPropria.length > 0
          ? `
        <div class="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div class="flex items-center justify-between mb-2.5">
            <div class="flex items-center gap-2">
              <i data-lucide="flask-conical" class="w-4 h-4 text-blue-600"></i>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-blue-900">
                Ordem de Produção Interna (Sub-receitas / Mise en Place do Evento)
              </h3>
            </div>
            <span class="text-[11px] text-blue-700 font-medium">
              ${
                this.explodirSubReceitasEmMateriasPrimas
                  ? '✓ Os Insumos Base abaixo já estão somados e cruzados com o estoque na tabela de compras'
                  : 'Exibindo sub-receitas prontas diretamente na tabela'
              }
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            ${dados.detalhamentoProducaoPropria
              .map(
                (sub) => `
              <div class="bg-white border border-blue-200 rounded-xl p-3 shadow-sm">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 text-xs">${sub.insumoProprio.descricao}</span>
                  <span class="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Produzir ${Store.formatNumber(sub.quantidadeTotalNecessaria)} ${sub.unidade}
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1.5 space-y-0.5">
                  ${sub.ingredientesExplodidos
                    .map(
                      (ing) =>
                        `<div>• ${ing.insumoBase.descricao}: <strong class="text-slate-700">${Store.formatNumber(
                          ing.qtdBrutaNecessaria,
                          1
                        ).replace(',0', '')} ${ing.unidade}</strong></div>`
                    )
                    .join('')}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Tabela do Checklist e Lista de Compras -->
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-700">${dados.nomeLista}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">Linha ${proposta.linhaInsumos}</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              onclick="Aba6Checklist.marcarTodos(true)"
              class="text-xs font-semibold text-blue-600 hover:underline"
            >
              ✓ Marcar Todos
            </button>
            <button
              type="button"
              onclick="Aba6Checklist.marcarTodos(false)"
              class="text-xs font-semibold text-slate-500 hover:underline"
            >
              Desmarcar Todos
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-clean">
            <thead>
              <tr>
                <th class="w-12 text-center">Check</th>
                <th>Descrição do Insumo / Matéria-Prima</th>
                <th>Unidade & Emb.</th>
                <th>Quant. Necessária</th>
                <th>Estoque Atual (Aba 1)</th>
                <th>A Comprar</th>
                <th class="text-right">Custo Estimado</th>
                <th class="text-center w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                if (dados.itensFiltrados.length === 0) {
                  return `<tr><td colspan="8" class="text-center py-10 text-slate-400">Nenhum item corresponde ao filtro selecionado.</td></tr>`;
                }

                // Agrupar itens filtrados por categoria
                const grupos = {};
                dados.itensFiltrados.forEach((it) => {
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
                    const itens = grupos[cat];
                    // Ordenar itens da categoria alfabeticamente
                    itens.sort((a, b) => {
                      const descA = (a.descricao || '').replace(/\s*\((?:produção própria|sub-receita|matéria-prima)\)/gi, '').trim();
                      const descB = (b.descricao || '').replace(/\s*\((?:produção própria|sub-receita|matéria-prima)\)/gi, '').trim();
                      return descA.localeCompare(descB, 'pt-BR');
                    });

                    const subtotalCat = itens.reduce((acc, i) => acc + (i.custoEstimado || 0), 0);

                    const headerCategoria = `
                      <tr class="bg-slate-100/90 border-y-2 border-slate-200">
                        <td colspan="8" class="py-2.5 px-4">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                              <span class="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                              <span class="text-xs font-bold uppercase tracking-wider text-slate-800">${cat}</span>
                              <span class="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
                                ${itens.length} ${itens.length === 1 ? 'item' : 'itens'}
                              </span>
                            </div>
                            <div class="text-xs font-semibold text-slate-600">
                              Custo Estimado Categoria: <strong class="text-blue-700">${Store.formatCurrency(subtotalCat)}</strong>
                            </div>
                          </div>
                        </td>
                      </tr>
                    `;

                    const linhasItens = itens
                      .map((it) => {
                        const falta = it.aComprar > 0;
                        return `
                          <tr class="${it.marcado ? 'bg-slate-50/80 opacity-75' : ''}">
                            <td class="text-center">
                              <input
                                type="checkbox"
                                ${it.marcado ? 'checked' : ''}
                                onchange="Aba6Checklist.toggleCheckItem('${it.insumoId}', this.checked)"
                                class="w-4 h-4 text-blue-600 rounded cursor-pointer"
                              />
                            </td>
                            <td>
                              ${(() => {
                                const descLimpa = (it.descricao || '')
                                  .replace(/\s*\((?:produção própria|sub-receita|matéria-prima)\)/gi, '')
                                  .trim();
                                return `
                                <div class="flex items-center gap-1.5 ${it.marcado ? 'line-through text-slate-500' : ''}">
                                  <span class="${it.isProducaoPropria ? 'font-bold text-indigo-700' : it.isItemExtra ? 'font-bold text-amber-900' : 'font-semibold text-slate-900'}">${descLimpa}</span>
                                  ${
                                    it.isItemExtra
                                      ? `<span class="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded">Item Extra</span>`
                                      : it.isMateriaPrimaSubReceita
                                      ? `<span class="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">Insumo Base</span>`
                                      : ''
                                  }
                                </div>
                                `;
                              })()}
                              <div class="text-[11px] text-slate-500 mt-0.5">
                                ${it.codigo} • Forn: <strong class="text-slate-700">${it.fornecedorNome}</strong>
                                ${
                                  it.unificacaoFrutaSuco
                                    ? `
                                  <div class="mt-1 flex flex-wrap items-center gap-1.5">
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                      🍋 <strong>Fruta + Suco:</strong> ${it.origem}
                                    </span>
                                    <button
                                      type="button"
                                      onclick="App.abrirModalRendimentoFruta('${it.unificacaoFrutaSuco.sucoId}')"
                                      class="inline-flex items-center gap-1 text-[11px] text-blue-700 font-bold hover:text-blue-900 hover:underline bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                                      title="Ajustar rendimento fruta x suco"
                                    >
                                      ⚙️ Rendimento
                                    </button>
                                  </div>
                                `
                                    : ` • <span class="text-slate-700 font-medium">${it.origem}</span>`
                                }
                              </div>
                            </td>
                            <td class="whitespace-nowrap">
                              <span class="font-semibold text-slate-700">${it.unidade}</span>
                              ${
                                it.volumeEmbalagem > 1
                                  ? `<span class="block text-[11px] text-slate-400">Emb: ${it.volumeEmbalagem}${it.unidade}</span>`
                                  : ''
                              }
                            </td>
                            <td class="whitespace-nowrap">
                              <span class="font-bold text-slate-900">${Store.formatNumber(it.qtdNecessaria, 1).replace(',0', '')} ${it.unidade}</span>
                              ${
                                it.volumeEmbalagem > 1
                                  ? `<span class="block text-[11px] text-blue-700 font-medium">≈ ${it.embNecessarias} emb.</span>`
                                  : ''
                              }
                            </td>
                            <td class="whitespace-nowrap">
                              <span class="font-semibold text-slate-700">${Store.formatNumber(it.estoqueAtual)} ${it.unidade}</span>
                              ${
                                it.qtdReservadaEvento > 0
                                  ? `<span class="block text-[10px] font-bold text-emerald-700">(${Store.formatNumber(
                                      it.qtdReservadaEvento,
                                      1
                                    ).replace(',0', '')} ${it.unidade} reservado)</span>`
                                  : ''
                              }
                            </td>
                            <td class="whitespace-nowrap">
                              ${
                                falta
                                  ? `
                                <div>
                                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                    Faltam ${Store.formatNumber(it.aComprar, 1).replace(',0', '')} ${it.unidade}
                                  </span>
                                  ${
                                    it.volumeEmbalagem > 1
                                      ? `<span class="block text-[11px] font-bold text-amber-800 mt-0.5">Comprar ${it.embAComprar} emb. (${it.volumeEmbalagem}${it.unidade})</span>`
                                      : ''
                                  }
                                </div>
                              `
                                  : `
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  0 • Estoque OK
                                </span>
                              `
                              }
                            </td>
                            <td class="text-right whitespace-nowrap">
                              ${
                                falta
                                  ? `
                                <div class="font-extrabold text-blue-700">${Store.formatCurrency(it.custoEstimadoEmbalagens)}</div>
                                ${
                                  it.volumeEmbalagem > 1 && Math.abs(it.custoEstimado - it.custoEstimadoEmbalagens) > 0.01
                                    ? `<div class="text-[11px] text-slate-500">Prop: ${Store.formatCurrency(
                                        it.custoEstimado
                                      )}</div>`
                                    : ''
                                }
                              `
                                  : `<span class="text-xs font-semibold text-emerald-700">R$ 0,00</span>`
                              }
                            </td>
                            <td class="text-center whitespace-nowrap">
                              ${
                                it.isItemExtra
                                  ? `
                                <div class="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onclick="Aba6Checklist.abrirModalItemExtra('${it.insumoId}')"
                                    class="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                    title="Editar insumo extra"
                                  >
                                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onclick="Aba6Checklist.duplicarItemExtra('${it.insumoId}')"
                                    class="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                                    title="Duplicar insumo extra"
                                  >
                                    <i data-lucide="copy" class="w-4 h-4"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onclick="Aba6Checklist.excluirItemExtra('${it.insumoId}')"
                                    class="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                    title="Excluir insumo extra"
                                  >
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                  </button>
                                </div>
                              `
                                  : `<span class="text-[10px] font-medium text-slate-400">Automático</span>`
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

        <!-- Opção no final da lista para adicionar insumos extras/avulsos -->
        <div class="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-xs font-bold text-slate-800 block">Insumos Extras ou Avulsos deste Evento</span>
              <span class="text-[11px] text-slate-500">Adicione itens de última hora, guarnições especiais ou compras pontuais que não constam na lista automática.</span>
            </div>
          </div>
          <button
            type="button"
            onclick="Aba6Checklist.abrirModalItemExtra()"
            class="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Adicionar Insumo Extra</span>
          </button>
        </div>
      </div>
    `;
  },

  selecionarProposta(id) {
    this.propostaSelecionadaId = id;
    this.render();
  },

  alterarFiltro(val) {
    this.filtroStatusItem = val;
    this.render();
  },

  garantirRegistroChecklist(propostaId) {
    const prop = Store.state.propostas.find((p) => p.id === propostaId);
    if (!Store.state.checklists[propostaId]) {
      Store.state.checklists[propostaId] = {
        nomeLista: `Checklist - ${prop ? prop.nomeEvento : 'Evento'}`,
        itensMarcados: {},
        itensExtras: []
      };
    }
    if (!Store.state.checklists[propostaId].itensExtras) {
      Store.state.checklists[propostaId].itensExtras = [];
    }
    return Store.state.checklists[propostaId];
  },

  abrirModalItemExtra(extraId = null) {
    if (!this.propostaSelecionadaId) {
      App.mostrarToast('Selecione uma proposta para adicionar itens extras.', 'error');
      return;
    }
    const reg = this.garantirRegistroChecklist(this.propostaSelecionadaId);
    const item = extraId ? (reg.itensExtras || []).find((i) => i.id === extraId) : null;
    const categorias = Store.state.categoriasInsumos || [];
    const insumosCatalogo = Store.state.insumos || [];

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
                  ${item ? 'Editar Insumo Extra' : 'Adicionar Insumo Extra / Avulso ao Checklist'}
                </h3>
                <p class="text-[11px] text-slate-500">Insumos ou itens pontuais para o evento</p>
              </div>
            </div>
            <button onclick="App.fecharModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="Aba6Checklist.salvarItemExtra(event)" class="p-6 space-y-4">
            <input type="hidden" id="modal-extra-id" value="${item ? item.id : ''}" />

            ${
              !item
                ? `
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">
                  Atalho: Puxar do Catálogo (Aba 1) ou Digitar Novo
                </label>
                <select onchange="Aba6Checklist.preencherInsumoCatalogo(this.value)" class="input-minimal text-xs">
                  <option value="">-- Escolha um insumo para autopreencher (opcional) --</option>
                  ${insumosCatalogo
                    .map(
                      (ins) =>
                        `<option value="${ins.id}">${ins.descricao} (${ins.unidade} - ${ins.categoria})</option>`
                    )
                    .join('')}
                </select>
              </div>
            `
                : ''
            }

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Descrição do Insumo *</label>
              <input
                type="text"
                id="modal-extra-descricao"
                required
                value="${item ? item.descricao : ''}"
                placeholder="Ex: Pimenta Rosa em Grãos, Flor Comestível, Bitter Especial..."
                class="input-minimal text-sm font-medium"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Categoria *</label>
                <select id="modal-extra-categoria" class="input-minimal text-xs font-medium">
                  ${categorias
                    .map(
                      (cat) =>
                        `<option value="${cat}" ${
                          (item?.categoria || 'Outros') === cat ? 'selected' : ''
                        }>${cat}</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Unidade de Medida *</label>
                <input
                  type="text"
                  id="modal-extra-unidade"
                  required
                  value="${item ? item.unidade : 'un'}"
                  placeholder="Ex: un, ml, g, garrafa, pct"
                  class="input-minimal text-xs"
                />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Quant. Necessária *</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  id="modal-extra-qtd"
                  value="${item ? item.quantidade || item.qtdNecessaria : 1}"
                  class="input-minimal text-xs font-bold text-blue-700"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Emb. Fechada (Tam.)</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  id="modal-extra-vol"
                  value="${item ? item.volumeEmbalagem || 1 : 1}"
                  class="input-minimal text-xs"
                  title="Tamanho da embalagem comercial"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Estoque Atual</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  id="modal-extra-estoque"
                  value="${item ? item.estoqueAtual || 0 : 0}"
                  class="input-minimal text-xs"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Custo Total Estimado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="modal-extra-custo"
                  value="${item ? item.custoEstimado || 0 : 0}"
                  class="input-minimal text-xs font-semibold text-slate-900"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Fornecedor / Local</label>
                <input
                  type="text"
                  id="modal-extra-fornecedor"
                  value="${item ? item.fornecedorNome || '' : ''}"
                  placeholder="Ex: CEASA, Supermercado, Loja Especial"
                  class="input-minimal text-xs"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onclick="App.fecharModal()" class="btn-secondary py-2 px-3 text-xs">
                Cancelar
              </button>
              <button type="submit" class="btn-primary py-2 px-4 text-xs font-bold">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>${item ? 'Salvar Alterações' : 'Adicionar ao Checklist'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    App.abrirModal(modalHtml);
  },

  preencherInsumoCatalogo(insumoId) {
    if (!insumoId) return;
    const ins = (Store.state.insumos || []).find((i) => i.id === insumoId);
    if (!ins) return;

    const descInput = document.getElementById('modal-extra-descricao');
    const catInput = document.getElementById('modal-extra-categoria');
    const unInput = document.getElementById('modal-extra-unidade');
    const volInput = document.getElementById('modal-extra-vol');
    const estInput = document.getElementById('modal-extra-estoque');
    const fornInput = document.getElementById('modal-extra-fornecedor');
    const custoInput = document.getElementById('modal-extra-custo');

    if (descInput) descInput.value = ins.descricao;
    if (catInput) catInput.value = ins.categoria;
    if (unInput) unInput.value = ins.unidade;
    if (volInput) volInput.value = ins.volumeEmbalagem || 1;
    if (estInput) estInput.value = ins.estoqueAtual || 0;

    const custoInfo = Store.getInsumoCustoInfo(ins);
    if (fornInput) fornInput.value = custoInfo.fornecedorAtivo?.nome || '-';
    if (custoInput) custoInput.value = custoInfo.custoRealEmbalagem ?? custoInfo.precoEmbalagem ?? 0;
  },

  salvarItemExtra(event) {
    event.preventDefault();
    if (!this.propostaSelecionadaId) return;
    const reg = this.garantirRegistroChecklist(this.propostaSelecionadaId);

    const id = document.getElementById('modal-extra-id')?.value;
    const descricao = document.getElementById('modal-extra-descricao')?.value.trim();
    const categoria = document.getElementById('modal-extra-categoria')?.value || 'Outros';
    const unidade = document.getElementById('modal-extra-unidade')?.value.trim() || 'un';
    const qtdBruta = Number(document.getElementById('modal-extra-qtd')?.value);
    const volBruto = Number(document.getElementById('modal-extra-vol')?.value);
    const estRaw = document.getElementById('modal-extra-estoque')?.value;
    const estBruto = estRaw === '' || estRaw === undefined ? 0 : Number(estRaw);
    const custoRaw = document.getElementById('modal-extra-custo')?.value;
    const custoBruto = custoRaw === '' || custoRaw === undefined ? 0 : Number(custoRaw);
    const fornecedorNome = document.getElementById('modal-extra-fornecedor')?.value.trim() || '-';

    if (!descricao) {
      App.mostrarToast('Informe a descrição do insumo extra.', 'error');
      return;
    }

    if (!Number.isFinite(qtdBruta) || qtdBruta <= 0) {
      App.mostrarToast('A quantidade necessária deve ser maior que zero.', 'error');
      return;
    }

    if (!Number.isFinite(volBruto) || volBruto <= 0) {
      App.mostrarToast('O tamanho da embalagem deve ser maior que zero.', 'error');
      return;
    }

    if (!Number.isFinite(estBruto) || estBruto < 0 || !Number.isFinite(custoBruto) || custoBruto < 0) {
      App.mostrarToast('Estoque e custo estimado não podem ser negativos.', 'error');
      return;
    }

    const quantidade = qtdBruta;
    const volumeEmbalagem = volBruto;
    const estoqueAtual = estBruto;
    const custoEstimado = custoBruto;

    if (id) {
      // Editar
      const idx = (reg.itensExtras || []).findIndex((i) => i.id === id);
      if (idx !== -1) {
        reg.itensExtras[idx] = {
          ...reg.itensExtras[idx],
          descricao,
          categoria,
          unidade,
          quantidade,
          volumeEmbalagem,
          estoqueAtual,
          custoEstimado,
          fornecedorNome
        };
        App.mostrarToast('Insumo extra atualizado com sucesso!');
      }
    } else {
      // Adicionar
      const novoId = `extra-${Date.now()}`;
      reg.itensExtras.push({
        id: novoId,
        codigo: 'EXTRA',
        descricao,
        categoria,
        unidade,
        quantidade,
        volumeEmbalagem,
        estoqueAtual,
        custoEstimado,
        fornecedorNome
      });
      App.mostrarToast('Insumo extra adicionado ao checklist!');
    }

    Store.save();
    App.fecharModal();
    this.render();
  },

  duplicarItemExtra(extraId) {
    if (!this.propostaSelecionadaId) return;
    const reg = this.garantirRegistroChecklist(this.propostaSelecionadaId);
    const item = (reg.itensExtras || []).find((i) => i.id === extraId);
    if (!item) return;

    const clone = {
      ...JSON.parse(JSON.stringify(item)),
      id: `extra-${Date.now()}`,
      descricao: `${item.descricao} (Cópia)`
    };

    reg.itensExtras.push(clone);
    Store.save();
    this.render();
    App.mostrarToast('Insumo duplicado com sucesso!');
  },

  excluirItemExtra(extraId) {
    if (!this.propostaSelecionadaId) return;
    const reg = this.garantirRegistroChecklist(this.propostaSelecionadaId);
    const item = (reg.itensExtras || []).find((i) => i.id === extraId);
    if (!item) return;

    if (!confirm(`Deseja realmente excluir o insumo extra "${item.descricao}" deste checklist?`)) return;

    reg.itensExtras = reg.itensExtras.filter((i) => i.id !== extraId);
    if (reg.itensMarcados) delete reg.itensMarcados[extraId];

    Store.save();
    this.render();
    App.mostrarToast('Insumo extra excluído.');
  },

  atualizarNomeLista(novoNome) {
    if (!this.propostaSelecionadaId) return;
    const reg = this.garantirRegistroChecklist(this.propostaSelecionadaId);
    reg.nomeLista = novoNome;
    Store.save();
  },

  toggleCheckItem(insumoId, checked) {
    if (!this.propostaSelecionadaId) return;
    const reg = this.garantirRegistroChecklist(this.propostaSelecionadaId);
    reg.itensMarcados[insumoId] = checked;
    Store.save();
    this.render();
  },

  marcarTodos(status) {
    if (!this.propostaSelecionadaId) return;
    const prop = Store.state.propostas.find((p) => p.id === this.propostaSelecionadaId);
    if (!prop) return;
    const dados = this.gerarDadosConsolidadosChecklist(prop);
    const reg = this.garantirRegistroChecklist(this.propostaSelecionadaId);

    dados.itens.forEach((it) => {
      reg.itensMarcados[it.insumoId] = status;
    });
    Store.save();
    this.render();
  },

  alternarBaixaEstoque(propostaId) {
    const prop = Store.state.propostas.find((p) => p.id === propostaId);
    if (!prop) return;
    const dados = this.gerarDadosConsolidadosChecklist(prop);

    if (!prop.estoqueBaixado) {
      if (
        !confirm(
          `Deseja reservar/baixar do Estoque (Aba 1) todos os insumos e matérias-primas disponíveis para o evento "${prop.nomeEvento}"?`
        )
      )
        return;

      const movimentacao = {};
      dados.itens.forEach((it) => {
        if (it.isItemExtra) return;
        const insumo = Store.state.insumos.find((i) => i.id === it.insumoId);
        if (insumo) {
          const saldoAtual = Math.max(0, Number(insumo.estoqueAtual) || 0);
          const necessaria = Math.max(0, Number(it.qtdNecessaria) || 0);
          const descontado = Math.min(saldoAtual, necessaria);
          if (descontado > 0) {
            insumo.estoqueAtual = Math.max(0, Math.round((saldoAtual - descontado) * 1000) / 1000);
            movimentacao[insumo.id] = descontado;
          }
        }
      });

      prop.movimentacaoEstoque = movimentacao;
      prop.estoqueBaixado = true;
      prop.status = 'Aprovada';

      if (window.Aba5Propostas?.propostaAtual?.id === prop.id) {
        window.Aba5Propostas.propostaAtual.estoqueBaixado = true;
        window.Aba5Propostas.propostaAtual.movimentacaoEstoque = JSON.parse(JSON.stringify(movimentacao));
        window.Aba5Propostas.propostaAtual.status = 'Aprovada';
      }

      Store.save();
      this.render();
      App.mostrarToast('Estoque reservado com rastreio exato de saldos na Aba 1!');
    } else {
      if (!confirm(`Deseja estornar (devolver ao estoque da Aba 1) os insumos reservados do evento "${prop.nomeEvento}"?`))
        return;

      if (prop.movimentacaoEstoque && typeof prop.movimentacaoEstoque === 'object') {
        Object.entries(prop.movimentacaoEstoque).forEach(([insumoId, qtdDescontada]) => {
          const insumo = Store.state.insumos.find((i) => i.id === insumoId);
          const q = Number(qtdDescontada);
          if (insumo && Number.isFinite(q) && q > 0) {
            insumo.estoqueAtual = Math.round(((Number(insumo.estoqueAtual) || 0) + q) * 1000) / 1000;
          }
        });
      } else {
        // Fallback de compatibilidade caso a reserva tenha sido feita em versão anterior sem registro
        dados.itens.forEach((it) => {
          if (it.isItemExtra) return;
          const insumo = Store.state.insumos.find((i) => i.id === it.insumoId);
          if (insumo) {
            insumo.estoqueAtual = (Number(insumo.estoqueAtual) || 0) + (Number(it.qtdNecessaria) || 0);
          }
        });
      }

      prop.movimentacaoEstoque = {};
      prop.estoqueBaixado = false;

      if (window.Aba5Propostas?.propostaAtual?.id === prop.id) {
        window.Aba5Propostas.propostaAtual.estoqueBaixado = false;
        window.Aba5Propostas.propostaAtual.movimentacaoEstoque = {};
      }

      Store.save();
      this.render();
      App.mostrarToast('Baixa desfeita! Saldos exatos devolvidos ao estoque.');
    }
  },

  exportarChecklistExcel() {
    const prop = Store.state.propostas.find((p) => p.id === this.propostaSelecionadaId);
    if (!prop) return;
    const dados = this.gerarDadosConsolidadosChecklist(prop);

    const planilha = dados.itens.map((it) => ({
      Check: it.marcado ? 'OK' : 'PENDENTE',
      Codigo: it.codigo,
      Descricao: it.descricao,
      OrigemNoEvento: it.origem,
      Unidade: it.unidade,
      VolumeEmbalagem: it.volumeEmbalagem,
      QuantNecessaria: it.qtdNecessaria,
      EmbalagensNecessarias: it.embNecessarias,
      EstoqueAtual: it.estoqueAtual,
      AComprar: it.aComprar,
      EmbalagensAComprar: it.embAComprar,
      FornecedorRecomendado: it.fornecedorNome,
      CustoEstimado: Number(it.custoEstimado.toFixed(2)),
      CustoEmbalagensFechadas: Number(it.custoEstimadoEmbalagens.toFixed(2))
    }));

    if (window.XLSX) {
      const ws = XLSX.utils.json_to_sheet(planilha);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Checklist_Compras');
      XLSX.writeFile(wb, `Checklist_${prop.codigo}.xlsx`);
      App.mostrarToast('Planilha de Checklist e Compras exportada!');
    } else {
      const csv =
        'Check;Codigo;Descricao;Origem;Unidade;QuantNecessaria;EstoqueAtual;AComprar;Fornecedor;CustoEstimado\n' +
        planilha
          .map(
            (r) =>
              `${r.Check};${r.Codigo};${r.Descricao};${r.OrigemNoEvento};${r.Unidade};${r.QuantNecessaria};${r.EstoqueAtual};${r.AComprar};${r.FornecedorRecomendado};${r.CustoEstimado}`
          )
          .join('\n');
      Aba1Insumos.downloadBlob(csv, `Checklist_${prop.codigo}.csv`, 'text/csv;charset=utf-8;');
    }
  },

  exportarChecklistPdf() {
    const prop = Store.state.propostas.find((p) => p.id === this.propostaSelecionadaId);
    if (!prop) return;
    const dados = this.gerarDadosConsolidadosChecklist(prop);
    if (window.PdfGenerator) {
      window.PdfGenerator.exportarChecklistOperacional(prop, dados);
    }
  },

  abrirModalRendimentoFruta(sucoId) {
    if (window.App && window.App.abrirModalRendimentoFruta) {
      window.App.abrirModalRendimentoFruta(sucoId);
    }
  }
};
