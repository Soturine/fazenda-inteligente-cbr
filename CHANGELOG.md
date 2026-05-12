# Changelog

## [2.12.0] - 2026-05-12
### Corrigido
- Cabelos e chapéus do personagem receberam silhuetas mais distintas, incluindo boné, chapéu de campo, chapéu de palha, cabelo longo, cacheado, trança e estilos femininos.
- Rabo de cavalo, trança e outros acessórios laterais agora acompanham a direção do personagem ao virar.
- Plantio por tecla e clique agora prioriza canteiros antes de interações próximas, evitando conflitos com espantalho, lago e objetos do mapa.
- Passarela antiga do lago foi restaurada e continua caminhável, mantendo a água bloqueada.
- Botão da ferramenta "Inseticida" ajustado para não quebrar letras isoladas.
- Ferramenta "Colheita" renomeada para "Cesta" na interface.

### Adicionado
- Chuva visual também no fundo da página, fora do quadro do jogo.
- Som ambiente de chuva gerado por Web Audio API e controlado pelo mute do jogo.
- GIF curto de chuva e vento para a documentação do README.

### Alterado
- Grama, árvores, flores, folhas e água receberam vento mais perceptível e suave, com intensidade maior em dias chuvosos.
- Screenshots do README atualizados com a versão atual do jogo.
- README e documentação atualizados com os polimentos visuais, chuva externa, som de chuva e renomeação da ferramenta.

## [2.11.0] - 2026-05-12
### Corrigido
- Nome definitivo atualizado para "Vale dos Casos" em interface, documentação e metadados.
- Menu inicial recebeu orientações básicas visíveis e ajustes para não cortar o preview do personagem.
- Ponte/passarela do lago agora usa tile caminhável próprio, mantendo água bloqueada.
- Canteiros próximos ao espantalho priorizam a ferramenta ou clique no canteiro antes da interação com o assistente.
- Modais de loja e caixa de venda preservam a posição de rolagem ao vender itens.
- Crescimento das plantas rebalanceado para reduzir atrasos exagerados por clima, solo encharcado e eventos aleatórios.
- Texto da ferramenta "Inseticida" revisado para não estourar o botão.

### Alterado
- Chaves novas do LocalStorage usam `vale-dos-casos-*`, mantendo leitura e migração dos saves antigos.
- CBR revisado para usar linguagem de "caso" e evitar salvar experiências idênticas repetidas.
- README e documentação atualizados para o nome definitivo e as correções de gameplay.

## [2.10.0] - 2026-05-11
### Corrigido
- Ciclo natural de dia/noite agora avança o dia de verdade ao chegar ao novo amanhecer.
- Avanço manual ao dormir foi protegido contra avanço duplo.
- Menu inicial ajustado para telas menores e alturas baixas, com limites por `dvh`, `vw` e rolagem interna.

### Adicionado
- Constante clara para duração do ciclo visual, agora configurada para cerca de 7 minutos.
- Modal próprio da Caixa de Venda, exibindo apenas venda de colheitas e peixes.
- Placa de estatísticas das plantas perto da Loja da Vila.
- Painel "Estatísticas das Plantas" usando os dados reais de `cropTypes.ts`.

### Alterado
- Transições de amanhecer, entardecer e noite ficaram mais suaves no `WeatherVisualSystem`.
- Loja da Vila continua com compra e venda, enquanto a Caixa de Venda ficou dedicada a entregas.
- Textos contextuais da loja, caixa de venda e placa de culturas foram atualizados.
- README e documentação atualizados com avanço natural do dia, caixa de venda separada e guia de culturas.

## [2.9.0] - 2026-05-11
### Corrigido
- Introdução ajustada para não aceitar pulos acidentais no carregamento inicial e manter o aviso de pular centralizado.
- Chuva agora molha os canteiros automaticamente e conta como rega natural no avanço do dia.
- Linha de pesca reposicionada para sair da ponta da vara, não do corpo do personagem.
- Fundo, clima e horário são atualizados corretamente ao dormir e iniciar um novo dia.
- Cenoura pronta para colher agora mostra folhas e apenas uma pequena parte laranja acima do solo.

### Adicionado
- Abertura com placa de madeira, folhas, cerca e casinha mais integrada ao cenário.
- Screenshot de pesca atualizado e novo screenshot com todas as culturas prontas para colher.
- Idle animation sutil no personagem parado.
- Mais variação de nuvens por clima e vento mais forte em dias chuvosos.

