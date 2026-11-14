export type TargetSide = 'top' | 'bottom' | 'left' | 'right';

export interface TargetColorConfig {
  name: string;
  persianName: string;
  side: TargetSide;
  color: number;
  hex: string;
}

export const TARGET_COLORS: Record<TargetSide, TargetColorConfig> = {
  top: {
    name: 'blue',
    persianName: 'آبی',
    side: 'top',
    color: 0x1e90ff,
    hex: '#1e90ff'
  },
  bottom: {
    name: 'red',
    persianName: 'قرمز',
    side: 'bottom',
    color: 0xff4757,
    hex: '#ff4757'
  },
  left: {
    name: 'green',
    persianName: 'سبز',
    side: 'left',
    color: 0x2ed573,
    hex: '#2ed573'
  },
  right: {
    name: 'yellow',
    persianName: 'زرد',
    side: 'right',
    color: 0xffa502,
    hex: '#ffa502'
  }
};

// Non-matching colors that don't match any of the 4 borders
export const NON_MATCHING_COLORS = [
  { name: 'purple', hex: '#a55eea', color: 0xa55eea },
  { name: 'white', hex: '#ffffff', color: 0xffffff },
  { name: 'pink', hex: '#ff78c4', color: 0xff78c4 },
  { name: 'cyan', hex: '#00d2d3', color: 0x00d2d3 },
  { name: 'silver', hex: '#bdc3c7', color: 0xbdc3c7 }
];
