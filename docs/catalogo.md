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

## Validação local

```bash
npm run check:catalog
npm run test:catalog
```

O primeiro comando lê os JSONs a partir da raiz do projeto, independentemente do diretório de execução. Não altera arquivos nem acessa a rede. Retorna código 0 se os dados forem válidos e 1 em caso de erro de leitura, JSON inválido ou contrato inválido. Os erros mostram arquivo, índice do registro (começando em zero) e campo; por exemplo: `src/json/roms.json[12].console: console inexistente ou identificador inválido`.

Regras implementadas em scripts/check-catalog.mjs:

- Ambos os JSONs precisam ser arrays não vazios de objetos.
- Consoles precisam de id único, name não vazio e active booleano. IDs de consoles e jogos não podem conter espaços, separadores de caminho ou delimitadores de URL; caracteres já usados, como `$` e hífen final, são preservados para manter links e saves.
- Consoles ativos precisam de base_url HTTP(S) absoluta sem query, fragmento ou credenciais, image no formato `/arquivo.ext` e controls.player1 não vazio. player2 é opcional; quando informado, deve ser mapa não vazio. Botões e teclas devem ser textos não vazios.
- Todos os jogos, inclusive inativos, precisam de id, name, console existente, active booleano, filename com extensão e image com extensão png/jpg/jpeg/webp/gif/avif/svg. A combinação console + id deve ser única; o mesmo id em consoles diferentes é permitido.
- filename e image são nomes simples, sem diretórios, URLs absolutas, caracteres de controle ou caracteres reservados `?`, `#`, `%` e `:`. Espaços internos em nomes de arquivos são aceitos.
- Quando presentes, check_image, check_name e block_change devem ser booleanos. id_igdb aceita inteiro positivo, texto numérico positivo ou texto vazio. Campos adicionais são permitidos.

A validação não confirma existência de arquivos externos, suporte de um núcleo novo, validade das teclas no RetroArch ou execução dos jogos. Não renomeia IDs nem corrige registros automaticamente. O comando test:catalog verifica casos válidos e inválidos, duplicidades, referências, controles, leitura e códigos de saída.

## Inclusão manual

1. Publique ROM e capa no repositório externo correspondente.
2. Adicione ou revise o registro em roms.json.
3. Execute `npm run check:catalog` e confira separadamente a disponibilidade das URLs.
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

## Formatos de cheats

Cada console inclui cheats.default_format e cheats.formats. O modal CHEATS usa esses metadados para escolher formato, mostrar a máscara e normalizar códigos ao sair do campo ou adicionar. O padrão free preserva digitação livre, inclusive códigos compostos, sem impor uma máscara única ao console.

Cada formato tem id, label, masks e characters. Em masks, X representa um caractere do alfabeto characters; os demais caracteres são separadores literais. Várias máscaras representam comprimentos alternativos. O formato free usa masks vazio e characters nulo, sem máscara nem conversão de letras; aplicam-se os limites gerais do cadastro. Não cortar nem remover caracteres de códigos colados que não correspondam a uma máscara: permitir selecionar Livre. Para um conjunto de várias linhas, preservar a ordem e manter as linhas no mesmo cheat.

| Console | Formatos identificados |
| --- | --- |
| NES | Game Genie de 6/8 letras; PAR de 8 hexadecimais; XXXX:XX; XXXX?XX:XX |
| SNES | Game Genie XXXX-XXXX; PAR XXXXXXXX; endereço XXXXXX:XX |
| Mega Drive | Game Genie XXXX-XXXX com alfabeto próprio; patch/PAR XXXXXX:XXXX |
| Master System | Game Genie XXX-XXX ou XXX-XXX-XXX; Action Replay XXXX-XXXX; Fusion RAM XXXX:XX e ROM XXXXXX:XX |
| GBA | Linhas hexadecimais XXXXXXXX XXXXXXXX ou XXXXXXXX XXXX; Livre para sequências compostas |

Os nomes 8+8 e 8+4 do GBA descrevem a estrutura, sem inferir a versão do dispositivo ou sua criptografia. Máscara só auxilia digitação: não confirma que o código tem efeito na ROM/região nem que o build WebAssembly o aceita. As opções não pretendem esgotar todas as sintaxes dos núcleos.

Formatos conferidos nos parsers oficiais: [FCEUmm libretro](https://github.com/libretro/libretro-fceumm/blob/master/src/drivers/libretro/libretro.c), [FCEUmm decodificadores](https://github.com/libretro/libretro-fceumm/blob/master/src/cheat.c), [Snes9x](https://github.com/snes9xgit/snes9x/blob/master/cheats2.cpp), [Genesis Plus GX](https://github.com/libretro/Genesis-Plus-GX/blob/master/libretro/libretro.c) e [mGBA](https://github.com/mgba-emu/mgba/blob/master/src/platform/libretro/libretro.c).