### Alterado
- Paleta noturna escurecida e combinada com chuva, nublado, seco e ensolarado.
- Lagoa, vitórias-régias, grama, flores, árvores e vento receberam polimento de movimento.
- README e documentação atualizados com chuva como rega natural, ciclo visual e novos screenshots.

## [2.8.0] - 2026-05-11
### Corrigido
- Campo de nome do personagem passa a aceitar letras usadas pelos atalhos do jogo, como A, W, S, D, E, Q, N e TAB, quando o foco está no formulário.
- Solo encharcado agora drena em dias sem chuva, evitando canteiros travados por muitos dias.
- Crescimento da cenoura ajustado para ficar pronta em poucos dias quando recebe água e solo equilibrado.
- Regras do CBR reforçadas para evitar tratar pragas inexistentes e adubar canteiros já saudáveis e adubados.

### Adicionado
- Nome oficial "Vale dos Casos".
- Animação de abertura com título, fazenda ao fundo, folhas e opção de pular com clique, Enter ou Espaço.
- Trajetória contínua de sol e lua em arco, com nascer pela esquerda e pôr pela direita.
- Melhorias visuais nas culturas prontas para colher, com formas mais distintas para cenoura, milho, tomate e morango.

### Alterado
- Identidade visual e textos principais atualizados para "Vale dos Casos".
- Ciclo visual de céu e paleta ajustado para transições mais suaves entre dia, tarde, noite e amanhecer.
- README, documentação e roteiro atualizados com o trocadilho casos, novo nome e ajustes de crescimento/CBR.

## [2.7.0] - 2026-05-09
### Corrigido
- Ciclo visual de dia/noite ajustado para uma transição mais lenta e gradual.
- Sol, lua e brilho do fundo reposicionados para ficarem mais visíveis na área do céu.
- NPC da loja reposicionado atrás do balcão e com indicador de interação mais claro.
- Balão visual bugado do NPC removido.
- Placa da loja revisada para evitar textos "LOJA" sobrepostos.
- Menu interno sem duplicação da explicação "Como o CBR funciona neste jogo".

### Adicionado
- Piscada sutil no personagem do jogador.
- Piscada sutil no NPC vendedor.
- Vitórias-régias com tamanhos, posições e movimento de boiar mais variados.
- Mais variações visuais de grama, matinhos, flores e árvores.

### Alterado
- CBR passa a consultar casos aprendidos antes da base inicial, dando mais peso à memória recente do jogador.
- Regras de segurança do CBR reforçadas para evitar recomendações impossíveis, como plantar sem semente, colher antes da hora ou regar solo encharcado.
- Vento, lagoa, vegetação e árvores receberam ajustes para parecerem mais naturais e menos repetitivos.
- README, documentação e capturas atualizados para refletir o estado atual do jogo.

## [2.6.0] - 2026-05-09
### Corrigido
- Botão "Menu" reposicionado para dentro do quadro do jogo.
- Painel fixo de controles removido da lateral principal.
- Seletor nativo de cor substituído por paletas próprias, evitando abertura acidental.
- Texto "Seu fazendeiro" ajustado para "Seu personagem".
- Camadas do mapa revisadas para evitar árvores invadindo visualmente a casa.

### Adicionado
- Prints do menu, fazenda, loja, pesca, casa e CBR na documentação.
- Novos estilos de cabelo, incluindo trança simples e chapéu de palha.
- Novos estilos de roupa, incluindo roupa longa, camiseta com alça e roupa de fazenda.
- Botões de paleta de cor com destaque visual da seleção atual.
- Movimento visual de sol/lua e paleta automática de noite durante sessões longas.

### Alterado
- Explicação "Como o CBR funciona neste jogo" reposicionada logo abaixo do jogo.
- Personagem com rosto e variações visuais mais claras de cabelo, roupa e acessórios.
- Loja, NPC vendedor, cerca, caminhos e sinalização visual receberam polimento.
- README atualizado para refletir a UX atual e incluir capturas do jogo.

## [2.5.0] - 2026-05-08
### Corrigido
- Seletor de cor recebendo blur ao clicar fora ou apertar `ESC`.
- Textos de controles incompletos para `E`, `Espaço`, clique esquerdo e clique direito.
- Pesca instantânea e fácil de spammar.
- Linha de pesca desalinhada, agora saindo do personagem até a água.
- Ferramenta "Pragas" renomeada para "Inseticida".
- Placas sem função, agora com dicas contextuais.
- Bug visual de árvores invadindo a área da casa.
- Cerca vertical usando o mesmo visual da cerca horizontal.

