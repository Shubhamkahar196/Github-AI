"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DialogHeader } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import useProject from '@/hooks/use-project'
import {
  Dialog,
  DialogContent,

  DialogTitle,
} from "@/components/ui/dialog";
import React, { useState } from 'react'
import Image from "next/image";
import { askQuestion } from './actions'
const AskQuestionCard = () => {
    const {project} = useProject()
    const [question, setQuestion] = useState('');
     const [open, setOpen] = useState(false);
     const [loading, setLoading] = useState(false)
     const [fileReferences, setFileReferences] = useState<{fileName: string; sourceCode: string; summary: string}[]>([])
     const [answer, setAnswer] = useState('')


    const onSubmit = async(e:React.FormEvent<HTMLFormElement>) =>{
         e.preventDefault()
        if(!project?.id) return
       setLoading(true)
        setOpen(true)

        const {output,fileReferences } = await askQuestion(question, project.id)
        setFileReferences(fileReferences)
        
        for await (const delta of readStreamableValue(output)){
            if(delta){
                setAnswer(ans => ans + delta)
            }
        }
        setLoading(false)
    }



  return (
    <>  

    <Dialog open={open} onOpenChange={setOpen}>

        <DialogContent>
             <DialogHeader>
                <DialogTitle>
                    <Image src="/logo-1.png" alt="logo" width={40} height={40} className="rounded-full " />
                </DialogTitle>
            </DialogHeader>

 {answer}
  {fileReferences.map(file=>{
    return <span>{file.fileName}</span>
 })} 

        </DialogContent>
    </Dialog>

   
    
<Card className='relative col-span-3'>

     <CardHeader>
        <CardTitle> Ask a Question</CardTitle>
     </CardHeader>
     <CardContent>
        <form>
            <Textarea placeholder='Which file should I edit to change the home page?' value={question} onChange={e => setQuestion(e.target.value)} />
            <div className='h-4'></div>
            <Button type='submit'>Ask Github AI</Button>
        </form>
     </CardContent>
    </Card>  
     </>
  )
}

export default AskQuestionCard