'use client'
import HeatTable from "../../../../components/HeatTable";
import Standing from "../../../../components/Standings";

const page = () => {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6 bg-gray-100 grid grid-cols-1 gap-6">
        <HeatTable/>
        <HeatTable
          title="Heat 2 Judge Scores"
          data={[
            {
              bib: 21,
              athlete: "Fynn Bullock-Womble",
              rank: 5,
              run1: 88.33,
              run2: "DNI",
              best: 88.33,
            },
            {
              bib: 22,
              athlete: "Chunyu Ge",
              rank: 11,
              run1: 16.0,
              run2: 65.0,
              best: 65.0,
            },
          ]}
        />
      </main>

      <aside className="w-96 p-6 bg-white space-y-6">
        <Standing
          title="Heat 1 Standings"
          data={[
            { athlete: "Brooklyn DePriest", best: 90.33 },
            { athlete: "Oliver Martin", best: 90.0 },
            { athlete: "Fynn Bullock-Womble", best: 88.33 },
            { athlete: "Chunyu Ge", best: 65.0 },
          ]}
        />
        <Standing
          title="Heat 2 Standings"
          data={[
            { athlete: "Brian Rice", best: 93.0 },
            { athlete: "Kobe Cantelon", best: 92.0 },
          ]}
        />
      </aside>
    </div>
  );
};

export default page;
