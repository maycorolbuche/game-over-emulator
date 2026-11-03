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
| `npm run test:catalog` | Executa os testes do validador |
| `npm run sync` | Abre o menu local de manutenção do catálogo |

Há testes específicos do validador em `npm run test:catalog`; não há script geral de teste ou lint. `serve` não substitui `dev`. A instalação completa com `npm ci` é necessária para build e sincronização: Vite, Axios e readline-sync ficam em devDependencies.

## Verificação automática

O workflow [CI](.github/workflows/ci.yml) executa instalação, validação do catálogo, testes do validador e build em PRs para `main` e pushes na `main`, usando Node.js 26.x. Também pode ser iniciado manualmente em Actions. Consulte [Desenvolvimento](docs/desenvolvimento.md#integração-contínua) para detalhes.

## Funcionalidades

- Catálogo por console e busca global e por seção.
- Nintendo, Super Nintendo, Mega Drive, Master System e Game Boy Advance.
- Emulação com pausa, reinício, aceleração e tela cheia.
- Salvamento manual de estado no navegador.
- Links diretos para jogos.
- Catálogo sem paginação, com carregamento tardio nativo das capas.

## Documentação

Comece pelo [índice técnico](docs/README.md).

- [Desenvolvimento e contribuição](docs/desenvolvimento.md)
- [Arquitetura e rotas](docs/arquitetura.md)
- [Catálogo e sincronização](docs/catalogo.md)
- [Emulação, controles e salvamentos](docs/emulacao.md)
- [Publicação e diagnóstico](docs/operacao.md)

Toda alteração deve revisar e atualizar a documentação correspondente na mesma PR. As instruções para agentes estão em [AGENTS.md](AGENTS.md).

