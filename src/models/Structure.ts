/**
 * Represents a physical structure that can house a climbing wall
 */
export interface Structure {
  id: string;
  name: string;
  dimensions: Dimensions;
  walls: StructureWall[];
  material: StructuralMaterial;
  loadCapacity: LoadCapacity;
}

export interface Dimensions {
  width: number;  // meters
  height: number; // meters
  depth: number;  // meters
}

export interface StructureWall {
  id: string;
  position: Vector3D;
  normal: Vector3D;
  dimensions: WallDimensions;
  material: WallMaterial;
  existingAttachments: Attachment[];
}

export interface WallDimensions {
  width: number;  // meters
  height: number; // meters
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Attachment {
  position: Vector3D;
  type: 'beam' | 'stud' | 'joist' | 'support';
  loadCapacity: number; // kg
}

export type WallMaterial = 'concrete' | 'brick' | 'wood_frame' | 'steel_frame' | 'cmu';

export interface StructuralMaterial {
  type: WallMaterial;
  thickness: number; // meters
  density: number;   // kg/m³
  compressiveStrength: number; // MPa
}

export interface LoadCapacity {
  maxPointLoad: number;      // kg
  maxDistributedLoad: number; // kg/m²
  safetyFactor: number;       // typically 2.0-4.0
}
