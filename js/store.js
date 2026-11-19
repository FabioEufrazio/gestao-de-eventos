// Gerenciador de Estado e Persistência Local (LocalStorage) - Calculador de Eventos

const STORAGE_KEY = 'CALCULADOR_EVENTOS_V4_DATA';

// Pictograma SVG elegante de taça minimalista em tom azul claro (Fallback padrão 1:1 para Drinques sem foto)
const DEFAULT_DRINK_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EFF6FF"/>
      <stop offset="100%" stop-color="#DBEAFE"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bgGrad)"/>
  <circle cx="200" cy="200" r="130" fill="#FFFFFF" fill-opacity="0.65"/>
  <!-- Taça Minimalista -->
  <path d="M135 125 H265 L200 205 Z" fill="#BFDBFE" fill-opacity="0.45" stroke="#2563EB" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="200" y1="205" x2="200" y2="280" stroke="#2563EB" stroke-width="6" stroke-linecap="round"/>
  <line x1="160" y1="280" x2="240" y2="280" stroke="#2563EB" stroke-width="6" stroke-linecap="round"/>
  <!-- Detalhe Cítrico / Guarnição -->
  <circle cx="235" cy="125" r="20" fill="#EFF6FF" stroke="#1E40AF" stroke-width="5"/>
  <line x1="222" y1="138" x2="252" y2="108" stroke="#2563EB" stroke-width="4" stroke-linecap="round"/>
  <circle cx="185" cy="155" r="5" fill="#2563EB"/>
  <circle cx="205" cy="170" r="3.5" fill="#2563EB"/>
