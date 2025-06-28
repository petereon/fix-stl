// Example of how to use the mesh fixing functionality from the frontend

import { invoke } from '@tauri-apps/api/core';

// Define the types for TypeScript
interface FixMeshOptions {
  join_multiple_components?: boolean;
  stl_output?: boolean;
  skip_if_fixed?: boolean;
}

interface FixMeshResponse {
  success: boolean;
  message: string;
  output_path?: string;
}

/**
 * Fix a mesh file using the MeshFix library
 * @param inputPath - Path to the input mesh file
 * @param outputPath - Optional path for the output file
 * @param options - Optional mesh fixing options
 * @returns Promise<FixMeshResponse>
 */
export async function fixMeshFile(
  inputPath: string,
  outputPath?: string,
  options?: FixMeshOptions
): Promise<FixMeshResponse> {
  try {
    const response = await invoke<FixMeshResponse>('fix_mesh_file', {
      inputPath,
      outputPath,
      options,
    });
    return response;
  } catch (error) {
    console.error('Error fixing mesh:', error);
    throw error;
  }
}

// Example usage:
/*
// Basic usage with default options (outputs STL)
const result = await fixMeshFile('/path/to/input.stl');
if (result.success) {
  console.log('Mesh fixed successfully:', result.output_path);
} else {
  console.error('Failed to fix mesh:', result.message);
}

// Advanced usage with custom options
const result = await fixMeshFile(
  '/path/to/input.off',
  '/path/to/output.stl',
  {
    join_multiple_components: true,
    stl_output: true,
    skip_if_fixed: false,
  }
);
*/
