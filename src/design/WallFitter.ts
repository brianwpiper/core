import { ClimbingWall, Panel, Anchor } from '../models/ClimbingWall.js';
import { Structure, StructureWall, Vector3D } from '../models/Structure.js';
import { StructuralAnalyzer } from '../analysis/StructuralAnalyzer.js';

/**
 * Algorithm for fitting climbing walls into existing structures
 */
export class WallFitter {
  /**
   * Find suitable wall placements within a structure
   */
  static findSuitableWalls(
    structure: Structure,
    requirements: WallRequirements
  ): FitResult[] {
    const results: FitResult[] = [];

    for (const structureWall of structure.walls) {
      const fits = this.fitWallToSurface(
        structureWall,
        structure,
        requirements
      );
      results.push(...fits);
    }

    // Sort by fitness score
    results.sort((a, b) => b.fitnessScore - a.fitnessScore);

    return results;
  }

  /**
   * Fit a climbing wall to a specific structure wall
   */
  private static fitWallToSurface(
    structureWall: StructureWall,
    structure: Structure,
    requirements: WallRequirements
  ): FitResult[] {
    const results: FitResult[] = [];

    // Check if wall is large enough
    if (
      structureWall.dimensions.width < requirements.minWidth ||
      structureWall.dimensions.height < requirements.minHeight
    ) {
      return results;
    }

    // Try different wall configurations
    const configurations = this.generateConfigurations(
      structureWall,
      requirements
    );

    for (const config of configurations) {
      const wall = this.generateClimbingWall(config, requirements);
      const validation = StructuralAnalyzer.validateStructuralCapacity(
        wall,
        structure
      );

      const fitnessScore = this.calculateFitnessScore(
        wall,
        structureWall,
        validation,
        requirements
      );

      results.push({
        wall,
        structureWall,
        position: config.position,
        validation,
        fitnessScore,
      });
    }

    return results;
  }

  /**
   * Generate different wall configurations for a surface
   */
  private static generateConfigurations(
    structureWall: StructureWall,
    requirements: WallRequirements
  ): WallConfiguration[] {
    const configurations: WallConfiguration[] = [];

    // Try different sizes within constraints
    const widths = [
      requirements.minWidth,
      Math.min(requirements.maxWidth, structureWall.dimensions.width),
    ];

    const heights = [
      requirements.minHeight,
      Math.min(requirements.maxHeight, structureWall.dimensions.height),
    ];

    const angles = requirements.allowedAngles || [0]; // vertical by default

    for (const width of widths) {
      for (const height of heights) {
        for (const angle of angles) {
          // Try different positions along the wall
          const numPositions = 3;
          for (let i = 0; i < numPositions; i++) {
            const xOffset = (structureWall.dimensions.width - width) * (i / (numPositions - 1));
            const position: Vector3D = {
              x: structureWall.position.x + xOffset,
              y: structureWall.position.y,
              z: structureWall.position.z,
            };

            configurations.push({
              width,
              height,
              angle,
              position,
            });
          }
        }
      }
    }

    return configurations;
  }

