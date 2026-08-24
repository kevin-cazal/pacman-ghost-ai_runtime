// NE PAS MODIFIER — configuration de l'atelier

export const WORKSHOP_MODE = {
  id: 'build',
  label: 'Infos à coder',
  language: 'lua',
  templateUrl: 'js/workshop/ghost_ai_build.lua?v=1',
  storageKey: 'mini_pacman_ghost_ai_lua_v1',
  requiresBuildInfos: true,
};

export function getWorkshopMode() {
  return WORKSHOP_MODE;
}
