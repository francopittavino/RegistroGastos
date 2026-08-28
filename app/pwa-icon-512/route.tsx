import { ImageResponse } from 'next/og';
import { IconMark } from '../icon-mark';

export async function GET() {
  return new ImageResponse(<IconMark size={370} />, { width: 512, height: 512 });
}
