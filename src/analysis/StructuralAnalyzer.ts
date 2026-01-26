import { ClimbingWall, LoadEstimate, PointLoad } from '../models/ClimbingWall.js';
import { Structure, LoadCapacity } from '../models/Structure.js';

/**
 * Performs structural analysis for climbing wall installations
 */
export class StructuralAnalyzer {
  /**
   * Standard values based on climbing wall engineering practices
   */
  private static readonly CONSTANTS = {
    GRAVITY: 9.81, // m/s²
    CLIMBER_WEIGHT: 90, // kg (conservative estimate)
    DYNAMIC_FACTOR: 2.5, // multiplier for impact forces
    PLYWOOD_DENSITY: 550, // kg/m³
    SAFETY_FACTOR: 3.0, // minimum safety factor for climbing walls
  };

  /**
   * Calculate the total load estimate for a climbing wall
   */
  static calculateLoadEstimate(wall: ClimbingWall): LoadEstimate {
    const staticLoad = this.calculateStaticLoad(wall);
    const dynamicLoad = this.calculateDynamicLoad(wall);
    const totalLoad = staticLoad + dynamicLoad;
    const wallArea = wall.dimensions.width * wall.dimensions.height;
    const distributedLoad = totalLoad / wallArea;
    const pointLoads = this.calculatePointLoads(wall, totalLoad);

    return {
      staticLoad,
      dynamicLoad,
      totalLoad,
      distributedLoad,
      pointLoads,
    };
  }

  /**
   * Calculate static load (weight of wall itself)
   */
  private static calculateStaticLoad(wall: ClimbingWall): number {
    let totalWeight = 0;

    // Panel weight
    for (const panel of wall.panels) {
      const volume = panel.dimensions.width *
                     panel.dimensions.height *
                     panel.dimensions.thickness;
      totalWeight += volume * this.CONSTANTS.PLYWOOD_DENSITY;
    }

    // Hold weight (approximate 0.5kg per hold)
    totalWeight += wall.holds.length * 0.5;

    return totalWeight;
  }

  /**
   * Calculate dynamic load (climbers + impact forces)
   */
  private static calculateDynamicLoad(wall: ClimbingWall): number {
    // Assume max 2 climbers on wall simultaneously
    const climberLoad = this.CONSTANTS.CLIMBER_WEIGHT * 2;

    // Apply dynamic factor for impact forces (falls, jumping to holds)
    return climberLoad * this.CONSTANTS.DYNAMIC_FACTOR;
  }

  /**
   * Calculate load at each anchor point
   */
  private static calculatePointLoads(wall: ClimbingWall, totalLoad: number): PointLoad[] {
    const pointLoads: PointLoad[] = [];
    const numAnchors = wall.anchors.length;

    if (numAnchors === 0) {
      return pointLoads;
    }

    // Simplified distribution: divide total load by number of anchors
    // In reality, this would use moment and force equilibrium equations
    const loadPerAnchor = totalLoad / numAnchors;

    for (const anchor of wall.anchors) {
      pointLoads.push({
        anchorId: anchor.id,
        position: anchor.position,
        load: loadPerAnchor,
        direction: { x: 0, y: 0, z: -1 }, // perpendicular to wall
      });
    }

    return pointLoads;
  }

  /**
   * Validate if a structure can support a climbing wall
   */
  static validateStructuralCapacity(
    wall: ClimbingWall,
    structure: Structure
  ): ValidationResult {
    const loadEstimate = this.calculateLoadEstimate(wall);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check distributed load capacity
    const maxDistributed = structure.loadCapacity.maxDistributedLoad /
                          structure.loadCapacity.safetyFactor;

    if (loadEstimate.distributedLoad > maxDistributed) {
      errors.push(
        `Distributed load (${loadEstimate.distributedLoad.toFixed(2)} kg/m²) ` +
        `exceeds structure capacity (${maxDistributed.toFixed(2)} kg/m²)`
      );
    }

    // Check point loads
    const maxPointLoad = structure.loadCapacity.maxPointLoad /
                        structure.loadCapacity.safetyFactor;

    for (const pointLoad of loadEstimate.pointLoads) {
      if (pointLoad.load > maxPointLoad) {
        errors.push(
          `Point load at anchor ${pointLoad.anchorId} ` +
          `(${pointLoad.load.toFixed(2)} kg) exceeds capacity ` +
          `(${maxPointLoad.toFixed(2)} kg)`
        );
      }
    }

    // Safety factor check
    if (structure.loadCapacity.safetyFactor < this.CONSTANTS.SAFETY_FACTOR) {
      warnings.push(
        `Safety factor (${structure.loadCapacity.safetyFactor}) is below ` +
        `recommended minimum (${this.CONSTANTS.SAFETY_FACTOR})`
      );
    }

    // Material-specific checks
    if (structure.material.type === 'wood_frame') {
      warnings.push(
        'Wood frame structures require additional stud verification. ' +
        'Ensure anchors attach to studs or blocking.'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      loadEstimate,
    };
  }

  /**
   * Recommend anchor placement based on wall dimensions and load
   */
  static recommendAnchorPlacement(wall: ClimbingWall): AnchorRecommendation {
    const wallArea = wall.dimensions.width * wall.dimensions.height;
    const loadEstimate = this.calculateLoadEstimate(wall);

    // Recommended: one anchor per 1.5-2.0 m² for climbing walls
    const minAnchors = Math.ceil(wallArea / 2.0);
    const recommendedAnchors = Math.ceil(wallArea / 1.5);

    // Spacing recommendations
    const horizontalSpacing = Math.min(1.2, wall.dimensions.width / 3);
    const verticalSpacing = Math.min(1.2, wall.dimensions.height / 3);

    return {
      minimumAnchors: minAnchors,
      recommendedAnchors,
      horizontalSpacing,
      verticalSpacing,
      anchorType: this.recommendAnchorType(loadEstimate.totalLoad / recommendedAnchors),
    };
  }

  /**
   * Recommend anchor type based on load per anchor
   */
  private static recommendAnchorType(loadPerAnchor: number): string {
    if (loadPerAnchor > 500) {
      return 'expansion_anchor (5/8" diameter minimum)';
    } else if (loadPerAnchor > 300) {
      return 'lag_screw (1/2" diameter, 4" length minimum)';
    } else if (loadPerAnchor > 150) {
      return 'lag_screw (3/8" diameter, 3" length minimum)';
    } else {
      return 'bolt (3/8" diameter minimum)';
    }
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  loadEstimate: LoadEstimate;
}

export interface AnchorRecommendation {
  minimumAnchors: number;
  recommendedAnchors: number;
  horizontalSpacing: number; // meters
  verticalSpacing: number;   // meters
  anchorType: string;
}
