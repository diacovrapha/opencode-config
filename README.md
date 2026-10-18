# opencode-config

Configuração global do [opencode](https://opencode.ai) do **diacovrapha**: agentes, plugin e ajustes padrão. Versionada para auditoria e reprodutibilidade.

## Time de agentes

| Agente     | Tipo     | Modelo                              | Papel                                              |
|------------|----------|-------------------------------------|----------------------------------------------------|
| `ideador`  | primary  | `anthropic/claude-sonnet-5-5`       | Ideação estratégica (default ao abrir o opencode)  |
| `chefe`    | primary  | `anthropic/claude-sonnet-5-5`       | Orquestra a execução a partir do brief do ideador  |
| `senior`   | subagent | `anthropic/claude-opus-5-5`         | Tarefas pesadas, arquitetura e decisões críticas   |
| `qa`       | subagent | `anthropic/claude-sonnet-5-5`       | Revisão, testes e validação                        |
| `pleno`    | subagent | `minimax-coding-plan/MiniMax-M3`    | Implementação geral, custo/benefício equilibrado   |
| `junior`   | subagent | `minimax-coding-plan/MiniMax-M2.7-highspeed` | Tarefas rápidas e de baixo risco           |
| `pesquisador` | subagent | `minimax-coding-plan/MiniMax-M3`  | Levantamento de docs, código e contexto externo    |
| `explore`  | built-in | `minimax-coding-plan/MiniMax-M2.7-highspeed` | Busca/exploração read-only no codebase      |

## Fluxo de trabalho (2 etapas)

1. **Ideação** — conversa com `ideador` (default) para entender o problema, levantar alternativas e gerar um brief estruturado.
2. **Execução** — `chefe` recebe o brief e despacha para `senior` / `qa` / `pleno` / `junior` / `pesquisador` / `explore` conforme a natureza da tarefa.

## Plugin: `hud-launcher`

`plugins/hud-launcher.js` é um plugin do opencode (SDK `@opencode-ai/plugin` 1.19.3) que abre o HUD externo em `C:\projetos\opencode-hud` ao iniciar uma sessão.

## Arquivos versionados

`opencode.jsonc`, `package.json`, `package-lock.json`, `agents/*.md`, `plugins/hud-launcher.js`, `.gitignore`, `README.md`. Dependências em `node_modules/` ficam fora do repo (NPM install resolve).