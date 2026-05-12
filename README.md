# Vale dos Casos

Vale dos Casos é um jogo web 2D top-down de fazenda feito com Vite, TypeScript e Phaser 3. O jogador explora um mapa maior com câmera, cuida dos canteiros, compra sementes, vende colheitas, pesca no lago e recebe recomendações de um assistente agrícola baseado em Raciocínio Baseado em Casos.

O nome destaca os "casos" usados pelo paradigma CBR. A proposta é transformar experiências anteriores da fazenda em casos úteis para resolver novos problemas.

O visual usa arte original desenhada por código com Phaser/CSS. A direção é inspirada na sensação de jogos de fazenda e jogos web casuais, mas sem copiar sprites, sons, mapas ou assets protegidos.

## Objetivo Acadêmico

Demonstrar o paradigma de Raciocínio Baseado em Casos, ou CBR, dentro de uma experiência jogável. A IA não é um formulário: ela é um sistema interno do jogo que observa o canteiro, compara com experiências anteriores e sugere uma ação.

Disciplina: Inteligência Artificial  
Tema: Raciocínio Baseado em Casos  
Autores: _preencher com os nomes do grupo_

## Como Acessar Online

O jogo publicado no GitHub Pages ficará disponível em:

https://soturine.github.io/fazenda-inteligente-cbr/

## Capturas Do Jogo

As imagens abaixo mostram a versão atual da interface, com abertura, menu de jogo, fazenda jogável, chuva no fundo da página, passarela da lagoa, loja, casa, pesca, culturas prontas e painel CBR integrado ao gameplay.

| Abertura | Menu principal |
|---|---|
| ![Abertura](docs/screenshots/intro.png) | ![Menu principal](docs/screenshots/menu.png) |

| Fazenda | Chuva |
|---|---|
| ![Fazenda](docs/screenshots/fazenda.png) | ![Chuva no mapa e no fundo](docs/screenshots/chuva.png) |

| Passarela da lagoa | Pesca |
|---|---|
| ![Passarela da lagoa](docs/screenshots/ponte-lagoa.png) | ![Pesca](docs/screenshots/pesca.png) |

| Culturas prontas | CBR |
|---|---|
| ![Culturas prontas para colher](docs/screenshots/culturas-prontas.png) | ![CBR analisando um canteiro](docs/screenshots/cbr.png) |

| Loja | Casa |
|---|---|
| ![Loja](docs/screenshots/loja.png) | ![Casa](docs/screenshots/casa.png) |

### GIFs Curtos

| Customização | Chuva |
|---|---|
| ![Customização do personagem](docs/gifs/customizacao.gif) | ![Chuva no mapa e no fundo](docs/gifs/chuva.gif) |

| Pesca | Loja e Caixa |
|---|---|
| ![Pesca com boia e fisgada](docs/gifs/pesca.gif) | ![Loja da Vila e Caixa de Venda](docs/gifs/loja-caixa.gif) |

| Plantio e colheita | Assistente CBR |
|---|---|
| ![Plantio e colheita](docs/gifs/plantio-colheita.gif) | ![Espantalho CBR recomendando uma ação](docs/gifs/cbr.gif) |

| Ciclo dia/noite | Vento e grama |
|---|---|
| ![Ciclo de dia e noite](docs/gifs/ciclo-dia-noite.gif) | ![Vento na grama e na fazenda](docs/gifs/vento-grama.gif) |

## Como Executar Localmente

```bash
npm install
npm run dev
```

Para gerar e testar a versão de produção:

```bash
npm run build
npm run preview
```

## Deploy No GitHub Pages

O projeto usa GitHub Actions para publicar automaticamente no GitHub Pages a partir da branch `main`. O build é gerado com `npm run build`, o Vite cria a pasta `dist/` e o workflow `.github/workflows/deploy.yml` publica esse conteúdo.

O `vite.config.ts` usa:

```ts
base: "/fazenda-inteligente-cbr/"
```

## Controles

