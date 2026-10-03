import { beforeEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import App, { ConsoleApp, formatBusinessRewardLevel, isLinkyGuildMismatch, localizeInviteOperationError, localizeLinkyBindingError, localizeTimoBindingError } from './App'

type FakeStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

function createStorage(): FakeStorage {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

const adminTestSession = {
  sessionToken: 'admin-token',
  expiresAt: '2099-01-01T00:00:00Z',
  username: 'operator',
  displayName: '运营账号',
  role: 'ADMIN',
}

const superAdminTestSession = {
  ...adminTestSession,
  role: 'super_admin',
}

describe('App external landing pages', () => {
  beforeEach(() => {
    const localStorage = createStorage()
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          pathname: '/bind',
          search: '',
          origin: 'http://127.0.0.1:4173',
        },
        localStorage,
      },
    })
  })

  it('renders the password-only partner entry instead of admin or consumer features', () => {
    Object.assign(window.location, { pathname: '/', hostname: 'partner.bandeira.fandodo.online' })
    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('伙伴工作台')
    expect(markup).toContain('type="password"')
    expect(markup).not.toContain('运营中心')
    expect(markup).not.toContain('短信验证码')
  })

  it('does not render the admin console at the new consumer root', () => {
    Object.assign(window.location, { pathname: '/', hostname: 'app.bandeira.fandodo.online' })
    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('consumer-app-page')
    expect(markup).not.toContain('运营中心')
  })

  it('keeps the language selector accessible without rendering a visible language label in the bind topbar', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).not.toContain('>语言<')
    expect(markup).toContain('aria-label="语言"')
    expect(markup).toContain('绑定 Linky 账号')
    expect(markup).not.toContain('class="consumer-bottom-nav"')
  })

  it('requires a signed-in account on the bind page without exposing member navigation', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('class="consumer-topbar"')
    expect(markup).not.toContain('class="consumer-bottom-nav"')
    expect(markup).toContain('登录后管理平台账号')
    expect(markup).not.toContain('WhatsApp 号码')
  })

  it('offers a signed-in user a clear sign-out action in the account page', () => {
    const localStorage = createStorage()
    localStorage.setItem('fenxiao-web-session', JSON.stringify({
      userId: 10001,
      inviteCode: 'ABCD1234',
      countryCode: 'BR',
      languageCode: 'pt',
      accessToken: 'token-1',
    }))
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: { pathname: '/account', search: '', origin: 'http://127.0.0.1:4173' },
        localStorage,
      },
    })

    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('账户安全')
    expect(markup).toContain('退出登录')
    expect(markup).toContain('consumer-sign-out-button')
    expect(markup).toContain('绑定平台账号')
    expect(markup).toContain('绑定 Linky 账号')
    expect(markup).toContain('绑定 Timo 账号')
    expect(markup).toContain('切换应用工作区')
    expect(markup).not.toContain('绑定后，平台数据才能归入当前账户并进入奖励计算。')
    expect(markup).not.toContain('使用官方 12 位 Timo ID 完成归属核验。')
    expect(markup).toContain('href="/account/timo"')
    expect(markup).toContain('<a class="consumer-secondary-link" href="/account/timo"')
    expect(markup).not.toContain('<a class="consumer-primary-link" href="/account/timo"')
  })

  it('renders a dedicated Timo binding page with a twelve-digit ID contract', () => {
    const localStorage = createStorage()
    localStorage.setItem('fenxiao-web-session', JSON.stringify({
      userId: 10001, inviteCode: 'ABCD1234', countryCode: 'BR', languageCode: 'pt', accessToken: 'token-1',
    }))
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { pathname: '/account/timo', search: '', origin: 'http://127.0.0.1:4173' }, localStorage },
    })

    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('绑定 Timo 账号')
    expect(markup).toContain('Timo ID（12 位数字）')
    expect(markup).toContain('首位非 0')
    expect(markup).toContain('pattern="[1-9][0-9]{11}"')
    expect(markup).toContain('maxLength="12"')
    expect(markup).toContain('consumer-commercial-hero consumer-bind-hero')
  })

  it('does not show member navigation on the account page before sign-in', () => {
    const localStorage = createStorage()
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: { pathname: '/account', search: '', origin: 'http://127.0.0.1:4173' },
        localStorage,
      },
    })

    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('登录后管理平台账号')
    expect(markup).not.toContain('class="consumer-bottom-nav"')
  })
})

