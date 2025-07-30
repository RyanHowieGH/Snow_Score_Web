

type roundHeatData = {
  eventId: number;
  divisionId: number;
  roundId: number;
  roundHeatId: number;
  roundName: string;
};

type heatData = {
  bib: number;
  athleteId: number;
  firstName: string;
  lastName: string;
  calcScore: number;
};

interface PageProps {
  params: {
    eventId: string;
    divisionId: string;
    roundId: string;
    roundHeatId: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const { eventId, divisionId, roundId, roundHeatId } = params;

  let roundHeatData: roundHeatData | null = null;
  let heatDataArr: heatData[] = [];

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL ?? ""
      }/api/public-leaderboard-preset-data/${eventId}/${divisionId}/${roundId}/${roundHeatId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch round heat data");
    }
    roundHeatData = await response.json();
  } catch (error) {
    console.error("Error fetching round heat data:", error);
    return <div>Error loading round heat data.</div>;
  }

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL ?? ""
      }/api/public-round-data/${eventId}/${divisionId}/${roundId}/${roundHeatId}`,
      { cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch heat data");
    }
    heatDataArr = await response.json();
  } catch (error) {
    console.error("Error fetching heat data:", error);
    return <div>Error loading heat data.</div>;
  }

  return (
    <div>
      <h1>Heat Results</h1>
      {roundHeatData ? (
        <div>
          <h2>{roundHeatData.roundName}</h2>
          <ul>
            {heatDataArr.map((athlete) => (
              <li key={athlete.athleteId}>
                {athlete.firstName} {athlete.lastName} - Score:{" "}
                {athlete.calcScore}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>No data available for this round heat.</div>
      )}
    </div>
  );
};

export default Page;
