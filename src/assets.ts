import Phaser from 'phaser';

export const ORB_TEXTURE_KEYS = [
  'orb_blue',
  'orb_red',
  'orb_green',
  'orb_yellow',
  'orb_purple',
  'orb_pink',
  'orb_white',
  'orb_cyan',
  'orb_silver'
] as const;

export const GATE_TEXTURE_KEYS = [
  'gate_blue',
  'gate_red',
  'gate_green',
  'gate_yellow'
] as const;

export function preloadGameAssets(scene: Phaser.Scene) {
  ORB_TEXTURE_KEYS.forEach(key => {
    if (!scene.textures.exists(key)) {
      scene.load.svg(key, `assets/${key}.svg`, { width: 48, height: 48 });
    }
  });

  GATE_TEXTURE_KEYS.forEach(key => {
    if (!scene.textures.exists(key)) {
      scene.load.svg(key, `assets/${key}.svg`, { width: 256, height: 256 });
    }
  });
}