describe('Linky guild mismatch feedback', () => {
  it('recognizes expected-guild mismatches without exposing backend invite-code details', () => {
    expect(isLinkyGuildMismatch('Please join expected Linky guild with invite code GUILD-88 before binding.')).toBe(true)
    expect(isLinkyGuildMismatch('Linky account is not in the expected guild Royal ID. Please join using invite code null.')).toBe(true)
  })

  it('does not classify ordinary binding errors as a guild mismatch', () => {
    expect(isLinkyGuildMismatch('WhatsApp number already exists')).toBe(false)
  })

  it('uses the selected language for Linky guild mismatches', () => {
    const sourceError = 'Linky account is not in the expected guild Royal ID. Please join using invite code null.'
    expect(localizeLinkyBindingError(sourceError, 'zh')).toBe('当前账号与被邀请人不属于同一个公会，绑定失败')
    expect(localizeLinkyBindingError(sourceError, 'pt')).toBe('Esta conta e quem fez o convite não pertencem à mesma guilda. A vinculação falhou.')
  })

  it('explains a missing MCN guild in the selected language without exposing the raw server error', () => {
    const sourceError = 'Linky MCN verification cannot be enabled until this invitation route is mapped to an active MCN guild.'
    expect(localizeLinkyBindingError(sourceError, 'pt')).toContain('guilda Linky válida')
    expect(localizeLinkyBindingError(sourceError, 'id')).toContain('guild Linky')
    expect(localizeLinkyBindingError('unexpected internal detail', 'es')).not.toContain('internal detail')
  })
})

describe('Timo binding feedback', () => {
  it('translates unsupported countries and authoritative rejection codes', () => {
    expect(localizeTimoBindingError('no MCN Timo country mapping exists for CN', 'pt')).toContain('país de cadastro')
    expect(localizeTimoBindingError('NOT_IN_TARGET_GUILD', 'es')).toContain('gremio esperado')
    expect(localizeTimoBindingError('unexpected internal detail', 'en')).not.toContain('internal detail')
  })
})

describe('consumer locale coverage', () => {
  const paths = ['/earnings', '/earnings/effective-users', '/earnings/activity', '/invite', '/account', '/account/profile', '/account/linky', '/account/timo']
  const locales = ['en', 'es', 'id', 'pt'] as const

  for (const locale of locales) {
    for (const pathname of paths) {
      it(`does not mix Chinese interface copy into ${locale} on ${pathname}`, () => {
        const localStorage = createStorage()
        localStorage.setItem('fenxiao-external-locale', locale)
        localStorage.setItem('fenxiao-web-session', JSON.stringify({
          userId: 10001, inviteCode: 'ABCD1234', countryCode: 'BR', languageCode: 'pt-br', accessToken: 'test-token',
        }))
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          value: { location: { pathname, search: '', origin: 'http://127.0.0.1:4173' }, localStorage },
        })

        const markup = renderToStaticMarkup(<App />).replace(/<option[^>]*value="zh"[^>]*>.*?<\/option>/g, '')
        expect(markup).not.toMatch(/[\u3400-\u9fff]/)
      })
    }
  }

  it('uses Portuguese labels and number formatting on the earnings page', () => {
    const localStorage = createStorage()
    localStorage.setItem('fenxiao-external-locale', 'pt')
    localStorage.setItem('fenxiao-web-session', JSON.stringify({
      userId: 10001, inviteCode: 'ABCD1234', countryCode: 'BR', languageCode: 'pt-br', accessToken: 'test-token',
    }))
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { pathname: '/earnings', search: '', origin: 'http://127.0.0.1:4173' }, localStorage },
    })

    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('Visão geral dos convites (esta semana)')
    expect(markup).toContain('Como aumentar seus ganhos hoje')
    expect(markup).toContain('0,00 pontos')
    expect(markup).toContain('href="/earnings/effective-users"')
  })
})

