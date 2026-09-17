// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use sysinfo::System;
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DeviceIdentity {
    pub device_id: String,
    pub hostname: String,
    pub os_name: String,
    pub platform: String,
    pub cpu_brand: String,
    pub total_memory_gb: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SystemTelemetry {
    pub cpu_usage: f32,
    pub used_memory_gb: f64,
    pub total_memory_gb: f64,
    pub uptime_hours: f64,
    pub process_count: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CommandResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
}

// 1. Get Hardware Device Identity Fingerprint
#[tauri::command]
fn get_device_identity() -> DeviceIdentity {
    let mut sys = System::new_all();
    sys.refresh_all();

    let hostname = System::host_name().unwrap_or_else(|| "NIVA-HOST".into());
    let os_name = System::long_os_version().unwrap_or_else(|| "Windows 11".into());
    let cpus = sys.cpus();
    let cpu_brand = if !cpus.is_empty() {
        cpus[0].brand().to_string()
    } else {
        "Unknown CPU".into()
    };
    let total_memory_gb = (sys.total_memory() as f64) / (1024.0 * 1024.0 * 1024.0);

    // Deterministic hardware fingerprint
    let device_id = format!("NIVA-PC-{}-{}", hostname, (total_memory_gb * 100.0) as u64);

    DeviceIdentity {
        device_id,
        hostname,
        os_name,
        platform: std::env::consts::OS.to_string(),
        cpu_brand,
        total_memory_gb: (total_memory_gb * 100.0).round() / 100.0,
    }
}

// 2. Get Live System Telemetry
#[tauri::command]
fn get_telemetry() -> SystemTelemetry {
    let mut sys = System::new_all();
    sys.refresh_all();
    sys.refresh_cpu();

    let cpu_usage = sys.global_cpu_info().cpu_usage();
    let total_memory_gb = (sys.total_memory() as f64) / (1024.0 * 1024.0 * 1024.0);
    let used_memory_gb = (sys.used_memory() as f64) / (1024.0 * 1024.0 * 1024.0);
    let uptime_hours = (System::uptime() as f64) / 3600.0;
    let process_count = sys.processes().len();

    SystemTelemetry {
        cpu_usage: (cpu_usage * 10.0).round() / 10.0,
        used_memory_gb: (used_memory_gb * 100.0).round() / 100.0,
        total_memory_gb: (total_memory_gb * 100.0).round() / 100.0,
        uptime_hours: (uptime_hours * 10.0).round() / 10.0,
        process_count,
    }
}

// 3. Launch Typed Allowlisted Windows Apps
#[tauri::command]
fn launch_allowed_app(app_name: String) -> CommandResult {
    let target = app_name.to_lowercase().trim().to_string();
    
    let cmd = match target.as_str() {
        "notepad" => Some("notepad.exe"),
        "calculator" | "calc" => Some("calc.exe"),
        "chrome" | "browser" => Some("cmd /c start chrome"),
        "vscode" | "code" => Some("cmd /c code"),
        "explorer" => Some("explorer.exe"),
        "settings" => Some("cmd /c start ms-settings:"),
        "terminal" | "cmd" => Some("cmd /c start cmd.exe"),
        _ => None,
    };

    if let Some(command_str) = cmd {
        let parts: Vec<&str> = command_str.split_whitespace().collect();
        if let Some((prog, args)) = parts.split_first() {
            let mut command = std::process::Command::new(prog);
            command.args(args);
            match command.spawn() {
                Ok(_) => CommandResult {
                    success: true,
                    output: format!("Successfully launched {}", target),
                    error: None,
                },
                Err(e) => CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("Launch failed: {}", e)),
                },
            }
        } else {
            CommandResult {
                success: false,
                output: String::new(),
                error: Some("Malformed command structure".into()),
            }
        }
    } else {
        CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("App '{}' is not in the trusted allowlist.", target)),
        }
    }
}

// 4. Window Visibility Controls
#[tauri::command]
fn toggle_hud(app: AppHandle) -> bool {
    if let Some(window) = app.get_webview_window("hud") {
        if let Ok(is_visible) = window.is_visible() {
            if is_visible {
                let _ = window.hide();
                return false;
            } else {
                let _ = window.show();
                let _ = window.set_focus();
                return true;
            }
        }
    }
    false
}

