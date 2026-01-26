import * as THREE from 'three';
import { ClimbingWall, Panel, Hold } from '../models/ClimbingWall.js';
import { Structure, StructureWall } from '../models/Structure.js';

/**
 * 3D visualization system for climbing wall designs using Three.js
 */
export class Scene3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    this.camera = new THREE.PerspectiveCamera(
      75,
      16 / 9, // default aspect ratio for Node.js environment
      0.1,
      1000
    );
    this.camera.position.set(5, 3, 5);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
  }

  /**
   * Setup scene lighting
   */
  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-10, 5, -10);
    this.scene.add(directionalLight2);
  }

  /**
   * Add a structure to the scene
   */
  addStructure(structure: Structure): THREE.Group {
    const structureGroup = new THREE.Group();
    structureGroup.name = `structure-${structure.id}`;

    // Floor
    const floorGeometry = new THREE.BoxGeometry(
      structure.dimensions.width,
      0.1,
      structure.dimensions.depth
    );
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    structureGroup.add(floor);

    // Walls
    for (const wall of structure.walls) {
      const wallMesh = this.createStructureWall(wall);
      structureGroup.add(wallMesh);
    }

    // Grid helper
    const gridHelper = new THREE.GridHelper(
      Math.max(structure.dimensions.width, structure.dimensions.depth),
      20
    );
    structureGroup.add(gridHelper);

    this.scene.add(structureGroup);
    return structureGroup;
  }

  /**
   * Create a structure wall mesh
   */
  private createStructureWall(wall: StructureWall): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      wall.dimensions.width,
      wall.dimensions.height,
      0.2
    );

    const material = new THREE.MeshStandardMaterial({
      color: this.getMaterialColor(wall.material),
      roughness: 0.7,
      transparent: true,
      opacity: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      wall.position.x,
      wall.position.y + wall.dimensions.height / 2,
      wall.position.z
    );

    return mesh;
  }

  /**
   * Add a climbing wall to the scene
   */
  addClimbingWall(wall: ClimbingWall, position?: THREE.Vector3): THREE.Group {
    const wallGroup = new THREE.Group();
    wallGroup.name = `climbing-wall-${wall.id}`;

    if (position) {
      wallGroup.position.copy(position);
    }

    // Panels
    for (const panel of wall.panels) {
      const panelMesh = this.createPanel(panel);
      wallGroup.add(panelMesh);
    }

    // Holds
    for (const hold of wall.holds) {
      const holdMesh = this.createHold(hold);
      wallGroup.add(holdMesh);
    }

    // Anchors
    for (const anchor of wall.anchors) {
      const anchorMesh = this.createAnchor(anchor.position);
      wallGroup.add(anchorMesh);
    }

    // Apply wall angle (rotation)
    if (wall.angle !== 0) {
      wallGroup.rotation.x = (wall.angle * Math.PI) / 180;
    }

    this.scene.add(wallGroup);
    return wallGroup;
  }

  /**
   * Create a panel mesh
   */
  private createPanel(panel: Panel): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      panel.dimensions.width,
      panel.dimensions.height,
      panel.dimensions.thickness
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0xdeb887, // wood color
      roughness: 0.9,
    });

    // Add wireframe to show panel grid
    const wireframe = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const line = new THREE.LineSegments(wireframe, lineMaterial);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      panel.position.x,
      panel.position.y,
      panel.position.z
    );
    mesh.add(line);

    return mesh;
  }

  /**
   * Create a climbing hold mesh
   */
  private createHold(hold: Hold): THREE.Mesh {
    const size = this.getHoldSize(hold.size);
    const geometry = new THREE.SphereGeometry(size, 8, 8);

    const material = new THREE.MeshStandardMaterial({
      color: this.getHoldColor(hold.type),
      roughness: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      hold.position.x,
      hold.position.y,
      hold.position.z + 0.05 // offset from wall
    );

    return mesh;
  }

  /**
   * Create an anchor point mesh
   */
  private createAnchor(position: { x: number; y: number; z: number }): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.x = Math.PI / 2;

    return mesh;
  }

  /**
   * Get material color based on type
   */
  private getMaterialColor(material: string): number {
    const colors: Record<string, number> = {
      concrete: 0x999999,
      brick: 0xb22222,
      wood_frame: 0xdeb887,
      steel_frame: 0x708090,
      cmu: 0x808080,
    };
    return colors[material] || 0xcccccc;
  }

  /**
   * Get hold size in meters
   */
  private getHoldSize(size: string): number {
    const sizes: Record<string, number> = {
      xs: 0.03,
      s: 0.05,
      m: 0.07,
      l: 0.10,
      xl: 0.15,
    };
    return sizes[size] || 0.07;
  }

  /**
   * Get hold color based on type
   */
  private getHoldColor(type: string): number {
    const colors: Record<string, number> = {
      jug: 0x4169e1,      // royal blue
      crimp: 0xff4500,    // orange red
      sloper: 0x32cd32,   // lime green
      pinch: 0xff69b4,    // hot pink
      pocket: 0x9370db,   // medium purple
      edge: 0xffd700,     // gold
      volume: 0x00ced1,   // dark turquoise
    };
    return colors[type] || 0x4169e1;
  }

  /**
   * Export scene to a format suitable for rendering or file export
   */
  exportScene(): SceneExport {
    const objects: SceneObject[] = [];

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        objects.push({
          name: object.name,
          type: object.geometry.type,
          position: object.position.toArray(),
          rotation: object.rotation.toArray() as [number, number, number],
          scale: object.scale.toArray(),
        });
      }
    });

    return {
      camera: {
        position: this.camera.position.toArray(),
        rotation: this.camera.rotation.toArray() as [number, number, number],
      },
      objects,
    };
  }

  /**
   * Get the Three.js scene
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Clear the scene
   */
  clear(): void {
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);
    }
    this.setupLighting();
  }
}

export interface SceneExport {
  camera: {
    position: [number, number, number];
    rotation: [number, number, number];
  };
  objects: SceneObject[];
}

export interface SceneObject {
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}