describe('signed-out login hero', () => {
  const assets = {
    zh: { file: 'login-hero-zh-v1', alt: '恭喜你！' },
    en: { file: 'login-hero-en-v1', alt: 'Congratulations!' },
    es: { file: 'login-hero-es-v1', alt: '¡Felicidades!' },
    id: { file: 'login-hero-id-v1', alt: 'Selamat!' },
    pt: { file: 'login-hero-pt-BR-v1', alt: 'Parabéns!' },
  } as const

  for (const [locale, hero] of Object.entries(assets)) {
    it(`renders only the ${locale} hero with responsive sources above the sign-in form`, () => {
      const localStorage = createStorage()
      localStorage.setItem('fenxiao-external-locale', locale)
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { location: { pathname: '/invite', search: '', origin: 'http://127.0.0.1:4173' }, localStorage },
      })

      const markup = renderToStaticMarkup(<App />)
      expect(markup).toContain(`alt="${hero.alt}`)
      expect(markup).toContain(`${hero.file}-800.webp`)
      expect(markup).toContain(`${hero.file}-1600.webp`)
      expect(markup.indexOf('consumer-login-hero')).toBeLessThan(markup.indexOf('id="phone-login"'))
      expect(markup).toContain('loading="eager"')
      for (const other of Object.values(assets).filter((asset) => asset.file !== hero.file)) {
        expect(markup).not.toContain(other.file)
      }
    })
  }

  it('keeps the hero off the signed-in invite page', () => {
    const localStorage = createStorage()
    localStorage.setItem('fenxiao-web-session', JSON.stringify({
      userId: 10001, inviteCode: 'ABCD1234', countryCode: 'BR', languageCode: 'pt-br', accessToken: 'test-token',
    }))
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { pathname: '/invite', search: '', origin: 'http://127.0.0.1:4173' }, localStorage },
    })

    const markup = renderToStaticMarkup(<App />)
    expect(markup).not.toContain('consumer-login-hero')
    expect(markup).toContain('consumer-invite-card')
  })

  it('maps a stored regional language to the matching image and page language', () => {
    const localStorage = createStorage()
    localStorage.setItem('fenxiao-external-locale', 'pt-BR')
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { pathname: '/invite', search: '', origin: 'http://127.0.0.1:4173' }, localStorage },
    })

    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('login-hero-pt-BR-v1-800.webp')
    expect(markup).toContain('Entrar com telefone')
  })
})

describe('client password sign-in', () => {
  it('keeps the existing SMS registration form as the default and adds a discreet password entry', () => {
    const localStorage = createStorage()
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { pathname: '/invite', search: '', hash: '#phone-login', origin: 'http://127.0.0.1:4173' }, localStorage },
    })

    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('id="phone-login"')
    expect(markup).toContain('账号密码登录')
    expect(markup).toContain('consumer-login-switch')
    expect(markup).not.toContain('id="password-login"')
  })

  it('shows phone and password only when the password route is selected', () => {
    const localStorage = createStorage()
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { pathname: '/invite', search: '', hash: '#password-login', origin: 'http://127.0.0.1:4173' }, localStorage },
    })

    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('id="password-login"')
    expect(markup).toContain('type="password"')
    expect(markup).toContain('手机号码登录')
    expect(markup).not.toContain('id="phone-login"')
    expect(markup).not.toContain('name="verificationCode"')
    expect(markup).not.toContain('输入验证码')
    expect(markup).not.toContain('输入邀请码')
  })
})

describe('signed-out login hero', () => {
  const assets = {
    zh: { file: 'login-hero-zh-v1', alt: '恭喜你！' },
    en: { file: 'login-hero-en-v1', alt: 'Congratulations!' },
    es: { file: 'login-hero-es-v1', alt: '¡Felicidades!' },
    id: { file: 'login-hero-id-v1', alt: 'Selamat!' },
    pt: { file: 'login-hero-pt-BR-v1', alt: 'Parabéns!' },
  } as const

  for (const [locale, hero] of Object.entries(assets)) {
    it(`renders only the ${locale} hero with responsive sources above the sign-in form`, () => {
      const localStorage = createStorage()
      localStorage.setItem('fenxiao-external-locale', locale)
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { location: { pathname: '/invite', search: '', origin: 'http://127.0.0.1:4173' }, localStorage },
      })

      const markup = renderToStaticMarkup(<App />)
      expect(markup).toContain(`alt="${hero.alt}`)
      expect(markup).toContain(`${hero.file}-800.webp`)
      expect(markup).toContain(`${hero.file}-1600.webp`)
      expect(markup.indexOf('consumer-login-hero')).toBeLessThan(markup.indexOf('id="phone-login"'))
      expect(markup).toContain('loading="eager"')
      for (const other of Object.values(assets).filter((asset) => asset.file !== hero.file)) {
        expect(markup).not.toContain(other.file)
      }
    })
  }

  it('keeps the hero off the signed-in invite page', () => {
    const localStorage = createStorage()
    localStorage.setItem('fenxiao-web-session', JSON.stringify({
      userId: 10001, inviteCode: 'ABCD1234', countryCode: 'BR', languageCode: 'pt-br', accessToken: 'test-token',
    }))
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { pathname: '/invite', search: '', origin: 'http://127.0.0.1:4173' }, localStorage },
    })

    const markup = renderToStaticMarkup(<App />)
    expect(markup).not.toContain('consumer-login-hero')
    expect(markup).toContain('consumer-invite-card')
  })

  it('maps a stored regional language to the matching image and page language', () => {
    const localStorage = createStorage()
    localStorage.setItem('fenxiao-external-locale', 'pt-BR')
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { pathname: '/invite', search: '', origin: 'http://127.0.0.1:4173' }, localStorage },
    })

    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('login-hero-pt-BR-v1-800.webp')
    expect(markup).toContain('Entrar com telefone')
  })
})

