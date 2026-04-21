export interface GradientPreset {
  id: string
  label: string
  from: string
  to: string
  icon: string
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'blue', label: 'Blue', from: 'rgba(59,130,246,0.30)', to: 'rgba(30,64,175,0.30)', icon: 'icon-[tabler--circle-filled]' },
  { id: 'none', label: 'None', from: 'rgba(0,0,0,0)', to: 'rgba(0,0,0,0)', icon: 'icon-[tabler--cross]' },
  { id: 'violet', label: 'Violet', from: 'rgba(139,92,246,0.30)', to: 'rgba(91,33,182,0.30)', icon: 'icon-[tabler--circle-filled]' },
  { id: 'teal', label: 'Teal', from: 'rgba(20,184,166,0.30)', to: 'rgba(6,95,70,0.30)', icon: 'icon-[tabler--circle-filled]' },
  { id: 'rose', label: 'Rose', from: 'rgba(244,63,94,0.30)', to: 'rgba(159,18,57,0.30)', icon: 'icon-[tabler--circle-filled]' },
  { id: 'amber', label: 'Amber', from: 'rgba(245,158,11,0.30)', to: 'rgba(180,83,9,0.30)', icon: 'icon-[tabler--circle-filled]' },
]

export const DEFAULT_GRADIENT_PRESET = GRADIENT_PRESETS[0]

export function getPresetById(id: string | null | undefined): GradientPreset {
  return GRADIENT_PRESETS.find((preset) => preset.id === id) ?? DEFAULT_GRADIENT_PRESET
}
