use serde::Serialize;
use std::{
    fs,
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    Emitter,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileInfo {
    exists: bool,
    modified_ms: Option<u128>,
    len: Option<u64>,
}

const SUPPORTED_EXTENSIONS: &[&str] = &["md", "markdown", "mdown", "txt"];
const SUPPORTED_WRITE_EXTENSIONS: &[&str] = &["html", "htm"];

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    ensure_supported_text_path(&path)?;
    fs::read_to_string(&path).map_err(|error| format!("Failed to read {path}: {error}"))
}

#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    ensure_supported_write_path(&path)?;
    fs::write(&path, contents).map_err(|error| format!("Failed to write {path}: {error}"))
}

#[tauri::command]
fn get_file_info(path: String) -> Result<FileInfo, String> {
    ensure_supported_text_path(&path)?;

    match fs::metadata(&path) {
        Ok(metadata) => Ok(FileInfo {
            exists: true,
            modified_ms: metadata.modified().ok().and_then(system_time_to_ms),
            len: Some(metadata.len()),
        }),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(FileInfo {
            exists: false,
            modified_ms: None,
            len: None,
        }),
        Err(error) => Err(format!("Failed to inspect {path}: {error}")),
    }
}

#[tauri::command]
fn startup_file_path() -> Option<String> {
    std::env::args()
        .skip(1)
        .find(|path| ensure_supported_text_path(path).is_ok())
}

fn ensure_supported_text_path(path: &str) -> Result<(), String> {
    let extension = Path::new(path)
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase());

    match extension.as_deref() {
        Some(extension) if SUPPORTED_EXTENSIONS.contains(&extension) => Ok(()),
        _ => Err("Viewer supports .md, .markdown, .mdown, and .txt files.".to_string()),
    }
}

fn ensure_supported_write_path(path: &str) -> Result<(), String> {
    let extension = Path::new(path)
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase());

    match extension.as_deref() {
        Some(extension) if SUPPORTED_WRITE_EXTENSIONS.contains(&extension) => Ok(()),
        _ => Err("Viewer HTML export supports .html and .htm files.".to_string()),
    }
}

fn system_time_to_ms(value: SystemTime) -> Option<u128> {
    value
        .duration_since(UNIX_EPOCH)
        .ok()
        .map(|duration| duration.as_millis())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            write_text_file,
            get_file_info,
            startup_file_path
        ])
        .setup(|app| {
            configure_menu(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run MarkForge viewer")
}

fn configure_menu(app: &mut tauri::App) -> tauri::Result<()> {
    let open_file = MenuItemBuilder::with_id("file.open", "Open...")
        .accelerator("Ctrl+O")
        .build(app)?;
    let reload_file = MenuItemBuilder::with_id("file.reload", "Reload")
        .accelerator("Ctrl+R")
        .build(app)?;
    let copy_source = MenuItemBuilder::with_id("file.copySource", "Copy Source")
        .accelerator("Ctrl+Shift+C")
        .build(app)?;
    let copy_rendered = MenuItemBuilder::with_id("file.copyRendered", "Copy Rendered Text").build(app)?;
    let export_html = MenuItemBuilder::with_id("file.exportHtml", "Export HTML...")
        .build(app)?;
    let print = MenuItemBuilder::with_id("file.print", "Print")
        .accelerator("Ctrl+P")
        .build(app)?;

    let file = SubmenuBuilder::new(app, "File")
        .item(&open_file)
        .item(&reload_file)
        .separator()
        .item(&copy_source)
        .item(&copy_rendered)
        .item(&export_html)
        .separator()
        .item(&print)
        .separator()
        .quit()
        .build()?;

    let view = SubmenuBuilder::new(app, "View")
        .item(&PredefinedMenuItem::fullscreen(app, None)?)
        .build()?;

    let help = SubmenuBuilder::new(app, "Help")
        .text("help.phase3", "Phase 3 Viewer Foundation")
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&file, &view, &help])
        .build()?;

    app.set_menu(menu)?;
    app.on_menu_event(|app, event| {
        let _ = app.emit("markforge://viewer-menu", event.id().as_ref().to_string());
    });

    Ok(())
}
