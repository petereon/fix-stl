fn main() {
    // Link to the meshfix library
    println!("cargo:rustc-link-search=native=dependencies/meshfix/bin64");
    println!("cargo:rustc-link-lib=dylib=meshfix");

    // Add runtime library path
    println!("cargo:rustc-env=DYLD_LIBRARY_PATH=dependencies/meshfix/bin64:$DYLD_LIBRARY_PATH");

    tauri_build::build()
}
