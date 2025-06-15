// npm install qrcode
import { toDataURL } from 'qrcode';

export default async function JudgeQRCode(
  eventId: string, 
  divisionId: string, 
  roundId: string,
  roundHeatId: string,
  personnelId: string) {

  const baseUrl = "http://localhost:3000/events";
  const url = `${baseUrl}/${eventId}/${divisionId}/${roundId}/${roundHeatId}/${personnelId}`;
  const dataUrl = await toDataURL(url);
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

/* e.g.
  events/7/3/1/1001/1
  event_id: 7 
  division_id: 3 
  round_id: 1 
  round_heat_id: 1001 
  personnel_id: 1
*/
