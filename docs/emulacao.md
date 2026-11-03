# Emulação, controles e salvamentos

[Índice](README.md)

## Núcleos configurados

| Console | ID | Núcleo |
| --- | --- | --- |
| Nintendo | nes | fceumm |
| Super Nintendo | snes | snes9x |
| Game Boy Advance | gba | mgba |
| Mega Drive | gens | genesis_plus_gx |
| Master System | sms | genesis_plus_gx |

Game Boy e Game Boy Color aparecem apenas em código comentado; não estão implementados como consoles ativos.

## Sessão

Games.vue fornece ao componente Game.vue o jogo, URL da ROM, imagens e controles. Game.vue aguarda interação do usuário e chama Nostalgist.launch com canvas, ROM, núcleo e retroarchConfig. Atualmente clique, teclado e rolagem na janela são observados como interação.

A interface oferece pausa, retomada, reinício com confirmação, fechamento com confirmação, tela cheia e aceleração. Ao desmontar, remove eventos e encerra a instância já disponível. Ainda não há cancelamento explícito da inicialização assíncrona em andamento.

## Atalhos do emulador

| Ação | Tecla configurada |
| --- | --- |
| Pausar/continuar | Ctrl + Enter |
| Salvar | Shift + = (o binding usa Shift + +) |
| Carregar | = |
| Tela cheia | F11 |
| Reiniciar | Tab |
| Acelerar | ' |

O comportamento de caracteres e teclas reservadas pode variar conforme teclado e navegador. A opção CONTROLES mostra também o mapa do console. Não há editor de mapeamento ou controles virtuais de toque implementados na interface.

Os mapas player1/player2 ficam em consoles.json. No Mega Drive, Game.vue remapeia os nomes a → y, y → c e c → a antes de enviar ao RetroArch. Mapas de dois jogadores não garantem suporte multiplayer em todos os jogos ou consoles; não há modo online implementado.

## Salvamento

Salvar chama nostalgist.saveState(), converte o Blob para Base64 e grava um objeto de slots no localStorage. A chave é console + "." + id do jogo. Embora o objeto reserve slots de 0 a 9, a interface usa somente o slot 0.

Carregar recupera esse estado e chama loadState. O save fica no navegador e na origem do site: mudar domínio, navegador ou dispositivo não transfere o progresso. Limpar os dados do site pode apagá-lo. Não existem sincronização em nuvem, exportação/importação ou salvamento automático implementados.

Storage.js não trata erros de quota na escrita, e a leitura de objetos pode lançar erro em JSON inválido. A compatibilidade de um save após trocar núcleo ou versão não é validada pela aplicação.

## Limitações atuais

Se Nostalgist.launch falhar, o catch registra no console, mas não limpa loading nem oferece nova tentativa. A lateral reserva 180 px e pode limitar o espaço em telas pequenas. Essas limitações devem ser testadas e documentadas novamente quando forem corrigidas.
