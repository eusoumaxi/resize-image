import sharp from 'sharp';

export const isJpg = (buffer: Buffer) => {
  if (!buffer || buffer.length < 3) {
    return false;
  }

  return buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
};

export const isPng = (buffer: Buffer) => {
  if (!buffer || buffer.length < 8) {
    return false;
  }

  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
};

export const resizeImg = async (
  body: Buffer,
  resize: number[],
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    sharp(body)
      .resize(...resize)
      .toBuffer()
      .then((result) => resolve(result))
      .catch((e) => reject(e));
  });
