import { Vector3D, WallDimensions } from './Structure.js';

/**
 * Represents a climbing wall design
 */
export interface ClimbingWall {
  id: string;
  name: string;
  dimensions: WallDimensions;
  angle: number; // degrees from vertical (0 = vertical, positive = overhang)
  thickness: number; // meters
  panels: Panel[];
  holds: Hold[];
  anchors: Anchor[];
  totalWeight: number; // kg
  estimatedLoad: LoadEstimate;
}

export interface Panel {
  id: string;
  position: Vector3D;
  dimensions: PanelDimensions;
  material: PanelMaterial;
  weight: number; // kg
  tNutSpacing: number; // cm (typically 20cm grid)
}

export interface PanelDimensions {
  width: number;  // meters
  height: number; // meters
  thickness: number; // meters (typically 0.018-0.025m / 18-25mm)
}

export type PanelMaterial = 'plywood' | 'mdf' | 'osb' | 'composite';

export interface Hold {
  id: string;
  position: Vector3D;
  type: HoldType;
  size: HoldSize;
  difficulty: number; // 1-10
}

export type HoldType = 'jug' | 'crimp' | 'sloper' | 'pinch' | 'pocket' | 'edge' | 'volume';
export type HoldSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export interface Anchor {
  id: string;
  position: Vector3D;
  type: AnchorType;
  loadRating: number; // kg
}

export type AnchorType = 'bolt' | 'lag_screw' | 'toggle_bolt' | 'expansion_anchor';

export interface LoadEstimate {
  staticLoad: number;      // kg (wall weight)
  dynamicLoad: number;     // kg (climbers + impact forces)
  totalLoad: number;       // kg
  distributedLoad: number; // kg/m²
  pointLoads: PointLoad[]; // individual anchor loads
}

export interface PointLoad {
  anchorId: string;
  position: Vector3D;
  load: number; // kg
  direction: Vector3D;
}
