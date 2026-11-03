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

