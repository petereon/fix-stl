# MeshFix Integration for Tauri

This project integrates the MeshFix library with a Tauri application, allowing you to fix 3D mesh files from both Rust and the frontend.

## Setup

The integration is already configured in this project. The key components are:

### 1. Library Dependencies
- The `libmeshfix.dylib` library is located in `src-tauri/dependencies/meshfix/bin64/`
- The library path is configured in `.env` file for runtime loading
- Build configuration in `build.rs` links the library during compilation

### 2. Rust API
The Rust code provides:
- `meshfix` module with safe bindings to the C library
- `fix_mesh_file` Tauri command for frontend integration
- Proper error handling and result types

### 3. Frontend API
The TypeScript code provides:
- Type-safe interface for calling the mesh fixing functionality
- Simple async functions for frontend integration

## Usage

### From Rust

```rust
use crate::meshfix::{fix_mesh, MeshFixOptions, MeshFixResult};

let options = MeshFixOptions {
    join_multiple_components: true,
    stl_output: true,
    skip_if_fixed: false,
};

match fix_mesh("input.stl", Some("output.stl"), &options) {
    Ok(MeshFixResult::Success) => println!("Mesh fixed successfully!"),
    Ok(result) => println!("Fix failed: {:?}", result),
    Err(e) => eprintln!("Error: {}", e),
}
```

### From Frontend (TypeScript/JavaScript)

```typescript
import { fixMeshFile } from './meshfix-api';

// Basic usage
const result = await fixMeshFile('/path/to/input.stl');
if (result.success) {
    console.log('Fixed mesh saved to:', result.output_path);
}

// Advanced usage with options
const result = await fixMeshFile(
    '/path/to/input.off',
    '/path/to/custom_output.stl',
    {
        join_multiple_components: true,
        stl_output: true,
        skip_if_fixed: false,
    }
);
```

## MeshFix Options

- `join_multiple_components`: Join multiple disconnected components into a single mesh
- `stl_output`: Output in STL format (true) or OFF format (false)
- `skip_if_fixed`: Skip processing if the output file already exists

## Supported File Formats

### Input Formats
The MeshFix library supports various input formats including:
- STL files (.stl)
- OFF files (.off)
- PLY files (.ply)
- And other common 3D mesh formats

### Output Formats
- STL (.stl) - Default, good for 3D printing
- OFF (.off) - Object File Format

## Error Handling

The API provides detailed error information:
- `Success`: Mesh was fixed successfully
- `CantOpenFile`: Input file could not be opened
- `OutputFileExists`: Output file already exists (when skip_if_fixed is true)
- `UnknownError(code)`: Other errors with error codes

## Runtime Requirements

Make sure the `DYLD_LIBRARY_PATH` environment variable includes the path to the MeshFix library:

```bash
export DYLD_LIBRARY_PATH=src-tauri/dependencies/meshfix/bin64:$DYLD_LIBRARY_PATH
```

This is automatically set in the `.env` file for development.

## Building

The project should build automatically with `cargo build`. The build script:
1. Links to the MeshFix dynamic library
2. Sets up the library search path
3. Configures runtime library loading

## Troubleshooting

### Library Not Found
If you get "library not found" errors:
1. Check that `libmeshfix.dylib` exists in `src-tauri/dependencies/meshfix/bin64/`
2. Verify the `DYLD_LIBRARY_PATH` is set correctly
3. Make sure you're running on a compatible macOS version

### Compilation Errors
If compilation fails:
1. Ensure all dependencies are installed (`cargo check`)
2. Verify the library path in `build.rs` is correct
3. Check that the C function signatures match the library

### Runtime Errors
If the mesh fixing fails:
1. Verify input file exists and is readable
2. Check input file format is supported
3. Ensure output directory is writable
4. Review the error message for specific issues
