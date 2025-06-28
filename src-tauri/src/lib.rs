mod meshfix;

#[cfg(test)]
mod tests;

use meshfix::{fix_mesh, MeshFixOptions, MeshFixResult};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct FixMeshOptions {
    pub join_multiple_components: Option<bool>,
    pub stl_output: Option<bool>,
    pub skip_if_fixed: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FixMeshResponse {
    pub success: bool,
    pub message: String,
    pub output_path: Option<String>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn open_file_location(file_path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let result = Command::new("open")
            .args(["-R", &file_path])
            .output();

        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to open file location: {}", e)),
        }
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let result = Command::new("explorer")
            .args(["/select,", &file_path])
            .output();

        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to open file location: {}", e)),
        }
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        let parent = Path::new(&file_path).parent()
            .ok_or("Invalid file path")?
            .to_string_lossy();

        let result = Command::new("xdg-open")
            .arg(&*parent)
            .output();

        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to open file location: {}", e)),
        }
    }
}

#[tauri::command]
async fn read_stl_file(file_path: String) -> Result<Vec<u8>, String> {
    match fs::read(&file_path) {
        Ok(data) => Ok(data),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
async fn fix_mesh_file(
    input_path: String,
    output_path: Option<String>,
    options: Option<FixMeshOptions>,
) -> Result<FixMeshResponse, String> {
    // Validate input file exists
    if !Path::new(&input_path).exists() {
        return Ok(FixMeshResponse {
            success: false,
            message: format!("Input file does not exist: {}", input_path),
            output_path: None,
        });
    }

    // Convert options
    let fix_options = if let Some(opts) = options {
        MeshFixOptions {
            join_multiple_components: opts.join_multiple_components.unwrap_or(false),
            stl_output: opts.stl_output.unwrap_or(true),
            skip_if_fixed: opts.skip_if_fixed.unwrap_or(false),
        }
    } else {
        MeshFixOptions::default()
    };

    // Generate output path if not provided
    let final_output_path = if let Some(path) = output_path {
        path
    } else {
        let input_path_obj = Path::new(&input_path);
        let stem = input_path_obj.file_stem()
            .and_then(|s| s.to_str())
            .ok_or("Invalid input filename")?;
        let parent = input_path_obj.parent()
            .ok_or("Invalid input path")?;
        let extension = if fix_options.stl_output { "stl" } else { "off" };
        parent.join(format!("{}_fixed.{}", stem, extension))
            .to_string_lossy()
            .to_string()
    };

    // Fix the mesh
    match fix_mesh(&input_path, Some(&final_output_path), &fix_options) {
        Ok(MeshFixResult::Success) => Ok(FixMeshResponse {
            success: true,
            message: "Mesh fixed successfully".to_string(),
            output_path: Some(final_output_path),
        }),
        Ok(MeshFixResult::CantOpenFile) => Ok(FixMeshResponse {
            success: false,
            message: "Cannot open input file".to_string(),
            output_path: None,
        }),
        Ok(MeshFixResult::OutputFileExists) => Ok(FixMeshResponse {
            success: false,
            message: "Output file already exists".to_string(),
            output_path: None,
        }),
        Ok(MeshFixResult::UnknownError(code)) => Ok(FixMeshResponse {
            success: false,
            message: format!("Unknown error occurred (code: {})", code),
            output_path: None,
        }),
        Err(e) => Err(e),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, fix_mesh_file, read_stl_file, open_file_location])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
