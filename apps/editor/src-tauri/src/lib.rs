use serde::Serialize;
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    process::Command,
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

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceFileEntry {
    extension: String,
    len: Option<u64>,
    modified_ms: Option<u128>,
    name: String,
    path: String,
    relative_path: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceSearchMatch {
    column: usize,
    line: usize,
    path: String,
    preview: String,
    relative_path: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceWatchPayload {
    path: String,
    relative_path: String,
    root: String,
    #[serde(rename = "type")]
    event_type: String,
}

#[derive(Default)]
struct FileWatchState {
    watchers: Mutex<HashMap<String, notify::RecommendedWatcher>>,
}

const SUPPORTED_STARTUP_EXTENSIONS: &[&str] = &["md", "markdown", "mdown", "txt"];
const SKIPPED_WORKSPACE_DIRECTORIES: &[&str] = &[
    ".git",
    ".next",
    ".svelte-kit",
    ".tauri",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "target",
];
const FILE_WATCH_EVENT: &str = "markforge://file-watch";
const WORKSPACE_WATCH_EVENT: &str = "markforge://workspace-watch";

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|error| format!("Failed to read {path}: {error}"))
}

#[tauri::command]
fn read_binary_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|error| format!("Failed to read {path}: {error}"))
}

#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|error| format!("Failed to write {path}: {error}"))
}

#[tauri::command]
fn write_binary_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    fs::write(&path, contents).map_err(|error| format!("Failed to write {path}: {error}"))
}

#[tauri::command]
fn get_file_info(path: String) -> Result<FileInfo, String> {
    file_info_for_path(&path)
}

