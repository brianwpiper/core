import * as THREE from 'three';
import { ClimbingWall, Panel, Anchor } from '../src/models/ClimbingWall';
import { Structure } from '../src/models/Structure';
import { StructuralAnalyzer } from '../src/analysis/StructuralAnalyzer';
import { WallFitter, WallRequirements } from '../src/design/WallFitter';
import { SafetyValidator } from '../src/validation/SafetyValidator';
import { Scene3D } from '../src/visualization/Scene3D';

// Current design state
let currentWall: ClimbingWall | null = null;
let currentStructure: Structure | null = null;
let currentScene: Scene3D | null = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  // Design button
  const btnDesign = document.getElementById('btn-design') as HTMLButtonElement;
  btnDesign.addEventListener('click', handleDesign);

  // Fit button
  const btnFit = document.getElementById('btn-fit') as HTMLButtonElement;
  btnFit.addEventListener('click', handleFit);

  // Export buttons
  const btnExportJson = document.getElementById('btn-export-json') as HTMLButtonElement;
  btnExportJson?.addEventListener('click', handleExportJson);

  const btnExportScene = document.getElementById('btn-export-scene') as HTMLButtonElement;
  btnExportScene?.addEventListener('click', handleExportScene);

  const btnDownloadImage = document.getElementById('btn-download-image') as HTMLButtonElement;
  btnDownloadImage?.addEventListener('click', handleDownloadImage);
}

function handleDesign() {
  const width = parseFloat((document.getElementById('wall-width') as HTMLInputElement).value);
  const height = parseFloat((document.getElementById('wall-height') as HTMLInputElement).value);
  const angle = parseFloat((document.getElementById('wall-angle') as HTMLInputElement).value);
  const difficulty = parseInt((document.getElementById('wall-difficulty') as HTMLSelectElement).value);

  // Generate wall design
  currentWall = createWallDesign(width, height, angle, difficulty);

  // Analyze and display results
  displayResults(currentWall, null);
}

function handleFit() {
  const structWidth = parseFloat((document.getElementById('struct-width') as HTMLInputElement).value);
  const structHeight = parseFloat((document.getElementById('struct-height') as HTMLInputElement).value);
  const structDepth = parseFloat((document.getElementById('struct-depth') as HTMLInputElement).value);
  const material = (document.getElementById('struct-material') as HTMLSelectElement).value;

  const wallWidth = parseFloat((document.getElementById('wall-width') as HTMLInputElement).value);
  const wallHeight = parseFloat((document.getElementById('wall-height') as HTMLInputElement).value);
  const difficulty = parseInt((document.getElementById('wall-difficulty') as HTMLSelectElement).value);

  // Create structure
  currentStructure = createStructure(structWidth, structHeight, structDepth, material);

  // Define requirements
  const requirements: WallRequirements = {
    minWidth: Math.max(2, wallWidth - 1),
    maxWidth: Math.min(wallWidth + 1, structWidth),
    minHeight: Math.max(2.5, wallHeight - 1),
    maxHeight: Math.min(wallHeight + 1, structHeight),
    difficulty,
    allowedAngles: [0, 5, 10, 15],
  };

  // Find best fit
  const fitResults = WallFitter.findSuitableWalls(currentStructure, requirements);

  if (fitResults.length > 0) {
    currentWall = fitResults[0].wall;
    displayResults(currentWall, currentStructure);
  } else {
    alert('No suitable wall placements found. Try adjusting dimensions or structure properties.');
  }
}

function displayResults(wall: ClimbingWall, structure: Structure | null) {
  // Show results section
  const resultsSection = document.getElementById('results-section') as HTMLElement;
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth' });

  // Display wall info
  displayWallInfo(wall);

  // Display load analysis
  const loadEstimate = StructuralAnalyzer.calculateLoadEstimate(wall);
  displayLoadAnalysis(loadEstimate);

  // Display anchor recommendations
  const anchorRec = StructuralAnalyzer.recommendAnchorPlacement(wall);
  displayAnchorRecommendations(anchorRec);

  // Display safety validation
  const safetyValidation = SafetyValidator.validateDesign(wall);
  displaySafetyValidation(safetyValidation);

  // Validate against structure if provided
  if (structure) {
    const structValidation = StructuralAnalyzer.validateStructuralCapacity(wall, structure);
    displayStructuralValidation(structValidation);
  }

  // Render 3D visualization
  render3DVisualization(wall, structure);
}

