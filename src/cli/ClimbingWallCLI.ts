import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Structure, StructureWall, Vector3D } from '../models/Structure.js';
import { ClimbingWall, Panel, Anchor } from '../models/ClimbingWall.js';
import { StructuralAnalyzer } from '../analysis/StructuralAnalyzer.js';
import { WallFitter, WallRequirements } from '../design/WallFitter.js';
import { Scene3D } from '../visualization/Scene3D.js';
import * as fs from 'fs';
import * as path from 'path';

export class ClimbingWallCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('climbing-wall-designer')
      .description('Design climbing walls and fit them into existing structures')
      .version('1.0.0');

    this.program
      .command('design')
      .description('Interactive climbing wall design wizard')
      .action(() => this.runDesignWizard());

    this.program
      .command('analyze <wallFile>')
      .description('Analyze structural requirements for a wall design')
      .action((wallFile) => this.analyzeWall(wallFile));

    this.program
      .command('fit')
      .description('Find suitable wall placements in a structure')
      .action(() => this.runFitWizard());

    this.program
      .command('export <designFile>')
      .description('Export a design to 3D format')
      .option('-f, --format <format>', 'Export format (json, obj)', 'json')
      .action((designFile, options) => this.exportDesign(designFile, options));

    this.program
      .command('example')
      .description('Generate example structure and wall designs')
      .action(() => this.generateExamples());
  }

  async run(args: string[]): Promise<void> {
    await this.program.parseAsync(args);
  }

  private async runDesignWizard(): Promise<void> {
    console.log(chalk.blue.bold('\n🧗 Climbing Wall Design Wizard\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'width',
        message: 'Wall width (meters):',
        default: '4.0',
        validate: (input) => {
          const num = parseFloat(input);
          return num > 0 && num < 20 ? true : 'Please enter a valid width (0-20m)';
        },
      },
      {
        type: 'input',
        name: 'height',
        message: 'Wall height (meters):',
        default: '4.0',
        validate: (input) => {
          const num = parseFloat(input);
          return num > 0 && num < 15 ? true : 'Please enter a valid height (0-15m)';
        },
      },
      {
        type: 'input',
        name: 'angle',
        message: 'Wall angle (degrees from vertical, 0=vertical, positive=overhang):',
        default: '0',
        validate: (input) => {
          const num = parseFloat(input);
          return num >= -15 && num <= 45 ? true : 'Please enter angle between -15 and 45 degrees';
        },
      },
      {
        type: 'list',
        name: 'difficulty',
        message: 'Climbing difficulty:',
        choices: [
          { name: 'Beginner (1-3)', value: 2 },
          { name: 'Intermediate (4-6)', value: 5 },
          { name: 'Advanced (7-8)', value: 7 },
          { name: 'Expert (9-10)', value: 9 },
        ],
      },
    ]);

    const wall = this.createBasicWall(
      parseFloat(answers.width),
      parseFloat(answers.height),
      parseFloat(answers.angle),
      answers.difficulty
    );

    console.log(chalk.green('\n✓ Wall design created successfully!\n'));
    this.displayWallInfo(wall);

    const loadEstimate = StructuralAnalyzer.calculateLoadEstimate(wall);
    console.log(chalk.yellow('\n📊 Load Analysis:\n'));
    console.log(`  Static Load:      ${loadEstimate.staticLoad.toFixed(2)} kg`);
    console.log(`  Dynamic Load:     ${loadEstimate.dynamicLoad.toFixed(2)} kg`);
    console.log(`  Total Load:       ${loadEstimate.totalLoad.toFixed(2)} kg`);
    console.log(`  Distributed Load: ${loadEstimate.distributedLoad.toFixed(2)} kg/m²`);

    const anchorRec = StructuralAnalyzer.recommendAnchorPlacement(wall);
    console.log(chalk.cyan('\n⚓ Anchor Recommendations:\n'));
    console.log(`  Minimum Anchors:     ${anchorRec.minimumAnchors}`);
    console.log(`  Recommended Anchors: ${anchorRec.recommendedAnchors}`);
    console.log(`  Horizontal Spacing:  ${anchorRec.horizontalSpacing.toFixed(2)} m`);
    console.log(`  Vertical Spacing:    ${anchorRec.verticalSpacing.toFixed(2)} m`);
    console.log(`  Anchor Type:         ${anchorRec.anchorType}`);

    const saveAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'save',
        message: 'Save this design?',
        default: true,
      },
    ]);

    if (saveAnswer.save) {
      const filename = `wall-design-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(wall, null, 2));
      console.log(chalk.green(`\n✓ Design saved to ${filename}\n`));
    }
  }

  private async runFitWizard(): Promise<void> {
    console.log(chalk.blue.bold('\n🏗️  Wall Fitting Wizard\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'structureWidth',
        message: 'Structure width (meters):',
        default: '10.0',
      },
      {
        type: 'input',
        name: 'structureHeight',
        message: 'Structure height (meters):',
        default: '5.0',
      },
      {
        type: 'input',
        name: 'structureDepth',
        message: 'Structure depth (meters):',
        default: '8.0',
      },
      {
        type: 'list',
        name: 'material',
        message: 'Wall material:',
        choices: [
          { name: 'Concrete', value: 'concrete' },
          { name: 'Brick', value: 'brick' },
          { name: 'Wood Frame', value: 'wood_frame' },
          { name: 'Steel Frame', value: 'steel_frame' },
          { name: 'CMU (Concrete Masonry Unit)', value: 'cmu' },
        ],
      },
      {
        type: 'input',
        name: 'minWidth',
        message: 'Minimum climbing wall width (meters):',
        default: '3.0',
      },
      {
        type: 'input',
        name: 'maxWidth',
        message: 'Maximum climbing wall width (meters):',
        default: '6.0',
      },
      {
        type: 'input',
        name: 'minHeight',
        message: 'Minimum climbing wall height (meters):',
        default: '3.0',
      },
      {
        type: 'input',
        name: 'maxHeight',
        message: 'Maximum climbing wall height (meters):',
        default: '5.0',
      },
    ]);

    const structure = this.createStructure(
      parseFloat(answers.structureWidth),
      parseFloat(answers.structureHeight),
      parseFloat(answers.structureDepth),
      answers.material
    );

    const requirements: WallRequirements = {
      minWidth: parseFloat(answers.minWidth),
      maxWidth: parseFloat(answers.maxWidth),
      minHeight: parseFloat(answers.minHeight),
      maxHeight: parseFloat(answers.maxHeight),
      difficulty: 5,
      allowedAngles: [0, 5, 10, 15],
    };

    console.log(chalk.yellow('\n🔍 Finding suitable wall placements...\n'));

    const fitResults = WallFitter.findSuitableWalls(structure, requirements);

    if (fitResults.length === 0) {
      console.log(chalk.red('No suitable wall placements found.'));
      return;
    }

    console.log(chalk.green(`\n✓ Found ${fitResults.length} possible placements:\n`));

    fitResults.slice(0, 5).forEach((result, index) => {
      console.log(chalk.bold(`\nOption ${index + 1} (Score: ${result.fitnessScore.toFixed(1)})`));
      console.log(`  Dimensions: ${result.wall.dimensions.width.toFixed(2)}m × ${result.wall.dimensions.height.toFixed(2)}m`);
      console.log(`  Angle: ${result.wall.angle}°`);
      console.log(`  Valid: ${result.validation.valid ? chalk.green('Yes') : chalk.red('No')}`);

      if (result.validation.errors.length > 0) {
        console.log(chalk.red('  Errors:'));
        result.validation.errors.forEach((err: string) => {
          console.log(chalk.red(`    - ${err}`));
        });
      }

      if (result.validation.warnings.length > 0) {
        console.log(chalk.yellow('  Warnings:'));
        result.validation.warnings.forEach((warn: string) => {
          console.log(chalk.yellow(`    - ${warn}`));
        });
      }
    });

    const saveAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: 'Select a design to save:',
        choices: [
          ...fitResults.slice(0, 5).map((_, index) => ({
            name: `Option ${index + 1}`,
            value: index,
          })),
          { name: 'None', value: -1 },
        ],
      },
    ]);

    if (saveAnswer.option >= 0) {
      const selectedResult = fitResults[saveAnswer.option];
      const filename = `fitted-wall-${Date.now()}.json`;
      fs.writeFileSync(
        filename,
        JSON.stringify({
          wall: selectedResult.wall,
          structure: structure,
          validation: selectedResult.validation,
        }, null, 2)
      );
      console.log(chalk.green(`\n✓ Design saved to ${filename}\n`));
    }
  }

  private analyzeWall(wallFile: string): void {
    console.log(chalk.blue.bold('\n🔬 Structural Analysis\n'));

    if (!fs.existsSync(wallFile)) {
      console.log(chalk.red(`Error: File not found: ${wallFile}`));
      return;
    }

    const wall: ClimbingWall = JSON.parse(fs.readFileSync(wallFile, 'utf-8'));
    this.displayWallInfo(wall);

    const loadEstimate = StructuralAnalyzer.calculateLoadEstimate(wall);
    console.log(chalk.yellow('\n📊 Load Analysis:\n'));
    console.log(`  Static Load:      ${loadEstimate.staticLoad.toFixed(2)} kg`);
    console.log(`  Dynamic Load:     ${loadEstimate.dynamicLoad.toFixed(2)} kg`);
    console.log(`  Total Load:       ${loadEstimate.totalLoad.toFixed(2)} kg`);
    console.log(`  Distributed Load: ${loadEstimate.distributedLoad.toFixed(2)} kg/m²\n`);

    const anchorRec = StructuralAnalyzer.recommendAnchorPlacement(wall);
    console.log(chalk.cyan('⚓ Anchor Recommendations:\n'));
    console.log(`  Minimum Anchors:     ${anchorRec.minimumAnchors}`);
    console.log(`  Recommended Anchors: ${anchorRec.recommendedAnchors}`);
    console.log(`  Horizontal Spacing:  ${anchorRec.horizontalSpacing.toFixed(2)} m`);
    console.log(`  Vertical Spacing:    ${anchorRec.verticalSpacing.toFixed(2)} m`);
    console.log(`  Anchor Type:         ${anchorRec.anchorType}\n`);
  }

  private exportDesign(designFile: string, options: any): void {
    console.log(chalk.blue.bold('\n📦 Exporting Design\n'));

    if (!fs.existsSync(designFile)) {
      console.log(chalk.red(`Error: File not found: ${designFile}`));
      return;
    }

    const data = JSON.parse(fs.readFileSync(designFile, 'utf-8'));
    const wall: ClimbingWall = data.wall || data;

    const scene = new Scene3D();
    scene.addClimbingWall(wall);

    if (data.structure) {
      scene.addStructure(data.structure);
    }

    const exportData = scene.exportScene();
    const outputFile = designFile.replace('.json', `-export.${options.format}`);

    fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
    console.log(chalk.green(`✓ Design exported to ${outputFile}\n`));
  }

  private generateExamples(): void {
    console.log(chalk.blue.bold('\n📝 Generating Examples\n'));

    const exampleWall = this.createBasicWall(4.0, 4.5, 5, 5);
    fs.writeFileSync('example-wall.json', JSON.stringify(exampleWall, null, 2));
    console.log(chalk.green('✓ Created example-wall.json'));

    const exampleStructure = this.createStructure(10, 5, 8, 'concrete');
    fs.writeFileSync('example-structure.json', JSON.stringify(exampleStructure, null, 2));
    console.log(chalk.green('✓ Created example-structure.json'));

    console.log(chalk.cyan('\nUse these files with:'));
    console.log('  npm run dev analyze example-wall.json');
    console.log('  npm run dev export example-wall.json\n');
  }

  private createBasicWall(
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

  private createStructure(
    width: number,
    height: number,
    depth: number,
    material: string
  ): Structure {
    const materialProps = this.getMaterialProperties(material);

    const walls: StructureWall[] = [
      {
        id: 'wall-north',
        position: { x: 0, y: 0, z: 0 },
        normal: { x: 0, y: 0, z: 1 },
        dimensions: { width, height },
        material: material as any,
        existingAttachments: [],
      },
      {
        id: 'wall-south',
        position: { x: 0, y: 0, z: depth },
        normal: { x: 0, y: 0, z: -1 },
        dimensions: { width, height },
        material: material as any,
        existingAttachments: [],
      },
      {
        id: 'wall-east',
        position: { x: width, y: 0, z: 0 },
        normal: { x: -1, y: 0, z: 0 },
        dimensions: { width: depth, height },
        material: material as any,
        existingAttachments: [],
      },
      {
        id: 'wall-west',
        position: { x: 0, y: 0, z: 0 },
        normal: { x: 1, y: 0, z: 0 },
        dimensions: { width: depth, height },
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

  private getMaterialProperties(material: string): any {
    const props: Record<string, any> = {
      concrete: {
        type: 'concrete',
        thickness: 0.2,
        density: 2400,
        compressiveStrength: 25,
      },
      brick: {
        type: 'brick',
        thickness: 0.1,
        density: 1800,
        compressiveStrength: 10,
      },
      wood_frame: {
        type: 'wood_frame',
        thickness: 0.15,
        density: 600,
        compressiveStrength: 8,
      },
      steel_frame: {
        type: 'steel_frame',
        thickness: 0.1,
        density: 7850,
        compressiveStrength: 250,
      },
      cmu: {
        type: 'cmu',
        thickness: 0.2,
        density: 1900,
        compressiveStrength: 12,
      },
    };

    return props[material] || props.concrete;
  }

  private displayWallInfo(wall: ClimbingWall): void {
    console.log(chalk.bold('Wall Details:'));
    console.log(`  ID:         ${wall.id}`);
    console.log(`  Dimensions: ${wall.dimensions.width}m × ${wall.dimensions.height}m`);
    console.log(`  Angle:      ${wall.angle}°`);
    console.log(`  Panels:     ${wall.panels.length}`);
    console.log(`  Anchors:    ${wall.anchors.length}`);
    console.log(`  Holds:      ${wall.holds.length}`);
  }
}
