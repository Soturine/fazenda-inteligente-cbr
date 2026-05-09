# Roteiro de Apresentação

## 1. O problema

"Queríamos demonstrar Raciocínio Baseado em Casos em um projeto visual e jogável. A primeira ideia poderia virar só um painel de recomendação, mas a versão final transforma o conceito em uma mecânica dentro de um jogo de fazenda."

## 2. A ideia do jogo

"Fazendinha CBR é um jogo top-down feito com Vite, TypeScript e Phaser 3. O jogador anda por uma fazenda maior, cuida de canteiros, compra sementes, vende colheitas, pesca no lago e dorme na casa para avançar o dia."

## 3. O que o jogador faz

"O jogador alterna entre culturas como cenoura, milho, tomate e morango. Para produzir, ele precisa preparar o solo, plantar, cuidar da umidade, controlar pragas, colher quando a planta estiver pronta e vender os itens na loja."

## 4. Onde está a IA

"A IA aparece como o Assistente CBR, um espantalho inteligente. Ela não é a tela principal. Ela observa o estado do canteiro e sugere uma ação quando o jogador pressiona Q."

## 5. Como o CBR funciona no jogo

"Quando pedimos uma recomendação, o sistema monta o caso atual com clima, solo, umidade, pragas, crescimento, saúde, estágio da planta e tipo de cultura. Depois compara esse caso com uma base de experiências anteriores."

## 6. Demonstração prática

"Vamos aproximar o personagem de um canteiro com problema. Ao pressionar Q, o assistente recupera um caso parecido, mostra a similaridade e recomenda uma ação. Se for tomate com pragas, ele tende a recomendar tratar pragas; se o solo estiver seco, tende a recomendar regar."

## 7. Retrieve, Reuse, Revise e Retain

"No Retrieve, o sistema recupera o caso mais parecido. No Reuse, reaproveita a ação usada anteriormente. No Revise, adapta a recomendação com regras agrícolas fortes. No Retain, salva um novo caso depois que o jogador age e avança o dia."

## 8. Como a base aprende

"Depois que usamos uma ferramenta e dormimos, o jogo avalia o resultado. Se melhorou, piorou, colheu ou não teve efeito, essa experiência é salva no LocalStorage e passa a fazer parte da memória do assistente."

## 9. Arquitetura

"O projeto usa uma arquitetura modular: Scenes para telas Phaser, Systems para regras, Entities para objetos de jogo, Data para casos e constantes, e UI para HUD e painel do assistente."

## 10. Conclusão

"O projeto mostra IA simbólica baseada em conhecimento. Não há machine learning complexo. A inteligência vem da comparação entre casos, do reaproveitamento de soluções e das regras de adaptação."
"A parte visual deixa o trabalho com cara de jogo web casual, mas o núcleo acadêmico continua sendo o ciclo Retrieve, Reuse, Revise e Retain."
