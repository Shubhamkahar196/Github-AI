

import { api } from '@/trpc/react'
import {useLocalStorage} from 'usehooks-ts'

const useProject = () => {
  const { data: projects } = api.project.getProjects.useQuery()
  const [projectId, setProjectId] = useLocalStorage<string | null>('Github-projectId', null)
  const project = projectId ? projects?.find((p) => p.id === projectId) : undefined
  return {
    projects,
    project,
    projectId,
    setProjectId
  }
}

export default useProject
