"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogHeader } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useProject from "@/hooks/use-project";
import MDEditor from "@uiw/react-md-editor";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import React, { useState } from "react";
import Image from "next/image";
import { askQuestion } from "./actions";
import { readStreamableValue } from "@ai-sdk/rsc";
import CodeReferences from "./code-references";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import useRefetch from "@/hooks/use-refetch";
const AskQuestionCard = () => {
  const { project } = useProject();
  const [question, setQuestion] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileReferences, setFileReferences] = useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [answer, setAnswer] = useState("");
  const saveAnswer = api.project.saveAnswer.useMutation()




  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setAnswer("");
    setFileReferences([]);
    e.preventDefault();
    if (!project?.id) return;
    setLoading(true);
    setOpen(true);

    const { output, fileReferences } = await askQuestion(question, project.id);
    setOpen(true);

    setFileReferences(fileReferences);

    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setAnswer((ans) => ans + delta);
      }
    }
    setLoading(false);
  };

  const refetch = useRefetch()


  return (
    <>
      {/* // Old dialog content commented out
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[80vw]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>
                <Image
                  src="/logo-1.png"
                  alt="logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </DialogTitle>

              <Button  disabled={saveAnswer.isPending} variant={'outline'} onClick={() => {
                saveAnswer.mutate({
                  projectId: project!.id,
                  question,
                  answer,
                  fileReferences
                },{
                  onSuccess: () =>{
                    toast.success('Answer saved!')
                  },
                  onError: () =>{
                    toast.error('Failed to save answer!')
                  }
                })
              }}>
                Save Answer
              </Button>
            </div>
          </DialogHeader>

          <MDEditor.Markdown
            source={answer}
            className="!h-full max-h-[40vh] max-w-[70vw] overflow-scroll"
          />
          <div className="h-4"></div>
          <CodeReferences fileReferences={fileReferences} />

          <Button
            type="button"
            onClick={() => {
              setOpen(false);
              setAnswer("");
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
      */}

      {/* // New improved UI with tabs for answer and file references */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] flex flex-col sm:max-w-[80vw]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo-1.png"
                  alt="logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <DialogTitle className="text-lg font-semibold">GitHub AI Answer</DialogTitle>
              </div>
              <Button
                disabled={saveAnswer.isPending}
                variant="outline"
                onClick={() => {
                  saveAnswer.mutate(
                    {
                      projectId: project!.id,
                      question,
                      answer,
                      fileReferences,
                    },
                    {
                      onSuccess: () => {
                        toast.success("Answer saved!");
                       refetch() 
                      },
                      onError: () => {
                        toast.error("Failed to save answer!");
                      },
                    }
                  );
                }}
                className="mr-5"
              >
                Save Answer
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="answer" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="answer">AI Answer</TabsTrigger>
              <TabsTrigger value="references">File References ({fileReferences.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="answer" className="flex-1 mt-4">
              <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                <MDEditor.Markdown
                  source={answer}
                  className="!bg-transparent !text-foreground"
                />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="references" className="flex-1 mt-4">
              <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                <CodeReferences fileReferences={fileReferences} />
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-4">
            <Button
              type="button"
              onClick={() => {
                setOpen(false);
                setAnswer("");
                setFileReferences([]);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle> Ask a Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file should I edit to change the home page?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="h-4"></div>
            <Button type="submit" disabled={loading}>
              Ask Github AI
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
