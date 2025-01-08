'use client'

import { useState, useRef, useEffect } from 'react'
import { CircleUser, Bold, Italic, List, Link, SendHorizontal } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from 'react-markdown'

function CommentBox() {
  const [isFocused, setIsFocused] = useState(false)
  const [comment, setComment] = useState('')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isFocused && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [isFocused, comment])

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => {
    // never set to false for now. Should be fine for UX
    // if (comment.trim() === '') {
    //   setIsFocused(false)
    // }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value)
  }

  const applyStyle = (style: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const selectedText = comment.substring(start, end)
      const newText = `${comment.substring(0, start)}${style}${selectedText}${style}${comment.substring(end)}`
      setComment(newText)
      textareaRef.current.focus()
    }
  }
  const handlePost = () => {
    // Handle the post action here
    console.log('Posted comment:', comment)
    setComment('')
    setIsFocused(false)
    setActiveTab('edit')
  }

  return (
    <div className="flex items-center w-full space-x-2 p-3 bg-white rounded-lg shadow">
      <CircleUser className="w-10 h-10 text-gray-400" />
      <div className="h-full w-full">
        <div className="flex mb-2">
          {isFocused && (
            <>
              <Button
                variant={activeTab === 'edit' ? 'default' : 'outline'}
                onClick={() => setActiveTab('edit')}
                className="rounded-r-none text-xs px-2 h-6 border-none"
              >
                Edit
              </Button>
              <Button
                variant={activeTab === 'preview' ? 'default' : 'outline'}
                onClick={() => setActiveTab('preview')}
                className="rounded-l-none text-xs px-2 h-6 border-none"
              >
                Preview
              </Button>
              {activeTab === 'edit' && (
                <div className='flex items-center space-x-1 pl-2'>
                  <div className="border-l h-6 mx-2"></div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => applyStyle('**')}
                    onMouseDown={(e) => e.preventDefault()}
                    className="h-6 border-none"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => applyStyle('*')}
                    onMouseDown={(e) => e.preventDefault()}
                    className="h-6 border-none"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => applyStyle('- ')}
                    onMouseDown={(e) => e.preventDefault()}
                    className="h-6 border-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => applyStyle('[](')}
                    onMouseDown={(e) => e.preventDefault()}
                    className="h-6 border-none"
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="w-full rounded-md overflow-hidden flex items-end">
          {activeTab === 'edit' ? (
            <Textarea
              ref={textareaRef}
              placeholder="Write a comment..."
              value={comment}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="flex w-full min-h-[20px] max-h-[150px] resize-none focus:ring-transparent focus-visible:ring-transparent focus:outline-none"
            />
          ) : (
            <div className="w-full min-h-[20px] max-h-[150px] overflow-y-auto bg-white border rounded-md">
              <ReactMarkdown className="flex min-h-[20px] w-full rounded-md px-3 py-2 text-sm">
                {comment || 'Nothing to preview'}
              </ReactMarkdown>
            </div>
          )}
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


export default CommentBox;