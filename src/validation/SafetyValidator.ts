import { ClimbingWall } from '../models/ClimbingWall.js';
import { Structure } from '../models/Structure.js';

/**
 * Safety validation for climbing wall designs
 */
export class SafetyValidator {
  /**
   * Validate a climbing wall design for safety compliance
   */
  static validateDesign(wall: ClimbingWall): SafetyValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Dimensional checks
    this.validateDimensions(wall, errors, warnings);

    // Angle checks
    this.validateAngle(wall, errors, warnings);

    // Anchor checks
    this.validateAnchors(wall, errors, warnings, recommendations);

    // Panel checks
    this.validatePanels(wall, errors, warnings);

    // Load distribution checks
    this.validateLoadDistribution(wall, warnings, recommendations);

    return {
      safe: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }

  /**
   * Validate wall dimensions
   */
  private static validateDimensions(
    wall: ClimbingWall,
    errors: string[],
    warnings: string[]
  ): void {
    const { width, height } = wall.dimensions;

    if (width < 2.0) {
      warnings.push('Wall width is less than 2m. Consider a wider wall for better climbing experience.');
    }

    if (height < 2.5) {
      warnings.push('Wall height is less than 2.5m. Consider a taller wall for adequate climbing.');
    }

    if (width > 15.0) {
      errors.push('Wall width exceeds 15m. This requires special engineering consideration.');
    }

    if (height > 12.0) {
      errors.push('Wall height exceeds 12m. This requires special engineering and safety equipment.');
    }

    const aspectRatio = height / width;
    if (aspectRatio > 4.0) {
      warnings.push('Wall aspect ratio is very high. Consider widening the wall for stability.');
    }
  }

  /**
   * Validate wall angle
   */
  private static validateAngle(
    wall: ClimbingWall,
    errors: string[],
    warnings: string[]
  ): void {
    const angle = wall.angle;

    if (Math.abs(angle) > 45) {
      errors.push('Wall angle exceeds safe limits (±45°).');
    }

    if (angle > 30) {
      warnings.push(
        'Steep overhang (>30°) requires advanced anchoring and may need additional bottom support.'
      );
    }

    if (angle < -10) {
      warnings.push(
        'Slab angle (<-10°) may cause climbers to fall away from wall. Ensure adequate fall zone.'
      );
    }
  }

  /**
   * Validate anchor placement and capacity
   */
  private static validateAnchors(
    wall: ClimbingWall,
    errors: string[],
    warnings: string[],
    recommendations: string[]
  ): void {
    const { anchors } = wall;

    if (anchors.length === 0) {
      errors.push('No anchors defined. Wall must be properly anchored to structure.');
      return;
    }

    const wallArea = wall.dimensions.width * wall.dimensions.height;
    const anchorsPerArea = anchors.length / wallArea;

    if (anchorsPerArea < 0.5) {
      errors.push(
        `Insufficient anchors: ${anchors.length} anchors for ${wallArea.toFixed(1)}m². ` +
        `Minimum: ${Math.ceil(wallArea * 0.5)} anchors.`
      );
    } else if (anchorsPerArea < 0.67) {
      warnings.push(
        'Anchor density is at minimum. Consider adding more anchors for safety margin.'
      );
    }

    // Check anchor spacing
    const maxSpacing = this.calculateMaxAnchorSpacing(anchors);
    if (maxSpacing > 1.5) {
      warnings.push(
        `Maximum anchor spacing (${maxSpacing.toFixed(2)}m) exceeds recommended 1.5m. ` +
        'Add anchors to reduce spacing.'
      );
    }

    // Check edge anchors
    const hasEdgeAnchors = this.checkEdgeAnchors(wall);
    if (!hasEdgeAnchors) {
      warnings.push('Anchors should be placed near all edges of the wall for proper support.');
    }

    // Load rating check
    const minLoadRating = 400; // kg
    const weakAnchors = anchors.filter(a => a.loadRating < minLoadRating);
    if (weakAnchors.length > 0) {
      warnings.push(
        `${weakAnchors.length} anchor(s) have load rating below ${minLoadRating}kg. ` +
        'Consider using higher-rated anchors.'
      );
    }

    recommendations.push(
      'All anchors should be installed by qualified professionals and inspected regularly.'
    );
  }

