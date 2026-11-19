# Especificação de Sistema: Calculador de Eventos
**Categoria:** Catering & Event Management Software (Foco em Coquetelaria e Bar)

---

## 1. Visão Geral e Diretrizes de Design (UI/UX)
* **Nome da Ferramenta:** Calculador de Eventos
* **Plataforma (Híbrida):** 
  * **Navegador (Web App):** Acesso rápido de qualquer dispositivo.
  * **Nativo (Desktop/Mobile):** Construção via **PWA (Progressive Web App)** ou **Tauri/Electron**, garantindo funcionamento offline e instalação direta no computador ou celular.
* **Estilo Visual:** Minimalista, limpo, focado em produtividade e resposta rápida.
* **Paleta de Cores:** 
  * Fundo predominante: Branco (`#FFFFFF`) e Cinza Gelo (`#F8FAFC`) para áreas secundárias.
  * Cor Principal (Ações e Destaques): Azul Royal (`#2563EB`) e Azul Escuro (`#1E40AF`) para textos de destaque e menus.
* **Iconografia:** Uso extensivo de **pictogramas** (ex: bibliotecas *Lucide Icons* ou *Phosphor Icons* com traço fino) para substituir textos longos em botões e cabeçalhos de tabelas, mantendo a estética minimalista.

---

## 2. Estrutura de Módulos (Abas do Sistema)

### 📦 Aba 1: Controle e Cadastro de Produtos/Insumos
Módulo responsável pela base de dados de todos os itens físicos (bebidas, frutas, xaropes, descartáveis, gelo, etc.).

* **Campos do Cadastro:**
  * `Código` (Gerado automaticamente ou inserido manualmente / SKU).
  * `Descrição` (Ex: Gin Tanqueray, Limão Tahiti, Canudo Biodegradável).
  * `Unidade de Medida` (ml, L, g, kg, un, pct).
  * `Categoria` (Destilados, Licores, Frutas, Periféricos, Gelo, etc.).
  * `Saldo em Estoque` (Quantidade atual disponível).
  * `Classificação de Linha`:
    * Seletor: **Linha A (Premium)** | **Linha B (Padrão)** | **Linha C (Econômica)**.
    * Checkbox `[x] Insumo sem linha (Uso Comum)`: Para itens universais como gelo, açúcar, canudos, frutas e guardanapos.
  * `Fornecedores e Custos (Múltiplos)`:
    * Possibilidade de adicionar $N$ fornecedores para o mesmo insumo (Ex: Fornecedor A - R$ 89,90 | Fornecedor B - R$ 95,00).
    * **Destaque automático** para o fornecedor de menor custo e opção de definir qual é o "Custo Base" para os cálculos.
* **Funcionalidades Extras:**
  * **Importação em Massa:** Botão para upload de planilha (`.xlsx` ou `.csv`) para cadastro e atualização automática de preços e estoques.

---

### 🧑‍🍳 Aba 2: Cadastro de Serviços
Módulo para precificação de mão de obra, estrutura e logística.

* **Campos do Cadastro:**
  * `Descrição do Serviço` (Ex: Bartender, Barback, Copeiro, Frete/Logística, Aluguel de Balcão).
  * `Categoria` (Opção de criar e selecionar categorias: Mão de Obra, Transporte, Estrutura, Taxas).
  * `Valor Unitário` (Custo por diária, por hora ou taxa fixa).
  * `Observações` (Ex: "Bartender para até 50 convidados", "Frete até 30km").

---

### 🍸 Aba 3: Criação de Drinques (Montagem Dinâmica)
Abordagem visual e prática para criação do cardápio, focada na montagem direta e não em uma ficha técnica engessada.

