import type { ConsumerLocale } from './shared/catalog'

export const consumerPhoneFormCopy: Record<ConsumerLocale, { send: string; resend: string; sending: string; submit: string; invite: string; inviteHint: string }> = {
  zh: { send: '获取验证码', resend: '重新发送', sending: '发送中', submit: '登录', invite: '邀请码', inviteHint: '首次注册必填；已有账号可留空。' },
  en: { send: 'Get code', resend: 'Resend', sending: 'Sending', submit: 'Sign in', invite: 'Invite code', inviteHint: 'Required for first registration; existing accounts may leave it blank.' },
  es: { send: 'Enviar', resend: 'Reenviar', sending: 'Enviando', submit: 'Entrar', invite: 'Código de invitación', inviteHint: 'Obligatorio al registrarte; las cuentas existentes pueden dejarlo vacío.' },
  id: { send: 'Kirim kode', resend: 'Kirim ulang', sending: 'Mengirim', submit: 'Masuk', invite: 'Kode undangan', inviteHint: 'Wajib saat pertama mendaftar; akun yang sudah ada boleh mengosongkannya.' },
  pt: { send: 'Enviar', resend: 'Reenviar', sending: 'Enviando', submit: 'Entrar', invite: 'Código de convite', inviteHint: 'Obrigatório no primeiro cadastro; contas existentes podem deixar em branco.' },
}

export function phoneCodeActionText(locale: ConsumerLocale, seconds: number, loading: boolean, sent: boolean) {
  if (seconds > 0) return `${Math.ceil(seconds)}s`
  const copy = consumerPhoneFormCopy[locale]
  return loading ? copy.sending : sent ? copy.resend : copy.send
}

export const phoneCodePlaceholders: Record<ConsumerLocale, string> = {
  zh: '6位数字', en: '6 digits', es: '6 dígitos', id: '6 digit', pt: '6 dígitos',
}