- `WASD` ou `setas`: mover o personagem.
- `1` a `7`: trocar ferramenta.
- `TAB`: trocar tipo de semente e equipar automaticamente a ferramenta Semente.
- `E` ou `Espaço`: usar ferramenta ou interagir com casa, loja, caixa de venda, lago e placas.
- Clique esquerdo no canteiro: usar a ferramenta atual.
- Clique direito no canteiro: pedir análise CBR daquele canteiro.
- `Q`: consultar o Assistente CBR.
- `N`: dormir/avançar o dia.
- `ESC`: fechar modais ou abrir o menu interno.

## Mecânicas Do Jogo

O jogador começa com sementes iniciais, moedas e uma fazenda com casa, loja, lago, árvores, cercas, espantalho CBR e canteiros. É possível preparar solo, plantar, regar, adubar, usar inseticida, colher, pescar e vender itens.

A casa é a forma manual de dormir e avançar o dia. Dormir salva o jogo, muda o clima, atualiza a economia e faz as plantações crescerem ou piorarem conforme cuidado, solo, umidade e pragas. Se o jogador não dormir, o ciclo natural de céu também avança o dia ao completar uma volta: o contador aumenta, o clima muda, a economia é atualizada e os casos pendentes do CBR são retidos.

## Menu E Customização

Ao abrir o site, o jogo mostra uma abertura curta com o título "Vale dos Casos" descendo sobre uma pequena cena de fazenda. A animação pode ser pulada com clique, `Enter` ou `Espaço`, e depois o menu principal aparece normalmente.

Antes de entrar na fazenda, o jogo mostra um menu principal com:

- Jogar;
- Continuar;
- Resetar progresso;
- Como jogar;
- Tela cheia;
- customização do personagem.

O menu também mostra um resumo rápido dos controles: `WASD`/setas para mover, `E`/`Espaço` para interagir, clique esquerdo para usar ferramentas nos canteiros, clique direito ou `Q` para consultar o CBR, `TAB` para trocar semente e `1` a `7` para trocar ferramenta.

A customização salva nome, cor da pele, cor do cabelo, cor da roupa, estilo de cabelo e estilo de roupa. As cores são escolhidas por paletas próprias do jogo, sem depender do seletor nativo do navegador. Há opções curtas, médias, longas, rabo de cavalo, cacheadas, trança, femininas, neutras, boné, chapéu de campo e chapéu de palha. Os estilos foram desenhados para ter silhuetas diferentes, e cabelos/acessórios acompanham a direção do personagem quando ele vira. As roupas incluem avental, macacão, camisa, jardineira, casaco, roupa longa, camiseta com alça e roupa de fazenda. Essas escolhas alteram o personagem dentro do jogo e ficam salvas no LocalStorage.

## Menu Interno

O botão "Menu" fica dentro do quadro do jogo, no canto superior direito da área jogável. Ele e a tecla `ESC` abrem um painel interno com dormir, som, salvar, resetar, tela cheia e controles. A explicação acadêmica do CBR fica logo abaixo do jogo para não duplicar informação dentro do menu. A lateral principal fica mais limpa, focada no Assistente CBR, ferramentas e sementes.

## Culturas

O jogo possui quatro culturas:

- cenoura: cresce rápido, vende barato e tolera um pouco de seca;
- milho: cresce mais devagar, vende melhor e gosta de sol;
- tomate: vende bem, mas é mais sensível a pragas;
- morango: prefere clima ameno/chuvoso e vale mais quando pronto.

Cada cultura tem preço de semente, preço base de venda, tempo de crescimento, resistência à seca, resistência a pragas, clima preferido e visual próprio nos estágios de crescimento. A cenoura é a cultura rápida: com água e solo equilibrado, fica pronta em poucos dias, e o adubo acelera levemente o progresso.

## Loja E Economia Dinâmica

A Loja da Vila fica no mapa, tem placa visual e NPC vendedor. Ela abre com `E`, `Espaço` ou clique perto da banca. A loja permite comprar sementes e vender colheitas ou peixes.

A caixa perto da casa é a Caixa de Venda. Ela tem uma interface própria e mostra apenas as opções de venda, sem a seção de compra de sementes. Assim, a função de cada ponto do mapa fica mais clara: loja para comprar e vender, caixa para entregar itens rapidamente.

Perto da loja também existe uma placa de "Culturas". Ao interagir, ela abre o guia de culturas com dados reais do jogo: preço da semente, preço base de venda, dias de crescimento, resistências, clima preferido e descrição.

