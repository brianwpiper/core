# Climbing Wall Designer

A comprehensive tool for designing climbing walls and fitting them into existing structures with structural analysis and 3D visualization.

**Available as both a Web Application and CLI Tool**

## Features

- **Interactive Design Wizard**: Create custom climbing wall designs with guided prompts
- **Structural Analysis**: Calculate load requirements, anchor placement, and safety factors
- **Wall Fitting Algorithm**: Automatically find optimal placements within existing structures
- **3D Visualization**: Generate 3D models of climbing wall designs using Three.js
- **Safety Validation**: Comprehensive safety checks based on climbing wall engineering standards
- **Material Support**: Handle different wall materials (concrete, brick, wood frame, steel frame, CMU)
- **Export Capabilities**: Export designs to JSON and 3D formats

## Installation

```bash
# Install dependencies
npm install

# Build the CLI
npm run build

# Build the web application
npm run build:web
```

## Web Application

The easiest way to use the tool is through the interactive web interface.

### Running the Web App

```bash
# Development mode with hot reload
npm run dev:web

# Build for production
npm run build:web

# Preview production build
npm run preview
```

The web interface provides:
- 🎨 **Interactive Forms**: Design walls with real-time input validation
- 📊 **Live Analysis**: Instant structural analysis and safety checks
- 🖼️ **3D Visualization**: Rendered as static images you can download
- 💾 **Export Options**: Download designs as JSON or 3D scene data
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

### Web Interface Guide

1. **Design Tab**: Enter wall dimensions, angle, and difficulty
2. **Structure Tab**: Define your building's dimensions and material
3. **Generate**: Click "Generate Design" or "Find Best Fit"
4. **Review Results**: See load analysis, anchor recommendations, and safety validation
5. **Export**: Download your design or 3D visualization

## CLI Usage

### Interactive Design Wizard

Create a new climbing wall design interactively:

```bash
npm run dev design
```

The wizard will guide you through:
- Wall dimensions (width and height)
- Wall angle (vertical, overhang, slab)
- Climbing difficulty level
- Automatic structural analysis
- Anchor recommendations

### Wall Fitting

Find optimal climbing wall placements in an existing structure:

```bash
npm run dev fit
```

This command will:
- Gather structure dimensions and material properties
- Define climbing wall requirements
- Generate and evaluate multiple placement options
- Rank options by fitness score
- Validate structural capacity

### Structural Analysis

Analyze an existing wall design file:

```bash
npm run dev analyze <wall-file.json>
```

Provides:
- Static and dynamic load calculations
- Distributed load analysis
- Point load distribution
- Anchor placement recommendations
- Safety factor verification

### Export Designs

Export a design to 3D format:

```bash
npm run dev export <design-file.json> --format json
```

### Generate Examples

Create example files to get started:

```bash
npm run dev example
```

This generates:
- `example-wall.json`: Sample climbing wall design
- `example-structure.json`: Sample building structure

## Architecture

### Core Components

#### Models (`src/models/`)
- **Structure.ts**: Building structure data models with material properties and load capacities
- **ClimbingWall.ts**: Climbing wall design models including panels, holds, and anchors

#### Analysis (`src/analysis/`)
- **StructuralAnalyzer.ts**: Load calculations and structural validation
  - Static load: Wall weight
  - Dynamic load: Climber weight + impact forces (2.5x multiplier)
  - Point load distribution
  - Anchor recommendations

#### Design (`src/design/`)
- **WallFitter.ts**: Algorithm for fitting walls into structures
  - Multiple configuration generation
  - Fitness scoring
  - Structural validation
  - Position optimization

#### Visualization (`src/visualization/`)
- **Scene3D.ts**: Three.js-based 3D visualization
  - Structure rendering
  - Wall panel visualization
  - Hold placement display
  - Anchor point markers

#### Validation (`src/validation/`)
- **SafetyValidator.ts**: Safety compliance checking
  - Dimensional validation
  - Angle limits
  - Anchor spacing and capacity
  - Panel specifications
  - Load distribution

#### CLI (`src/cli/`)
- **ClimbingWallCLI.ts**: Command-line interface using Commander and Inquirer

## Engineering Standards

The application follows climbing wall engineering best practices:

### Safety Factors
- Minimum safety factor: 3.0 for all climbing structures
- Dynamic load multiplier: 2.5x for impact forces
- Conservative climber weight estimate: 90 kg

### Anchor Requirements
- Minimum: 0.5 anchors per m² of wall area
- Recommended: 0.67 anchors per m²
- Maximum spacing: 1.5m between anchors
- Typical load rating: 400-500 kg per anchor

