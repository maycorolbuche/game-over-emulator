# Arquitetura e rotas

[Índice](README.md)

## Visão geral

A aplicação é uma SPA Vue 3. O Vite compila os componentes e JSONs em arquivos estáticos. Vue Router usa history do navegador e carrega as páginas por importação dinâmica. Não há API própria, autenticação ou banco de dados.

O catálogo é importado no frontend, não consultado em uma API. A busca no cabeçalho importa o catálogo completo, portanto os dados participam do carregamento inicial. A execução dos jogos depende do Nostalgist e de recursos externos.

## Mapa do código

| Caminho | Responsabilidade |
| --- | --- |
| src/main.js | Inicializa Vue, router, vue-gtag, atalhos e CSS |
| src/App.vue | Cabeçalho, router-view e botão de retorno ao topo |
| src/router/index.js | Rotas e props das páginas |
| src/views/ | Início, consoles, jogos e sobre |
| src/layout/ | Cabeçalho, busca integrada e retorno ao topo |
| src/components/Game.vue | Integração com Nostalgist e ações do emulador |
| src/components/Modal.vue | Contêiner da sessão de jogo e bloqueio da rolagem do body |
| src/components/SearchInput.vue | Busca global e resultados progressivos |
| src/components/Key.vue | Apresentação das teclas |
| src/components/bg/ e src/assets/bg/ | Elementos decorativos |
| src/helpers/ | Storage, conversão Blob/Base64 e tela cheia |
| src/json/ | Catálogos de consoles e jogos |
| public/ | Arquivos estáticos locais, atualmente favicon |
| sync.js | Ferramenta Node interativa de manutenção |
| vite.config.js | Plugin Vue, alias, porta e saída do build |
| vercel.json | Rewrite para navegação SPA |

## Rotas

| Caminho | Nome | Página |
| --- | --- | --- |
| / | Home | Home.vue |
| /games | Consoles | Consoles.vue |
| /games/:console_id | Games | Games.vue |
| /games/:console_id/:game_id | Game | Games.vue com jogo aberto |
| /about | About | About.vue |
| /:pathMatch(.*)* | NotFound | NotFound.vue |

Games.vue resolve console e jogo pelos JSONs, monta as URLs externas e abre Game.vue dentro do modal. Abrir e fechar o jogo atualiza a rota. Console inexistente ou inativo mostra “Console não encontrado”. Jogo inexistente, inativo ou pertencente a outro console mostra “Jogo não encontrado”. A URL é preservada, com links para retornar aos jogos do console válido ou aos consoles. A sessão é derivada dos parâmetros reativos, sem watcher que redireciona ao ler a rota; assim voltar/avançar atualiza a sessão sem novos pushes. A rota catch-all mostra “Página não encontrada” para demais caminhos. Como SPA estática, essa tela não configura um status HTTP 404 no servidor.

## Integrações e dados

- Nostalgist: executa o núcleo de emulação no navegador.
- GitHub Pages: origem configurada das ROMs e imagens por console.
- Twitch/IGDB: usados pelo script de manutenção, não necessários para consultar o catálogo pronto.
- Google Analytics: configurado em src/main.js por vue-gtag.
- localStorage: guarda estados dos jogos na origem atual.

Consoles.vue mostra consoles ativos. Games.vue filtra jogos ativos do console e ordena por nome. A busca global também exige jogo e console ativos. As capas da listagem usam loading=lazy e decoding=async, com espaço reservado de 180 × 240 px; isso não pagina nem reduz o total de cards renderizados.

## Botões de retorno

NotFound.vue apresenta links como botões com fonte pixelada, bordas retas e paleta dos alertas SweetAlert: ação principal amarela e alternativa preta com borda branca. Há estados de hover, pressionamento e foco visível, largura total em telas pequenas e respeito à preferência por movimento reduzido. Os estilos são locais à página.

## Componentes mobile

TouchControls.vue renderiza botões do perfil do jogador 1; TouchInput.mjs controla ponteiros com contagem por botão e calcula a proporção do canvas. Game.vue mantém a sessão em resize/rotação e compartilha as mesmas ações da lateral no painel mobile, sem duplicar a lógica. Header.vue possui navegação recolhível; o modal mantém o bloqueio de rolagem anterior ao abrir. A tela cheia usa o contêiner raiz do emulador.
