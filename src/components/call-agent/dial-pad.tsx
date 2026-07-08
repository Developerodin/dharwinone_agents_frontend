"use client";

const DIAL_KEYS: { digit: string; sub?: string }[] = [
  { digit: "1" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "*" },
  { digit: "0", sub: "+" },
  { digit: "#" },
];

type DialPadProps = {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
};

export function DialPad({ onKeyPress, onBackspace, disabled }: DialPadProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 justify-items-center max-w-[240px] mx-auto">
        {DIAL_KEYS.map((key) => (
          <button
            key={key.digit}
            type="button"
            disabled={disabled}
            onClick={() => onKeyPress(key.digit)}
            className="dial-key disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="text-xl leading-none">{key.digit}</span>
            {key.sub && <span className="dial-key-sub">{key.sub}</span>}
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          disabled={disabled}
          onClick={onBackspace}
          className="text-sm font-medium text-textmuted hover:text-defaulttextcolor px-4 py-2 rounded-lg hover:bg-light transition-colors disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
