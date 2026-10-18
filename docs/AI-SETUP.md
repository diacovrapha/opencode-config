# Guia de adaptação para IA — opencode-config

Você é uma IA assistente de código. Sua tarefa é portar esta configuração do [opencode](https://opencode.ai) para outro usuário, no caminho global da config dele, **sem sobrescrever nada que ele já tenha**. Siga os passos em ordem, na ordem.

## 0. Contexto da config que está sendo portada

- `opencode.jsonc` define `default_agent`, `model`, `small_model`, overrides para `agent.general` e `agent.explore`, e (a partir de 1.19.3) pode liberar pastas fora do projeto com `permission.external_directory` (ex.: pasta de memória local).
- 7 agentes em `agents/*.md` (frontmatter YAML + corpo do prompt). Cada `.md` tem seu próprio `model`, `mode`, `permission`, e opcionalmente `steps` e `variant`.
- `plugins/hud-launcher.js` é Windows-específico e codifica caminhos locais — tratar como opcional (ver passo 7).
- Schema de referência: https://opencode.ai/config.json (o opencode recusa iniciar com config inválida).

## 1. Detectar SO e caminho da config global

```bash
# Linux/macOS
echo "$HOME/.config/opencode"
# Windows (PowerShell)
echo "$env:USERPROFILE\.config\opencode"
```

Caminhos equivalentes: `~/.config/opencode` e `%USERPROFILE%\.config\opencode`.

## 2. Backup e preservação

```bash
# mover config existente para um diretório de backup, nunca deletar
ts="$(date +%Y%m%d-%H%M%S)"
mv ~/.config/opencode ~/.config/opencode.bak.$ts
mkdir -p ~/.config/opencode
```

Leia cada arquivo do backup e só reuse o que for:

- **sovresscrevível com segurança**: `opencode.jsonc`, `agents/*.md` (vão ser mergeados).
- **preservar sempre**: `package.json` (dependências dele), `package-lock.json`, qualquer `node_modules/` curado, plugins customizados dele (não o nosso), instruções pessoais tipo snippets/hooks.
- **preservar sempre** (não versionar, mas não deletar): `auth.json` (credenciais — o opencode guarda em `~/.local/share/opencode/auth.json`).

## 3. Descobrir providers e modelos disponíveis

```bash
opencode models         # lista provider/model-id suportados
opencode auth list      # providers autenticados (mostra o id, ex.: anthropic, minimax-coding-plan)
```

Cada linha de modelo segue o formato `provider/model-id` (ex.: `anthropic/claude-sonnet-4-5`). Anote quais são os modelos fortes do usuário e quais são baratos/assinatura.

## 4. Mapear cada agente para um modelo disponível

Use a tabela abaixo como contrato. Em caso de dúvida, pergunte ao usuário e explique o impacto em custo.

| Slot | Requisito | O que está aqui hoje |
|---|---|---|
| Orquestração/ideação (`ideador`, `chefe`) | Forte, custo moderado | `anthropic/claude-sonnet-5-5` |
| `senior` | O mais forte disponível (pode ser caro) | `anthropic/claude-opus-5-5` |
| `qa` | Forte em revisão/diff | `anthropic/claude-sonnet-5-5` |
| `pleno`, `pesquisador` | Bom em código e tool calling; idealmente de assinatura (custo $0/token) e contexto grande | `minimax-coding-plan/MiniMax-M3` |
| `junior`, `explore` (built-in) | Rápido e barato (idealmente de assinatura) | `minimax-coding-plan/MiniMax-M2.7-highspeed` |

## 5. Copiar/adjust agents/*.md

Edite o frontmatter de cada arquivo e troque o `model:`. Remova `variant: thinking` se o novo modelo não oferecer essa variante (senão a config vira inválida).

## 6. Mesclar opencode.jsonc (não sobrescrever)

Aplique as mudanças no `opencode.jsonc` original do usuário: adicione/atualize `default_agent`, `model`, `small_model`, `agent.general`, `agent.explore`. Preserve campos do usuário que não fazem parte desta config (ex.: `theme`, `provider`, `mcp`).

### Protocolo de ajuda ao sênior (junior/pleno) e memória local

- O `junior` e o `pleno` deste repo já vêm com permissão para chamar o `@senior` (`task: { "*": deny, senior: allow }`). Mantenha esse padrão se quiser preservar a escada de ajuda.
- O `junior` traz `steps: 60` e o `pleno`, `steps: 100` no frontmatter (schema aceita, ver referência rápida). São limites de iterações agentic para travar loops longos. Ajuste à vontade.
- A seção "Quando pedir ajuda ao @senior" dos prompts define gatilhos e formato curto; preserve-a se quiser manter o fluxo.
- O `senior` ganhou um bloco "Modo mentor" — ao receber consulta de junior/pleno, responde sem implementar. Preserve a regra (não chame o senior em modo plano curto e saia implementando por conta própria).
- **Memória local opcional.** Este repo libera a pasta `C:\projetos\_memoria\` (exemplo Windows) via `permission.external_directory: { "C:/projetos/_memoria/**": "allow" }`. Se o usuário não usa essa pasta, remova o bloco; se usa em outro caminho, troque o glob. Os prompts do `ideador` e do `chefe` leem `INDEX.md` e `<projeto>.md` sob demanda, e o chefe pede ao `@junior` para atualizar a memória local no fim de entregas relevantes. A pasta **nunca** vai para o repositório público do projeto.

## 7. Plugin `hud-launcher.js`

**Copie só se o usuário usa Windows e quer o [opencode HUD](https://github.com/diacovrapha/opencode-hud)** (app desktop de gastos). O plugin procura o executável instalado (`%LOCALAPPDATA%\opencode HUD\opencode-hud.exe` ou `%ProgramFiles%\opencode HUD\opencode-hud.exe`) e o abre com `--background`; se não achar, não faz nada. É defensivo (try/catch, no-op fora do Windows, sem bloquear a inicialização).

## 8. CLI `gh` no `pesquisador`

Se o `gh` não estiver instalado, mantenha o `agents/pesquisador.md` mas **remova** os blocos `bash` que dependem dele (deixe só `webfetch: allow`, e `edit: deny`, `task: deny`). Alternativa: substituir a seção "Fontes e técnicas / GitHub (via `gh`)" por pesquisa só via webfetch (GitHub REST API direto).

## 9. Validar

```bash
opencode debug config     # config completa, permissões mescladas, plugins carregados
opencode agent list        # 7 agentes + os built-in, com modelos corretos
```

Se `opencode debug config` reclamar, geralmente é `variant` inválido ou `model` escrito sem prefixo de provider.

## 10. Pedir para reiniciar

O opencode recarrega a config ao iniciar. Diga ao usuário para sair e abrir de novo; sem reinício, nada aplica.

## Referência rápida do formato

### Frontmatter permitido em `agents/*.md`

`name`, `model`, `variant`, `description`, `mode` (`primary`/`subagent`/`all`), `hidden`, `color`, `steps`, `options`, `permission`, `disable`, `temperature`, `top_p`.

### Bloco `permission`

- Uma chave por ferramenta: `edit`, `bash`, `webfetch`, `websearch`, `todowrite`, `question`, `doom_loop`, `task`, `read`, `external_directory`, `skill`, etc.
- Forma simples: `bash: allow` ou `bash: deny` ou `bash: ask`.
- Forma com padrões: `bash: { "*": deny, "git status*": allow }`. **A última regra que casa vence.**
- `webfetch`, `websearch`, `todowrite`, `question` e `doom_loop` aceitam **só** valor simples (sem objeto de padrões).
- `task` usa padrões **por nome de subagente**: `task: { "*": deny, explore: allow, pesquisador: allow, senior: allow }`.
- `external_directory` aceita padrões de caminho (glob) para liberar pastas fora do projeto: `external_directory: { "C:/projetos/_memoria/**": "allow" }`. Use com parcimônia e apenas para pastas suas.
- O bloco `permission` global (no `opencode.jsonc`) é herdado pelos agentes; cada agente mescla o seu próprio por cima. Última regra que casa vence.

### `task` chama subagentes

Quando `task: allow` (ou um padrão), o agente pode delegar para subagentes listados (`@junior`, `@pleno`, `@senior`, `@qa`, `@pesquisador`, `@explore`).

### Corpo do `.md`

É o system prompt do agente em linguagem natural. Sem markdown especial.

## Armadilhas comuns

- **`default_agent` precisa ser um agente `primary` não `hidden`**. Senão o opencode não tem para quem abrir.
- **Modelo sem prefixo de provider** (ex.: `claude-sonnet-5-5` em vez de `anthropic/claude-sonnet-5-5`) — config inválida.
- **`variant` inexistente** no modelo alvo — opencode falha em runtime.
- **Config inválida trava o opencode**. Emergência: `OPENCODE_DISABLE_PROJECT_CONFIG=1` ignora config de projeto, **mas não a global**. Para a global, edite o arquivo manualmente (tem que estar pelo menos JSON válido).
- **Credenciais**: nunca copie `auth.json` para o repo; nunca peça o usuário commitar segredos. O opencode armazena em `~/.local/share/opencode/auth.json`.
- **Prompts em pt-BR**: confirme com o usuário se ele quer manter o idioma ou traduzir. Se traduzir, mantenha a estrutura (papel, processo padrão, regras, saída) intacta.
- **`AGENTS.md` na raiz**: **não crie** — o opencode pode carregar como instrução global e gastar tokens a cada turno. Este guia já está em `docs/`.
