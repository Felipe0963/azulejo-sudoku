# Azulejo — Sudoku: design

Status: em revisão
Projeto: `projetos/sudoku`
Roteiro seguido: `projetos/roteiro-jogos/roteiro.md`
Idioma do jogo: inglês
Idioma da documentação: português

## 1. Visão geral

Um Sudoku clássico de navegador apresentado como um painel de **azulejos portugueses**. Cada bloco 3×3 resolvido corretamente é "vitrificado" e revela uma parte de um mural; ao terminar o puzzle, o mural fica completo.

Peça de portfólio: mostra um motor de Sudoku próprio (gerador, solucionador e classificador de dificuldade por técnicas), interface em Vue 3 + TypeScript, acessibilidade e testes.

As regras são as do Sudoku clássico, que é de domínio público. A identidade vem da apresentação e da recompensa visual.

## 2. Regras

### Tabuleiro

- 9×9, em 9 blocos de 3×3.
- Cada linha, coluna e bloco deve ter os números de 1 a 9 sem repetir.

### Níveis

| Nível | Técnicas que o puzzle exige (a mais difícil define o nível) |
|---|---|
| Easy | Casa única (naked single) |
| Medium | + Número único no grupo (hidden single) |
| Hard | + Eliminação bloco–linha (pointing/claiming) e pares (naked pair) |
| Expert | + Pares ocultos (hidden pair) e X-Wing |

- Todo puzzle tem **exatamente uma solução**.
- O nível de um puzzle é a técnica mais difícil necessária para resolvê-lo usando as técnicas em ordem, da mais simples para a mais difícil. Puzzles que essas técnicas não resolvem não entram no banco.
- Os puzzles vêm de um banco gerado pelo próprio projeto (cerca de 100 por nível). A URL aceita `?level=hard&seed=123` para escolher o mesmo puzzle de novo.
- A semente da URL vale só para abrir a partida. Depois de começar uma partida (pela URL, escolhendo um nível, com `Play again` ou com `Continue`), a URL passa a mostrar `?level=<nível>&seed=<semente>` dessa partida, para recarregar a página voltar a ela. Escolher um nível no início sempre sorteia uma semente nova. Na tela de início, a URL fica sem parâmetros.
- Se, ao abrir pela URL, existe uma partida salva do mesmo nível e do mesmo puzzle, ela continua de onde parou.

### Jogadas

- Selecionar uma casa: clique, toque ou setas.
- Colocar um número: teclas 1–9 ou teclado numérico na tela.
- Apagar: Delete, Backspace ou botão de apagar.
- **Anotações:** modo para marcar candidatos pequenos na casa. A tecla N liga e desliga o modo.
- Ao colocar um número, ele sai das anotações da mesma linha, coluna e bloco.
- **Desfazer e refazer** qualquer jogada (Ctrl/Cmd+Z e Ctrl/Cmd+Shift+Z ou Ctrl+Y, ou botões). O histórico não é salvo: ao recarregar, a partida continua, mas desfazer e refazer recomeçam vazios.
- Os atalhos valem em toda a tela de jogo (mesmo com o foco num botão), menos com a pausa ou a vitória abertas.
- Números do puzzle original não podem ser alterados.

### Validação

- **Conflitos** aparecem na hora: casas com o mesmo número na mesma linha, coluna ou bloco ficam marcadas.
- O jogo **não** compara os números com a solução, a não ser para vitrificar um painel completo.

### Vitrificação

- Um bloco completo e igual à solução é **vitrificado**: os números passam a fazer parte do padrão do azulejo.
- Um painel vitrificado não pode mais ser editado.
- A vitrificação é **permanente**: desfazer e refazer não mexem nas casas de um painel vitrificado. Jogadas que eram só dentro dele são puladas pelo desfazer e pelo refazer.
- Os 9 painéis juntos formam o mural.

### Dica

- Revela o número correto da casa selecionada, se ela está vazia ou errada. Sem casa selecionada (ou com uma casa já certa, do puzzle ou vitrificada), revela a primeira casa **vazia** em ordem de leitura fora de painel vitrificado; só sem casa vazia, corrige a primeira casa errada.
- O número de dicas usadas aparece no resultado. Desfazer uma dica tira o número, mas a dica continua contada.

