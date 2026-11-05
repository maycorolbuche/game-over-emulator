# Publicação e diagnóstico

[Índice](README.md)

## Hospedagem estática

```bash
npm ci
npm run build
```

Publique o conteúdo de dist/. Não é necessário servidor Node para executar o frontend compilado. O script sync.js é uma ferramenta local e não faz parte da rotina de execução do site.

Há configuração de rewrite no vercel.json para servir a SPA em rotas internas. Isso indica suporte de configuração à Vercel, mas não comprova qual ambiente está efetivamente publicado. Em outro provedor, configure fallback de rotas de navegação para index.html e preserve a entrega correta dos arquivos estáticos.

O router usa createWebHistory e não configura base; o Vite também não define base personalizada. Hospedagem em subdiretório exige revisar ambos.

## Dependências externas

O navegador precisa alcançar as URLs de ROMs, imagens e recursos usados pelo Nostalgist. Falhas de origem, CORS ou bloqueios de rede podem impedir o jogo mesmo com o frontend carregado. Alterações de catálogo precisam de novo build; substituição de arquivos externos também depende da publicação e cache da respectiva origem.

Google Analytics é configurado em src/main.js. Não existe painel de configuração operacional nem API própria no projeto.

## Diagnóstico

| Sintoma | Conferir |
| --- | --- |
| npm run serve não inicia desenvolvimento | Use npm run dev; serve exige build prévio |
| Rota direta retorna 404 | Fallback da hospedagem e configuração history |
| Capa não aparece | URL base/images/arquivo, nome exato e painel Network |
| Capas distantes não foram baixadas | Pode ser loading=lazy normal; role a página e confira Network |
| Jogo permanece em CARREGANDO | Enquanto a requisição estiver pendente, confira Network. Em falha, a tela oferece TENTAR NOVAMENTE; confira conexão, URL da ROM, recursos do núcleo e console do navegador |
| Save não aparece | Mesma origem, navegador, console e ID; dados locais e limite de armazenamento |
| Sync pula consoles | Repositórios irmãos e diretórios roms/ locais |
| Console ou jogo não encontrado | Confira o ID e se console/jogo estão ativos; use o link de retorno ao catálogo |

Não limpe localStorage como primeiro passo de diagnóstico: isso pode apagar progresso. A aplicação não possui exportação de saves.

## Tamanho do clone

A árvore atual não inclui as coleções de jogos. Versões antigas deste repositório incluíram ROMs e capas em public/roms e public/images. Se esses objetos ainda estiverem no histórico remoto, um clone completo pode baixá-los mesmo após a exclusão dos arquivos atuais.

Para obter somente o histórico mais recente:

```bash
git clone --depth 1 https://github.com/maycorolbuche/game-over-emulator.git
```

Não reintroduza ROMs neste repositório. Uma limpeza permanente de histórico é manutenção separada: exige backup, coordenação dos clones e publicação do histórico reescrito; não deve ser feita como parte de uma alteração funcional comum.

## Verificação após publicação

Confira URLs inexistentes, links de retorno, voltar/avançar, início, busca, listagem sem paginação, carregamento de capas ao rolar, acesso direto a um jogo e uma sessão com salvar/carregar. O workflow [CI](../.github/workflows/ci.yml) verifica catálogo, testes do validador e build com Node.js 26.x; ele não substitui a verificação manual dos jogos. Acompanhe erros na aba Actions, abrindo a etapa com falha. A publicação na Vercel continua independente: um CI com falha só bloqueia o merge se o check for obrigatório na proteção da main.

## Conferência em celulares

Verifique Android/Chrome e iPhone/Safari, retrato e paisagem: controles abaixo/sobre o jogo, menu acessível, rotação sem reiniciar e liberação de botões ao interromper um toque. Confirme que o ambiente permite tela cheia; a experiência no modal funciona sem ela. Confira mensagens SweetAlert, save local e transferência de arquivos em ambos os modos.

## PWA: instalação e atualização

O manifesto em public/manifest.webmanifest define Game Over Emulator, modo standalone, escopo/URL inicial na raiz e ícones PNG baseados no favicon existente. Não fixa orientação: a rotação continua controlada pelo layout. index.html aponta para manifesto e apple-touch-icon e declara mobile-web-app-capable, mantendo também a metatag Apple para compatibilidade; vercel.json configura tipo do manifesto e evita cache HTTP do sw.js.

O service worker é gerado no build pelo plugin local pwa/build-plugin.mjs, sem dependência nova. O template pwa/service-worker.js recebe versão baseada no conteúdo de todos os arquivos de dist e uma lista de pré-cache, incluindo chunks das rotas. Não registre um worker novo com escopo mais amplo nem publique este projeto em subdiretório sem revisar os caminhos absolutos.

