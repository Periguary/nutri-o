# Configuração e futuras edições

## Princípios

O NutriApoio foi estruturado para funcionar com os recursos gratuitos e integrados do WebDev. Não adicione chaves de API diretamente no código do navegador, em commits ou em arquivos públicos. As variáveis de ambiente disponíveis são injetadas pelo ambiente de execução.

## Onde editar

| Objetivo | Arquivo principal |
| --- | --- |
| Rotas e páginas | `client/src/App.tsx` e `client/src/pages/` |
| Design, cores e animações | `client/src/index.css` |
| Biblioteca de vídeos, categorias e tags | `client/src/pages/Videos.tsx` |
| Assistente, receitas e favoritos | `client/src/pages/Home.tsx` |
| IA server-side | `server/routers.ts` e `server/_core/llm.ts` |
| Diário alimentar | `client/src/pages/Diary.tsx` |
| Lista de compras | `client/src/pages/Shopping.tsx` e `client/src/lib/nutrition-utils.ts` |
| Testes | `server/*.test.ts` |

## Fluxo recomendado

1. Leia a página e o componente relacionados antes de alterar.
2. Preserve o padrão visual: fundo quente, verde botânico, terracota, tipografia editorial e componentes responsivos.
3. Para novas respostas da IA, crie ou atualize uma procedure tRPC no servidor; mantenha uma resposta local de fallback.
4. Para dados simples do usuário, use `localStorage` com uma chave nomeada `nutriapoio-*`. Para sincronização entre dispositivos, adicione autenticação e banco antes de migrar os dados.
5. Para conteúdo de saúde, use linguagem educativa e inclua limites: não diagnosticar, não prescrever medicamentos e recomendar avaliação profissional em sinais de alerta.
6. Rode a validação antes de publicar:

```bash
pnpm check
pnpm test -- --runInBand
pnpm build
```

## Variáveis e segredos

Em produção, consulte as variáveis já configuradas no ambiente WebDev. Nunca copie valores reais para este arquivo. Se uma integração externa for necessária, habilite-a pelo gerenciador de conectores e utilize o fluxo oficial de segredos.

## Publicação

Crie um checkpoint WebDev após uma revisão visual. Para GitHub, confirme o proprietário, nome e visibilidade do repositório, publique apenas código-fonte e documentação, e exclua `node_modules`, `dist`, logs e segredos.