#[tauri::command]
fn add_recent_document(path: String) -> Result<(), String> {
    ensure_supported_text_path(&path)?;

    #[cfg(target_os = "windows")]
    {
        let script = r#"
$target = $args[0]
$recent = [Environment]::GetFolderPath('Recent')
if (-not $recent) { exit 0 }
$baseName = [IO.Path]::GetFileNameWithoutExtension($target)
if (-not $baseName) { $baseName = 'MarkForge document' }
$linkPath = [IO.Path]::Combine($recent, "$baseName.lnk")
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($linkPath)
$shortcut.TargetPath = $target
$shortcut.Save()
"#;
        let status = Command::new("powershell")
            .args([
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                script,
                &path,
            ])
            .status()
            .map_err(|error| format!("Failed to update shell recent documents: {error}"))?;

        if !status.success() {
            return Err("Shell recent-document update failed.".to_string());
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = path;
    }

    Ok(())
}

#[tauri::command]
fn list_workspace_files(root: String) -> Result<Vec<WorkspaceFileEntry>, String> {
    let root_path = ensure_workspace_root(&root)?;
    let mut entries = Vec::new();
    collect_workspace_files(&root_path, &root_path, &mut entries)?;
    entries.sort_by(|left, right| left.relative_path.cmp(&right.relative_path));
    Ok(entries)
}

#[tauri::command]
fn search_workspace(
    root: String,
    query: String,
    case_sensitive: Option<bool>,
    limit: Option<usize>,
) -> Result<Vec<WorkspaceSearchMatch>, String> {
    let trimmed_query = query.trim();
    if trimmed_query.is_empty() {
        return Ok(Vec::new());
    }

    let root_path = ensure_workspace_root(&root)?;
    let entries = list_workspace_files(root.clone())?;
    let max_results = limit.unwrap_or(100).clamp(1, 500);
    let case_sensitive = case_sensitive.unwrap_or(false);
    let needle = if case_sensitive {
        trimmed_query.to_string()
    } else {
        trimmed_query.to_lowercase()
    };
    let mut matches = Vec::new();

    for entry in entries {
        if matches.len() >= max_results {
            break;
        }

        let contents = match fs::read_to_string(&entry.path) {
            Ok(contents) => contents,
            Err(_) => continue,
        };

        for (line_index, line) in contents.lines().enumerate() {
            let haystack = if case_sensitive {
                line.to_string()
            } else {
                line.to_lowercase()
            };

            if let Some(column) = haystack.find(&needle) {
                matches.push(WorkspaceSearchMatch {
                    column: column + 1,
                    line: line_index + 1,
                    path: entry.path.clone(),
                    preview: line.trim().chars().take(220).collect(),
                    relative_path: relative_path_for(&root_path, Path::new(&entry.path)),
                });

                if matches.len() >= max_results {
                    break;
                }
            }
        }
    }

    Ok(matches)
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

    notify::Watcher::watch(
        &mut watcher,
        &watch_path,
        notify::RecursiveMode::NonRecursive,
    )
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

#[tauri::command]
fn watch_workspace(
    app: tauri::AppHandle,
    state: tauri::State<FileWatchState>,
    root: String,
) -> Result<(), String> {
    let root_path = ensure_workspace_root(&root)?;
    let key = root_path.to_string_lossy().to_string();
    let mut watchers = state
        .watchers
        .lock()
        .map_err(|_| "Failed to lock file watcher state.".to_string())?;

    if watchers.contains_key(&key) {
        return Ok(());
    }

    let emitted_root = key.clone();
    let app_handle = app.clone();
    let mut watcher = notify::recommended_watcher(move |result: notify::Result<notify::Event>| {
        let event = match result {
            Ok(event) => event,
            Err(_) => return,
        };

        for path in event.paths {
            if !is_supported_startup_path(&path.to_string_lossy()) {
                continue;
            }

            let path_string = path.to_string_lossy().to_string();
            let event_type = if path.exists() { "changed" } else { "missing" };
            let root_path = Path::new(&emitted_root);
            let payload = WorkspaceWatchPayload {
                path: path_string,
                relative_path: relative_path_for(root_path, &path),
                root: emitted_root.clone(),
                event_type: event_type.to_string(),
            };
            let _ = app_handle.emit(WORKSPACE_WATCH_EVENT, payload);
        }
    })
    .map_err(|error| format!("Failed to create workspace watcher for {root}: {error}"))?;

    notify::Watcher::watch(&mut watcher, &root_path, notify::RecursiveMode::Recursive)
        .map_err(|error| format!("Failed to watch workspace {root}: {error}"))?;

    watchers.insert(key, watcher);
    Ok(())
}

#[tauri::command]
fn unwatch_workspace(state: tauri::State<FileWatchState>, root: String) -> Result<(), String> {
    let key = ensure_workspace_root(&root)?.to_string_lossy().to_string();
    let mut watchers = state
        .watchers
        .lock()
        .map_err(|_| "Failed to lock workspace watcher state.".to_string())?;

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

fn ensure_workspace_root(root: &str) -> Result<PathBuf, String> {
    let root_path = Path::new(root);
    let metadata = fs::metadata(root_path)
        .map_err(|error| format!("Failed to inspect workspace {root}: {error}"))?;

    if !metadata.is_dir() {
        return Err(format!("Workspace path is not a directory: {root}"));
    }

    Ok(root_path.to_path_buf())
}

fn collect_workspace_files(
    root: &Path,
    current: &Path,
    entries: &mut Vec<WorkspaceFileEntry>,
) -> Result<(), String> {
    let read_dir = fs::read_dir(current).map_err(|error| {
        format!(
            "Failed to read workspace directory {}: {error}",
            current.display()
        )
    })?;

    for item in read_dir {
        let item = item.map_err(|error| format!("Failed to read workspace entry: {error}"))?;
        let path = item.path();
        let name = item.file_name().to_string_lossy().to_string();

        if path.is_dir() {
            if SKIPPED_WORKSPACE_DIRECTORIES.contains(&name.as_str()) {
                continue;
            }

            collect_workspace_files(root, &path, entries)?;
            continue;
        }

        if !is_supported_startup_path(&path.to_string_lossy()) {
            continue;
        }

        let metadata = match fs::metadata(&path) {
            Ok(metadata) => metadata,
            Err(_) => continue,
        };
        let extension = path
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();

        entries.push(WorkspaceFileEntry {
            extension,
            len: Some(metadata.len()),
            modified_ms: metadata.modified().ok().and_then(system_time_to_ms),
            name,
            path: path.to_string_lossy().to_string(),
            relative_path: relative_path_for(root, &path),
        });
    }

    Ok(())
}

fn relative_path_for(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
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
            SUPPORTED_STARTUP_EXTENSIONS.contains(&extension.to_ascii_lowercase().as_str())
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
            read_binary_file,
            write_text_file,
            write_binary_file,
            get_file_info,
            add_recent_document,
            list_workspace_files,
            search_workspace,
            watch_text_file,
            unwatch_text_file,
            watch_workspace,
            unwatch_workspace,
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
    let export_html = MenuItemBuilder::with_id("file.exportHtml", "Export HTML...").build(app)?;
    let import_converted =
        MenuItemBuilder::with_id("file.importConverted", "Import Conversion...").build(app)?;
    let copy_markdown = MenuItemBuilder::with_id("edit.copyMarkdown", "Copy Markdown")
        .accelerator("Ctrl+Shift+C")
        .build(app)?;
    let clean_markdown =
        MenuItemBuilder::with_id("edit.cleanMarkdown", "Clean Markdown").build(app)?;
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
        .text("help.about", "About MarkForge")
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&file, &edit, &view, &help])
        .build()?;

    app.set_menu(menu)?;
    app.on_menu_event(|app, event| {
        let id = event.id().as_ref().to_string();
        if id == "help.about" {
            let _ = app.emit("markforge://menu", "help.about");
            return;
        }

        let _ = app.emit("markforge://menu", id);
    });

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
        path::{Path, PathBuf},
        time::{SystemTime, UNIX_EPOCH},
    };

    struct TestDir {
        path: PathBuf,
    }

    impl TestDir {
        fn new(name: &str) -> Self {
            let stamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system clock should be after epoch")
                .as_nanos();
            let path = std::env::temp_dir().join(format!(
                "markforge-editor-{name}-{}-{stamp}",
                std::process::id()
            ));
            fs::create_dir_all(&path).expect("test directory should be created");
            Self { path }
        }

        fn path(&self, relative: &str) -> PathBuf {
            self.path.join(relative)
        }

        fn write(&self, relative: &str, contents: &str) -> PathBuf {
            let path = self.path(relative);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).expect("parent directory should be created");
            }
            fs::write(&path, contents).expect("test file should be written");
            path
        }
    }

    impl Drop for TestDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    fn path_string(path: &Path) -> String {
        path.to_string_lossy().to_string()
    }

    #[test]
    fn editor_text_and_binary_commands_round_trip_files() {
        let dir = TestDir::new("round-trip");
        let text_path = dir.path("draft.md");
        let binary_path = dir.path("image.bin");

        write_text_file(path_string(&text_path), "# Draft".to_string())
            .expect("text write should succeed");
        assert_eq!(
            read_text_file(path_string(&text_path)).expect("text read should succeed"),
            "# Draft"
        );

        write_binary_file(path_string(&binary_path), vec![0, 1, 255])
            .expect("binary write should succeed");
        assert_eq!(
            read_binary_file(path_string(&binary_path)).expect("binary read should succeed"),
            vec![0, 1, 255]
        );
    }

    #[test]
    fn editor_file_info_reports_existing_and_missing_paths() {
        let dir = TestDir::new("file-info");
        let existing = dir.write("note.md", "hello");
        let missing = dir.path("missing.md");

        let existing_info =
            get_file_info(path_string(&existing)).expect("existing file info should succeed");
        assert!(existing_info.exists);
        assert_eq!(existing_info.len, Some(5));
        assert!(existing_info.modified_ms.is_some());

        let missing_info =
            get_file_info(path_string(&missing)).expect("missing file info should still succeed");
        assert!(!missing_info.exists);
        assert_eq!(missing_info.len, None);
        assert_eq!(missing_info.modified_ms, None);
    }

    #[test]
    fn editor_workspace_listing_filters_and_sorts_supported_documents() {
        let dir = TestDir::new("workspace-list");
        dir.write("b.txt", "second");
        dir.write("nested/a.md", "first");
        dir.write("node_modules/ignored.md", "ignored");
        dir.write("image.png", "ignored");

        let entries =
            list_workspace_files(path_string(&dir.path)).expect("workspace listing should succeed");
        let relative_paths: Vec<_> = entries
            .iter()
            .map(|entry| entry.relative_path.as_str())
            .collect();

        assert_eq!(relative_paths, vec!["b.txt", "nested/a.md"]);
        assert!(entries.iter().all(|entry| entry.len.is_some()));
    }

    #[test]
    fn editor_workspace_search_honors_case_sensitivity_and_limit() {
        let dir = TestDir::new("workspace-search");
        dir.write("alpha.md", "Needle upper\nsecond line");
        dir.write("beta.md", "needle lower");

        let limited = search_workspace(
            path_string(&dir.path),
            "needle".to_string(),
            Some(false),
            Some(1),
        )
        .expect("limited search should succeed");
        assert_eq!(limited.len(), 1);

        let case_sensitive = search_workspace(
            path_string(&dir.path),
            "needle".to_string(),
            Some(true),
            None,
        )
        .expect("case sensitive search should succeed");
        assert_eq!(case_sensitive.len(), 1);
        assert_eq!(case_sensitive[0].relative_path, "beta.md");
        assert_eq!(case_sensitive[0].line, 1);
        assert_eq!(case_sensitive[0].column, 1);
    }

    #[test]
    fn editor_supported_startup_extensions_are_enforced() {
        assert!(ensure_supported_text_path("draft.md").is_ok());
        assert!(ensure_supported_text_path("draft.markdown").is_ok());
        assert!(ensure_supported_text_path("draft.mdown").is_ok());
        assert!(ensure_supported_text_path("draft.txt").is_ok());
        assert!(ensure_supported_text_path("draft.png").is_err());
    }
}