### Tempo e progresso

- Cronômetro que pausa com a aba oculta e na tela de pausa. Uma pausa pedida pelo jogador não termina sozinha quando a aba volta.
- Melhor tempo salvo por nível (`localStorage`).
- A partida em andamento é salva sozinha e pode ser retomada.
- Se o armazenamento falhar, o jogo funciona sem salvar.

### Fim

- Quando todas as casas estão preenchidas sem conflito (o que, com solução única, é a solução), aparece a tela de vitória.

### Fora do escopo

- Desafio do dia, variantes de Sudoku, estatísticas detalhadas, explicação da técnica na dica e som.

## 3. Visual: a parede de azulejos

O tabuleiro é um painel de azulejos numa parede caiada. Cada casa é um azulejo, cada bloco é um painel, e as linhas grossas entre os blocos são o rejunte. Tema claro, com luz de dia.

### Cores

| Token | Uso |
|---|---|
| `--wall` | Cal da parede ao redor do painel |
| `--glaze` | Branco frio de faiança, com um toque de azul: fundo dos azulejos |
| `--grout` | Rejunte entre os blocos |
| `--cobalt` | Azul-cobalto: números do puzzle, padrões e destaques |
| `--cobalt-deep` | Azul escuro: números colocados pelo jogador |
| `--veil` | Azul muito claro: linha, coluna e bloco da casa selecionada |
| `--ochre` | Ocre de azulejo antigo: conflitos |

Contraste mínimo de 4,5:1 para todos os números e textos, inclusive os números brancos sobre o padrão dos painéis vitrificados.

### Estados das casas

| Estado | Aparência |
|---|---|
| Número do puzzle | Cobalto, peso regular |
| Número do jogador | Cobalto escuro, Atkinson Hyperlegible em negrito (forma e peso diferentes do número do puzzle, não só a cor) |
| Selecionada | Contorno cobalto grosso |
| Mesma linha, coluna ou bloco | Véu azul claro |
| Mesmo número | Destaque sutil |
| Conflito | Fundo ocre e sublinhado tracejado |
| Anotações | Números pequenos numa grade 3×3 dentro da casa |
| Vitrificada | Número branco sobre o padrão azul, com brilho de esmalte e um halo cobalto sutil sob o número |
| Conflito numa casa vitrificada | Número branco, anel e sublinhado tracejado em ocre claro |

### Tipografia

- **Números:** Young Serif nos números do puzzle, no teclado e no cronômetro (algarismos tabulares); Atkinson Hyperlegible em negrito nos números do jogador. Sem itálico nem negrito sintéticos (`font-synthesis: none`).
- **Interface:** Atkinson Hyperlegible.
- Fontes servidas pelo próprio site (Fontsource).

### Mural

- Um único padrão em SVG, gerado em código (uma rosácea com volutas), que atravessa o tabuleiro inteiro.
- Cada painel vitrificado revela o seu nono do padrão.

### Layout

- **Celular:** nível, cronômetro e pausa no topo; tabuleiro na largura da tela; ferramentas (desfazer, refazer, apagar, anotações, dica); teclado de 1 a 9 com a quantidade que falta de cada número.
- **Computador:** tabuleiro à esquerda; nível, cronômetro, ferramentas e teclado à direita.
- O jogo cabe na tela sem rolagem em 1280×800, 1440×900 e no celular.

### Animações

| Momento | Animação |
|---|---|
| Colocar número | Pequena pressão de carimbo |
| Conflito | Tremor leve, uma vez |
| Vitrificar | Brilho de forno atravessando o painel; padrão surgindo do centro |
| Vitória | Os 9 painéis brilham em sequência e a tela de vitória entra (ela espera a sequência) |
| Seleção | Véu aparecendo suavemente |

- **Movimento reduzido:** sem tremor nem brilho atravessando; só transições curtas de opacidade; o padrão aparece direto.
- **Contraste durante as animações:** ao vitrificar, cada casa mantém o fundo de faiança e o número escuro até o padrão cobri-la inteira; o brilho é fraco o bastante para o número branco ficar ≥ 4,5:1 em todos os quadros.

