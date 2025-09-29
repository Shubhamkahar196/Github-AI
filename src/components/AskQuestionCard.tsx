"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { api } from "@/trpc/react";
import useProject from "@/hooks/use-project";

const AskQuestionCard = () => {
  const { projectId } = useProject();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const askQuestion = api.project.askQuestion.useMutation();

  const handleAsk = async () => {
    if (!projectId || !question) return;
    try {
      const response = await askQuestion.mutateAsync({ projectId, question });
      setAnswer(response.answer);
    } catch (error) {
      setAnswer("Error getting answer");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask AI about the project</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Ask a question about the project..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button onClick={handleAsk} className="mt-2">
          Ask
        </Button>
        {answer && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AskQuestionCard;
