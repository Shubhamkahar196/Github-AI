"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DialogHeader } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import useProject from '@/hooks/use-project'
import MDEditor from '@uiw/react-md-editor';
import {
  Dialog,
  DialogContent,

  DialogTitle,
} from "@/components/ui/dialog";
import React, { useState } from 'react'
import Image from "next/image";
import { askQuestion } from './actions'
import { readStreamableValue } from '@ai-sdk/rsc'
import CodeReferences from './code-references'
const AskQuestionCard = () => {
    const {project} = useProject()
    const [question, setQuestion] = useState('');
     const [open, setOpen] = useState(false);
     const [loading, setLoading] = useState(false)
     const [fileReferences, setFileReferences] = useState<{fileName: string; sourceCode: string; summary: string}[]>([])
     const [answer, setAnswer] = useState('')


    const onSubmit = async(e:React.FormEvent<HTMLFormElement>) =>{
      setAnswer('')
      setFileReferences([])
         e.preventDefault()
        if(!project?.id) return
       setLoading(true)
        setOpen(true)

        const {output,fileReferences } = await askQuestion(question, project.id)
        setOpen(true)


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

        <DialogContent className='sm:max-w-[80vw]'>
             <DialogHeader>
                <DialogTitle>
                    <Image src="/logo-1.png" alt="logo" width={40} height={40} className="rounded-full " />
                </DialogTitle>
            </DialogHeader>

 {/* <pre className="whitespace-pre-wrap">{answer}</pre>
  */}

  <MDEditor.Markdown source={answer}  className=' max-w-[70vw] !h-full max-h-[40vh] overflow-scroll'/>
          <div className="h-4"></div>
          <CodeReferences fileReferences={fileReferences}/>

                   <Button type='button' onClick={()=> {setOpen(false); setAnswer('')}} >Close</Button>


  {/* <div className="mt-4"> */}
    {/* <h4 className="font-semibold">Referenced Files:</h4> */}
    {/* <ul>
      {fileReferences.map((file, index) => (
        <li key={index}>{file.fileName}</li>
      ))}
    </ul> */}
  {/* </div> */}

        </DialogContent>
    </Dialog>

   
    
<Card className='relative col-span-3'>

     <CardHeader>
        <CardTitle> Ask a Question</CardTitle>
     </CardHeader>
     <CardContent>
        <form onSubmit={onSubmit}>
            <Textarea placeholder='Which file should I edit to change the home page?' value={question} onChange={e => setQuestion(e.target.value)} />
            <div className='h-4'></div>
            <Button type='submit' disabled={loading}>Ask Github AI</Button>
        </form>
     </CardContent>
    </Card>  
     </>
  )
}

export default AskQuestionCard