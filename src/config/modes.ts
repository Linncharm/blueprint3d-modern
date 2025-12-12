import type { ItemCategory } from '../constants'
import type { Blueprint3DTemplate } from '../indexdb/blueprint-template'
import DefaultFloorplan from '../templates/default.json'
import ExampleFloorplan from '../templates/example.json'

/**
 * Blueprint3D application modes
 */
export enum Blueprint3DMode {
  /** Normal mode with all features and items */
  NORMAL = 'normal',
  /** Generator mode - bedroom generator with doors and windows only */
  GENERATOR = 'generator',
  /** Wealth corner calculator - only doors */
  WEALTH_CORNER = 'wealth-corner',
  /** Bathroom design - bathroom-related items only */
  BATHROOM = 'bathroom',
  /** Kitchen design - kitchen-related items only */
  KITCHEN = 'kitchen',
  /** Bedroom design - bedroom-related items only */
  BEDROOM = 'bedroom'
}

export interface ModeConfig {
  /** Default floorplan template to load */
  defaultTemplate: Blueprint3DTemplate
  /** Allowed item categories in this mode (excluding 'all' - that's a UI filter) */
  allowedCategories: Array<ItemCategory>
}

/**
 * Centralized configuration for each Blueprint3D mode
 */
export const MODE_CONFIGS: Record<Blueprint3DMode, ModeConfig> = {
  [Blueprint3DMode.NORMAL]: {
    defaultTemplate: ExampleFloorplan as Blueprint3DTemplate,
    allowedCategories: [
      'bed',
      'drawer',
      'wardrobe',
      'light',
      'storage',
      'table',
      'chair',
      'sofa',
      'armchair',
      'stool',
      'door',
      'window'
    ]
  },
  [Blueprint3DMode.GENERATOR]: {
    defaultTemplate: DefaultFloorplan as Blueprint3DTemplate,
    allowedCategories: ['door', 'window']
  },
  [Blueprint3DMode.WEALTH_CORNER]: {
    defaultTemplate: DefaultFloorplan as Blueprint3DTemplate,
    allowedCategories: ['door'] // Only doors for wealth corner calculation
  },
  [Blueprint3DMode.BATHROOM]: {
    defaultTemplate: DefaultFloorplan as Blueprint3DTemplate,
    // TODO: Add bathroom-specific categories when items are available
    allowedCategories: ['door', 'window']
  },
  [Blueprint3DMode.KITCHEN]: {
    defaultTemplate: DefaultFloorplan as Blueprint3DTemplate,
    // TODO: Add kitchen-specific categories when items are available
    allowedCategories: ['door', 'window', 'table', 'chair', 'storage']
  },
  [Blueprint3DMode.BEDROOM]: {
    defaultTemplate: DefaultFloorplan as Blueprint3DTemplate,
    allowedCategories: ['bed', 'drawer', 'wardrobe', 'light', 'door', 'window']
  }
}

/**
 * Get mode configuration
 */
export function getModeConfig(mode: Blueprint3DMode | string): ModeConfig {
  const modeKey = typeof mode === 'string' ? parseMode(mode) : mode
  return MODE_CONFIGS[modeKey]
}

/**
 * Parse mode from string
 */
export function parseMode(mode?: string): Blueprint3DMode {
  if (!mode) return Blueprint3DMode.NORMAL
  if (Object.values(Blueprint3DMode).includes(mode as Blueprint3DMode)) {
    return mode as Blueprint3DMode
  }
  console.warn(`Unknown mode: ${mode}, defaulting to NORMAL`)
  return Blueprint3DMode.NORMAL
}
