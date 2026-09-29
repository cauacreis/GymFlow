# Diretrizes de UI/UX & Design Intuitivo de Alta Clareza

## Princípios Centrais

1. **Clareza Absoluta de Estado Visual (Active vs Inactive)**:
   - Elementos interativos selecionáveis (pills, chips, abas de planos, filtros, toggles) devem possuir **contraste imediato e inequívoco** entre os estados selecionado e não selecionado.
   - **Estado Selecionado / Ativo**:
     - Fundo preenchido com cor vibrante em tom cheia de alto contraste (ex: `bg-amber-500 text-zinc-950 font-black` ou `bg-emerald-500 text-zinc-950 font-black`).
     - Ícone explícito de confirmação (`✓` ou `Check`).
     - Sombra de destaque sutil (`shadow-md shadow-amber-500/25` ou `shadow-emerald-500/25`) e anel de foco visível.
   - **Estado Não Selecionado / Inativo**:
     - Fundo neutro e discreto (`bg-zinc-900/80 border-zinc-800 text-zinc-400`).
     - Affordance de ação explícita (ex: ícone `+` ou texto de adição ao passar o cursor).
     - Hover com feedback visual intuitivo (`hover:border-zinc-600 hover:text-zinc-200`).

2. **Affordance e Microinterações Intuitivas**:
   - O usuário nunca deve adivinhar se clicar em um chip/botão vai selecionar, desmarcar, remover ou abrir um formulário.
   - Rótulos e chips com múltiplos itens devem conter marcadores visuais claros (ex: `✓ Incluído` vs `+ Adicionar`).
   - Feedback tátil com `triggerHaptic("selection")` ou `triggerHaptic("light")` em toda interação relevante.

3. **Prévia em Tempo Real (WYSIWYG Feedback)**:
   - Em formulários e wizards de configuração de serviços (ex: criação e edição de planos de personal trainers, fichas de treino para alunos), sempre renderizar um card de **"Prévia em Tempo Real"**.
   - O card deve mostrar fielmente como a outra parte (o aluno ou o professor) visualizará o plano na tela final, atualizando dinamicamente conforme os campos são alterados.

4. **Hierarquia Visual e Guias Passo a Passo**:
   - Quebrar seções densas em etapas ou subseções numeradas e objetivas (ex: `① Escolha o Plano`, `② Defina Preço e Aulas`, `③ Selecione Modalidades`, `④ Prévia para o Aluno`).
   - Manter microcopy humana, concisa e de fácil compreensão, sem sobrecarregar a interface com textos longos ou jargões técnicos.
