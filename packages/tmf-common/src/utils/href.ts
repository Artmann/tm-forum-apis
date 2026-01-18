export interface HrefOptions {
  baseUrl: string
  basePath: string
}

export function createHref(
  options: HrefOptions,
  resourcePath: string,
  id: string
): string {
  const { baseUrl, basePath } = options
  const normalizedBase = baseUrl.replace(/\/$/, '')
  const normalizedBasePath = basePath.replace(/^\//, '').replace(/\/$/, '')
  const normalizedResource = resourcePath.replace(/^\//, '').replace(/\/$/, '')

  return `${normalizedBase}/${normalizedBasePath}/${normalizedResource}/${id}`
}

export function createHrefFactory(options: HrefOptions) {
  return (resourcePath: string, id: string) => createHref(options, resourcePath, id)
}