- comprar sementes;
- vender colheitas;
- vender peixes;
- ver preços atuais;
- acompanhar tendência de mercado.

Os preços variam com o dia, clima, cultura, raridade, vendas recentes e eventos simples de mercado. Se o jogador vende muito um item, o preço tende a cair nos próximos dias. Se o clima prejudica uma cultura, seu preço pode subir. O painel mostra tendência com alta, queda ou estabilidade.

## Lago E Pesca

O mapa inclui um lago orgânico com água animada, reflexos, bolhas, lírios, sombras de peixes e movimento. Com a vara de pesca equipada, o jogador pode pescar perto da água.

A pesca tem etapas:

- lançar a linha;
- esperar a boia;
- ver bolhas se aproximando;
- puxar com `E` ou `Espaço` quando a boia tremer;
- capturar o peixe ou perder a fisgada se demorar.

Peixes disponíveis:

- lambari;
- tilápia;
- carpa;
- peixe dourado raro.

O clima influencia a chance de pesca, e os peixes podem ser vendidos na loja por preços variáveis. Todos os peixes são de água doce.

## Clima Visual E Mundo Vivo

O clima aparece no céu, no mapa e nos efeitos:

- ensolarado: céu azul, brilho quente e sol;
- chuvoso: gotas animadas dentro e fora do quadro do jogo, muitas nuvens, som ambiente de chuva, vento mais forte, lago mais ativo e solo molhado naturalmente;
- nublado: bastante nuvens passando e luz suave;
- seco: tom amarelado, poucas nuvens, poeira e solo secando mais rápido.

Ao chover, a chuva conta como rega natural: canteiros preparados ou plantados ficam com umidade alta, o solo seco volta ao estado normal e o crescimento passa a considerar essa água do dia. A chuva também aparece no fundo da página, atrás do jogo, com gotas discretas em camadas para evitar faixas ou listras visuais, e o som ambiente é gerado por Web Audio API, respeitando o botão de mute. Ao dormir, o jogo faz uma transição de noite com lua e paleta mais fria antes de amanhecer. Durante a sessão, o ciclo visual de dia e noite também avança de forma gradual em um ciclo mais longo, com cerca de 7 minutos: o sol nasce à esquerda, sobe, se põe à direita e dá lugar à lua, que percorre o mesmo arco durante a noite. Quando esse ciclo natural chega a um novo amanhecer, o jogo avança o dia de verdade. O brilho do fundo acompanha o astro principal, e a paleta passa suavemente por amanhecer, dia, entardecer, noite e madrugada. O fundo fora do canvas também muda com clima e noite, misturando chuva, nuvens ou seca com a iluminação do horário.

O mapa foi ampliado e usa câmera seguindo o jogador. Árvores maiores balançam com o vento, folhas cruzam a tela, a grama oscila com variação sutil de tom, a casa possui detalhes, a cerca tem variações de madeira vertical/horizontal e cantos, e a passarela antiga do lago foi redesenhada com madeira e trilhos coerentes. Ela é caminhável no centro visual dos tiles sem liberar o movimento pela água.

## Ferramentas Visíveis

O personagem segura visualmente a ferramenta atual:

- enxada;
- saquinho de sementes;
- regador;
- saco de adubo;
- inseticida/borrifador contra pragas;
- cesta para colher plantas prontas;
- vara de pesca.

As ações têm animações curtas, partículas, sons gerados por Web Audio API e mensagens amigáveis. Há efeitos para plantar, regar, colher, pescar, comprar, vender, abrir menus, selecionar ferramentas/sementes, consultar o CBR, avançar o dia e ouvir chuva ambiente. O botão de som salva a preferência no LocalStorage.

## Como O CBR Aparece No Gameplay

O Assistente CBR é o espantalho inteligente. Ao pressionar `Q` ou clicar com o botão direito em um canteiro, ele monta um caso com:

- clima;
- solo;
- umidade;
- pragas;
- crescimento;
- saúde;
- estágio da planta;
- tipo da cultura.

