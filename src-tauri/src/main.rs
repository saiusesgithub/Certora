#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    net::{TcpStream, ToSocketAddrs},
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::Mutex,
    time::Duration,
};

use tauri::{AppHandle, Manager, RunEvent};

struct BackendProcess(Mutex<Option<Child>>);

fn is_backend_running() -> bool {
    match ("127.0.0.1", 8000).to_socket_addrs() {
        Ok(addresses) => addresses.into_iter().any(|address| {
            TcpStream::connect_timeout(&address, Duration::from_millis(250)).is_ok()
        }),
        Err(error) => {
            eprintln!("Could not resolve backend address: {error}");
            false
        }
    }
}

fn backend_candidates(app: &AppHandle) -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(resource_dir) = app.path().resource_dir() {
        candidates.push(resource_dir.join("backend"));
    }

    if let Ok(current_dir) = std::env::current_dir() {
        candidates.push(current_dir.join("backend"));
        candidates.push(current_dir.join("..").join("backend"));
    }

    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(exe_dir) = current_exe.parent() {
            candidates.push(exe_dir.join("backend"));
            candidates.push(exe_dir.join("..").join("backend"));
            candidates.push(exe_dir.join("..").join("..").join("backend"));
            candidates.push(exe_dir.join("..").join("..").join("resources").join("backend"));
        }
    }

    candidates
}

fn find_backend_dir(app: &AppHandle) -> Option<PathBuf> {
    backend_candidates(app)
        .into_iter()
        .find(|candidate| candidate.join("main.py").is_file())
}

fn python_command() -> String {
    std::env::var("CERTORA_PYTHON").unwrap_or_else(|_| "python".to_string())
}

fn start_backend(app: &AppHandle) -> Option<Child> {
    if is_backend_running() {
        eprintln!("Certora backend is already running on 127.0.0.1:8000");
        return None;
    }

    let Some(backend_dir) = find_backend_dir(app) else {
        eprintln!("Could not find backend/main.py for Certora backend startup");
        return None;
    };

    let mut command = Command::new(python_command());
    command
        .arg("main.py")
        .current_dir(&backend_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    match command.spawn() {
        Ok(child) => {
            eprintln!("Started Certora backend from {}", backend_dir.display());
            Some(child)
        }
        Err(error) => {
            eprintln!("Could not start Certora backend: {error}");
            None
        }
    }
}

fn stop_backend(app: &AppHandle) {
    let Some(state) = app.try_state::<BackendProcess>() else {
        return;
    };

    let Ok(mut backend) = state.0.lock() else {
        return;
    };

    if let Some(mut child) = backend.take() {
        if let Err(error) = child.kill() {
            eprintln!("Could not stop Certora backend: {error}");
        }

        let _ = child.wait();
    }
}

#[tauri::command]
fn open_downloads_folder() -> Result<(), String> {
    let downloads_dir = downloads_dir().ok_or_else(|| "Could not find Downloads folder".to_string())?;
    let mut command = open_folder_command(&downloads_dir);

    command
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Could not open Downloads folder: {error}"))
}

fn downloads_dir() -> Option<PathBuf> {
    #[cfg(windows)]
    {
        std::env::var_os("USERPROFILE").map(|home| PathBuf::from(home).join("Downloads"))
    }

    #[cfg(not(windows))]
    {
        std::env::var_os("HOME").map(|home| PathBuf::from(home).join("Downloads"))
    }
}

fn open_folder_command(path: &PathBuf) -> Command {
    #[cfg(windows)]
    {
        let mut command = Command::new("explorer");
        command.arg(path);
        command
    }

    #[cfg(target_os = "macos")]
    {
        let mut command = Command::new("open");
        command.arg(path);
        command
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let mut command = Command::new("xdg-open");
        command.arg(path);
        command
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let backend = start_backend(&app.handle());
            app.manage(BackendProcess(Mutex::new(backend)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![open_downloads_folder])
        .build(tauri::generate_context!())
        .expect("failed to build Certora Tauri app")
        .run(|app, event| match event {
            RunEvent::ExitRequested { .. } | RunEvent::Exit => stop_backend(app),
            _ => {}
        });
}
