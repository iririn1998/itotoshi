/**
 * Content-Type が JSON として受け付けられるか判定する。
 *
 * charset 付きの application/json と、+json サフィックスを持つメディアタイプを許可する。
 */
export const isJsonContentType = (contentType: string | undefined): boolean => {
  if (contentType === undefined) {
    return false;
  }

  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();

  return mediaType === "application/json" || mediaType?.endsWith("+json") === true;
};
