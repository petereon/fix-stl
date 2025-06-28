declare module 'three-stdlib' {
  import * as THREE from 'three';

  export class STLLoader extends THREE.Loader {
    constructor(manager?: THREE.LoadingManager);

    load(
      url: string,
      onLoad: (geometry: THREE.BufferGeometry) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent | Error) => void
    ): void;

    parse(data: ArrayBuffer | string): THREE.BufferGeometry;
  }
}
