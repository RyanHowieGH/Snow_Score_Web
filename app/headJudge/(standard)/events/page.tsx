import HeatTable from "../../../components/HeatTable";
import Standing from "../../../../components/Standing";

const page = () => {
  return (
    <div className="flex min-h-screen">
      <main className="flex-2 p-6 bg-gray-100">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <HeatTable
              title="Heat 1 Judge Scores"
              data={[
                {
                  bib: 20,
                  athlete: "Oliver Martin",
                  rank: 2,
                  run1: 90.0,
                  run2: "DNI",
                  best: 90.0,
                },
                {
                  bib: 23,
                  athlete: "Brooklyn DePriest",
                  rank: 1,
                  run1: 16.33,
                  run2: 90.33,
                  best: 90.33,
                },
              ]}
            />
          </div>
          <div className="w-80">
            <Standing
              title="Heat 1 Standings"
              data={[
                { athlete: "Brooklyn DePriest", best: 90.33 },
                { athlete: "Oliver Martin", best: 90.0 },
              ]}
            />
          </div>
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
          <div className="w-80">
            <Standing
              title="Heat 2 Standings"
              data={[
                { athlete: "Brian Rice", best: 93.0 },
                { athlete: "Kobe Cantelon", best: 92.0 },
              ]}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default page;
