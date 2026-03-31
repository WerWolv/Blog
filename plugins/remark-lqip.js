import { visit } from 'unist-util-visit'
import path from 'node:path'
import { existsSync, readdirSync } from 'node:fs'
import sharp from 'sharp'

function packColor11bit(c) {
  const r = Math.round((c.r / 0xff) * 0b1111)
  const g = Math.round((c.g / 0xff) * 0b1111)
  const b = Math.round((c.b / 0xff) * 0b111)
  return (r << 7) | (g << 3) | b
}

function packColor10bit(c) {
  const r = Math.round((c.r / 0xff) * 0b111)
  const g = Math.round((c.g / 0xff) * 0b1111)
  const b = Math.round((c.b / 0xff) * 0b111)
  return (r << 7) | (g << 3) | b
}

/**
 * Pure CSS-based LQIP implementation
 * Reference: https://frzi.medium.com/lqip-css-73dc6dda2529
 * Packs 3 colors into a single RGBA hex value, then unpacks it in CSS to generate a grid gradient
 */

/**
 * Use Sharp to extract colors from 3 specific positions in the image
 */
async function extractColors(imagePath) {
  try {
    // Use Sharp to resize the image to 3x3 and read raw pixel data
    const { data, info } = await sharp(imagePath)
      .resize(3, 3, {
        fit: 'fill',
        kernel: 'lanczos3', // High-quality resampling
      })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = []

    // Extract RGB values from raw pixel data
    for (let a = 0; a < data.length; a += info.channels) {
      pixels.push({
        r: data[a],
        g: data[a + 1],
        b: data[a + 2],
      })
    }

    // Select 3 specific positions: top-left (0), center-right-ish (4), bottom-right (8)
    // 3x3 grid index layout:
    // 0 1 2
    // 3 4 5
    // 6 7 8
    const [c0, c1, c2] = [pixels[0], pixels[4], pixels[8]]

    return [c0, c1, c2]
  } catch (error) {
    console.warn(`Color extraction failed: ${imagePath}`, error.message)
    return null
  }
}

/**
 * Pack 3 colors into a single RGBA hex value
 * Uses the bit-packing strategy from color.ts:
 * - Color 1: use packColor11bit (R: 4 bits, G: 4 bits, B: 3 bits)
 * - Color 2: use packColor11bit (R: 4 bits, G: 4 bits, B: 3 bits)
 * - Color 3: use packColor10bit (R: 3 bits, G: 4 bits, B: 3 bits)
 * Total: 32 bits = RGBA
 */
function packColorsToHex(colors) {
  const [c0, c1, c2] = colors

  // Use the bit-packing helpers from color.ts
  const pc0 = packColor11bit(c0) // 11 bits
  const pc1 = packColor11bit(c1) // 11 bits
  const pc2 = packColor10bit(c2) // 10 bits

  // Pack into 32 bits: 11 + 11 + 10 = 32 bits
  const combined = (BigInt(pc0) << 21n) | (BigInt(pc1) << 10n) | BigInt(pc2)

  // Convert to an 8-digit hex string
  const hex = '#' + combined.toString(16).padStart(8, '0')
  return hex
}

/**
 * Analyze an image and generate an LQIP hex value
 */
async function analyzeImageForLQIP(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata()
    const { width, height } = metadata

    // Check whether the image is fully opaque
    const stats = await sharp(imagePath).stats()
    if (!stats.isOpaque) {
      return null // Skip transparent images
    }

    // Extract 3 key colors
    const colors = await extractColors(imagePath)
    if (!colors) {
      return null
    }

    // Pack the colors into a hex value
    const lqipHex = packColorsToHex(colors)

    return {
      width,
      height,
      lqipHex,
      colors, // For debugging
    }
  } catch (error) {
    console.warn(`LQIP analysis failed: ${imagePath}`, error.message)
    return null
  }
}

/**
 * Resolve an image path
 */
function resolveImagePath(imageUrl, filePath) {
  if (path.isAbsolute(imageUrl)) {
    return imageUrl
  }

  // Handle Astro's ~ path alias
  if (imageUrl.startsWith('~/')) {
    const contentDir = path.dirname(filePath)
    const srcDir = path.dirname(path.dirname(contentDir))
    return path.resolve(srcDir, imageUrl.slice(2))
  }

  const fileDir = path.dirname(filePath || '')
  return path.resolve(fileDir, imageUrl)
}

/**
 * Process a single image node
 */
