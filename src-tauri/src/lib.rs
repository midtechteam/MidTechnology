use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
async fn save_file(
    app: tauri::AppHandle,
    content: String,
    filename: String,
    filters: Vec<(String, Vec<String>)>,
) -> Result<Option<String>, String> {
    let dialog = app.dialog();
    let file_path = dialog
        .file()
        .set_file_name(&filename)
        .blocking_save_file();
    
    match file_path {
        Some(path) => {
            let path_str = path.to_string();
            std::fs::write(&path_str, content)
                .map_err(|e| e.to_string())?;
            Ok(Some(path_str))
        }
        None => Ok(None),
    }
}

#[tauri::command]
async fn open_file(app: tauri::AppHandle) -> Result<Option<(String, String)>, String> {
    let dialog = app.dialog();
    let file_path = dialog
        .file()
        .add_filter("Scafbind Files", &["scafbind", "json"])
        .blocking_pick_file();
    
    match file_path {
        Some(path) => {
            let path_str = path.to_string();
            let content = std::fs::read_to_string(&path_str)
                .map_err(|e| e.to_string())?;
            Ok(Some((path_str, content)))
        }
        None => Ok(None),
    }
}

#[tauri::command]
async fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            save_file,
            open_file,
            get_app_version,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
