import { areEqual } from './utils';

// Type definitions
type ColorPalette = Array<{h: number, s: number, l: number, id: number}>;
type CanvasColors = Record<string, number>;
type History = {
  cursor: number;
  versions: CanvasColors[];
};
type Step = "configuring" | "painting";

// Default values
const defaultSelectedColorID = () => 0;
const defaultColorPalette = () => ([
  // Red
  {h: 0, s:100, l:50, id: 0},
  // Orange
  {h: 30, s:100, l:50, id: 1},
  // Yellow
  {h: 60, s:100, l:50, id: 2},
  // Green
  {h: 120, s:100, l:40, id: 3},
  // Cyan
  {h: 180, s:100, l:45, id: 4},
  // Blue
  {h: 240, s:100, l:50, id: 5},
  // Indigo
  {h: 275, s:100, l:35, id: 6},
  // Violet/Purple
  {h: 300, s:100, l:40, id: 7},
  // Pink
  {h: 330, s:100, l:60, id: 8},
  // Brown
  {h: 25, s:70, l:35, id: 9},
  // Black
  {h: 0, s:0, l:10, id: 10},
  // White
  {h: 0, s:0, l:100, id: 11},
]);
const defaultCanvas = () => ({});
const defaultHistory = () => ({cursor: 0, versions:[defaultCanvas()]});

// Store class using Svelte 5 runes with getter/setter pattern
export class BeadsStore {
  // Private state
  #_step = $state<Step>("configuring");
  #_selectedColorId = $state(defaultSelectedColorID());
  #_colorPalette = $state(defaultColorPalette());
  #_canvasColors = $state(defaultCanvas());
  #_history = $state<History>(defaultHistory());
  #_isStaggered = $state(true);
  #_handMode = $state(false);
  
  // Add zoom-related states
  #_isPanning = $state(false);
  #_startX = $state(0);
  #_startY = $state(0);
  #_viewBoxX = $state(0);
  #_viewBoxY = $state(0);
  #_zoomLevel = $state(1.0);
  #_panSensitivity = $state(0.2);

  // Getters
  get step(): Step { return this.#_step; }
  get selectedColorId() { return this.#_selectedColorId; }
  get colorPalette() { return this.#_colorPalette; }
  get canvasColors() { return this.#_canvasColors; }
  get history() { return this.#_history; }
  get isStaggered() { return this.#_isStaggered; }
  get handMode() { return this.#_handMode; }

  // Setters
  set step(value: Step) {
    this.#_step = value;
  }
  
  set selectedColorId(value: number) {
    this.#_selectedColorId = value;
  }
  
  set colorPalette(value: ColorPalette) {
    this.#_colorPalette = value;
  }
  
  set canvasColors(value: CanvasColors) {
    this.#_canvasColors = value;
  }
  
  set history(value: History) {
    this.#_history = value;
  }

  set isStaggered(value: boolean) { this.#_isStaggered = value; }
  
  set handMode(value: boolean) { this.#_handMode = value; }

  // Step actions
  setStepPainting() {
    this.step = "painting";
  }

  setStepConfiguring() {
    this.step = "configuring";
  }

  // Reset actions
  resetSelectedColorId() {
    this.selectedColorId = defaultSelectedColorID();
  }

  resetColorPalette() {
    this.colorPalette = defaultColorPalette();
  }

  resetCanvasColors() {
    this.canvasColors = defaultCanvas();
  }

  resetHistory() {
    this.history = defaultHistory();
  }

  // History actions
  commitToHistory(newData: CanvasColors) {
    const currentVersion = this.history.versions[this.history.cursor];
    const newCanvas = {...currentVersion, ...newData};
    
    if(areEqual(currentVersion, newCanvas)) return;
    
    this.history = {
      cursor: this.history.cursor + 1, 
      versions: [...this.history.versions.slice(0, this.history.cursor + 1), newCanvas]
    };
  }

  undoHistory() {
    if (this.history.cursor === 0) return;
    this.history = {...this.history, cursor: this.history.cursor - 1};
  }

  redoHistory() {
    if (this.history.cursor === this.history.versions.length - 1) return;
    this.history = {...this.history, cursor: this.history.cursor + 1};
  }

  // Full reset
  resetAll() {
    this.resetColorPalette();
    this.resetCanvasColors();
    this.resetSelectedColorId();
    this.resetHistory();
  }

  // Toggle methods
  toggleStaggered() {
    this.isStaggered = !this.isStaggered;
  }
  
  toggleHandMode() {
    this.handMode = !this.handMode;
  }

  // Add zoom-related getters
  get isPanning() { return this.#_isPanning; }
  get startX() { return this.#_startX; }
  get startY() { return this.#_startY; }
  get viewBoxX() { return this.#_viewBoxX; }
  get viewBoxY() { return this.#_viewBoxY; }
  get zoomLevel() { return this.#_zoomLevel; }
  get panSensitivity() { return this.#_panSensitivity; }

  // Add zoom-related setters
  set isPanning(value: boolean) { this.#_isPanning = value; }
  set startX(value: number) { this.#_startX = value; }
  set startY(value: number) { this.#_startY = value; }
  set viewBoxX(value: number) { this.#_viewBoxX = value; }
  set viewBoxY(value: number) { this.#_viewBoxY = value; }
  set zoomLevel(value: number) { this.#_zoomLevel = value; }
  set panSensitivity(value: number) { this.#_panSensitivity = value; }

  // Reset view method
  resetView() {
    this.viewBoxX = 0;
    this.viewBoxY = 0;
    this.zoomLevel = 1.0;
  }
}

// Create singleton instance
export const beadsStore = new BeadsStore();