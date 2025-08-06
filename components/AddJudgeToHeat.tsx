// components/AddJudgeToHeat.tsx
"use client";
import { useState, FormEvent } from "react";
import Modal from "./PopUpModal";
import { toast } from "react-hot-toast";
import { Info } from "lucide-react";

interface AddJudgeToHeatModalProps {
  open: boolean;
  onClose: () => void;
  heatId: number;
  onJudgeAdded: () => void;
}

export default function AddJudgeToHeatModal({
  open,
  onClose,
  heatId,
  onJudgeAdded,
}: AddJudgeToHeatModalProps) {
  const [name, setName] = useState<string>("");
  const [header, setHeader] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/add-judge-to-heat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heat_id: Number(heatId),
          name,
          header,
        }),
      });

      if (!res.ok) throw new Error("Failed to add judge");

      toast.success("Judge successfully added to heat");
      onJudgeAdded();
      onClose();
      setName("");
      setHeader("");
    } catch (err) {
      console.error(err);
      toast.error("Error adding judge");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h3 className="text-lg font-bold mb-4 mr-4">Add Judge to Round</h3>
        <div className="flex flex-col gap-2">
          <div className="relative ml-2 group inline-block">
            <Info className="w-5 h-5 text-gray-600" />

            <div
                className={`
                invisible group-hover:visible 
                opacity-0 group-hover:opacity-100 
                transition-all duration-150
                absolute left-full top-1/2
                ml-2 w-64
                -translate-y-1/2
                bg-gray-800 text-white text-sm 
                rounded p-3 shadow
                z-10
                `}
            >
                The new judge will be assigned to only the selected division,
                round and heat. The judging panel's QR code for this judge will
                be displayed once the page is refreshed.
            </div>
        </div>


          <input
            type="text"
            placeholder="Header"
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            className="border px-2 py-1 rounded"
            required
          />
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded mt-3"
          >
            Confirm
          </button>
        </div>
      </form>
    </Modal>
  );
}
