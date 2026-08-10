"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import { toast } from "sonner";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface VapiTranscriptMessage {
  type: string;
  transcriptType?: string;
  role?: "user" | "assistant" | "system";
  transcript?: string;
}

interface AgentProps {
  userName: string;
  userId: string;
  type: "generate" | "interview";
  questions?: string[];
  interviewId?: string;
}

const Agent = ({
  userName,
  userId,
  type,
  questions,
  interviewId,
}: AgentProps) => {
  const router = useRouter();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(
    CallStatus.INACTIVE
  );
  const [messages, setMessages] = useState<SavedMessage[]>([]);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
    };

    const onMessage = (message: unknown) => {
      if (!message || typeof message !== "object") {
        return;
      }

      const data = message as VapiTranscriptMessage;

      if (
        data.type === "transcript" &&
        data.transcriptType === "final" &&
        typeof data.transcript === "string" &&
        data.role
      ) {
        const newMessage: SavedMessage = {
          role: data.role,
          content: data.transcript,
        };

        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
    };

    const onError = (error: unknown) => {
      let errorMessage = "Something went wrong. Please try again.";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        const errorObject = error as {
          message?: unknown;
          error?: {
            message?: unknown;
          };
        };

        if (typeof errorObject.message === "string") {
          errorMessage = errorObject.message;
        } else if (
          errorObject.error &&
          typeof errorObject.error.message === "string"
        ) {
          errorMessage = errorObject.error.message;
        }
      }

      console.error("Vapi error:", error);

      setCallStatus(CallStatus.INACTIVE);
      setIsSpeaking(false);

      toast.error(`Error: ${errorMessage}`);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  const handleGenerateFeedback = useCallback(
    async (transcript: SavedMessage[]) => {
      if (!interviewId || !userId) {
        toast.error("Missing interview or user information.");
        router.push("/");
        return;
      }

      try {
        const { success, feedbackId } = await createFeedback({
          interviewId,
          userId,
          transcript,
        });

        if (success && feedbackId) {
          router.push(`/interview/${interviewId}/feedback`);
} else {
  toast.error("Error saving feedback.");
  router.push("/");
}
} catch (error) {
  console.error("Feedback error:", error);

  toast.error("Something went wrong while saving feedback.");
  router.push("/");
}
},
[interviewId, userId, router]
);

useEffect(() => {
  if (callStatus !== CallStatus.FINISHED) {
    return;
  }

  if (type === "generate") {
    router.push("/");
    return;
  }

  if (messages.length > 0) {
    void handleGenerateFeedback(messages);
  }
}, [callStatus, type, messages, handleGenerateFeedback, router]);

const handleCall = async () => {
  if (callStatus === CallStatus.CONNECTING || callStatus === CallStatus.ACTIVE) {
    return;
  }

  const assistantId = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

  if (!assistantId && type === "generate") {
    toast.error("VAPI assistant ID is missing.");
    return;
  }

  setCallStatus(CallStatus.CONNECTING);

  try {
    if (type === "generate") {
      await vapi.start(assistantId!, {
        variableValues: {
          username: userName,
          userid: userId,
        },
      });
    } else {
      const formattedQuestions =
          questions?.map((question) => `- ${question}`).join("\n") ?? "";

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    }
  } catch (error) {
    console.error("Failed to start Vapi call:", error);

    setCallStatus(CallStatus.INACTIVE);
    setIsSpeaking(false);

    let errorMessage = "Unable to start the interview.";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    toast.error(errorMessage);
  }
};

const handleDisconnectCall = () => {
  try {
    vapi.stop();
  } catch (error) {
    console.error("Failed to stop Vapi call:", error);
    setCallStatus(CallStatus.INACTIVE);
  }
};

const latestMessage = messages[messages.length - 1]?.content;

const isCallInactiveOrFinished =
    callStatus === CallStatus.INACTIVE ||
    callStatus === CallStatus.FINISHED;

return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
                src="/ai-avatar.png"
                alt="AI interviewer"
                width={65}
                height={54}
                className="object-cover"
            />

            {isSpeaking && <span className="animate-speak" />}
          </div>

          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
                src="/profile.svg"
                alt="User avatar"
                className="size-[120px] rounded-full object-cover"
                width={540}
                height={540}
            />

            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && latestMessage && (
          <div className="transcript-border">
            <div className="transcript">
              <p
                  key={latestMessage}
                  className={cn(
                      "opacity-0 transition-opacity duration-500",
                      "animate-fadeIn opacity-100"
                  )}
              >
                {latestMessage}
              </p>
            </div>
          </div>
      )}

      <div className="flex w-full justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
            <button
                type="button"
                className="relative btn-call"
                onClick={handleCall}
                disabled={callStatus === CallStatus.CONNECTING}
            >
            <span
                className={cn(
                    "absolute animate-ping rounded-full opacity-75",
                    callStatus !== CallStatus.CONNECTING && "hidden"
                )}
            />

              <span>
              {isCallInactiveOrFinished ? "Call" : ". . ."}
            </span>
            </button>
        ) : (
            <button
                type="button"
                className="btn-disconnect"
                onClick={handleDisconnectCall}
            >
              End
            </button>
        )}
      </div>
    </>
);
};

export default Agent;

