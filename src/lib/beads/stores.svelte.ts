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
  {h: 175, s:65, l:35, id: 0},
  {h: 150, s:74, l:72, id: 1},
  {h: 50, s:91, l:70, id: 2},
  {h: 11, s:100, l:85, id: 3},
  {h: 16, s:95, l:65, id: 4},
  {h: 0, s:100, l:100, id: 5},
  {h: 0, s:100, l:100, id: 6},
  {h: 0, s:100, l:100, id: 7},
  {h: 0, s:100, l:100, id: 8},
  {h: 0, s:100, l:100, id: 9},
  {h: 0, s:100, l:100, id: 10},
  {h: 0, s:100, l:100, id: 11},
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
  #_isStaggered = $state(true); // Default to staggered layout

  // Getters
  get step(): Step { return this.#_step; }
  get selectedColorId() { return this.#_selectedColorId; }
  get colorPalette() { return this.#_colorPalette; }
  get canvasColors() { return this.#_canvasColors; }
  get history() { return this.#_history; }
  get isStaggered() { return this.#_isStaggered; }

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

  // Add toggle method
  toggleStaggered() {
    this.isStaggered = !this.isStaggered;
  }
}

// Create singleton instance
export const beadsStore = new BeadsStore(); 