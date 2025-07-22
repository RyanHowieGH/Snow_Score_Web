import { fetchJudgingPanelDataByEventId, fetchJudgingPanelPasscode } from '@/lib/data';
import JudgingPanelClient from '../../../../../../../components/JudgingPanelClient';

type JudgingPanelPageProps = {
  params: {
    eventId: number;
    divisionId: number;
    roundId: number;
    roundHeatId: number;
    personnelId: number;
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
          judgingPanelPasscode={judgePasscode}
          eventId={event_id}
          divisionId={division_id}
          roundId={round_id}
          roundHeatId={round_heat_id}
          personnelId={personnel_id}
          eventName={judgingPanels[0].name}
        />
  );
}