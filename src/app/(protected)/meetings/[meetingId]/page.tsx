

import React from 'react'
import IssueList from './issue-list'


type Props = {
    params: Promise<{meetingId: string}>
}

const MeetingDetailsPage = ({params}) => {
    const {meetingId} = await params
  return (
   <IssueList  meetingId={meetingId} />
  )
}

export default MeetingDetailsPage