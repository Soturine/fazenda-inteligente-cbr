# Explicação do CBR

## O que é CBR

CBR significa Raciocínio Baseado em Casos, do inglês Case-Based Reasoning. É uma abordagem de Inteligência Artificial em que o sistema resolve um problema novo usando experiências anteriores parecidas.

Em vez de treinar um modelo estatístico complexo, o sistema consulta uma memória de casos. Cada caso descreve um problema, a solução aplicada e o resultado obtido.

## Como funciona a base de casos

No projeto Fazenda Inteligente CBR, a base de casos funciona como a memória da fazenda. Ela contém situações antigas da plantação, como:

- clima;
- condição do solo;
- aparência das folhas;
- nível de pragas;
- nível de crescimento;
- solução aplicada;
- resultado observado;
- explicação do caso.

A aplicação começa com 10 casos prontos e também salva novos casos no LocalStorage do navegador quando o jogador aplica uma ação recomendada.

## O que é similaridade

Similaridade é a medida de quanto o caso atual se parece com um caso antigo.

O projeto calcula a pontuação assim:

- clima igual: +20 pontos;
- solo igual: +25 pontos;
- folhas iguais: +25 pontos;
- pragas iguais: +20 pontos;
- crescimento igual: +10 pontos.

A soma máxima é 100 pontos. Por isso, a pontuação final é exibida como porcentagem.

Exemplo: se clima, solo e pragas forem iguais, a similaridade será 20 + 25 + 20 = 65%.

## Como o projeto usa Retrieve, Reuse, Revise e Retain

### Retrieve

O sistema compara o caso atual com todos os casos da base e recupera o caso mais parecido.

Se houver empate na pontuação, o sistema escolhe o caso com melhor resultado anterior. A ordem de preferência é:

1. melhorou;
2. melhorou parcialmente;
3. não resolveu.

### Reuse

Depois de recuperar o caso mais parecido, o sistema reaproveita a solução daquele caso. Por exemplo, se o caso antigo recomendava irrigar, essa solução é usada como ponto de partida.

### Revise

Na etapa de revisão, o sistema verifica se a solução precisa ser adaptada para a situação atual.

As regras usadas são:

- se o solo estiver seco e a solução não for irrigar, sugerir o complemento "verificar irrigação";
- se as pragas forem altas, priorizar "aplicar controle de pragas";
- se as folhas estiverem amarelas e o solo estiver pobre em nutrientes, sugerir "adubar";
- se o solo estiver encharcado, evitar recomendar irrigação.

### Retain

Quando o jogador aplica a ação recomendada, o sistema gera um resultado simples e salva o novo caso no LocalStorage. Assim, a base de casos passa a ter mais uma experiência para comparações futuras.

## Por que é uma aplicação simples de IA simbólica

O projeto pode ser considerado uma aplicação simples de IA simbólica ou baseada em conhecimento porque usa regras explícitas e comparação entre casos conhecidos.

As decisões são compreensíveis: é possível ver qual caso foi recuperado, qual solução foi reaproveitada, qual adaptação foi feita e por que o novo caso foi salvo.

O sistema não aprende padrões por redes neurais ou estatística avançada. Ele aprende no sentido de armazenar novas experiências e reutilizá-las depois.

## Limitações do projeto

- A similaridade usa apenas igualdade exata entre atributos.
- Os pesos foram definidos manualmente.
- O resultado da ação é simplificado.
- O sistema não considera tempo, tipo de cultura, estação do ano ou quantidade real de água.
- O aprendizado depende dos casos salvos no navegador do usuário.
- O LocalStorage não é uma base de dados compartilhada entre computadores.
