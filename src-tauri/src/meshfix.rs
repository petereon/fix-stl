use std::ffi::CString;
use std::os::raw::{c_char, c_int};

// External C function declaration
extern "C" {
    fn fixMesh(
        infilename: *const c_char,
        outfilename: *const c_char,
        join_multiple_components: bool,
        stl_output: bool,
        skip_if_fixed: bool,
    ) -> c_int;
}

/// Options for mesh fixing
#[derive(Debug, Clone)]
pub struct MeshFixOptions {
    /// Join multiple components into a single mesh
    pub join_multiple_components: bool,
    /// Output in STL format (otherwise OFF format)
    pub stl_output: bool,
    /// Skip processing if output file already exists
    pub skip_if_fixed: bool,
}

impl Default for MeshFixOptions {
    fn default() -> Self {
        Self {
            join_multiple_components: false,
            stl_output: true, // Default to STL for 3D printing
            skip_if_fixed: false,
        }
    }
}

/// Result of mesh fixing operation
#[derive(Debug, Clone)]
pub enum MeshFixResult {
    Success,
    CantOpenFile,
    OutputFileExists,
    UnknownError(i32),
}

impl From<c_int> for MeshFixResult {
    fn from(code: c_int) -> Self {
        match code {
            0 => MeshFixResult::Success,
            1 => MeshFixResult::CantOpenFile,
            2 => MeshFixResult::OutputFileExists,
            other => MeshFixResult::UnknownError(other),
        }
    }
}

/// Fix a mesh using the MeshFix library
///
/// # Arguments
/// * `input_path` - Path to the input mesh file
/// * `output_path` - Path where the fixed mesh should be saved (optional)
/// * `options` - Mesh fixing options
///
/// # Returns
/// * `Ok(MeshFixResult)` - Result of the operation
/// * `Err(String)` - Error message if string conversion fails
pub fn fix_mesh(
    input_path: &str,
    output_path: Option<&str>,
    options: &MeshFixOptions,
) -> Result<MeshFixResult, String> {
    // Convert Rust strings to C strings
    let input_cstring = CString::new(input_path)
        .map_err(|_| "Invalid input path: contains null bytes")?;

    let output_cstring = if let Some(path) = output_path {
        Some(CString::new(path)
            .map_err(|_| "Invalid output path: contains null bytes")?)
    } else {
        None
    };

    // Call the C function
    let result = unsafe {
        fixMesh(
            input_cstring.as_ptr(),
            output_cstring.as_ref().map(|s| s.as_ptr()).unwrap_or(std::ptr::null()),
            options.join_multiple_components,
            options.stl_output,
            options.skip_if_fixed,
        )
    };

    Ok(result.into())
}

/// Convenience function to fix a mesh with default options
pub fn fix_mesh_simple(input_path: &str, output_path: Option<&str>) -> Result<MeshFixResult, String> {
    fix_mesh(input_path, output_path, &MeshFixOptions::default())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_options() {
        let opts = MeshFixOptions::default();
        assert!(!opts.join_multiple_components);
        assert!(opts.stl_output);
        assert!(!opts.skip_if_fixed);
    }

    #[test]
    fn test_result_conversion() {
        assert!(matches!(MeshFixResult::from(0), MeshFixResult::Success));
        assert!(matches!(MeshFixResult::from(1), MeshFixResult::CantOpenFile));
        assert!(matches!(MeshFixResult::from(2), MeshFixResult::OutputFileExists));
        assert!(matches!(MeshFixResult::from(99), MeshFixResult::UnknownError(99)));
    }
}
