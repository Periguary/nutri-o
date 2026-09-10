# NutriApoio

Site educativo e gratuito de apoio à alimentação inclusiva no dia a dia.

## Recursos

- Biblioteca de vídeos com pesquisa, categorias e tags.
- Assistente educativo com receitas, substituições, higiene, armazenamento, rótulos e fallback local.
- Guias sobre leitura de rótulos e organização alimentar.
- Receitas para refluxo e gastrite com alertas de segurança.
- Diário alimentar com filtros, gráficos, resumo semanal, avaliações e exportação para PDF.
- Lista de compras por favoritos, categorias, quantidades e compartilhamento.

## Desenvolvimento

```bash
pnpm install
pnpm check
pnpm test -- --runInBand
pnpm build
```

O projeto usa React, Vite, Tailwind, Express, tRPC, Drizzle e os serviços integrados do WebDev. Não há cobrança de serviço externo no fluxo padrão. As respostas são educativas e não substituem avaliação médica ou nutricional.

## Publicação

O arquivo `nutriapoio-source.zip` contém o código completo do projeto, sem dependências instaladas nem artefatos de build. Para executar localmente, extraia o arquivo e rode os comandos acima.
