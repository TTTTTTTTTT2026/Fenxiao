const MAX_AVATAR_BYTES = 1024 * 1024
const MAX_SOURCE_BYTES = 12 * 1024 * 1024
const MAX_AVATAR_DIMENSION = 2048

export class AvatarPreparationError extends Error {}

export function fitAvatarDimensions(width: number, height: number, maxDimension = MAX_AVATAR_DIMENSION) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new AvatarPreparationError('invalid image dimensions')
  }
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new AvatarPreparationError('cannot read image'))
    reader.readAsDataURL(blob)
  })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { URL.revokeObjectURL(url); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new AvatarPreparationError('cannot decode image')) }
    image.src = url
  })
}

function encodeJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob?.type === 'image/jpeg' && blob.size > 0) resolve(blob)
      else reject(new AvatarPreparationError('cannot encode image'))
    }, 'image/jpeg', quality)
  })
}

export async function prepareAvatarDataUrl(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg'].includes(file.type) || file.size < 1 || file.size > MAX_SOURCE_BYTES) {
    throw new AvatarPreparationError('unsupported image format or size')
  }
  const image = await loadImage(file)
  const width = image.naturalWidth
  const height = image.naturalHeight
  fitAvatarDimensions(width, height)

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new AvatarPreparationError('cannot process image')
  for (const maxDimension of [2048, 1600, 1280, 1024, 768]) {
    const fitted = fitAvatarDimensions(width, height, maxDimension)
    canvas.width = fitted.width
    canvas.height = fitted.height
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, fitted.width, fitted.height)
    context.drawImage(image, 0, 0, fitted.width, fitted.height)
    for (const quality of [0.88, 0.76, 0.62, 0.48]) {
      const encoded = await encodeJpeg(canvas, quality)
      if (encoded.size <= MAX_AVATAR_BYTES) return readAsDataUrl(encoded)
    }
  }
  throw new AvatarPreparationError('cannot compress image under 1 MB')
}

export function isAvatarValidationError(error: unknown) {
  return error instanceof AvatarPreparationError || (error instanceof Error &&
    /avatar|image|request failed: 413|request entity too large/i.test(error.message))
}