async function processImageNode(node, filePath) {
  const imagePath = resolveImagePath(node.url, filePath)

  if (!existsSync(imagePath)) {
    return
  }

  const lqipData = await analyzeImageForLQIP(imagePath)
  if (!lqipData) {
    return
  }

  // Add data attributes for CSS processing
  node.data = node.data || {}
  node.data.hProperties = node.data.hProperties || {}

  // Set dimension attributes
  if (lqipData.width && lqipData.height) {
    node.data.hProperties.width = lqipData.width
    node.data.hProperties.height = lqipData.height
  }

  // Set the LQIP CSS custom property
  const style = node.data.hProperties.style || ''
  const lqipStyle = `--lqip:${lqipData.lqipHex}`

  node.data.hProperties.style = style ? `${style};${lqipStyle}` : lqipStyle
}

/**
 * Main Remark plugin entry point
 */
function remarkLQIP() {
  return async (tree, file) => {
    const imagesToProcess = []

    // Collect all image nodes
    visit(tree, 'image', (node) => {
      if (node.url && !node.url.match('^([a-z]+:)?//')) {
        imagesToProcess.push(node)
      }
    })

    // Process all images in parallel
    await Promise.all(
      imagesToProcess.map(async (node) => {
        try {
          await processImageNode(node, file.path)
        } catch (error) {
          console.warn(`LQIP processing failed: ${node.url}`, error.message)
        }
      })
    )
  }
}

export default remarkLQIP

// In the build environment, we can infer caller context from the stack trace
function getCallerContext() {
  const stack = new Error().stack
  if (!stack) return null

  // Look for a file path containing /content/ (compatible with Windows and Linux)
  const contentMatch = stack.match(/([^:\s]+[\/\\]content[\/\\][^:\s)]+)/i)
  if (contentMatch) {
    return contentMatch[1].replace(/\\/g, '/')
  }

  return null
}

export async function generateLQIPFromPath(src) {
  try {
    let imagePath

    if (typeof src === 'string') {
      imagePath = resolveImagePath(src, '')
    } else if (src && typeof src === 'object') {
      // Handle Astro ImageMetadata objects

      // Try multiple ways to retrieve the original file path
      if (src.fsPath) {
        imagePath = src.fsPath
      } else if (src.pathname) {
        imagePath = src.pathname
      } else if (src.src) {
        let cleanSrc = src.src

        // Remove Astro-specific prefixes and query parameters
        if (cleanSrc.includes('/@fs/')) {
          // Extract the real file path: /@fs/D:/Code/dnzzk2.icu/src/content/...
          cleanSrc = cleanSrc.split('/@fs/')[1]
          if (cleanSrc) {
            // Remove query parameters and normalize path separators
            imagePath = cleanSrc.split('?')[0].replace(/\\/g, '/')
          }
        } else if (cleanSrc.startsWith('/_astro/')) {
          // For /_astro/ paths, this is Astro's optimized output path
          // Try to infer the original path from the caller context
          const callerContext = getCallerContext()

          if (callerContext) {
            // Look for a likely source image from the caller file's directory
            const contextDir = path.dirname(callerContext)
            const assetsDir = path.join(contextDir, 'assets')

            // Try matching by file extension
            const srcFileName = path.basename(cleanSrc)
            const fileExtension = path.extname(srcFileName)

            if (existsSync(assetsDir)) {
              // Look for files of the same type in the assets directory
              const files = readdirSync(assetsDir)
              const matchingFile = files.find(
                (file) => path.extname(file) === fileExtension || file.includes(path.parse(srcFileName).name.split('.')[0])
              )

              if (matchingFile) {
                imagePath = path.join(assetsDir, matchingFile)
              }
            }
          }

          if (!imagePath) {
            console.log('Could not infer the original path, skipping LQIP generation:', cleanSrc)
            return null
          }
        } else {
          // Handle ordinary paths
          imagePath = resolveImagePath(cleanSrc.split('?')[0], '')
        }
      } else {
        console.warn('ImageMetadata object is missing usable path properties:', Object.keys(src))
        return null
      }
    } else {
      console.warn('Invalid image source:', src)
      return null
    }

    if (!imagePath) {
      console.warn('Could not resolve image path:', src)
      return null
    }

    // Check whether the file exists
    if (!existsSync(imagePath)) {
      console.warn(`Image file does not exist: ${imagePath}`)
      return null
    }

    // Analyze the image and generate an LQIP value
    const result = await analyzeImageForLQIP(imagePath)
    return result ? result.lqipHex : null
  } catch (error) {
    console.warn('LQIP generation failed:', error.message)
    return null
  }
}