#[tauri::command]
fn toggle_main_window(app: AppHandle) -> bool {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(is_visible) = window.is_visible() {
            if is_visible {
                let _ = window.hide();
                return false;
            } else {
                let _ = window.show();
                let _ = window.set_focus();
                return true;
            }
        }
    }
    false
}

// 5. Native Safe System Control & Power Management (Gated)
#[tauri::command]
fn lock_workstation() -> CommandResult {
    let mut cmd = std::process::Command::new("rundll32.exe");
    cmd.args(["user32.dll,LockWorkStation"]);
    match cmd.spawn() {
        Ok(_) => CommandResult {
            success: true,
            output: "Workstation locked securely.".into(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to lock workstation: {}", e)),
        },
    }
}

#[tauri::command]
fn restart_pc(confirmed: bool) -> CommandResult {
    if !confirmed {
        return CommandResult {
            success: false,
            output: String::new(),
            error: Some("Restart aborted: Explicit confirmation required.".into()),
        };
    }
    let mut cmd = std::process::Command::new("shutdown.exe");
    cmd.args(["/r", "/t", "5", "/c", "NIVA System Restart initiated by user"]);
    match cmd.spawn() {
        Ok(_) => CommandResult {
            success: true,
            output: "System restart scheduled in 5 seconds.".into(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to initiate restart: {}", e)),
        },
    }
}

#[tauri::command]
fn shutdown_pc(confirmed: bool) -> CommandResult {
    if !confirmed {
        return CommandResult {
            success: false,
            output: String::new(),
            error: Some("Shutdown aborted: Explicit confirmation required.".into()),
        };
    }
    let mut cmd = std::process::Command::new("shutdown.exe");
    cmd.args(["/s", "/t", "5", "/c", "NIVA System Shutdown initiated by user"]);
    match cmd.spawn() {
        Ok(_) => CommandResult {
            success: true,
            output: "System shutdown scheduled in 5 seconds.".into(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to initiate shutdown: {}", e)),
        },
    }
}

#[tauri::command]
fn cancel_power_action() -> CommandResult {
    let mut cmd = std::process::Command::new("shutdown.exe");
    cmd.args(["/a"]);
    match cmd.spawn() {
        Ok(_) => CommandResult {
            success: true,
            output: "Pending power action cancelled.".into(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to cancel power action: {}", e)),
        },
    }
}

// 6. Native Desktop Notification
#[tauri::command]
fn show_native_notification(title: String, body: String) -> CommandResult {
    let safe_title = title.replace('"', "'");
    let safe_body = body.replace('"', "'");
    let ps_script = format!(
        "[void] [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); \
         $notify = New-Object System.Windows.Forms.NotifyIcon; \
         $notify.Icon = [System.Drawing.SystemIcons]::Information; \
         $notify.BalloonTipTitle = \"{}\"; \
         $notify.BalloonTipText = \"{}\"; \
         $notify.Visible = $True; \
         $notify.ShowBalloonTip(4000);",
        safe_title, safe_body
    );
    let mut cmd = std::process::Command::new("powershell.exe");
    cmd.args(["-NoProfile", "-NonInteractive", "-Command", &ps_script]);
    match cmd.spawn() {
        Ok(_) => CommandResult {
            success: true,
            output: format!("Notification shown: {}", safe_title),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Notification failed: {}", e)),
        },
    }
}

// 7. Bounded Safe File Reader (Read up to 64KB)
#[tauri::command]
fn read_desktop_file(file_path: String) -> CommandResult {
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("File '{}' does not exist.", file_path)),
        };
    }
    match std::fs::metadata(path) {
        Ok(meta) => {
            if meta.len() > 65536 {
                return CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("File too large ({} bytes). Maximum allowed size is 64KB.", meta.len())),
                };
            }
        }
        Err(e) => {
            return CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("Cannot inspect file metadata: {}", e)),
            };
        }
    }

    match std::fs::read_to_string(path) {
        Ok(content) => CommandResult {
            success: true,
            output: content,
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to read file: {}", e)),
        },
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_device_identity,
            get_telemetry,
            launch_allowed_app,
            toggle_hud,
            toggle_main_window,
            lock_workstation,
            restart_pc,
            shutdown_pc,
            cancel_power_action,
            show_native_notification,
            read_desktop_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running NIVA Tauri application");
}
