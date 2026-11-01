# 💪 Meu Treino

App simples para acompanhar treinos de musculação, direto do celular.

## O que ele faz

- **Treino**: escolha uma rotina (A, B, C…) ou faça um treino livre. Registre carga e repetições de cada série e marque ✓ quando terminar.
  - Os campos já vêm preenchidos com o que você fez da última vez naquele exercício.
  - Ao marcar uma série, abre um **timer de descanso** de 90 s (com +15 s).
- **Histórico**: todos os treinos salvos, com duração, séries e volume total (kg × reps).
- **Progresso**: gráfico da maior carga por treino em cada exercício, recorde pessoal e 1RM estimado.
- **Rotinas**: edite seus treinos fixos (um exercício por linha).
- **Backup**: exporte/importe seus dados em JSON.

Os dados ficam salvos **no próprio aparelho** (localStorage). Funciona offline e pode ser instalado na tela inicial.

## Como usar

É só HTML, CSS e JavaScript — sem instalar nada.

- **Testar no computador:** rode `python3 -m http.server` nesta pasta e abra http://localhost:8000
- **Usar no celular:** publique com o GitHub Pages (Settings → Pages → Deploy from branch) e abra o link no celular. No menu do navegador, escolha **"Adicionar à tela inicial"**.
