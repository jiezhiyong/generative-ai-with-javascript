"use client";

import { Spinner } from "@/components/custom/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import Image from "next/image";
import { useRef, useState } from "react";

export default function Chat() {
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    error,
    reload,
  } = useChat({
    api: "/api/chat",
    headers: {
      Authorization: "your_token",
    },
    body: {
      user_id: "123",
    },
    credentials: "same-origin",
    maxSteps: 5,
    experimental_throttle: 50,
    onFinish: (message, { usage, finishReason }) => {
      console.log("Finished streaming message:", message);
      console.log("Token usage:", usage);
      console.log("Finish reason:", finishReason);
    },
    onError: (error) => {
      console.error("An error occurred:", error);
    },
    onResponse: (response) => {
      console.log("Received HTTP response from server:", response);
    },
  });

  const handleDelete = (id: string) => {
    setMessages(messages.filter((message) => message.id !== id));
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => {
        const messageSources = message.parts.filter(
          (part) => part.type === "source"
        );
        const messageOther = message.parts.filter(
          (part) => part.type !== "source"
        );

        return (
          <div key={message.id} className="whitespace-pre-wrap">
            {/* Role */}
            {message.role === "user" ? "User: " : "AI: "}

            {/* Sources */}
            {messageSources.map((part) => (
              <span key={`source-${part.source.id}`}>
                [
                <a href={part.source.url} target="_blank">
                  {part.source.title ?? new URL(part.source.url).hostname}
                </a>
                ]
              </span>
            ))}

            {/* Content */}
            {messageOther.map((part, i) => {
              if (part.type === "reasoning") {
                return (
                  <pre key={i}>
                    {part.details.map((detail) =>
                      detail.type === "text" ? detail.text : "<redacted>"
                    )}
                  </pre>
                );
              } else if (part.type === "text") {
                return <div key={i}>{part.text}</div>;
              } else if (part.type === "tool-invocation") {
                return (
                  <pre key={i}>
                    {JSON.stringify(part.toolInvocation, null, 2)}
                  </pre>
                );
              } else if (
                part.type === "file" &&
                part.mimeType.startsWith("image/")
              ) {
                return (
                  <Image
                    key={i}
                    src={`data:${part.mimeType};base64,${part.data}`}
                    alt=""
                    width={200}
                  />
                );
              }
            })}

            {/* Attachments */}
            <div>
              {message.experimental_attachments
                ?.filter((attachment) =>
                  attachment?.contentType?.startsWith("image/")
                )
                .map((attachment, index) => (
                  <Image
                    key={`${message.id}-${index}`}
                    src={attachment?.url ?? ""}
                    alt={attachment?.name ?? ""}
                    width={200}
                  />
                ))}
            </div>

            {/* Delete */}
            <Button
              variant="destructive"
              onClick={() => handleDelete(message.id)}
            >
              Delete
            </Button>

            {/* Regenerate */}
            <Button
              variant="outline"
              onClick={() => reload()}
              disabled={!(status === "ready" || status === "error")}
            >
              Regenerate
            </Button>
          </div>
        );
      })}

      {/* Error */}
      {error && (
        <>
          <div>An error occurred.</div>
          <Button variant="outline" onClick={() => reload()}>
            Retry
          </Button>
        </>
      )}

      {/* Spinner */}
      {status === "submitted" && <Spinner />}

      {/* Form */}
      <form
        onSubmit={(event) => {
          handleSubmit(event, {
            experimental_attachments: files,
            body: { customKey: "customValue" },
          });

          setFiles(undefined);

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
      >
        <div className="fixed bottom-0 w-full max-w-md p-2 mb-8">
          <div className="flex gap-3 mb-3">
            <Input
              value={input}
              placeholder="Say something..."
              onChange={handleInputChange}
            />

            {status === "submitted" || status === "streaming" ? (
              <Button variant="destructive" onClick={stop}>
                Stop
              </Button>
            ) : (
              <Button type="submit">Submit</Button>
            )}
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(event) => {
              if (event.target.files) {
                setFiles(event.target.files);
              }
            }}
          />
        </div>
      </form>
    </div>
  );
}
