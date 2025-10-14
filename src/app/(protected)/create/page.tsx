"use client";

import React from 'react'
import { useForm } from 'react-hook-form';
import Image from "next/image";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { toast } from 'sonner';
import useRefetch from '@/hooks/use-refetch';


type FormInput = {
    repoUrl: string
    projectName: string
    githubToken?: string
}

const CreatePage = () => {

    const {register, handleSubmit,reset} = useForm<FormInput>();
    const createProject = api.project.createProject.useMutation()
    const refetch = useRefetch();

    function onSubmit(data: FormInput){
        
        createProject.mutate({
            githubUrl: data.repoUrl,
            name: data.projectName,
            githubToken: data.githubToken
        },{
            onSuccess: ()=>{
                toast.success('Project created Successfully')
                // typescript-eslint/no-floating-promises 
                refetch();
                reset()
                
            },
            onError:() =>{
                toast.error('Failed to create project')
            }
        })
        return true
    }

  return (
   <div className='flex items-center gap-12 h-full justify-center'>
   
        
   
   <Image src="/project.jpg" alt="project" height={58} width={300} />
   {/* <img src="/project.jpg" alt="project" className='h-58 w-auto' /> */}

   <div>
    <div>
        <h1 className='font-semibold text-2xl'>Link your GitHub Repository</h1>
        <p className='text-sm text-muted-foreground'> Enter the URL of your repository to link it to GitHub-AI</p>
    </div>
    <div className="h-4"></div>

    <div>
        <form onSubmit={handleSubmit(onSubmit)}>
         <Input {...register('projectName', {required:true})} placeholder='Project Name' />

         <div className="h-2"></div>
          <Input {...register('repoUrl', {required:true})} placeholder='GitHub Url' type='url'/>

          <div className="h-2"></div>
          <Input {...register('githubToken')} placeholder='GitHub Token (Optional)' />

          <div className="h-4"></div>
          <Button type='submit' disabled={createProject.isPending}>
            Create Project
          </Button>
        </form>
    </div>
   </div>
      
   </div>
   
  )
}

export default CreatePage