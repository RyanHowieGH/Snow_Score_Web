// npm install qrcode
import { fetchEventById, formatDateRange } from "@/lib/data";
import { notFound } from "next/navigation"; // Keep if you use notFound()

type ComponentProps = {
  judgeUid: Promise<{ judgeId: string }>;
  judgeHeader: Promise<{ judgeHeader: string }>;
  judgeName: Promise<{judgeName: string}>
};

export default async function JudgePanelURLSection(props: ComponentProps) {
  const actualJudgeUid = await props.judgeUid;
  const judgeId = String(actualJudgeUid.judgeId); 

  const actualJudgeHeader = await props.judgeHeader;
  const judgeHeader = String(actualJudgeHeader.judgeHeader); 

  const actualJudgeName = await props.judgeName;
  const judgeName = String(actualJudgeName.judgeName); 

  if (judgeId == null) {
    notFound(); // USE notFound
  }

  const judgeUidToURL = await fetchJudgeById(judgeId);

  if (!judgeUidToURL) {
    notFound(); // USE notFound
  }

  return (
    <main>
        {event.divisions && event.divisions.length > 0 && (
            <div className="mb-6 flex flex-col md:flex-row md:justify-between gap-8 md:gap-12">
                <div>
                    <h2 className="text-xl font-semibold mb-2 text-secondary">
                    Divisions
                    </h2>
                    <ul className="list-disc list-inside space-y-1">
                    {event.divisions.map((division) => (
                        <li
                        key={division.division_id}
                        className="text-base-content"
                        >
                        {division.division_name}
                        </li>
                    ))}
                    </ul>
                </div>
            </div>
        )}
    </main>
)};