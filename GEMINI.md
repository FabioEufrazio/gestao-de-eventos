# Diretrizes do Projeto — Gestão de Eventos

## 1. Identidade e Domínio
- **Nome do Projeto**: Gestão de Eventos (PWA para coquetelaria, catering e gestão de eventos).
- **Stack**: HTML5, TailwindCSS (CDN), JavaScript Modular puro (Vanilla), SheetJS, jsPDF, Service Worker.

## 2. Persistência de Dados & LocalStorage
- A chave de persistência no `localStorage` é:
  `STORAGE_KEY = 'CALCULADOR_EVENTOS_V4_DATA'` (definida em `js/store.js`).
- **CRÍTICO**: Nunca altere ou renomeie esta chave sem uma rotina explícita de migração de dados, pois ela guarda todos os clientes, orçamentos, drinques e insumos cadastrados pelo usuário no navegador.

## 3. Fluxo de Git e Controle de Versão
- **Execução no Terminal**: O usuário prefere executar os comandos do Git (commit, push, checkout, merge) diretamente no seu próprio terminal.
- **Papel do Assistente**: Preparar as alterações de código, atualizar arquivos de documentação/configuração e fornecer os blocos de comandos de terminal claros e prontos para cópia.
- **Estrutura de Branches**:
  - `main`: Código estável / produção.
  - `dev`: Branch padrão para desenvolvimento ativo.
- **Regra de Push**: Sempre garantir que a branch foi criada localmente (`git checkout -b <nome>`) antes de instruir o `git push -u origin <nome>`, prevenindo o erro de refspec.
