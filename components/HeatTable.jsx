const HeatTable = ({ title, data }) => {
  // Find the maximum number of runs in the data
  const maxRuns = Math.max(
    0,
    ...data.map((row) => (Array.isArray(row.runs) ? row.runs.length : 0))
  );

  return (
    <div className="bg-white shadow rounded p-4 max-h-[400px] overflow-y-auto">
      <h2 className="font-semibold mb-4 text-center">{title}</h2>
      <table className="w-full text-sm text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-gray-600">
            <th>Bib</th>
            <th>Athlete</th>
            <th>Rank</th>
            {[...Array(maxRuns)].map((_, i) => (
              <th key={i}>{`Run ${i + 1}`}</th>
            ))}
            <th>Best</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="bg-white shadow-sm rounded-lg">
              <td className="p-2">{row.bib}</td>
              <td className="p-2 font-medium">{row.athlete}</td>
              <td className="p-2">{row.rank}</td>
              {[...Array(maxRuns)].map((_, runIdx) => (
                <td className="p-2" key={runIdx}>
                  {row.runs && row.runs[runIdx] !== undefined
                    ? Array.isArray(row.runs[runIdx])
                      ? row.runs[runIdx].map((score, j) => (
                          <div key={j} className="text-xs">
                            {score}
                          </div>
                        ))
                      : row.runs[runIdx]
                    : ""}
                </td>
              ))}
              <td className="p-2 font-semibold">{row.best}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HeatTable;
