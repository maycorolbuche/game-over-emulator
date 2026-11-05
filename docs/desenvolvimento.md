# Desenvolvimento e contribuição

[Índice](README.md)

## Ambiente

Use Git, Node.js e npm compatíveis com as dependências do projeto. Não há versão de Node fixada no repositório; ao padronizar uma versão, registre-a no código e neste guia. O package-lock.json é a referência de versões instaladas.

```bash
npm ci
npm run dev
```

O Vite usa porta 3000, podendo indicar outra se ela estiver ocupada. O alias `@` aponta para src/. Não abra index.html diretamente pelo sistema de arquivos.

## Build e preview

```bash
npm run build
npm run serve
```

O build é escrito em dist/, ignorado pelo Git. O preview serve o resultado compilado, não é o servidor de desenvolvimento nem uma configuração de hospedagem de produção.

Os scripts dev/build/serve usam exclusivamente Vite e @vitejs/plugin-vue. As dependências e configurações antigas de Vue CLI, Babel e ESLint foram removidas; não há scripts npm test ou npm run lint configurados.

As bibliotecas usadas no navegador ficam em dependencies. Axios e readline-sync são usados somente pelo sync.js e ficam em devDependencies, junto das ferramentas de build. Use npm ci completo para desenvolver, compilar ou executar o sincronizador. Uma instalação com --omit=dev não oferece essas ferramentas.

core-js foi removido porque não havia importação no código. O projeto não adiciona uma camada de polyfills legada; a configuração Browserslist antiga também foi removida, e o build segue o alvo padrão do Vite 6. Isso não estabelece suporte a navegadores antigos. Ao alterar compatibilidade de navegadores, configure e valide explicitamente o alvo no Vite e os recursos de execução do emulador.

## Organização e contribuição

Componentes usam arquivos Vue SFC e, em geral, Options API. Estilos globais ficam em src/assets/css/; estilos locais ficam nos componentes. Evite duplicar regras de catálogo ou controles sem conferir os pontos consumidores.

Crie uma branch a partir da main atual e abra PR. O gitdeploy.bat existente executa push diretamente para main; não o utilize para o fluxo por PR. ROMs e capas ficam fora deste repositório.

## Validação do catálogo

