// NE PAS MODIFIER — configuration de l'atelier

export const WORKSHOP_MODE = {
  id: 'single',
  label: 'Une seule fonction',
  language: 'lua',
  templateUrl: 'js/workshop/ghost.lua?v=1',
  // Nouvelle clé : le code sauvegardé par l'ancienne version (trois fonctions)
  // ne doit pas se charger dans celle-ci, il ne compilerait pas.
  storageKey: 'mini_pacman_ghost_v2',
};

export function getWorkshopMode() {
  return WORKSHOP_MODE;
}
