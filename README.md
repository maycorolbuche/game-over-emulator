# Game Over Emulator

Portal de jogos clássicos executados no navegador, construído com Vue 3, Vue Router, Vite e Nostalgist. O catálogo é versionado em JSON; ROMs e capas são servidas por repositórios externos. Não há backend próprio nem banco de dados nesta aplicação.

## Início rápido

Pré-requisitos: Git, Node.js e npm compatíveis com o Vite 6 e as dependências do lockfile. O projeto não fixa uma versão de Node em `engines` ou arquivo de versão.

```bash
git clone https://github.com/maycorolbuche/game-over-emulator.git
cd game-over-emulator
npm ci
npm run dev
```

Abra a URL indicada pelo Vite (porta configurada: 3000). É necessária conexão com os serviços externos para baixar os recursos dos jogos. Não é preciso executar o sincronizador para iniciar o site.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm ci` | Instala as versões do package-lock.json |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a aplicação estática em dist/ |
| `npm run serve` | Abre o preview de um build já gerado |
| `npm run check:catalog` | Valida os JSONs locais de consoles e jogos |
| `npm run test:emulator` | Testa falhas, novas tentativas e encerramento do emulador |
| `npm run test:catalog` | Executa os testes do validador |
| `npm run test:routes` | Testa resolução e navegação de consoles e jogos |
| `npm run test:saves` | Testa falhas e preservação dos salvamentos |
| `npm run test:transfer` | Testa exportação/importação sem alterar saves locais |
| `npm run test:cheats` | Testa cadastro, máscaras, persistência e aplicação dos cheats |
| `npm run test:controls` | Valida perfis e tradução dos controles por console |
| `npm run test:mobile` | Testa multitoque, proporção e menu do emulador |
| `npm run test:pwa` | Testa manifesto, cache, instalação e atualização do PWA |
| `npm run sync` | Abre o menu local de manutenção do catálogo |

Há testes do validador em `npm run test:catalog` e do ciclo de vida do emulador em `npm run test:emulator`; não há script geral de teste ou lint. `serve` não substitui `dev`. A instalação completa com `npm ci` é necessária para build e sincronização: Vite, Axios e readline-sync ficam em devDependencies.

## Verificação automática

O workflow [CI](.github/workflows/ci.yml) executa instalação, validação do catálogo, testes do validador e do emulador e build em PRs para `main` e pushes na `main`, usando Node.js 26.x. Também pode ser iniciado manualmente em Actions. Consulte [Desenvolvimento](docs/desenvolvimento.md#integração-contínua) para detalhes.

## Funcionalidades

- Catálogo por console e busca global e por seção.
- Nintendo, Super Nintendo, Mega Drive, Master System e Game Boy Advance.
- Emulação com pausa, reinício, aceleração e tela cheia.
- Rebobinar segurando Backspace, com histórico temporário em memória.
- Salvamento manual de estado no navegador.
- Cheats por jogo, com código e descrição salvos no navegador; novos códigos entram ativos, e iniciar/reiniciar/carregar desmarca todos.
- Exportação do estado atual e importação com carregamento imediato, sem alterar saves locais.
- Links diretos para jogos e mensagens de endereço não encontrado.
- Layout mobile com menu recolhível, rotação e controles de toque do jogador 1.
- Catálogo sem paginação, com carregamento tardio nativo das capas.

## Instalar no aparelho

Em produção HTTPS, o site pode ser instalado como aplicativo. A instalação é feita exclusivamente pelo ícone ou menu do navegador. No iPhone/iPad, use Safari → Compartilhar → Adicionar à Tela de Início. A interface e o catálogo ficam disponíveis offline após o cache ser preparado; ROMs, capas, fontes externas e núcleos continuam exigindo conexão para carregamento. Consulte [Operação](docs/operacao.md#pwa-instalação-e-atualização).

## Documentação

Comece pelo [índice técnico](docs/README.md).

- [Desenvolvimento e contribuição](docs/desenvolvimento.md)
- [Arquitetura e rotas](docs/arquitetura.md)
- [Catálogo e sincronização](docs/catalogo.md)
- [Emulação, controles e salvamentos](docs/emulacao.md)
- [Publicação e diagnóstico](docs/operacao.md)

Toda alteração deve revisar e atualizar a documentação correspondente na mesma PR. As instruções para agentes estão em [AGENTS.md](AGENTS.md).

