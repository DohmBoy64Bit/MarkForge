use serde::Serialize;
use std::{
    collections::HashMap,
    fs,
    path::Path,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    Emitter,
};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct FileInfo {
    exists: bool,
    modified_ms: Option<u128>,
    len: Option<u64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct FileWatchPayload {
    path: String,
    current: FileInfo,
    #[serde(rename = "type")]
    event_type: String,
}

#[derive(Default)]
struct FileWatchState {
    watchers: Mutex<HashMap<String, notify::RecommendedWatcher>>,
}

const SUPPORTED_STARTUP_EXTENSIONS: &[&str] = &["md", "markdown", "mdown", "txt"];
const FILE_WATCH_EVENT: &str = "markforge://file-watch";

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|error| format!("Failed to read {path}: {error}"))
}

#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|error| format!("Failed to write {path}: {error}"))
}

#[tauri::command]
fn get_file_info(path: String) -> Result<FileInfo, String> {
    file_info_for_path(&path)
}

#[tauri::command]
fn watch_text_file(
    app: tauri::AppHandle,
    state: tauri::State<FileWatchState>,
    path: String,
) -> Result<(), String> {
    ensure_supported_text_path(&path)?;

    let watch_path = Path::new(&path).to_path_buf();
    let key = watch_path.to_string_lossy().to_string();
    let mut watchers = state
        .watchers
        .lock()
        .map_err(|_| "Failed to lock file watcher state.".to_string())?;

    if watchers.contains_key(&key) {
        return Ok(());
    }

    let emitted_path = key.clone();
    let app_handle = app.clone();
    let mut watcher = notify::recommended_watcher(move |result: notify::Result<notify::Event>| {
        if result.is_err() {
            return;
        }

        if let Ok(current) = file_info_for_path(&emitted_path) {
            let payload = FileWatchPayload {
                event_type: if current.exists { "changed" } else { "missing" }.to_string(),
                current,
                path: emitted_path.clone(),
            };
            let _ = app_handle.emit(FILE_WATCH_EVENT, payload);
        }
    })
    .map_err(|error| format!("Failed to create file watcher for {path}: {error}"))?;

    notify::Watcher::watch(&mut watcher, &watch_path, notify::RecursiveMode::NonRecursive)
        .map_err(|error| format!("Failed to watch {path}: {error}"))?;

    watchers.insert(key, watcher);
    Ok(())
}

#[tauri::command]
fn unwatch_text_file(state: tauri::State<FileWatchState>, path: String) -> Result<(), String> {
    let key = Path::new(&path).to_string_lossy().to_string();
    let mut watchers = state
        .watchers
        .lock()
        .map_err(|_| "Failed to lock file watcher state.".to_string())?;

    watchers.remove(&key);
    Ok(())
}

fn file_info_for_path(path: &str) -> Result<FileInfo, String> {
    match fs::metadata(path) {
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
        .find(|path| is_supported_startup_path(path))
}

fn is_supported_startup_path(path: &str) -> bool {
    ensure_supported_text_path(path).is_ok()
}

fn ensure_supported_text_path(path: &str) -> Result<(), String> {
    Path::new(path)
        .extension()
        .and_then(|value| value.to_str())
        .map(|extension| {
            SUPPORTED_STARTUP_EXTENSIONS
                .contains(&extension.to_ascii_lowercase().as_str())
        })
        .filter(|supported| *supported)
        .map(|_| ())
        .ok_or_else(|| "Editor supports .md, .markdown, .mdown, and .txt files.".to_string())
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
        .manage(FileWatchState::default())
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            write_text_file,
            get_file_info,
            watch_text_file,
            unwatch_text_file,
            startup_file_path
        ])
        .setup(|app| {
            configure_menu(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run MarkForge editor")
}

fn configure_menu(app: &mut tauri::App) -> tauri::Result<()> {
    let new_file = MenuItemBuilder::with_id("file.new", "New")
        .accelerator("Ctrl+N")
        .build(app)?;
    let open_file = MenuItemBuilder::with_id("file.open", "Open...")
        .accelerator("Ctrl+O")
        .build(app)?;
    let save_file = MenuItemBuilder::with_id("file.save", "Save")
        .accelerator("Ctrl+S")
        .build(app)?;
    let save_file_as = MenuItemBuilder::with_id("file.saveAs", "Save As...")
        .accelerator("Ctrl+Shift+S")
        .build(app)?;
    let export_html = MenuItemBuilder::with_id("file.exportHtml", "Export HTML...")
        .build(app)?;
    let import_converted = MenuItemBuilder::with_id("file.importConverted", "Import Conversion...")
        .build(app)?;
    let copy_markdown = MenuItemBuilder::with_id("edit.copyMarkdown", "Copy Markdown")
        .accelerator("Ctrl+Shift+C")
        .build(app)?;
    let clean_markdown = MenuItemBuilder::with_id("edit.cleanMarkdown", "Clean Markdown")
        .build(app)?;
    let print = MenuItemBuilder::with_id("view.print", "Print")
        .accelerator("Ctrl+P")
        .build(app)?;

    let file = SubmenuBuilder::new(app, "File")
        .item(&new_file)
        .item(&open_file)
        .separator()
        .item(&save_file)
        .item(&save_file_as)
        .item(&export_html)
        .item(&import_converted)
        .separator()
        .quit()
        .build()?;

    let edit = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .separator()
        .item(&copy_markdown)
        .item(&clean_markdown)
        .build()?;

    let view = SubmenuBuilder::new(app, "View")
        .item(&print)
        .separator()
        .item(&PredefinedMenuItem::fullscreen(app, None)?)
        .build()?;

    let help = SubmenuBuilder::new(app, "Help")
        .text("help.phase1", "Phase 1 Proof of Concept")
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&file, &edit, &view, &help])
        .build()?;

    app.set_menu(menu)?;
    app.on_menu_event(|app, event| {
        let id = event.id().as_ref().to_string();
        if id == "help.phase1" {
            let _ = app.emit("markforge://menu", "help.phase1");
            return;
        }

        let _ = app.emit("markforge://menu", id);
    });

    Ok(())
}
