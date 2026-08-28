/** A API oficial do TSE usa este retrato-silhueta quando não existe foto de candidatura publicada. */
export function isOfficialTsePhotoPlaceholder(width: number, height: number): boolean {
  return width === 171 && height === 235;
}