function displayWallInfo(wall: ClimbingWall) {
  const container = document.getElementById('wall-info') as HTMLElement;
  container.innerHTML = `
    <div class="info-item">
      <span class="label">Dimensions</span>
      <span class="value">${wall.dimensions.width.toFixed(1)}m × ${wall.dimensions.height.toFixed(1)}m</span>
    </div>
    <div class="info-item">
      <span class="label">Angle</span>
      <span class="value">${wall.angle}°</span>
    </div>
    <div class="info-item">
      <span class="label">Panels</span>
      <span class="value">${wall.panels.length}</span>
    </div>
    <div class="info-item">
      <span class="label">Anchors</span>
      <span class="value">${wall.anchors.length}</span>
    </div>
    <div class="info-item">
      <span class="label">Total Weight</span>
      <span class="value">${wall.totalWeight.toFixed(1)} kg</span>
    </div>
    <div class="info-item">
      <span class="label">Area</span>
      <span class="value">${(wall.dimensions.width * wall.dimensions.height).toFixed(1)} m²</span>
    </div>
  `;
}

function displayLoadAnalysis(loadEstimate: any) {
  const container = document.getElementById('load-analysis') as HTMLElement;
  container.innerHTML = `
    <div class="info-item">
      <span class="label">Static Load</span>
      <span class="value">${loadEstimate.staticLoad.toFixed(1)} kg</span>
    </div>
    <div class="info-item">
      <span class="label">Dynamic Load</span>
      <span class="value">${loadEstimate.dynamicLoad.toFixed(1)} kg</span>
    </div>
    <div class="info-item">
      <span class="label">Total Load</span>
      <span class="value">${loadEstimate.totalLoad.toFixed(1)} kg</span>
    </div>
    <div class="info-item">
      <span class="label">Distributed Load</span>
      <span class="value">${loadEstimate.distributedLoad.toFixed(1)} kg/m²</span>
    </div>
  `;
}

function displayAnchorRecommendations(anchorRec: any) {
  const container = document.getElementById('anchor-recommendations') as HTMLElement;
  container.innerHTML = `
    <div class="info-item">
      <span class="label">Minimum Anchors</span>
      <span class="value">${anchorRec.minimumAnchors}</span>
    </div>
    <div class="info-item">
      <span class="label">Recommended Anchors</span>
      <span class="value">${anchorRec.recommendedAnchors}</span>
    </div>
    <div class="info-item">
      <span class="label">Horizontal Spacing</span>
      <span class="value">${anchorRec.horizontalSpacing.toFixed(2)} m</span>
    </div>
    <div class="info-item">
      <span class="label">Vertical Spacing</span>
      <span class="value">${anchorRec.verticalSpacing.toFixed(2)} m</span>
    </div>
    <div class="info-item" style="grid-column: 1 / -1;">
      <span class="label">Anchor Type</span>
      <span class="value">${anchorRec.anchorType}</span>
    </div>
  `;
}

function displaySafetyValidation(validation: any) {
  const container = document.getElementById('safety-validation') as HTMLElement;
  let html = '';

  if (validation.safe) {
    html += `<div class="validation-message success">✓ Design passes safety validation</div>`;
  } else {
    html += `<div class="validation-message error">✗ Design has safety issues</div>`;
  }

  validation.errors.forEach((error: string) => {
    html += `<div class="validation-message error">❌ ${error}</div>`;
  });

  validation.warnings.forEach((warning: string) => {
    html += `<div class="validation-message warning">⚠️ ${warning}</div>`;
  });

  validation.recommendations.forEach((rec: string) => {
    html += `<div class="validation-message info">💡 ${rec}</div>`;
  });

  container.innerHTML = html;
}

function displayStructuralValidation(validation: any) {
  const container = document.getElementById('safety-validation') as HTMLElement;
  let html = container.innerHTML;

  if (validation.valid) {
    html += `<div class="validation-message success">✓ Structure can support this wall</div>`;
  } else {
    html += `<div class="validation-message error">✗ Structure cannot support this wall</div>`;
  }

  validation.errors.forEach((error: string) => {
    html += `<div class="validation-message error">❌ ${error}</div>`;
  });

  validation.warnings.forEach((warning: string) => {
    html += `<div class="validation-message warning">⚠️ ${warning}</div>`;
  });

  container.innerHTML = html;
}

