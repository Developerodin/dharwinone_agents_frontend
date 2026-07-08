"use client";

import { useState } from "react";
import type { GatheringQuestionId, QuestionnaireOption, WebsiteQuestionnaireAnswer } from "@/lib/web-agent-data";
import { BotIcon } from "@/components/icons";

type ConversationQuestionProps = {
  question: string;
  questionId: GatheringQuestionId;
  options: QuestionnaireOption[];
  otherPlaceholder?: string;
  onAnswer: (questionId: GatheringQuestionId, answer: WebsiteQuestionnaireAnswer) => void;
  centered?: boolean;
};

export function ConversationQuestion({
  question,
  questionId,
  options,
  otherPlaceholder = "Enter your requirements",
  onAnswer,
  centered,
}: ConversationQuestionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");

  const isOtherSelected = selectedId === "other";
  const canSubmit = selectedId !== null && (!isOtherSelected || otherText.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit || !selectedId) return;
    if (isOtherSelected) {
      onAnswer(questionId, { value: "other", otherText: otherText.trim() });
      return;
    }
    onAnswer(questionId, { value: selectedId });
  };

  return (
    <div className={`wa-animate-fade-up mb-4 flex ${centered ? "justify-start" : "justify-start"}`}>
      {!centered && (
        <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-green/10">
          <BotIcon className="h-4 w-4 text-brand-green" />
        </div>
      )}
      <div className="flex max-w-[88%] flex-col items-start">
        <div className="wa-chat-bubble-ai rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed text-defaulttextcolor">
          <p className="m-0 mb-3 font-medium">{question}</p>
          <div className="flex flex-col gap-2">
            {options.map((option) => {
              const isSelected = selectedId === option.id;
              return (
                <div key={option.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(option.id)}
                    className={`wa-questionnaire-option text-left ${isSelected ? "wa-questionnaire-option-selected" : ""}`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected ? "border-brand-green bg-brand-green" : "border-defaultborder/80"
                      }`}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-sm">{option.label}</span>
                  </button>
                  {option.id === "other" && isOtherSelected && (
                    <input
                      type="text"
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder={otherPlaceholder}
                      className="wa-questionnaire-input mt-2.5 w-full"
                      autoFocus
                    />
                  )}
                </div>
              );
            })}
          </div>
          {selectedId !== null && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="ti-btn ti-btn-primary-full ti-btn-sm gap-1.5 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
