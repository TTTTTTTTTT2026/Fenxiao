import { afterEach, describe, expect, it, vi } from 'vitest'
import { AvatarPreparationError, fitAvatarDimensions, isAvatarValidationError, prepareAvatarDataUrl } from './avatarUpload'

describe('avatar preparation', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps aspect ratio within the backend dimension limit', () => {
    expect(fitAvatarDimensions(4000, 3000)).toEqual({ width: 2048, height: 1536 })
    expect(fitAvatarDimensions(800, 600)).toEqual({ width: 800, height: 600 })
    expect(() => fitAvatarDimensions(0, 600)).toThrow(AvatarPreparationError)
  })

  it('encodes a large phone photo into a compatible JPEG before upload', async () => {
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:avatar', revokeObjectURL })
    vi.stubGlobal('Image', class {
      naturalWidth = 4000
      naturalHeight = 3000
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) { queueMicrotask(() => this.onload?.()) }
    })
    const context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() }
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
      toBlob: (callback: (blob: Blob | null) => void) => callback(new Blob(['jpeg'], { type: 'image/jpeg' })),
    }
    vi.stubGlobal('document', { createElement: () => canvas })
    vi.stubGlobal('FileReader', class {
      result = 'data:image/jpeg;base64,/9j/'
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsDataURL() { this.onload?.() }
    })

    const value = await prepareAvatarDataUrl({ type: 'image/jpeg', size: 2 * 1024 * 1024 } as File)

    expect(value).toBe('data:image/jpeg;base64,/9j/')
    expect([canvas.width, canvas.height]).toEqual([2048, 1536])
    expect(context.drawImage).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:avatar')
  })

  it('distinguishes image validation errors from unrelated failures', () => {
    expect(isAvatarValidationError(new Error('avatar dimensions must be at most 2048 x 2048'))).toBe(true)
    expect(isAvatarValidationError(new Error('request failed: 413'))).toBe(true)
    expect(isAvatarValidationError(new Error('network unavailable'))).toBe(false)
  })
})