describe('invite page operation errors', () => {
  it('translates known backend errors into the selected page language', () => {
    expect(localizeInviteOperationError(new Error('phone number is invalid'), 'zh', 'send')).toBe('请输入有效的手机号码。')
    expect(localizeInviteOperationError(new Error('verification code expired'), 'en', 'signIn')).toBe('This verification code has expired. Request a new one.')
    expect(localizeInviteOperationError(new Error('invite code not found'), 'pt', 'signIn')).toBe('O código de convite não é válido. Confira e tente novamente.')
  })

  it('does not expose unrecognized backend error text to invitees', () => {
    expect(localizeInviteOperationError(new Error('unexpected internal detail'), 'es', 'send')).toBe('No pudimos enviar el código. Inténtalo de nuevo más tarde.')
  })
})

describe('ConsoleApp admin core distribution workspace', () => {
  beforeEach(() => {
    const localStorage = createStorage()
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          pathname: '/',
          search: '',
          origin: 'http://127.0.0.1:4173',
        },
        localStorage,
      },
    })
  })

  it('renders login as the first admin page before any backend workspace is visible', () => {
    window.location.pathname = '/manual-login'
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" />)

    expect(markup).toContain('admin-login-page')
    expect(markup).toContain('admin-login-shell')
    expect(markup).toContain('分销运营后台')
    expect(markup).toContain('后台账号')
    expect(markup).toContain('登录密码')
    expect(markup).toContain('type="password"')
    expect(markup).not.toContain('显示密码')
    expect(markup).toContain('进入后台')
    expect(markup).not.toContain('双重验证码')
    expect(markup).not.toContain('admin-login-brand-panel')
    expect(markup).not.toContain('Fx')
    expect(markup).not.toContain('渠道入口')
    expect(markup).not.toContain('登录后统一处理')
    expect(markup).not.toContain('admin-sidebar')
    expect(markup).not.toContain('分销概览')
  })

  it('shows a neutral restore state instead of the login form while a remembered session is checked', () => {
    window.location.pathname = '/'
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" />)

    expect(markup).toContain('正在恢复登录状态')
    expect(markup).not.toContain('登录密码')
    expect(markup).not.toContain('双重验证码')
  })

  it('renders a module-based admin console without a separate user-workbench mode', () => {
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)

    expect(markup).toContain('admin-console-page')
    expect(markup).toContain('admin-sidebar')
    expect(markup).toContain('admin-workspace-shell')
    expect(markup).toContain('admin-account-chip')
    expect(markup).toContain('运营账号')
    expect(markup).not.toContain('后台账号')
    expect(markup).not.toContain('登录密码')
    expect(markup).not.toContain('后台登录口令')
    expect(markup).toContain('分销概览')
    expect(markup).toContain('渠道入口')
    expect(markup).toContain('用户管理')
    expect(markup).toContain('财务管理')
    expect(markup).toContain('配置')
    expect(markup).not.toContain('>用户工作台<')
    expect(markup).not.toContain('分销用户工作台')
  })

  it('renders only the active admin module instead of stacking every function panel', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          pathname: '/',
          search: '',
          hash: '#admin-channel-entries',
          origin: 'http://127.0.0.1:4173',
        },
        localStorage: createStorage(),
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      },
    })
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)

    expect(markup).toContain('渠道入口管理')
    expect(markup).toContain('入口域名')
    expect(markup).not.toContain('收益记录管理')
    expect(markup).not.toContain('提现申请管理')
    expect(markup).not.toContain('绑定关系管理')
    expect(markup).not.toContain('公会配置管理')
    expect(markup).not.toContain('先做这 4 件事')
    expect(markup).not.toContain('当前主链顺序')
  })

  it('keeps invitation commission as a fixed read-only policy ledger', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          pathname: '/',
          search: '',
          hash: '#admin-commission-policies',
          origin: 'http://127.0.0.1:4173',
        },
        localStorage: createStorage(),
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      },
    })
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={{ ...adminTestSession, role: 'finance' }} />)

    expect(markup).toContain('邀请裂变分成规则台账')
    expect(markup).toContain('aria-label="财务管理子菜单"')
    expect(markup).toContain('收益提现')
    expect(markup).toContain('邀请裂变分成')
    expect(markup).toContain('第 1 层 · 直接邀请')
    expect(markup).toContain('第 2 层 · 间接邀请')
    expect(markup).toContain('第 3 层及以上')
    expect(markup).toContain('来源公会公司业务收入')
    expect(markup).not.toContain('新增邀请裂变规则')
    expect(markup).not.toContain('审批并启用')
  })

  it('splits system management into independent account and security pages', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          pathname: '/',
          search: '',
          hash: '#admin-account-management',
          origin: 'http://127.0.0.1:4173',
        },
        localStorage: createStorage(),
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      },
    })
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={superAdminTestSession} />)

    expect(markup).toContain('系统管理')
    expect(markup).toContain('账号管理')
    expect(markup).toContain('新增员工账号')
    expect(markup).not.toContain('修改我的密码')
    expect(markup).not.toContain('最近安全事件')
  })

  it('keeps seed inviter creation and verification-code review restricted to super administrators', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          pathname: '/',
          search: '',
          hash: '#admin-settings',
          origin: 'http://127.0.0.1:4173',
        },
        localStorage: createStorage(),
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      },
    })

    const operatorMarkup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)
    const superAdminMarkup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={superAdminTestSession} />)

    expect(operatorMarkup).not.toContain('种子邀请人')
    expect(operatorMarkup).not.toContain('验证码审查')
    expect(operatorMarkup).not.toContain('href="#admin-system-sms-whitelist"')
    expect(superAdminMarkup).toContain('种子邀请人')
    expect(superAdminMarkup).toContain('验证码审查')
    expect(superAdminMarkup).toContain('href="#admin-system-sms-whitelist"')
    expect(operatorMarkup).not.toContain('创蓝短信接口开关')
  })

  it('shows a separate SMS daily-limit whitelist page only to the super administrator', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: { pathname: '/', search: '', hash: '#admin-system-sms-whitelist', origin: 'http://127.0.0.1:4173' },
        localStorage: createStorage(),
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      },
    })

    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={superAdminTestSession} />)
    expect(markup).toContain('id="admin-sms-daily-whitelist"')
    expect(markup).toContain('每 UTC 日 5 次验证码申请上限')
    expect(markup).toContain('60 秒重发间隔')
    expect(markup).toContain('加入白名单')
    expect(markup).not.toContain('id="admin-phone-verification"')
  })
})

