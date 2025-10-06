

"use client";

import useProject from "@/hooks/use-project";
import { api } from "@/trpc/react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const CommitLog = () => {
  const { projectId, project } = useProject();
  const { data: commits, error } = projectId
    ? api.project.getCommits.useQuery({ projectId })
    : { data: undefined, error: undefined };

  if (error) console.error("Error fetching commits:", error);

  return (
    <ul className="space-y-6">
      {commits?.map((commit, idx) => (
        <li key={`${commit.commitHash}-${idx}`} className="relative flex gap-x-4">
          <div
            className={cn(
              idx === commits.length - 1 ? "h-6" : "-bottom-6",
              "absolute top-0 left-0 flex w-6 justify-center"
            )}
          >
            <div className="w-px translate-x-1" />
          </div>

          <Avatar className="size-8 relative mt-4 flex-none">
            <AvatarImage src={commit.commitAuthorAvatar || undefined} alt="Avatar" />
            <AvatarFallback>{commit.commitAuthorName.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="rounded-md flex-auto bg-white p-3 ring-1 ring-gray-200 ring-inset">
            <div className="flex justify-between gap-x-4">
              <Link
                target="_blank"
                href={`${project?.githubUrl}/commits/${commit.commitHash}`}
                className="py-0.5 text-xs leading-5 text-gray-500"
              >
                <span className="font-medium text-gray-900">{commit.commitAuthorName}</span>{" "}
                <span className="inline-flex items-center">
                  committed <ExternalLink className="ml-1 size-4" />
                </span>
              </Link>
            </div>
            <span className="font-semibold">{commit.commitMessage}</span>
            <pre className="mt-2 text-sm leading-6 whitespace-pre-wrap text-gray-500">
              {commit.summary ? commit.summary : "No summary available"}
            </pre>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default CommitLog;