O registro só ocorre em produção (npm run build + npm run serve, ou hospedagem HTTPS). npm run dev não registra worker. Localhost é permitido para testes. A instalação usa exclusivamente a interface nativa do navegador, sem botão, banners ou diálogos próprios no site. O código não intercepta beforeinstallprompt nem impede o convite nativo. No iPhone/iPad, use Safari → Compartilhar → Adicionar à Tela de Início.

O cache permite reabrir interface e catálogo sem rede depois da primeira instalação do worker e de uma nova navegação controlada por ele. Não armazena ROMs, capas, núcleos WASM, fontes externas ou Analytics; jogar offline não é garantido. Não altera saves em localStorage. Navegadores podem separar ou remover dados conforme perfil/modo de execução; exportar estados permite transferi-los quando necessário.

Uma versão nova fica aguardando até fechar o app e todas as abas do site. Não há aviso próprio na interface nem skipWaiting, clients.claim ou reload automático durante a partida. Na ativação, só caches antigos com prefixo game-over-shell- são removidos. Não limpa localStorage. Em cada implantação, o próprio build regenera o worker e sua versão.

Validação após publicar:
1. Conferir /manifest.webmanifest (JSON), /sw.js (JavaScript) e todos os ícones com resposta 200.
2. Conferir em DevTools → Application o registro/ativação e a lista do Cache Storage.
3. Instalar no Android/Chrome ou desktop compatível; no iPhone/iPad usar Safari → Compartilhar → Adicionar à Tela de Início.
4. Fechar/reabrir em standalone, girar o aparelho e confirmar menu/controles e início dos jogos online.
5. Sem conexão, reabrir o catálogo e confirmar a abertura da interface em cache.
6. Publicar outra versão: confirmar que a partida não é interrompida e que a ativação ocorre após fechar todas as instâncias.

Os testes automatizados simulam eventos do navegador, caches e rede; não comprovam a instalação real em aparelhos.

## Atualização dos núcleos e cheats

Os núcleos JS/WASM agora são resolvidos por Cheats.mjs em jsDelivr com a tag v1.21.0. Não basta atualizar somente um dos arquivos. Nostalgist continua em 0.10; a versão anterior padrão v1.19.1 não oferece os exports exigidos pelo cadastro dinâmico. Sem esses exports, o site informa indisponibilidade e não afirma que aplicou cheats.

Antes de publicar, validar inicialização, pausa/retomada, rewind e salvar/carregar com uma ROM por núcleo. A atualização altera o hash do núcleo, portanto arquivos .save.json exportados anteriormente serão recusados pela comparação de identidade já existente. Os arquivos e saves locais são preservados; não há conversor de estados entre versões. Se precisar carregar um arquivo antigo, usar a versão correspondente do núcleo/aplicação em ambiente separado. Não remover o verificador de integridade para contornar a incompatibilidade.

Cheats ficam na chave cheats.<console>.<id> do navegador. Conferir origem, console e ID quando uma lista não aparecer; não limpar o armazenamento como primeiro diagnóstico. Ao desativar um código, valores já modificados podem persistir no jogo; reiniciar pode ser necessário. Códigos dependem da ROM/região, e ausência de erro do parser não confirma efeito.

Se pausa, saves e rewind deixarem de funcionar juntos após atualizar o núcleo, conferir RetroArchCommands.connect no launch. O transporte stdin do Nostalgist 0.10 não controla o RetroArch 1.21; pausa/saves devem alcançar os exports diretos e rewind/aceleração devem usar EmscriptenSendCommand. O indicador de pausa sozinho não comprova que o comando chegou ao núcleo. Não apagar saves para diagnosticar esse caso.

Se o console repetir Setting real canvas size com dimensões crescendo a cada atualização, trata-se de realimentação no dimensionamento, não de progresso do download. Conferir as regras CSS de --canvas-width/--canvas-height e position:absolute no canvas. O núcleo 1.21 controla o buffer e DPR; não chamar nostalgist.resize no ResizeObserver do layout nem depender de width/height inline removidos pelo Emscripten. Fechar/reabrir a sessão após publicar a correção para descartar o buffer que já cresceu.

Se o núcleo registrar Setting real canvas size: 0 x 0 na inicialização, conferir se o canvas está no layout antes de iniciar o núcleo: durante CARREGANDO, deve usar visibility:hidden em vez de display:none. O site aguarda nextTick e passa size positivo explicitamente ao Nostalgist para não depender de offsetWidth/offsetHeight de um elemento oculto. Após publicar, recarregar a página e iniciar uma sessão nova.