### Telas

1. **Início:** título, botão de continuar (se houver partida salva) e os quatro níveis em azulejos grandes.
2. **Jogo:** tabuleiro, ferramentas e teclado numérico.
3. **Pausa:** o tabuleiro fica coberto e o cronômetro para. O resto do jogo fica inerte e o foco fica no `Resume`; ao retomar, o foco volta para a casa selecionada (ou para o tabuleiro).
4. **Vitória:** mural completo, tempo, nível, dicas usadas, melhor tempo e botões para jogar de novo ou mudar de nível.

## 4. Textos (inglês)

| Onde | Texto |
|---|---|
| Título | `Azulejo` |
| Subtítulo | `Sudoku, glazed one panel at a time.` |
| Escolha de nível | `Choose a level` |
| Níveis | `Easy` · `Medium` · `Hard` · `Expert` |
| Continuar | `Continue` (com nível e tempo, ex.: `Hard · 04:12`) |
| Aviso ao começar outra | `Starting a new game replaces the one in progress.` |
| Cronômetro | `Time` |
| Ferramentas | `Undo` · `Redo` · `Erase` · `Notes` · `Hint` |
| Modo de anotações (leitor de tela) | `Notes on` · `Notes off` (anunciados na região `aria-live` ao trocar de modo; o botão `Notes` usa `aria-pressed`) |
| Pausa | `Pause` · `Paused` · `Resume` |
| Teclado numérico (nome acessível) | `Place 5, 3 left` (exemplo) |
| Casa (nome acessível) | `Row 2, column 7, 5, given` · `Row 2, column 7, empty` · `Row 2, column 7, notes 1, 4, 9` · com sufixos `, conflict` e `, glazed` |
| Anúncio: painel vitrificado | `Panel 4 glazed.` |
| Anúncio: conflito | `Conflict.` |
| Anúncio: número do puzzle | `This number is part of the puzzle.` |
| Anúncio: painel trancado | `This panel is glazed.` |
| Anúncio: dica | `Hint: row 2, column 5 is 7.` |
| Vitória | `The mural is complete.` |
| Resultado | `Time` · `Level` · `Hints` · `Best time` |
| Novo recorde | `New best time` |
| Botões da vitória | `Play again` · `Change level` |

## 5. Arquitetura

### Princípio

O motor é TypeScript puro e não conhece o Vue. Uma ação devolve o novo estado e uma lista de eventos (por exemplo, `glazed`, `conflict`, `won`) para a interface animar e anunciar.

### Motor (`src/game/`)

| Arquivo | Responsabilidade |
|---|---|
| `grid.ts` | Tipos, índices, linhas, colunas, blocos e casas vizinhas (peers) |
| `validate.ts` | Conflitos |
| `solver.ts` | Solução por tentativa e contagem de soluções (até 2) |
| `techniques/` | Uma técnica por arquivo: naked single, hidden single, pointing/claiming, naked pair, hidden pair, X-Wing; `spots.ts` com as casas que ainda aceitam um número |
| `grade.ts` | Resolve com as técnicas em ordem e devolve o nível |
| `generate.ts` | Gera uma solução completa e remove números mantendo a solução única |
| `random.ts` | Gerador com semente |
| `game.ts` | Estado e ações: colocar, apagar, anotar, dica, desfazer, refazer; vitrificação e vitória (`progress`, usada também por `serialize.ts`) |
| `serialize.ts` | Salvar e restaurar a partida, recusando dados inválidos |
| `bank.ts` | Escolha de puzzle no banco pela semente, e a semente de um puzzle do banco |

### Banco de puzzles

- `scripts/build-puzzles.ts` usa `generate` e `grade` para criar `src/data/puzzles.json` (cerca de 100 por nível).
- Um teste confere que **todo** puzzle do banco tem solução única e está no nível declarado.

### Interface (`src/ui/`)

