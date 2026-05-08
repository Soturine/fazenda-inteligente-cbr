# Fazendinha CBR

Fazendinha CBR é um jogo 2D top-down de fazenda feito com Vite, TypeScript e Phaser 3. O jogador anda pelo mapa, prepara canteiros, planta sementes, rega, aduba, trata pragas, colhe alimentos e recebe recomendações de um assistente agrícola baseado em Raciocínio Baseado em Casos.

## Objetivo acadêmico

O objetivo do projeto é demonstrar o paradigma de Raciocínio Baseado em Casos, ou CBR, dentro de uma experiência jogável. A IA não aparece como formulário principal: ela é um sistema interno de gameplay que observa o canteiro e recomenda ações ao jogador.

Disciplina: Inteligência Artificial  
Tema: Raciocínio Baseado em Casos  
Autores: _preencher com os nomes do grupo_

## Como acessar online

O jogo publicado no GitHub Pages ficará disponível em:

https://soturine.github.io/fazenda-inteligente-cbr/

## Como executar localmente

Instale as dependências e rode o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## Deploy no GitHub Pages

O projeto usa GitHub Actions para publicar automaticamente no GitHub Pages.

O build é gerado com:

```bash
npm run build
```

O Vite gera os arquivos em `dist/`, e o workflow `.github/workflows/deploy.yml` publica esse conteúdo automaticamente no GitHub Pages.

O `vite.config.ts` usa:

```ts
base: "/fazenda-inteligente-cbr/"
```

Esse caminho é necessário para que os assets funcionem corretamente no GitHub Pages.

## Controles

- `WASD` ou `setas`: mover o personagem.
- `1`: selecionar enxada.
- `2`: selecionar semente.
- `3`: selecionar regador.
- `4`: selecionar adubo.
- `5`: selecionar controle de pragas.
- `6`: selecionar colher.
- `E` ou `Espaço`: usar a ferramenta no canteiro atual ou no canteiro à frente.
- `Q`: pedir recomendação ao Assistente CBR.
- `N`: dormir e avançar para o próximo dia.

## Mecânicas do jogo

O jogador começa com 10 sementes, 0 colheitas e 0 moedas.

O mapa possui grama, caminho, casa, árvores, cerca, espantalho inteligente e uma área de plantio. Os canteiros passam por estados visuais:

- vazio;
- solo preparado;
- semente;
- broto;
- planta média;
- planta adulta;
- planta com problema;
- pronta para colher.

As ferramentas permitem preparar solo, plantar, regar, adubar, tratar pragas e colher plantas prontas. A colheita aumenta as moedas do jogador.

O jogo também possui sistema de dias e clima. Chuva ajuda a regar, clima seco reduz a umidade, clima nublado é neutro e sol pode secar o solo aos poucos.

## Polimento visual e game feel

A versão atual adiciona feedback visual direto para as ações do jogador e para o estado dos canteiros:

- solo seco aparece mais claro, opaco e com pequenas rachaduras;
- solo normal mantém o marrom comum dos canteiros;
- solo molhado aparece mais escuro, com brilhos e pequenos pixels azulados;
- solo encharcado fica ainda mais escuro e mostra poças sutis;
- solo adubado recebe pontos verdes/amarelos e uma borda verde suave por alguns dias;
- plantas com pragas mostram pequenos pontos escuros ou vermelhos se movendo;
- plantas com problema ficam amareladas, murchas ou manchadas;
- plantas prontas para colher exibem frutos amarelos e brilho discreto.

As ferramentas também têm resposta visual e sonora:

- enxada: poeira marrom e tremida visual no canteiro;
- semente: brilho/amarelo caindo no solo;
- regador: gotas azuis;
- adubo: partículas verdes e amarelas;
- controle de pragas: névoa esverdeada;
- colheita: brilho, estrelas e moedas subindo;
- próximo dia: transição rápida de escurecimento.

