import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { invoke } from '@tauri-apps/api/core';

interface STLViewerProps {
  filePath: string | null;
  width?: number;
  height?: number;
  showOpenFolder?: boolean;
  onOpenFolder?: () => void;
}

const STLViewer: React.FC<STLViewerProps> = ({
  filePath,
  width = 400,
  height = 300,
  showOpenFolder = false,
  onOpenFolder
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Controls for rotation
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseDown = (event: MouseEvent) => {
      mouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      mouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!mouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      if (meshRef.current) {
        meshRef.current.rotation.y += deltaX * 0.01;
        meshRef.current.rotation.x += deltaY * 0.01;
      }

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height]);

  useEffect(() => {
    if (!filePath || !sceneRef.current) {
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Remove previous mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current = null;
    }

    const loader = new STLLoader();

    // Use Tauri command to read the file
    invoke<number[]>('read_stl_file', { filePath })
      .then((data: number[]) => {
        // Convert to Uint8Array
        const uint8Array = new Uint8Array(data);
        const geometry = loader.parse(uint8Array.buffer);

        // Center the geometry
        geometry.center();

        // Scale geometry to fit in view (larger scale to fill more space)
        const box = new THREE.Box3().setFromObject(new THREE.Mesh(geometry));
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 60 / maxDim; // Increased from 30 to 60 to make meshes larger
          geometry.scale(scale, scale, scale);
        }

        // Create material
        const material = new THREE.MeshLambertMaterial({
          color: 0x0099ff,
          transparent: true,
          opacity: 0.9,
        });

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        meshRef.current = mesh;
        sceneRef.current!.add(mesh);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading STL:', error);
        setError(`Failed to load STL file: ${error}`);
        setIsLoading(false);
      });
  }, [filePath]);

  // Helper function to get filename from path
  const getFileName = (path: string | null): string => {
    if (!path) return '';
    return path.split('/').pop() || path.split('\\').pop() || '';
  };

  return (
    <div className="stl-viewer">
      <div
        ref={mountRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          border: '1px solid #ccc',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '10px',
            borderRadius: '4px',
            zIndex: 10
          }}>
            Loading...
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 0, 0, 0.1)',
            color: 'red',
            padding: '10px',
            borderRadius: '4px',
            zIndex: 10,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        {!filePath && !isLoading && !error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            textAlign: 'center'
          }}>
            No file selected
          </div>
        )}
      </div>

      <div className="viewer-info">
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Click and drag to rotate
        </p>

        {filePath && (
          <div className="viewer-filename">
            {getFileName(filePath)}
          </div>
        )}

        {showOpenFolder && filePath && (
          <button
            className="open-folder-button"
            onClick={onOpenFolder}
          >
            📁 Open Folder
          </button>
        )}
      </div>
    </div>
  );
};

export default STLViewer;
