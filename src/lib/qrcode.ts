import QRCode from 'qrcode';

export async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 200,
      color: {
        dark: '#0f172a', // Navy dark
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR Code generation error:', err);
    return '';
  }
}