function render3DVisualization(wall: ClimbingWall, structure: Structure | null) {
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement;
  const scene = new Scene3D();
  currentScene = scene;

  // Create renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true, // Needed for image export
  });
  renderer.setSize(800, 600);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Add structure if provided
  if (structure) {
    scene.addStructure(structure);
  }

  // Add climbing wall
  scene.addClimbingWall(wall);

  // Render the scene
  renderer.render(scene.getScene(), scene.getCamera());
}

function createWallDesign(
  width: number,
  height: number,
  angle: number,
  difficulty: number
): ClimbingWall {
  const wallId = `wall-${Date.now()}`;
  const panelWidth = 1.22;
  const panelHeight = 2.44;

  const panels: Panel[] = [];
  const numPanelsX = Math.ceil(width / panelWidth);
  const numPanelsY = Math.ceil(height / panelHeight);

  for (let y = 0; y < numPanelsY; y++) {
    for (let x = 0; x < numPanelsX; x++) {
      panels.push({
        id: `panel-${x}-${y}`,
        position: { x: x * panelWidth, y: y * panelHeight, z: 0 },
        dimensions: { width: panelWidth, height: panelHeight, thickness: 0.02 },
        material: 'plywood' as const,
        weight: panelWidth * panelHeight * 0.02 * 550,
        tNutSpacing: 20,
      });
    }
  }

  const anchors: Anchor[] = [];
  const spacing = 1.2;
  const numAnchorsX = Math.ceil(width / spacing) + 1;
  const numAnchorsY = Math.ceil(height / spacing) + 1;

  for (let y = 0; y < numAnchorsY; y++) {
    for (let x = 0; x < numAnchorsX; x++) {
      anchors.push({
        id: `anchor-${x}-${y}`,
        position: {
          x: (x * width) / (numAnchorsX - 1),
          y: (y * height) / (numAnchorsY - 1),
          z: -0.05,
        },
        type: 'lag_screw' as const,
        loadRating: 450,
      });
    }
  }

  const wall: ClimbingWall = {
    id: wallId,
    name: 'Custom Climbing Wall',
    dimensions: { width, height },
    angle,
    thickness: 0.02,
    panels,
    holds: [],
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

  wall.estimatedLoad = StructuralAnalyzer.calculateLoadEstimate(wall);
  wall.totalWeight = wall.estimatedLoad.staticLoad;

  return wall;
}

function createStructure(
  width: number,
  height: number,
  depth: number,
  material: string
): Structure {
  const materialProps = getMaterialProperties(material);

  const walls = [
    {
      id: 'wall-north',
      position: { x: 0, y: 0, z: 0 },
      normal: { x: 0, y: 0, z: 1 },
      dimensions: { width, height },
      material: material as any,
      existingAttachments: [],
    },
  ];

  return {
    id: `structure-${Date.now()}`,
    name: 'Building Structure',
    dimensions: { width, height, depth },
    walls,
    material: materialProps,
    loadCapacity: {
      maxPointLoad: materialProps.compressiveStrength * 1000,
      maxDistributedLoad: materialProps.compressiveStrength * 100,
      safetyFactor: 3.0,
    },
  };
}

function getMaterialProperties(material: string): any {
  const props: Record<string, any> = {
    concrete: { type: 'concrete', thickness: 0.2, density: 2400, compressiveStrength: 25 },
    brick: { type: 'brick', thickness: 0.1, density: 1800, compressiveStrength: 10 },
    wood_frame: { type: 'wood_frame', thickness: 0.15, density: 600, compressiveStrength: 8 },
    steel_frame: { type: 'steel_frame', thickness: 0.1, density: 7850, compressiveStrength: 250 },
    cmu: { type: 'cmu', thickness: 0.2, density: 1900, compressiveStrength: 12 },
  };
  return props[material] || props.concrete;
}

function handleExportJson() {
  if (!currentWall) return;

  const data = {
    wall: currentWall,
    structure: currentStructure,
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `climbing-wall-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleExportScene() {
  if (!currentScene) return;

  const sceneData = currentScene.exportScene();
  const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scene-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleDownloadImage() {
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement;
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `climbing-wall-3d-${Date.now()}.png`;
  a.click();
}
