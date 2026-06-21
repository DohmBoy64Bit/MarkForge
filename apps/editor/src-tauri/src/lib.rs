use serde::Serialize;
use std::{
    fs,
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
            get_file_info
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
    let copy_markdown = MenuItemBuilder::with_id("edit.copyMarkdown", "Copy Markdown")
        .accelerator("Ctrl+Shift+C")
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
