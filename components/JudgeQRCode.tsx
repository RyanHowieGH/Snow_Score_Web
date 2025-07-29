import { toDataURL } from 'qrcode';
import CopyUrlButton from './CopyURLButton';

export default async function JudgeQRCode(
  eventId: string, 
  divisionId: string, 
  roundId: string,
  roundHeatId: string,
  personnelId: string,
  passcode: number) {

  const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL_PROD}/events`;
  const url = `${baseUrl}/${eventId}/${divisionId}/${roundId}/${roundHeatId}/${personnelId}`;
  const dataUrl = await toDataURL(url);
  return (
    <div className="flex flex-col items-center">
        <img
          src={dataUrl}
          alt={'QR code for judging panel.'}
          width={200}
          height={200}
        />        
        <div className='flex mt-1'>
          <div className='font-bold mr-1'>Access code: </div>
          <div>
            {passcode}
          </div>
        </div>
        <CopyUrlButton 
        url={url} />
    </div>    
  );
}
