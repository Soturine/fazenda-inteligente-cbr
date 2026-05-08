# Roteiro de Apresentação

## 1. Introdução ao problema

"Nosso projeto simula uma fazenda inteligente. O jogador informa a situação da plantação, como clima, solo, folhas, pragas e crescimento. A partir disso, a IA recomenda uma ação para cuidar melhor da planta."

## 2. O que é CBR

"CBR significa Raciocínio Baseado em Casos. A ideia principal é resolver um problema novo comparando com problemas antigos parecidos. O sistema procura uma experiência anterior, reaproveita a solução, adapta quando necessário e salva a nova experiência."

## 3. Como o jogo funciona

"Na tela, temos a plantação, os campos para montar uma situação e o Painel CBR. Podemos escolher os atributos manualmente ou gerar uma situação aleatória."

## 4. Demonstração do caso atual

"Este é o caso atual. Ele representa o estado da plantação agora. O caso possui clima, solo, folhas, pragas e crescimento."

## 5. Demonstração do caso recuperado

"Ao clicar em Analisar com CBR, o sistema compara o caso atual com a base de casos. O caso mais parecido aparece no painel, junto com a solução usada anteriormente."

## 6. Explicação da similaridade

"A similaridade é calculada por pontos. Clima igual vale 20, solo igual vale 25, folhas iguais vale 25, pragas iguais vale 20 e crescimento igual vale 10. A soma máxima é 100%, então o resultado aparece como porcentagem."

## 7. Explicação do ciclo CBR

"No Retrieve, o sistema recupera o caso mais parecido. No Reuse, reaproveita a solução. No Revise, adapta a recomendação com regras simples. No Retain, salva o novo caso depois que a ação é aplicada."

## 8. Aprendizado ao salvar novos casos

"Quando aplicamos a ação recomendada, o sistema gera um resultado e salva o novo caso no LocalStorage. Isso mostra como o sistema aprende novas experiências para usar no futuro."

## 9. Conclusão

"O projeto demonstra uma aplicação simples de Inteligência Artificial simbólica. Ele não usa machine learning complexo. A inteligência está na comparação com casos anteriores e nas regras de adaptação da solução."
