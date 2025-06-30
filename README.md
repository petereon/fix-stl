# Introduction

STL Mesh Fixer is a tiny desktop application that wraps MeshFix to provide a user-friendly way to fix common STL issues.

# Manual Build Instructions

To build this project manually (outside CI), follow these steps for your platform:

## 1. Clone the Repository

```sh
git clone --recursive <repo-url>
cd fix-stl
```

## 2. Build the MeshFix C++ Dependency

### Linux

```sh
sudo apt-get update
sudo apt-get install -y build-essential cmake g++ libeigen3-dev libglib2.0-dev libgtk-3-dev libsoup-3.0-dev javascriptcoregtk-4.1-dev webkit2gtk-4.1-dev pkg-config
export MESHFIX_SRC=src-tauri/dependencies/meshfix
export MESHFIX_OUT=src-tauri/dependencies/meshfix/bin64
mkdir -p $MESHFIX_SRC/build
cd $MESHFIX_SRC/build
cmake .. -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON
cmake --build . --config Release
mkdir -p $MESHFIX_OUT/linux
cp $MESHFIX_OUT/libmeshfix.so $MESHFIX_OUT/linux/libmeshfix.so
```

### macOS

```sh
export MESHFIX_SRC=src-tauri/dependencies/meshfix
export MESHFIX_OUT=src-tauri/dependencies/meshfix/bin64
mkdir -p $MESHFIX_SRC/build
cd $MESHFIX_SRC/build
cmake .. -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON
cmake --build . --config Release
mkdir -p $MESHFIX_OUT/macos
cp $MESHFIX_OUT/libmeshfix.dylib $MESHFIX_OUT/macos/libmeshfix.dylib
install_name_tool -id "@executable_path/../Frameworks/libmeshfix.dylib" $MESHFIX_OUT/macos/libmeshfix.dylib
```

### Windows (PowerShell)

```powershell
$env:MESHFIX_SRC="src-tauri\dependencies\meshfix"
$env:MESHFIX_OUT="src-tauri\dependencies\meshfix\bin64"
mkdir $env:MESHFIX_SRC\build
cd $env:MESHFIX_SRC\build
cmake .. -G "Visual Studio 17 2022" -A x64 -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON
cmake --build . --config Release
mkdir $env:MESHFIX_OUT\windows
Copy-Item $env:MESHFIX_SRC\build\Release\meshfix.dll $env:MESHFIX_OUT\windows\meshfix.dll
Copy-Item $env:MESHFIX_SRC\build\Release\meshfix.lib $env:MESHFIX_OUT\windows\meshfix.lib
```

## 3. Install Node, Bun, Rust, and Tauri CLI

- Install [Node.js](https://nodejs.org/) (v20+)
- Install [Bun](https://bun.sh/)
- Install [Rust](https://rustup.rs/)
- Install Tauri CLI:

```sh
bun install -g @tauri-apps/cli
```

## 4. Install Frontend Dependencies

```sh
bun install
```

## 5. Build the Tauri App

```sh
bun run tauri build
```

## 6. Find the Bundled App

The built app and all required native libraries will be in:

- `src-tauri/target/release/bundle/`