describe('Earnings landing page', () => {
  function mountEarningsPage(withSession = true) {
    const localStorage = createStorage()
    if (withSession) {
      localStorage.setItem('fenxiao-web-session', JSON.stringify({
        userId: 10001,
        inviteCode: 'ABCD1234',
        countryCode: 'ID',
        languageCode: 'id',
        accessToken: 'token-1',
      }))
    }
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          pathname: '/earnings',
          search: '',
          origin: 'http://127.0.0.1:4173',
        },
        localStorage,
      },
    })
  }

  beforeEach(() => {
    mountEarningsPage(true)
  })

  it('renders phone login and verification code workflow on invite page', () => {
    const localStorage = createStorage()
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          pathname: '/invite',
          search: '',
          origin: 'http://127.0.0.1:4173',
        },
        localStorage,
      },
    })
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('手机号登录')
    expect(markup).toContain('获取验证码')
    expect(markup).toContain('验证码')
    expect(markup).toContain('手机号登录')
    expect(markup).toContain('邀请码（首次注册必填）')
    expect(markup).not.toContain('立即生成邀请码')
    expect(markup).not.toContain('邀请好友')
    expect(markup).not.toContain('class="consumer-bottom-nav"')
  })

  it('localizes the invite login flow and provides a country calling-code selector', () => {
    const localStorage = createStorage()
    localStorage.setItem('fenxiao-external-locale', 'en')
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          pathname: '/invite',
          search: '',
          origin: 'http://127.0.0.1:4173',
        },
        localStorage,
      },
    })

    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('Sign in with phone')
    expect(markup).toContain('Country / calling code')
    expect(markup).toContain('Brazil +55')
    expect(markup).toContain('Indonesia +62')
    const callingCodeSelector = markup.match(/aria-label="Country \/ calling code"[^>]*>(.*?)<\/select>/)?.[1]
    expect(callingCodeSelector).toBeDefined()
    expect(callingCodeSelector?.match(/<option /g)).toHaveLength(5)
    expect(callingCodeSelector).toContain('China +86')
    expect(callingCodeSelector).toContain('Mexico +52')
    expect(callingCodeSelector).toContain('Hong Kong +852')
    expect(callingCodeSelector).not.toContain('United States +1')
    expect(markup).toContain('Enter local number')
    expect(markup).not.toContain('邀请好友')
    expect(markup).not.toContain('class="consumer-bottom-nav"')
  })

  it('renders a task-first earnings home instead of console language', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('我的收益')
    expect(markup).toContain('管理收益提现')
    expect(markup).toContain('全部记录')
    expect(markup).toContain('主要导航')
    expect(markup).not.toContain('控制台')
    expect(markup).not.toContain('工作台')
  })

  it('renders a clear linky eligibility verification workspace in admin mode', () => {
    window.location.hash = '#admin-bindings'
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)

    expect(markup).toContain('Linky 资格核验')
    expect(markup).toContain('Linky 账号')
    expect(markup).toContain('刷新资格结果')
    expect(markup).toContain('批量刷新全部 Linky 资格')
    expect(markup).toContain('批量刷新资格。')
    expect(markup).toContain('成功数量')
    expect(markup).toContain('失败数量')
    expect(markup).toContain('校验公会归属。')
  })

  it('renders a guild weekly report workspace in admin mode', () => {
    window.location.hash = '#admin-system-guilds'
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)

    expect(markup).toContain('公会周报')
    expect(markup).toContain('公会 ID')
    expect(markup).toContain('查询公会周报')
    expect(markup).toContain('按公会聚合。')
  })

  it('renders a guild config management workspace in admin mode', () => {
    window.location.hash = '#admin-system-guilds'
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)

    expect(markup).toContain('公会配置管理')
    expect(markup).toContain('查询公会配置')
    expect(markup).toContain('保存公会配置')
    expect(markup).toContain('上级用户 ID（为空则为默认公会）')
    expect(markup).toContain('公会邀请码')
    expect(markup).toContain('启用状态')
    expect(markup).toContain('维护公会映射。')
  })

  it('renders a first-level platform guild directory workspace', () => {
    window.location.hash = '#admin-platform-guild-directory'
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)

    expect(markup).toContain('平台公会目录')
    expect(markup).toContain('MCN 同步公会')
    expect(markup).toContain('最近同步批次')
    expect(markup).toContain('MCN 已缺失')
  })

  it('renders a finished withdraw approval workspace with operator audit controls in admin mode', () => {
    window.location.hash = '#admin-rewards'
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)

    expect(markup).toContain('提现申请管理')
    expect(markup).not.toContain('审批操作人 ID')
    expect(markup).not.toContain('操作角色')
    expect(markup).toContain('提现申请详情')
    expect(markup).toContain('选择一笔申请')
    expect(markup).toContain('从左侧队列选择申请后，在这里完成审核和打款留痕。')
    expect(markup).toContain('提现队列筛选')
    expect(markup).toContain('按条件查询提现申请')
    expect(markup).toContain('>重置<')
    expect(markup).not.toContain('审批备注')
  })

  it('restores the operator withdrawal queue filters between visits', () => {
    window.location.hash = '#admin-rewards'
    window.localStorage.setItem('fenxiao-admin-withdraw-query', JSON.stringify({ userId: '54001', status: 'PAYMENT_PENDING', page: '2', size: '10' }))

    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)

    expect(markup).toContain('value="54001"')
    expect(markup).toContain('<option value="PAYMENT_PENDING" selected="">待打款</option>')
  })

  it('renders channel entry management instead of a static localhost link list', () => {
    window.location.hash = '#admin-channel-entries'
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)

    expect(markup).toContain('渠道入口管理')
    expect(markup).toContain('渠道标识')
    expect(markup).toContain('入口域名')
    expect(markup).toContain('追踪参数')
    expect(markup).toContain('邀请注册入口')
    expect(markup).toContain('Linky 绑定入口')
    expect(markup).toContain('收益查看入口')
    expect(markup).toContain('复制渠道链接')
    expect(markup).not.toContain('这里统一打开和复制对外三页。')
    expect(markup).not.toContain('常用顺序：先生成邀请码，再绑定关系，最后看收益。')
  })

  it('renders invite code as a required field for profile onboarding in admin mode', () => {
    window.location.hash = '#admin-system-advanced'
    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={adminTestSession} />)

    expect(markup).toContain('邀请码（必填，首批运营请填写初始邀请码）')
    expect(markup).toContain('required=""')
  })

  it('renders a clear no-session onboarding state for first-time users', () => {
    mountEarningsPage(false)
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('登录后查看你的邀请码')
    expect(markup).toContain('使用手机号登录后即可邀请好友和查看收益。')
    expect(markup).toContain('手机号登录')
    expect(markup).not.toContain('去绑定关系')
    expect(markup).not.toContain('class="consumer-bottom-nav"')
  })

  it('lists Timo as a data-access platform option in the operations console', () => {
    window.location.pathname = '/admin'
    window.location.hash = '#admin-system-platforms'

    const markup = renderToStaticMarkup(<ConsoleApp initialViewMode="admin" initialAdminSession={superAdminTestSession} />)

    expect(markup).toContain('Timo（数据接入）')
    expect(markup).toContain('平台接入')
  })

  it('opens effective users on a dedicated page', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('href="/earnings/effective-users"')
    expect(markup).not.toContain('consumer-details')
  })

  it('moves deep team and reward details off the overview', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('href="/earnings/effective-users"')
    expect(markup).toContain('href="/earnings/activity"')
    expect(markup).not.toContain('团队本周收入')
    expect(markup).not.toContain('历史三级佣金（只读）')
    expect(markup).not.toContain('三层裂变人数')
  })

  it('renders frozen and unlocked points without enabling withdrawals', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('已解冻积分')
    expect(markup).toContain('冻结中')
    expect(markup).toContain('管理收益提现')
    expect(markup).not.toContain('申请提现')
    expect(markup).toContain('还没有收益记录')
    expect(markup).toContain('先去生成邀请码并完成绑定，后续有收益会自动显示在这里。')
    expect(markup).not.toContain('提现只会按可用奖励里的钻石数量生成申请单')
  })

  it('removes the educational earnings board from the primary journey', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('已解冻积分')
    expect(markup).toContain('我的收益')
    expect(markup).not.toContain('你的收益会在这里持续更新')
    expect(markup).not.toContain('邀请码固定不变')
  })

  it('renders reward activity without a permanent status tutorial', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('应用奖励流水')
    expect(markup).toContain('全部记录')
    expect(markup).not.toContain('状态说明')
    expect(markup).not.toContain('冻结中：奖励正在等待结算')
  })

  it('prioritizes balances over explanatory summary cards', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('已解冻积分')
    expect(markup).toContain('冻结中')
    expect(markup).toContain('本应用奖励净额')
    expect(markup).not.toContain('来自你的下线成员累计确认收益。')
  })

  it('moves secondary detail to dedicated routes', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('href="/earnings/effective-users"')
    expect(markup).toContain('href="/earnings/activity"')
    expect(markup).toContain('应用奖励流水')
    expect(markup).not.toContain('<details>')
    expect(markup).not.toContain('提现记录')
    expect(markup).not.toContain('冻结中 → 可结算 → 风险冻结')
  })

  it('maps direct rewards and legacy commission levels to safe labels', () => {
    expect(formatBusinessRewardLevel(1, 'zh')).toBe('直接邀请奖励')
    expect(formatBusinessRewardLevel(2, 'zh')).toBe('历史二级佣金（只读）')
    expect(formatBusinessRewardLevel(3, 'zh')).toBe('历史三级佣金（只读）')
    expect(formatBusinessRewardLevel(4, 'zh')).toBe('历史层级 4 佣金（只读）')
  })
})
