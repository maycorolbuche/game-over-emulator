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

Games.vue fornece ao componente Game.vue o jogo, URL da ROM, imagens e controles. Game.vue aguarda interação do usuário e chama Nostalgist.launch com canvas, ROM, núcleo e retroarchConfig. A inicialização exige toque/clique na área do jogo; abrir menus ou rolar a página não inicia o núcleo.

A interface oferece pausa, retomada, reinício com confirmação, fechamento com confirmação, tela cheia e aceleração. Ao confirmar o fechamento ou desmontar, invalida a tentativa atual, solicita cancelamento via AbortSignal quando o carregamento está em andamento e encerra a instância disponível. Se uma inicialização terminar mesmo após o cancelamento, sua instância é encerrada e descartada. Cada jogo tem uma chave própria no componente para impedir reutilização da sessão ao trocar pela rota. O canvas é passado por referência, sem busca por ID global; timers e listeners são removidos ao desmontar.

## Atalhos do emulador

Pausa e retomada passam por uma janela de 10 ms após o último pedido. A interface registra imediatamente o estado solicitado; ao terminar a janela, Game.vue só chama pause/resume se esse estado diferir do último aplicado por ele. Se estiver pausado e receber play seguido de pause nesse intervalo, não envia nenhum comando. O mesmo vale para pause seguido de play enquanto está rodando. Pedidos pendentes de pausa/retomada são cancelados ao encerrar a sessão. Reiniciar solicita play e agenda RESET para 10 ms depois quando o jogo está pausado; quando já está rodando, envia RESET imediatamente. Essa espera é um timer separado da fila de pausa/retomada, evitando chamar Nostalgist.restart() e sua retomada embutida.

Captura e restauração de saves aguardam essa fila antes de enviar comandos de estado e aguardam a restauração da pausa quando necessário. Os 10 ms são um debounce mínimo de agendamento, não confirmação de processamento pelo núcleo; o navegador pode executar o timer mais tarde. O último estado aplicado registra as chamadas da aplicação, não consulta diretamente a pausa interna do RetroArch. Valide as sequências também com ROM real.

| Ação | Tecla configurada |
| --- | --- |
| Pausar/continuar | Ctrl + Enter |
| Salvar | Shift + = (o binding usa Shift + +) |
| Carregar | = |
| Tela cheia | F11 |
| Reiniciar | Tab |
| Acelerar | ' |
| Rebobinar (segurar) | Backspace |

O comportamento de caracteres e teclas reservadas pode variar conforme teclado e navegador. A opção CONTROLES mostra também o mapa do console. Não há editor de mapeamento; controles virtuais do jogador 1 estão disponíveis no layout mobile.

As teclas ficam em consoles.json, com nomes físicos de botões. O helper Controls.mjs define entradas RetroPad, botões obrigatórios e jogadores por console; Game.vue usa esse perfil tanto na tela CONTROLES quanto na configuração do núcleo. Entradas de teclado RetroPad não usadas são explicitamente nul para não herdar controles ocultos.

| Console | Botões físicos e entradas RetroPad | Jogadores configurados |
| --- | --- | --- |
| Nintendo | A→a, B→b, Start, Select, direcionais | 2 |
| Super Nintendo | A/B/X/Y/L/R com entradas homônimas, Start, Select, direcionais | 2 |
| Mega Drive | A→y, B→b, C→a, X→l, Y→x, Z→r, Mode→select, Start, direcionais | 2 |
| Master System | 1→b, 2→a, direcionais; Pause do console→start apenas no jogador 1 | 2 |
| Game Boy Advance | A→a, B→b, L→l, R→r, Start, Select, direcionais; Turbo A→x e Turbo B→y opcionais | 1 |

As teclas atuais são preservadas: no jogador 1, por exemplo, Master System 1 usa X e 2 usa Z; Mega Drive A/B/C usam Z/X/C e X/Y/Z usam A/S/D. Mode usa Espaço e Pause do Master System usa Enter. Select fictício do Master System foi removido. GBA não exibe jogador 2; turbo é identificado por nome.

