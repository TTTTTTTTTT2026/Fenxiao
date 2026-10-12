import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConsumerGradeProgressView } from './ConsumerGradeProgressCard'
import TimoVerificationResult from './TimoVerificationResult'
import { validSupportUrl } from './consumerSupport'
import type { ConsumerGradeProgressResponse, PlatformBindingResponse } from './api'

const progress: ConsumerGradeProgressResponse = { platformCode: 'TIMO', state: 'IN_PROGRESS', currentGradeCode: 'NORMAL_MEMBER', qualifiedDirectInviteCount: 2, requiredDirectInviteCount: 3, gradeEvaluatedAt: null }
const binding: PlatformBindingResponse = { id: 1, userId: 1, platformCode: 'TIMO', platformUserId: '123456789012', status: 'REJECTED', submittedAt: '', officialGuildId: null, officialJoinedAt: null, rejectionCode: 'NOT_IN_TARGET_GUILD', rejectionReason: null, version: 1, verificationState: 'NOT_FOUND' }
const noop = () => undefined

describe('consumer growth progress', () => {
  it('uses direct qualification counts and links to existing direct invite progress', () => {
    const html = renderToStaticMarkup(<ConsumerGradeProgressView data={progress} locale="zh" onRetry={noop} />)
    expect(html).toContain('2 / 3')
    expect(html).toContain('还差 1 位有效直邀')
    expect(html).toContain('/earnings/effective-users#direct-invite-progress')
    expect(html).not.toContain('/10')
  })
  it('does not call an unmet review a granted grade', () => {
    const html = renderToStaticMarkup(<ConsumerGradeProgressView data={{ ...progress, state: 'AWAITING_REVIEW', qualifiedDirectInviteCount: 3 }} locale="zh" onRetry={noop} />)
    expect(html).toContain('等级复核尚未完成')
    expect(html).not.toContain('已确认等级')
  })
  it('does not ask upgraded users to achieve new star again', () => {
    const html = renderToStaticMarkup(<ConsumerGradeProgressView data={{ ...progress, state: 'ACHIEVED', currentGradeCode: 'SILVER' }} locale="zh" onRetry={noop} />)
    expect(html).toContain('银牌')
    expect(html).not.toContain('2 / 3')
    expect(html).not.toContain('还差')
  })
  it.each(['UNKNOWN', 'REVIEW_REQUIRED'] as const)('does not turn %s into zero progress', (state) => {
    const html = renderToStaticMarkup(<ConsumerGradeProgressView data={{ ...progress, state, qualifiedDirectInviteCount: null }} locale="zh" onRetry={noop} />)
    expect(html).not.toContain('<progress')
    expect(html).not.toContain('还差')
    expect(html).not.toContain('0 / 3')
    expect(html).not.toContain('升级为新星')
  })
  it('hides stale numbers on failure or loading', () => {
    for (const props of [{ error: true }, { loading: true }]) {
      const html = renderToStaticMarkup(<ConsumerGradeProgressView data={progress} locale="zh" onRetry={noop} {...props} />)
      expect(html).not.toContain('2 / 3')
      expect(html).not.toContain('还差')
    }
  })
  it.each(['zh', 'en', 'es', 'id', 'pt'] as const)('renders the grade and binding recovery in %s', (locale) => {
    const html = renderToStaticMarkup(<ConsumerGradeProgressView data={progress} locale={locale} onRetry={noop} />)
    const recovery = renderToStaticMarkup(<TimoVerificationResult binding={binding} locale={locale} loading={false} onRetry={noop} localizedReason="" />)
    expect(html).toContain('2 / 3')
    expect(html).not.toContain('undefined')
    expect(recovery).toContain('<details')
    expect(recovery).toContain('123456789012')
    expect(recovery).not.toContain('undefined')
    if (locale !== 'zh') expect(html + recovery).not.toMatch(/[\u4e00-\u9fff]/)
  })
})

describe('Timo verification recovery', () => {
  it('explains a missing record without claiming the account does not exist', () => {
    const html = renderToStaticMarkup(<TimoVerificationResult binding={binding} locale="zh" loading={false} onRetry={noop} localizedReason="" />)
    expect(html).toContain('当前可用公会记录中尚未查到')
    expect(html).toContain('再次核验')
    expect(html).toContain('ID 填错了／需要帮助')
    expect(html).not.toContain('<input')
    expect(html).not.toContain('href=""')
  })
  it('does not promise automatic retry for a non-retryable technical rejection', () => {
    const html = renderToStaticMarkup(<TimoVerificationResult binding={{ ...binding, verificationState: 'ERROR' }} locale="zh" loading={false} onRetry={noop} localizedReason="" />)
    expect(html).toContain('尚未形成账号资格结论')
    expect(html).not.toContain('系统会自动重试')
    expect(html).not.toContain('暂未通过核验')
  })
  it('does not pretend a manual case has been assigned', () => {
    const html = renderToStaticMarkup(<TimoVerificationResult binding={{ ...binding, status: 'VERIFYING', verificationState: 'MANUAL_REVIEW_REQUIRED' }} locale="zh" loading={false} onRetry={noop} localizedReason="" />)
    expect(html).toContain('需要人工协助')
    expect(html).not.toContain('已转人工处理')
    expect(html).not.toContain('再次核验')
  })
  it('does not offer duplicate submissions while waiting or while retry is running', () => {
    const html = renderToStaticMarkup(<TimoVerificationResult binding={{ ...binding, status: 'VERIFYING', verificationState: 'SOURCE_STALE' }} locale="zh" loading={false} onRetry={noop} localizedReason="" />)
    expect(html).not.toContain('<button')
    const busy = renderToStaticMarkup(<TimoVerificationResult binding={binding} locale="zh" loading onRetry={noop} localizedReason="" />)
    expect(busy).toContain('disabled')
  })
  it('only renders a usable configured HTTPS support link', () => {
    expect(validSupportUrl('javascript:alert(1)')).toBeUndefined()
    expect(validSupportUrl('http://example.test')).toBeUndefined()
    expect(validSupportUrl('https://user:password@example.test')).toBeUndefined()
    expect(validSupportUrl('')).toBeUndefined()
    const html = renderToStaticMarkup(<TimoVerificationResult binding={binding} locale="zh" loading={false} onRetry={noop} localizedReason="" supportUrl="https://support.example.test/timo" />)
    expect(html).toContain('href="https://support.example.test/timo"')
    expect(html).toContain('请勿提供密码或短信验证码')
  })
})
