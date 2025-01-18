'use client'

import { Comment } from '@/types/types'
import { Timestamp } from 'firebase/firestore'
import { CircleUser } from 'lucide-react'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import gfm from "remark-gfm";
import TurndownService from 'turndown';
const turndownService = new TurndownService();

const CommentView = ({ comment }: { comment: Comment }) => {
  const mdComment = turndownService.turndown(comment.message);

  return (
    <div className='w-full flex space-x-2'>
      {/* {(user && user.imageUrl) ?
        <Image src={user.imageUrl} alt="User profile image" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
        :
        <CircleUser className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
      } */}
      <CircleUser className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
      <div className='flex flex-col'>
        <div className="flex items-center space-x-2 w-full">
          <span className="">{comment.uid}</span>
          <span className="text-gray-500 text-sm">{new Timestamp(comment.time.seconds, comment.time.nanoseconds).toDate().toLocaleString([], { hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
        </div>
        <ReactMarkdown
          className="prose"
          remarkPlugins={[gfm]}
          components={{
            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
          }}
        >
          {mdComment}
        </ReactMarkdown>
      </div >
    </div >
  )
}

export default CommentView