"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GATHERING_QUESTIONS,
  type GatheringQuestion,
  type GatheringQuestionId,
  type WebsiteQuestionnaire,
  type WebsiteQuestionnaireAnswer,
} from "@/lib/web-agent-data";

export type GatheringStatus = "idle" | "thinking" | "understanding" | "building" | "asking" | "complete";

export type GatheringState = {
  status: GatheringStatus;
  questionIndex: number;
  initialPrompt: string;
  answers: Partial<WebsiteQuestionnaire>;
};

const THINKING_MS = 1100;
const UNDERSTANDING_MS = 900;
const BUILDING_MS = 1100;

type UseRequirementGatheringOptions = {
  onAskQuestion: (question: GatheringQuestion) => void;
  onComplete: (questionnaire: WebsiteQuestionnaire) => void;
};

export function useRequirementGathering({ onAskQuestion, onComplete }: UseRequirementGatheringOptions) {
  const [state, setState] = useState<GatheringState>({
    status: "idle",
    questionIndex: 0,
    initialPrompt: "",
    answers: {},
  });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onAskQuestionRef = useRef(onAskQuestion);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onAskQuestionRef.current = onAskQuestion;
    onCompleteRef.current = onComplete;
  }, [onAskQuestion, onComplete]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(fn, ms);
    timersRef.current.push(timer);
  }, []);

  const askCurrentQuestion = useCallback((questionIndex: number) => {
    const question = GATHERING_QUESTIONS[questionIndex];
    if (!question) return;
    setState((prev) => ({ ...prev, status: "asking", questionIndex }));
    onAskQuestionRef.current(question);
  }, []);

  const runProcessingSequence = useCallback(
    (nextQuestionIndex: number, answers: Partial<WebsiteQuestionnaire>) => {
      setState((prev) => ({ ...prev, status: "thinking", answers }));

      schedule(() => {
        setState((prev) => ({ ...prev, status: "understanding" }));

        schedule(() => {
          setState((prev) => ({ ...prev, status: "building" }));

          schedule(() => {
            if (nextQuestionIndex >= GATHERING_QUESTIONS.length) {
              const questionnaire = answers as WebsiteQuestionnaire;
              setState((prev) => ({ ...prev, status: "complete", answers: questionnaire }));
              onCompleteRef.current(questionnaire);
              return;
            }
            askCurrentQuestion(nextQuestionIndex);
          }, BUILDING_MS);
        }, UNDERSTANDING_MS);
      }, THINKING_MS);
    },
    [askCurrentQuestion, schedule]
  );

  const start = useCallback(
    (initialPrompt: string) => {
      clearTimers();
      setState({
        status: "thinking",
        questionIndex: 0,
        initialPrompt,
        answers: { initialPrompt },
      });

      schedule(() => {
        setState((prev) => ({ ...prev, status: "understanding" }));

        schedule(() => {
          setState((prev) => ({ ...prev, status: "building" }));

          schedule(() => {
            askCurrentQuestion(0);
          }, BUILDING_MS);
        }, UNDERSTANDING_MS);
      }, THINKING_MS);
    },
    [askCurrentQuestion, clearTimers, schedule]
  );

  const submitAnswer = useCallback(
    (questionId: GatheringQuestionId, answer: string | WebsiteQuestionnaireAnswer) => {
      setState((prev) => {
        if (prev.status !== "asking") return prev;

        const nextAnswers: Partial<WebsiteQuestionnaire> = {
          ...prev.answers,
          initialPrompt: prev.initialPrompt,
        };

        if (questionId === "websiteName") {
          nextAnswers.websiteName = String(answer).trim();
        } else {
          nextAnswers[questionId] = answer as WebsiteQuestionnaireAnswer;
        }

        const nextIndex = prev.questionIndex + 1;
        queueMicrotask(() => runProcessingSequence(nextIndex, nextAnswers));
        return { ...prev, answers: nextAnswers };
      });
    },
    [runProcessingSequence]
  );

  const reset = useCallback(() => {
    clearTimers();
    setState({ status: "idle", questionIndex: 0, initialPrompt: "", answers: {} });
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const currentQuestion = state.status === "asking" ? GATHERING_QUESTIONS[state.questionIndex] : null;
  const isActive = state.status !== "idle" && state.status !== "complete";

  return {
    state,
    currentQuestion,
    isActive,
    isComplete: state.status === "complete",
    start,
    submitAnswer,
    reset,
  };
}
