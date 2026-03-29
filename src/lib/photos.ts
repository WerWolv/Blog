import type { ImageMetadata } from 'astro'
import type { PhotoData, Photo, PolaroidVariant } from '~/types'

// Auto-import all images under the photos directory.
const photoModules = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/**/*.{webp,jpg,jpeg,png}', { eager: true })

/**
 * Get a sorted list of photos by directory name.
 * @param dir - Directory name, for example '2025-06-21-cat'
 * @param alt - Image alt text
 * @param variants - Variant for each image, mapped by index
 */
function getPhotos(dir: string, alt: string, variants: PolaroidVariant[]): Photo[] {
  return Object.entries(photoModules)
    .filter(([path]) => path.includes(`/${dir}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, mod], index) => {
      const img = mod.default
      return {
        src: img,
        alt,
        width: img.width,
        height: img.height,
        variant: variants[index] || '4x3',
      }
    })
}

export const PhotosList: PhotoData[] = [
  //{
  //  title: 'Ningbo · Botanical Garden',
  //  icon: { type: 'emoji', value: '🌼' },
  //  description: 'It was early spring, so I went to see the cherry blossoms.',
  //  date: '2026-03-07',
  //  travel: '',
  //  photos: getPhotos('2026-03-07-botanicalGarden', 'Early spring cherry blossoms at the botanical garden', ['3x4', '3x4', '3x4', '3x4', '3x4', '3x4']),
  //}
]