* **Campos do Cadastro:**
  * `Nome do Drinque` (Ex: Moscow Mule, Gin Tônica Tropical).
  * `Foto do Drinque (Proporção 1:1 / 4:4)`: Área de upload com recorte quadrado automático. *Se nenhuma foto for enviada, exibir um pictograma elegante de uma taça minimalista em tom azul claro.*
  * `Perfil Sensorial` (Tags rápidas ou texto livre: Cítrico, Doce, Seco, Refrescante, Amargo, Encorpado).
  * `Guarnição` (Ex: Espuma de gengibre e raspa de limão).
  * `Construtor de Ingredientes (Insumos)`:
    * Busca rápida para adicionar insumos cadastrados na Aba 1.
    * Definição da dosagem por drinque (Ex: 50ml de Vodka, 20ml de Suco de Limão).
    * *Nota inteligente:* Permitir vincular um "Insumo Genérico" (ex: Gin) para que a escolha da Linha (A, B ou C) lá na proposta defina qual marca e preço serão usados, ou fixar um insumo específico.

---

### 👥 Aba 4: Cadastro de Clientes (CRM Simples)
Base enxuta para reaproveitamento de dados nas propostas.

* **Campos do Cadastro:**
  * `Nome Completo / Empresa`
  * `Contato` (Telefone / WhatsApp com máscara de formatação).
  * `E-mail`
  * `Observações` (Preferências do cliente, restrições, histórico).

---

### 📄 Aba 5: Criar Nova Proposta (Orçamentador)
O coração do sistema, onde todas as abas anteriores se conectam para gerar o orçamento e planejar o evento.

* **Cabeçalho do Evento:**
  * `Cliente`: Campo de busca (Dropdown) puxando da Aba 4 (com botão `+` rápido caso precise cadastrar na hora).
  * `Nome do Evento` (Ex: Casamento Juliana & Pedro).
  * `Data do Evento` e `Duração (em horas)`.
  * `Local do Evento`.
  * `Número de Convidados`.
  * `Seleção da Linha de Insumos`: **Linha A (Premium)**, **Linha B (Padrão)** ou **Linha C (Econômica)**. *(Ao selecionar a linha, o sistema filtra ou precifica os insumos dos drinques automaticamente com base nessa escolha).*
* **Composição do Evento:**
  * **Coquetéis:** Seleção dos drinques cadastrados na Aba 3.
  * **Serviços:** Adição de equipe e logística da Aba 2 (definindo a quantidade de profissionais).
  * **Lista de Insumos dos Coquetéis:** Carregada automaticamente com base nos drinques escolhidos e no volume estimado para o número de convidados. (Editável caso o usuário queira ajustar quantidades manualmente).
  * **Insumos Periféricos/Outros:** Campo para adicionar canudos, guardanapos, copos descartáveis, gelo extra, etc.
* **Resumo Financeiro (Visão Interna):**
  * `Custo Total de Insumos` (Drinques + Periféricos).
  * `Custo Total de Serviços`.
  * `Custo Total do Evento`:
    $$\text{Custo Total} = \text{Custo de Insumos} + \text{Custo de Serviços}$$
  * `Valor da Proposta (Preço de Venda)`: Campo editável ou calculado por margem/markup.
  * `Valor por Convidado`:
    $$\text{Valor por Convidado} = \frac{\text{Valor da Proposta}}{\text{Número de Convidados}}$$
* **Ações:**
  * **Salvar Proposta** (Fica registrada no histórico para consulta ou edição).
  * **Exportar em PDF (Visão do Cliente):** Gera um documento com layout minimalista (Branco e Azul) ocultando todos os custos internos, exibindo **apenas**:
    * Nome do Evento e Nome do Cliente.
    * Data, Local, Duração e Quantidade de Convidados.
    * Cardápio de Drinques selecionados (com fotos, perfil sensorial e guarnição).
    * Valor Total da Proposta (e opcionalmente o valor por convidado).

---

### ✅ Aba 6: Checklist e Lista de Compras
Ferramenta operacional para garantir que nada falte no evento e controlar o que precisa ser comprado.