Os sons são gerados por Web Audio API, sem arquivos externos ou áudio copiado de jogos comerciais. O botão "Som" permite ativar ou desativar o áudio, e a preferência fica salva no LocalStorage.

## Como o CBR aparece no gameplay

O CBR é representado pelo Assistente CBR, um espantalho inteligente no mapa e em um painel compacto lateral. Quando o jogador fica perto de um canteiro e pressiona `Q`, o assistente analisa a situação agrícola daquele canteiro.

O caso atual contém clima, solo, umidade, pragas, crescimento, saúde e estágio da planta. O assistente compara esse caso com a base de casos e recomenda ações como regar, adubar, tratar pragas, plantar, colher ou esperar.

Ao pedir uma recomendação, o canteiro analisado recebe destaque amarelo, o assistente mostra uma animação de pensamento e o painel lateral resume o caso parecido, a similaridade, a ação recomendada e as etapas do ciclo CBR. Quando um novo caso é salvo, o painel indica que uma nova experiência entrou na memória.

## Ciclo CBR no jogo

### Retrieve

Ao pressionar `Q`, o assistente monta o caso atual do canteiro e recupera o caso mais parecido da memória.

### Reuse

A ação aplicada no caso recuperado é usada como solução inicial.

### Revise

A solução é adaptada por regras fortes do jogo:

- canteiro vazio: preparar solo;
- solo preparado: plantar;
- planta pronta: colher;
- pragas altas: tratar pragas;
- solo seco ou baixa umidade: regar;
- solo pobre e planta amarelada: adubar;
- solo encharcado: evitar regar.

### Retain

Depois que o jogador aplica uma ferramenta e avança o dia, o sistema avalia o resultado e salva o novo caso no LocalStorage. Assim, a memória do assistente cresce durante o jogo.

## Fórmula de similaridade

A similaridade é calculada por pontos:

- clima igual: +10;
- solo igual: +20;
- umidade igual: +15;
- pragas iguais: +20;
- crescimento igual: +10;
- saúde igual: +15;
- estágio da planta igual: +10.

A pontuação máxima é 100 pontos. O painel do assistente mostra a porcentagem do caso recuperado de forma discreta.

## Arquitetura

O projeto foi organizado como um jogo modular em Vite + TypeScript + Phaser 3:

```text
.
├── index.html
├── css/
│   └── style.css
├── src/
│   ├── main.ts
│   ├── types.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   └── FarmScene.ts
│   ├── systems/
│   │   ├── CBRSystem.ts
│   │   ├── CropSystem.ts
│   │   ├── DayNightSystem.ts
│   │   ├── EffectSystem.ts
│   │   ├── FarmMap.ts
│   │   ├── InventorySystem.ts
│   │   ├── PlayerSystem.ts
│   │   ├── SaveSystem.ts
│   │   ├── SoundSystem.ts
│   │   ├── VisualStateSystem.ts
│   │   └── WeatherSystem.ts
│   ├── entities/
│   │   ├── Assistant.ts
│   │   ├── CropPlot.ts
│   │   └── Player.ts
│   ├── data/
│   │   ├── gameData.ts
│   │   └── initialCases.ts
│   └── ui/
│       └── UISystem.ts
├── docs/
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

## Responsabilidade dos módulos

- `Scenes`: telas do jogo e integração com Phaser.
- `Systems`: regras de gameplay, CBR, save, inventário, clima, dias, efeitos, som e estados visuais.
- `Entities`: jogador, canteiros e assistente visual.
- `Data`: casos iniciais, labels, atalhos e constantes.
- `UI`: HUD e painel compacto do Assistente CBR.

## Possíveis melhorias futuras

- Adicionar loja de sementes e upgrades de ferramentas.
- Criar diferentes culturas com tempos de crescimento próprios.
- Adicionar música ambiente autoral.
- Implementar sprites autorais mais detalhados para personagem e plantas.
- Criar metas semanais ou missões.
- Exportar e importar a base de casos aprendidos.
