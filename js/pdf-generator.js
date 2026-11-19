// Módulo Gerador de PDFs (Proposta Comercial Visão do Cliente & Checklist Operacional)

window.PdfGenerator = {
  /**
   * Abre um Preview Minimalista da Proposta do Cliente e permite baixar o PDF via jsPDF
   */
  exportarPropostaCliente(proposta) {
    const consolidado = Store.consolidarProposta(proposta);
    const cliente = Store.state.clientes.find((c) => c.id === proposta.clienteId) || {
      nome: 'Cliente Especial',
      contato: '',
      email: ''
    };
    const drinquesEvento = (proposta.coqueteis || [])
      .map((c) => Store.state.drinques.find((d) => d.id === c.drinqueId))
      .filter(Boolean)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

    const dataFormatada = proposta.dataEvento
      ? proposta.dataEvento.split('-').reverse().join('/')
      : 'A definir';

    const labelLinha =
      proposta.linhaInsumos === 'A'
        ? 'Linha Premium (Rótulos Selecionados)'
        : proposta.linhaInsumos === 'B'
        ? 'Linha Padrão (Marcas Consagradas)'
        : 'Linha Essencial';

    const defaultSvg = Store.getDefaultDrinkSvg();

    const modalHtml = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8">
          <!-- Barra de Controle do Preview -->
          <div class="px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <i data-lucide="eye" class="w-4 h-4 text-blue-400"></i>
              <span class="text-xs font-semibold uppercase tracking-wider">Preview da Proposta Comercial (Visão Exclusiva do Cliente)</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="PdfGenerator.gerarArquivoPdfCliente()"
                class="btn-primary py-1.5 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-500"
              >
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>Baixar Arquivo PDF</span>
              </button>
              <button
                type="button"
                onclick="App.fecharModal()"
                class="text-slate-300 hover:text-white p-1"
              >
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Documento Minimalista Branco e Azul Royal -->
          <div id="documento-proposta-cliente" class="p-8 sm:p-10 bg-white max-h-[80vh] overflow-y-auto space-y-8">
            <!-- Cabeçalho Azul Royal & Branco -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b-2 border-blue-600">
              <div>
                <span class="text-xs font-extrabold uppercase tracking-widest text-blue-600 block mb-1">Proposta Comercial • Coquetelaria & Bar</span>
                <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">${proposta.nomeEvento || 'Evento Especial'}</h1>
                <p class="text-sm text-slate-500 mt-1">Preparado especialmente para <strong class="text-slate-800">${cliente.nome}</strong></p>
              </div>
              <div class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-right">
                <span class="text-[11px] font-bold uppercase text-blue-700 block">Referência</span>
                <span class="font-mono text-sm font-extrabold text-blue-900">${proposta.codigo}</span>
                <span class="block text-[11px] text-slate-500 mt-0.5">${labelLinha}</span>
              </div>
            </div>

            <!-- Dados do Evento (Grid Minimalista) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Data do Evento</span>
                <span class="text-sm font-bold text-slate-900 mt-0.5 block">${dataFormatada}</span>
              </div>
              <div>
                <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Duração do Serviço</span>
                <span class="text-sm font-bold text-slate-900 mt-0.5 block">${proposta.duracaoHoras} horas de Open Bar</span>
              </div>
              <div>
                <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Convidados</span>
                <span class="text-sm font-bold text-slate-900 mt-0.5 block">${proposta.numConvidados} pessoas</span>
              </div>
              <div>
                <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Local</span>
                <span class="text-sm font-bold text-slate-900 mt-0.5 block truncate" title="${proposta.localEvento || 'A definir'}">${proposta.localEvento || 'A definir'}</span>
              </div>
            </div>

            <!-- Cardápio de Coquetéis Selecionados -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-extrabold text-blue-900 flex items-center gap-2">
                  <span class="w-2 h-6 bg-blue-600 rounded-full inline-block"></span>
                  Cardápio de Drinques Selecionados
                </h2>
                <span class="text-xs font-semibold text-slate-500">${drinquesEvento.length} opções no menu</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${drinquesEvento
                  .map((d) => {
                    const imgSrc = d.foto && d.foto.trim() ? d.foto : defaultSvg;
                    return `
                      <div class="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <img src="${imgSrc}" class="w-20 h-20 rounded-xl object-cover border border-blue-100 shrink-0" />
                        <div class="min-w-0 flex-1">
                          <h4 class="font-bold text-slate-900 text-base">${d.nome}</h4>
                          <div class="flex flex-wrap gap-1 mt-1.5">
                            ${(d.perfilSensorial || [])
                              .map(
                                (tag) =>
                                  `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">${tag}</span>`
                              )
                              .join('')}
                          </div>
                          <p class="text-xs text-slate-600 mt-2">
                            <strong class="text-slate-800">Finalização / Guarnição:</strong> ${d.guarnicao || 'Clássica'}
                          </p>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            </div>

            <!-- Observações Comerciais -->
            ${
              proposta.observacoesProposta
                ? `
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed">
                <strong class="text-slate-800 block mb-1">Incluso na Proposta:</strong>
                ${proposta.observacoesProposta}
              </div>
            `
                : ''
            }

            <!-- Resumo do Atendimento -->
            <div class="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
              <div>
                <span class="text-xs font-bold uppercase tracking-widest text-blue-300 block">Resumo do Atendimento</span>
                <p class="text-sm text-slate-300 mt-0.5">Cardápio selecionado • Duração de ${proposta.duracaoHoras}h de atendimento</p>
              </div>
              <div class="text-left sm:text-right">
                <span class="text-xl font-extrabold text-white block">${proposta.numConvidados} Convidados</span>
                <span class="text-xs text-slate-400 font-medium">Equipe: ${consolidado.qtdBartenders} bartender(s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._ultimaPropostaPreview = proposta;
    App.abrirModal(modalHtml);
  },

  /**
   * Gera o arquivo PDF nativo (jsPDF) da Proposta do Cliente estritamente sem dados internos
   */
  gerarArquivoPdfCliente() {
    const proposta = this._ultimaPropostaPreview || Aba5Propostas.propostaAtual;
    if (!proposta) return;

    const consolidado = Store.consolidarProposta(proposta);
    const cliente = Store.state.clientes.find((c) => c.id === proposta.clienteId) || {
      nome: 'Cliente Especial',
      contato: '',
      email: ''
    };
    const drinquesEvento = (proposta.coqueteis || [])
      .map((c) => Store.state.drinques.find((d) => d.id === c.drinqueId))
      .filter(Boolean)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));
    const dataFormatada = proposta.dataEvento
      ? proposta.dataEvento.split('-').reverse().join('/')
      : 'A definir';

    if (!window.jspdf || !window.jspdf.jsPDF) {
      window.print();
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Cabeçalho Azul Royal
    doc.setFillColor(37, 99, 235); // #2563EB
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PROPOSTA COMERCIAL • COQUETELARIA & BAR', 15, 14);

    doc.setFontSize(20);
    doc.text(proposta.nomeEvento || 'Proposta de Evento', 15, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Cliente: ${cliente.nome}   |   Ref: ${proposta.codigo}`, 15, 32);

    // Bloco de Informações do Evento
    let y = 48;
    doc.setFillColor(248, 250, 252); // #F8FAFC
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.roundedRect(15, y, 180, 24, 3, 3, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DATA DO EVENTO', 22, y + 8);
    doc.text('DURAÇÃO', 68, y + 8);
    doc.text('CONVIDADOS', 105, y + 8);
    doc.text('LOCAL DO EVENTO', 142, y + 8);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(dataFormatada, 22, y + 16);
    doc.text(`${proposta.duracaoHoras} horas`, 68, y + 16);
    doc.text(`${proposta.numConvidados} convidados`, 105, y + 16);
    const localCurto = (proposta.localEvento || 'A definir').slice(0, 28);
    doc.text(localCurto, 142, y + 16);

    // Título Cardápio
    y = 84;
    doc.setTextColor(30, 64, 175); // #1E40AF
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Cardápio de Drinques Selecionados', 15, y);
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.6);
    doc.line(15, y + 2.5, 195, y + 2.5);

    y += 10;

    drinquesEvento.forEach((d) => {
      if (y > 235) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, y, 180, 24, 2.5, 2.5, 'FD');

      // Se o drinque tiver foto em Base64 JPEG/PNG/WEBP, desenha no quadrado 1:1
      if (d.foto && /^data:image\/(jpeg|jpg|png|webp)/i.test(d.foto)) {
        try {
          const formatoImg = /data:image\/png/i.test(d.foto)
            ? 'PNG'
            : /data:image\/webp/i.test(d.foto)
            ? 'WEBP'
            : 'JPEG';
          doc.addImage(d.foto, formatoImg, 18, y + 3, 18, 18);
        } catch (e) {}
      } else {
        // Ícone minimalista quadrado azul claro
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(18, y + 3, 18, 18, 2, 2, 'F');
        doc.setDrawColor(37, 99, 235);
        doc.line(23, y + 8, 31, y + 8);
        doc.line(23, y + 8, 27, y + 13);
        doc.line(31, y + 8, 27, y + 13);
        doc.line(27, y + 13, 27, y + 18);
        doc.line(24, y + 18, 30, y + 18);
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(d.nome, 40, y + 8);

      const tagsStr = (d.perfilSensorial || []).join('  •  ');
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`Perfil Sensorial: ${tagsStr || 'Clássico'}`, 40, y + 14);

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Guarnição: ${d.guarnicao || 'Clássica'}`, 40, y + 20);

      y += 28;
    });

    // Observações Comerciais (altura dinâmica sem truncar texto do cliente)
    if (proposta.observacoesProposta && String(proposta.observacoesProposta).trim()) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const splitObs = doc.splitTextToSize(String(proposta.observacoesProposta).trim(), 170);
      const linhasExibidas = splitObs.slice(0, 10);
      const alturaBoxObs = Math.max(18, 10 + linhasExibidas.length * 4.2);

      if (y + alturaBoxObs > 250) {
        doc.addPage();
        y = 20;
      }
      y += 2;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, y, 180, alturaBoxObs, 2, 2, 'FD');
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Incluso na Proposta:', 20, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(linhasExibidas, 20, y + 11.5);
      y += alturaBoxObs + 6;
    }

    // Box de Resumo do Atendimento (100% livre de custos internos/margens)
    if (y > 245) {
      doc.addPage();
      y = 25;
    }
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(15, y, 180, 20, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RESUMO DO ATENDIMENTO & ESTRUTURA', 22, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Atendimento para ${consolidado.numConvidados || proposta.numConvidados} convidados • Duração: ${consolidado.duracaoHoras || proposta.duracaoHoras}h de open bar`, 22, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${consolidado.qtdBartenders} Bartender(s)`, 188, y + 11, { align: 'right' });

    const nomeArquivo = `Proposta_${(proposta.nomeEvento || proposta.codigo).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    doc.save(nomeArquivo);
    App.mostrarToast('PDF Comercial gerado com sucesso!');
  },

  /**
   * Gera o PDF Operacional do Checklist e Lista de Compras (Aba 6)
   */
  exportarChecklistOperacional(proposta, dadosChecklist) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      window.print();
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Cabeçalho Operacional
    doc.setFillColor(30, 64, 175); // #1E40AF
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CHECKLIST OPERACIONAL & LISTA DE COMPRAS', 14, 11);

    doc.setFontSize(15);
    doc.text(dadosChecklist.nomeLista || proposta.nomeEvento, 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Convidados: ${proposta.numConvidados}  |  Linha: ${proposta.linhaInsumos}  |  Custo Est. Compra: ${Store.formatCurrency(
        dadosChecklist.somaCustoEstimado
      )}`,
      14,
      26
    );

    let y = 38;

    // Cabeçalho da Tabela
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    doc.text('CHK', 16, y + 5.5);
    doc.text('DESCRIÇÃO DO INSUMO', 26, y + 5.5);
    doc.text('UNID', 95, y + 5.5);
    doc.text('NECESSÁRIO', 110, y + 5.5);
    doc.text('ESTOQUE', 135, y + 5.5);
    doc.text('A COMPRAR', 156, y + 5.5);
    doc.text('CUSTO EST.', 194, y + 5.5, { align: 'right' });

    y += 10;

    dadosChecklist.itens.forEach((it) => {
      if (y > 272) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      const chkSimbolo = it.marcado ? '[ X ]' : '[   ]';
      doc.text(chkSimbolo, 16, y + 4);
      doc.text(it.descricao.slice(0, 36), 26, y + 4);
      doc.text(it.unidade, 95, y + 4);
      doc.text(`${Store.formatNumber(it.qtdNecessaria)} (${it.embNecessarias} emb)`, 110, y + 4);
      doc.text(`${Store.formatNumber(it.estoqueAtual)}`, 135, y + 4);

      if (it.aComprar > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text(`${Store.formatNumber(it.aComprar)} (${it.embAComprar} emb)`, 156, y + 4);
      } else {
        doc.setTextColor(22, 101, 52);
        doc.text('0 (OK)', 156, y + 4);
      }

      doc.setTextColor(15, 23, 42);
      doc.text(Store.formatCurrency(it.custoEstimadoEmbalagens), 194, y + 4, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      if (it.unificacaoFrutaSuco) {
        doc.setFontSize(6.5);
        doc.setTextColor(180, 83, 9);
        doc.text(`[Fruta+Suco: ${it.origem.slice(0, 52)}]`, 26, y + 7.2);
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.line(14, y + 8.8, 196, y + 8.8);
        y += 9.5;
      } else {
        doc.line(14, y + 6.5, 196, y + 6.5);
        y += 7.5;
      }
    });

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 64, 175);
    doc.text(
      `Total Estimado de Compra (Proporcional): ${Store.formatCurrency(
        dadosChecklist.somaCustoEstimado
      )}   |   Embalagens Fechadas: ${Store.formatCurrency(dadosChecklist.somaCustoEmbalagens)}`,
      14,
      y + 5
    );

    doc.save(`Checklist_${proposta.codigo}.pdf`);
    App.mostrarToast('PDF do Checklist exportado com sucesso!');
  },

  /**
   * Gera o PDF Operacional do Checklist de Utensílios e Equipamentos de Bar (Aba 7)
   */
  exportarChecklistUtensilios(proposta, checklistUtensilios) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      window.print();
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const itens = checklistUtensilios.itens || [];
    const isGlobal = Boolean(proposta.isGlobal);

    const qtdPendentesOuFaltantes = itens.filter((it) => {
      const nec = Math.max(1, Number(it.quantidade) || 1);
      const tenho = it.qtdTenho !== undefined ? Math.max(0, Number(it.qtdTenho) || 0) : nec;
      return Boolean(it.pendente) || tenho < nec;
    }).length;

    // Cabeçalho Operacional
    doc.setFillColor(15, 23, 42); // #0F172A Dark Slate
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(
      isGlobal
        ? 'CATÁLOGO & ACERVO GLOBAL DE UTENSÍLIOS DE BAR'
        : 'CHECKLIST DE UTENSÍLIOS & EQUIPAMENTOS DE BAR (MISE EN PLACE)',
      14,
      11
    );

    doc.setFontSize(14);
    doc.text((checklistUtensilios.nomeLista || proposta.nomeEvento || 'Utensílios').slice(0, 58), 14, 20);

    const bartenders = Number(proposta.qtdBartenders) || (typeof Store !== 'undefined' && Store.calcularBartendersProposta ? Store.calcularBartendersProposta(proposta) : 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      isGlobal
        ? `Data: ${proposta.dataEvento || ''}   |   Total no Acervo: ${itens.length} itens   |   Pendentes/Completar: ${qtdPendentesOuFaltantes}`
        : `Evento: ${(proposta.nomeEvento || '').slice(0, 24)}   |   Convidados: ${proposta.numConvidados}   |   Bartenders: ${bartenders}   |   Itens: ${itens.length}   |   A Completar: ${qtdPendentesOuFaltantes}`,
      14,
      27
    );

    let y = 40;

    // Cabeçalho da Tabela
    const desenharCabecalhoTabela = (posicaoY) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, posicaoY, 182, 8, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);

      if (!isGlobal) {
        doc.text('IDA', 15.5, posicaoY + 5.5);
        doc.text('VOLTA', 25, posicaoY + 5.5);
      }
      doc.text('UTENSÍLIO / EQUIPAMENTO', isGlobal ? 16 : 37, posicaoY + 5.5);
      doc.text('NECESS.', 108, posicaoY + 5.5, { align: 'center' });
      doc.text('TENHO', 124, posicaoY + 5.5, { align: 'center' });
      doc.text('STATUS', 135, posicaoY + 5.5);
      doc.text('OBSERVAÇÕES', 171, posicaoY + 5.5);
    };

    desenharCabecalhoTabela(y);
    y += 10;

    // Agrupar por categoria e ordenar
    const grupos = {};
    itens.forEach((it) => {
      const cat = (it.categoria || 'Outros').trim();
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(it);
    });

    const categorias = Object.keys(grupos).sort((a, b) => {
      if (a === 'Outros') return 1;
      if (b === 'Outros') return -1;
      return a.localeCompare(b, 'pt-BR');
    });

    categorias.forEach((cat) => {
      const itensCat = grupos[cat];
      itensCat.sort((a, b) => (a.descricao || '').localeCompare(b.descricao || '', 'pt-BR'));

      if (y > 265) {
        doc.addPage();
        y = 20;
        desenharCabecalhoTabela(y);
        y += 10;
      }

      // Linha de subcabeçalho de categoria
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 1, 182, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(37, 99, 235);
      doc.text(`▸ ${cat.toUpperCase()} (${itensCat.length} ${itensCat.length === 1 ? 'item' : 'itens'})`, 16, y + 3.5);
      y += 6.5;

      itensCat.forEach((it) => {
        if (y > 272) {
          doc.addPage();
          y = 20;
          desenharCabecalhoTabela(y);
          y += 10;
        }

        const nec = Math.max(1, Math.round(Number(it.quantidade) || 1));
        const tenho = it.qtdTenho !== undefined ? Math.max(0, Math.round(Number(it.qtdTenho) || 0)) : nec;
        const faltam = Math.max(0, nec - tenho);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);

        if (!isGlobal) {
          const chkIda = it.conferidoIda ? '[X]' : '[  ]';
          const chkVolta = it.conferidoVolta ? '[X]' : '[  ]';
          doc.setFont('courier', 'bold');
          doc.setFontSize(7.5);
          doc.text(chkIda, 15.5, y + 4);
          doc.text(chkVolta, 25, y + 4);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text((it.descricao || '').slice(0, isGlobal ? 46 : 36), isGlobal ? 16 : 37, y + 4);

        doc.setFont('helvetica', 'bold');
        doc.text(`${nec} ${it.unidade || 'un'}`, 108, y + 4, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.text(`${tenho} ${it.unidade || 'un'}`, 124, y + 4, { align: 'center' });

        if (faltam > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(180, 83, 9);
          doc.text(`+${faltam} (${tenho}/${nec})`, 135, y + 4);
        } else if (it.pendente) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(180, 83, 9);
          doc.text('PENDENTE', 135, y + 4);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(22, 101, 52);
          doc.text(`OK (${tenho}/${nec})`, 135, y + 4);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        const obs = it.observacoes ? it.observacoes.slice(0, 16) : '—';
        doc.text(obs, 171, y + 4);

        doc.setDrawColor(226, 232, 240);
        doc.line(14, y + 6.5, 196, y + 6.5);
        y += 7.5;
      });

      y += 2;
    });

    if (!isGlobal) {
      // Rodapé de assinatura
      if (y > 255) {
        doc.addPage();
        y = 20;
      }
      y += 8;
      doc.setDrawColor(203, 213, 225);
      doc.line(14, y + 15, 95, y + 15);
      doc.line(115, y + 15, 196, y + 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Assinatura do Responsável (Saída / Ida)', 14, y + 20);
      doc.text('Assinatura da Conferência (Retorno / Volta)', 115, y + 20);
    }

    doc.save(isGlobal ? 'Acervo_Global_Utensilios.pdf' : `Checklist_Utensilios_${proposta.codigo}.pdf`);
    App.mostrarToast('PDF de Utensílios gerado com sucesso!');
  }
};

