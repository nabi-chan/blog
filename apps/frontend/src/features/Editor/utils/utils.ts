export function isMacOS() {
  return navigator.platform.match(/Macintosh|MacIntel|MacPPC|Mac68K/) !== null
}

export function isModifierKey(
  event: KeyboardEvent | React.KeyboardEvent<unknown>
) {
  return isMacOS() ? event.metaKey : event.ctrlKey
}
