#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use anyhow::{anyhow, Result};
use enigo::{Enigo, KeyboardControllable};
use once_cell::sync::Lazy;
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri::GlobalShortcutManager;

static REC_STATE: Lazy<Mutex<RecordState>> = Lazy::new(|| Mutex::new(RecordState::default()));

#[derive(Default)]
struct RecordState {
    child: Option<Child>,
    output_path: Option<PathBuf>,
}

#[derive(Serialize)]
struct TranscriptionResult {
    text: String,
}

fn ensure_app_dir(app_handle: &AppHandle) -> Result<PathBuf> {
    let dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| anyhow!("Unable to resolve app data dir"))?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

fn python_path() -> String {
    // Prefer python3; fallback to python
    if which::which("python3").is_ok() {
        "python3".to_string()
    } else {
        "python".to_string()
    }
}

fn find_backend_main() -> Option<PathBuf> {
    // Try common locations for dev and bundled builds
    let candidates = [
        "../backend/main.py",
        "../../backend/main.py",
        "backend/main.py",
        "src-tauri/../backend/main.py",
    ];
    for c in candidates {
        let p = PathBuf::from(c);
        if p.exists() {
            return Some(p);
        }
    }
    None
}

#[tauri::command]
fn start_recording(app: AppHandle) -> Result<(), String> {
    let mut state = REC_STATE.lock().unwrap();
    if state.child.is_some() {
        return Err("Recording already in progress".into());
    }

    let app_dir = ensure_app_dir(&app).map_err(|e| e.to_string())?;
    let output_path = app_dir.join("last_recording.wav");

    let backend_path = find_backend_main().ok_or("Backend not found")?;

    let child = Command::new(python_path())
        .arg(backend_path)
        .arg("record")
        .arg("--output")
        .arg(&output_path)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| e.to_string())?;

    state.child = Some(child);
    state.output_path = Some(output_path);

    // Optional: notify UI
    let _ = app.emit_all("overlay://state", "listening");
    Ok(())
}

#[tauri::command]
fn stop_and_transcribe(app: AppHandle, model: Option<String>, insert_newline: Option<bool>) -> Result<String, String> {
    let text = stop_and_transcribe_impl(&app, model, insert_newline).map_err(|e| e.to_string())?;
    Ok(text)
}

fn stop_and_transcribe_impl(app: &AppHandle, model: Option<String>, insert_newline: Option<bool>) -> Result<String> {
    let mut state = REC_STATE.lock().unwrap();
    let mut child = state.child.take().ok_or_else(|| anyhow!("No recording in progress"))?;

    #[cfg(unix)]
    {
        use nix::sys::signal::{kill, Signal};
        use nix::unistd::Pid;
        let pid = Pid::from_raw(child.id() as i32);
        let _ = kill(pid, Signal::SIGINT);
    }

    // Fallback kill if still running
    let _ = child.kill();
    let _ = child.wait();

    drop(child);

    let output_path = state
        .output_path
        .take()
        .ok_or_else(|| anyhow!("Output path missing"))?;

    if !Path::new(&output_path).exists() {
        return Err(anyhow!("Audio file not found: {}", output_path.display()));
    }

    // Emit processing state
    let _ = app.emit_all("overlay://state", "processing");

    let backend_path = find_backend_main().ok_or_else(|| anyhow!("Backend not found"))?;

    let model_arg = model.unwrap_or_else(|| "tiny".to_string());

    let output = Command::new(python_path())
        .arg(backend_path)
        .arg("transcribe")
        .arg("--input")
        .arg(&output_path)
        .arg("--model")
        .arg(&model_arg)
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed: TranscriptionResult = serde_json::from_str(stdout.trim())?;

    // Inject text into focused app
    let mut enigo = Enigo::new();
    enigo.enter_text(parsed.text.clone());
    if insert_newline.unwrap_or(false) {
        enigo.key_click(enigo::Key::Return);
    }

    let _ = app.emit_all("overlay://state", "ready");
    Ok(parsed.text)
}

#[tauri::command]
fn inject_text(text: String, insert_newline: Option<bool>) -> Result<(), String> {
    let mut enigo = Enigo::new();
    enigo.enter_text(text);
    if insert_newline.unwrap_or(false) {
        enigo.key_click(enigo::Key::Return);
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            let mut gsm = app.global_shortcut_manager();
            // Toggle recording with Ctrl+Space
            gsm.register("Ctrl+Space", move || {
                let is_recording = REC_STATE.lock().unwrap().child.is_some();
                if !is_recording {
                    let _ = start_recording(app_handle.clone());
                } else {
                    let _ = stop_and_transcribe_impl(&app_handle, None, Some(false));
                }
            })?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![start_recording, stop_and_transcribe, inject_text])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

