'use client'

import { Button } from "@/components/ui/button"
import useProject from "@/hooks/use-project"
import useRefetch from "@/hooks/use-refetch"
import { api } from "@/trpc/react"
import { toast } from "sonner"



const ArchiveButton = () =>{
    const archiveProject = api.project.archieveProject.useMutation()
    const {projectId} = useProject()
    const refetch = useRefetch()

    return (
        <Button disabled={archiveProject.isPending} variant='destructive' onClick={()=>{
            const confirm = window.confirm("are you sure you want to archive this project")
            if(confirm) {
  
                archiveProject.mutate({projectId: projectId!}, {
                    onSuccess: () => {
                        toast.success("project archived")
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        refetch()
                    },
                    onError: () => {
                        toast.error("failed to archive project")
                    }
                })
            }
        }}>
            Archieve
        </Button>
    )
}

export default  ArchiveButton