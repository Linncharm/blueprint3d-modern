import * as THREE from 'three';

/**
 * Custom JSONLoader to support legacy three.js JSON format models
 * Compatible with three.js r69 JSON format
 */
export class JSONLoader {
  private manager: THREE.LoadingManager;
  private texturePath: string = '';

  constructor(manager?: THREE.LoadingManager) {
    this.manager = manager || THREE.DefaultLoadingManager;
  }

  load(
    url: string,
    onLoad: (geometry: THREE.BufferGeometry, materials: THREE.Material[]) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ) {
    this.manager.itemStart(url);

    // Extract the base path for textures (same directory as the model file)
    const lastSlash = url.lastIndexOf('/');
    this.texturePath = lastSlash !== -1 ? url.substring(0, lastSlash + 1) : '';

    // Use fetch API to bypass Vite's module transformation
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        try {
          // Clean the JSON text - remove trailing whitespace and content after the closing brace
          text = text.trim();

          // Find the last occurrence of } which should be the end of the JSON
          const lastBrace = text.lastIndexOf('}');
          if (lastBrace !== -1) {
            text = text.substring(0, lastBrace + 1);
          }

          // Parse JSON
          const json = JSON.parse(text);
          const result = this.parse(json);
          onLoad(result.geometry, result.materials);
          this.manager.itemEnd(url);
        } catch (e) {
          console.error('JSONLoader parse error:', e);
          console.error('URL:', url);
          console.error('Text preview:', text.substring(0, 200));
          if (onError) {
            onError(e as any);
          }
          this.manager.itemError(url);
          this.manager.itemEnd(url);
        }
      })
      .catch(error => {
        console.error('JSONLoader fetch error:', error);
        console.error('URL:', url);
        if (onError) {
          onError(error as any);
        }
        this.manager.itemError(url);
        this.manager.itemEnd(url);
      });
  }

  private parse(json: any): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
    const geometry = new THREE.BufferGeometry();
    const materials: THREE.Material[] = [];

    // Parse materials
    if (json.materials) {
      for (const mat of json.materials) {
        materials.push(this.createMaterial(mat));
      }
    }

    // Get scale from JSON (usually 1.0)
    // The models are already in the correct units (inches)
    const scale = json.scale !== undefined ? json.scale : 1.0;

    // Parse vertices
    const vertices = json.vertices || [];
    const faces = json.faces || [];
    const normals = json.normals || [];
    const uvs = json.uvs && json.uvs[0] ? json.uvs[0] : [];

    // Convert to BufferGeometry format
    const positions: number[] = [];
    const normalsArray: number[] = [];
    const uvsArray: number[] = [];
    const indices: number[] = [];

    let offset = 0;

    // Process faces
    for (let i = 0; i < faces.length; ) {
      const type = faces[i++];

      // Determine face type
      const isQuad = type & 1;
      const hasMaterial = type & 2;
      const hasFaceUv = type & 4;
      const hasFaceVertexUv = type & 8;
      const hasFaceNormal = type & 16;
      const hasFaceVertexNormal = type & 32;
      const hasFaceColor = type & 64;
      const hasFaceVertexColor = type & 128;

      const nVertices = isQuad ? 4 : 3;

      // Get vertex indices
      const vertexIndices: number[] = [];
      for (let v = 0; v < nVertices; v++) {
        vertexIndices.push(faces[i++]);
      }

      // Material index
      if (hasMaterial) {
        i++; // Skip material index
      }

      // Face UV
      if (hasFaceUv) {
        i++; // Skip face UV
      }

      // Vertex UVs
      const vertexUvs: number[] = [];
      if (hasFaceVertexUv) {
        for (let v = 0; v < nVertices; v++) {
          const uvIndex = faces[i++];
          vertexUvs.push(uvIndex);
        }
      }

      // Face normal
      if (hasFaceNormal) {
        i++; // Skip face normal
      }

      // Vertex normals
      const vertexNormals: number[] = [];
      if (hasFaceVertexNormal) {
        for (let v = 0; v < nVertices; v++) {
          vertexNormals.push(faces[i++]);
        }
      }

      // Face color
      if (hasFaceColor) {
        i++; // Skip face color
      }

      // Vertex colors
      if (hasFaceVertexColor) {
        for (let v = 0; v < nVertices; v++) {
          i++; // Skip vertex color
        }
      }

      // Add vertices to arrays
      for (let v = 0; v < nVertices; v++) {
        const vertexIndex = vertexIndices[v];

        // Position (apply scale)
        positions.push(
          vertices[vertexIndex * 3] * scale,
          vertices[vertexIndex * 3 + 1] * scale,
          vertices[vertexIndex * 3 + 2] * scale
        );

        // Normal
        if (vertexNormals.length > 0 && vertexNormals[v] !== undefined) {
          const normalIndex = vertexNormals[v];
          normalsArray.push(
            normals[normalIndex * 3],
            normals[normalIndex * 3 + 1],
            normals[normalIndex * 3 + 2]
          );
        } else {
          normalsArray.push(0, 1, 0); // Default normal
        }

        // UV
        if (vertexUvs.length > 0 && vertexUvs[v] !== undefined) {
          const uvIndex = vertexUvs[v];
          uvsArray.push(
            uvs[uvIndex * 2],
            uvs[uvIndex * 2 + 1]
          );
        } else {
          uvsArray.push(0, 0); // Default UV
        }
      }

      // Add triangle indices
      if (isQuad) {
        // Split quad into two triangles
        indices.push(offset, offset + 1, offset + 2);
        indices.push(offset, offset + 2, offset + 3);
        offset += 4;
      } else {
        indices.push(offset, offset + 1, offset + 2);
        offset += 3;
      }
    }

    // Set attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (normalsArray.length > 0) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalsArray, 3));
    }
    if (uvsArray.length > 0) {
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvsArray, 2));
    }

    // Set indices (required for raycaster to work properly)
    geometry.setIndex(indices);

    // Compute normals if not provided
    if (normalsArray.length === 0) {
      geometry.computeVertexNormals();
    }

    // Ensure bounding box and sphere are computed
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    console.log('JSONLoader parsed geometry:', {
      vertexCount: positions.length / 3,
      faceCount: indices.length / 3,
      indexCount: indices.length,
      hasIndex: !!geometry.index,
      boundingBox: geometry.boundingBox,
      hasMaterials: materials.length > 0,
      materialCount: materials.length,
      materials: materials
    });

    return { geometry, materials };
  }

  private createMaterial(mat: any): THREE.Material {
    const params: any = {};

    if (mat.colorDiffuse) {
      params.color = new THREE.Color().fromArray(mat.colorDiffuse);
    }

    if (mat.colorSpecular) {
      params.specular = new THREE.Color().fromArray(mat.colorSpecular);
    }

    if (mat.colorEmissive) {
      params.emissive = new THREE.Color().fromArray(mat.colorEmissive);
    }

    if (mat.transparent !== undefined) {
      params.transparent = mat.transparent;
    }

    if (mat.opacity !== undefined) {
      params.opacity = mat.opacity;
    }

    if (mat.mapDiffuse) {
      const loader = new THREE.TextureLoader();
      // Prepend the texture path to the texture filename
      const textureUrl = this.texturePath + mat.mapDiffuse;
      params.map = loader.load(textureUrl);
    }

    // Create MeshPhongMaterial by default
    const material = new THREE.MeshPhongMaterial(params);

    console.log('Created material:', {
      type: material.type,
      isMaterial: material instanceof THREE.Material,
      color: material.color,
      hasMap: !!material.map,
      mapUrl: mat.mapDiffuse
    });

    return material;
  }
}
