// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use serde_json::Value;
use tauri::{State, Manager};
use enigo::{Enigo, Key, KeyboardControllable};
use std::sync::Mutex;

struct AppState {
    enigo: Mutex<Enigo>,
}

#[tauri::command]
async fn start_recording() -> Result<Value, String> {
    println!("Starting recording...");
    
    let output = Command::new("python3")
        .arg("backend/main.py")
        .arg("start_recording")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to start Python backend: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python backend error: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse backend response: {}", e))?;

    Ok(result)
}

#[tauri::command]
async fn stop_and_transcribe(model_size: String) -> Result<Value, String> {
    println!("Stopping recording and transcribing with model: {}", model_size);
    
    let params = serde_json::json!({ "model_size": model_size });
    
    let output = Command::new("python3")
        .arg("backend/main.py")
        .arg("stop_and_transcribe")
        .arg(params.to_string())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to start Python backend: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python backend error: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse backend response: {}", e))?;

    Ok(result)
}

#[tauri::command]
async fn check_microphone() -> Result<bool, String> {
    println!("Checking microphone...");
    
    let output = Command::new("python3")
        .arg("backend/main.py")
        .arg("check_microphone")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to start Python backend: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python backend error: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse backend response: {}", e))?;

    if let Some(microphone_available) = result.get("microphone_available") {
        if let Some(available) = microphone_available.as_bool() {
            return Ok(available);
        }
    }

    // Fallback: if we get a success response, assume microphone is available
    if let Some(success) = result.get("success") {
        if let Some(is_success) = success.as_bool() {
            return Ok(is_success);
        }
    }

    Ok(false)
}

#[tauri::command]
async fn type_text(text: String, state: State<'_, AppState>) -> Result<(), String> {
    println!("Typing text: {}", text);
    
    let mut enigo = state.enigo.lock().unwrap();
    
    // Small delay to ensure the target application is ready
    std::thread::sleep(std::time::Duration::from_millis(100));
    
    // Type the text
    enigo.key_sequence(&text);
    
    Ok(())
}

#[tauri::command]
async fn get_available_models() -> Result<Value, String> {
    println!("Getting available models...");
    
    let output = Command::new("python3")
        .arg("backend/main.py")
        .arg("get_models")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to start Python backend: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python backend error: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse backend response: {}", e))?;

    Ok(result)
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            enigo: Mutex::new(Enigo::new()),
        })
        .invoke_handler(tauri::generate_handler![
            start_recording,
            stop_and_transcribe,
            check_microphone,
            type_text,
            get_available_models
        ])
        .setup(|app| {
            // Set the working directory to the app directory
            if let Some(resource_dir) = app.path_resolver().resource_dir() {
                std::env::set_current_dir(resource_dir.parent().unwrap_or(&resource_dir))
                    .expect("Failed to set working directory");
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}