Execute `npm run check:catalog` antes de enviar alterações nos JSONs. Execute `npm run test:catalog` ao alterar o validador; os testes usam o runner nativo do Node, com dados isolados e sem modificar o catálogo. Não são necessárias dependências novas. Consulte as regras e os limites em [Catálogo](catalogo.md#validação-local). Os comandos também são executados automaticamente no GitHub Actions.

## Integração contínua

O arquivo [.github/workflows/ci.yml](../.github/workflows/ci.yml) define o workflow CI, com o job `Catálogo, testes e build`. Ele roda em PRs cujo destino é main, pushes na main e acionamento manual em Actions → CI → Run workflow (após o workflow estar na branch padrão).

O runner Ubuntu usa Node.js 26.x, alinhado ao ambiente Vercel informado para este projeto. Para reproduzir os comandos, use essa versão do Node e execute:

```bash
npm ci
npm run check:catalog
npm run test:catalog
npm run test:emulator
npm run test:routes
npm run test:saves
npm run test:transfer
npm run test:cheats
npm run test:mobile
npm run test:pwa
npm run build
```

As etapas são sequenciais; uma falha impede as seguintes e aparece no log da etapa. O cache é do npm, não de node_modules; npm ci continua instalando pelo lockfile. Execuções anteriores do mesmo PR ou referência são canceladas quando chegam novos commits. O job tem limite de dez minutos e permissão contents: read. As actions são fixadas por SHA; revise os SHAs ao atualizá-las.

O workflow não publica o site nem acessa ROMs ou integrações do sincronizador. Não executa os jogos no navegador. Para bloquear merges com falhas, configure o check `Catálogo, testes e build` como obrigatório na proteção/ruleset da main após a primeira execução. Essa regra não é criada pelo arquivo do workflow.

## Testes do emulador

`npm run test:emulator` executa os métodos reais de Game.vue com Nostalgist simulado: sucesso, falha seguida de nova tentativa, bloqueio de chamadas duplicadas, fechamento durante carregamento, rejeição tardia e independência entre sessões. Os testes não baixam ROMs nem executam núcleos no navegador. O workflow CI também executa esse comando.

Também usa timers simulados para verificar a janela de 10 ms de pausa/retomada: sequências opostas, último pedido prevalecendo, ausência de comandos duplicados, cancelamento ao fechar e ação de confirmação no menu mobile. No reinício pausado, verifica ausência de comandos antes de 10 ms, retomada e RESET ao terminar a espera; cobre também play adicional sem duplicação e RESET imediato quando já está rodando. Esses testes conferem os comandos enviados pela aplicação; a pausa efetiva do núcleo exige validação manual com ROM real.

Os testes de emulação também simulam requestAnimationFrame para validar Backspace mantido, interrupção ao soltar/pausar/fechar, bloqueio em campos editáveis e estados indisponíveis, uso simultâneo de teclado/toque sem loops duplicados e posição do atalho após Acelerar. Conferem ainda a configuração do histórico no launch. Não executam a rebobinagem no WebAssembly: testar uma ROM por núcleo em desktop e Android/iOS, mantendo Backspace em teclado físico por alguns segundos, soltando, abrindo menu durante o gesto e alternando pausa, salvar/carregar e rotação.

## Testes de rotas

`npm run test:routes` verifica consoles/jogos inexistentes e inativos, acesso direto, mudanças de parâmetros, abertura/fechamento e correspondência das rotas reais com histórico em memória. É executado no CI e não baixa ROMs. Confira também manualmente voltar/avançar e links de retorno após publicar.

## Verificação conforme o escopo

Para mudanças na aplicação, execute npm run build quando o ambiente permitir e faça as verificações manuais pertinentes:

1. Navegue entre início, consoles, jogos e sobre.
2. Teste a busca global e a busca por console, inclusive acentos e resultado vazio.
3. Abra um jogo por card e por URL direta; feche e abra outro.
4. Se a emulação mudou, teste pausa, retomada, reinício, tela cheia, salvar e carregar.
5. Se o catálogo mudou, confira IDs únicos por console, nomes de arquivos e URLs externas.
6. Se imagens mudaram, confira layout e carregamento no painel Network ao rolar a página.

Mudanças somente de documentação exigem conferir links, comandos e aderência ao código; não exigem criar testes que apenas repitam o texto.

## Documentação contínua

Atualize os guias afetados na mesma PR do código. Na descrição, informe comportamento resultante, documentos atualizados, verificações e limitações. Se nada documentado mudou, explique o motivo. Consulte também [AGENTS.md](../AGENTS.md).


## Testes dos salvamentos

`npm run test:saves` testa os métodos reais do componente com armazenamento e núcleo simulados: quota, bloqueio de acesso, JSON/estrutura inválidos, falha de conversão ou núcleo, sucesso após gravação, slots preservados e fechamento durante salvamento. O CI executa esses testes; eles não substituem uma sessão real no navegador.

## Testes de transferência

`npm run test:transfer` cobre hashes de ROM/núcleo, corrupção e formato, exportação do estado atual e importação automática sem ler ou gravar slots locais. Usa os métodos reais do componente com núcleo e navegador simulados. Também é executado no CI.

## Validação mobile

Execute npm run test:mobile (também no CI). Os testes usam a lógica real de multitoque e redimensionamento, com núcleo simulado. Confira manualmente 320×568, 390×844, 844×390 e tablet; rode uma ROM, segure direção e pulo, gire a tela e confirme continuidade do jogo, liberação das entradas e proporção. Verifique menus, SweetAlert e todos os comandos em tela cheia e fora dela. Testes em aparelhos Android/iOS são necessários para áudio, seletor de arquivo, downloads e gestos do sistema.

## Desenvolvimento do PWA

Use npm run test:pwa para validar manifesto/ícones, geração e versionamento de pré-cache, fallback offline, isolamento de caches e registro do worker sem interceptar a instalação nativa. O CI executa esse comando. Para testar worker real, gere build e use npm run serve em localhost; o servidor dev não registra worker. Antes de depurar versões antigas, confira o registro em DevTools e suas abas abertas; atualizações aguardam encerramento das instâncias. Veja o guia de operação para checagens em Android/iOS. O plugin gera dist/sw.js após o build e não deve ser executado manualmente sobre arquivos incompletos.

## Testes de cheats

npm run test:cheats (também no CI) cobre máscaras reais do consoles.json, códigos livres/compostos, cadastro ativado, persistência isolada por console/jogo, dados corrompidos, quota com restauração da lista anterior, limpeza ao desativar o último código, liberação de memória, núcleo sem exports, formulário/checkbox com DOM simulado, texto sem interpolação HTML e pausa/retomada pelos métodos reais de Game.vue. Não executa ROM nem garante efeito dos códigos no WebAssembly. Após publicar, conferir cada núcleo com uma ROM e código compatíveis, recarregar a página, ativar/desativar, abrir/fechar o modal em pausa e execução, salvar/carregar e usar fullscreen/mobile.

## Regressão no transporte dos comandos

npm run test:emulator cobre também um núcleo 1.21 simulado que ignora stdin: reproduz a falha antiga, verifica a instalação do adaptador pelo launch, pausa/retomada com debounce, captura/restauração pelos métodos reais de EmulatorState.mjs, envio de REWIND/FAST_FORWARD pela API moderna e fallback para módulos legados. A fila antiga precisa permanecer vazia nos cenários modernos. Os testes não executam WASM; após publicar, validar pausa, continuar, salvar/carregar, exportar/importar, Backspace e aceleração com ROM real.

O teste mobile de dimensionamento simula o núcleo alterando o buffer e removendo width/height inline, como Emscripten faz. Repete 30 atualizações para cada DPR 1, 1.25, 1.5, 2 e 3, verifica dimensões CSS estáveis, ausência de chamadas a nostalgist.resize e mudança de proporção/orientação. Não é uma execução de layout em navegador real; validar desktop com zoom/escala de 125%, mobile, rotação e fullscreen após publicar.