### Panel Specifications
- Thickness: 18-25mm plywood (3/4" standard)
- Material: Plywood preferred for strength and durability
- T-nut spacing: 15-20cm grid for hold placement flexibility

### Dimensional Guidelines
- Minimum height: 2.5m for adequate climbing
- Maximum height without special engineering: 12m
- Angle limits: -15° (slab) to +45° (overhang)
- Optimal angle for overhangs: 0-30°

### Material Properties

The application includes accurate material properties:

| Material | Density (kg/m³) | Compressive Strength (MPa) | Typical Thickness |
|----------|----------------|---------------------------|-------------------|
| Concrete | 2400 | 25 | 200mm |
| Brick | 1800 | 10 | 100mm |
| Wood Frame | 600 | 8 | 150mm |
| Steel Frame | 7850 | 250 | 100mm |
| CMU | 1900 | 12 | 200mm |

## Design Workflow

### 1. Define Structure
```typescript
const structure = {
  dimensions: { width: 10, height: 5, depth: 8 },
  material: {
    type: 'concrete',
    thickness: 0.2,
    density: 2400,
    compressiveStrength: 25
  },
  loadCapacity: {
    maxPointLoad: 2000,
    maxDistributedLoad: 500,
    safetyFactor: 3.0
  }
};
```

### 2. Design Wall
```typescript
const wall = {
  dimensions: { width: 4.0, height: 4.5 },
  angle: 5, // 5° overhang
  panels: [...],
  anchors: [...],
  holds: [...]
};
```

### 3. Analyze Structure
```typescript
const loadEstimate = StructuralAnalyzer.calculateLoadEstimate(wall);
const validation = StructuralAnalyzer.validateStructuralCapacity(wall, structure);
```

### 4. Validate Safety
```typescript
const safety = SafetyValidator.validateDesign(wall);
if (!safety.safe) {
  console.error(safety.errors);
}
```

### 5. Visualize
```typescript
const scene = new Scene3D();
scene.addStructure(structure);
scene.addClimbingWall(wall);
const exportData = scene.exportScene();
```

## API Example

```typescript
import { StructuralAnalyzer } from './analysis/StructuralAnalyzer';
import { WallFitter } from './design/WallFitter';
import { SafetyValidator } from './validation/SafetyValidator';

// Find suitable placements
const requirements = {
  minWidth: 3.0,
  maxWidth: 6.0,
  minHeight: 3.0,
  maxHeight: 5.0,
  difficulty: 5,
  allowedAngles: [0, 5, 10, 15]
};

const fitResults = WallFitter.findSuitableWalls(structure, requirements);

// Analyze best fit
const bestFit = fitResults[0];
const loadEstimate = StructuralAnalyzer.calculateLoadEstimate(bestFit.wall);
const anchorRec = StructuralAnalyzer.recommendAnchorPlacement(bestFit.wall);
const safety = SafetyValidator.validateDesign(bestFit.wall);

console.log(`Total Load: ${loadEstimate.totalLoad} kg`);
console.log(`Recommended Anchors: ${anchorRec.recommendedAnchors}`);
console.log(`Safe: ${safety.safe}`);
```

## Important Safety Notes

⚠️ **DISCLAIMER**: This tool is for planning and design purposes only.

- **Professional Review Required**: All designs must be reviewed by a qualified structural engineer before construction
- **Local Building Codes**: Ensure compliance with local building codes and regulations
- **Professional Installation**: Climbing wall installation should be performed by qualified professionals
- **Regular Inspection**: Installed climbing walls require regular safety inspections (at least annually)
- **Liability**: Users assume all responsibility for the safety of climbing wall designs and installations

## Contributing

This is a functional climbing wall design tool with:
- ✅ Core structural analysis
- ✅ Wall fitting algorithm
- ✅ 3D visualization framework
- ✅ Safety validation
- ✅ CLI interface

Potential enhancements:
- Hold placement algorithms and route setting
- Advanced FEA (Finite Element Analysis)
- CAD file export (STL, DXF)
- Web interface with interactive 3D viewer
- Cost estimation
- Material procurement lists
- Installation instructions generation

## License

MIT License - See LICENSE file for details

## Technical Stack

- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 20+
- **3D Graphics**: Three.js
- **CLI**: Commander + Inquirer
- **Build**: TypeScript Compiler

## Development

```bash
# Run in development mode with auto-reload
npm run dev design

# Build for production
npm run build

# Run built version
npm start

# Run tests (when implemented)
npm test

# Lint code
npm run lint
```

## Project Structure

```
climbing-wall-designer/
├── src/
│   ├── models/           # Data models
│   │   ├── Structure.ts
│   │   └── ClimbingWall.ts
│   ├── analysis/         # Structural analysis
│   │   └── StructuralAnalyzer.ts
│   ├── design/           # Wall fitting algorithm
│   │   └── WallFitter.ts
│   ├── visualization/    # 3D visualization
│   │   └── Scene3D.ts
│   ├── validation/       # Safety validation
│   │   └── SafetyValidator.ts
│   ├── cli/             # Command-line interface
│   │   └── ClimbingWallCLI.ts
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## References

- Climbing Wall Industry standards (CWA, CWIF)
- ASTM F1772-19: Standard Practice for Safety at Indoor Climbing Facilities
- EN 12572: Artificial Climbing Structures - Safety Requirements and Test Methods
- Building codes and structural engineering standards

---

**Built for climbers, by developers** 🧗‍♀️
