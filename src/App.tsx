import { useState } from "react";
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import STLViewer from "./components/STLViewer";
import { fixMeshFile } from "./meshfix-api";
import "./App.css";

function App() {
  const [originalFile, setOriginalFile] = useState<string | null>(null);
  const [fixedFile, setFixedFile] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixStatus, setFixStatus] = useState<string>("");
  const [fixOptions, setFixOptions] = useState({
    join_multiple_components: false,
    stl_output: true,
    skip_if_fixed: false,
  });

  const handleLoadFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'STL Files',
          extensions: ['stl']
        }, {
          name: 'All Files',
          extensions: ['*']
        }]
      });

      if (selected && typeof selected === 'string') {
        setOriginalFile(selected);
        setFixedFile(null); // Clear previous fixed file
        setFixStatus("");
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      setFixStatus(`Error selecting file: ${error}`);
    }
  };

  const handleFixMesh = async () => {
    if (!originalFile) {
      setFixStatus("Please select a file first");
      return;
    }

    setIsFixing(true);
    setFixStatus("Fixing mesh...");

    try {
      const result = await fixMeshFile(originalFile, undefined, fixOptions);

      if (result.success && result.output_path) {
        setFixedFile(result.output_path);
        setFixStatus(`Mesh fixed successfully! Saved to: ${result.output_path}`);
      } else {
        setFixStatus(`Failed to fix mesh: ${result.message}`);
      }
    } catch (error) {
      console.error('Error fixing mesh:', error);
      setFixStatus(`Error fixing mesh: ${error}`);
    } finally {
      setIsFixing(false);
    }
  };

  const handleOpenFixedFolder = async () => {
    if (!fixedFile) return;

    try {
      await invoke('open_file_location', { filePath: fixedFile });
    } catch (error) {
      console.error('Error opening folder:', error);
      setFixStatus(`Error opening folder: ${error}`);
    }
  };

  return (
    <main className="container">
      <div className="controls">
        <div className="file-controls">
          <button onClick={handleLoadFile} className="load-button">
            📁 Load STL File
          </button>

          <button
            onClick={handleFixMesh}
            disabled={!originalFile || isFixing}
            className="fix-button"
          >
            {isFixing ? "⚙️ Fixing..." : "🔧 Fix Mesh"}
          </button>
        </div>

        <div className="options">
          <h3>Fix Options</h3>
          <div>
            <label>
              <input
                type="checkbox"
                checked={fixOptions.join_multiple_components}
                onChange={(e) => setFixOptions({
                  ...fixOptions,
                  join_multiple_components: e.target.checked
                })}
              />
              Join multiple components
            </label>

            <label>
              <input
                type="checkbox"
                checked={fixOptions.stl_output}
                onChange={(e) => setFixOptions({
                  ...fixOptions,
                  stl_output: e.target.checked
                })}
              />
              Output as STL
            </label>

            <label>
              <input
                type="checkbox"
                checked={fixOptions.skip_if_fixed}
                onChange={(e) => setFixOptions({
                  ...fixOptions,
                  skip_if_fixed: e.target.checked
                })}
              />
              Skip if exists
            </label>
          </div>
        </div>
      </div>

      {fixStatus && (
        <div className={`status ${fixStatus.includes('Error') || fixStatus.includes('Failed') ? 'error' : 'success'}`}>
          {fixStatus}
        </div>
      )}

      <div className="viewers">
        <div className="viewer-container">
          <div className="viewer-title">Original</div>
          <STLViewer
            filePath={originalFile}
            width={500}
            height={400}
          />
        </div>
        <div className="viewer-container">
          <div className="viewer-title">Fixed</div>
          <STLViewer
            filePath={fixedFile}
            width={500}
            height={400}
          />
          {fixedFile && (
            <button
              onClick={handleOpenFixedFolder}
              className="open-folder-button"
              title="Open folder containing fixed file"
              style={{ marginTop: '10px' }}
            >
              📁 Open Folder
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
