/**
 * Empty Template Schema — Config variables for Empty Base template
 * Self-contained; no imports. Loaded by config when SCENE_TEMPLATE === 'empty'
 */

export const EMPTY_SCHEMA = [
  { category: 'TEMPLATE', name: 'SCENE_TEMPLATE', type: 'string', value: 'empty' },
  { category: 'TEMPLATE', name: 'PROJECT_NAME', type: 'string', value: 'MyProject' },
  { category: 'TEMPLATE', name: 'EMPTY_SCENE_WIDTH', type: 'number', value: 256, min: 32, max: 1024, step: 32 },
  { category: 'TEMPLATE', name: 'EMPTY_SCENE_LENGTH', type: 'number', value: 256, min: 32, max: 1024, step: 32 },
  { category: 'MAP', name: 'MOUSE_SENSITIVITY', type: 'number', value: 0.0002, min: 0.0001, max: 0.01, step: 0.0001 },
];
