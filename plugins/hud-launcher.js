// OpenCode HUD launcher plugin
// Launches the HUD mini-app (C:\projetos\opencode-hud\hud.pyw) using
// pythonw.exe when OpenCode starts. The HUD has its own single-instance
// mutex, so launching it more than once is safe.
//
// OpenCode autoloads every *.js / *.ts file in ~/.config/opencode/plugins
// and calls its default export with an input object; the returned hooks
// object is merged into the plugin lifecycle. We do not need any hooks,
// so we just spawn the process and return {}.
//
// IMPORTANT: a broken plugin prevents OpenCode from starting. Therefore:
//   * everything is wrapped in try/catch
//   * we never throw
//   * we never await the spawned process
//   * we never block (the process is detached and unref'd)
//   * we only do anything on Windows

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const PYTHONW = "C:\\Python315\\pythonw.exe";
const HUD_SCRIPT = "C:\\projetos\\opencode-hud\\hud.pyw";
const HUD_CWD = "C:\\projetos\\opencode-hud";

const HudLauncher = async (_input) => {
  try {
    if (process.platform !== "win32") return {};
    if (!existsSync(PYTHONW)) return {};
    if (!existsSync(HUD_SCRIPT)) return {};

    const child = spawn(PYTHONW, [HUD_SCRIPT], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      cwd: HUD_CWD,
    });
    child.unref();
  } catch {
    // swallow everything - plugins must never throw
  }
  return {};
};

export default HudLauncher;