O sistema recupera o caso mais parecido, reutiliza a ação antiga, revisa a recomendação por regras fortes e aprende quando o jogador avança o dia, seja dormindo ou pelo amanhecer natural do ciclo visual. Os casos aprendidos no navegador têm prioridade na consulta para que experiências recentes influenciem recomendações futuras. O painel compacto mostra similaridade, ação recomendada e ciclo CBR sem dominar a tela.

O assistente também comenta mercado e pesca quando o jogador está perto da loja, caixa de venda ou lago. Ele pode avisar que uma cultura está valorizada, que vender muito derrubou preço, ou que chuva ajuda a pesca.

Uma explicação acadêmica recolhível fica logo abaixo do quadro do jogo, facilitando a apresentação sem poluir a tela principal.

Exemplos de adaptação:

- tomate com pragas médias/altas prioriza tratar pragas;
- solo seco ou umidade baixa prioriza regar;
- solo pobre com planta amarelada prioriza adubar;
- planta pronta prioriza colher;
- solo encharcado evita regar;
- não recomenda plantar sem semente;
- não recomenda colher antes da planta ficar pronta;
- não recomenda inseticida quando não há pragas;
- evita adubar de novo um canteiro já saudável e adubado;
- morango valoriza umidade média/alta.
- tomate barato no mercado pode ser melhor vender depois;
- clima chuvoso pode tornar a pesca uma boa alternativa.

## Fórmula De Similaridade

A similaridade é calculada por pontuação, com máximo de 100 pontos:

- clima igual: +10;
- solo igual: +15;
- umidade igual: +15;
- pragas iguais: +15;
- crescimento igual: +10;
- saúde igual: +15;
- estágio da planta igual: +10;
- tipo de cultura igual: +10.

Em caso de empate, o sistema prefere o caso com melhor resultado anterior.

## Estrutura De Arquivos

```text
.
├── index.html
├── css/style.css
├── src/
│   ├── main.ts
│   ├── types.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── IntroScene.ts
│   │   ├── MenuScene.ts
│   │   └── FarmScene.ts
│   ├── systems/
│   │   ├── CBRSystem.ts
│   │   ├── CameraSystem.ts
│   │   ├── CharacterCustomizationSystem.ts
│   │   ├── CropSystem.ts
│   │   ├── CropTypeSystem.ts
│   │   ├── DayNightSystem.ts
│   │   ├── EconomySystem.ts
│   │   ├── EffectSystem.ts
│   │   ├── FarmMap.ts
│   │   ├── FishingSystem.ts
│   │   ├── IconSystem.ts
│   │   ├── InventorySystem.ts
│   │   ├── PlayerSystem.ts
│   │   ├── PointerInteractionSystem.ts
│   │   ├── SaveSystem.ts
│   │   ├── ShopSystem.ts
│   │   ├── SoundSystem.ts
│   │   ├── ToolVisualSystem.ts
│   │   ├── VisualStateSystem.ts
│   │   ├── WaterSystem.ts
│   │   ├── WeatherSystem.ts
│   │   └── WeatherVisualSystem.ts
│   ├── entities/
│   │   ├── Assistant.ts
│   │   ├── CropPlot.ts
│   │   └── Player.ts
│   ├── data/
│   │   ├── characterOptions.ts
│   │   ├── cropTypes.ts
│   │   ├── fishTypes.ts
│   │   ├── gameData.ts
│   │   ├── initialCases.ts
│   │   └── shopData.ts
│   └── ui/UISystem.ts
├── docs/
│   ├── screenshots/
│   ├── gifs/
│   ├── explicacao-cbr.md
│   └── roteiro-apresentacao.md
├── .github/workflows/deploy.yml
├── vite.config.ts
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
└── .gitignore
```

## Persistência

O LocalStorage salva progresso da fazenda, inventário, sementes por cultura, colheitas, peixes, moedas, preços de mercado, casos aprendidos, customização do personagem, ferramenta atual, semente selecionada, posição do jogador e preferência de som.

## Licença

Este projeto é distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE).

## Possíveis Melhorias Futuras

- Criar missões semanais e NPCs com diálogos.
- Adicionar upgrades de ferramentas.
- Criar música ambiente autoral.
- Adicionar baú, calendário e entregas por encomenda.
- Melhorar a pesca com minigame de precisão.
- Exportar e importar a base de casos aprendidos.