Genesis Plus GX mantém Joypad Auto (nenhum dispositivo forçado). O núcleo escolhe três ou seis botões conforme a ROM; mapear X/Y/Z não força dispositivo de seis botões. Alterações específicas de compatibilidade por jogo não fazem parte deste perfil. Mapas de dois jogadores não garantem multiplayer em todo jogo. Não há link cable GBA, multitap ou periféricos especiais implementados nesta interface.

npm run test:controls valida os perfis reais, botões ausentes/não suportados, jogadores extras, teclas permitidas e duplicadas, conflitos entre jogadores e tradução para RetroPad. As teclas aceitas pelo perfil atual são letras/números, vírgula, enter, space, direcionais e keypad0–keypad9; amplie o validador explicitamente se adicionar outras teclas.

Referências: [Nostalgist press](https://nostalgist.js.org/apis/press/), [Genesis Plus GX](https://docs.libretro.com/library/genesis_plus_gx/), [mGBA](https://docs.libretro.com/library/mgba/), [FCEUmm](https://docs.libretro.com/library/fceumm/) e [Snes9x](https://docs.libretro.com/library/snes9x/). A correspondência foi conferida na documentação; os testes não executam núcleos nem simulam hardware de teclado (ghosting).

## Rebobinar

Segure Backspace para voltar pelos estados recentes; solte para continuar desse ponto. No mobile, segure o botão ⏪ junto de Start/Select. A lista CONTROLES mostra o atalho logo abaixo de Acelerar, tanto na lateral desktop quanto no diálogo mobile.

Game.vue habilita rewind_enable, com rewind_buffer_size de 20 MB e rewind_granularity de 1. O histórico é mantido pelo RetroArch na memória da sessão; sua duração depende da ROM, do núcleo e dos estados, sem garantia de segundos fixos. Não lê nem sobrescreve slots do localStorage e não exporta esse histórico. A captura contínua aumenta consumo de CPU e memória; confira especialmente o desempenho no celular. Os núcleos configurados declaram suporte, mas a execução nos builds WebAssembly exige validação com ROM real.

O atalho é tratado pelo site, com input_rewind=nul para evitar acionamento duplicado pelo binding nativo. Enquanto houver tecla ou toque mantido, envia sendCommand("REWIND") uma vez por callback de requestAnimationFrame; o comando do RetroArch vale um quadro, não é um toggle. Autorepetição do teclado não cria loops extras. Campos editáveis preservam Backspace; pausa, menu, diálogo, carregamento e salvamento bloqueiam rebobinar. Soltar/cancelar o toque, perder foco, ocultar a página, redimensionar/girar, pausar, reiniciar, capturar/restaurar estado e fechar interrompem o loop. Teclado e toque compartilham um loop e soltar uma origem não cancela a outra ainda mantida. A velocidade depende do navegador e do processamento do núcleo.

## Salvamento

Salvar chama nostalgist.saveState(), converte o Blob para Base64 e grava um objeto de slots no localStorage. A chave é console + "." + id do jogo. Embora o objeto reserve slots de 0 a 9, a interface usa somente o slot 0.

Carregar recupera esse estado e chama loadState. O save fica no navegador e na origem do site: mudar domínio, navegador ou dispositivo não transfere o progresso. Limpar os dados do site pode apagá-lo. Não existem sincronização em nuvem ou salvamento automático. A transferência manual de estados é descrita abaixo.

Game.vue trata erros de quota, bloqueio de armazenamento, JSON/estrutura de slots inválidos, conversão e rejeições do núcleo. Falhas são exibidas em diálogo SweetAlert com botão ENTENDI, sem impedir iniciar o jogo quando a leitura inicial falha. O componente valida os slots antes de salvar ou carregar; dados inválidos não são apagados nem substituídos automaticamente. Para evitar sobrescrever outros slots, a gravação relê os dados atuais. “Salvo” e a atualização em memória só ocorrem após Storage.set concluir. Operações concorrentes de salvar/carregar são bloqueadas; uma gravação pendente é descartada se o componente fechar antes de concluí-la. O formato Base64 e a chave console.id existentes são mantidos. Não há coordenação de gravações simultâneas entre abas. A compatibilidade de um save após trocar núcleo ou versão não é validada pela aplicação.

## Limitações atuais

Se Nostalgist.launch falhar, CARREGANDO é encerrado e a interface abre um diálogo SweetAlert com TENTAR NOVAMENTE e FECHAR JOGO. A nova tentativa é explícita, sem repetição automática. Ações do emulador ficam indisponíveis enquanto não houver uma instância pronta. Os detalhes técnicos permanecem no console do navegador. O cancelamento depende da cooperação da biblioteca e da operação em andamento; não há timeout automático para conexões que nunca respondem. A lateral fica disponível no desktop; no mobile, as opções ficam em um painel recolhível. Essas limitações devem ser testadas e documentadas novamente quando forem corrigidas.

## Exportar e importar estado atual

Com o jogo iniciado, EXPORTAR SAVE captura o estado atual do núcleo e baixa um arquivo .save.json. Não lê nem grava localStorage: se o save local estiver na fase 1 e você exportar na fase 3, o arquivo contém a fase 3 e o save local continua na fase 1. A captura mantém o jogo em execução para processar SAVE_STATE. Se o jogo estava pausado, retoma temporariamente e restaura a pausa após a captura, inclusive em falha. A miniatura automática fica desativada, pois não é usada na transferência. Os botões de transferência usam o mesmo estilo link dos demais comandos.

IMPORTAR SAVE abre um seletor de arquivo. Antes de chamar o núcleo, valida formato/versão, console, ID do jogo, hashes SHA-256 dos bytes das ROMs carregadas, nome e hash do núcleo WASM e integridade SHA-256 do estado. Base64 inválido, JSON inválido ou divergências geram um aviso. Limite: estado de até 64 MB e arquivo JSON de até 89,6 MB.

O estado válido é enviado diretamente a loadState e o jogo continua desse ponto. A importação nunca lê nem grava slots locais e não pede confirmação para sobrescrever, pois não há sobrescrita. Para persistir o progresso importado no navegador, clique em SALVAR; CARREGAR continua recuperando o save local anterior.

O formato é exclusivo desta função (versão 1, game-over-state), não um importador genérico de arquivos RetroArch. Hashes detectam corrupção acidental e diferenças de ROM/núcleo, mas não autenticam arquivos deliberadamente adulterados. A biblioteca envia o estado ao RetroArch sem oferecer confirmação completa de compatibilidade interna; a checagem não garante interpretar qualquer binário arbitrário como save válido. Rejeições lançadas pelo núcleo são exibidas sem gravação local. HTTPS ou localhost é necessário para Web Crypto. Não há sincronização automática.

Durante a captura, o Nostalgist pode registrar FS error/errno 44 enquanto espera a criação do arquivo. Esse aviso isolado não comprova falha definitiva; um fs timeout ou aviso de exportação na interface indica que a operação não concluiu. A validação com o núcleo real continua necessária ao investigar problemas específicos de ROM.

## Caminho real de estados em ROMs ZIP

Em Nostalgist 0.10, o nome esperado do save pode divergir do nome interno de uma ROM ZIP (ver [issue upstream #74](https://github.com/arianrhodsandlot/nostalgist/issues/74)). EmulatorState.mjs usa a API pública getEmscriptenFS e os comandos SAVE_STATE/LOAD_STATE para localizar o arquivo efetivamente gerado em /home/web_user/retroarch/userdata/states. Antes da captura remove apenas estados temporários dessa instância, exige bytes estáveis em duas leituras e limita a espera a dez segundos. A restauração captura primeiro para descobrir o caminho, escreve nele e solicita LOAD_STATE. Essa integração usa o layout do RetroArch distribuído com Nostalgist 0.10 e deve ser revista em atualizações da biblioteca. Não remove saves do navegador. A mesma rotina é usada na transferência e nas operações locais. Os testes simulam o filesystem; a validação com núcleos reais continua necessária.

## Diálogos de erro

Erros de inicialização, salvar/carregar e exportar/importar usam Swal.fire com o mesmo tema dos diálogos de confirmação. Textos são passados em text, sem interpretação HTML. Durante um erro o jogo é pausado; ao dispensar, retoma somente se estava rodando e a sessão continua aberta. Erros de inicialização oferecem tentar novamente ou fechar o jogo. Os diálogos são inseridos no contêiner do emulador para permanecerem visíveis em tela cheia. Mensagens breves de sucesso e pausa continuam sobre o canvas.

## Layout mobile e rotação

Em telas de até 900 px ou dispositivos com ponteiro principal coarse, o emulador usa menu ☰ com todas as ações e botões de toque do jogador 1. Em pé, os controles ocupam uma área abaixo do jogo. Deitado, ficam sobre a imagem, com fundos semitransparentes. Os botões respeitam o perfil do console (inclusive Mega Drive X/Y/Z, Mode e Master System 1/2/Pause); comandos turbo opcionais do GBA não são exibidos no touch inicial.

ResizeObserver e resize acompanham o espaço disponível, inclusive rotação e mudança das barras do navegador. A sessão não é remontada: o canvas é redimensionado com proporção 4:3 (GBA 3:2), sem reiniciar o jogo. A área usa unidades dvh e safe-area-inset. Tela cheia envolve o emulador inteiro, para manter menu e controles visíveis; sua disponibilidade depende do navegador e dispositivo.

TouchControls.vue usa Pointer Events, captura de ponteiros e pressDown/pressUp do Nostalgist, traduzidos por Controls.mjs. O direcional permite diagonais e deslizar entre direções; múltiplos dedos mantêm ações independentes. pointerup, pointercancel, perda de captura, blur, resize, mudança de visibilidade, pausa e desmontagem liberam os botões. touch-action: none é restrito ao controle. Nenhuma entrada do jogador 2 é gerada pelo touch.

Abrir o menu pausa e libera entradas. Fechá-lo retoma somente se o jogo estava rodando antes. Ocultar/mostrar botões permite usar teclado ou controle externo sem a área de toque (não implementa configuração nova de gamepad). Ao voltar do segundo plano o jogo permanece pausado; toque no canvas ou use CONTINUAR.

Os testes automatizados verificam múltiplos ponteiros, diagonais, liberação, proporções em pé/deitado, tradução e comportamento do menu. Android/Chrome e iPhone/Safari precisam de validação manual com ROM real, incluindo fullscreen, áudio, rotação durante toque e importação/exportação.

## Direcional central arrastável

O centro do D-pad contém um botão arrastável, preservando as oito setas. Um toque mantido no centro permite mudar entre as oito direções sem levantar o dedo; a zona neutra de 8 px libera as direções ao retornar ao centro, e o deslocamento visual do botão é limitado a 34 px. Ele envia comandos direcionais digitais do jogador 1, não intensidade analógica. A captura do ponteiro mantém o movimento mesmo fora do botão. Ao soltar/cancelar, abrir menu, pausar, girar, perder foco ou desmontar, o botão volta ao centro e libera as entradas. Outros dedos continuam podendo acionar ações e setas simultaneamente.

## Seleção de ações no menu mobile

Selecionar uma ação recolhe imediatamente o painel e executa o comando. Se a partida estava rodando antes de abrir o menu, solicita retomada antes da ação; PAUSAR, confirmações e erros solicitam sua própria pausa. Pedidos opostos na janela de 10 ms são agrupados, mantendo somente o último, sem uma retomada intermediária. Salvar/carregar/exportar aguardam a fila e mantêm suas validações; importação abre o seletor no mesmo gesto do usuário. CONTROLES abre um SweetAlert com a lista, para que o painel possa fechar sem perder essa informação. Desktop mantém a lateral e a visualização de controles existentes.
