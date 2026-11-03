# Catálogo e sincronização

[Índice](README.md)

## Fontes

src/json/consoles.json e src/json/roms.json são importados no build. Alterá-los exige novo build e publicação do frontend. ROMs e capas são mantidas separadamente:

| ID | Console | Base configurada |
| --- | --- | --- |
| gens | Mega Drive | https://maycorolbuche.github.io/roms_gens |
| nes | Nintendo | https://maycorolbuche.github.io/roms_nes |
| sms | Master System | https://maycorolbuche.github.io/roms_sms |
| snes | Super Nintendo | https://maycorolbuche.github.io/roms_snes |
| gba | Game Boy Advance | https://maycorolbuche.github.io/roms_gba |

## Contratos JSON

Cada console tem id, name, base_url, image, active e controls. controls agrupa player1/player2 e associa botões a teclas RetroArch. image do console é concatenado diretamente a base_url; os registros atuais usam /cover.png.

Cada jogo contém:

| Campo | Uso |
| --- | --- |
| id | Identificador na URL e na chave do save |
| console | ID existente em consoles.json |
| name | Nome exibido e pesquisado |
| filename | Nome exato do arquivo no diretório externo roms/ |
| image | Nome do arquivo no diretório externo images/ |
| active | Inclusão na listagem do console |
| id_igdb | Referência usada para atualização de metadados |
| check_image, check_name | Marcadores opcionais do sincronizador |
| block_change | Bloqueio opcional das buscas de nome e imagem |

Mantenha a combinação console + id única e estável. Mudar id pode quebrar links e a associação com saves existentes. filename deve respeitar inclusive maiúsculas e espaços da origem.

As URLs dos jogos são montadas como base_url + /roms/ + filename e base_url + /images/ + image. Uma URL absoluta em image não é compatível com essa concatenação do frontend; o sincronizador oferece download para convertê-la em nome local.

## Inclusão manual

1. Publique ROM e capa no repositório externo correspondente.
2. Adicione ou revise o registro em roms.json.
3. Confira a unicidade de console + id e a disponibilidade das URLs.
4. Gere o build e teste a busca, o card e a abertura direta.
5. Revise a documentação se houver mudança no contrato ou no processo.

Um console novo exige também controls e suporte explícito ao núcleo em Game.vue. Adicionar apenas um registro JSON não implementa um emulador novo.

## Sincronizador local

Execute npm run sync ou node sync.js. É uma ferramenta interativa que grava os JSONs e pode baixar ou renomear imagens. Revise o diff antes de enviar alterações.

| Opção | Ação |
| --- | --- |
| 1 | Atualizar consoles |
| 2 | Atualizar jogos |
| 3 | Verificar IDs duplicados |
| 4 | Localizar capas, em modo automático ou manual |
| 5 | Resetar checagem de imagens |
| 6 | Baixar imagens |
| 7 | Atualizar nomes pela IGDB |
| 8 | Resetar checagem de nomes |
| 9 | Apagar jogos desativados |
| 10 | Consultar plataformas na IGDB |
| 0 | Sair |

### Caminhos e limitações atuais

O script não é necessário para rodar o site. Antes de usá-lo, confira a estrutura local: dir aponta para public/roms, mas a leitura dos jogos nas opções 2–9 resolve repositórios irmãos em ../roms_<id>/roms. O download escreve em ../roms_<id>/images. A opção 1 ainda lista public/roms, que não existe no checkout atual; não a execute sem preparar e revisar esse caminho, pois uma lista vazia pode desativar consoles.

As opções 2–9 pulam o console se o diretório local de ROMs não existir. Algumas operações, como reset de marcadores e remoção de inativos, atuam no JSON inteiro, mesmo após escolher um console. A verificação de duplicidades também examina o conjunto completo.

As consultas IGDB obtêm token por OAuth da Twitch, com configuração atualmente definida no próprio script. Este guia não reproduz credenciais nem pressupõe suporte a variáveis de ambiente que ainda não foi implementado. Uma falha ao buscar capa pode deixar check_image marcado e exigir reset para tentar novamente.
