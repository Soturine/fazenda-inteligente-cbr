# Fazenda Inteligente CBR

Fazenda Inteligente CBR é um jogo/simulador acadêmico em HTML, CSS e JavaScript puro que demonstra o paradigma de Raciocínio Baseado em Casos.

## Objetivo acadêmico

O objetivo é apresentar, de forma prática e visual, como uma aplicação de Inteligência Artificial pode resolver problemas novos comparando a situação atual com experiências anteriores parecidas.

Disciplina: Inteligência Artificial  
Tema: Raciocínio Baseado em Casos  
Autores: _preencher com os nomes do grupo_

## O que é Raciocínio Baseado em Casos

Raciocínio Baseado em Casos, ou CBR, é uma abordagem de IA em que o sistema usa casos antigos para resolver problemas novos.

Um caso normalmente contém:

- descrição do problema;
- solução aplicada;
- resultado obtido;
- explicação.

## Como o jogo demonstra o CBR

No jogo, o jogador informa a situação da plantação:

- clima;
- solo;
- folhas;
- pragas;
- crescimento.

A IA monta o caso atual, compara com a base de casos, recupera o caso mais parecido, reaproveita a solução, revisa a recomendação e salva o novo caso quando a ação é aplicada.

## Tecnologias usadas

- HTML5;
- CSS3;
- JavaScript puro;
- LocalStorage do navegador;
- sem frameworks;
- sem backend.

## Estrutura de pastas

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── cases.js
│   └── cbr.js
├── docs/
│   ├── explicacao-cbr.md
│   └── roteiro-apresentacao.md
├── README.md
├── CHANGELOG.md
└── .gitignore
```

## Como executar localmente

Abra o arquivo `index.html` diretamente no navegador.

Não é necessário instalar dependências, iniciar servidor ou configurar backend.

## Como usar o jogo

1. Escolha os atributos da plantação ou clique no botão de gerar situação aleatória.
2. Clique em **Analisar com CBR**.
3. Observe o caso mais parecido, a similaridade e a recomendação.
4. Clique em **Aplicar ação recomendada**.
5. Veja o resultado e confirme que o novo caso foi salvo na base do navegador.
6. Use **Limpar salvos** para apagar os casos aprendidos no LocalStorage.

## Ciclo CBR no projeto

### Retrieve

O sistema recupera o caso mais parecido da base de casos.

### Reuse

O sistema reaproveita a solução do caso recuperado.

### Revise

O sistema adapta a solução de acordo com regras simples da plantação.

### Retain

Depois que o jogador aplica a ação, o novo caso resolvido é salvo no LocalStorage.

## Fórmula de similaridade

A similaridade é calculada por pontuação:

- clima igual: +20;
- solo igual: +25;
- folhas iguais: +25;
- pragas iguais: +20;
- crescimento igual: +10.

A pontuação máxima é 100. Por isso, o valor final aparece como porcentagem.

Em caso de empate, o sistema escolhe o caso com melhor resultado anterior.

## Exemplos de casos

```json
{
  "id": "base-001",
  "clima": "seco",
  "solo": "seco",
  "folhas": "murchas",
  "pragas": "nenhuma",
  "crescimento": "baixo",
  "solucao": "irrigar",
  "resultado": "melhorou"
}
```

```json
{
  "id": "base-003",
  "clima": "nublado",
  "solo": "pobre em nutrientes",
  "folhas": "amarelas",
  "pragas": "nenhuma",
  "crescimento": "baixo",
  "solucao": "adubar",
  "resultado": "melhorou"
}
```

## Possíveis melhorias futuras

- Permitir cadastro manual de casos pelo usuário.
- Adicionar diferentes tipos de culturas agrícolas.
- Usar níveis numéricos para umidade e nutrientes.
- Criar relatórios com histórico de decisões.
- Exportar e importar a base de casos.
- Adicionar testes automatizados de interface.
