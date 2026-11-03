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

Carregar recupera esse estado e chama loadState. O save fica no navegador e na origem do site: mudar domínio, navegador ou dispositivo não transfere o progresso. Limpar os dados do site pode apagá-lo. Não existem sincronização em nuvem ou salvamento automático. A transferência manual de estados é descrita abaixo.

Game.vue trata erros de quota, bloqueio de armazenamento, JSON/estrutura de slots inválidos, conversão e rejeições do núcleo. Falhas são exibidas em aviso persistente com botão ENTENDI, sem impedir iniciar o jogo quando a leitura inicial falha. O componente valida os slots antes de salvar ou carregar; dados inválidos não são apagados nem substituídos automaticamente. Para evitar sobrescrever outros slots, a gravação relê os dados atuais. “Salvo” e a atualização em memória só ocorrem após Storage.set concluir. Operações concorrentes de salvar/carregar são bloqueadas; uma gravação pendente é descartada se o componente fechar antes de concluí-la. O formato Base64 e a chave console.id existentes são mantidos. Não há coordenação de gravações simultâneas entre abas. A compatibilidade de um save após trocar núcleo ou versão não é validada pela aplicação.

## Limitações atuais

Se Nostalgist.launch falhar, CARREGANDO é encerrado e a interface mostra uma mensagem com o botão TENTAR NOVAMENTE. A nova tentativa é explícita, sem repetição automática. Ações do emulador ficam indisponíveis enquanto não houver uma instância pronta. Os detalhes técnicos permanecem no console do navegador. O cancelamento depende da cooperação da biblioteca e da operação em andamento; não há timeout automático para conexões que nunca respondem. A lateral reserva 180 px e pode limitar o espaço em telas pequenas. Essas limitações devem ser testadas e documentadas novamente quando forem corrigidas.

## Exportar e importar estado atual

Com o jogo iniciado, EXPORTAR SAVE captura o estado atual do núcleo e baixa um arquivo .save.json. Não lê nem grava localStorage: se o save local estiver na fase 1 e você exportar na fase 3, o arquivo contém a fase 3 e o save local continua na fase 1. A captura pausa temporariamente o jogo e retoma se ele estava em execução.

IMPORTAR SAVE abre um seletor de arquivo. Antes de chamar o núcleo, valida formato/versão, console, ID do jogo, hashes SHA-256 dos bytes das ROMs carregadas, nome e hash do núcleo WASM e integridade SHA-256 do estado. Base64 inválido, JSON inválido ou divergências geram um aviso. Limite: estado de até 64 MB e arquivo JSON de até 89,6 MB.

O estado válido é enviado diretamente a loadState e o jogo continua desse ponto. A importação nunca lê nem grava slots locais e não pede confirmação para sobrescrever, pois não há sobrescrita. Para persistir o progresso importado no navegador, clique em SALVAR; CARREGAR continua recuperando o save local anterior.

O formato é exclusivo desta função (versão 1, game-over-state), não um importador genérico de arquivos RetroArch. Hashes detectam corrupção acidental e diferenças de ROM/núcleo, mas não autenticam arquivos deliberadamente adulterados. A biblioteca envia o estado ao RetroArch sem oferecer confirmação completa de compatibilidade interna; a checagem não garante interpretar qualquer binário arbitrário como save válido. Rejeições lançadas pelo núcleo são exibidas sem gravação local. HTTPS ou localhost é necessário para Web Crypto. Não há sincronização automática.
