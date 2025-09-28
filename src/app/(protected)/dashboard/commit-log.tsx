"use client"

import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react'
import React from 'react'
import Link from 'next/link'

const CommitLog = () => {
    const {projectId,project} = useProject()
    const {data: commits} = api.project.getCommits.useQuery({projectId})
  return (
    <>
      <ul className='space-y-6'>
    {commits?.map((commit,commitIdx)=>{
        return <li key={commit.id} className='relative flex gap-x-4'>
         
         <div className={cn(
         commitIdz === commits.length -1 ? 'h-6' : '-bottom-6',
         'absolute left-0 top-0 flex w-6 justify-center'
         )}>
            <div className='w-px translate-x-1'></div>
         </div>
        
         <>
          <img src={commit.commitAuthorAvatar} alt="commit Avatar"  className='relative mt-4 dize-8 flex-none rounded-full bg-gray-50'/>
          <div className='flex-auto rounded-mg bg-white p-3 ring-1 ring-inset ring-gray-200'>
            <div className='flex justify-between gap-x-4'>
             <Link target='_blank' href={`${project?.githubUrl}/commits/${commit.commitHash}`} className='py-0.5 text-xs leading-5 text-gray-500'>
             {commit.commitMessage}</Link>
            </div>

          </div>
         </>

        </li>
    })}
      </ul>
    </>
  )
}

export default CommitLog