* **Cabeçalho da Aba:**
  * `Campo de Busca do Evento`: Ao selecionar um evento salvo na Aba 5, o sistema consolida automaticamente todos os ingredientes dos drinques + insumos periféricos daquele evento.
  * `Nome da Lista`: Preenchido automaticamente (Ex: *Checklist - Casamento Juliana & Pedro*), mas editável.
* **Tabela de Controle (Colunas):**
  1. `Check [ ]`: Caixa de marcação visual para conferência física.
  2. `Descrição`: Nome do insumo/produto.
  3. `Unidade`: un, L, kg, garrafa, etc.
  4. `Quant. Necessária`: Total exigido pelo evento.
  5. `Estoque Atual`: Puxado automaticamente da Aba 1.
  6. `A Comprar`: Cálculo automático da necessidade de compra:
     $$\text{A Comprar} = \max(0, \text{Quant. Necessária} - \text{Estoque Atual})$$
  7. `Custo Estimado`: Cálculo baseado no menor preço de fornecedor ou custo padrão:
     $$\text{Custo Estimado} = \text{A Comprar} \times \text{Custo Unitário do Insumo}$$
* **Ações:**
  * **Exportar Lista:** Gera arquivo em PDF ou Excel/CSV (ideal para enviar diretamente aos fornecedores ou levar às compras).

---

## 3. 🚀 Sugestões de Melhorias (Adicionadas ao Escopo)

Para tornar o **Calculador de Eventos** ainda mais completo e evitar prejuízos operacionais, sugiro incorporar as seguintes funcionalidades ao desenvolvimento:

1. **Parâmetro de Consumo Médio (Fator de Cálculo de Drinques):**
   * Na **Aba 5 (Proposta)**, quando você coloca "100 convidados" e escolhe "4 drinques", o sistema precisa saber quantos drinques serão feitos no total para calcular os insumos.
   * *Melhoria:* Adicionar um campo **"Média de Drinques por Pessoa"** (ex: padrão de $3,5$ drinques por convidado) ou uma regra baseada nas horas de festa. Assim, para 100 pessoas, o sistema calcula insumos para 350 drinques divididos entre as opções escolhidas.

2. **Conversão de Unidades (Dose vs. Garrafa):**
   * Nos drinques (Aba 3), você usa mililitros ($50\text{ ml}$ de Gin). Na compra e no estoque (Aba 1 e 6), você compra em **Garrafas** ($750\text{ ml}$ ou $1000\text{ ml}$).
   * *Melhoria:* No cadastro de insumos, adicionar o campo "Volume da Embalagem". Assim, se o evento precisa de $3200\text{ ml}$ de Gin de $750\text{ ml}$, o Checklist já arredonda para cima e avisa que você precisa de **5 garrafas** ($3750\text{ ml}$).

3. **Simulador de Margem de Lucro e Impostos (Na Proposta):**
   * No Resumo Financeiro da Aba 5, incluir um campo de **Margem de Lucro Desejada (%)**, **Taxa de Segurança/Quebra (%)** (para cobrir copos quebrados ou desperdício de frutas) e **Imposto (%)**. Isso ajuda a sugerir o *Valor da Proposta* automaticamente sem você precisar fazer contas por fora.

4. **Status da Proposta e Baixa Automática de Estoque:**
   * Adicionar status na proposta: `Em Aberto`, `Aprovada`, `Realizada`, `Cancelada`.
   * *Melhoria:* Quando você mudar o status para **"Aprovada"** ou clicar em um botão "Reservar Estoque" lá no Checklist, o sistema já desconta ou reserva aqueles itens do seu saldo da Aba 1 para que você não conte com o mesmo estoque para dois eventos no mesmo final de semana.

5. **Dimensionamento Automático de Equipe (Opcional):**
   * Na Aba 2 (Serviços), permitir configurar uma regra simples, como: *1 Bartender a cada 50 convidados*. Ao digitar 150 convidados na proposta, o sistema já sugere 3 Bartenders automaticamente.