### Adicionado
- Pesca com estados de lançamento, espera, aproximação, fisgada, captura e falha.
- Bolhas, boia, ondulações e tempo de reação na pesca.
- Ícones SVG simples para sementes, colheitas, peixes, clima, ferramentas e loja.
- Indicadores de interação sobre casa, loja, lago, placas e Assistente CBR.
- NPC vendedor e placa visual da loja.
- Interior de casa mais completo, com cama, tapete, mesa, janela, baú e calendário.
- Menu interno do jogo com dormir, som, salvar, resetar, controles e explicação CBR.
- Ciclo visual de noite ao dormir, com lua e paleta mais fria.
- Vento dinâmico com folhas leves e mais movimento ambiental.
- CBR com comentários de economia e pesca.

### Alterado
- Melhorias visuais no lago, casa, loja, cercas, árvores, grama, flores, espantalho e HUD.
- Economia da loja continua dinâmica e agora é comentada pelo Assistente CBR.
- Trocar sementes com `TAB` ou pelo painel passa a equipar automaticamente a ferramenta Semente.
- Customização do personagem ampliada com estilos de cabelo e roupa.
- Interface lateral mais limpa, com ações gerais movidas para o menu interno.

## [2.4.0] - 2026-05-08
### Adicionado
- Menu principal com customização de personagem.
- Personagem segurando ferramentas visualmente.
- Tipos diferentes de sementes e culturas.
- Loja com compra, venda e economia dinâmica.
- Lago vivo com animação de água.
- Sistema simples de pesca.
- Mapa maior com câmera seguindo o personagem.
- Casa interativa para dormir e avançar o dia.
- Interação com canteiros por clique.
- Céu e efeitos visuais de clima.
- Árvores maiores com animação de vento.
- Melhorias visuais na casa, cerca e mapa.
- CBR considerando tipo de cultura.
- UI inspirada em jogos web casuais, com botões, ícones, feedbacks e menus mais amigáveis.

### Alterado
- Melhorias gerais no visual e no game feel.
- HUD, mensagens, ícones e feedbacks mais amigáveis.
- Canteiros, plantas, árvores, casa, cerca e mapa com visual mais vivo.
- Interface menos acadêmica e mais próxima de um jogo web casual.
- Documentação atualizada para loja, pesca, culturas, customização e CBR por cultura.

## [2.2.0] - 2026-05-08
### Adicionado
- Estados visuais para solo seco, normal, molhado, encharcado e adubado.
- Partículas e efeitos para ferramentas.
- Animações ambientais e feedback visual do CBR.
- Sons simples de ações e botão mute.
- Destaque visual no canteiro analisado pelo Assistente CBR.

### Alterado
- Melhorias gráficas no mapa, canteiros, plantas, HUD e assistente.
- Versão do projeto atualizada para refletir o polimento visual e de game feel.

## [2.1.0] - 2026-05-08
### Adicionado
- Repositório organizado para publicar a versão final em Phaser 3 pela branch `main`.
- Workflow ajustado para deploy pela `main`.
- Migração do jogo para Vite, TypeScript e Phaser 3.
- Arquitetura modular com Scenes, Systems, Entities, Data e UI.
- Configuração de deploy automático no GitHub Pages.
- Workflow GitHub Actions para build e publicação.
- Base path do Vite ajustado para `/fazenda-inteligente-cbr/`.

### Alterado
- O jogo passou a usar Phaser como runtime de Canvas/WebGL.
- A documentação foi atualizada com arquitetura, execução local e deploy.

## [2.0.0] - 2026-05-08
### Adicionado
- Transformação do projeto de simulador/formulário para jogo 2D de fazendinha.
- Adicionado mapa em Canvas.
- Adicionado personagem jogável.
- Adicionado sistema de plantio, rega, adubo, pragas e colheita.
- Adicionado assistente CBR integrado ao gameplay.
- Adicionado sistema de dias, clima, moedas e inventário.
- Adicionada persistência com LocalStorage.
- Atualizada documentação.

## [1.0.0] - 2026-05-07
### Adicionado
- Estrutura inicial do projeto.
- Primeira versão acadêmica do projeto de fazenda com CBR.
- Base inicial de casos.
- Cálculo de similaridade.
- Ciclo Retrieve, Reuse, Revise e Retain.
- Persistência com LocalStorage.
- Documentação do projeto.
