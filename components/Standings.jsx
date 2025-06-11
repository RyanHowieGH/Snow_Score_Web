const Standings = ({ title, data }) => (
  <div className="bg-white shadow rounded p-4">
    <h2 className="font-semibold mb-2">{title}</h2>
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="border-b">
          <th>Rank</th>
          <th>Athlete</th>
          <th>Best</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b">
            <td>{i + 1}</td>
            <td>{row.athlete}</td>
            <td>{row.best}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Standings;
