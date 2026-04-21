use serde::Deserialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeneratePayload {
    template_filename: String,
    template_bytes: Vec<u8>,
    config_json: String,
    input_type: String,
    input_content: String,
    college: String,
    event: String,
}

fn find_backend_script() -> Result<PathBuf, String> {
    let current = std::env::current_dir().map_err(|e| format!("Unable to read cwd: {e}"))?;
    let candidates = [
        current.join("backend").join("main.py"),
        current.join("../backend").join("main.py"),
    ];

    for candidate in candidates {
        if candidate.exists() {
            return Ok(candidate);
        }
    }

    Err("Could not locate backend/main.py".to_string())
}

fn try_run_python(script_path: &Path, args: &[String]) -> Result<(), String> {
    let mut full_args = vec![script_path.to_string_lossy().to_string()];
    full_args.extend(args.iter().cloned());

    let attempts: [(&str, Vec<String>); 2] = [
        ("python", full_args.clone()),
        (
            "py",
            {
                let mut py_args = vec!["-3".to_string()];
                py_args.extend(full_args.clone());
                py_args
            },
        ),
    ];

    let mut last_err = String::new();
    for (bin, cmd_args) in attempts {
        match Command::new(bin).args(&cmd_args).output() {
            Ok(output) => {
                if output.status.success() {
                    return Ok(());
                }

                let stderr = String::from_utf8_lossy(&output.stderr);
                let stdout = String::from_utf8_lossy(&output.stdout);
                last_err = format!(
                    "Python generator failed ({bin}).\nstdout:\n{}\nstderr:\n{}",
                    stdout, stderr
                );
            }
            Err(e) => {
                last_err = format!("Failed to run {bin}: {e}");
            }
        }
    }

    Err(last_err)
}

#[tauri::command]
fn save_zip_to_downloads(app: tauri::AppHandle, zip_path: String) -> Result<String, String> {
    let source_path = PathBuf::from(zip_path);
    if !source_path.exists() {
        return Err(format!("ZIP file not found: {}", source_path.display()));
    }

    let downloads_dir = app
        .path()
        .download_dir()
        .map_err(|e| format!("Failed to resolve Downloads folder: {e}"))?;

    fs::create_dir_all(&downloads_dir)
        .map_err(|e| format!("Failed to create Downloads folder {}: {e}", downloads_dir.display()))?;

    let run_id = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("Clock error: {e}"))?
        .as_millis();

    let destination = downloads_dir.join(format!("certora-certificates-{run_id}.zip"));
    fs::copy(&source_path, &destination)
        .map_err(|e| format!("Failed to copy ZIP to Downloads: {e}"))?;

    #[cfg(target_os = "windows")]
    {
        let select_arg = format!("/select,{}", destination.to_string_lossy());
        let _ = Command::new("explorer").arg(select_arg).spawn();
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = Command::new("open").arg(&downloads_dir).spawn();
    }

    Ok(destination.to_string_lossy().to_string())
}

#[tauri::command]
fn generate_certificates(app: tauri::AppHandle, payload: GeneratePayload) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir {}: {e}", app_data_dir.display()))?;

    let run_id = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("Clock error: {e}"))?
        .as_millis();

    let job_dir = app_data_dir.join("generator_jobs").join(format!("job_{run_id}"));
    let output_dir = job_dir.join("output");
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output dir {}: {e}", output_dir.display()))?;

    let template_extension = Path::new(&payload.template_filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("png");
    let template_path = job_dir.join(format!("template.{template_extension}"));
    fs::create_dir_all(&job_dir)
        .map_err(|e| format!("Failed to create job dir {}: {e}", job_dir.display()))?;
    fs::write(&template_path, &payload.template_bytes)
        .map_err(|e| format!("Failed to write template image: {e}"))?;

    let config_path = job_dir.join("config.json");
    fs::write(&config_path, payload.config_json.as_bytes())
        .map_err(|e| format!("Failed to write config.json: {e}"))?;

    let input_path = if payload.input_type.eq_ignore_ascii_case("csv") {
        job_dir.join("data.csv")
    } else {
        job_dir.join("data.txt")
    };
    fs::write(&input_path, payload.input_content.as_bytes())
        .map_err(|e| format!("Failed to write input data file: {e}"))?;

    let script_path = find_backend_script()?;
    let args = vec![
        "--background".to_string(),
        template_path.to_string_lossy().to_string(),
        "--config".to_string(),
        config_path.to_string_lossy().to_string(),
        "--data".to_string(),
        input_path.to_string_lossy().to_string(),
        "--output".to_string(),
        output_dir.to_string_lossy().to_string(),
        "--zip-name".to_string(),
        "certificates.zip".to_string(),
        "--college".to_string(),
        payload.college,
        "--event".to_string(),
        payload.event,
    ];

    try_run_python(&script_path, &args)?;

    let zip_path = output_dir.join("certificates.zip");
    if !zip_path.exists() {
        return Err("Generation completed but ZIP file was not found.".to_string());
    }

    Ok(zip_path.to_string_lossy().to_string())
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![greet, generate_certificates, save_zip_to_downloads])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
