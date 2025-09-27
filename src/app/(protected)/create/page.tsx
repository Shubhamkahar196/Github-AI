"use client";

import React from 'react'
import { useForm } from 'react-hook-form';
import Image from "next/image";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type FormInput = {
    repoUrl: string
    projectName: string
    githubToken?: string
}

const CreatePage = () => {

    const {register, handleSubmit, reset} = useForm<FormInput>();
   

    function onSubmit(data: FormInput){
        window.alert(JSON.stringify(data,null,2));
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
         <Input {...register('repoUrl', {required:true})} placeholder='Project Name' />

         <div className="h-2"></div>
          <Input {...register('repoUrl', {required:true})} placeholder='GitHub Url' type='url'/>

          <div className="h-2"></div>
          <Input {...register('githubToken', {required:true})} placeholder='GitHub Token (Optional)' />

          <div className="h-4"></div>
          <Button type='submit'>
            Create Project
          </Button>
        </form>
    </div>
   </div>

   </div>
  )
}

export default CreatePage