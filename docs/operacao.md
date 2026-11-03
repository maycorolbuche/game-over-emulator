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
