import { describe, expect, it } from 'vitest'
import { internalPhoneCodeNotice } from './phoneCodeNotice'

describe('internal phone verification code notice', () => {
  it('explains the manual code flow in every client language', () => {
    for (const locale of ['zh', 'en', 'es', 'id', 'pt'] as const) {
      const notice = internalPhoneCodeNotice(locale, 10)
      expect(notice.hint).toContain('10')
      expect(notice.hint.length).toBeGreaterThan(10)
      expect(notice.success.length).toBeGreaterThan(10)
    }
    expect(internalPhoneCodeNotice('zh', 10)).toEqual({
      hint: '验证码已生成，请联系运营人员获取；10 分钟内有效。',
      success: '验证码已生成，请联系运营人员获取。',
    })
  })
})
