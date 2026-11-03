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

A interface oferece pausa, retomada, reinício com confirmação, fechamento com confirmação, tela cheia e aceleração. Ao confirmar o fechamento ou desmontar, invalida a tentativa atual, solicita cancelamento via AbortSignal quando o carregamento está em andamento e encerra a instância disponível. Se uma inicialização terminar mesmo após o cancelamento, sua instância é encerrada e descartada. Cada jogo tem uma chave própria no componente para impedir reutilização da sessão ao trocar pela rota. O canvas é passado por referência, sem busca por ID global; timers e listeners são removidos ao desmontar.

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

Game.vue trata erros de quota, bloqueio de armazenamento, JSON/estrutura de slots inválidos, conversão e rejeições do núcleo. Falhas são exibidas em aviso persistente com botão ENTENDI, sem impedir iniciar o jogo quando a leitura inicial falha. O componente valida os slots antes de salvar ou carregar; dados inválidos não são apagados nem substituídos automaticamente. Para evitar sobrescrever outros slots, a gravação relê os dados atuais. “Salvo” e a atualização em memória só ocorrem após Storage.set concluir. Operações concorrentes de salvar/carregar são bloqueadas; uma gravação pendente é descartada se o componente fechar antes de concluí-la. O formato Base64 e a chave console.id existentes são mantidos. Não há coordenação de gravações simultâneas entre abas. A compatibilidade de um save após trocar núcleo ou versão não é validada pela aplicação.

## Limitações atuais

Se Nostalgist.launch falhar, CARREGANDO é encerrado e a interface mostra uma mensagem com o botão TENTAR NOVAMENTE. A nova tentativa é explícita, sem repetição automática. Ações do emulador ficam indisponíveis enquanto não houver uma instância pronta. Os detalhes técnicos permanecem no console do navegador. O cancelamento depende da cooperação da biblioteca e da operação em andamento; não há timeout automático para conexões que nunca respondem. A lateral reserva 180 px e pode limitar o espaço em telas pequenas. Essas limitações devem ser testadas e documentadas novamente quando forem corrigidas.
