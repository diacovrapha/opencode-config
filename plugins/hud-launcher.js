// opencode HUD launcher plugin
//
// Garante que o opencode HUD (app desktop em Tauri, repositório
// https://github.com/diacovrapha/opencode-hud) esteja aberto quando o
// opencode inicia. O HUD normalmente já sobe com o Windows; este plugin é
// só uma rede de segurança.
//
// O app é chamado com "--background": se ele JÁ estiver rodando, a
// instância nova é descartada pelo single-instance sem abrir o dashboard;
// se não estiver, ele sobe só com o widget.
//
// IMPORTANTE: um plugin com erro impede o opencode de iniciar. Por isso:
//   * tudo fica dentro de try/catch e nunca lançamos exceção
//   * nunca esperamos (await) o processo filho
//   * o processo é detached + unref (não bloqueia nem prende o opencode)
//   * só age no Windows e só se o executável existir

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function candidates() {
  const local = process.env.LOCALAPPDATA || "";
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  return [
    // instalador NSIS (por usuário) — o padrão
    join(local, "opencode HUD", "opencode-hud.exe"),
    // instalador MSI (por máquina)
    join(programFiles, "opencode HUD", "opencode-hud.exe"),
    // build local de desenvolvimento
    "C:\\projetos\\opencode-hud\\src-tauri\\target\\release\\opencode-hud.exe",
  ];
}

const HudLauncher = async (_input) => {
  try {
    if (process.platform !== "win32") return {};
    const exe = candidates().find((p) => {
      try {
        return existsSync(p);
      } catch {
        return false;
      }
    });
    if (!exe) return {};

    const child = spawn(exe, ["--background"], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("error", () => {});
    child.unref();
  } catch {
    // engole tudo: plugins nunca podem lançar erro
  }
  return {};
};

export default HudLauncher;
