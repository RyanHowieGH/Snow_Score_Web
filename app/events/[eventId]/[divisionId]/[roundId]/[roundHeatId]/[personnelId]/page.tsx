import { fetchJudgingPanelDataByEventId, fetchJudgingPanelPasscode } from '@/lib/data';
import JudgingPanelClient from './JudgingPanelClient';

type JudgingPanelPageProps = {
  params: {
    eventId: number | string;
    divisionId: number | string;
    roundId: number | string;
    roundHeatId: number | string;
    personnelId: number | string;
  };
};

export default async function JudgingPanelPage({ params }: JudgingPanelPageProps) {
  const {
    eventId,
    divisionId,
    roundId,
    roundHeatId,
    personnelId,
  } = params;

  const event_id = Number(eventId);
  const division_id = Number(divisionId);
  const round_id = Number(roundId);
  const round_heat_id = Number(roundHeatId);
  const personnel_id = Number(personnelId);

  const judgingPanels = await fetchJudgingPanelDataByEventId(event_id);
  if (!judgingPanels || !judgingPanels[0]) {
    return <div>Judging Panel not found.</div>;
  }

  const judgePasscode = await fetchJudgingPanelPasscode(personnel_id);
  if (!judgePasscode) {
    return <div>Judge Passcode not found.</div>;
  }
  

  return (
    <JudgingPanelClient
      judgingPanelPasscode={String(judgePasscode)}
      eventId={event_id}
      divisionId={division_id}
      roundId={round_id}
      roundHeatId={round_heat_id}
      personnelId={personnel_id}
    />
  );
}
