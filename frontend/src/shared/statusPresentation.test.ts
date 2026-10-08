import { describe, expect, it } from 'vitest'
import { statusPresentation } from './statusPresentation'

describe('shared status presentation', () => {
  it('keeps MCN directory status labels used by the old admin page', () => {
    expect(statusPresentation('NORMAL')).toEqual({ label: '正常', tone: 'success' })
    expect(statusPresentation('MISSING_ON_MCN')).toEqual({ label: 'MCN 已缺失', tone: 'danger' })
    expect(statusPresentation('FAILED')).toEqual({ label: '异常', tone: 'danger' })
    expect(statusPresentation('UNKNOWN')).toEqual({ label: 'UNKNOWN', tone: 'primary' })
  })
})
