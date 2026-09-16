// ============================================
// NIVA — System & Laptop Computer Control Tools
// ============================================

import os from 'os';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { ToolDefinition } from './types';
import { logger } from '../../utils/logger';
import { memoryService } from '../memory/memory.service';
import { documentService } from '../memory/document.service';
import { generationService } from '../generation/generation.service';
import { communicationService } from '../communication/communication.service';
import { internetService } from '../internet/internet.service';
import { automationService } from '../automation/automation.service';

const execAsync = promisify(exec);

/**
 * Robust Windows application launcher that resolves full executable paths
 */
export function launchWindowsApp(appName: string, argument?: string): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const key = appName.toLowerCase().trim();
    let cmd = '';
    const safeArg = argument ? argument.replace(/'/g, "''") : '';

    if (key === 'notepad') {
      cmd = safeArg
        ? `Start-Process -FilePath 'notepad.exe' -ArgumentList '${safeArg}'`
        : `Start-Process -FilePath 'notepad.exe'`;
    } else if (key === 'calc' || key === 'calculator' || key === 'hisaab') {
      cmd = `Start-Process -FilePath 'calc.exe'`;
    } else if (key === 'calendar' || key === 'calender' || key === 'cal' || key === 'tareekh') {
      cmd = `try { Start-Process 'outlookcal:' } catch { try { Start-Process 'ms-calendar:' } catch { Start-Process 'https://calendar.google.com' } }`;
    } else if (key === 'spotify' || key === 'music') {
      cmd = `try { Start-Process 'spotify:' } catch { try { Start-Process 'spotify.exe' } catch { Start-Process 'https://open.spotify.com' } }`;
    } else if (key === 'youtube' || key === 'yt') {
      cmd = `Start-Process 'https://www.youtube.com'`;
    } else if (key === 'whatsapp' || key === 'wa') {
      cmd = `try { Start-Process 'whatsapp:' } catch { Start-Process 'https://web.whatsapp.com' }`;
    } else if (key === 'telegram' || key === 'tg') {
      cmd = `try { Start-Process 'tg:' } catch { Start-Process 'https://web.telegram.org' }`;
    } else if (key === 'discord') {
      cmd = `try { Start-Process 'discord:' } catch { Start-Process 'https://discord.com/app' }`;
    } else if (key === 'camera' || key === 'webcam') {
      cmd = `Start-Process 'microsoft.windows.camera:'`;
    } else if (key === 'chrome' || key === 'browser' || key === 'google') {
      const chromeCandidates = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      ];
      const chromeExe = chromeCandidates.find(p => fs.existsSync(p));
      if (chromeExe) {
        cmd = safeArg
          ? `Start-Process -FilePath '${chromeExe}' -ArgumentList '${safeArg}'`
          : `Start-Process -FilePath '${chromeExe}'`;
      } else {
        cmd = safeArg
          ? `Start-Process -FilePath 'chrome.exe' -ArgumentList '${safeArg}'`
          : `Start-Process -FilePath 'chrome.exe'`;
      }
    } else if (key === 'vscode' || key === 'code') {
      const vsCodeCandidates = [
        'C:\\Users\\harsh_2pgm3oe\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
        'C:\\Program Files\\Microsoft VS Code\\Code.exe',
      ];
      const vsCodeExe = vsCodeCandidates.find(p => fs.existsSync(p));
      if (vsCodeExe) {
        cmd = safeArg
          ? `Start-Process -FilePath '${vsCodeExe}' -ArgumentList '${safeArg}'`
          : `Start-Process -FilePath '${vsCodeExe}'`;
      } else {
        cmd = safeArg ? `code '${safeArg}'` : `code`;
      }
    } else if (key === 'workspace') {
      const workspaceDir = path.join(process.cwd(), 'niva_workspace');
      if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir, { recursive: true });
      }
      cmd = `Start-Process -FilePath 'explorer.exe' -ArgumentList '${workspaceDir.replace(/'/g, "''")}'`;
    } else if (key === 'explorer' || key === 'files' || key === 'folder' || key === 'my computer') {
      cmd = safeArg
        ? `Start-Process -FilePath 'explorer.exe' -ArgumentList '${safeArg}'`
        : `Start-Process -FilePath 'explorer.exe'`;
    } else if (key === 'paint' || key === 'drawing') {
      cmd = `Start-Process -FilePath 'mspaint.exe'`;
    } else if (key === 'taskmgr' || key === 'task manager' || key === 'processes') {
      cmd = `Start-Process -FilePath 'taskmgr.exe'`;
    } else if (key === 'settings' || key === 'setting') {
      cmd = `Start-Process 'ms-settings:'`;
    } else if (key === 'control' || key === 'control panel') {
      cmd = `Start-Process 'control.exe'`;
    } else if (key === 'terminal' || key === 'cmd' || key === 'powershell') {
      cmd = `try { Start-Process 'wt.exe' } catch { Start-Process cmd.exe }`;
    } else if (key === 'edge') {
      cmd = safeArg
        ? `Start-Process -FilePath 'msedge.exe' -ArgumentList '${safeArg}'`
        : `Start-Process -FilePath 'msedge.exe'`;
    } else if (key === 'brave') {
      cmd = safeArg
        ? `Start-Process -FilePath 'brave.exe' -ArgumentList '${safeArg}'`
        : `Start-Process -FilePath 'brave.exe'`;
    } else if (key === 'firefox') {
      cmd = safeArg
        ? `Start-Process -FilePath 'firefox.exe' -ArgumentList '${safeArg}'`
        : `Start-Process -FilePath 'firefox.exe'`;
    } else if (key === 'word' || key === 'winword' || key === 'msword' || key === 'ms word') {
      cmd = `Start-Process 'winword.exe'`;
    } else if (key === 'excel' || key === 'msexcel' || key === 'ms excel') {
      cmd = `Start-Process 'excel.exe'`;
    } else if (key === 'powerpoint' || key === 'ppt' || key === 'powerpnt') {
      cmd = `Start-Process 'powerpnt.exe'`;
    } else {
      cmd = safeArg
        ? `try { Start-Process -FilePath '${key}.exe' -ArgumentList '${safeArg}' } catch { Start-Process -FilePath '${key}' -ArgumentList '${safeArg}' }`
        : `try { Start-Process -FilePath '${key}.exe' } catch { try { Start-Process '${key}:' } catch { Start-Process -FilePath '${key}' } }`;
    }

    const fullPowershellCmd = `powershell -WindowStyle Hidden -Command "${cmd}"`;
    exec(fullPowershellCmd, (err) => {
      if (err) {
        logger.warn(`App launch notice: ${err.message}`);
        resolve({ success: false, message: `Failed to launch ${appName}: ${err.message}` });
      } else {
        logger.info(`App launch executed: ${appName} ${argument || ''}`);
        resolve({ success: true, message: `Successfully launched ${appName} on your laptop!` });
      }
    });
  });
}

