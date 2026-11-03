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
| `npm run sync` | Abre o menu local de manutenção do catálogo |

Não há scripts de teste ou lint definidos atualmente. `serve` não substitui `dev`.

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
