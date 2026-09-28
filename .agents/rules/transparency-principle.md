---
name: transparency-principle
description: Aplica o Princípio da Transparência em interfaces e arquitetura, ocultando detalhes técnicos e de infraestrutura do usuário final.
trigger: always_on
---

# Princípio da Transparência em Sistemas e UI

## Diretrizes Fundamentais

1. **Invisibilidade da Mecânica Interna (Transparência de Engenharia)**:
   - Toda e qualquer otimização técnica (compressão WebP, cálculo de hashes SHA-256, reconexões, cache em memória, sanitização XSS, token refresh, retentativas exponenciais) deve ocorrer nos bastidores de forma 100% invisível ao usuário final.
   - O sistema nunca deve se gabar ou exibir métricas de bastidores na UI (ex: proibir textos como *"Foto otimizada em WebP (24KB - 85% menor)"*, *"Payload criptografado via AES"*, *"Cache sincronizado"*).

2. **Microcopy Limpo e Centrado no Usuário**:
   - Mensagens de ajuda, placeholders e rótulos devem informar apenas o que o usuário precisa fazer, sem jargões de backend.
   - *Exemplo Correto*: `"Formatos aceitos: JPG, PNG ou WebP (até 5MB)."`
   - *Exemplo Proibido*: `"Formatos aceitos: JPG, PNG, WebP (até 5MB). O GymFlow compacta automaticamente sua imagem para máxima velocidade."`

3. **Feedbacks de Estado Simples e Humanos**:
   - Estados de carregamento e progresso devem usar termos cotidianos:
     - Usar: `"Carregando..."`, `"Processando..."`, `"Salvando..."`, `"Conectado"`.
     - Evitar: `"Otimizando imagem..."`, `"Calculando hash binário..."`, `"Executando pipeline de compressão..."`.

4. **Preservação Rígida da Segurança e Otimização**:
   - Omitir o texto da interface **NÃO** significa remover o processamento. A validação de magic bytes, reprocessamento WebP, sanitização e rate limiting devem continuar operando com máxima rigidez nos bastidores.
