"use client";

import useProject from "@/hooks/use-project";

import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import React from "react";
import CommitLog from "./commit-log";
import AskQuestionCard from "./ask-question-card";
import MeetingCard from "./meeting-card";
import ArchiveButton from "./archive-button";
import InviteButton from "./invite-button";
import TeamMembers from "./team-member";


const Dashboard = () => {
  const { project } = useProject();
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        {/* github link */}
        <div className="bg-primary w-full lg:w-fit rounded-md px-4 py-3">
          <div className="flex items-center">
            <Github className="size-6 text-white" />
            <div className="ml-2">
              <p className="text-sm font-medium text-white">
                This project is linked to{" "}
                <Link
                  href={project?.githubUrl ?? ""}
                  className="inline-flex items-center text-white/80 hover:underline"
                >
                  {project?.githubUrl}
                  <ExternalLink className="ml-1 size-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Team members */}
          <TeamMembers />
          {/* InviteButton */}
          <InviteButton />
          {/* ArchiveButton */}
          <ArchiveButton />
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Ask question card */}
          <AskQuestionCard />
          {/* MeetingCard */}
          <MeetingCard />
        </div>
      </div>

      <div className="mt-8">
        <CommitLog />
      </div>
    </div>
  );
};

export default Dashboard;