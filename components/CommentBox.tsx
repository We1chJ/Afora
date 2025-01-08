'use client'

import { useState, useRef, useEffect } from 'react'
import { CircleUser, SendHorizontal } from 'lucide-react'
import { Button } from "@/components/ui/button"
import dynamic from 'next/dynamic'
import React from 'react'
import { MDXEditorMethods } from '@mdxeditor/editor'


function CommentBox() {
  const [comment, setComment] = useState('')
  const ref = React.useRef<MDXEditorMethods>(null)

  const handlePost = () => {
    console.log('Posted comment:', comment)
    setComment('')
  }

  // suggested to set to false but true seems fine
  const EditorComp = dynamic(() => import('./MDTextEditor'), { ssr: true })
  return (
    <div className="flex items-center w-full space-x-2 p-3 bg-white rounded-lg shadow">
      <CircleUser className="w-10 h-10 text-gray-400" />
      <div className="h-full w-full">
        <div className="flex mb-2">

        </div>
        <div className="w-full rounded-md overflow-hidden flex items-end">
          <div className="w-full flex flex-col">
            <EditorComp editorRef={ref} markdown={comment} />
          </div>
          <Button
            variant="default"
            onClick={handlePost}
            className="ml-2 h-10"
            disabled={!comment.trim()}
          >
            <SendHorizontal />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CommentBox