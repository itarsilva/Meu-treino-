# 💪 Meu Treino

App simples para acompanhar treinos de musculação, direto do celular.

## O que ele faz

Visual limpo inspirado nos apps de fitness do iOS: fundo escuro (ou claro, conforme o sistema), títulos grandes e anéis de meta semanal.

- **Resumo**: anéis com as metas da semana (treinos, minutos e séries) e atalho para começar uma rotina.

- **Treino**: escolha uma rotina (A, B, C…) ou faça um treino livre. Registre carga e repetições de cada série e marque ✓ quando terminar.
  - Os campos já vêm preenchidos com o que você fez da última vez naquele exercício.
  - Cronômetro grande do treino em andamento.
  - Ao marcar uma série, abre um **timer de descanso** de 90 s (com +15 s).
- **Histórico**: todos os treinos salvos, com duração, séries e volume total (kg × reps).
- **Progresso**: gráfico da maior carga por treino em cada exercício, recorde pessoal e 1RM estimado.
- **Plano de 5 dias** baseado na avaliação física: ênfase em costas e postura, pernas sem carga na coluna, trabalho unilateral para a coxa esquerda e core. Cada exercício tem meta de séries×repetições (formato `Exercício | 3×10-12`).
- **Corpo** (em Progresso): registro de peso e medidas, gráfico com a faixa ideal de ganho (+0,25 a +0,5 kg/semana) e aviso se o ritmo está baixo ou alto.
- **Aquecimento** com os 5 exercícios, a dose de cada um e o botão “Ver” para a animação.
- **Cartões de treino** no Resumo com o bonequinho de cada rotina e botão ▶.
- **Como fazer**: animação de bonequinho (formas cheias e arredondadas) para cada exercício do plano, com dicas de execução (botão “Ver” no treino e lista em Rotinas).
- **Rotinas**: edite seus treinos fixos (um exercício por linha) e ajuste as metas semanais.
- **Backup**: exporte/importe seus dados em JSON.

Os dados ficam salvos **no próprio aparelho** (localStorage). Funciona offline e pode ser instalado na tela inicial.

## Como usar

É só HTML, CSS e JavaScript — sem instalar nada.

- **Testar no computador:** rode `python3 -m http.server` nesta pasta e abra http://localhost:8000
- **Usar no celular:** publique com o GitHub Pages (Settings → Pages → Deploy from branch) e abra o link no celular. No menu do navegador, escolha **"Adicionar à tela inicial"**.
