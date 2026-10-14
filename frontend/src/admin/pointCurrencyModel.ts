export const pointCurrencyStatus: Record<string, string> = {
  ACTIVE: '已启用', DISABLED: '已停用', SCHEDULED: '待生效', SUPERSEDED: '历史版本', CANCELLED: '预约已取消',
  CONFIGURED: '可计算', NOT_CONFIGURED: '未配置汇率', UNSUPPORTED_COUNTRY: '归属国家暂不支持',
}
export function validPointCurrencyDecimal(value: string, fraction: number, positive: boolean) {
  return new RegExp(`^\\d{1,12}(?:\\.\\d{1,${fraction}})?$`).test(value) && (!positive || /[1-9]/.test(value))
}
/** Format the backend's exact decimal string without converting its amount to an IEEE float. */
export function formatPointCurrencyAmount(value: string) {
  if (!/^\d+(?:\.\d+)?$/.test(value)) return '—'
  const [whole, fraction] = value.split('.')
  return `${new Intl.NumberFormat('zh-CN').format(BigInt(whole))}${fraction ? `.${fraction}` : ''}`
}
export function localPointCurrencyEffectiveAt(value: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) throw new Error('请选择未来生效时间；立即生效请留空。')
  return date.toISOString()
}

/** Read submitted DOM values, including native date picker/autofill values not reflected in React yet. */
export function pointCurrencySavePayload(form: FormData, expectedVersion: number) {
  const enabled = form.get('enabled') === 'enabled'
  const rate = String(form.get('rate') ?? '').trim()
  if ((enabled || rate) && !validPointCurrencyDecimal(rate, 8, true)) throw new Error('请输入正汇率，最多12位整数和8位小数；小数点使用英文句点。')
  return { enabled, currencyPerPoint: rate || null, effectiveAt: localPointCurrencyEffectiveAt(String(form.get('effectiveAt') ?? '')), expectedVersion }
}