  /**
   * Generate a climbing wall from configuration
   */
  private static generateClimbingWall(
    config: WallConfiguration,
    requirements: WallRequirements
  ): ClimbingWall {
    const wallId = `wall-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate panels (4x8 ft standard)
    const panelWidth = 1.22; // 4 ft in meters
    const panelHeight = 2.44; // 8 ft in meters
    const panels = this.generatePanels(config, panelWidth, panelHeight);

    // Generate anchor points
    const anchors = this.generateAnchors(config, panels);

    // Generate holds based on difficulty
    const holds = this.generateHolds(config, requirements.difficulty);

    const wall: ClimbingWall = {
      id: wallId,
      name: `Climbing Wall ${wallId}`,
      dimensions: {
        width: config.width,
        height: config.height,
      },
      angle: config.angle,
      thickness: 0.02, // 20mm plywood
      panels,
      holds,
      anchors,
      totalWeight: 0,
      estimatedLoad: {
        staticLoad: 0,
        dynamicLoad: 0,
        totalLoad: 0,
        distributedLoad: 0,
        pointLoads: [],
      },
    };

    // Calculate loads
    wall.estimatedLoad = StructuralAnalyzer.calculateLoadEstimate(wall);
    wall.totalWeight = wall.estimatedLoad.staticLoad;

    return wall;
  }

  /**
   * Generate panel layout
   */
  private static generatePanels(
    config: WallConfiguration,
    panelWidth: number,
    panelHeight: number
  ): Panel[] {
    const panels: Panel[] = [];
    const numPanelsX = Math.ceil(config.width / panelWidth);
    const numPanelsY = Math.ceil(config.height / panelHeight);

    for (let y = 0; y < numPanelsY; y++) {
      for (let x = 0; x < numPanelsX; x++) {
        const actualWidth = Math.min(panelWidth, config.width - x * panelWidth);
        const actualHeight = Math.min(panelHeight, config.height - y * panelHeight);

        panels.push({
          id: `panel-${x}-${y}`,
          position: {
            x: config.position.x + x * panelWidth + actualWidth / 2,
            y: config.position.y + y * panelHeight + actualHeight / 2,
            z: config.position.z,
          },
          dimensions: {
            width: actualWidth,
            height: actualHeight,
            thickness: 0.02,
          },
          material: 'plywood',
          weight: actualWidth * actualHeight * 0.02 * 550, // plywood density
          tNutSpacing: 20, // 20cm grid
        });
      }
    }

    return panels;
  }

  /**
   * Generate anchor points
   */
  private static generateAnchors(
    config: WallConfiguration,
    panels: Panel[]
  ): Anchor[] {
    const anchors: Anchor[] = [];
    const spacing = 1.2; // 1.2m spacing recommended

    const numAnchorsX = Math.ceil(config.width / spacing) + 1;
    const numAnchorsY = Math.ceil(config.height / spacing) + 1;

    for (let y = 0; y < numAnchorsY; y++) {
      for (let x = 0; x < numAnchorsX; x++) {
        const posX = config.position.x + (x * config.width) / (numAnchorsX - 1);
        const posY = config.position.y + (y * config.height) / (numAnchorsY - 1);

        anchors.push({
          id: `anchor-${x}-${y}`,
          position: {
            x: posX,
            y: posY,
            z: config.position.z - 0.05, // behind wall
          },
          type: 'lag_screw',
          loadRating: 450, // kg
        });
      }
    }

    return anchors;
  }

  /**
   * Generate climbing holds
   */
  private static generateHolds(
    config: WallConfiguration,
    difficulty: number = 5
  ): any[] {
    // Simplified hold generation
    // In a real implementation, this would use route-setting algorithms
    return [];
  }

  /**
   * Calculate fitness score for a wall placement
   */
  private static calculateFitnessScore(
    wall: ClimbingWall,
    structureWall: StructureWall,
    validation: any,
    requirements: WallRequirements
  ): number {
    let score = 100;

    // Penalize invalid structures
    if (!validation.valid) {
      score -= 50;
    }

    // Reward larger walls (up to requirements)
    const sizeRatio = (wall.dimensions.width * wall.dimensions.height) /
                     (requirements.maxWidth * requirements.maxHeight);
    score += sizeRatio * 20;

    // Penalize warnings
    score -= validation.warnings.length * 5;

    // Prefer centered placements
    const centerX = structureWall.dimensions.width / 2;
    const wallCenterX = wall.dimensions.width / 2;
    const centerOffset = Math.abs(centerX - wallCenterX);
    score -= (centerOffset / structureWall.dimensions.width) * 10;

    return Math.max(0, score);
  }
}

export interface WallRequirements {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  difficulty: number; // 1-10
  allowedAngles?: number[]; // degrees from vertical
}

export interface WallConfiguration {
  width: number;
  height: number;
  angle: number;
  position: Vector3D;
}

export interface FitResult {
  wall: ClimbingWall;
  structureWall: StructureWall;
  position: Vector3D;
  validation: any;
  fitnessScore: number;
}
