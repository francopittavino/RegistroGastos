import { ImageResponse } from 'next/og';
import { IconMark } from '../icon-mark';

export async function GET() {
  return new ImageResponse(<IconMark size={140} />, { width: 192, height: 192 });
}
