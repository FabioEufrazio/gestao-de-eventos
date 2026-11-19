/**
 * Serviço de Integração com Google Cloud Firestore (Firebase)
 * Gestão de Eventos — Coquetelaria & Bar
 */

const firebaseConfig = {
  apiKey: "AIzaSyCTBGzgrQ3SEuttGVEp561En8FWJo442-4",
  authDomain: "gestao-de-eventos-d87f0.firebaseapp.com",
  projectId: "gestao-de-eventos-d87f0",
  storageBucket: "gestao-de-eventos-d87f0.firebasestorage.app",
  messagingSenderId: "489058638187",
  appId: "1:489058638187:web:95946ca1818eefb4aa542e"
};

/**
 * Remove valores 'undefined' recursivamente, pois o Firestore rejeita objetos com undefined.
 */
function sanitizarParaFirestore(obj) {
  if (obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj));
}

window.FirebaseService = {
  db: null,
  status: 'desconectado',
  timerDebounce: null,
  ultimaSincronizacao: null,

  init() {
    if (typeof firebase === 'undefined') {
      console.warn('SDK do Firebase não detectado.');
      this.atualizarStatus('erro', 'SDK Ausente');
      return;
    }

    try {
      this.atualizarStatus('conectando', 'Conectando...');
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      this.db = firebase.firestore();

      this.atualizarStatus('conectado', 'Nuvem Pronta');

      // Verificação inicial após 1s
      setTimeout(() => {
        this.verificarDadosIniciais();
      }, 1000);

    } catch (err) {
      console.error('Erro ao inicializar Firebase:', err);
      this.tratarErro(err, 'Erro Conexão');
    }
  },

  atualizarStatus(status, texto) {
    this.status = status;
    const dot = document.getElementById('firebase-status-dot');
    const label = document.getElementById('firebase-status-text');

    if (dot && label) {
      label.textContent = texto || 'Nuvem: ' + status;
      dot.className = 'w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300';

      switch (status) {
        case 'conectado':
          dot.classList.add('bg-emerald-500');
          break;
        case 'sincronizando':
          dot.classList.add('bg-amber-500', 'animate-pulse');
          break;
        case 'conectando':
          dot.classList.add('bg-blue-400', 'animate-pulse');
          break;
        case 'erro':
          dot.classList.add('bg-rose-500');
          break;
        default:
          dot.classList.add('bg-slate-300');
          break;
      }
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  tratarErro(err, fallbackTexto = 'Erro Nuvem') {
    console.error('Firebase Service Erro:', err);

    if (err && (err.code === 'permission-denied' || (err.message && err.message.includes('permission')))) {
      this.atualizarStatus('erro', 'Publicar Regras');
      if (window.App && typeof window.App.mostrarToast === 'function') {
        window.App.mostrarToast('Clique em "Publicar" na aba Regras do Firebase Console para liberar o acesso!', 'warning', 8000);
      }
    } else {
      this.atualizarStatus('erro', fallbackTexto);
      if (window.App && typeof window.App.mostrarToast === 'function') {
        window.App.mostrarToast('Erro ao sincronizar com Firebase: ' + (err.message || 'Verifique o console.'), 'error');
      }
    }
  },

  async verificarDadosIniciais() {
    if (!this.db || !window.Store || !window.Store.state) return;

    try {
      const docRef = this.db.collection('dados_gestao').doc('metadata');
      const snap = await docRef.get();

      if (!snap.exists) {
        console.log('Nuvem vazia detectada. Realizando upload inicial...');
        await this.enviarParaNuvem(false);
      } else {
        const dadosMeta = snap.data();
        this.ultimaSincronizacao = dadosMeta && dadosMeta.atualizadoEm ? new Date(dadosMeta.atualizadoEm) : new Date();
        this.atualizarStatus('conectado', 'Sincronizado');
      }
    } catch (e) {
      this.tratarErro(e, 'Aguardando Regras');
    }
  },

  agendarSincronizacao(delayMs = 3000) {
    if (this.timerDebounce) {
      clearTimeout(this.timerDebounce);
    }
    this.timerDebounce = setTimeout(() => {
      this.enviarParaNuvem(false);
    }, delayMs);
  },

  async enviarParaNuvem(mostrarToast = true) {
    if (!this.db || !window.Store || !window.Store.state) return;

    this.atualizarStatus('sincronizando', 'Salvando...');
    const state = window.Store.state;
    const agora = new Date().toISOString();

    try {
      // Sanitiza todo o estado limpando campos 'undefined' que o Firestore proíbe
      const stateLimpo = sanitizarParaFirestore(state);
      const col = this.db.collection('dados_gestao');

      // Salvamos cada módulo garantindo integridade
      await Promise.all([
        col.doc('configuracoes').set({
          categoriasInsumos: stateLimpo.categoriasInsumos || [],
          categoriasServicos: stateLimpo.categoriasServicos || [],
          gruposGenericos: stateLimpo.gruposGenericos || [],
          unidadesMedida: stateLimpo.unidadesMedida || [],
          categoriasUtensilios: stateLimpo.categoriasUtensilios || [],
          utensiliosPadrao: stateLimpo.utensiliosPadrao || [],
          atualizadoEm: agora
        }),
        col.doc('insumos').set({
          itens: stateLimpo.insumos || [],
          atualizadoEm: agora
        }),
        col.doc('servicos').set({
          itens: stateLimpo.servicos || [],
          atualizadoEm: agora
        }),
        col.doc('drinques').set({
          itens: stateLimpo.drinques || [],
          atualizadoEm: agora
        }),
        col.doc('clientes').set({
          itens: stateLimpo.clientes || [],
          atualizadoEm: agora
        }),
        col.doc('propostas').set({
          itens: stateLimpo.propostas || [],
          atualizadoEm: agora
        }),
        col.doc('checklists').set({
          checklists: stateLimpo.checklists || {},
          checklistsUtensilios: stateLimpo.checklistsUtensilios || {},
          atualizadoEm: agora
        }),
        col.doc('metadata').set({
          atualizadoEm: agora,
          versaoApp: 'v4.4',
          origem: 'Gestão de Eventos Web'
        })
      ]);

      this.ultimaSincronizacao = new Date();
      this.atualizarStatus('conectado', 'Sincronizado');

      if (mostrarToast && window.App && typeof window.App.mostrarToast === 'function') {
        window.App.mostrarToast('Dados salvos na nuvem Firebase com sucesso!', 'success');
      }
    } catch (err) {
      this.tratarErro(err, 'Erro ao Salvar');
    }
  },

  async puxarDaNuvem(mostrarToast = true) {
    if (!this.db || !window.Store) return;

    this.atualizarStatus('sincronizando', 'Baixando Nuvem...');

    try {
      const col = this.db.collection('dados_gestao');
      const docs = await col.get();

      if (docs.empty) {
        if (mostrarToast && window.App) {
          window.App.mostrarToast('Nenhum dado encontrado na nuvem para restauração.', 'warning');
        }
        this.atualizarStatus('conectado', 'Nuvem Vazia');
        return;
      }

      let novoEstado = JSON.parse(JSON.stringify(window.Store.state));

      docs.forEach((doc) => {
        const id = doc.id;
        const data = doc.data();

        if (id === 'configuracoes') {
          if (data.categoriasInsumos) novoEstado.categoriasInsumos = data.categoriasInsumos;
          if (data.categoriasServicos) novoEstado.categoriasServicos = data.categoriasServicos;
          if (data.gruposGenericos) novoEstado.gruposGenericos = data.gruposGenericos;
          if (data.unidadesMedida) novoEstado.unidadesMedida = data.unidadesMedida;
          if (data.categoriasUtensilios) novoEstado.categoriasUtensilios = data.categoriasUtensilios;
          if (data.utensiliosPadrao) novoEstado.utensiliosPadrao = data.utensiliosPadrao;
        } else if (id === 'insumos' && Array.isArray(data.itens)) {
          novoEstado.insumos = data.itens;
        } else if (id === 'servicos' && Array.isArray(data.itens)) {
          novoEstado.servicos = data.itens;
        } else if (id === 'drinques' && Array.isArray(data.itens)) {
          novoEstado.drinques = data.itens;
        } else if (id === 'clientes' && Array.isArray(data.itens)) {
          novoEstado.clientes = data.itens;
        } else if (id === 'propostas' && Array.isArray(data.itens)) {
          novoEstado.propostas = data.itens;
        } else if (id === 'checklists') {
          if (data.checklists) novoEstado.checklists = data.checklists;
          if (data.checklistsUtensilios) novoEstado.checklistsUtensilios = data.checklistsUtensilios;
        }
      });

      window.Store.state = novoEstado;
      window.Store.normalizarEstado();
      localStorage.setItem('CALCULADOR_EVENTOS_V4_DATA', JSON.stringify(window.Store.state));
      window.dispatchEvent(new CustomEvent('store-updated'));

      this.atualizarStatus('conectado', 'Sincronizado');

      if (window.App && typeof window.App.renderizarAbaAtual === 'function') {
        window.App.renderizarAbaAtual();
      }

      if (mostrarToast && window.App && typeof window.App.mostrarToast === 'function') {
        window.App.mostrarToast('Dados da nuvem restaurados com sucesso!', 'success');
      }
    } catch (err) {
      this.tratarErro(err, 'Erro ao Baixar');
    }
  },

  async sincronizar() {
    await this.enviarParaNuvem(true);
  }
};

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.FirebaseService.init();
});
