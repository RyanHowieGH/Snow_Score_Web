import { toDataURL } from "qrcode";

export default async function JudgeQRCode(event_id: any, judge_id: string) {

  let qrcode = toDataURL(`${event_id}${judge_id}` )

  return (
    <main>
      <div>{qrcode}</div>
    </main>
)};