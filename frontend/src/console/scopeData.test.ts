import { describe, expect, it } from 'vitest'
import { onlyConsolePlatform } from './scopeData'

describe('new console platform data scope', () => {
  it('never displays records for another workspace when the API returns mixed rows', () => {
    const rows = [
      { platformCode: 'LINKY', id: 1 },
      { platformCode: 'TIMO', id: 2 },
      { platformCode: 'linky', id: 3 },
    ]
    expect(onlyConsolePlatform(rows, 'LINKY').map((item) => item.id)).toEqual([1, 3])
    expect(onlyConsolePlatform(rows, 'TIMO').map((item) => item.id)).toEqual([2])
  })
})
