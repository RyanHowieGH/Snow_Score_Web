const Standings = ({ title, data }) => (
  <div className="bg-white shadow rounded p-4 max-h-[400px] overflow-y-auto">
    <h2 className="font-semibold mb-4 text-center">{title}</h2>
    <table className="w-full text-sm text-left border-separate border-spacing-y-2">
      <thead>
        <tr className="text-gray-600">
          <th>Rank</th>
          <th>Athlete</th>
          <th>Best</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="bg-white shadow-sm rounded-lg">
            <td className="p-2">{i + 1}</td>
            <td className="p-2 font-medium">{row.athlete}</td>
            <td className="p-2 font-semibold">{row.best}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Standings;
