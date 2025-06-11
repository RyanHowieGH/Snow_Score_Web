const HeatTable = ({ title, data }) => (
  <div className="bg-white shadow rounded p-4">
    <h2 className="font-semibold mb-2">{title}</h2>
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="border-b">
          <th>Bib</th>
          <th>Athlete</th>
          <th>Rank</th>
          <th>Run 1</th>
          <th>Run 2</th>
          <th>Best</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b">
            <td>{row.bib}</td>
            <td>{row.athlete}</td>
            <td>{row.rank}</td>
            <td>{row.run1}</td>
            <td>{row.run2}</td>
            <td>{row.best}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default HeatTable;
