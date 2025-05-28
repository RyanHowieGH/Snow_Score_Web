import { toDataURL } from 'qrcode';

export default async function JudgeQRCode(eventId: string, judgeId: string) {

  const urlToken = `https://snow-score-web.vercel.app/${eventId}${judgeId}`;
  const dataUrl = await toDataURL(urlToken);

  return (
    <main>
      <img
        src={dataUrl}
        alt={'QR code for judging panel.'}
        width={200}
        height={200}
      />
      
    </main>
  );
}