</svg>`);

const INITIAL_MOCK_DATA = {
  categoriasInsumos: [
    'Destilados',
    'Licores & Aperitivos',
    'Xaropes & Sub-receitas',
    'Matérias-Primas & Mercearia',
    'Frutas & Botânicos',
    'Mixers & Bebidas',
    'Periféricos & Descartáveis',
    'Gelo',
    'Outros'
  ],
  categoriasServicos: [
    'Mão de Obra',
    'Transporte & Logística',
    'Estrutura & Mobiliário',
    'Taxas & Outros'
  ],
  gruposGenericos: [
    'Gin',
    'Vodka',
    'Rum',
    'Whisky',
    'Cachaça',
    'Tequila',
    'Aperitivo Bitter',
    'Espumante'
  ],
  unidadesMedida: ['ml', 'L', 'g', 'kg', 'un', 'pct', 'cx'],
  insumos: [
    // GIN (Linhas A, B, C)
    {
      id: 'ins-gin-a',
      codigo: 'INS-001',
      descricao: 'Gin Tanqueray London Dry',
      unidade: 'ml',
      volumeEmbalagem: 750,
      categoria: 'Destilados',
      estoqueAtual: 4500, // 6 garrafas
      linha: 'A',
      semLinha: false,
      grupoGenerico: 'Gin',
      producaoPropria: false,
      rendimentoFinal: 750,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-101', nome: 'Empório Bebidas SP', preco: 114.90, tamanhoEmbalagem: 750 },
        { id: 'f-102', nome: 'Atacadão Distribuidora', preco: 122.50, tamanhoEmbalagem: 750 },
        { id: 'f-103', nome: 'Adega Express', preco: 129.00, tamanhoEmbalagem: 750 }
      ]
    },
    {
      id: 'ins-gin-b',
      codigo: 'INS-002',
      descricao: 'Gin Beefeater London Dry',
      unidade: 'ml',
      volumeEmbalagem: 750,
      categoria: 'Destilados',
      estoqueAtual: 3000, // 4 garrafas
      linha: 'B',
      semLinha: false,
      grupoGenerico: 'Gin',
      producaoPropria: false,
      rendimentoFinal: 750,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-104', nome: 'Atacadão Distribuidora', preco: 84.90, tamanhoEmbalagem: 750 },
        { id: 'f-105', nome: 'Empório Bebidas SP', preco: 89.90, tamanhoEmbalagem: 750 }
      ],
      escalado: true
    },
    {
      id: 'ins-gin-b2',
      codigo: 'INS-002-B',
      descricao: "Gin Gordon's London Dry",
      unidade: 'ml',
      volumeEmbalagem: 750,
      categoria: 'Destilados',
      estoqueAtual: 3000,
      linha: 'B',
      semLinha: false,
      grupoGenerico: 'Gin',
      producaoPropria: false,
      rendimentoFinal: 750,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-104-b', nome: 'Atacadão Distribuidora', preco: 74.90, tamanhoEmbalagem: 750 },
        { id: 'f-105-b', nome: 'Empório Bebidas SP', preco: 78.90, tamanhoEmbalagem: 750 }
      ],
      escalado: false
    },
    {
      id: 'ins-gin-c',
      codigo: 'INS-003',
      descricao: 'Gin Seagers / Rocks',
      unidade: 'ml',
      volumeEmbalagem: 980,
      categoria: 'Destilados',
      estoqueAtual: 4900, // 5 garrafas
      linha: 'C',
      semLinha: false,
      grupoGenerico: 'Gin',
      producaoPropria: false,
      rendimentoFinal: 980,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-106', nome: 'Cash & Carry Bebidas', preco: 42.90, tamanhoEmbalagem: 980 },
        { id: 'f-107', nome: 'Atacadão Distribuidora', preco: 46.00, tamanhoEmbalagem: 980 }
      ]
    },

    // VODKA (Linhas A, B, C)
    {
      id: 'ins-vodka-a',
      codigo: 'INS-004',
      descricao: 'Vodka Absolut Original',
      unidade: 'ml',
      volumeEmbalagem: 1000,
      categoria: 'Destilados',
      estoqueAtual: 5000,
      linha: 'A',
      semLinha: false,
      grupoGenerico: 'Vodka',
      producaoPropria: false,
      rendimentoFinal: 1000,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-201', nome: 'Empório Bebidas SP', preco: 89.90, tamanhoEmbalagem: 1000 },
        { id: 'f-202', nome: 'Atacadão Distribuidora', preco: 94.50, tamanhoEmbalagem: 1000 }
      ]
    },
    {
      id: 'ins-vodka-b',
      codigo: 'INS-005',
      descricao: 'Vodka Smirnoff Red',
      unidade: 'ml',
      volumeEmbalagem: 998,
      categoria: 'Destilados',
      estoqueAtual: 5988,
      linha: 'B',
      semLinha: false,
      grupoGenerico: 'Vodka',
      escalado: true,
      producaoPropria: false,
      rendimentoFinal: 998,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-203', nome: 'Atacadão Distribuidora', preco: 41.90, tamanhoEmbalagem: 998 },
        { id: 'f-204', nome: 'Cash & Carry Bebidas', preco: 44.90, tamanhoEmbalagem: 998 }
      ]
    },
    {
      id: 'ins-vodka-b2',
      codigo: 'INS-005B',
      descricao: 'Vodka Skyy 980ml',
      unidade: 'ml',
      volumeEmbalagem: 980,
      categoria: 'Destilados',
      estoqueAtual: 3920,
      linha: 'B',
      semLinha: false,
      grupoGenerico: 'Vodka',
      escalado: false,
      producaoPropria: false,
      rendimentoFinal: 980,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-203', nome: 'Atacadão Distribuidora', preco: 38.50, tamanhoEmbalagem: 980 },
        { id: 'f-204', nome: 'Cash & Carry Bebidas', preco: 40.90, tamanhoEmbalagem: 980 }
      ]
    },
    {
      id: 'ins-vodka-c',
      codigo: 'INS-006',
      descricao: 'Vodka Orloff / Kovak',
      unidade: 'ml',
      volumeEmbalagem: 1000,
      categoria: 'Destilados',
      estoqueAtual: 4000,
      linha: 'C',
      semLinha: false,
      grupoGenerico: 'Vodka',
      producaoPropria: false,
      rendimentoFinal: 1000,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-205', nome: 'Cash & Carry Bebidas', preco: 27.90, tamanhoEmbalagem: 1000 }
      ]
    },

    // RUM (Linhas A, B, C)
    {
      id: 'ins-rum-a',
      codigo: 'INS-007',
      descricao: 'Rum Havana Club 3 Años',
      unidade: 'ml',
      volumeEmbalagem: 750,
      categoria: 'Destilados',
      estoqueAtual: 2250,
      linha: 'A',
      semLinha: false,
      grupoGenerico: 'Rum',
      producaoPropria: false,
      rendimentoFinal: 750,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-301', nome: 'Empório Bebidas SP', preco: 79.90, tamanhoEmbalagem: 750 }
      ]
    },
    {
      id: 'ins-rum-b',
      codigo: 'INS-008',
      descricao: 'Rum Bacardi Carta Blanca',
      unidade: 'ml',
      volumeEmbalagem: 980,
      categoria: 'Destilados',
      estoqueAtual: 2940,
      linha: 'B',
      semLinha: false,
      grupoGenerico: 'Rum',
      producaoPropria: false,
      rendimentoFinal: 980,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-302', nome: 'Atacadão Distribuidora', preco: 46.90, tamanhoEmbalagem: 980 }
      ]
    },
    {
      id: 'ins-rum-c',
      codigo: 'INS-009',
      descricao: 'Rum Montilla Carta Branca',
      unidade: 'ml',
      volumeEmbalagem: 1000,
      categoria: 'Destilados',
      estoqueAtual: 3000,
      linha: 'C',
      semLinha: false,
      grupoGenerico: 'Rum',
      producaoPropria: false,
      rendimentoFinal: 1000,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-303', nome: 'Cash & Carry Bebidas', preco: 29.90, tamanhoEmbalagem: 1000 }
      ]
    },

    // CACHAÇA (Linhas A, B, C)
    {
      id: 'ins-cachaca-a',
      codigo: 'INS-010',
      descricao: 'Cachaça Leblon / Weber Haus Prata',
      unidade: 'ml',
      volumeEmbalagem: 750,
      categoria: 'Destilados',
      estoqueAtual: 2250,
      linha: 'A',
      semLinha: false,
      grupoGenerico: 'Cachaça',
      producaoPropria: false,
      rendimentoFinal: 750,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-401', nome: 'Empório Bebidas SP', preco: 69.90, tamanhoEmbalagem: 750 }
      ]
    },
    {
      id: 'ins-cachaca-b',
      codigo: 'INS-011',
      descricao: 'Cachaça Sagatiba Cristalina',
      unidade: 'ml',
      volumeEmbalagem: 700,
      categoria: 'Destilados',
      estoqueAtual: 2800,
      linha: 'B',
      semLinha: false,
      grupoGenerico: 'Cachaça',
      producaoPropria: false,
      rendimentoFinal: 700,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-402', nome: 'Atacadão Distribuidora', preco: 34.90, tamanhoEmbalagem: 700 }
      ]
    },
    {
      id: 'ins-cachaca-c',
      codigo: 'INS-012',
      descricao: 'Cachaça Velho Barreiro / 51 Ouro',
      unidade: 'ml',
      volumeEmbalagem: 910,
      categoria: 'Destilados',
      estoqueAtual: 4550,
      linha: 'C',
      semLinha: false,
      grupoGenerico: 'Cachaça',
      producaoPropria: false,
      rendimentoFinal: 910,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-403', nome: 'Cash & Carry Bebidas', preco: 16.90, tamanhoEmbalagem: 910 }
      ]
    },

    // APERITIVO & ESPUMANTE
    {
      id: 'ins-aperol',
      codigo: 'INS-013',
      descricao: 'Aperitivo Aperol Original',
      unidade: 'ml',
      volumeEmbalagem: 750,
      categoria: 'Licores & Aperitivos',
      estoqueAtual: 3000,
      linha: 'A',
      semLinha: true,
      grupoGenerico: 'Aperitivo Bitter',
      producaoPropria: false,
      rendimentoFinal: 750,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-501', nome: 'Atacadão Distribuidora', preco: 59.90, tamanhoEmbalagem: 750 },
        { id: 'f-502', nome: 'Empório Bebidas SP', preco: 64.90, tamanhoEmbalagem: 750 }
      ]
    },
    {
      id: 'ins-espumante-b',
      codigo: 'INS-014',
      descricao: 'Espumante Brut Salton / Chandon',
      unidade: 'ml',
      volumeEmbalagem: 750,
      categoria: 'Mixers & Bebidas',
      estoqueAtual: 4500,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: 'Espumante',
      producaoPropria: false,
      rendimentoFinal: 750,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-503', nome: 'Empório Bebidas SP', preco: 44.90, tamanhoEmbalagem: 750 }
      ]
    },

    // INSUMOS BASE (MATÉRIAS-PRIMAS PARA SUB-RECEITAS E USO DIRETO)
    {
      id: 'ins-tonica',
      codigo: 'INS-015',
      descricao: 'Água Tônica Antarctica / Schweppes',
      unidade: 'ml',
      volumeEmbalagem: 350,
      categoria: 'Mixers & Bebidas',
      estoqueAtual: 14000,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 350,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-601', nome: 'Atacadão Distribuidora', preco: 3.49, tamanhoEmbalagem: 350 },
        { id: 'f-602', nome: 'Supermercado Central', preco: 3.99, tamanhoEmbalagem: 350 }
      ]
    },
    {
      id: 'ins-limao',
      codigo: 'INS-016',
      descricao: 'Suco de Limão Tahiti Fresco',
      unidade: 'ml',
      volumeEmbalagem: 1000,
      categoria: 'Frutas & Botânicos',
      estoqueAtual: 3000,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 1000,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-603', nome: 'CEASA Hortifruti', preco: 14.00, tamanhoEmbalagem: 1000 },
        { id: 'f-604', nome: 'Sacolão Premium', preco: 17.50, tamanhoEmbalagem: 1000 }
      ]
    },
    {
      id: 'ins-mat-acucar',
      codigo: 'INS-027',
      descricao: 'Açúcar Refinado Especial União (Matéria-Prima)',
      unidade: 'g',
      volumeEmbalagem: 1000,
      categoria: 'Matérias-Primas & Mercearia',
      estoqueAtual: 5000, // 5 kg
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 1000,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-801', nome: 'Atacadão Distribuidora', preco: 4.80, tamanhoEmbalagem: 1000 },
        { id: 'f-802', nome: 'Supermercado Central', preco: 5.50, tamanhoEmbalagem: 1000 }
      ]
    },
    {
      id: 'ins-mat-gengibre',
      codigo: 'INS-028',
      descricao: 'Gengibre Fresco In Natura (Matéria-Prima)',
      unidade: 'g',
      volumeEmbalagem: 1000,
      categoria: 'Frutas & Botânicos',
      estoqueAtual: 1500, // 1.5 kg
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 1000,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-803', nome: 'CEASA Hortifruti', preco: 18.90, tamanhoEmbalagem: 1000 }
      ]
    },
    {
      id: 'ins-mat-agua',
      codigo: 'INS-029',
      descricao: 'Água Mineral sem Gás Filtrada (Galão/Garrafa)',
      unidade: 'ml',
      volumeEmbalagem: 5000,
      categoria: 'Matérias-Primas & Mercearia',
      estoqueAtual: 15000, // 15 L
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 5000,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-804', nome: 'Distribuidora Água Pura', preco: 10.00, tamanhoEmbalagem: 5000 }
      ]
    },
    {
      id: 'ins-mat-emulsificante',
      codigo: 'INS-030',
      descricao: 'Albumina / Emulsificante + Cápsula N2O (Kit Sifão)',
      unidade: 'g',
      volumeEmbalagem: 100,
      categoria: 'Matérias-Primas & Mercearia',
      estoqueAtual: 200,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 100,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-805', nome: 'Empório Gastronômico SP', preco: 28.00, tamanhoEmbalagem: 100 }
      ]
    },

    // INSUMOS DE PRODUÇÃO PRÓPRIA (SUB-RECEITAS COMPOSTAS)
    {
      id: 'ins-xarope-acucar',
      codigo: 'INS-017',
      descricao: 'Xarope Simples de Açúcar 1:1 (Produção Própria)',
      unidade: 'ml',
      volumeEmbalagem: 1000,
      categoria: 'Xaropes & Sub-receitas',
      estoqueAtual: 1000,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: true,
      rendimentoFinal: 1000, // 1000 ml de rendimento final
      subReceita: [
        { insumoBaseId: 'ins-mat-acucar', quantidade: 650 }, // 650g de açúcar
        { insumoBaseId: 'ins-mat-agua', quantidade: 650 }    // 650ml de água -> rende 1000ml de xarope
      ],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: []
    },
    {
      id: 'ins-xarope-gengibre',
      codigo: 'INS-018',
      descricao: 'Xarope Artesanal de Gengibre (Produção Própria)',
      unidade: 'ml',
      volumeEmbalagem: 1000,
      categoria: 'Xaropes & Sub-receitas',
      estoqueAtual: 500,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: true,
      rendimentoFinal: 1000, // 1000 ml de rendimento final
      subReceita: [
        { insumoBaseId: 'ins-mat-gengibre', quantidade: 350 }, // 350g gengibre fresco
        { insumoBaseId: 'ins-mat-acucar', quantidade: 600 },   // 600g açúcar
        { insumoBaseId: 'ins-mat-agua', quantidade: 650 }      // 650ml água
      ],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: []
    },
    {
      id: 'ins-espuma-gengibre',
      codigo: 'INS-019',
      descricao: 'Espuma Artesanal de Gengibre (Produção Própria)',
      unidade: 'ml',
      volumeEmbalagem: 1200,
      categoria: 'Xaropes & Sub-receitas',
      estoqueAtual: 0,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: true,
      rendimentoFinal: 1200, // Rende 1200 ml no sifão
      subReceita: [
        { insumoBaseId: 'ins-mat-gengibre', quantidade: 250 },       // 250g gengibre fresco
        { insumoBaseId: 'ins-mat-acucar', quantidade: 300 },         // 300g açúcar
        { insumoBaseId: 'ins-limao', quantidade: 150 },              // 150ml suco de limão
        { insumoBaseId: 'ins-mat-agua', quantidade: 400 },           // 400ml água
        { insumoBaseId: 'ins-mat-emulsificante', quantidade: 30 }    // 30g albumina/emulsificante
      ],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: []
    },

    // DEMAIS INSUMOS DE USO COMUM
    {
      id: 'ins-frutas-vermelhas',
      codigo: 'INS-020',
      descricao: 'Mix de Frutas Vermelhas (Morango/Amora)',
      unidade: 'g',
      volumeEmbalagem: 1000,
      categoria: 'Frutas & Botânicos',
      estoqueAtual: 2500,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 1000,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-608', nome: 'CEASA Hortifruti', preco: 32.00, tamanhoEmbalagem: 1000 }
      ]
    },
    {
      id: 'ins-hortela',
      codigo: 'INS-021',
      descricao: 'Hortelã Fresca Higienizada',
      unidade: 'g',
      volumeEmbalagem: 250,
      categoria: 'Frutas & Botânicos',
      estoqueAtual: 500,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 250,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-609', nome: 'CEASA Hortifruti', preco: 12.00, tamanhoEmbalagem: 250 }
      ]
    },
    {
      id: 'ins-agua-gas',
      codigo: 'INS-022',
      descricao: 'Água com Gás Crystal',
      unidade: 'ml',
      volumeEmbalagem: 500,
      categoria: 'Mixers & Bebidas',
      estoqueAtual: 10000,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 500,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-610', nome: 'Atacadão Distribuidora', preco: 2.20, tamanhoEmbalagem: 500 }
      ]
    },
    // PERIFÉRICOS & DESCARTÁVEIS & GELO
    {
      id: 'ins-gelo',
      codigo: 'INS-023',
      descricao: 'Gelo Cristal Filtrado (Cubo)',
      unidade: 'kg',
      volumeEmbalagem: 10,
      categoria: 'Gelo',
      estoqueAtual: 30,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 10,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-701', nome: 'Fábrica Rei do Gelo', preco: 18.00, tamanhoEmbalagem: 10 },
        { id: 'f-702', nome: 'Gelo Express 24h', preco: 22.00, tamanhoEmbalagem: 10 }
      ]
    },
    {
      id: 'ins-canudo',
      codigo: 'INS-024',
      descricao: 'Canudo Biodegradável Preto (Pacote 100un)',
      unidade: 'un',
      volumeEmbalagem: 100,
      categoria: 'Periféricos & Descartáveis',
      estoqueAtual: 300,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 100,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-703', nome: 'Kalunga / Embalagens SP', preco: 16.90, tamanhoEmbalagem: 100 }
      ]
    },
    {
      id: 'ins-guardanapo',
      codigo: 'INS-025',
      descricao: 'Guardanapo Coquetel Folha Dupla (Pacote 50un)',
      unidade: 'un',
      volumeEmbalagem: 50,
      categoria: 'Periféricos & Descartáveis',
      estoqueAtual: 400,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 50,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-704', nome: 'Embalagens SP', preco: 8.50, tamanhoEmbalagem: 50 }
      ]
    },
    {
      id: 'ins-copo-acrilico',
      codigo: 'INS-026',
      descricao: 'Copo Cristal Acrílico Rígido 400ml',
      unidade: 'un',
      volumeEmbalagem: 10,
      categoria: 'Periféricos & Descartáveis',
      estoqueAtual: 150,
      linha: 'SEM_LINHA',
      semLinha: true,
      grupoGenerico: '',
      producaoPropria: false,
      rendimentoFinal: 10,
      subReceita: [],
      fornecedorAtivoId: 'MENOR_PRECO',
      fornecedores: [
        { id: 'f-705', nome: 'Embalagens SP', preco: 14.90, tamanhoEmbalagem: 10 }
      ]
    }
  ],

  servicos: [
    {
      id: 'srv-001',
      descricao: 'Bartender Profissional (Turno 6h)',
      categoria: 'Mão de Obra',
      valorHora: 58.33,
      valorUnitario: 350.00,
      convidadosPorUnidade: 50,
      observacoes: '1 Bartender recomendado para cada 50 convidados. Uniforme completo incluso.'
    },
    {
      id: 'srv-002',
      descricao: 'Barback / Auxiliar de Bar (Turno 6h)',
      categoria: 'Mão de Obra',
      valorHora: 36.67,
      valorUnitario: 220.00,
      convidadosPorUnidade: 100,
      observacoes: 'Apoio de reposição de gelo, frutas, taças e organização da estação.'
    },
    {
      id: 'srv-003',
      descricao: 'Copeiro / Lavagem de Taças',
      categoria: 'Mão de Obra',
      valorHora: 31.67,
      valorUnitario: 190.00,
      convidadosPorUnidade: 120,
      observacoes: 'Higienização contínua de vidrarias e utensílios durante o evento.'
    },
    {
      id: 'srv-004',
      descricao: 'Frete e Logística (Até 30km)',
      categoria: 'Transporte & Logística',
      valorHora: 0,
      valorUnitario: 280.00,
      convidadosPorUnidade: 0,
      observacoes: 'Transporte de estrutura, insumos refrigerados e equipe.'
    },
    {
      id: 'srv-005',
      descricao: 'Locação e Montagem de Balcão Iluminado (Módulo 2m)',
      categoria: 'Estrutura & Mobiliário',
      valorHora: 0,
      valorUnitario: 450.00,
      convidadosPorUnidade: 100,
      observacoes: 'Balcão modular profissional com cuba térmica inox integrada.'
    }
  ],

  drinques: [
    {
      id: 'drk-001',
      nome: 'Moscow Mule Autoral',
      foto: '',
      perfilSensorial: ['Cítrico', 'Refrescante', 'Picante', 'Cremoso'],
      guarnicao: 'Espuma artesanal de gengibre e raspa de limão tahiti',
      ingredientes: [
        { tipoVinculo: 'GENERICO', grupoGenerico: 'Vodka', insumoId: 'ins-vodka-a', quantidade: 50 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-limao', quantidade: 25 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-xarope-gengibre', quantidade: 25 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-espuma-gengibre', quantidade: 40 }
      ]
    },
    {
      id: 'drk-002',
      nome: 'Gin Tônica Tropical & Botânicos',
      foto: '',
      perfilSensorial: ['Refrescante', 'Aromático', 'Seco', 'Cítrico'],
      guarnicao: 'Rodela de laranja desidratada, zimbro e ramo de alecrim',
      ingredientes: [
        { tipoVinculo: 'GENERICO', grupoGenerico: 'Gin', insumoId: 'ins-gin-a', quantidade: 50 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-tonica', quantidade: 150 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-limao', quantidade: 15 }
      ]
    },
    {
      id: 'drk-003',
      nome: 'Mojito Clássico Cubano',
      foto: '',
      perfilSensorial: ['Refrescante', 'Herbal', 'Cítrico'],
      guarnicao: 'Ramo generoso de hortelã fresca e rodela de limão',
      ingredientes: [
        { tipoVinculo: 'GENERICO', grupoGenerico: 'Rum', insumoId: 'ins-rum-a', quantidade: 50 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-limao', quantidade: 25 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-xarope-acucar', quantidade: 25 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-hortela', quantidade: 5 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-agua-gas', quantidade: 80 }
      ]
    },
    {
      id: 'drk-004',
      nome: 'Caipirinha Gourmet de Frutas Vermelhas',
      foto: '',
      perfilSensorial: ['Frutado', 'Doce', 'Equilibrado'],
      guarnicao: 'Morango fresco laminado na borda e amora inteira',
      ingredientes: [
        { tipoVinculo: 'GENERICO', grupoGenerico: 'Cachaça', insumoId: 'ins-cachaca-a', quantidade: 60 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-frutas-vermelhas', quantidade: 60 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-xarope-acucar', quantidade: 25 }
      ]
    },
    {
      id: 'drk-005',
      nome: 'Aperol Spritz Veneziano',
      foto: '',
      perfilSensorial: ['Cítrico', 'Amargo Leve', 'Borbulhante'],
      guarnicao: 'Meia lua de laranja bahia fresca',
      ingredientes: [
        { tipoVinculo: 'INSUMO', grupoGenerico: 'Aperitivo Bitter', insumoId: 'ins-aperol', quantidade: 60 },
        { tipoVinculo: 'INSUMO', grupoGenerico: 'Espumante', insumoId: 'ins-espumante-b', quantidade: 90 },
        { tipoVinculo: 'INSUMO', grupoGenerico: '', insumoId: 'ins-agua-gas', quantidade: 30 }
      ]
    }
  ],

  clientes: [
    {
      id: 'cli-001',
      nome: 'Juliana Martins & Pedro Henrique',
      contato: '(11) 99812-4450',
      email: 'juliana.casamento2026@email.com',
      observacoes: 'Casamento no Espaço Serra da Cantareira. Preferência por drinques cítricos e Gin Tanqueray.'
    },
    {
      id: 'cli-002',
      nome: 'TechNova Solutions Ltda (Mariana Costa)',
      contato: '(11) 98441-2090',
      email: 'eventos@technova.com.br',
      observacoes: 'Confraternização corporativa de fim de ano. Exige emissão de NF e equipe uniformizada em preto.'
    },
    {
      id: 'cli-003',
      nome: 'Dr. Roberto Almeida (Aniversário 50 Anos)',
      contato: '(21) 99105-8833',
      email: 'roberto.almeida.med@email.com',
      observacoes: 'Festa residencial para 80 convidados. Gosta de Moscow Mule e Aperol Spritz.'
    }
  ],

  propostas: [
    {
      id: 'prop-001',
      codigo: 'PROP-2026-01',
      clienteId: 'cli-001',
      nomeEvento: 'Casamento Juliana & Pedro',
      dataEvento: '2026-11-21',
      localEvento: 'Espaço Villa Cantareira - São Paulo/SP',
      numConvidados: 150,
      duracaoHoras: 6,
      linhaInsumos: 'A',
      status: 'Aprovada',
      escalacaoBebidas: { Vodka: 'ins-vodka-a', Gin: 'ins-gin-a', Rum: 'ins-rum-a' },
      estoqueBaixado: false,
      coqueteis: [
        { drinqueId: 'drk-001' },
        { drinqueId: 'drk-002' },
        { drinqueId: 'drk-003' },
        { drinqueId: 'drk-005' }
      ],
      servicos: [
        { servicoId: 'srv-001', quantidade: 3, valorHora: 58.33, valorUnitario: 350.00 },
        { servicoId: 'srv-002', quantidade: 2, valorHora: 36.67, valorUnitario: 220.00 },
        { servicoId: 'srv-003', quantidade: 1, valorHora: 31.67, valorUnitario: 190.00 },
        { servicoId: 'srv-004', quantidade: 1, valorHora: 0, valorUnitario: 280.00 },
        { servicoId: 'srv-005', quantidade: 2, valorHora: 0, valorUnitario: 450.00 }
      ],
      ajustesInsumosCoqueteis: {},
      perifericos: [
        { insumoId: 'ins-gelo', quantidade: 90 },
        { insumoId: 'ins-canudo', quantidade: 500 },
        { insumoId: 'ins-guardanapo', quantidade: 800 },
        { insumoId: 'ins-copo-acrilico', quantidade: 150 }
      ],
      observacoesProposta: 'Inclui cardápio impresso personalizado em acrílico, taças de cristal e 6 horas de open bar completo.',
      criadoEm: '2026-10-28T14:30:00Z'
    },
    {
      id: 'prop-002',
      codigo: 'PROP-2026-02',
      clienteId: 'cli-002',
      nomeEvento: 'Cocktail Corporativo TechNova',
      dataEvento: '2026-12-10',
      localEvento: 'Rooftop Paulista - Av. Paulista, 1800',
      numConvidados: 100,
      duracaoHoras: 5,
      linhaInsumos: 'B',
      status: 'Em Aberto',
      escalacaoBebidas: { Vodka: 'ins-vodka-b', Gin: 'ins-gin-b', 'Cachaça': 'ins-cachaca-b' },
      estoqueBaixado: false,
      coqueteis: [
        { drinqueId: 'drk-001' },
        { drinqueId: 'drk-002' },
        { drinqueId: 'drk-004' }
      ],
      servicos: [
        { servicoId: 'srv-001', quantidade: 2, valorHora: 60.00, valorUnitario: 300.00 },
        { servicoId: 'srv-002', quantidade: 1, valorHora: 36.67, valorUnitario: 183.35 },
        { servicoId: 'srv-004', quantidade: 1, valorHora: 0, valorUnitario: 280.00 },
        { servicoId: 'srv-005', quantidade: 1, valorHora: 0, valorUnitario: 450.00 }
      ],
      ajustesInsumosCoqueteis: {},
      perifericos: [
        { insumoId: 'ins-gelo', quantidade: 80 },
        { insumoId: 'ins-canudo', quantidade: 350 },
        { insumoId: 'ins-guardanapo', quantidade: 500 }
      ],
      observacoesProposta: 'Atendimento executivo de 5 horas com estação completa e insumos Linha Padrão.',
      criadoEm: '2026-10-29T09:15:00Z'
    }
  ],

  checklists: {
    'prop-001': {
      nomeLista: 'Checklist - Casamento Juliana & Pedro - 21/11/2026',
      itensMarcados: {
        'ins-tonica': true,
        'ins-canudo': true
      },
      itensExtras: []
    }
  },

  categoriasUtensilios: [
    'Preparo & Barware',
    'Bar & Balcão',
    'Corte & Mise en Place',
    'Térmicos & Armazenamento',
    'Acessórios & Apoio',
    'Outros'
  ],

  utensiliosPadrao: [
    { id: 'ut-01', descricao: 'Coqueteleiras (Inox / Boston)', categoria: 'Preparo & Barware', quantidadeBase: 2, porBartender: true, unidade: 'un', observacoes: 'Com copo misturador inox/vidro' },
    { id: 'ut-02', descricao: 'Tapetes de Borracha (Speed Mats / Bar Mats)', categoria: 'Bar & Balcão', quantidadeBase: 2, porBartender: true, unidade: 'un', observacoes: 'Para área úmida e serviço' },
    { id: 'ut-03', descricao: 'Dosadores Duplos (Jiggers 25/50ml ou 30/60ml)', categoria: 'Preparo & Barware', quantidadeBase: 2, porBartender: true, unidade: 'un', observacoes: 'Graduação legível' },
    { id: 'ut-04', descricao: 'Maceradores de Frutas (Polietileno / Inox)', categoria: 'Preparo & Barware', quantidadeBase: 2, porBartender: true, unidade: 'un', observacoes: 'Dentes anatômicos' },
    { id: 'ut-05', descricao: 'Pinças para Guarnições e Frutas', categoria: 'Preparo & Barware', quantidadeBase: 2, porBartender: true, unidade: 'un', observacoes: 'Pinça de precisão inox' },
    { id: 'ut-06', descricao: 'Facas de Corte e Descascar', categoria: 'Corte & Mise en Place', quantidadeBase: 1, porBartender: true, unidade: 'un', observacoes: 'Fio afiado com bainha/proteção' },
    { id: 'ut-07', descricao: 'Tábuas de Corte Higiênicas (Polietileno)', categoria: 'Corte & Mise en Place', quantidadeBase: 1, porBartender: true, unidade: 'un', observacoes: 'Branca/Higienizada' },
    { id: 'ut-08', descricao: 'Caixa Térmica / Cooler para Gelo (30L a 70L)', categoria: 'Térmicos & Armazenamento', quantidadeBase: 1, porBartender: false, unidade: 'un', observacoes: 'Com dreno e higienizada' },
    { id: 'ut-09', descricao: 'Colheres Bailarinas com Tridente / Espiral', categoria: 'Preparo & Barware', quantidadeBase: 2, porBartender: true, unidade: 'un', observacoes: 'Inox 30cm' },
    { id: 'ut-10', descricao: 'Coadores Hawthorne (Strainers 4 apoios)', categoria: 'Preparo & Barware', quantidadeBase: 2, porBartender: true, unidade: 'un', observacoes: 'Mola firme' },
    { id: 'ut-11', descricao: 'Peneiras Finas Cônicas (Double Strainer)', categoria: 'Preparo & Barware', quantidadeBase: 2, porBartender: true, unidade: 'un', observacoes: 'Malha fina inox' },
    { id: 'ut-12', descricao: 'Pás de Gelo (Inox / Policarbonato)', categoria: 'Térmicos & Armazenamento', quantidadeBase: 1, porBartender: false, unidade: 'un', observacoes: 'Média/Grande com furos' },
    { id: 'ut-13', descricao: 'Biqueiras Dosadoras (Free Pourers)', categoria: 'Acessórios & Apoio', quantidadeBase: 6, porBartender: true, unidade: 'un', observacoes: 'Borrachas íntegras' },
    { id: 'ut-14', descricao: 'Abridor de Garrafas & Saca-rolhas Sommelier', categoria: 'Acessórios & Apoio', quantidadeBase: 1, porBartender: false, unidade: 'un', observacoes: '2 estágios' },
    { id: 'ut-15', descricao: 'Potes Organizadores de Frutas e Guarnições', categoria: 'Corte & Mise en Place', quantidadeBase: 3, porBartender: true, unidade: 'un', observacoes: 'Com tampa higiênica' }
  ],

  checklistsUtensilios: {}
};

window.Store = {
  state: null,

  init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.state = JSON.parse(raw);
        this.normalizarEstado();

        // Migração automática para suportar Insumos de Produção Própria (Sub-receitas) e Matérias-Primas Base
        this.migrarDadosProducaoPropria();
      } catch (e) {
        console.error('Erro ao ler LocalStorage, restaurando padrão:', e);
        this.state = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
        this.normalizarEstado();
        this.save();
      }
    } else {
      this.state = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
      this.normalizarEstado();
      this.save();
    }
    return this.state;
  },

  /**
   * Garante integridade estrutural e numérica do estado (LocalStorage e Backups JSON)
   */
  normalizarEstado() {
    if (!this.state || typeof this.state !== 'object') {
      this.state = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    }

    if (!Array.isArray(this.state.categoriasInsumos)) {
      this.state.categoriasInsumos = [...INITIAL_MOCK_DATA.categoriasInsumos];
    }
    if (!Array.isArray(this.state.categoriasServicos)) {
      this.state.categoriasServicos = [...INITIAL_MOCK_DATA.categoriasServicos];
    }
    if (!Array.isArray(this.state.categoriasUtensilios)) {
      this.state.categoriasUtensilios = [...INITIAL_MOCK_DATA.categoriasUtensilios];
    }
    if (!Array.isArray(this.state.gruposGenericos)) {
      this.state.gruposGenericos = [...INITIAL_MOCK_DATA.gruposGenericos];
    }
    if (!Array.isArray(this.state.unidadesMedida) || this.state.unidadesMedida.length === 0) {
      this.state.unidadesMedida = [...INITIAL_MOCK_DATA.unidadesMedida];
    } else {
      const unLimpa = [];
      [...INITIAL_MOCK_DATA.unidadesMedida, ...this.state.unidadesMedida].forEach((u) => {
        const txt = String(u || '').trim();
        if (txt && !unLimpa.some((x) => x.toLowerCase() === txt.toLowerCase())) {
          unLimpa.push(txt);
        }
      });
      this.state.unidadesMedida = unLimpa;
    }
    if (!Array.isArray(this.state.utensiliosPadrao)) {
      this.state.utensiliosPadrao = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA.utensiliosPadrao));
    }

    if (!Array.isArray(this.state.insumos)) this.state.insumos = [];
    if (!Array.isArray(this.state.servicos)) this.state.servicos = [];
    if (!Array.isArray(this.state.drinques)) this.state.drinques = [];
    if (!Array.isArray(this.state.clientes)) this.state.clientes = [];
    if (!Array.isArray(this.state.propostas)) this.state.propostas = [];

    if (!this.state.checklists || typeof this.state.checklists !== 'object' || Array.isArray(this.state.checklists)) {
      this.state.checklists = {};
    }
    if (
      !this.state.checklistsUtensilios ||
      typeof this.state.checklistsUtensilios !== 'object' ||
      Array.isArray(this.state.checklistsUtensilios)
    ) {
      this.state.checklistsUtensilios = {};
    }
    if (
      !this.state.margensCategorias ||
      typeof this.state.margensCategorias !== 'object' ||
      Array.isArray(this.state.margensCategorias)
    ) {
      this.state.margensCategorias = {};
    } else {
      const limpo = {};
      Object.entries(this.state.margensCategorias).forEach(([cat, val]) => {
        const n = Number(val);
        if (cat && Number.isFinite(n) && n >= 0) {
          limpo[String(cat).trim()] = Math.round(n * 100) / 100;
        }
      });
      this.state.margensCategorias = limpo;
    }

    // Sanitizar insumos
    this.state.insumos = this.state.insumos
      .filter((ins) => ins && typeof ins === 'object' && ins.id)
      .map((ins) => {
        const vol = Number(ins.volumeEmbalagem);
        const rend = Number(ins.rendimentoFinal);
        const est = Number(ins.estoqueAtual);
        const cons = Number(ins.consumoPorBartender);
        const unIns = String(ins.unidade || 'un').trim() || 'un';
        if (!this.state.unidadesMedida.some((x) => x.toLowerCase() === unIns.toLowerCase())) {
          this.state.unidadesMedida.push(unIns);
        }
        let unif = ins.unificacaoCompraChecklist;
        if (unif && typeof unif === 'object') {
          unif = {
            ativo: Boolean(unif.ativo),
            insumoBaseId: String(unif.insumoBaseId || '').trim(),
            rendimentoQtdFruta: Math.max(0.01, Number(unif.rendimentoQtdFruta) || 1),
            rendimentoUnidadeFruta: String(unif.rendimentoUnidadeFruta || 'un').trim() || 'un',
            rendimentoMlSuco: Math.max(0.1, Number(unif.rendimentoMlSuco) || 35),
            pesoMedioUnidadeG: Math.max(1, Number(unif.pesoMedioUnidadeG) || 80)
          };
        } else {
          unif = null;
        }

        const margemNum = Number(ins.margemLucro);

        return {
          ...ins,
          id: String(ins.id).trim(),
          codigo: String(ins.codigo || '').trim(),
          descricao: String(ins.descricao || 'Insumo sem nome').trim(),
          categoria: String(ins.categoria || 'Outros').trim(),
          unidade: unIns,
          volumeEmbalagem: Number.isFinite(vol) && vol > 0 ? vol : 1,
          rendimentoFinal: Number.isFinite(rend) && rend > 0 ? rend : Number.isFinite(vol) && vol > 0 ? vol : 1,
          estoqueAtual: Number.isFinite(est) && est >= 0 ? est : 0,
          margemLucro: Number.isFinite(margemNum) && margemNum >= 0 ? Math.round(margemNum * 100) / 100 : 0,
          margemIndividualPersonalizada: Boolean(ins.margemIndividualPersonalizada),
          consumoPorBartender: Number.isFinite(cons) && cons > 0 ? cons : undefined,
          fornecedores: Array.isArray(ins.fornecedores) ? ins.fornecedores : [],
          subReceita: Array.isArray(ins.subReceita) ? ins.subReceita : [],
          unificacaoCompraChecklist: unif
        };
      });

    // Auto-inferência de grupoGenerico para insumos existentes sem grupo
    this.state.insumos.forEach((ins) => {
      if (!ins.grupoGenerico || String(ins.grupoGenerico).trim() === '') {
        const inferido = this.inferirGrupoGenerico(ins.descricao, ins.categoria);
        if (inferido) {
          ins.grupoGenerico = inferido;
        }
      }
    });

    // Garante que o exemplo de 2 vodkas e 2 gins na Linha B estejam disponíveis
    if (!this.state.insumos.some((i) => i.id === 'ins-vodka-b2')) {
      const mockSkyy = INITIAL_MOCK_DATA.insumos.find((i) => i.id === 'ins-vodka-b2');
      if (mockSkyy) this.state.insumos.push(JSON.parse(JSON.stringify(mockSkyy)));
    }
    if (!this.state.insumos.some((i) => i.id === 'ins-gin-b2')) {
      const mockGordon = INITIAL_MOCK_DATA.insumos.find((i) => i.id === 'ins-gin-b2');
      if (mockGordon) this.state.insumos.push(JSON.parse(JSON.stringify(mockGordon)));
    }

    // Garante que cada grupo genérico de cada linha possua exatamente uma bebida escalada
    const gruposLinhasEscalados = new Set();
    this.state.insumos.forEach((ins) => {
      const g = ins.grupoGenerico || this.inferirGrupoGenerico(ins.descricao, ins.categoria);
      if (g && ins.linha && !ins.semLinha) {
        const chave = `${g.toLowerCase()}_${ins.linha}`;
        if (!gruposLinhasEscalados.has(chave)) {
          const itensGrupoLinha = this.state.insumos.filter(
            (i) => {
              const gi = i.grupoGenerico || this.inferirGrupoGenerico(i.descricao, i.categoria);
              return gi && gi.toLowerCase() === g.toLowerCase() && i.linha === ins.linha && !i.semLinha;
            }
          );
          const temEscalado = itensGrupoLinha.some((i) => i.escalado === true);
          if (!temEscalado && itensGrupoLinha.length > 0) {
            itensGrupoLinha[0].escalado = true;
          }
          gruposLinhasEscalados.add(chave);
        }
      }
    });

    // Auto-vínculo inteligente para Suco de Limão -> Limão (se ambos existirem e ainda não vinculados)
    const insumoFrutaLimao = this.state.insumos.find((i) => {
      const d = (i.descricao || '').toLowerCase();
      return (d.includes('limão') || d.includes('limao')) && !d.includes('suco');
    });
    if (insumoFrutaLimao) {
      this.state.insumos.forEach((i) => {
        const d = (i.descricao || '').toLowerCase();
        if (d.includes('suco') && (d.includes('limão') || d.includes('limao'))) {
          if (!i.unificacaoCompraChecklist || !i.unificacaoCompraChecklist.insumoBaseId) {
            i.unificacaoCompraChecklist = {
              ativo: true,
              insumoBaseId: insumoFrutaLimao.id,
              rendimentoQtdFruta: 1,
              rendimentoUnidadeFruta: 'un',
              rendimentoMlSuco: 35,
              pesoMedioUnidadeG: 80
            };
          }
        }
      });
    }

    this.desduplicarCodigosInsumos();

    // Sanitizar serviços
    this.state.servicos = this.state.servicos
      .filter((s) => s && typeof s === 'object' && s.id)
      .map((s) => {
        const val = Number(s.valorUnitario);
        const regra = Number(s.convidadosPorUnidade);
        const vHoraRaw = s.valorHora;
        const vHoraNum = Number(vHoraRaw);
        let valorHora = 0;
        if (vHoraRaw !== undefined && vHoraRaw !== null && vHoraRaw !== '' && Number.isFinite(vHoraNum) && vHoraNum >= 0) {
          valorHora = vHoraNum;
        } else if (String(s.categoria || '').trim() === 'Mão de Obra' && Number.isFinite(val) && val > 0) {
          valorHora = Math.round((val / 6) * 100) / 100;
        }
        return {
          ...s,
          descricao: String(s.descricao || 'Serviço').trim(),
          categoria: String(s.categoria || 'Mão de Obra').trim(),
          valorHora,
          valorUnitario: Number.isFinite(val) && val >= 0 ? val : 0,
          convidadosPorUnidade: Number.isFinite(regra) && regra >= 0 ? regra : 0
        };
      });

    // Sanitizar drinques
    this.state.drinques = this.state.drinques
      .filter((d) => d && typeof d === 'object' && d.id)
      .map((d) => ({
        ...d,
        nome: String(d.nome || 'Drinque').trim(),
        perfilSensorial: Array.isArray(d.perfilSensorial) ? d.perfilSensorial : [],
        ingredientes: Array.isArray(d.ingredientes) ? d.ingredientes : []
      }));

    // Sanitizar clientes
    this.state.clientes = this.state.clientes
      .filter((c) => c && typeof c === 'object' && c.id)
      .map((c) => ({
        ...c,
        nome: String(c.nome || 'Cliente').trim()
      }));

    // Sanitizar propostas e remover referências órfãs
    const insumoIds = new Set(this.state.insumos.map((i) => i.id));
    const servicoIds = new Set(this.state.servicos.map((s) => s.id));
    const drinqueIds = new Set(this.state.drinques.map((d) => d.id));
    const clienteIds = new Set(this.state.clientes.map((c) => c.id));

    this.state.propostas = this.state.propostas
      .filter((p) => p && typeof p === 'object' && p.id)
      .map((p) => {
        const conv = Number(p.numConvidados);
        const dur = Number(p.duracaoHoras);
        const bart = Number(p.qtdBartenders);
        let bartResolvido = Number.isFinite(bart) && bart >= 1 ? Math.round(bart) : 0;
        if (bartResolvido <= 0 && Array.isArray(p.servicos)) {
          const srvBart = p.servicos.find((s) => {
            const ref = this.state.servicos.find((x) => x.id === s?.servicoId);
            return ref && /bartender/i.test(ref.descricao || '');
          });
          if (srvBart && Number(srvBart.quantidade) >= 1) {
            bartResolvido = Math.round(Number(srvBart.quantidade));
          }
        }
        if (bartResolvido <= 0) bartResolvido = 2;

        return {
          ...p,
          clienteId: p.clienteId && clienteIds.has(p.clienteId) ? p.clienteId : '',
          numConvidados: Number.isFinite(conv) && conv >= 1 ? Math.round(conv) : 100,
          duracaoHoras: Number.isFinite(dur) && dur >= 0.5 ? dur : 5,
          qtdBartenders: bartResolvido,
          linhaInsumos: ['A', 'B', 'C'].includes(p.linhaInsumos) ? p.linhaInsumos : 'A',
          coqueteis: Array.isArray(p.coqueteis)
            ? p.coqueteis.filter((c) => c && drinqueIds.has(c.drinqueId))
            : [],
          perifericos: Array.isArray(p.perifericos)
            ? p.perifericos
                .filter((per) => per && insumoIds.has(per.insumoId))
                .map((per) => ({
                  ...per,
                  quantidade: Math.max(0, Number.isFinite(Number(per.quantidade)) ? Number(per.quantidade) : 0)
                }))
            : [],
          servicos: Array.isArray(p.servicos)
            ? p.servicos
                .filter((srv) => srv && servicoIds.has(srv.servicoId))
                .map((srv) => {
                  const srvRef = this.state.servicos.find((x) => x.id === srv.servicoId);
                  const vHoraRaw = srv.valorHora;
                  const vHoraNum = Number(vHoraRaw);
                  let valorHora = undefined;
                  if (vHoraRaw !== undefined && vHoraRaw !== null && vHoraRaw !== '' && Number.isFinite(vHoraNum) && vHoraNum >= 0) {
                    valorHora = vHoraNum;
                  } else if (srvRef && Number(srvRef.valorHora) > 0) {
                    valorHora = Number(srvRef.valorHora);
                  }
                  return {
                    ...srv,
                    quantidade: Math.max(0, Number.isFinite(Number(srv.quantidade)) ? Number(srv.quantidade) : 0),
                    valorHora,
                    valorUnitario:
                      srv.valorUnitario !== undefined &&
                      srv.valorUnitario !== null &&
                      srv.valorUnitario !== '' &&
                      Number.isFinite(Number(srv.valorUnitario))
                        ? Math.max(0, Number(srv.valorUnitario))
                        : undefined
                  };
                })
            : [],
          ajustesInsumosCoqueteis:
            p.ajustesInsumosCoqueteis && typeof p.ajustesInsumosCoqueteis === 'object'
              ? p.ajustesInsumosCoqueteis
              : {},
          fatoresConsumoPersonalizados:
            p.fatoresConsumoPersonalizados && typeof p.fatoresConsumoPersonalizados === 'object'
              ? p.fatoresConsumoPersonalizados
              : {},
          escalacaoBebidas:
            p.escalacaoBebidas && typeof p.escalacaoBebidas === 'object'
              ? JSON.parse(JSON.stringify(p.escalacaoBebidas))
              : {},
          versoesNegociacao: Array.isArray(p.versoesNegociacao) ? p.versoesNegociacao : [],
          versaoAtivaId: p.versaoAtivaId ? String(p.versaoAtivaId) : ''
        };
      });

    // Garantir que propostas salvas no histórico mantenham fixadas as bebidas que estavam titulares na época
    this.state.propostas.forEach((prop) => {
      if (!prop.escalacaoBebidas || typeof prop.escalacaoBebidas !== 'object') {
        prop.escalacaoBebidas = {};
      }

      const linhaProp = ['A', 'B', 'C'].includes(prop.linhaInsumos) ? prop.linhaInsumos : 'A';
      const gruposUsados = this.getGruposBebidasDosCoqueteis(prop);

      gruposUsados.forEach((grupo) => {
        // Se a proposta já possui uma marca registrada (congelada ou personalizada):
        // Se ela pertencer a outra linha diferente da proposta (ex: proposta duplicada que mudou de linha),
        // remove para sincronizar com os titulares da linha atual
        const idExistente = prop.escalacaoBebidas[grupo];
        if (idExistente) {
          const insExistente = (this.state.insumos || []).find((i) => i.id === idExistente);
          if (insExistente && !insExistente.semLinha && insExistente.linha !== linhaProp) {
            delete prop.escalacaoBebidas[grupo];
          }
        }

        if (prop.escalacaoBebidas[grupo]) return;

        // Se for Vodka:
        // Mantém rigorosamente a vodka que era titular histórica na linha da proposta:
        // Linha A -> ins-vodka-a (Vodka Absolut)
        // Linha B -> ins-vodka-b (Vodka Smirnoff Red)
        // Linha C -> ins-vodka-c (Vodka Orloff / Kadov)
        if (grupo.toLowerCase() === 'vodka') {
          const vodkaHistorica =
            linhaProp === 'B'
              ? 'ins-vodka-b'
              : linhaProp === 'C'
              ? 'ins-vodka-c'
              : 'ins-vodka-a';
          const existe = (this.state.insumos || []).some((i) => i.id === vodkaHistorica);
          if (existe) {
            prop.escalacaoBebidas['Vodka'] = vodkaHistorica;
            return;
          }
        }

        // Para os demais grupos (Gin, Rum, Cachaça etc.): congela a marca titular da linha
        const resolvido = this.resolverInsumoPorLinha({ grupoGenerico: grupo }, linhaProp, prop.escalacaoBebidas);
        if (resolvido && resolvido.id) {
          prop.escalacaoBebidas[grupo] = resolvido.id;
        }
      });

      this.garantirHistoricoVersoesProposta(prop);
    });

    // Sanitizar categorias de utensílios
    const catsLimpa = [];
    (this.state.categoriasUtensilios || []).forEach((c) => {
      const nome = String(c || '').trim();
      if (nome && !catsLimpa.some((x) => x.toLowerCase() === nome.toLowerCase())) {
        catsLimpa.push(nome);
      }
    });
    if (catsLimpa.length === 0) {
      catsLimpa.push(...INITIAL_MOCK_DATA.categoriasUtensilios);
    }
    this.state.categoriasUtensilios = catsLimpa;

    // Sanitizar Ambiente Global de Utensílios (utensiliosPadrao)
    this.state.utensiliosPadrao = (this.state.utensiliosPadrao || [])
      .filter((ut) => ut && typeof ut === 'object')
      .map((ut, idx) => {
        const qtdBase = Math.max(1, Math.round(Number(ut.quantidadeBase ?? ut.quantidade) || 1));
        const porBart = Boolean(ut.temFator !== undefined ? ut.temFator : ut.porBartender);
        const fatorBartender = porBart ? Math.max(1, Math.round(Number(ut.fatorBartender || ut.quantidadeBase || 1))) : 0;
        const tenhoRaw = Number(ut.qtdTenho);
        const qtdTenho =
          ut.qtdTenho !== undefined &&
          ut.qtdTenho !== null &&
          ut.qtdTenho !== '' &&
          Number.isFinite(tenhoRaw) &&
          tenhoRaw >= 0
            ? Math.round(tenhoRaw)
            : porBart
              ? (fatorBartender || qtdBase) * 3
              : qtdBase;
        const cat = String(ut.categoria || 'Outros').trim() || 'Outros';
        if (!this.state.categoriasUtensilios.some((c) => c.toLowerCase() === cat.toLowerCase())) {
          this.state.categoriasUtensilios.push(cat);
        }
        return {
          ...ut,
          id: String(ut.id || `ut-global-${idx + 1}`),
          descricao: String(ut.descricao || 'Utensílio').trim(),
          categoria: cat,
          unidade: String(ut.unidade || 'un').trim() || 'un',
          quantidadeBase: qtdBase,
          temFator: porBart,
          porBartender: porBart,
          fatorBartender,
          qtdTenho,
          pendente: Boolean(ut.pendente),
          observacoes: String(ut.observacoes || '')
        };
      });

    // Sanitizar Checklists de Utensílios das Propostas
    Object.keys(this.state.checklistsUtensilios).forEach((propId) => {
      const chk = this.state.checklistsUtensilios[propId];
      if (!chk || typeof chk !== 'object') {
        delete this.state.checklistsUtensilios[propId];
        return;
      }
      const idsVistos = new Set();
      chk.itens = Array.isArray(chk.itens)
        ? chk.itens
            .filter((it) => it && typeof it === 'object')
            .map((it, idx) => {
              const qtd = Math.max(1, Math.round(Number(it.quantidade) || 1));
              const temFator = Boolean(it.temFator !== undefined ? it.temFator : it.porBartender);
              let fatorBartender = Number(it.fatorBartender);
              if (!Number.isFinite(fatorBartender) || fatorBartender <= 0) {
                if (it.utensilioGlobalId) {
                  const gRef = (this.state.utensiliosPadrao || []).find((g) => g.id === it.utensilioGlobalId);
                  if (gRef) {
                    fatorBartender = Number(gRef.fatorBartender || gRef.quantidadeBase) || 1;
                  }
                }
              }
              if (!Number.isFinite(fatorBartender) || fatorBartender <= 0) {
                fatorBartender = temFator ? 1 : 0;
              }
              const tenhoRaw = Number(it.qtdTenho);
              const qtdTenho =
                it.qtdTenho !== undefined &&
                it.qtdTenho !== null &&
                it.qtdTenho !== '' &&
                Number.isFinite(tenhoRaw) &&
                tenhoRaw >= 0
                  ? Math.round(tenhoRaw)
                  : qtd;
              const cat = String(it.categoria || 'Outros').trim() || 'Outros';
              if (!this.state.categoriasUtensilios.some((c) => c.toLowerCase() === cat.toLowerCase())) {
                this.state.categoriasUtensilios.push(cat);
              }
              let idUnico = String(it.id || `ut-ev-${propId}-${idx + 1}`);
              if (idsVistos.has(idUnico)) {
                idUnico = `${idUnico}-${idx + 1}`;
              }
              idsVistos.add(idUnico);
              return {
                ...it,
                id: idUnico,
                descricao: String(it.descricao || 'Utensílio').trim(),
                categoria: cat,
                unidade: String(it.unidade || 'un').trim() || 'un',
                quantidade: qtd,
                qtdTenho,
                qtdTenhoManual: Boolean(it.qtdTenhoManual),
                temFator,
                porBartender: temFator,
                fatorBartender: temFator ? Math.max(1, Math.round(fatorBartender)) : 0,
                pendente: Boolean(it.pendente),
                conferidoIda: Boolean(it.conferidoIda),
                conferidoVolta: Boolean(it.conferidoVolta),
                observacoes: String(it.observacoes || ''),
                utensilioGlobalId: it.utensilioGlobalId ? String(it.utensilioGlobalId) : ''
              };
            })
        : [];
      chk.limpoManualmente = Boolean(chk.limpoManualmente);
      chk.inicializado = Boolean(chk.inicializado || chk.limpoManualmente || chk.itens.length > 0);
    });
  },

  migrarDadosProducaoPropria() {
    let alterou = false;
    const novasCategorias = ['Xaropes & Sub-receitas', 'Matérias-Primas & Mercearia'];
    novasCategorias.forEach((cat) => {
      if (!this.state.categoriasInsumos.includes(cat)) {
        this.state.categoriasInsumos.push(cat);
        alterou = true;
      }
    });

    // Garantir que as matérias-primas base de demonstração existam sem colisão de código
    const idsMateriasPrimas = ['ins-mat-acucar', 'ins-mat-gengibre', 'ins-mat-agua', 'ins-mat-emulsificante'];
    idsMateriasPrimas.forEach((idMat) => {
      if (!this.state.insumos.some((i) => String(i.id) === idMat)) {
        const mockItem = INITIAL_MOCK_DATA.insumos.find((i) => i.id === idMat);
        if (mockItem) {
          const itemParaInserir = JSON.parse(JSON.stringify(mockItem));
          const codigoJaUsado = this.state.insumos.some(
            (i) => String(i.codigo || '').trim().toLowerCase() === String(itemParaInserir.codigo || '').trim().toLowerCase()
          );
          if (codigoJaUsado) {
            itemParaInserir.codigo = this.gerarProximoSkuInsumo();
          }
          this.state.insumos.push(itemParaInserir);
          alterou = true;
        }
      }
    });

    // Atualizar os 3 insumos de xarope/espuma de exemplo para Produção Própria caso ainda não tenham subReceita
    const idsSubReceitasDemo = ['ins-xarope-acucar', 'ins-xarope-gengibre', 'ins-espuma-gengibre'];
    idsSubReceitasDemo.forEach((idSub) => {
      const existente = this.state.insumos.find((i) => i.id === idSub);
      const mockSub = INITIAL_MOCK_DATA.insumos.find((i) => i.id === idSub);
      if (existente && mockSub && existentesSemSubReceita(existente)) {
        existente.producaoPropria = true;
        existente.rendimentoFinal = mockSub.rendimentoFinal;
        existente.volumeEmbalagem = mockSub.rendimentoFinal;
        existente.categoria = mockSub.categoria;
        existente.descricao = mockSub.descricao;
        existente.subReceita = JSON.parse(JSON.stringify(mockSub.subReceita));
        alterou = true;
      }
    });

    // Garantir campos default em todos os insumos
    this.state.insumos.forEach((ins) => {
      if (ins.producaoPropria === undefined) {
        ins.producaoPropria = false;
        ins.rendimentoFinal = ins.volumeEmbalagem || 1;
        ins.subReceita = [];
        alterou = true;
      }
      if (ins.consumoPorBartender === undefined || ins.consumoPorBartender === null || ins.consumoPorBartender <= 0) {
        ins.consumoPorBartender = this.getFatorConsumoPadrao(ins);
        alterou = true;
      }
    });

    // Atualiza propostas salvas para o padrão de gelo por bartender (3 bar x 30kg = 90kg)
    (this.state.propostas || []).forEach((prop) => {
      if (prop.perifericos) {
        prop.perifericos.forEach((p) => {
          if (p.insumoId === 'ins-gelo' && p.quantidade === 120) {
            p.quantidade = 90;
            alterou = true;
          }
        });
      }
    });

    if (alterou) {
      this.save();
    }

    this.desduplicarCodigosInsumos();

    function existentesSemSubReceita(item) {
      return !item.producaoPropria || !Array.isArray(item.subReceita) || item.subReceita.length === 0;
    }
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      window.dispatchEvent(new CustomEvent('store-updated'));
      return true;
    } catch (e) {
      console.error('Erro ao salvar estado no LocalStorage:', e);
      if (window.App && typeof window.App.mostrarToast === 'function') {
        window.App.mostrarToast(
          'Limite de armazenamento local atingido! Exporte um Backup JSON ou remova fotos grandes.',
          'error'
        );
      }
      return false;
    }
  },

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    this.normalizarEstado();
    this.save();
  },

  getDefaultDrinkSvg() {
    return DEFAULT_DRINK_SVG;
  },

  formatCurrency(val) {
    const num = Number(val);
    const seguro = Number.isFinite(num) ? num : 0;
    return seguro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  aplicarMargemPorCategoria(categoriaAlvo, novaMargemPct, preservarIndividuais = true) {
    const margemLimpa = Math.max(0, Math.round((Number(novaMargemPct) || 0) * 100) / 100);
    if (!this.state.margensCategorias || typeof this.state.margensCategorias !== 'object') {
      this.state.margensCategorias = {};
    }

    let atualizados = 0;
    let preservados = 0;

    if (categoriaAlvo === 'TODAS') {
      (this.state.categoriasInsumos || []).forEach((cat) => {
        this.state.margensCategorias[cat] = margemLimpa;
      });
    } else if (categoriaAlvo) {
      this.state.margensCategorias[categoriaAlvo] = margemLimpa;
    }

    (this.state.insumos || []).forEach((ins) => {
      if (categoriaAlvo !== 'TODAS' && ins.categoria !== categoriaAlvo) return;
      if (preservarIndividuais && ins.margemIndividualPersonalizada) {
        preservados++;
        return;
      }
      ins.margemLucro = margemLimpa;
      ins.margemIndividualPersonalizada = false;
      atualizados++;
    });

    this.save();
    return { atualizados, preservados, margemLimpa };
  },

  extrairSnapshotProposta(p) {
    if (!p) return null;
    return JSON.parse(
      JSON.stringify({
        nomeEvento: p.nomeEvento || '',
        dataEvento: p.dataEvento || '',
        localEvento: p.localEvento || '',
        numConvidados: Number(p.numConvidados) || 100,
        duracaoHoras: Number(p.duracaoHoras) || 6,
        linhaInsumos: p.linhaInsumos || 'A',
        escalacaoBebidas: p.escalacaoBebidas || {},
        qtdBartenders: Number(p.qtdBartenders) || 2,
        fatoresConsumoPersonalizados: p.fatoresConsumoPersonalizados || {},
        coqueteis: p.coqueteis || [],
        servicos: p.servicos || [],
        ajustesInsumosCoqueteis: p.ajustesInsumosCoqueteis || {},
        perifericos: p.perifericos || [],
        observacoesProposta: p.observacoesProposta || ''
      })
    );
  },

  gerarRotuloResumoVersao(p, numeroVersao) {
    const linha = p.linhaInsumos || 'A';
    const conv = Number(p.numConvidados) || 100;
    const horas = Number(p.duracaoHoras) || 6;
    return `v${numeroVersao} • Linha ${linha} (${conv} conv. / ${horas}h)`;
  },

  garantirHistoricoVersoesProposta(p) {
    if (!p) return;
    if (!Array.isArray(p.versoesNegociacao)) {
      p.versoesNegociacao = [];
    }
    if (p.versoesNegociacao.length === 0) {
      const consolidado = this.consolidarProposta(p);
      const vId = 'ver-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      p.versoesNegociacao.push({
        versaoId: vId,
        numero: 1,
        rotulo: this.gerarRotuloResumoVersao(p, 1),
        nota: 'Proposta Inicial (v1)',
        criadoEm: p.criadoEm || new Date().toISOString(),
        valorTotalSnapshot: consolidado.custoTotalEvento,
        dados: this.extrairSnapshotProposta(p)
      });
      p.versaoAtivaId = vId;
    } else if (!p.versaoAtivaId || !p.versoesNegociacao.some((v) => v.versaoId === p.versaoAtivaId)) {
      p.versaoAtivaId = p.versoesNegociacao[p.versoesNegociacao.length - 1].versaoId;
    }
  },

  aplicarSnapshotEmProposta(propostaAlvo, snapshotDados, versaoId = null) {
    if (!propostaAlvo || !snapshotDados) return;
    const snap = JSON.parse(JSON.stringify(snapshotDados));
    propostaAlvo.nomeEvento = snap.nomeEvento ?? propostaAlvo.nomeEvento;
    propostaAlvo.dataEvento = snap.dataEvento ?? propostaAlvo.dataEvento;
    propostaAlvo.localEvento = snap.localEvento ?? propostaAlvo.localEvento;
    propostaAlvo.numConvidados = Number(snap.numConvidados) || 100;
    propostaAlvo.duracaoHoras = Number(snap.duracaoHoras) || 6;
    propostaAlvo.linhaInsumos = snap.linhaInsumos || 'A';
    propostaAlvo.escalacaoBebidas = snap.escalacaoBebidas || {};
    propostaAlvo.qtdBartenders = Number(snap.qtdBartenders) || 2;
    propostaAlvo.fatoresConsumoPersonalizados = snap.fatoresConsumoPersonalizados || {};
    propostaAlvo.coqueteis = Array.isArray(snap.coqueteis) ? snap.coqueteis : [];
    propostaAlvo.servicos = Array.isArray(snap.servicos) ? snap.servicos : [];
    propostaAlvo.ajustesInsumosCoqueteis = snap.ajustesInsumosCoqueteis || {};
    propostaAlvo.perifericos = Array.isArray(snap.perifericos) ? snap.perifericos : [];
    if (snap.observacoesProposta !== undefined) {
      propostaAlvo.observacoesProposta = snap.observacoesProposta;
    }
    if (versaoId) {
      propostaAlvo.versaoAtivaId = versaoId;
    }
  },

  unificarPropostasEmVersoes(propostaBaseId, idsSecundarias = []) {
    const base = (this.state.propostas || []).find((p) => p.id === propostaBaseId);
    if (!base) return false;
    this.garantirHistoricoVersoesProposta(base);

    const secundarias = (this.state.propostas || []).filter(
      (p) => idsSecundarias.includes(p.id) && p.id !== propostaBaseId
    );
    if (secundarias.length === 0) return false;

    secundarias.forEach((sec) => {
      const versoesSec = Array.isArray(sec.versoesNegociacao) && sec.versoesNegociacao.length > 0
        ? sec.versoesNegociacao
        : [
            {
              versaoId: 'ver-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              numero: 1,
              rotulo: this.gerarRotuloResumoVersao(sec, 1),
              nota: sec.nomeEvento || 'Opção Mesclada',
              criadoEm: sec.criadoEm || new Date().toISOString(),
              valorTotalSnapshot: this.consolidarProposta(sec).custoTotalEvento,
              dados: this.extrairSnapshotProposta(sec)
            }
          ];

      versoesSec.forEach((v) => {
        const novoNum = base.versoesNegociacao.length + 1;
        const novoId = 'ver-' + Date.now() + '-' + novoNum + '-' + Math.floor(Math.random() * 1000);
        base.versoesNegociacao.push({
          ...JSON.parse(JSON.stringify(v)),
          versaoId: novoId,
          numero: novoNum,
          rotulo: this.gerarRotuloResumoVersao(v.dados || sec, novoNum),
          nota: v.nota || sec.nomeEvento || `Versão ${novoNum}`
        });
      });

      // Remove a proposta secundária duplicada
      this.excluirPropostaComIntegridade(sec.id);
    });

    // Ativa a última versão adicionada ou mantém a atual
    const ultimaVersao = base.versoesNegociacao[base.versoesNegociacao.length - 1];
    if (ultimaVersao && ultimaVersao.dados) {
      this.aplicarSnapshotEmProposta(base, ultimaVersao.dados, ultimaVersao.versaoId);
    }

    this.save();
    return { ok: true, proposta: base, totalVersoes: base.versoesNegociacao.length };
  },

  gerarId(prefixo = 'id') {
    return `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  },

  formatNumber(val, decimals = 0) {
    const num = Number(val);
    const seguro = Number.isFinite(num) ? num : 0;
    return seguro.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  gerarProximoSkuInsumo(codigosExtras = null) {
    const insumos = this.state.insumos || [];
    const codigosExistentes = new Set(insumos.map((i) => String(i.codigo || '').trim().toUpperCase()));
    if (codigosExtras && typeof codigosExtras.forEach === 'function') {
      codigosExtras.forEach((c) => codigosExistentes.add(String(c || '').trim().toUpperCase()));
    }
    let maxNum = insumos.length;

    insumos.forEach((i) => {
      const m = String(i.codigo || '').match(/INS-(\d+)/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n) && n > maxNum) maxNum = n;
      }
    });

    let proximo = Math.max(1, maxNum + 1);
    let candidato = `INS-${String(proximo).padStart(3, '0')}`;
    while (codigosExistentes.has(candidato.toUpperCase())) {
      proximo++;
      candidato = `INS-${String(proximo).padStart(3, '0')}`;
    }
    return candidato;
  },

  desduplicarCodigosInsumos() {
    let alterou = false;
    const codigosVistos = new Map(); // CODIGO_UPPER -> insumoId
    const insumos = this.state.insumos || [];

    insumos.forEach((ins) => {
      if (!ins || typeof ins !== 'object') return;
      ins.id = String(ins.id || `ins-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
      let cod = String(ins.codigo || '').trim();
      const codUpper = cod.toUpperCase();
      if (!cod || codUpper === 'EXTRA' || codigosVistos.has(codUpper)) {
        const novoSku = this.gerarProximoSkuInsumo(new Set(codigosVistos.keys()));
        ins.codigo = novoSku;
        codigosVistos.set(novoSku.toUpperCase(), ins.id);
        alterou = true;
      } else {
        ins.codigo = cod;
        codigosVistos.set(codUpper, ins.id);
      }
    });

    if (alterou) {
      this.save();
    }
    return alterou;
  },

  gerarProximoCodigoProposta() {
    const year = new Date().getFullYear();
    const propostas = this.state.propostas || [];
    const codigosExistentes = new Set(propostas.map((p) => String(p.codigo || '').toUpperCase()));
    let maxNum = propostas.length;

    const regex = new RegExp(`PROP-${year}-(\\d+)`, 'i');
    propostas.forEach((p) => {
      const m = String(p.codigo || '').match(regex);
      if (m) {
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n) && n > maxNum) maxNum = n;
      }
    });

    let proximo = maxNum + 1;
    let candidato = `PROP-${year}-${String(proximo).padStart(2, '0')}`;
    while (codigosExistentes.has(candidato.toUpperCase())) {
      proximo++;
      candidato = `PROP-${year}-${String(proximo).padStart(2, '0')}`;
    }
    return candidato;
  },

  /**
   * Verifica recursivamente se o insumo `origemId` utiliza `alvoId` em sua cadeia de sub-receitas.
   * Usado para impedir ciclos diretos e indiretos (ex: A -> B -> A).
   */
  insumoDependeDe(origemId, alvoId, visitados = new Set()) {
    if (!origemId || !alvoId) return false;
    if (origemId === alvoId) return true;
    if (visitados.has(origemId)) return false;

    const insumo = (this.state.insumos || []).find((i) => i.id === origemId);
    if (!insumo || !insumo.producaoPropria || !Array.isArray(insumo.subReceita)) return false;

    const proxVisitados = new Set(visitados);
    proxVisitados.add(origemId);

    return insumo.subReceita.some((comp) => this.insumoDependeDe(comp.insumoBaseId, alvoId, proxVisitados));
  },

  /**
   * Valida se uma lista candidata de componentes de sub-receita criaria ciclo para `insumoId`.
   */
  subReceitaCriaCiclo(insumoId, subReceitaLista) {
    if (!insumoId || !Array.isArray(subReceitaLista)) return false;
    return subReceitaLista.some((comp) => {
      if (!comp || !comp.insumoBaseId) return false;
      if (comp.insumoBaseId === insumoId) return true;
      return this.insumoDependeDe(comp.insumoBaseId, insumoId);
    });
  },

  /**
   * Retorna o fator de consumo padrão por bartender em um turno base de 5 horas.
   * Ex: 4.000 ml para destilados (Vodka, Gin), 1.500 ml para espumas/xaropes, 30 kg para gelo.
   */
  getFatorConsumoPadrao(insumo) {
    if (!insumo) return 2000;
    const fatorSalvo = Number(insumo.consumoPorBartender);
    if (Number.isFinite(fatorSalvo) && fatorSalvo > 0) {
      return fatorSalvo;
    }
    const desc = (insumo.descricao || '').toLowerCase();
    const cat = (insumo.categoria || '').toLowerCase();
    const un = (insumo.unidade || '').toLowerCase();

    if (
      desc.includes('vodka') ||
      desc.includes('gin') ||
      desc.includes('rum') ||
      desc.includes('cachaça') ||
      desc.includes('cachaca') ||
      desc.includes('whisky')
    ) {
      return 4000; // 4L por bartender em 5h
    }
    if (desc.includes('espuma')) {
      return 1500; // 1.5L por bartender em 5h
    }
    if (desc.includes('xarope')) {
      return 1500; // 1.5L por bartender em 5h
    }
    if (desc.includes('limão') || desc.includes('limao') || desc.includes('suco')) {
      return 2000; // 2L por bartender em 5h
    }
    if (
      desc.includes('tônica') ||
      desc.includes('tonica') ||
      desc.includes('refrigerante') ||
      desc.includes('mixer')
    ) {
      return 5000; // 5L por bartender
    }
    if (desc.includes('água') || desc.includes('agua')) {
      return 4000;
    }
    if (desc.includes('gelo') || cat.includes('gelo') || un === 'kg') {
      return 30; // 30kg de gelo por bartender
    }
    if (desc.includes('canudo') || un === 'un') {
      return 150;
    }
    if (desc.includes('guardanapo')) {
      return 250;
    }
    if (desc.includes('copo')) {
      return 150;
    }
    if (un === 'g' || un === 'kg') {
      return un === 'kg' ? 2 : 2000;
    }
    return 2000;
  },

  /**
   * Calcula a conversão de um insumo de suco/derivado para sua fruta base de compra
   * Ex: 4.000 ml de Suco de Limão -> quantos kg/g/un de Limão taiti são necessários
   */
  calcularConversaoFrutaSuco(insumoSuco, qtdMlSuco, insumoFruta = null) {
    if (!insumoSuco || !insumoSuco.unificacaoCompraChecklist || !insumoSuco.unificacaoCompraChecklist.ativo) {
      return null;
    }
    const cfg = insumoSuco.unificacaoCompraChecklist;
    const fruta = insumoFruta || (this.state.insumos || []).find((i) => i.id === cfg.insumoBaseId);
    if (!fruta) return null;

    const mlTotal = Math.max(0, Number(qtdMlSuco) || 0);
    const mlPorRendimento = Math.max(0.1, Number(cfg.rendimentoMlSuco) || 35);
    const qtdFrutaBaseRendimento = Math.max(0.01, Number(cfg.rendimentoQtdFruta) || 1);
    const unRendimento = String(cfg.rendimentoUnidadeFruta || 'un').toLowerCase();
    const pesoMedioG = Math.max(1, Number(cfg.pesoMedioUnidadeG) || 80);
    const unFruta = String(fruta.unidade || 'g').toLowerCase();

    // Quantas vezes o bloco de rendimento é necessário para suprir o volume de suco
    const vezesRendimento = mlTotal / mlPorRendimento;
    const qtdFrutasNominal = vezesRendimento * qtdFrutaBaseRendimento;

    let qtdFrutaNecessariaNaUnidadeFruta = 0;

    if (unRendimento === 'un') {
      const numFrutas = qtdFrutasNominal;
      if (unFruta === 'un') {
        qtdFrutaNecessariaNaUnidadeFruta = Math.ceil(numFrutas);
      } else if (unFruta === 'g') {
        qtdFrutaNecessariaNaUnidadeFruta = Math.round(numFrutas * pesoMedioG);
      } else if (unFruta === 'kg') {
        qtdFrutaNecessariaNaUnidadeFruta = Math.round(((numFrutas * pesoMedioG) / 1000) * 100) / 100;
      } else {
        qtdFrutaNecessariaNaUnidadeFruta = Math.round(numFrutas * pesoMedioG);
      }
    } else if (unRendimento === 'kg') {
      const kgFruta = qtdFrutasNominal;
      if (unFruta === 'kg') {
        qtdFrutaNecessariaNaUnidadeFruta = Math.round(kgFruta * 100) / 100;
      } else if (unFruta === 'g') {
        qtdFrutaNecessariaNaUnidadeFruta = Math.round(kgFruta * 1000);
      } else if (unFruta === 'un') {
        qtdFrutaNecessariaNaUnidadeFruta = Math.ceil((kgFruta * 1000) / pesoMedioG);
      } else {
        qtdFrutaNecessariaNaUnidadeFruta = Math.round(kgFruta * 100) / 100;
      }
    } else if (unRendimento === 'g') {
      const gFruta = qtdFrutasNominal;
      if (unFruta === 'g') {
        qtdFrutaNecessariaNaUnidadeFruta = Math.round(gFruta);
      } else if (unFruta === 'kg') {
        qtdFrutaNecessariaNaUnidadeFruta = Math.round((gFruta / 1000) * 100) / 100;
      } else if (unFruta === 'un') {
        qtdFrutaNecessariaNaUnidadeFruta = Math.ceil(gFruta / pesoMedioG);
      } else {
        qtdFrutaNecessariaNaUnidadeFruta = Math.round(gFruta);
      }
    }

    const numLimõesAprox =
      unRendimento === 'un'
        ? Math.ceil(qtdFrutasNominal)
        : unFruta === 'g'
        ? Math.ceil(qtdFrutaNecessariaNaUnidadeFruta / pesoMedioG)
        : unFruta === 'kg'
        ? Math.ceil((qtdFrutaNecessariaNaUnidadeFruta * 1000) / pesoMedioG)
        : Math.ceil(qtdFrutaNecessariaNaUnidadeFruta);

    const textoResumoRegra =
      unRendimento === 'un'
        ? `${cfg.rendimentoQtdFruta} un = ${cfg.rendimentoMlSuco} ml (${pesoMedioG}g/limão)`
        : `${cfg.rendimentoQtdFruta} ${cfg.rendimentoUnidadeFruta} = ${cfg.rendimentoMlSuco} ml`;

    return {
      insumoFruta: fruta,
      qtdFrutaNecessaria: qtdFrutaNecessariaNaUnidadeFruta,
      unidadeFruta: fruta.unidade,
      numLimõesAprox,
      textoResumoRegra,
      cfg
    };
  },

  salvarRendimentoFrutaSuco(sucoId, dadosConfig) {
    const suco = (this.state.insumos || []).find((i) => i.id === sucoId);
    if (!suco) return false;
    suco.unificacaoCompraChecklist = {
      ativo: Boolean(dadosConfig.ativo !== false),
      insumoBaseId: String(dadosConfig.insumoBaseId || '').trim(),
      rendimentoQtdFruta: Math.max(0.01, Number(dadosConfig.rendimentoQtdFruta) || 1),
      rendimentoUnidadeFruta: String(dadosConfig.rendimentoUnidadeFruta || 'un').trim() || 'un',
      rendimentoMlSuco: Math.max(0.1, Number(dadosConfig.rendimentoMlSuco) || 35),
      pesoMedioUnidadeG: Math.max(1, Number(dadosConfig.pesoMedioUnidadeG) || 80)
    };
    this.save();
    return true;
  },

  /**
   * Calcula dados de custo do insumo:
   * - Se for Insumo de Produção Própria (Sub-receita): soma o custo proporcional de todos os
   *   Insumos Base utilizados e divide pelo "Rendimento Final" para obter o custo por ml/g/un.
   * - Se for Insumo Comprado: compara múltiplos fornecedores com preço válido (> 0) e destaca o de menor custo.
   */
  getInsumoCustoInfo(insumo, visitedIds = new Set()) {
    if (!insumo) {
      return {
        isProducaoPropria: false,
        menorFornecedor: null,
        fornecedorAtivo: null,
        margemLucro: 0,
        custoRealEmbalagem: 0,
        custoRealPorUnidadeBase: 0,
        lucroEmbalagem: 0,
        precoEmbalagem: 0,
        tamanhoEmbalagem: 1,
        custoPorUnidadeBase: 0,
        itensSubReceitaDetalhados: []
      };
    }

    const margemRaw = Number(insumo.margemLucro);
    const margemLucro = Number.isFinite(margemRaw) && margemRaw >= 0 ? margemRaw : 0;
    const fatorMargem = 1 + margemLucro / 100;

    // 1. Caso seja Insumo de Produção Própria (Sub-receita)
    if (insumo.producaoPropria) {
      const rendCandidato = Number(insumo.rendimentoFinal) || Number(insumo.volumeEmbalagem);
      const rendimentoFinal = Number.isFinite(rendCandidato) && rendCandidato > 0 ? rendCandidato : 1;
      let custoTotalReceita = 0;
      let custoRealTotalReceita = 0;
      const itensSubReceitaDetalhados = [];

      if (!visitedIds.has(insumo.id)) {
        const nextVisited = new Set(visitedIds);
        nextVisited.add(insumo.id);

        (insumo.subReceita || []).forEach((itemSub) => {
          const insumoBase = (this.state.insumos || []).find((i) => i.id === itemSub.insumoBaseId);
          const qtdUsada = Number(itemSub.quantidade);
          if (insumoBase && Number.isFinite(qtdUsada) && qtdUsada > 0) {
            const infoBase = this.getInsumoCustoInfo(insumoBase, nextVisited);
            const custoSubtotal = qtdUsada * infoBase.custoPorUnidadeBase;
            const custoRealSubtotal = qtdUsada * (infoBase.custoRealPorUnidadeBase ?? infoBase.custoPorUnidadeBase);
            custoTotalReceita += custoSubtotal;
            custoRealTotalReceita += custoRealSubtotal;
            itensSubReceitaDetalhados.push({
              insumoBaseId: insumoBase.id,
              insumoBase,
              quantidade: qtdUsada,
              unidade: insumoBase.unidade,
              custoPorUnidadeBase: infoBase.custoPorUnidadeBase,
              custoRealPorUnidadeBase: infoBase.custoRealPorUnidadeBase ?? infoBase.custoPorUnidadeBase,
              custoSubtotal,
              custoRealSubtotal
            });
          }
        });
      }

      const precoRepasseReceita = Math.round(custoTotalReceita * fatorMargem * 100) / 100;
      const custoPorUnidadeBase = precoRepasseReceita / rendimentoFinal;
      const custoRealPorUnidadeBase = custoRealTotalReceita / rendimentoFinal;
      const lucroEmbalagem = Math.max(0, Math.round((precoRepasseReceita - custoRealTotalReceita) * 100) / 100);

      const pseudoFornecedor = {
        id: 'PROD_PROPRIA',
        nome: 'Produção Própria (Sub-receita)',
        preco: custoRealTotalReceita,
        precoRepasse: precoRepasseReceita,
        tamanhoEmbalagem: rendimentoFinal,
        custoPorUnidadeBase
      };

      return {
        isProducaoPropria: true,
        rendimentoFinal,
        custoTotalReceita: precoRepasseReceita,
        custoRealTotalReceita,
        itensSubReceitaDetalhados,
        menorFornecedor: pseudoFornecedor,
        fornecedorAtivo: pseudoFornecedor,
        margemLucro,
        custoRealEmbalagem: custoRealTotalReceita,
        custoRealPorUnidadeBase,
        lucroEmbalagem,
        precoEmbalagem: precoRepasseReceita,
        tamanhoEmbalagem: rendimentoFinal,
        custoPorUnidadeBase
      };
    }

    // 2. Caso seja Insumo Comprado de Fornecedores
    const volBruto = Number(insumo.volumeEmbalagem);
    const volPadrao = Number.isFinite(volBruto) && volBruto > 0 ? volBruto : 1;
    if (!Array.isArray(insumo.fornecedores) || insumo.fornecedores.length === 0) {
      return {
        isProducaoPropria: false,
        menorFornecedor: null,
        fornecedorAtivo: null,
        margemLucro,
        custoRealEmbalagem: 0,
        custoRealPorUnidadeBase: 0,
        lucroEmbalagem: 0,
        precoEmbalagem: 0,
        tamanhoEmbalagem: volPadrao,
        custoPorUnidadeBase: 0,
        itensSubReceitaDetalhados: []
      };
    }

    const enriquecidos = insumo.fornecedores.map((f) => {
      const pBruto = Number(f?.preco);
      const tBruto = Number(f?.tamanhoEmbalagem);
      const preco = Number.isFinite(pBruto) && pBruto >= 0 ? pBruto : 0;
      const tam = Number.isFinite(tBruto) && tBruto > 0 ? tBruto : volPadrao;
      const custoUnit = tam > 0 ? preco / tam : 0;
      return {
        ...f,
        preco,
        tamanhoEmbalagem: tam,
        custoPorUnidadeBase: custoUnit
      };
    });

    // Ignorar fornecedores com preço zerado/não preenchido quando houver cotações válidas (> 0)
    const comPrecoValido = enriquecidos.filter((f) => f.preco > 0);
    const baseComparacao = comPrecoValido.length > 0 ? comPrecoValido : enriquecidos;
    const ordenados = [...baseComparacao].sort((a, b) => a.custoPorUnidadeBase - b.custoPorUnidadeBase);
    const menorFornecedor = ordenados[0];

    let fornecedorAtivo = menorFornecedor;
    if (insumo.fornecedorAtivoId && insumo.fornecedorAtivoId !== 'MENOR_PRECO') {
      const escolhido = enriquecidos.find((f) => f.id === insumo.fornecedorAtivoId);
      if (escolhido && (escolhido.preco > 0 || comPrecoValido.length === 0)) {
        fornecedorAtivo = escolhido;
      }
    }

    const custoRealEmbalagem = fornecedorAtivo.preco;
    const custoRealPorUnidadeBase = fornecedorAtivo.custoPorUnidadeBase;
    const precoRepasseEmbalagem = Math.round(custoRealEmbalagem * fatorMargem * 100) / 100;
    const precoRepassePorUnidadeBase =
      fornecedorAtivo.tamanhoEmbalagem > 0 ? precoRepasseEmbalagem / fornecedorAtivo.tamanhoEmbalagem : 0;
    const lucroEmbalagem = Math.max(0, Math.round((precoRepasseEmbalagem - custoRealEmbalagem) * 100) / 100);

    return {
      isProducaoPropria: false,
      menorFornecedor,
      fornecedorAtivo,
      margemLucro,
      custoRealEmbalagem,
      custoRealPorUnidadeBase,
      lucroEmbalagem,
      precoEmbalagem: precoRepasseEmbalagem,
      tamanhoEmbalagem: fornecedorAtivo.tamanhoEmbalagem,
      custoPorUnidadeBase: precoRepassePorUnidadeBase,
      itensSubReceitaDetalhados: []
    };
  },

  /**
   * Resolve qual insumo da Aba 1 deve ser utilizado para um ingrediente de drinque,
   * respeitando a seleção de Linha (A, B ou C), escalação de bebidas e a flag "Insumo sem linha".
   */
  /**
   * Infere automaticamente a categoria ou grupo genérico da bebida (Gin, Vodka, etc.)
   * caso o usuário não tenha selecionado manualmente no cadastro.
   */
  inferirGrupoGenerico(descricao = '', categoria = '', grupoAtual = '') {
    if (grupoAtual && String(grupoAtual).trim() !== '') {
      return String(grupoAtual).trim();
    }
    const texto = `${descricao || ''} ${categoria || ''}`.toLowerCase();
    if (/\b(gin|gordon'?s|beefeater|tanqueray|bombay|hendrick'?s|seagers|rocks|dry gin)\b/i.test(texto)) return 'Gin';
    if (/\b(vodka|vodca|absolut|smirnoff|skyy|ciroc|grey goose|ketel one|orloff|kadov)\b/i.test(texto)) return 'Vodka';
    if (/\b(rum|bacardi|havana club|captain morgan|montilla|malibu)\b/i.test(texto)) return 'Rum';
    if (/\b(whisky|whiskey|bourbon|red label|black label|jack daniel'?s|ballantine'?s|chivas|white horse|jameson)\b/i.test(texto)) return 'Whisky';
    if (/\b(cacha[çc]a|pinga|aguardente|ypi[oó]ca|salinas|velho barreiro|51|sagr[aá]tiva|pit[uú]|leblon)\b/i.test(texto)) return 'Cachaça';
    if (/\b(tequila|jose cuervo|jos[eé] cuervo|don julio|patron|patr[oó]n|1800|el jimador)\b/i.test(texto)) return 'Tequila';
    if (/\b(aperol|campari|bitter|carpano|martini bitter)\b/i.test(texto)) return 'Aperitivo Bitter';
    if (/\b(espumante|prosecco|champagne|cava|chandon|brut|salton|veuve clicquot)\b/i.test(texto)) return 'Espumante';
    if (/\b(licor|liqueur|baileys|cointreau|kahlua|cura[çc]ao|frangelico|amaretto)\b/i.test(texto)) return 'Licor';
    if (/\b(vinho|wine|cabernet|merlot|malbec|chardonnay|sauvignon)\b/i.test(texto)) return 'Vinho';
    return '';
  },

  /**
   * Retorna os grupos genéricos de bebidas alcoólicas efetivamente utilizados
   * pelos coquetéis selecionados na proposta (evitando poluir a tela com grupos não usados).
   */
  getGruposBebidasDosCoqueteis(proposta) {
    if (!proposta || !Array.isArray(proposta.coqueteis)) return [];
    const gruposSet = new Set();
    const drinques = this.state.drinques || [];
    const insumos = this.state.insumos || [];

    proposta.coqueteis.forEach((c) => {
      const d = drinques.find((dr) => dr.id === c.drinqueId);
      if (!d) return;
      (d.ingredientes || []).forEach((ing) => {
        const insumoDireto = insumos.find((i) => i.id === ing.insumoId);
        const grupoInsumo = insumoDireto ? (insumoDireto.grupoGenerico || this.inferirGrupoGenerico(insumoDireto.descricao, insumoDireto.categoria)) : '';
        const grupo = String(
          ing.grupoGenerico ||
          grupoInsumo ||
          this.inferirGrupoGenerico(ing.descricao || '')
        ).trim();
        if (grupo && (!insumoDireto || !insumoDireto.semLinha)) {
          gruposSet.add(grupo);
        }
      });
    });

    return Array.from(gruposSet);
  },

  /**
   * Resolve qual insumo da Aba 1 deve ser utilizado para um ingrediente de drinque,
   * respeitando a seleção de Linha (A, B ou C), escalação de bebidas e a flag "Insumo sem linha".
   */
  resolverInsumoPorLinha(ingrediente, linhaProposta = 'A', escalacaoPersonalizada = null) {
    if (!ingrediente) return null;
    const insumos = this.state.insumos || [];
    const insumoDireto = insumos.find((i) => i.id === ingrediente.insumoId);

    const grupoInsumo = insumoDireto ? (insumoDireto.grupoGenerico || this.inferirGrupoGenerico(insumoDireto.descricao, insumoDireto.categoria)) : '';
    const grupoAlvo = String(
      ingrediente.grupoGenerico ||
      grupoInsumo ||
      this.inferirGrupoGenerico(ingrediente.descricao || '')
    ).trim();

    // Se for expressamente sem linha ou produção própria, e não pertencer a um grupo genérico de destilado/bebida
    if (insumoDireto && (insumoDireto.semLinha || insumoDireto.producaoPropria) && !grupoAlvo) {
      return insumoDireto;
    }

    if (grupoAlvo) {
      const grupoLower = grupoAlvo.toLowerCase();

      // 1. Prioridade Máxima: Escalação personalizada definida diretamente nesta proposta
      if (escalacaoPersonalizada && typeof escalacaoPersonalizada === 'object') {
        const idCustom = escalacaoPersonalizada[grupoAlvo] || escalacaoPersonalizada[grupoLower];
        if (idCustom) {
          const insumoCustom = insumos.find((i) => i.id === idCustom);
          if (insumoCustom) {
            // Só aceita a marca se ela pertencer à linha da proposta ou for 'Sem Linha'
            if (insumoCustom.semLinha || insumoCustom.linha === linhaProposta) {
              return insumoCustom;
            }
          }
        }
      }

      // Se o drinque fixou marca específica sem escalação personalizada
      if (ingrediente.fixarMarcaEspecifica && insumoDireto) {
        return insumoDireto;
      }

      // 2. Prioridade: Candidatos da linha proposta para este grupo genérico
      const candidatosLinha = this.getCandidatosBebidasPorLinha(grupoAlvo, linhaProposta);
      if (candidatosLinha.length > 0) {
        const escalado = candidatosLinha.find((i) => i.escalado === true);
        return escalado || candidatosLinha[0];
      }

      // 3. Fallback: item 'Sem Linha' para este grupo
      const matchSemLinha = insumos.find((i) => {
        const g = (i.grupoGenerico || this.inferirGrupoGenerico(i.descricao, i.categoria) || '').toLowerCase().trim();
        return g === grupoLower && i.semLinha;
      });
      if (matchSemLinha) return matchSemLinha;

      // 4. Fallback: qualquer insumo desse grupo
      const candidatosQualquer = insumos.filter((i) => {
        const g = (i.grupoGenerico || this.inferirGrupoGenerico(i.descricao, i.categoria) || '').toLowerCase().trim();
        return g === grupoLower;
      });
      if (candidatosQualquer.length > 0) {
        const escalado = candidatosQualquer.find((i) => i.escalado === true);
        return escalado || candidatosQualquer[0];
      }
    }

    return insumoDireto || null;
  },

  /**
   * Escala um insumo como titular da sua Linha e Grupo Genérico,
   * desmarcando os outros insumos concorrentes da mesma Linha.
   */
  escalarInsumo(insumoId) {
    const ins = (this.state.insumos || []).find((i) => i.id === insumoId);
    if (!ins || ins.semLinha) return false;

    const grupo = ins.grupoGenerico || this.inferirGrupoGenerico(ins.descricao, ins.categoria);
    if (!grupo) return false;
    ins.grupoGenerico = grupo;
    const grupoLower = grupo.toLowerCase().trim();
    const linha = ins.linha;

    (this.state.insumos || []).forEach((i) => {
      const g = (i.grupoGenerico || this.inferirGrupoGenerico(i.descricao, i.categoria) || '').toLowerCase().trim();
      if (g === grupoLower && i.linha === linha && !i.semLinha) {
        i.escalado = (i.id === insumoId);
      }
    });

    this.save();
    return true;
  },

  /**
   * Retorna os insumos cadastrados para um determinado grupo e linha
   */
  getCandidatosBebidasPorLinha(grupoGenerico, linha) {
    if (!grupoGenerico) return [];
    const grupoLower = String(grupoGenerico).toLowerCase().trim();
    return (this.state.insumos || []).filter((i) => {
      if (i.semLinha) return false;
      if (linha && i.linha !== linha) return false;
      const g = (i.grupoGenerico || this.inferirGrupoGenerico(i.descricao, i.categoria) || '').toLowerCase().trim();
      return g === grupoLower;
    });
  },

  /**
   * Calcula o custo de 1 dose de um Drinque para uma determinada Linha (A, B ou C),
   * considerando opcionalmente a escalação personalizada de bebidas da proposta.
   */
  calcularCustoDrinquePorLinha(drinque, linha = 'A', escalacaoBebidas = null) {
    if (!drinque || !Array.isArray(drinque.ingredientes)) return { custoDose: 0, itensDetalhados: [] };
    let custoDose = 0;
    const itensDetalhados = [];

    drinque.ingredientes.forEach((ing) => {
      const insumo = this.resolverInsumoPorLinha(ing, linha, escalacaoBebidas);
      const qBruta = Number(ing?.quantidade);
      const qtd = Number.isFinite(qBruta) && qBruta > 0 ? qBruta : 0;
      if (insumo && qtd > 0) {
        const info = this.getInsumoCustoInfo(insumo);
        const subtotal = qtd * info.custoPorUnidadeBase;
        custoDose += subtotal;
        itensDetalhados.push({
          ingredienteOriginal: ing,
          insumoResolvido: insumo,
          quantidade: qtd,
          unidade: insumo.unidade,
          custoUnitario: info.custoPorUnidadeBase,
          subtotal
        });
      }
    });

    return { custoDose, itensDetalhados };
  },

  /**
   * Consolida todos os insumos (Coquetéis + Periféricos), realiza a Explosão de Insumos de
   * Produção Própria (Mise en Place / Matérias-Primas Brutas) e calcula os totais financeiros.
   * LÓGICA DE DIMENSIONAMENTO: Baseada na Quantidade de Bartenders Trabalhando (Fator por Bartender em 5h).
   */
  consolidarProposta(proposta) {
    if (!proposta || typeof proposta !== 'object') {
      return {
        listaInsumosCoqueteis: [],
        listaPerifericos: [],
        detalhamentoProducaoPropria: [],
        listaMateriasPrimasConsolidadas: [],
        listaServicos: [],
        custoInsumosCoqueteis: 0,
        custoPerifericos: 0,
        custoTotalInsumos: 0,
        custoTotalServicos: 0,
        custoTotalEvento: 0,
        qtdBartenders: 1,
        duracaoHoras: 5
      };
    }

    const linha = ['A', 'B', 'C'].includes(proposta.linhaInsumos) ? proposta.linhaInsumos : 'A';
    const convBruto = Number(proposta.numConvidados);
    const numConvidados = Number.isFinite(convBruto) && convBruto >= 1 ? Math.round(convBruto) : 1;
    const durBruta = Number(proposta.duracaoHoras);
    const duracaoHoras = Number.isFinite(durBruta) && durBruta >= 0.5 ? durBruta : 5;
    const fatorHoras = duracaoHoras / 5;

    // Detectar quantidade de bartenders trabalhando
    const bartBruto = Number(proposta.qtdBartenders);
    let qtdBartenders = Number.isFinite(bartBruto) && bartBruto > 0 ? Math.round(bartBruto) : 0;
    if (qtdBartenders <= 0) {
      const srvBartender = (proposta.servicos || []).find((s) => {
        const ref = (this.state.servicos || []).find((x) => x.id === s.servicoId);
        return ref && (ref.descricao || '').toLowerCase().includes('bartender');
      });
      const srvQtd = srvBartender ? Number(srvBartender.quantidade) : 0;
      if (Number.isFinite(srvQtd) && srvQtd > 0) {
        qtdBartenders = Math.round(srvQtd);
      } else {
        qtdBartenders = 2; // Padrão de 2 bartenders
      }
    }

    const fatoresPersonalizados =
      proposta.fatoresConsumoPersonalizados && typeof proposta.fatoresConsumoPersonalizados === 'object'
        ? proposta.fatoresConsumoPersonalizados
        : {};
    const ajustes =
      proposta.ajustesInsumosCoqueteis && typeof proposta.ajustesInsumosCoqueteis === 'object'
        ? proposta.ajustesInsumosCoqueteis
        : {};

    const mapaInsumosCoqueteis = {};

    // 1. Mapear insumos dos coquetéis selecionados
    (proposta.coqueteis || []).forEach((coqItem) => {
      if (!coqItem) return;
      const drinque = (this.state.drinques || []).find((d) => d.id === coqItem.drinqueId);
      if (!drinque) return;

      (drinque.ingredientes || []).forEach((ing) => {
        const insumo = this.resolverInsumoPorLinha(ing, linha, proposta.escalacaoBebidas);
        if (!insumo) return;

        if (!mapaInsumosCoqueteis[insumo.id]) {
          mapaInsumosCoqueteis[insumo.id] = {
            insumo,
            drinquesNomes: []
          };
        }
        if (!mapaInsumosCoqueteis[insumo.id].drinquesNomes.includes(drinque.nome)) {
          mapaInsumosCoqueteis[insumo.id].drinquesNomes.push(drinque.nome);
        }
      });
    });

    const listaInsumosCoqueteis = Object.values(mapaInsumosCoqueteis).map((item) => {
      const id = item.insumo.id;

      // Fator de consumo por bartender (base 5h) com sanitização contra NaN/<=0
      const fatorCustomRaw = fatoresPersonalizados[id];
      const fatorCustomNum = Number(fatorCustomRaw);
      const temFatorCustomValido =
        fatorCustomRaw !== undefined &&
        fatorCustomRaw !== null &&
        fatorCustomRaw !== '' &&
        Number.isFinite(fatorCustomNum) &&
        fatorCustomNum > 0;

      const fatorBase5h = temFatorCustomValido ? fatorCustomNum : this.getFatorConsumoPadrao(item.insumo);

      // CÁLCULO PRINCIPAL: POR BARTENDERS TRABALHANDO
      const qtdCalculada = Math.max(0, Math.round(qtdBartenders * fatorBase5h * fatorHoras));
      const origensTexto = `${qtdBartenders} bartender(s) × ${this.formatNumber(fatorBase5h)}${item.insumo.unidade} (base 5h, evento de ${duracaoHoras}h)`;

      const ajusteRaw = ajustes[id];
      const ajusteNum = Number(ajusteRaw);
      const editadoManualmente =
        ajusteRaw !== undefined && ajusteRaw !== null && ajusteRaw !== '' && Number.isFinite(ajusteNum);

      const qtdFinal = editadoManualmente ? Math.max(0, ajusteNum) : qtdCalculada;

      const custoInfo = this.getInsumoCustoInfo(item.insumo);
      const volBruto = item.insumo.producaoPropria
        ? Number(item.insumo.rendimentoFinal) || Number(item.insumo.volumeEmbalagem)
        : Number(item.insumo.volumeEmbalagem) || custoInfo.tamanhoEmbalagem;
      const volEmb = Number.isFinite(volBruto) && volBruto > 0 ? volBruto : 1;
      const qtdEmbalagens = qtdFinal > 0 ? (volEmb > 0 ? Math.ceil(qtdFinal / volEmb) : Math.ceil(qtdFinal)) : 0;
      const volumeTotalLevado = qtdEmbalagens * volEmb;
      const custoProporcional = qtdFinal * custoInfo.custoPorUnidadeBase;
      // Arredonda para cima pela quantidade total de embalagens que o evento precisa comprar/levar
      const custoTotal = qtdEmbalagens * custoInfo.precoEmbalagem;
      const custoRealEmbalagem = custoInfo.custoRealEmbalagem ?? custoInfo.precoEmbalagem;
      const custoRealTotal = qtdEmbalagens * custoRealEmbalagem;

      return {
        insumoId: id,
        insumo: item.insumo,
        isProducaoPropria: Boolean(item.insumo.producaoPropria),
        fatorBase5h,
        temFatorCustom: temFatorCustomValido,
        fatorOriginalPadrao: this.getFatorConsumoPadrao(item.insumo),
        quantidadeCalculada: qtdCalculada,
        quantidadeFinal: qtdFinal,
        editadoManualmente,
        volumeEmbalagem: volEmb,
        qtdEmbalagens,
        volumeTotalLevado,
        margemLucro: custoInfo.margemLucro || 0,
        custoPorUnidadeBase: custoInfo.custoPorUnidadeBase,
        precoEmbalagem: custoInfo.precoEmbalagem,
        custoRealEmbalagem,
        custoRealTotal,
        fornecedorNome: custoInfo.fornecedorAtivo?.nome || '-',
        custoProporcional,
        custoTotal,
        drinquesNomes: item.drinquesNomes,
        origens: [origensTexto]
      };
    });

    // Ordenar insumos consolidados por categoria e em ordem alfabética dentro de cada categoria
    listaInsumosCoqueteis.sort((a, b) => {
      const catA = (a.insumo?.categoria || 'Outros').trim();
      const catB = (b.insumo?.categoria || 'Outros').trim();
      if (catA !== catB) {
        if (catA === 'Outros') return 1;
        if (catB === 'Outros') return -1;
        return catA.localeCompare(catB, 'pt-BR');
      }
      const descA = (a.insumo?.descricao || '').replace(/\s*\((?:produção própria|sub-receita|matéria-prima)\)/gi, '').trim();
      const descB = (b.insumo?.descricao || '').replace(/\s*\((?:produção própria|sub-receita|matéria-prima)\)/gi, '').trim();
      return descA.localeCompare(descB, 'pt-BR');
    });

    // 2. Consolidar insumos periféricos (preservando indiceOriginal para edições/exclusões seguras)
    const listaPerifericos = (proposta.perifericos || [])
      .map((per, indiceOriginal) => {
        if (!per) return null;
        const insumo = (this.state.insumos || []).find((i) => i.id === per.insumoId);
        if (!insumo) return null;
        const qBruta = Number(per.quantidade);
        const qtd = Number.isFinite(qBruta) && qBruta >= 0 ? qBruta : 0;
        const custoInfo = this.getInsumoCustoInfo(insumo);
        const volBruto = insumo.producaoPropria
          ? Number(insumo.rendimentoFinal) || Number(insumo.volumeEmbalagem)
          : Number(insumo.volumeEmbalagem) || custoInfo.tamanhoEmbalagem;
        const volEmb = Number.isFinite(volBruto) && volBruto > 0 ? volBruto : 1;
        const qtdEmbalagens = qtd > 0 ? (volEmb > 0 ? Math.ceil(qtd / volEmb) : Math.ceil(qtd)) : 0;
        const volumeTotalLevado = qtdEmbalagens * volEmb;
        const custoProporcional = qtd * custoInfo.custoPorUnidadeBase;
        // Arredonda para cima pela quantidade total de embalagens que o evento precisa comprar/levar
        const custoTotal = qtdEmbalagens * custoInfo.precoEmbalagem;
        const custoRealEmbalagem = custoInfo.custoRealEmbalagem ?? custoInfo.precoEmbalagem;
        const custoRealTotal = qtdEmbalagens * custoRealEmbalagem;
        return {
          indiceOriginal,
          insumoId: insumo.id,
          insumo,
          isProducaoPropria: Boolean(insumo.producaoPropria),
          quantidade: qtd,
          volumeEmbalagem: volEmb,
          qtdEmbalagens,
          volumeTotalLevado,
          margemLucro: custoInfo.margemLucro || 0,
          custoPorUnidadeBase: custoInfo.custoPorUnidadeBase,
          precoEmbalagem: custoInfo.precoEmbalagem,
          custoRealEmbalagem,
          custoRealTotal,
          fornecedorNome: custoInfo.fornecedorAtivo?.nome || '-',
          custoProporcional,
          custoTotal
        };
      })
      .filter(Boolean);

    // 3. EXPLOSÃO MULTI-NÍVEL DE INSUMOS DE PRODUÇÃO PRÓPRIA (MISE EN PLACE / DESMEMBRAMENTO)
    const mapaSubReceitasEvento = {};

    // Função recursiva para mapear todas as sub-receitas necessárias (inclusive sub-receitas filhas)
    const registrarSubReceitaNecessaria = (insumoSub, qtdNecessaria, origemTexto, visitados = new Set()) => {
      if (!insumoSub || !insumoSub.producaoPropria || !Number.isFinite(qtdNecessaria) || qtdNecessaria <= 0) return;
      if (visitados.has(insumoSub.id)) return;
      const novosVisitados = new Set(visitados);
      novosVisitados.add(insumoSub.id);

      if (!mapaSubReceitasEvento[insumoSub.id]) {
        mapaSubReceitasEvento[insumoSub.id] = {
          insumoProprio: insumoSub,
          quantidadeTotalNecessaria: 0,
          origens: [],
          destinacoes: []
        };
      }
      mapaSubReceitasEvento[insumoSub.id].quantidadeTotalNecessaria += qtdNecessaria;
      if (origemTexto && !mapaSubReceitasEvento[insumoSub.id].origens.includes(origemTexto)) {
        mapaSubReceitasEvento[insumoSub.id].origens.push(origemTexto);
      }
      mapaSubReceitasEvento[insumoSub.id].destinacoes.push({
        origemTexto: origemTexto || 'Produção',
        quantidade: qtdNecessaria,
        unidade: insumoSub.unidade
      });

      // Se a sub-receita tiver componentes que também são sub-receitas (ex: Espuma usa Xarope)
      const rendBruto = Number(insumoSub.rendimentoFinal) || Number(insumoSub.volumeEmbalagem);
      const rendimento = Number.isFinite(rendBruto) && rendBruto > 0 ? rendBruto : 1;
      const fator = qtdNecessaria / rendimento;

      (insumoSub.subReceita || []).forEach((comp) => {
        const itemComp = (this.state.insumos || []).find((i) => i.id === comp.insumoBaseId);
        const qtdBase = Number(comp.quantidade);
        if (itemComp && itemComp.producaoPropria && Number.isFinite(qtdBase) && qtdBase > 0) {
          const qtdComp = qtdBase * fator;
          registrarSubReceitaNecessaria(
            itemComp,
            qtdComp,
            `Preparo da sub-receita: ${insumoSub.descricao}`,
            novosVisitados
          );
        }
      });
    };

    // Coletar sub-receitas dos coquetéis e periféricos
    listaInsumosCoqueteis.forEach((item) => {
      if (item.insumo.producaoPropria) {
        registrarSubReceitaNecessaria(item.insumo, item.quantidadeFinal, 'Serviço de Bar (Coquetéis/Copos)');
      }
    });
    listaPerifericos.forEach((per) => {
      if (per.insumo.producaoPropria) {
        registrarSubReceitaNecessaria(per.insumo, per.quantidade, 'Periféricos / Extras do Bar');
      }
    });

    // Mapa acumulador de matérias-primas brutas compradas (itens folha)
    const mapaMateriasPrimasBrutas = {};

    // Função recursiva para desmembrar qualquer insumo próprio até as matérias-primas brutas de fornecedores
    const explodirAteMateriasPrimasBrutas = (insumo, qtd, destinoFinal, visitados = new Set()) => {
      if (!insumo || !Number.isFinite(qtd) || qtd <= 0) return;
      if (visitados.has(insumo.id)) return;

      if (!insumo.producaoPropria) {
        // Matéria-prima bruta comprada (folha)
        if (!mapaMateriasPrimasBrutas[insumo.id]) {
          mapaMateriasPrimasBrutas[insumo.id] = {
            insumoBase: insumo,
            quantidadeTotalBruta: 0,
            custoTotalBruto: 0,
            porDestino: {},
            subReceitasOrigem: []
          };
        }
        const custoInfo = this.getInsumoCustoInfo(insumo);
        mapaMateriasPrimasBrutas[insumo.id].quantidadeTotalBruta += qtd;
        mapaMateriasPrimasBrutas[insumo.id].custoTotalBruto += qtd * custoInfo.custoPorUnidadeBase;

        const chaveDestino = destinoFinal || 'Sub-receita';
        mapaMateriasPrimasBrutas[insumo.id].porDestino[chaveDestino] =
          (mapaMateriasPrimasBrutas[insumo.id].porDestino[chaveDestino] || 0) + qtd;
      } else {
        // É sub-receita própria: explode seus componentes recursivamente
        const novosVisitados = new Set(visitados);
        novosVisitados.add(insumo.id);
        const rendBruto = Number(insumo.rendimentoFinal) || Number(insumo.volumeEmbalagem);
        const rendimento = Number.isFinite(rendBruto) && rendBruto > 0 ? rendBruto : 1;
        const fator = qtd / rendimento;

        (insumo.subReceita || []).forEach((comp) => {
          const compInsumo = (this.state.insumos || []).find((i) => i.id === comp.insumoBaseId);
          const qtdBase = Number(comp.quantidade);
          if (compInsumo && Number.isFinite(qtdBase) && qtdBase > 0) {
            const qtdComp = qtdBase * fator;
            explodirAteMateriasPrimasBrutas(compInsumo, qtdComp, destinoFinal, novosVisitados);
          }
        });
      }
    };

    // Explodir todas as sub-receitas até as matérias-primas brutas
    listaInsumosCoqueteis.forEach((item) => {
      if (item.insumo.producaoPropria) {
        const isEspuma = (item.insumo.descricao || '').toLowerCase().includes('espuma');
        const labelDestino = isEspuma
          ? item.insumo.descricao
          : `${item.insumo.descricao} (Serviço de Bar)`;
        explodirAteMateriasPrimasBrutas(item.insumo, item.quantidadeFinal, labelDestino);
      }
    });
    listaPerifericos.forEach((per) => {
      if (per.insumo.producaoPropria) {
        explodirAteMateriasPrimasBrutas(per.insumo, per.quantidade, `${per.insumo.descricao} (Periféricos)`);
      }
    });

    // Formatar rótulos consolidados por destino em cada matéria-prima bruta
    Object.values(mapaMateriasPrimasBrutas).forEach((mp) => {
      mp.subReceitasOrigem = Object.entries(mp.porDestino).map(([dest, qtdDest]) => {
        const qtdFmt = this.formatNumber(qtdDest, 1).replace(',0', '');
        return `${dest} (${qtdFmt}${mp.insumoBase.unidade})`;
      });
    });

    const detalhamentoProducaoPropria = Object.values(mapaSubReceitasEvento).map((entry) => {
      const subIns = entry.insumoProprio;
      const qtdNecessaria = Number(entry.quantidadeTotalNecessaria) || 0;
      const rendBruto = Number(subIns.rendimentoFinal) || Number(subIns.volumeEmbalagem);
      const rendimentoReceita = Number.isFinite(rendBruto) && rendBruto > 0 ? rendBruto : 1;
      const fatorMultiplicador = qtdNecessaria / rendimentoReceita;
      const custoInfoSub = this.getInsumoCustoInfo(subIns);

      const ingredientesExplodidos = (subIns.subReceita || [])
        .map((comp) => {
          const insumoBase = (this.state.insumos || []).find((i) => i.id === comp.insumoBaseId);
          const qRec = Number(comp.quantidade);
          if (!insumoBase || !Number.isFinite(qRec) || qRec <= 0) return null;
          const qtdPorReceita = qRec;
          const qtdBrutaNecessaria = qtdPorReceita * fatorMultiplicador;
          const custoBaseInfo = this.getInsumoCustoInfo(insumoBase);
          const custoSubtotalBruto = qtdBrutaNecessaria * custoBaseInfo.custoPorUnidadeBase;

          return {
            insumoBaseId: insumoBase.id,
            insumoBase,
            isSubReceitaFilha: Boolean(insumoBase.producaoPropria),
            qtdPorReceita,
            qtdBrutaNecessaria,
            unidade: insumoBase.unidade,
            custoPorUnidadeBase: custoBaseInfo.custoPorUnidadeBase,
            custoSubtotalBruto
          };
        })
        .filter(Boolean);

      return {
        insumoProprioId: subIns.id,
        insumoProprio: subIns,
        quantidadeTotalNecessaria: qtdNecessaria,
        unidade: subIns.unidade,
        rendimentoReceita,
        fatorMultiplicador,
        lotesInteirosSugeridos: Math.ceil(fatorMultiplicador),
        custoTotalSubReceita: qtdNecessaria * custoInfoSub.custoPorUnidadeBase,
        origens: entry.origens,
        destinacoes: entry.destinacoes || [],
        ingredientesExplodidos
      };
    });

    const listaMateriasPrimasConsolidadas = Object.values(mapaMateriasPrimasBrutas).sort((a, b) => {
      const descA = (a.insumoBase?.descricao || '').trim();
      const descB = (b.insumoBase?.descricao || '').trim();
      return descA.localeCompare(descB, 'pt-BR');
    });

    // 4. Consolidar serviços (preservando indiceOriginal para edições/exclusões seguras)
    const listaServicos = (proposta.servicos || [])
      .map((srvItem, indiceOriginal) => {
        if (!srvItem) return null;
        const servico = (this.state.servicos || []).find((s) => s.id === srvItem.servicoId);
        if (!servico) return null;
        const qBruta = Number(srvItem.quantidade);
        const qtd = Number.isFinite(qBruta) && qBruta >= 0 ? qBruta : 0;

        let valorHora = 0;
        if (
          srvItem.valorHora !== undefined &&
          srvItem.valorHora !== null &&
          srvItem.valorHora !== '' &&
          Number.isFinite(Number(srvItem.valorHora))
        ) {
          valorHora = Math.max(0, Number(srvItem.valorHora));
        } else if (Number.isFinite(Number(servico.valorHora)) && Number(servico.valorHora) > 0) {
          valorHora = Number(servico.valorHora);
        }

        const vItemRaw = srvItem.valorUnitario;
        const vItemNum = Number(vItemRaw);
        const temValorItemValido =
          vItemRaw !== undefined && vItemRaw !== null && vItemRaw !== '' && Number.isFinite(vItemNum);

        let valUnit = 0;
        if (temValorItemValido) {
          valUnit = Math.max(0, vItemNum);
        } else if (valorHora > 0 && duracaoHoras > 0) {
          valUnit = Math.round(valorHora * duracaoHoras * 100) / 100;
        } else {
          const vCatNum = Number(servico.valorUnitario);
          valUnit = Number.isFinite(vCatNum) && vCatNum >= 0 ? vCatNum : 0;
        }

        return {
          indiceOriginal,
          servicoId: servico.id,
          servico,
          quantidade: qtd,
          valorHora,
          valorUnitario: valUnit,
          custoTotal: qtd * valUnit
        };
      })
      .filter(Boolean);

    // 5. Totais financeiros de custos operacionais (arredondados por embalagens fechadas)
    const custoInsumosCoqueteis = listaInsumosCoqueteis.reduce((acc, i) => acc + i.custoTotal, 0);
    const custoPerifericos = listaPerifericos.reduce((acc, i) => acc + i.custoTotal, 0);
    const custoTotalInsumos = custoInsumosCoqueteis + custoPerifericos;
    const custoRealInsumosCoqueteis = listaInsumosCoqueteis.reduce((acc, i) => acc + (i.custoRealTotal ?? i.custoTotal), 0);
    const custoRealPerifericos = listaPerifericos.reduce((acc, i) => acc + (i.custoRealTotal ?? i.custoTotal), 0);
    const custoRealTotalInsumos = custoRealInsumosCoqueteis + custoRealPerifericos;
    const lucroTotalInsumos = Math.max(0, Math.round((custoTotalInsumos - custoRealTotalInsumos) * 100) / 100);
    const custoTotalServicos = listaServicos.reduce((acc, s) => acc + s.custoTotal, 0);
    const custoTotalEvento = custoTotalInsumos + custoTotalServicos;

    // Totais proporcionais exatos (somente o ml/g consumido nos drinques)
    const custoProporcionalInsumosCoqueteis = listaInsumosCoqueteis.reduce(
      (acc, i) => acc + (i.custoProporcional !== undefined ? i.custoProporcional : i.custoTotal),
      0
    );
    const custoProporcionalPerifericos = listaPerifericos.reduce(
      (acc, i) => acc + (i.custoProporcional !== undefined ? i.custoProporcional : i.custoTotal),
      0
    );
    const custoProporcionalTotalInsumos = custoProporcionalInsumosCoqueteis + custoProporcionalPerifericos;
    const custoProporcionalTotalEvento = custoProporcionalTotalInsumos + custoTotalServicos;

    return {
      listaInsumosCoqueteis,
      listaPerifericos,
      detalhamentoProducaoPropria,
      listaMateriasPrimasConsolidadas,
      listaServicos,
      custoInsumosCoqueteis,
      custoPerifericos,
      custoTotalInsumos,
      custoRealTotalInsumos,
      lucroTotalInsumos,
      custoTotalServicos,
      custoTotalEvento,
      custoProporcionalInsumosCoqueteis,
      custoProporcionalPerifericos,
      custoProporcionalTotalInsumos,
      custoProporcionalTotalEvento,
      qtdBartenders,
      duracaoHoras,
      numConvidados
    };
  },

  /**
   * Verifica vínculos de um insumo em drinques, sub-receitas e propostas antes de excluir
   */
  verificarUsoInsumo(insumoId) {
    const insumoAlvo = (this.state.insumos || []).find((i) => i.id === insumoId);
    const drinquesAfetados = (this.state.drinques || []).filter((d) =>
      (d.ingredientes || []).some((ing) => ing.insumoId === insumoId && ing.tipoVinculo !== 'GENERICO')
    );
    const subReceitasAfetadas = (this.state.insumos || []).filter(
      (i) => i.id !== insumoId && i.producaoPropria && (i.subReceita || []).some((s) => s.insumoBaseId === insumoId)
    );
    const propostasAfetadas = (this.state.propostas || []).filter((p) =>
      (p.perifericos || []).some((per) => per.insumoId === insumoId)
    );

    return {
      insumoAlvo,
      drinquesAfetados,
      subReceitasAfetadas,
      propostasAfetadas
    };
  },

  /**
   * Exclui um insumo mantendo integridade referencial em drinques, sub-receitas, propostas e checklists
   */
  excluirInsumoComIntegridade(insumoId) {
    const insumoRemovido = (this.state.insumos || []).find((i) => i.id === insumoId);
    if (!insumoRemovido) return false;

    this.state.insumos = (this.state.insumos || []).filter((i) => i.id !== insumoId);

    // 1. Limpar/reatribuir ingredientes de drinques
    (this.state.drinques || []).forEach((d) => {
      if (!Array.isArray(d.ingredientes)) return;
      d.ingredientes = d.ingredientes
        .map((ing) => {
          if (ing.insumoId !== insumoId) return ing;
          if (ing.tipoVinculo === 'GENERICO' && ing.grupoGenerico) {
            const substituto = this.state.insumos.find(
              (i) => i.grupoGenerico && i.grupoGenerico.toLowerCase() === ing.grupoGenerico.toLowerCase()
            );
            return { ...ing, insumoId: substituto ? substituto.id : '' };
          }
          return null;
        })
        .filter(Boolean);
    });

    // 2. Limpar componentes de sub-receitas de outros insumos
    (this.state.insumos || []).forEach((ins) => {
      if (Array.isArray(ins.subReceita)) {
        ins.subReceita = ins.subReceita.filter((comp) => comp.insumoBaseId !== insumoId);
      }
    });

    // 3. Limpar periféricos, ajustes e movimentação de estoque nas propostas salvas e na proposta aberta
    const limparProposta = (p) => {
      if (!p) return;
      if (Array.isArray(p.perifericos)) {
        p.perifericos = p.perifericos.filter((per) => per.insumoId !== insumoId);
      }
      if (p.ajustesInsumosCoqueteis) {
        delete p.ajustesInsumosCoqueteis[insumoId];
      }
      if (p.fatoresConsumoPersonalizados) {
        delete p.fatoresConsumoPersonalizados[insumoId];
      }
      if (p.movimentacaoEstoque) {
        delete p.movimentacaoEstoque[insumoId];
      }
    };

    (this.state.propostas || []).forEach(limparProposta);
    if (window.Aba5Propostas && window.Aba5Propostas.propostaAtual) {
      limparProposta(window.Aba5Propostas.propostaAtual);
    }

    // 4. Limpar marcações de checklists
    Object.values(this.state.checklists || {}).forEach((chk) => {
      if (chk && chk.itensMarcados) {
        delete chk.itensMarcados[insumoId];
      }
    });

    this.save();
    return true;
  },

  /**
   * Exclui um serviço limpando referências em todas as propostas salvas e na proposta em edição
   */
  excluirServicoComIntegridade(servicoId) {
    this.state.servicos = (this.state.servicos || []).filter((s) => s.id !== servicoId);

    const limparServicosProp = (p) => {
      if (p && Array.isArray(p.servicos)) {
        p.servicos = p.servicos.filter((s) => s.servicoId !== servicoId);
      }
    };

    (this.state.propostas || []).forEach(limparServicosProp);
    if (window.Aba5Propostas && window.Aba5Propostas.propostaAtual) {
      limparServicosProp(window.Aba5Propostas.propostaAtual);
    }

    this.save();
    return true;
  },

  /**
   * Exclui um drinque limpando referências no cardápio das propostas salvas e da proposta em edição
   */
  excluirDrinqueComIntegridade(drinqueId) {
    this.state.drinques = (this.state.drinques || []).filter((d) => d.id !== drinqueId);

    const limparCoqueteisProp = (p) => {
      if (p && Array.isArray(p.coqueteis)) {
        p.coqueteis = p.coqueteis.filter((c) => c.drinqueId !== drinqueId);
      }
    };

    (this.state.propostas || []).forEach(limparCoqueteisProp);
    if (window.Aba5Propostas && window.Aba5Propostas.propostaAtual) {
      limparCoqueteisProp(window.Aba5Propostas.propostaAtual);
    }

    this.save();
    return true;
  },

  /**
   * Exclui um cliente limpando o vínculo clienteId nas propostas salvas e na proposta em edição
   */
  excluirClienteComIntegridade(clienteId) {
    this.state.clientes = (this.state.clientes || []).filter((c) => c.id !== clienteId);

    (this.state.propostas || []).forEach((p) => {
      if (p && p.clienteId === clienteId) p.clienteId = '';
    });
    if (window.Aba5Propostas?.propostaAtual?.clienteId === clienteId) {
      window.Aba5Propostas.propostaAtual.clienteId = '';
    }

    this.save();
    return true;
  },

  /**
   * Exclui uma proposta estornando eventual reserva de estoque e limpando checklists órfãos
   */
  excluirPropostaComIntegridade(propostaId) {
    const prop = (this.state.propostas || []).find((p) => p.id === propostaId);
    if (!prop) return false;

    // Se a proposta tinha estoque reservado, devolve os saldos exatos ao estoque da Aba 1
    if (prop.estoqueBaixado && prop.movimentacaoEstoque && typeof prop.movimentacaoEstoque === 'object') {
      Object.entries(prop.movimentacaoEstoque).forEach(([insId, qtdReservada]) => {
        const ins = (this.state.insumos || []).find((i) => i.id === insId);
        const q = Number(qtdReservada);
        if (ins && Number.isFinite(q) && q > 0) {
          ins.estoqueAtual = (Number(ins.estoqueAtual) || 0) + q;
        }
      });
    }

    this.state.propostas = (this.state.propostas || []).filter((p) => p.id !== propostaId);
    if (this.state.checklists) delete this.state.checklists[propostaId];
    if (this.state.checklistsUtensilios) delete this.state.checklistsUtensilios[propostaId];

    if (window.Aba6Checklist && window.Aba6Checklist.propostaSelecionadaId === propostaId) {
      window.Aba6Checklist.propostaSelecionadaId = this.state.propostas[0]?.id || null;
    }
    if (window.Aba7Utensilios && window.Aba7Utensilios.propostaSelecionadaId === propostaId) {
      window.Aba7Utensilios.propostaSelecionadaId = this.state.propostas[0]?.id || null;
    }

    this.save();
    return true;
  },

  /**
   * Calcula a quantidade de bartenders configurada em uma proposta
   */
  calcularBartendersProposta(prop) {
    if (!prop) return 1;
    let qtdBartenders = Number(prop.qtdBartenders) > 0 ? Math.round(Number(prop.qtdBartenders)) : 0;
    if (qtdBartenders <= 0) {
      (prop.servicos || []).forEach((s) => {
        const srv = (this.state.servicos || []).find((sv) => sv.id === s.servicoId);
        const textoSrv = srv ? srv.descricao || srv.nome || '' : '';
        if (srv && /bartender/i.test(textoSrv)) {
          qtdBartenders = Math.max(qtdBartenders, Number(s.quantidade) || 1);
        }
      });
    }
    return qtdBartenders > 0 ? qtdBartenders : 1;
  },

  /**
   * Obtém ou inicializa a estrutura do Checklist de Utensílios de uma Proposta
   * (Inicia vazia até que o usuário importe os utensílios do Ambiente Global ou adicione manualmente)
   */
  obterChecklistUtensilios(propostaId) {
    if (!this.state.checklistsUtensilios) this.state.checklistsUtensilios = {};
    const prop = (this.state.propostas || []).find((p) => p.id === propostaId);
    if (!prop) return null;

    if (!this.state.checklistsUtensilios[propostaId]) {
      this.state.checklistsUtensilios[propostaId] = {
        nomeLista: `Checklist de Utensílios - ${prop.nomeEvento}`,
        itens: []
      };
    }

    return this.state.checklistsUtensilios[propostaId];
  },

  /**
   * Importa utensílios do Ambiente Global (utensiliosPadrao) para o checklist de uma Proposta específica
   */
  importarUtensiliosGlobaisParaProposta(
    propostaId,
    { idsSelecionados = null, dimensionarPorBartenders = true, modo = 'MESCLAR' } = {}
  ) {
    const prop = (this.state.propostas || []).find((p) => p.id === propostaId);
    if (!prop) return null;

    const checklist = this.obterChecklistUtensilios(propostaId);
    if (!checklist) return null;

    const qtdBartenders = this.calcularBartendersProposta(prop);
    const globais = Array.isArray(this.state.utensiliosPadrao) ? this.state.utensiliosPadrao : [];
    const conjuntoIds = Array.isArray(idsSelecionados) ? new Set(idsSelecionados) : null;
    const origem = conjuntoIds ? globais.filter((u) => conjuntoIds.has(u.id)) : globais;

    if (modo === 'SUBSTITUIR') {
      checklist.itens = [];
    }

    let adicionados = 0;
    let ignorados = 0;
    const agora = Date.now();

    origem.forEach((ut, index) => {
      const qtdBase = Math.max(1, Math.round(Number(ut.quantidadeBase) || 1));
      const temFator = Boolean(ut.temFator !== undefined ? ut.temFator : ut.porBartender);
      const fatorBartender = temFator ? Math.max(1, Math.round(Number(ut.fatorBartender || ut.quantidadeBase || 1))) : 0;
      const qtdNecessaria =
        dimensionarPorBartenders && temFator ? Math.max(1, Math.round(fatorBartender * qtdBartenders)) : qtdBase;
      const acervoDisp =
        ut.qtdTenho !== undefined && Number.isFinite(Number(ut.qtdTenho)) && Number(ut.qtdTenho) >= 0
          ? Math.round(Number(ut.qtdTenho))
          : 0;
      const qtdTenho = acervoDisp;

      if (modo === 'MESCLAR') {
        const itemExistente = (checklist.itens || []).find(
          (it) =>
            (it.utensilioGlobalId && it.utensilioGlobalId === ut.id) ||
            (it.descricao || '').trim().toLowerCase() === (ut.descricao || '').trim().toLowerCase()
        );
        if (itemExistente) {
          // Atualiza o saldo que tem no acervo e as regras do acervo global para o item existente
          itemExistente.qtdTenho = qtdTenho;
          itemExistente.qtdTenhoManual = false;
          if (!itemExistente.utensilioGlobalId) {
            itemExistente.utensilioGlobalId = ut.id;
          }
          itemExistente.temFator = temFator;
          itemExistente.porBartender = temFator;
          itemExistente.fatorBartender = fatorBartender;
          if (temFator && dimensionarPorBartenders) {
            itemExistente.quantidade = Math.max(1, Math.round(fatorBartender * qtdBartenders));
          }
          ignorados += 1;
          return;
        }
      }

      checklist.itens.push({
        id: `ut-item-${agora}-${index}`,
        utensilioGlobalId: ut.id,
        descricao: ut.descricao,
        categoria: ut.categoria || 'Outros',
        quantidade: qtdNecessaria,
        qtdTenho,
        qtdTenhoManual: false,
        temFator,
        porBartender: temFator,
        fatorBartender,
        pendente: Boolean(ut.pendente),
        unidade: ut.unidade || 'un',
        conferidoIda: false,
        conferidoVolta: false,
        observacoes: ut.observacoes || ''
      });
      adicionados += 1;
    });

    checklist.nomeLista = checklist.nomeLista || `Checklist de Utensílios - ${prop.nomeEvento}`;
    checklist.inicializado = true;
    checklist.limpoManualmente = checklist.itens.length === 0;
    this.state.checklistsUtensilios[propostaId] = checklist;
    this.save();

    return {
      adicionados,
      ignorados,
      total: checklist.itens.length,
      qtdBartenders
    };
  },

  /**
   * Recalcula a quantidade de utensílios de uma proposta quando o número de bartenders é alterado.
   * Apenas itens COM FATOR por bartender são multiplicados; itens SEM FATOR (uso da equipe) permanecem fixos.
   */
  recalcularUtensiliosPropostaPorBartenders(propostaId, novoQtdBartenders = null) {
    const prop = (this.state.propostas || []).find((p) => p.id === propostaId);
    if (!prop) return false;
    const checklist = this.obterChecklistUtensilios(propostaId);
    if (!checklist || !Array.isArray(checklist.itens) || checklist.itens.length === 0) return false;

    const bartenders = novoQtdBartenders !== null && Number(novoQtdBartenders) > 0
      ? Math.round(Number(novoQtdBartenders))
      : this.calcularBartendersProposta(prop);

    let alterou = false;
    checklist.itens.forEach((it) => {
      const temFator = Boolean(it.temFator !== undefined ? it.temFator : it.porBartender);
      if (temFator) {
        let fator = Number(it.fatorBartender);
        if (!Number.isFinite(fator) || fator <= 0) {
          if (it.utensilioGlobalId) {
            const globalRef = (this.state.utensiliosPadrao || []).find((g) => g.id === it.utensilioGlobalId);
            if (globalRef) {
              fator = Number(globalRef.fatorBartender || globalRef.quantidadeBase) || 1;
            }
          }
        }
        if (!Number.isFinite(fator) || fator <= 0) {
          fator = Number(it.quantidadeBase) || 1;
        }
        fator = Math.max(1, Math.round(fator));
        it.temFator = true;
        it.porBartender = true;
        it.fatorBartender = fator;

        const novaQtd = Math.max(1, Math.round(fator * bartenders));
        if (it.quantidade !== novaQtd) {
          it.quantidade = novaQtd;
          alterou = true;
        }
      } else {
        it.temFator = false;
        it.porBartender = false;
        it.fatorBartender = 0;
      }
    });

    if (alterou) {
      this.save();
    }
    return alterou;
  },

  /**
   * Sincroniza o saldo que tem no acervo global para todos os itens do checklist da proposta
   */
  sincronizarUtensiliosComAcervoGlobal(propostaId, { respeitarManual = false } = {}) {
    const prop = (this.state.propostas || []).find((p) => p.id === propostaId);
    if (!prop) return 0;
    const checklist = this.obterChecklistUtensilios(propostaId);
    if (!checklist || !Array.isArray(checklist.itens) || checklist.itens.length === 0) return 0;

    const globais = Array.isArray(this.state.utensiliosPadrao) ? this.state.utensiliosPadrao : [];
    if (globais.length === 0) return 0;

    const mapaGlobaisId = new Map(globais.map((g) => [g.id, g]));
    const mapaGlobaisNome = new Map(
      globais.map((g) => [String(g.descricao || '').trim().toLowerCase(), g])
    );

    let sincronizados = 0;
    checklist.itens.forEach((it) => {
      if (respeitarManual && it.qtdTenhoManual) return;

      const g = (it.utensilioGlobalId && mapaGlobaisId.get(it.utensilioGlobalId)) ||
                mapaGlobaisNome.get(String(it.descricao || '').trim().toLowerCase());
      if (g) {
        if (!it.utensilioGlobalId) it.utensilioGlobalId = g.id;
        if (g.qtdTenho !== undefined && Number.isFinite(Number(g.qtdTenho))) {
          const novoTenho = Math.max(0, Math.round(Number(g.qtdTenho)));
          if (!respeitarManual) {
            it.qtdTenhoManual = false;
          }
          if (it.qtdTenho !== novoTenho) {
            it.qtdTenho = novoTenho;
            sincronizados += 1;
          }
        }
      }
    });

    if (sincronizados > 0 || !respeitarManual) {
      this.save();
    }
    return sincronizados;
  },

  /**
   * Salva o Checklist de Utensílios de um Evento
   */
  salvarChecklistUtensilios(propostaId, dados) {
    if (!this.state.checklistsUtensilios) this.state.checklistsUtensilios = {};
    if (dados && typeof dados === 'object') {
      dados.inicializado = true;
      dados.limpoManualmente = Array.isArray(dados.itens) && dados.itens.length === 0;
    }
    this.state.checklistsUtensilios[propostaId] = dados;
    this.save();
  },

  /**
   * Exporta/copia utensílios de uma Proposta para o Acervo Global (utensiliosPadrao)
   * Permite reaproveitar todos os utensílios cadastrados em um evento no acervo permanente
   */
  exportarUtensiliosPropostaParaGlobal(
    propostaId,
    { idsSelecionados = null, atualizarExistentes = false } = {}
  ) {
    const checklist = this.obterChecklistUtensilios(propostaId);
    if (!checklist || !Array.isArray(checklist.itens) || checklist.itens.length === 0) {
      return { adicionados: 0, atualizados: 0, mantidos: 0, total: 0 };
    }

    if (!Array.isArray(this.state.utensiliosPadrao)) {
      this.state.utensiliosPadrao = [];
    }
    if (!Array.isArray(this.state.categoriasUtensilios)) {
      this.state.categoriasUtensilios = [];
    }

    const conjuntoIds = Array.isArray(idsSelecionados) ? new Set(idsSelecionados) : null;
    const itensAlvo = conjuntoIds
      ? checklist.itens.filter((it) => conjuntoIds.has(it.id))
      : checklist.itens;

    let adicionados = 0;
    let atualizados = 0;
    let mantidos = 0;
    const agora = Date.now();

    itensAlvo.forEach((it, index) => {
      const descLimpa = String(it.descricao || '').trim();
      if (!descLimpa) return;

      const catLimpa = String(it.categoria || 'Outros').trim() || 'Outros';
      if (!this.state.categoriasUtensilios.some((c) => c.toLowerCase() === catLimpa.toLowerCase())) {
        this.state.categoriasUtensilios.push(catLimpa);
      }

      // Procurar se já existe no acervo global (por ID vinculado ou por nome idêntico)
      let globalExistente = this.state.utensiliosPadrao.find(
        (u) =>
          (it.utensilioGlobalId && u.id === it.utensilioGlobalId) ||
          String(u.descricao || '').trim().toLowerCase() === descLimpa.toLowerCase()
      );

      const qtdEvento = Math.max(1, Math.round(Number(it.quantidade) || 1));
      const temFator = Boolean(it.temFator !== undefined ? it.temFator : it.porBartender);
      const fatorBartender = temFator ? Math.max(1, Math.round(Number(it.fatorBartender || 1))) : 0;
      const tenhoEvento =
        it.qtdTenho !== undefined && Number.isFinite(Number(it.qtdTenho)) && Number(it.qtdTenho) >= 0
          ? Math.round(Number(it.qtdTenho))
          : qtdEvento;

      if (globalExistente) {
        if (atualizarExistentes) {
          globalExistente.categoria = catLimpa;
          globalExistente.unidade = it.unidade || globalExistente.unidade || 'un';
          globalExistente.quantidadeBase = temFator ? fatorBartender : qtdEvento;
          globalExistente.temFator = temFator;
          globalExistente.porBartender = temFator;
          globalExistente.fatorBartender = fatorBartender;
          globalExistente.qtdTenho = tenhoEvento;
          if (it.observacoes) globalExistente.observacoes = it.observacoes;
          atualizados++;
        } else {
          mantidos++;
        }
        it.utensilioGlobalId = globalExistente.id;
      } else {
        const novoId = `ut-global-${agora}-${index}`;
        this.state.utensiliosPadrao.push({
          id: novoId,
          descricao: descLimpa,
          categoria: catLimpa,
          unidade: it.unidade || 'un',
          quantidadeBase: temFator ? fatorBartender : qtdEvento,
          qtdTenho: tenhoEvento,
          temFator,
          porBartender: temFator,
          fatorBartender,
          pendente: Boolean(it.pendente),
          observacoes: it.observacoes || ''
        });
        it.utensilioGlobalId = novoId;
        adicionados++;
      }
    });

    this.save();

    return {
      adicionados,
      atualizados,
      mantidos,
      total: this.state.utensiliosPadrao.length
    };
  },

  /**
   * Restaura os utensílios da proposta reimportando todo o kit do Ambiente Global dimensionado pela equipe
   */
  resetarChecklistUtensiliosParaPadrao(propostaId) {
    if (!this.state.checklistsUtensilios) this.state.checklistsUtensilios = {};
    this.importarUtensiliosGlobaisParaProposta(propostaId, {
      dimensionarPorBartenders: true,
      modo: 'SUBSTITUIR'
    });
    return this.obterChecklistUtensilios(propostaId);
  },

  /**
   * Conta quantos utensílios (no Ambiente Global e nas Propostas) utilizam determinada categoria
   */
  contarUsoCategoriaUtensilio(nomeCategoria) {
    const alvo = String(nomeCategoria || '').trim().toLowerCase();
    const global = (this.state.utensiliosPadrao || []).filter(
      (u) => String(u.categoria || '').trim().toLowerCase() === alvo
    ).length;

    let propostas = 0;
    Object.values(this.state.checklistsUtensilios || {}).forEach((chk) => {
      (chk?.itens || []).forEach((it) => {
        if (String(it.categoria || '').trim().toLowerCase() === alvo) {
          propostas += 1;
        }
      });
    });

    return { global, propostas, total: global + propostas };
  },

  /**
   * Cria uma nova categoria de utensílios
   */
  adicionarCategoriaUtensilio(nome) {
    const limpo = String(nome || '').trim();
    if (!limpo) return { ok: false, erro: 'Informe o nome da categoria.' };

    if (!Array.isArray(this.state.categoriasUtensilios)) {
      this.state.categoriasUtensilios = [...INITIAL_MOCK_DATA.categoriasUtensilios];
    }

    if (this.state.categoriasUtensilios.some((c) => c.toLowerCase() === limpo.toLowerCase())) {
      return { ok: false, erro: 'Já existe uma categoria com este nome.' };
    }

    const idxOutros = this.state.categoriasUtensilios.findIndex((c) => c.toLowerCase() === 'outros');
    if (idxOutros >= 0) {
      this.state.categoriasUtensilios.splice(idxOutros, 0, limpo);
    } else {
      this.state.categoriasUtensilios.push(limpo);
    }

    this.save();
    return { ok: true, categoria: limpo };
  },

  /**
   * Renomeia uma categoria existente propagando para o Ambiente Global e todas as Propostas
   */
  renomearCategoriaUtensilio(nomeAntigo, nomeNovo) {
    const antigo = String(nomeAntigo || '').trim();
    const novo = String(nomeNovo || '').trim();
    if (!novo) return { ok: false, erro: 'O novo nome da categoria não pode ser vazio.' };

    const lista = this.state.categoriasUtensilios || [];
    const idx = lista.findIndex((c) => c === antigo);
    if (idx === -1) return { ok: false, erro: 'Categoria original não encontrada.' };

    const conflito = lista.some((c, i) => i !== idx && c.toLowerCase() === novo.toLowerCase());
    if (conflito) return { ok: false, erro: 'Já existe outra categoria com este nome.' };

    lista[idx] = novo;

    (this.state.utensiliosPadrao || []).forEach((ut) => {
      if (ut.categoria === antigo) ut.categoria = novo;
    });

    Object.values(this.state.checklistsUtensilios || {}).forEach((chk) => {
      (chk?.itens || []).forEach((it) => {
        if (it.categoria === antigo) it.categoria = novo;
      });
    });

    this.save();
    return { ok: true, categoria: novo };
  },

  /**
   * Exclui uma categoria movendo eventuais utensílios vinculados para uma categoria de destino
   */
  excluirCategoriaUtensilio(nome, categoriaDestino = 'Outros') {
    const alvo = String(nome || '').trim();
    const lista = this.state.categoriasUtensilios || [];
    if (lista.length <= 1) {
      return { ok: false, erro: 'Mantenha pelo menos uma categoria cadastrada.' };
    }

    const idx = lista.findIndex((c) => c === alvo);
    if (idx === -1) return { ok: false, erro: 'Categoria não encontrada.' };

    lista.splice(idx, 1);

    let destino = String(categoriaDestino || '').trim();
    if (!destino || destino === alvo || !lista.includes(destino)) {
      destino = lista.find((c) => c.toLowerCase() === 'outros') || lista[0];
    }

    (this.state.utensiliosPadrao || []).forEach((ut) => {
      if (ut.categoria === alvo) ut.categoria = destino;
    });

    Object.values(this.state.checklistsUtensilios || {}).forEach((chk) => {
      (chk?.itens || []).forEach((it) => {
        if (it.categoria === alvo) it.categoria = destino;
      });
    });

    this.save();
    return { ok: true, destino };
  }
};

// Inicializar Store imediatamente
window.Store.init();
