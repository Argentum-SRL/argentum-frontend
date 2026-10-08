import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dump = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'legacy-shadows-dump.json'), 'utf8'));

// Classification categories
const categories = {
  MODAL_CONTAINER: [],      // Main dialog overlays, drawers, sheets -> Level 4 (--elevation-lg)
  INSIDE_MODAL_ELEMENT: [], // Inputs, flat cards, rows inside a modal -> Level 0 (--elevation-none) or Level 1 (--elevation-xs)
  DROPDOWN_POPOVER: [],     // Menus, selectors, datepickers, autocomplete -> Level 3 (--elevation-md)
  PAGE_CARD: [],            // Top-level cards and widgets on canvas -> Level 2 (--elevation-sm) or Level 0
  BUTTON_CONTROL: [],       // Buttons, pills, segment controls -> Level 1 (--elevation-xs) or none on flat
  TABS_SEGMENTED: [],       // Tabs, pill active states -> Level 1 (--elevation-xs)
  INPUT_FIELD: [],          // Inputs, search bars -> Level 0 (--elevation-none, borders used instead)
  NAV_BAR: [],              // Sticky headers, bottom navigation -> Level 1 (--elevation-xs) or Level 2 (--elevation-sm)
  TOAST_ALERT: [],          // Toasts, notifications -> Level 5 (--elevation-xl)
  SELECTION_SURFACE: [],    // Selected items -> contextual selection token
  DECORATIVE_GLOW: [],      // Colored glowing or heavy decorative halos -> ELIMINATE / FLATTEN
  OTHER: []
};

for (const item of dump) {
  const { file, selector, val, snippet } = item;
  const lowerFile = file.toLowerCase();
  const lowerSel = selector.toLowerCase();
  const lowerSnippet = snippet.toLowerCase();

  // Identify inside modal
  const isModalFile = lowerFile.includes('modal') || lowerFile.includes('dialog') || lowerFile.includes('drawer');
  const isDropdownOrPicker = lowerFile.includes('select') || lowerFile.includes('picker') || lowerFile.includes('dropdown') || lowerSel.includes('menu') || lowerSel.includes('dropdown') || lowerSel.includes('popover');
  const isButton = lowerSel.includes('btn') || lowerSel.includes('button') || lowerSel.includes('action') || lowerFile.includes('button');
  const isInput = lowerSel.includes('input') || lowerSel.includes('search') || lowerFile.includes('input');
  const isCard = lowerSel.includes('card') || lowerFile.includes('card') || lowerSel.includes('widget') || lowerSel.includes('box');
  const isNav = lowerSel.includes('nav') || lowerSel.includes('header') || lowerSel.includes('footer') || lowerFile.includes('nav');
  const isGlow = val.includes('rgba(') && !val.includes('rgba(0, 0, 0') && !val.includes('rgba(0,0,0') && !val.includes('rgba(15, 23') && !val.includes('rgba(10, 13') && !val.includes('rgba(13, 25');

  let cat = 'OTHER';
  let targetToken = '--elevation-sm';
  let action = 'REPLACE';
  let rationale = '';

  if (isDropdownOrPicker || lowerSel.includes('dropdown') || lowerSel.includes('options') || lowerSel.includes('popup')) {
    cat = 'DROPDOWN_POPOVER';
    targetToken = 'var(--elevation-md)';
    action = 'REPLACE';
    rationale = 'Floating menu/picker surface requires medium elevation (Level 3)';
  } else if (isModalFile && (lowerSel.includes('container') || lowerSel.includes('modalroot') || lowerSel.includes('dialog') || lowerSel.includes('drawer') || lowerSel.includes('overlay'))) {
    cat = 'MODAL_CONTAINER';
    targetToken = 'var(--elevation-lg)';
    action = 'REPLACE';
    rationale = 'Top-level modal dialog floating over page (Level 4)';
  } else if (isModalFile) {
    cat = 'INSIDE_MODAL_ELEMENT';
    if (lowerSel.includes('hover') || lowerSel.includes('active')) {
      targetToken = 'var(--elevation-xs)';
      action = 'REPLACE';
      rationale = 'Micro-interactive feedback inside modal';
    } else if (lowerSel.includes('selected')) {
      targetToken = 'var(--elevation-selection-modal)';
      action = 'REPLACE';
      rationale = 'Selected surface inside modal';
    } else {
      targetToken = 'none';
      action = 'ELIMINATE';
      rationale = 'Elements inside modals should rest flat on the modal surface to avoid dirty nesting';
    }
  } else if (isButton) {
    cat = 'BUTTON_CONTROL';
    if (lowerSel.includes('hover')) {
      targetToken = 'var(--elevation-xs)';
      action = 'REPLACE';
      rationale = 'Micro-lift on hover';
    } else if (lowerSel.includes('active') || lowerSel.includes('press')) {
      targetToken = 'var(--elevation-none)';
      action = 'REPLACE';
      rationale = 'Press feedback returns to ground';
    } else if (lowerSel.includes('fab') || lowerSel.includes('floating')) {
      targetToken = 'var(--elevation-md)';
      action = 'REPLACE';
      rationale = 'Floating action button';
    } else {
      targetToken = 'none';
      action = 'ELIMINATE';
      rationale = 'Resting buttons are flat and differentiated by background and border';
    }
  } else if (isInput) {
    cat = 'INPUT_FIELD';
    targetToken = 'none';
    action = 'ELIMINATE';
    rationale = 'Inputs are sunken or bordered surfaces, not elevated boxes';
  } else if (isNav) {
    cat = 'NAV_BAR';
    targetToken = 'var(--elevation-xs)';
    action = 'REPLACE';
    rationale = 'Sticky/top navigation micro-separation';
  } else if (isCard) {
    cat = 'PAGE_CARD';
    if (lowerSel.includes('hover')) {
      targetToken = 'var(--elevation-md)';
      action = 'REPLACE';
      rationale = 'Card hover lift';
    } else {
      targetToken = 'var(--elevation-sm)';
      action = 'REPLACE';
      rationale = 'Resting card on page canvas (Level 2)';
    }
  } else {
    cat = 'OTHER';
    targetToken = 'var(--elevation-sm)';
    action = 'REPLACE';
    rationale = 'Standard surface elevation';
  }

  item.category = cat;
  item.targetToken = targetToken;
  item.action = action;
  item.rationale = rationale;
  categories[cat].push(item);
}

fs.writeFileSync(path.resolve(__dirname, 'classified-shadows.json'), JSON.stringify(categories, null, 2));

console.log('=== CLASSIFICATION SUMMARY ===');
for (const [k, v] of Object.entries(categories)) {
  console.log(`${k.padEnd(24)}: ${v.length} occurrences`);
}
