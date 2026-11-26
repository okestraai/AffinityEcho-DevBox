import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { showToast } from "../../Helper/ShowToast";
import { secondaryButton } from "./parts";

export type CoverChoice = { file: Blob | null; remove: boolean };

const MAX_SIDE = 1600;

// Redraws the photo at most 1600px wide as a JPEG. That keeps it small and drops camera and location data.
async function shrinkImage(file: File, maxBytes: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", quality));
    if (blob && blob.size <= maxBytes) return blob;
  }
  throw new Error("too big");
}

// The optional cover picture: choose, preview, replace or remove. It uploads when the event is saved.
export function CoverPicker({ currentUrl, onChange, maxMb = 2 }: { currentUrl: string | null; onChange: (choice: CoverChoice) => void; maxMb?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const shown = preview ?? (removed ? null : currentUrl);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Choose a picture file.", "error");
    try {
      const blob = await shrinkImage(file, maxMb * 1024 * 1024);
      setPreview(URL.createObjectURL(blob));
      setRemoved(false);
      onChange({ file: blob, remove: false });
    } catch {
      showToast("That picture couldn't be used. Try a JPEG or PNG.", "error");
    }
  };

  const clear = () => {
    setPreview(null);
    setRemoved(true);
    if (input.current) input.current.value = "";
    onChange({ file: null, remove: !!currentUrl });
  };

  return (
    <div>
      <input ref={input} id="ev-cover" type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="sr-only"
        onChange={(e) => pick(e.target.files?.[0])} />
      {shown ? (
        <div className="space-y-3">
          <img src={shown} alt="Cover preview" className="w-full aspect-[16/7] object-cover rounded-xl border border-slate-200" />
          <div className="flex flex-wrap gap-2">
            <label htmlFor="ev-cover" className={`${secondaryButton} cursor-pointer`}><ImagePlus className="w-4 h-4" /> Replace</label>
            <button type="button" onClick={clear} className={secondaryButton}><Trash2 className="w-4 h-4" /> Remove</button>
          </div>
        </div>
      ) : (
        <label htmlFor="ev-cover"
          className="flex flex-col items-center justify-center gap-2 w-full aspect-[16/7] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 text-slate-600 hover:border-purple-300 hover:text-purple-700 cursor-pointer transition-colors">
          <ImagePlus className="w-7 h-7" />
          <span className="text-sm font-semibold">Add a cover picture</span>
          <span className="text-xs text-slate-500">Optional. JPEG or PNG; large photos are made smaller.</span>
        </label>
      )}
    </div>
  );
}