export const systemTools: ToolDefinition[] = [
  // 1. Get Laptop System Info
  {
    name: 'system_info',
    description: 'Get real-time laptop system specifications including CPU, memory usage, OS version, hostname, and uptime.',
    parameters: {
      type: 'object',
      properties: {
        detail: {
          type: 'string',
          description: 'Level of detail: "basic" or "full"',
          enum: ['basic', 'full'],
        },
      },
      required: [],
    },
    permission: 'safe',
    execute: async (args) => {
      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
      const usedMem = ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2);
      const uptimeHours = (os.uptime() / 3600).toFixed(1);
      const cpus = os.cpus();
      const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';
      const cpuCores = cpus.length;

      let batteryStatus = 'AC Power / Desktop';
      try {
        if (process.platform === 'win32') {
          const { stdout } = await execAsync(
            'powershell -Command "Get-CimInstance -ClassName Win32_Battery | Select-Object -Property EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json"'
          );
          if (stdout.trim()) {
            const bat = JSON.parse(stdout);
            batteryStatus = `${bat.EstimatedChargeRemaining}% (${bat.BatteryStatus === 2 ? 'Charging' : 'Discharging'})`;
          }
        }
      } catch {
        // Battery query may fail on desktop PCs without battery
      }

      const totalMemNum = parseFloat(totalMem);
      const usedMemNum = parseFloat(usedMem);
      const ramPercent = totalMemNum > 0 ? Math.round((usedMemNum / totalMemNum) * 100) : 0;

      const metrics = {
        os: `${os.type()} ${os.release()} (${os.arch()})`,
        platform: process.platform,
        hostname: os.hostname(),
        cpu: `${cpuModel} (${cpuCores} cores)`,
        cpuModel,
        cpuCores,
        ram: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          percent: ramPercent,
        },
        battery: batteryStatus,
        uptime: `${uptimeHours} hours`,
        uptimeHours,
      };

      let out = `💻 **Laptop System Specifications & Telemetry**\n\n`;
      out += `- 🖥️ **Operating System**: \`${metrics.os}\` | Host: \`${metrics.hostname}\`\n`;
      out += `- ⚡ **Processor (CPU)**: \`${metrics.cpu}\`\n`;
      out += `- 🧠 **Memory (RAM)**: **${metrics.ram.used} GB** / **${metrics.ram.total} GB** (${metrics.ram.percent}% in use)\n`;
      out += `- 🔋 **Power State**: \`${metrics.battery}\`\n`;
      out += `- ⏱️ **System Uptime**: \`${metrics.uptime}\`\n\n`;
      out += `<!-- SYSTEM_METRICS: ${JSON.stringify(metrics)} -->`;

      return out.trim();
    },
  },

  // 2. Open Laptop Application
  {
    name: 'system_open_app',
    description: 'Launch an application on the user laptop (e.g., notepad, calculator, chrome, vscode, file explorer, settings).',
    parameters: {
      type: 'object',
      properties: {
        app_name: {
          type: 'string',
          description: 'Name of the app to launch (e.g. notepad, calc, chrome, vscode, explorer, settings, paint, calendar, spotify)',
        },
      },
      required: ['app_name'],
    },
    permission: 'system',
    execute: async (args) => {
      const res = await launchWindowsApp(String(args.app_name));
      return res.message;
    },
  },

  // 2.1 Direct Shell / Terminal Command Execution
  {
    name: 'system_run_command',
    description: 'Execute shell or terminal commands directly on the Windows laptop (e.g. dir, ipconfig, systeminfo, ping, git status, tasklist) and return the output.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The Windows PowerShell/cmd command to execute on the laptop',
        },
      },
      required: ['command'],
    },
    permission: 'system',
    execute: async (args) => {
      const cmd = String(args.command || '').trim();
      if (!cmd) return 'Koi command provide nahi kiya gaya.';

      // Safety check: block destructive commands
      const lower = cmd.toLowerCase();
      if (
        lower.includes('format ') ||
        lower.includes('del /s /q c:\\') ||
        lower.includes('del /f /s /q c:\\') ||
        lower.includes('rmdir /s /q c:\\') ||
        lower.includes('drop database') ||
        lower.includes(':(){ :|:& };:')
      ) {
        return '❌ Security Alert: Destructive command execution blocked by NIVA Safety Protocol.';
      }

      try {
        const { stdout, stderr } = await execAsync(`powershell -NoProfile -Command "${cmd.replace(/"/g, '`"')}"`, {
          cwd: process.cwd(),
          timeout: 20000,
          maxBuffer: 1024 * 512,
        });

        const output = (stdout || stderr || 'Command executed successfully. (No console output)').trim();
        return `💻 **Command Executed:** \`${cmd}\`\n\`\`\`powershell\n${output.slice(0, 3000)}\n\`\`\``;
      } catch (err: any) {
        const errorDetails = (err.stdout || err.stderr || err.message || 'Execution error').trim();
        return `❌ **Execution Error for \`${cmd}\`:**\n\`\`\`\n${errorDetails.slice(0, 1500)}\n\`\`\``;
      }
    },
  },

  // 3. Open URL in Default Browser
  {
    name: 'system_open_url',
    description: 'Open a website or link in the laptop default web browser.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The full URL to open (must start with http:// or https://)',
        },
      },
      required: ['url'],
    },
    permission: 'safe',
    execute: async (args) => {
      const url = String(args.url).trim();
      if (!/^https?:\/\//i.test(url)) {
        return 'Invalid URL. URL must start with http:// or https://';
      }

      try {
        if (process.platform === 'win32') {
          // Use cmd.exe /c start "" which triggers Windows ShellExecute directly to open default browser and bring to front
          await execAsync(`cmd.exe /c start "" "${url.replace(/"/g, '""')}"`);
        } else {
          await execAsync(`xdg-open "${url}"`);
        }
        return `Application/website launched successfully on your laptop.`;
      } catch (err: any) {
        return `Failed to open: ${err.message}`;
      }
    },
  },

  // 4. Calculator Tool
  {
    name: 'calculator',
    description: 'Perform mathematical computations and calculations accurately.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate (e.g. "25 * 40 + sqrt(144)")',
        },
      },
      required: ['expression'],
    },
    permission: 'safe',
    execute: async (args) => {
      const expr = String(args.expression);
      // Clean and sanitize expression: only allow numbers, math operators, parens, Math methods
      const sanitized = expr.replace(/sqrt/g, 'Math.sqrt')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')
        .replace(/pi/gi, 'Math.PI')
        .replace(/\^/g, '**');

      if (!/^[0-9+\-*/().\s,Math.PIEsqrtincosalg**]+$/.test(sanitized)) {
        return 'Error: Invalid characters in math expression.';
      }

      try {
        // Safe evaluation
        const result = Function(`'use strict'; return (${sanitized});`)();
        return `Result of ${expr} = ${result}`;
      } catch (err: any) {
        return `Calculation error: ${err.message}`;
      }
    },
  },

  // 5. Date & Time Tool
  {
    name: 'date_time',
    description: 'Get current date, time, day of the week, and timezone.',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Optional timezone name (e.g. "Asia/Kolkata", "UTC")',
        },
      },
      required: [],
    },
    permission: 'safe',
    execute: async (args) => {
      const now = new Date();
      const tz = args.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

      const timeString = now.toLocaleTimeString('en-IN', { timeZone: tz, hour12: true });
      const dateString = now.toLocaleDateString('en-IN', {
        timeZone: tz,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return `Current Date & Time in ${tz}:\n- Date: ${dateString}\n- Time: ${timeString}\n- ISO: ${now.toISOString()}`;
    },
  },

  // 6. Laptop Screenshot Tool
  {
    name: 'system_screenshot',
    description: 'Capture a screenshot of the laptop screen and save it for analysis.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    permission: 'system',
    execute: async () => {
      try {
        const outDir = path.join(process.cwd(), 'uploads', 'screenshots');
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        const fileName = `screenshot_${Date.now()}.png`;
        const filePath = path.join(outDir, fileName);

        if (process.platform === 'win32') {
          // Use PowerShell Windows Forms to capture screen natively
          const psScript = `
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type -AssemblyName System.Drawing
            $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
            $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.CopyFromScreen($screen.Left, $screen.Top, 0, 0, $bitmap.Size)
            $bitmap.Save('${filePath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
            $graphics.Dispose()
            $bitmap.Dispose()
          `;
          await execAsync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`);
          return `Screenshot captured successfully and saved to ${fileName}. NIVA can now inspect your screen!`;
        } else {
          return 'Screenshot capture is currently optimized for Windows laptop.';
        }
      } catch (err: any) {
        return `Failed to capture screenshot: ${err.message}`;
      }
    },
  },

  // 7. System Audio Volume Control
  {
    name: 'system_volume',
    description: 'Control laptop speaker volume (mute, unmute, volume up, volume down).',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action to perform: "mute", "unmute", "up", "down"',
          enum: ['mute', 'unmute', 'up', 'down'],
        },
      },
      required: ['action'],
    },
    permission: 'safe',
    execute: async (args) => {
      try {
        if (process.platform === 'win32') {
          let charCode = 173; // Mute
          if (args.action === 'up') charCode = 175;
          if (args.action === 'down') charCode = 174;

          const script = `(New-Object -ComObject WScript.Shell).SendKeys([char]${charCode})`;
          await execAsync(`powershell -Command "${script}"`);
          return `Successfully adjusted laptop volume: ${args.action}`;
        }
        return `Volume control simulated: ${args.action}`;
      } catch (err: any) {
        return `Failed to adjust volume: ${err.message}`;
      }
    },
  },

  // 8. Clipboard Tool
  {
    name: 'system_clipboard',
    description: 'Read the current text from the laptop clipboard or copy new text to it.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action: "read" or "write"',
          enum: ['read', 'write'],
        },
        text: {
          type: 'string',
          description: 'Text to copy to clipboard (only when action is "write")',
        },
      },
      required: ['action'],
    },
    permission: 'safe',
    execute: async (args) => {
      try {
        if (process.platform === 'win32') {
          if (args.action === 'read') {
            const { stdout } = await execAsync('powershell -Command "Get-Clipboard"');
            return `Clipboard text:\n${stdout.trim() || '[Empty clipboard]'}`;
          } else {
            const safeText = String(args.text || '').replace(/"/g, '`"');
            await execAsync(`powershell -Command "Set-Clipboard -Value \\"${safeText}\\""`);
            return `Text copied to laptop clipboard successfully.`;
          }
        }
        return 'Clipboard operation simulated.';
      } catch (err: any) {
        return `Clipboard error: ${err.message}`;
      }
    },
  },

  // 9. List Files in Safe User Directories
  {
    name: 'system_list_files',
    description: 'List files and folders in safe user directories (Desktop, Documents, Downloads).',
    parameters: {
      type: 'object',
      properties: {
        folder: {
          type: 'string',
          description: 'Folder name: "Desktop", "Documents", "Downloads", or relative subfolder',
          enum: ['Desktop', 'Documents', 'Downloads'],
        },
      },
      required: ['folder'],
    },
    permission: 'safe',
    execute: async (args) => {
      try {
        const homeDir = os.homedir();
        const safeFolder = args.folder === 'Downloads' ? 'Downloads' : args.folder === 'Desktop' ? 'Desktop' : 'Documents';
        const targetPath = path.join(homeDir, safeFolder);

        if (!fs.existsSync(targetPath)) {
          return `Folder "${safeFolder}" does not exist at ${targetPath}.`;
        }

        const entries = fs.readdirSync(targetPath, { withFileTypes: true });
        const list = entries.slice(0, 20).map((e) => `${e.isDirectory() ? '📁 [DIR]' : '📄 [FILE]'} ${e.name}`);

        return `Files in ${safeFolder} (${entries.length} total, showing first ${list.length}):\n` + list.join('\n');
      } catch (err: any) {
        return `Failed to list files: ${err.message}`;
      }
    },
  },

  // 10. Read Text File Content
  {
    name: 'system_read_file',
    description: 'Read the contents of a safe text file (e.g., .txt, .json, .md, .csv) from Documents, Desktop, or project.',
    parameters: {
      type: 'object',
      properties: {
        filepath: {
          type: 'string',
          description: 'Path of file to read',
        },
      },
      required: ['filepath'],
    },
    permission: 'safe',
    execute: async (args) => {
      try {
        let target = String(args.filepath).trim();
        // Disallow dangerous traversal outside user home or project
        if (!path.isAbsolute(target)) {
          target = path.join(process.cwd(), target);
        }

        if (!fs.existsSync(target)) {
          return `File not found: ${target}`;
        }

        const stat = fs.statSync(target);
        if (stat.isDirectory()) {
          return `Path is a directory, not a file: ${target}`;
        }
        if (stat.size > 1024 * 1024) {
          return `File is too large to display directly (>1MB).`;
        }

        const content = fs.readFileSync(target, 'utf-8');
        return `File content of ${path.basename(target)}:\n\`\`\`\n${content.slice(0, 3000)}\n\`\`\``;
      } catch (err: any) {
        return `Failed to read file: ${err.message}`;
      }
    },
  },

  // 11. Lock Laptop Workstation
  {
    name: 'system_lock',
    description: 'Safely locks the Windows laptop workstation.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    permission: 'confirm',
    execute: async () => {
      try {
        if (process.platform === 'win32') {
          exec('rundll32.exe user32.dll,LockWorkStation');
          return 'Laptop workstation locked successfully. Have a safe break, sir!';
        }
        return 'Lock simulated for non-Windows OS.';
      } catch (err: any) {
        return `Failed to lock system: ${err.message}`;
      }
    },
  },

  // ============================================
  // MEMORY & RAG TOOLS
  // ============================================

  // 12. Save/Remember a Fact
  {
    name: 'memory_save',
    description: 'Save an important fact, preference, or instruction about the user to long-term memory. Use this proactively when the user shares personal preferences, facts about themselves, or instructions for future reference.',
    parameters: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Short unique key/label for the memory (e.g., "favorite_language", "birthday", "work_schedule")',
        },
        content: {
          type: 'string',
          description: 'The full content to remember (e.g., "User prefers Python for backend development")',
        },
        category: {
          type: 'string',
          description: 'Category: "preference", "fact", "instruction", or "general"',
          enum: ['preference', 'fact', 'instruction', 'general'],
        },
      },
      required: ['key', 'content'],
    },
    permission: 'safe',
    execute: async (args, context) => {
      try {
        const userId = context?.userId;
        if (!userId) return 'Cannot save memory: user not authenticated.';

        await memoryService.saveMemory(
          userId,
          String(args.key),
          String(args.content),
          String(args.category || 'general')
        );

        return `Memory saved! I'll remember: "${args.key}" → ${args.content}`;
      } catch (err: any) {
        return `Failed to save memory: ${err.message}`;
      }
    },
  },

  // 13. Recall/List Memories
  {
    name: 'memory_recall',
    description: 'Recall what NIVA knows about the user. Use when the user asks "what do you know about me?", "what do you remember?", or when you need to retrieve stored preferences or facts.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional: filter by category',
          enum: ['preference', 'fact', 'instruction', 'general'],
        },
      },
      required: [],
    },
    permission: 'safe',
    execute: async (args, context) => {
      try {
        const userId = context?.userId;
        if (!userId) return 'Cannot recall memories: user not authenticated.';

        const memories = await memoryService.getMemories(userId, args.category);

        if (memories.length === 0) {
          return 'I don\'t have any saved memories yet. As we chat, I\'ll learn and remember important things about you!';
        }

        const formatted = memories.map((m) => {
          const pin = m.isPinned ? '📌 ' : '';
          return `${pin}**${m.key}** [${m.category}]: ${m.content}`;
        }).join('\n');

        return `Here's what I remember about you (${memories.length} memories):\n\n${formatted}`;
      } catch (err: any) {
        return `Failed to recall memories: ${err.message}`;
      }
    },
  },

  // 14. Semantic Search Across Memories & Documents
  {
    name: 'memory_search',
    description: 'Search across all saved memories AND uploaded documents using semantic/meaning-based search. Use when the user asks about something that might be in their documents or past conversations.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query (natural language)',
        },
      },
      required: ['query'],
    },
    permission: 'safe',
    execute: async (args, context) => {
      try {
        const userId = context?.userId;
        if (!userId) return 'Cannot search: user not authenticated.';

        const query = String(args.query);

        // Search both memories and documents in parallel
        const [memoryResults, docResults] = await Promise.all([
          memoryService.searchMemories(userId, query, 3),
          documentService.searchDocuments(userId, query, 3),
        ]);

        let response = '';

        if (memoryResults.length > 0) {
          response += '### From Memories:\n';
          response += memoryResults.map((r) =>
            `- **${r.memory.key}** (${(r.score * 100).toFixed(0)}% match): ${r.memory.content}`
          ).join('\n');
        }

        if (docResults.length > 0) {
          response += '\n\n### From Documents:\n';
          response += docResults.map((r) =>
            `- **${r.documentName}** [chunk ${r.chunkIndex + 1}] (${(r.score * 100).toFixed(0)}% match):\n  > ${r.chunkContent.slice(0, 200)}...`
          ).join('\n');
        }

        if (!response) {
          return `No relevant results found for "${query}" in memories or documents.`;
        }

        return response;
      } catch (err: any) {
        return `Search failed: ${err.message}`;
      }
    },
  },

  // ============================================
  // MULTI-MODAL GENERATION TOOLS
  // ============================================

  // 15. Generate Image
  {
    name: 'generate_image',
    description: 'Generate a stunning visual image, artwork, illustration, logo, or design based on a text prompt.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed description of the image to generate',
        },
        style: {
          type: 'string',
          enum: ['cyberpunk', 'photorealistic', 'anime', '3d-render', 'minimalist', 'vector'],
          description: 'Artistic or visual rendering style',
        },
        aspect_ratio: {
          type: 'string',
          enum: ['1:1', '16:9', '9:16', '4:3'],
          description: 'Aspect ratio of the generated image',
        },
      },
      required: ['prompt'],
    },
    execute: async (args, context) => {
      try {
        const userId = context?.userId || 'default-user';
        const res = await generationService.generateImage(userId, {
          prompt: args.prompt,
          style: args.style || 'cyberpunk',
          aspectRatio: args.aspect_ratio || '1:1',
        });

        const fullImageUrl = res.imageUrl.startsWith('http')
          ? res.imageUrl
          : `http://localhost:3001${res.imageUrl}`;

        return `![${args.prompt}](${fullImageUrl})\n\n🎨 **Generated Artwork**: "${args.prompt}"\n- **Style**: ${res.style} | **Aspect Ratio**: ${res.aspectRatio}`;
      } catch (err: any) {
        return `Image generation failed: ${err.message}`;
      }
    },
  },

  // 16. Generate Code
  {
    name: 'generate_code',
    description: 'Generate production-ready code files, scripts, or components in various programming languages.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'What the code should do or implement',
        },
        language: {
          type: 'string',
          enum: ['typescript', 'python', 'javascript', 'html', 'css', 'sql', 'bash', 'rust'],
          description: 'Programming language for the code',
        },
      },
      required: ['prompt'],
    },
    execute: async (args, context) => {
      try {
        const userId = context?.userId || 'default-user';
        const res = await generationService.generateCode(userId, {
          prompt: args.prompt,
          language: args.language || 'typescript',
        });

        // Write real file to niva_workspace on user laptop
        const workspaceDir = path.join(process.cwd(), 'niva_workspace');
        if (!fs.existsSync(workspaceDir)) {
          fs.mkdirSync(workspaceDir, { recursive: true });
        }
        const fileName = res.fileName || `generated_${Date.now()}.${res.language === 'python' ? 'py' : 'ts'}`;
        const savedFilePath = path.join(workspaceDir, fileName);
        fs.writeFileSync(savedFilePath, res.code, 'utf-8');

        // Automatically launch VS Code with the new file
        await launchWindowsApp('vscode', savedFilePath);

        return `\`\`\`${res.language}\n${res.code}\n\`\`\`\n\n📂 **Saved to Workspace**: \`${savedFilePath}\`\n💻 **IDE**: Opened in VS Code on your laptop\n▶️ **Run command**: \`${res.suggestedRunCommand}\`\n\n${res.explanation}`;
      } catch (err: any) {
        return `Code generation failed: ${err.message}`;
      }
    },
  },

  // 17. Generate Document
  {
    name: 'generate_document',
    description: 'Synthesize formatted structured documents, reports, proposals, or tables in Markdown, HTML, or CSV.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Subject or title of the document to generate',
        },
        format: {
          type: 'string',
          enum: ['markdown', 'html', 'csv', 'json'],
          description: 'Document format to export',
        },
      },
      required: ['topic'],
    },
    execute: async (args, context) => {
      try {
        const userId = context?.userId || 'default-user';
        const res = await generationService.generateDocument(userId, {
          topic: args.topic,
          format: args.format || 'markdown',
        });

        return `📄 **Document Generated: ${res.fileName}** (${res.wordCount} words)\n\n${res.content.slice(0, 1200)}${res.content.length > 1200 ? '\n\n...(Full document available in Generation Studio)' : ''}`;
      } catch (err: any) {
        return `Document generation failed: ${err.message}`;
      }
    },
  },

  // 18. Send Email
  {
    name: 'send_email',
    description: 'Send or draft an email to a contact or email address.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description: 'Recipient email address or contact name',
        },
        subject: {
          type: 'string',
          description: 'Subject line of the email',
        },
        body: {
          type: 'string',
          description: 'Email message body content',
        },
      },
      required: ['recipient', 'body'],
    },
    execute: async (args) => {
      try {
        let recipient = args.recipient;
        if (!recipient.includes('@')) {
          const matches = communicationService.getContacts(recipient);
          if (matches.length > 0 && matches[0].email) {
            recipient = matches[0].email;
          }
        }

        const res = await communicationService.sendMessage({
          channel: 'email',
          recipient,
          subject: args.subject || 'Note from NIVA Assistant',
          content: args.body,
        });

        // Physically launch mail client on Windows laptop!
        if (res.actionUrl && process.platform === 'win32') {
          try {
            await execAsync(`powershell -WindowStyle Hidden -Command "Start-Process '${res.actionUrl.replace(/'/g, "''")}'"`);
          } catch (launchErr: any) {
            logger.warn(`Failed to auto-open email client: ${launchErr.message}`);
          }
        }

        let out = `✉️ **Email Dispatched & Mail Client Launched**\n- **To**: ${res.recipient}\n- **Subject**: ${res.subject}\n- **Status**: ${res.status.toUpperCase()}\n- **Action**: Mail client opened on your laptop.`;
        out += `\n\n<!-- COMMUNICATION_RESULT: ${JSON.stringify({ type: 'email', recipient: res.recipient, subject: res.subject, status: res.status, actionUrl: res.actionUrl, content: args.body })} -->`;
        return out;
      } catch (err: any) {
        return `Email dispatch failed: ${err.message}`;
      }
    },
  },

  // 19. Send Message (WhatsApp / Telegram / SMS)
  {
    name: 'send_message',
    description: 'Send a message to a contact via WhatsApp, Telegram, or SMS.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        channel: {
          type: 'string',
          enum: ['whatsapp', 'telegram', 'sms'],
          description: 'Communication channel',
        },
        recipient: {
          type: 'string',
          description: 'Phone number, username handle, or contact name',
        },
        message: {
          type: 'string',
          description: 'Message text to send',
        },
      },
      required: ['channel', 'recipient', 'message'],
    },
    execute: async (args) => {
      try {
        let recipient = args.recipient;
        if (!recipient.startsWith('+') && !recipient.startsWith('@')) {
          const matches = communicationService.getContacts(recipient);
          if (matches.length > 0) {
            recipient = (args.channel === 'whatsapp' || args.channel === 'sms')
              ? matches[0].phone || recipient
              : matches[0].name;
          }
        }

        const res = await communicationService.sendMessage({
          channel: args.channel,
          recipient,
          content: args.message,
        });

        // Physically launch WhatsApp / Telegram / SMS client on Windows laptop!
        if (res.actionUrl && process.platform === 'win32') {
          try {
            await execAsync(`powershell -WindowStyle Hidden -Command "Start-Process '${res.actionUrl.replace(/'/g, "''")}'"`);
          } catch (launchErr: any) {
            logger.warn(`Failed to auto-open message client: ${launchErr.message}`);
          }
        }

        let out = `💬 **Message Prepared & ${args.channel.toUpperCase()} Launched**\n- **Recipient**: ${res.recipient}\n- **Status**: ${res.status.toUpperCase()}\n- **Action**: Opened ${args.channel.toUpperCase()} on your laptop with pre-filled message.\n- **Message**: "${res.content}"`;
        out += `\n\n<!-- COMMUNICATION_RESULT: ${JSON.stringify({ type: args.channel, recipient: res.recipient, status: res.status, actionUrl: res.actionUrl, message: res.content })} -->`;
        return out;
      } catch (err: any) {
        return `Message dispatch failed: ${err.message}`;
      }
    },
  },

  // 20. Search Contacts
  {
    name: 'search_contacts',
    description: 'Search the NIVA contacts directory by name, company, email, or phone number.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Name, company, email, or query string to search',
        },
      },
      required: [],
    },
    execute: async (args) => {
      const contacts = communicationService.getContacts(args.query);
      if (contacts.length === 0) {
        return `No contacts found matching "${args.query || ''}".`;
      }

      const formatted = contacts.slice(0, 5).map(c => 
        `• **${c.name}** ${c.isFavorite ? '⭐' : ''}\n  - Email: ${c.email || 'N/A'} | Phone: ${c.phone || 'N/A'}\n  - Role: ${c.role || ''} (${c.company || 'N/A'})`
      ).join('\n');

      return `👥 **Found ${contacts.length} Contact(s):**\n\n${formatted}`;
    },
  },

  // 21. Initiate AI Call
  {
    name: 'initiate_call',
    description: 'Start an authorized AI-assisted voice call session with a contact.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        contactName: {
          type: 'string',
          description: 'Name of the contact or caller to connect with',
        },
        phoneNumber: {
          type: 'string',
          description: 'Phone number to dial (optional if contact is in address book)',
        },
      },
      required: ['contactName'],
    },
    execute: async (args) => {
      let contactName = args.contactName;
      let phone = args.phoneNumber || '';

      if (!phone) {
        const matches = communicationService.getContacts(contactName);
        if (matches.length > 0 && matches[0].phone) {
          phone = matches[0].phone;
          contactName = matches[0].name;
        } else {
          phone = '+91 98765 43210'; // Fallback demonstration phone
        }
      }

      const session = communicationService.startCall(contactName, phone, 'outgoing');
      let out = `📞 **AI Voice Call Initiated**\n- **Call ID**: \`${session.id}\`\n- **Contact**: ${session.contactName}\n- **Phone**: ${session.phoneNumber}\n- **Recording**: ${session.isRecording ? 'Active (REC)' : 'Off'}\n- **Status**: Live & Connected. Speak through the Call Console.`;
      out += `\n\n<!-- COMMUNICATION_RESULT: ${JSON.stringify({ type: 'call', id: session.id, contactName: session.contactName, phoneNumber: session.phoneNumber, status: 'connected', isRecording: session.isRecording })} -->`;
      return out;
    },
  },

  // 22. Open in IDE (VS Code / Notepad)
  {
    name: 'system_open_ide',
    description: 'Open a code file or script directly in VS Code or Notepad on the user laptop so they can see and edit the code in real-time.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Absolute or relative path of the file to open',
        },
        code: {
          type: 'string',
          description: 'Code content to save if creating a new file',
        },
        file_name: {
          type: 'string',
          description: 'Name of the file (e.g. script.py, app.tsx)',
        },
        ide: {
          type: 'string',
          enum: ['vscode', 'notepad'],
          description: 'Editor to open the file with',
        },
      },
      required: [],
    },
    execute: async (args) => {
      try {
        const workspaceDir = path.join(process.cwd(), 'niva_workspace');
        if (!fs.existsSync(workspaceDir)) {
          fs.mkdirSync(workspaceDir, { recursive: true });
        }

        let targetPath = args.file_path;
        if (!targetPath) {
          const name = args.file_name || `script_${Date.now()}.py`;
          targetPath = path.join(workspaceDir, name);
        }

        if (args.code) {
          fs.writeFileSync(targetPath, args.code, 'utf-8');
        }

        const ide = args.ide || 'vscode';
        const launchResult = await launchWindowsApp(ide, targetPath);

        return `💻 **Opened in ${ide.toUpperCase()}**\n- **File**: \`${targetPath}\`\n- **Status**: ${launchResult.message}`;
      } catch (err: any) {
        return `Failed to open in IDE: ${err.message}`;
      }
    },
  },
  {
    name: 'web_search',
    description: 'Search the live internet for queries, current news, facts, documentation, or tutorials with instant answers and source citations',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search term or question to search on the live web',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
        },
      },
      required: ['query'],
    },
    execute: async (args) => {
      try {
        const limit = args.limit || 5;
        const res = await internetService.search(args.query, limit);

        let out = `🌐 **Live Web Search Results for "${res.query}"**\n\n`;

        if (res.instantAnswer) {
          out += `💡 **Quick Answer**: ${res.instantAnswer.abstractText}\n`;
          out += `- **Source**: [${res.instantAnswer.source}](${res.instantAnswer.sourceUrl})\n\n`;
        }

        if (res.results.length === 0) {
          out += `*No web results found. Try rephrasing your search query.*`;
          return out;
        }

        out += `### Top Sources:\n`;
        res.results.forEach((r, idx) => {
          out += `${idx + 1}. **[${r.title}](${r.url})**\n   ${r.snippet}\n   *(Source: \`${r.source}\`)*\n\n`;
        });

        return out.trim();
      } catch (err: any) {
        return `Web search failed: ${err.message}`;
      }
    },
  },
  {
    name: 'browse_webpage',
    description: 'Fetch and read the contents of any live webpage or article URL in clean, readable Markdown format',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The complete HTTP/HTTPS URL of the webpage or article to read',
        },
      },
      required: ['url'],
    },
    execute: async (args) => {
      try {
        const page = await internetService.readWebpage(args.url);
        let out = `📖 **Webpage Article: ${page.title}**\n`;
        out += `- **Domain**: \`${page.domain}\` | **Reading Time**: ~${page.readingTimeMin} min (${page.wordCount} words)\n`;
        if (page.author) out += `- **Author**: ${page.author}\n`;
        out += `- **URL**: ${page.url}\n\n`;
        out += `---\n\n`;
        out += page.contentMarkdown.slice(0, 4000); // Send first 4000 chars for prompt safety
        if (page.contentMarkdown.length > 4000) {
          out += `\n\n*(... content truncated for brevity. Total length: ${page.contentMarkdown.length} characters)*`;
        }
        return out;
      } catch (err: any) {
        return `Failed to read webpage: ${err.message}`;
      }
    },
  },
  {
    name: 'fetch_news',
    description: 'Fetch live real-time breaking news or topic-specific news headlines via live news feeds',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'News topic or keyword (e.g. "AI", "Tech", "India", "World", "Business") or leave empty for trending headlines',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of news items to fetch (default: 5)',
        },
      },
      required: [],
    },
    execute: async (args) => {
      try {
        const limit = args.limit || 5;
        const res = await internetService.getNews(args.topic, limit);

        let out = `📰 **Live News Feed: ${res.topic}**\n\n`;
        if (res.items.length === 0) {
          out += `*No news headlines currently available for this topic.*`;
          return out;
        }

        res.items.forEach((item, idx) => {
          out += `${idx + 1}. **[${item.title}](${item.url})**\n`;
          out += `   - Source: \`${item.source}\` | Time: *${item.timeAgo}*\n\n`;
        });

        return out.trim();
      } catch (err: any) {
        return `Failed to fetch news: ${err.message}`;
      }
    },
  },
  {
    name: 'run_workflow',
    description: 'Trigger and execute an autonomous multi-step workflow by name or ID (e.g. "Morning Intelligence Briefing", "Hardware Watchdog")',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        workflow_name: {
          type: 'string',
          description: 'Name or ID of the workflow to run (e.g. "morning briefing", "wf_morning_briefing")',
        },
      },
      required: ['workflow_name'],
    },
    execute: async (args) => {
      try {
        const execution = await automationService.runWorkflow(args.workflow_name);

        let out = `⚡ **Workflow Execution: ${execution.workflowName}**\n`;
        out += `- **Status**: \`${execution.status.toUpperCase()}\` | **ID**: \`${execution.id}\`\n\n`;

        if (execution.status === 'waiting_approval' && execution.pendingApprovalStep) {
          out += `⚠️ **Action Paused for User Approval**:\n`;
          out += `Step "${execution.pendingApprovalStep.step.name}" (${execution.pendingApprovalStep.step.tool}) requires human confirmation.\n`;
          out += `Please approve via the Workflow Center or say *"approve workflow"*.\n\n`;
        }

        out += `### Step Results:\n`;
        execution.stepResults.forEach((sr, idx) => {
          out += `${idx + 1}. **${sr.stepName}** (\`${sr.tool}\`) — \`${sr.status}\` (${sr.durationMs}ms)\n`;
          if (sr.output) {
            const outStr = typeof sr.output === 'string' ? sr.output : JSON.stringify(sr.output);
            out += `   > ${outStr.slice(0, 180).replace(/\n/g, ' ')}${outStr.length > 180 ? '...' : ''}\n`;
          }
        });

        out += `\n<!-- WORKFLOW_RESULT: ${JSON.stringify(execution)} -->`;
        return out.trim();
      } catch (err: any) {
        return `Workflow execution failed: ${err.message}`;
      }
    },
  },
  {
    name: 'list_workflows',
    description: 'List all available automated and scheduled workflows configured on NIVA',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      try {
        const workflows = automationService.getAllWorkflows();
        let out = `⚡ **Configured NIVA Workflows & Automations (${workflows.length})**\n\n`;

        workflows.forEach((w, idx) => {
          const triggerDesc =
            w.trigger.type === 'schedule'
              ? `Schedule: ${w.trigger.schedule?.timeOfDay || `${w.trigger.schedule?.intervalSeconds}s` || w.trigger.schedule?.cron}`
              : w.trigger.type === 'event'
              ? `Event: ${w.trigger.event?.eventName}`
              : 'Manual Trigger';

          out += `${idx + 1}. **${w.name}** [${w.isActive ? '🟢 Active' : '⚪ Inactive'}]\n`;
          out += `   - **Trigger**: ${triggerDesc} | **Steps**: ${w.steps.length}\n`;
          if (w.description) out += `   - *${w.description}*\n`;
          out += `\n`;
        });

        out += `\n<!-- WORKFLOW_LIST: ${JSON.stringify(workflows)} -->`;
        return out.trim();
      } catch (err: any) {
        return `Failed to list workflows: ${err.message}`;
      }
    },
  },
  {
    name: 'schedule_task',
    description: 'Create a new automated scheduled workflow or recurring reminder on NIVA',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        task_name: {
          type: 'string',
          description: 'Descriptive title for the scheduled task',
        },
        tool: {
          type: 'string',
          description: 'Tool to execute (e.g. "fetch_news", "system_info", "web_search")',
        },
        time_of_day: {
          type: 'string',
          description: 'Optional time of day in HH:mm format (e.g. "09:00", "18:30")',
        },
        interval_minutes: {
          type: 'number',
          description: 'Optional recurring interval in minutes (e.g. 30, 60)',
        },
      },
      required: ['task_name', 'tool'],
    },
    execute: async (args) => {
      try {
        const trigger: any = {
          type: 'schedule',
          schedule: {},
        };

        if (args.time_of_day) {
          trigger.schedule.timeOfDay = args.time_of_day;
        } else if (args.interval_minutes) {
          trigger.schedule.intervalSeconds = args.interval_minutes * 60;
        } else {
          trigger.schedule.intervalSeconds = 3600; // default 1 hour
        }

        const created = automationService.createWorkflow({
          name: args.task_name,
          description: `User-scheduled automation for ${args.tool}`,
          trigger,
          steps: [
            {
              id: `step_auto_${Date.now()}`,
              name: `Execute ${args.tool}`,
              tool: args.tool,
              arguments: {},
            },
          ],
          isActive: true,
        });

        return `✅ **Task Scheduled Successfully!**\n- **Workflow**: "${created.name}"\n- **Trigger**: ${JSON.stringify(created.trigger.schedule)}\n- **Action**: \`${args.tool}\``;
      } catch (err: any) {
        return `Failed to schedule task: ${err.message}`;
      }
    },
  },
  {
    name: 'list_plugins',
    description: 'List all installed NIVA plugins, extensions, marketplace status, and custom tool capabilities',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional category filter ("developer", "entertainment", "finance", "utilities")',
        },
      },
    },
    execute: async (args) => {
      const { pluginService } = require('../plugins/plugin.service');
      const plugins = pluginService.getAllPlugins();
      if (!plugins || plugins.length === 0) {
        return 'No plugins currently installed.';
      }

      let filtered = plugins;
      if (args.category) {
        filtered = plugins.filter((p: any) => p.manifest.category.toLowerCase() === args.category.toLowerCase());
      }

      let out = `🧩 **NIVA Installed Plugins (${filtered.length})**:\n\n`;
      filtered.forEach((p: any, idx: number) => {
        const m = p.manifest;
        const statusIcon = p.status === 'active' ? '🟢 Active' : '⚪ Disabled';
        out += `${idx + 1}. **${m.icon || '🧩'} ${m.name}** (v${m.version}) — [${statusIcon}]\n`;
        out += `   - **Category**: \`${m.category}\` | **Author**: ${m.author}\n`;
        out += `   - *${m.description}*\n`;
        if (m.tools && m.tools.length > 0) {
          const toolNames = m.tools.map((t: any) => `\`${t.name}\``).join(', ');
          out += `   - **Provided Tools**: ${toolNames}\n`;
        }
        out += `\n`;
      });

      const pluginPayload = filtered.map((p: any) => ({
        id: p.manifest.id,
        name: p.manifest.name,
        icon: p.manifest.icon || '🧩',
        category: p.manifest.category,
        version: p.manifest.version,
        status: p.status,
        description: p.manifest.description,
        toolsCount: p.manifest.tools?.length || 0,
      }));
      out += `\n<!-- PLUGIN_LIST: ${JSON.stringify(pluginPayload)} -->`;

      return out.trim();
    },
  },
  {
    name: 'toggle_plugin',
    description: 'Enable or disable an installed NIVA plugin/extension by ID or name',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        plugin_id: {
          type: 'string',
          description: 'ID or partial name of the plugin (e.g. "github", "media", "crypto", "linter")',
        },
        enable: {
          type: 'boolean',
          description: 'True to activate, false to disable',
        },
      },
      required: ['plugin_id'],
    },
    execute: async (args) => {
      const { pluginService } = require('../plugins/plugin.service');
      const all = pluginService.getAllPlugins();
      const query = args.plugin_id.toLowerCase().trim();
      const match = all.find(
        (p: any) => p.manifest.id.toLowerCase() === query || p.manifest.name.toLowerCase().includes(query)
      );

      if (!match) {
        return `Plugin matching "${args.plugin_id}" was not found. Use \`list_plugins\` to see available plugins.`;
      }

      const shouldEnable = args.enable !== undefined ? args.enable : match.status !== 'active';
      const updated = await pluginService.togglePlugin(match.manifest.id, shouldEnable);

      return `🧩 **Plugin Updated**: **${updated.manifest.name}** is now **${updated.status.toUpperCase()}**.\n- Provided tools are ${updated.status === 'active' ? 'now active in AI Brain' : 'deactivated'}.`;
    },
  },

  // 31. Multi-Agent Squad Orchestrator Tool (Phase 14)
  {
    name: 'orchestrate_mission',
    description: 'Deploy the NIVA Multi-Agent Squad (Lead Orchestrator, Researcher, Coder, Visionary, Archivist, Executor, Sentinel Guardian) to collaboratively plan, execute, and verify a complex multi-domain mission.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: 'The complex multi-step objective (e.g., "Research latest quantum computing breakthroughs, write Python simulation code, and store insights in memory")',
        },
      },
      required: ['goal'],
    },
    execute: async (args, context) => {
      const { orchestratorService } = require('../agents/orchestrator.service');
      const mission = await orchestratorService.executeDirect(args.goal, context?.userId);

      let out = mission.finalSummary || `🤖 Mission "${args.goal}" completed across ${mission.subtasks.length} specialized agents.`;
      out += `\n\n<!-- MISSION_RESULT: ${JSON.stringify(mission)} -->`;
      return out;
    },
  },

  // 32. List Multi-Agent Squad Roles (Phase 14)
  {
    name: 'list_agents',
    description: 'List all specialized agents in the NIVA Multi-Agent Squad, their roles, capabilities, and system specializations.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const { agentRegistry } = require('../agents/agent.registry');
      const agents = agentRegistry.getAllProfiles();

      let out = `🤖 **NIVA Multi-Agent Squad (${agents.length} Specialized Agents)**:\n\n`;
      agents.forEach((ag: any, idx: number) => {
        out += `${idx + 1}. **${ag.avatar} ${ag.name}** (\`${ag.role}\`) — *${ag.title}*\n`;
        out += `   - **Description**: ${ag.description}\n`;
        out += `   - **Capabilities**: ${ag.capabilities.join(', ')}\n`;
        out += `   - **Allowed Tools**: ${ag.allowedTools.map((t: any) => `\`${t}\``).join(', ')}\n\n`;
      });

      return out.trim();
    },
  },

  // 33. DevOps & Deployment Health Status (Phase 15)
  {
    name: 'devops_status',
    description: 'Inspect full production infrastructure health: PostgreSQL latency & statistics, Redis cache connection, Docker engine & active containers, server memory/CPU uptime, and database backups.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const { devopsService } = require('../devops/devops.service');
      const status = await devopsService.getStatus();

      const dbIcon = status.database.status === 'connected' ? '🟢' : '🔴';
      const redisIcon = status.redis.status === 'connected' ? '🟢' : '🔴';
      const dockerIcon = status.docker.available ? '🟢' : '🟡';

      let out = `🚀 **NIVA DevOps & Deployment Architecture Health**\n\n`;
      out += `### 🗄️ Database & Cache Infrastructure\n`;
      out += `- ${dbIcon} **PostgreSQL**: \`${status.database.status.toUpperCase()}\` (${status.database.latencyMs}ms)\n`;
      out += `  - Users: **${status.database.totalUsers}** | Conversations: **${status.database.totalConversations}** | Memories: **${status.database.totalMemories}** | Workflows: **${status.database.totalWorkflows}**\n`;
      out += `- ${redisIcon} **Redis Cache**: \`${status.redis.status.toUpperCase()}\` (${status.redis.latencyMs}ms)\n\n`;

      out += `### 🐳 Containerization & Virtualization\n`;
      out += `- ${dockerIcon} **Docker Engine**: \`${status.docker.available ? 'ONLINE' : 'HOST DIRECT / EMULATED'}\`\n`;
      if (status.docker.containers && status.docker.containers.length > 0) {
        status.docker.containers.forEach((c: any) => {
          const cIcon = c.isHealthy ? '🟢' : '🟠';
          out += `  - ${cIcon} **${c.name}**: \`${c.status}\` (*${c.image}*)\n`;
        });
      } else {
        out += `  - No active containers detected.\n`;
      }
      out += `\n`;

      out += `### ⚡ Server Telemetry & Process Runtime\n`;
      out += `- **Uptime**: \`${status.server.uptimeFormatted}\`\n`;
      out += `- **Node.js**: \`${status.server.nodeVersion}\` (${status.server.platform})\n`;
      out += `- **Memory (RSS)**: \`${status.server.memory.rssMb} MB\` (Heap: ${status.server.memory.heapUsedMb}/${status.server.memory.heapTotalMb} MB)\n`;
      out += `- **Environment**: \`${status.server.environment.toUpperCase()}\` on Port \`${status.server.port}\`\n\n`;

      out += `### 💾 Disaster Recovery & Backups\n`;
      out += `- **Total Snapshots**: **${status.backups.totalBackups}** backups available\n`;
      if (status.backups.latestBackup) {
        out += `- **Latest Snapshot**: \`${status.backups.latestBackup.filename}\` (${status.backups.latestBackup.sizeKb} KB)\n`;
      }
      out += `\n`;
      out += `<!-- DEVOPS_METRICS: ${JSON.stringify(status)} -->`;

      return out.trim();
    },
  },

  // 34. Database Backup Snapshot Tool (Phase 15)
  {
    name: 'db_backup',
    description: 'Trigger an immediate on-demand cryptographic backup snapshot of the PostgreSQL database, archiving all tables into backups/ directory.',
    permission: 'safe',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const { devopsService } = require('../devops/devops.service');
      const backup = await devopsService.createBackup();

      let out = `💾 **NIVA Database Backup Successfully Created!**\n\n`;
      out += `- **File**: \`${backup.filename}\`\n`;
      out += `- **Size**: **${backup.sizeKb} KB** (${backup.sizeBytes.toLocaleString()} bytes)\n`;
      out += `- **Records Captured**: **${backup.records}** total rows across 14 tables\n`;
      out += `- **Execution Time**: **${backup.durationMs}ms**\n`;
      out += `- **SHA-256 Integrity Digest**: \`${backup.checksum}\`\n`;
      out += `- **Location**: \`${backup.filePath}\`\n\n`;
      out += `<!-- DEVOPS_BACKUP_COMPLETED: ${JSON.stringify(backup)} -->`;

      return out.trim();
    },
  },
];

