# Explicação do CBR no jogo

## O que é Raciocínio Baseado em Casos

Raciocínio Baseado em Casos, ou CBR, é uma abordagem de Inteligência Artificial em que um problema novo é resolvido a partir de experiências anteriores semelhantes.

A ideia central é: se o sistema já viu uma situação parecida antes, ele pode reaproveitar a solução que funcionou e adaptá-la ao novo contexto.

## Como o jogo representa um caso

Em Fazendinha CBR, cada caso representa uma situação agrícola de um canteiro. Um caso descreve:

- clima;
- tipo de solo;
- umidade;
- nível de pragas;
- crescimento;
- saúde da planta;
- estágio da planta;
- tipo de cultura;
- ação aplicada;
- resultado observado;
- explicação.

Exemplo:

```json
{
  "clima": "seco",
  "solo": "seco",
  "umidade": "baixa",
  "pragas": "nenhuma",
  "crescimento": "broto",
  "saude": "murcha",
  "estagioPlanta": "crescendo",
  "tipoCultura": "tomato",
  "acaoAplicada": "regar",
  "resultado": "melhorou"
}
```

## Como o assistente recupera casos semelhantes

Quando o jogador pressiona `Q` perto de um canteiro, o `CBRSystem` cria um caso atual com os dados daquele canteiro e do clima do dia.

Depois, o sistema compara o caso atual com todos os casos da base. A similaridade é calculada por pontos:

- clima igual: +10;
- solo igual: +15;
- umidade igual: +15;
- pragas iguais: +15;
- crescimento igual: +10;
- saúde igual: +15;
- estágio da planta igual: +10.
- tipo de cultura igual: +10.

O caso com maior pontuação é recuperado. Em caso de empate, o sistema prefere o caso com melhor resultado anterior.

## Como reutiliza uma solução

Depois de recuperar o caso mais parecido, o assistente reutiliza a ação aplicada no caso antigo. Essa ação pode ser regar, adubar, tratar pragas, plantar, colher ou esperar.

Essa etapa corresponde ao Reuse do ciclo CBR.

## Como adapta a solução

A solução antiga nem sempre serve diretamente para o novo contexto. Por isso, o jogo aplica regras de revisão:

- canteiro vazio: preparar solo;
- solo preparado: plantar;
- planta pronta: colher;
- pragas altas: tratar pragas;
- solo seco ou baixa umidade: regar;
- solo pobre e planta amarelada: adubar;
- solo encharcado: evitar regar;
- canteiro já plantado: não recomendar plantar novamente.
- tomate com pragas médias ou altas: priorizar tratar pragas;
- morango com umidade adequada: manter ou reforçar cuidado com água.

Essa adaptação corresponde ao Revise.

## Como salva novas experiências

Quando o jogador usa uma ferramenta em um canteiro, o jogo guarda o caso atual e a ação aplicada. Ao avançar o dia, o `DayNightSystem` atualiza a plantação, e o `CropSystem` avalia se a ação melhorou, piorou, gerou colheita ou não teve efeito.

O `CBRSystem` salva a nova experiência no LocalStorage. Essa etapa corresponde ao Retain.

## Por que isso é IA simbólica/baseada em conhecimento

O projeto é uma aplicação simples de IA simbólica porque usa regras explícitas, atributos compreensíveis e comparação entre casos conhecidos.

O sistema não usa redes neurais nem machine learning estatístico. Ele raciocina por comparação, adaptação e armazenamento de experiências.

## Limitações do projeto

- A similaridade usa comparação exata de atributos.
- Os pesos foram definidos manualmente.
- A avaliação do resultado é simplificada.
- O clima é sorteado de forma simples.
- O LocalStorage salva dados apenas no navegador do jogador.
- O sistema considera tipos de cultura, mas ainda não possui estações do ano completas.