  /**
   * Validate panel configuration
   */
  private static validatePanels(
    wall: ClimbingWall,
    errors: string[],
    warnings: string[]
  ): void {
    const { panels } = wall;

    if (panels.length === 0) {
      errors.push('No panels defined. Wall must have climbing surface panels.');
      return;
    }

    // Check panel thickness
    const thinPanels = panels.filter(p => p.dimensions.thickness < 0.018);
    if (thinPanels.length > 0) {
      warnings.push(
        `${thinPanels.length} panel(s) are thinner than 18mm. ` +
        'Use minimum 18mm plywood for structural integrity.'
      );
    }

    const thickPanels = panels.filter(p => p.dimensions.thickness > 0.025);
    if (thickPanels.length > 0) {
      warnings.push(
        `${thickPanels.length} panel(s) are thicker than 25mm. ` +
        'This adds unnecessary weight. 18-25mm is optimal.'
      );
    }

    // Check T-nut spacing
    const irregularSpacing = panels.filter(
      p => p.tNutSpacing !== 20 && p.tNutSpacing !== 15
    );
    if (irregularSpacing.length > 0) {
      warnings.push(
        'Standard T-nut spacing is 15cm or 20cm grid for optimal hold placement flexibility.'
      );
    }

    // Material check
    const nonPlywood = panels.filter(p => p.material !== 'plywood');
    if (nonPlywood.length > 0) {
      warnings.push(
        'Plywood is the recommended material for climbing walls due to strength and durability.'
      );
    }
  }

  /**
   * Validate load distribution
   */
  private static validateLoadDistribution(
    wall: ClimbingWall,
    warnings: string[],
    recommendations: string[]
  ): void {
    const { estimatedLoad } = wall;

    if (estimatedLoad.distributedLoad > 250) {
      warnings.push(
        `High distributed load (${estimatedLoad.distributedLoad.toFixed(2)} kg/m²). ` +
        'Verify structure can support this load.'
      );
    }

    // Check point load distribution
    if (estimatedLoad.pointLoads.length > 0) {
      const maxPointLoad = Math.max(...estimatedLoad.pointLoads.map(pl => pl.load));
      const minPointLoad = Math.min(...estimatedLoad.pointLoads.map(pl => pl.load));
      const variance = (maxPointLoad - minPointLoad) / minPointLoad;

      if (variance > 0.5) {
        warnings.push(
          'Significant load imbalance between anchor points. ' +
          'Consider redistributing anchors for more even load distribution.'
        );
      }
    }

    recommendations.push(
      'Consider using crash pads or safety mats below the wall, especially for bouldering heights (< 4.5m).'
    );

    if (wall.dimensions.height > 4.5) {
      recommendations.push(
        'Wall height exceeds bouldering range. Install rope anchors and use proper climbing safety equipment.'
      );
    }
  }

  /**
   * Calculate maximum spacing between anchors
   */
  private static calculateMaxAnchorSpacing(anchors: any[]): number {
    let maxSpacing = 0;

    for (let i = 0; i < anchors.length; i++) {
      for (let j = i + 1; j < anchors.length; j++) {
        const dx = anchors[i].position.x - anchors[j].position.x;
        const dy = anchors[i].position.y - anchors[j].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxSpacing && distance < 3.0) {
          maxSpacing = distance;
        }
      }
    }

    return maxSpacing;
  }

  /**
   * Check if anchors are placed near edges
   */
  private static checkEdgeAnchors(wall: ClimbingWall): boolean {
    const margin = 0.3; // 30cm from edge
    const { width, height } = wall.dimensions;
    const { anchors } = wall;

    const hasTopEdge = anchors.some(a => a.position.y > height - margin);
    const hasBottomEdge = anchors.some(a => a.position.y < margin);
    const hasLeftEdge = anchors.some(a => a.position.x < margin);
    const hasRightEdge = anchors.some(a => a.position.x > width - margin);

    return hasTopEdge && hasBottomEdge && hasLeftEdge && hasRightEdge;
  }

  /**
   * Validate structure suitability
   */
  static validateStructure(structure: Structure): SafetyValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Material-specific checks
    switch (structure.material.type) {
      case 'wood_frame':
        warnings.push(
          'Wood frame structures require anchors to be attached to studs or blocking, ' +
          'not just drywall or sheathing.'
        );
        recommendations.push(
          'Use a stud finder to locate framing members. ' +
          'Consider adding blocking between studs for additional anchor points.'
        );
        break;

      case 'brick':
        warnings.push(
          'Brick walls require special masonry anchors. Ensure anchors are rated for brick.'
        );
        recommendations.push(
          'Avoid mortar joints for anchor placement. Drill into brick units directly.'
        );
        break;

      case 'cmu':
        warnings.push(
          'CMU (concrete block) walls should use anchors designed for hollow core masonry.'
        );
        recommendations.push(
          'Consider filling CMU cores with concrete at anchor locations for maximum strength.'
        );
        break;
    }

    // Load capacity checks
    if (structure.loadCapacity.maxPointLoad < 500) {
      warnings.push(
        'Structure has relatively low point load capacity. ' +
        'Distribute loads across more anchor points.'
      );
    }

    if (structure.loadCapacity.safetyFactor < 2.5) {
      errors.push(
        `Safety factor (${structure.loadCapacity.safetyFactor}) is below minimum 2.5 for climbing structures.`
      );
    }

    recommendations.push(
      'Have a structural engineer verify load capacity before installation.'
    );

    recommendations.push(
      'Inspect all connections and fasteners regularly (at least annually).'
    );

    return {
      safe: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }
}

export interface SafetyValidation {
  safe: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}
