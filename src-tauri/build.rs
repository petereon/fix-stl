use std::env;
use std::path::PathBuf;

fn main() {
    let target = env::var("CARGO_CFG_TARGET_OS").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let meshfix_dir = PathBuf::from(&manifest_dir).join("dependencies/meshfix/bin64");

    println!("cargo:rustc-link-lib=dylib=meshfix");

    if target == "macos" {
        println!("cargo:rustc-link-search=native={}" , meshfix_dir.join("macos").display());
        println!("cargo:rustc-env=DYLD_LIBRARY_PATH={}:$DYLD_LIBRARY_PATH", meshfix_dir.join("macos").display());
    } else if target == "windows" {
        println!("cargo:rustc-link-search=native={}", meshfix_dir.join("windows").display());
        println!("cargo:rustc-env=PATH={};$PATH", meshfix_dir.join("windows").display());
    } else if target == "linux" {
        println!("cargo:rustc-link-search=native={}", meshfix_dir.join("linux").display());
        println!("cargo:rustc-env=LD_LIBRARY_PATH={}:$LD_LIBRARY_PATH", meshfix_dir.join("linux").display());
        println!("cargo:rustc-link-arg=-Wl,-rpath,/usr/lib/fix-stl");
    }

    tauri_build::build();
}