| Arquivo | Responsabilidade |
|---|---|
| `composables/useGame.ts` | Estado reativo e ações do motor |
| `composables/useTimer.ts` | Cronômetro com pausa |
| `composables/useKeyboard.ts` | Atalhos de teclado |
| `composables/usePersistence.ts` | Partida salva |
| `composables/useBestTimes.ts` | Melhor tempo por nível |
| `composables/useAnnouncer.ts` | Região `aria-live` |
| `components/HomeScreen.vue`, `LevelPicker.vue` | Início e níveis |
| `components/GameScreen.vue` | Monta o jogo |
| `components/GameHeader.vue` | Nível, cronômetro, pausa e voltar ao início |
| `components/SudokuBoard.vue`, `BoardCell.vue`, `NotesGrid.vue` | Tabuleiro, casa e anotações |
| `components/GameToolbar.vue`, `NumberPad.vue` | Ferramentas e teclado |
| `components/PauseOverlay.vue`, `WinScreen.vue` | Pausa e vitória |
| `components/TileMural.vue` | Padrão do mural em SVG (rosácea com volutas) |
| `content/copy.ts` | Todos os textos |
| `styles/tokens.css` | Cores, fontes e espaçamentos |

### Acessibilidade

- O tabuleiro é uma grade com uma única parada de Tab; setas movem a seleção; cada casa tem nome acessível com linha, coluna, conteúdo e estado.
- Números, apagar, anotações, desfazer e refazer funcionam pelo teclado.
- Região `aria-live="polite"` para vitrificação, conflitos, dicas, ações bloqueadas e modo de anotações. A vitória é anunciada numa região de status dentro do diálogo modal (com ele aberto, o resto da página fica inerte).
- Contraste mínimo de 4,5:1; conflito marcado por cor e por traço.
- `prefers-reduced-motion` respeitado.

### Erros e casos de borda

- Partida salva corrompida, de versão antiga ou impossível (tempo ou dicas negativos, puzzle sem solução única, anotação em casa preenchida, partida já vencida): apagada, o jogo volta ao início.
- Armazenamento bloqueado: o jogo funciona sem salvar.
- Mudar número do puzzle ou painel vitrificado: nada muda, e a ação é anunciada.

## 6. Stack e qualidade

- Vite + Vue 3 + TypeScript estrito + `vue-tsc`.
- ESLint (typescript-eslint, eslint-plugin-vue, eslint-plugin-vuejs-accessibility) e Prettier.
- Animações com `<Transition>` e `<TransitionGroup>`, sem biblioteca extra.
- Vitest, fast-check, Playwright e axe.

## 7. Testes

### Motor (Vitest)

- Cada técnica com puzzles conhecidos, encontrando exatamente o número ou a eliminação esperada.
- Solucionador: resolve puzzles conhecidos; conta 0, 1 ou 2+ soluções corretamente.
- Classificador: puzzles conhecidos de cada nível.
- Gerador: puzzles com solução única, a partir de uma semente, de forma reproduzível.
- Banco: todo puzzle único e no nível declarado.
- Ações: colocar, apagar, anotações, limpeza automática das anotações, dica, vitrificação e vitória.
- **Propriedades** (fast-check): desfazer e refazer voltam ao mesmo estado (fora dos painéis vitrificados); números do puzzle nunca mudam; um painel só vitrifica quando igual à solução; um painel vitrificado nunca deixa de estar vitrificado; vitória só com o tabuleiro resolvido. As ações são viciadas para a partida avançar, e o teste exige que as execuções vitrifiquem e vençam.
- Solidez: numa amostra do banco, nenhuma técnica coloca ou elimina algo que contradiga a solução.

### Navegador (Playwright + axe, desktop e celular)

- O motor resolve o puzzle e o teste digita a solução na tela até a vitória.
- Conflitos, anotações, vitrificação, dica, desfazer e refazer.
- Partida salva depois de recarregar a página.
- Teclado completo e pausa.
- Sem pedidos para fora do site e sem erros no console.
- axe sem violações em todas as telas.

## 8. Fora do escopo

- Desafio do dia, variantes, estatísticas detalhadas, explicação de técnicas, som, contas e publicação.
