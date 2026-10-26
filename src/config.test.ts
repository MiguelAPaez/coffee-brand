import { VIDEO_URL, VIDEO_URL_MOBILE, pickVideoUrl } from '@/config'

function stubViewport(width: number, saveData?: boolean) {
  vi.stubGlobal('innerWidth', width)
  vi.stubGlobal('navigator', { connection: saveData === undefined ? undefined : { saveData } })
}

describe('pickVideoUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('serves the mobile video on a narrow viewport', () => {
    stubViewport(500)
    expect(pickVideoUrl()).toBe(VIDEO_URL_MOBILE)
  })

  it('serves the full video on a wide viewport', () => {
    stubViewport(1440)
    expect(pickVideoUrl()).toBe(VIDEO_URL)
  })

  it('serves the mobile video on a wide viewport with saveData', () => {
    stubViewport(1440, true)
    expect(pickVideoUrl()).toBe(VIDEO_URL_MOBILE)
  })
})
