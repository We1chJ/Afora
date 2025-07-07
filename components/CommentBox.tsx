'use client'

import { useState, useRef, useEffect } from 'react';
import { CircleUser, LoaderCircle, SendHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { postComment } from '@/actions/actions';
import { useTransition } from 'react';
import { Timestamp } from 'firebase/firestore';


interface CommentBoxProps {
  className?: string;
  isPublic: boolean;
  projId: string;
  stageId: string;
  taskId: string;
}

const CommentBox: React.FC<CommentBoxProps> = ({ className, isPublic, projId, stageId, taskId }) => {
  const { user } = useUser();
  const [comment, setComment] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const quillRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const handlePost = () => {
    startTransition(async () => {
      await postComment(isPublic, projId, stageId, taskId, comment, new Timestamp(Date.now() / 1000, 0), user!.primaryEmailAddress!.toString())
        .then(() => {
          setComment('');
        })
        .catch((error) => {
          console.error('Error posting comment:', error);
        });
    });
  };

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['link'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }]
    ]
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = comment;
      if (tempElement.textContent?.trim() === '') {
        setComment('');
        setIsFocused(false);
      }
      if (quillRef.current && !quillRef.current.contains(event.target as Node)) {
        if (!comment.trim() || comment.trim() === '') {
          setIsFocused(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [comment]);

  return (
    <div className={`relative w-full max-w-full quill-comment-container`} ref={quillRef}>
      <style jsx global>{`
        .quill-comment-container .quill {
          position: relative;
          z-index: 50;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
          width: 100%;
          min-width: 0;
        }
        
        .quill-comment-container .ql-toolbar {
          position: sticky;
          top: 0;
          z-index: 51;
          background-color: white;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          padding: 0 !important;
          border: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          opacity: 0;
          height: 0;
          overflow: hidden;
          transition: all 0.2s ease;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          width: 100%;
        }
        
        .quill-comment-container .toolbar-visible .ql-toolbar {
          opacity: 1;
          height: auto;
          min-height: 36px;
          padding: 4px !important;
        }
        
        .quill-comment-container .ql-toolbar .ql-formats {
          margin-right: 4px !important;
          margin-bottom: 4px !important;
          display: flex;
          flex-wrap: wrap;
        }
        
        .quill-comment-container .ql-toolbar button {
          width: 28px;
          height: 28px;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 480px) {
          .quill-comment-container .ql-toolbar button {
            width: 24px;
            height: 24px;
            padding: 2px;
          }
        }
        
        .quill-comment-container .ql-container {
          z-index: 50;
          height: auto !important;
          min-height: 40px;
          max-height: none;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb !important;
          transition: all 0.2s ease;
          width: 100%;
          min-width: 0;
        }
        
        .quill-comment-container .toolbar-visible .ql-container {
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
        }
        
        .quill-comment-container .ql-editor {
          min-height: 40px;
          max-height: ${isFocused ? '300px' : '40px'};
          height: auto;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px !important;
          word-break: break-word;
          word-wrap: break-word;
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.5;
          width: 100%;
        }

        .quill-comment-container .ql-editor.ql-blank::before {
          font-style: normal !important;
          color: #9ca3af !important;
          font-size: 14px;
          position: absolute;
          left: 8px;
          right: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 640px) {
          .quill-comment-container .ql-editor {
            font-size: 16px;
            padding: 6px !important;
            max-height: ${isFocused ? '200px' : '40px'};
          }
          
          .quill-comment-container .ql-editor.ql-blank::before {
            font-size: 16px;
            left: 6px;
            right: 6px;
          }
        }
        
        .quill-comment-container .ql-tooltip {
          z-index: 52 !important;
          position: fixed !important;
          left: 50% !important;
          top: 50% !important;
          transform: translate(-50%, -50%) !important;
          max-width: 90vw;
          width: auto;
          white-space: normal;
        }

        .quill-comment-container .ql-tooltip input[type="text"] {
          width: 100%;
          max-width: 200px;
        }
        
        .quill-comment-container .ql-tooltip[data-mode="link"]::before {
          content: "Enter link URL:";
        }

        @media (max-width: 480px) {
          .quill-comment-container .ql-tooltip {
            font-size: 14px;
          }
          
          .quill-comment-container .ql-tooltip input[type="text"] {
            max-width: 160px;
          }
        }
      `}</style>

      <div className={`flex items-start w-full space-x-2 p-2 sm:p-3 bg-white rounded-lg shadow transition-all duration-200 ${className}`}>
        <div className="hidden sm:block flex-shrink-0">
          {(user && user.imageUrl) ?
            <Image 
              src={user.imageUrl} 
              alt="User profile image" 
              width={40} 
              height={40} 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" 
            />
            :
            <CircleUser className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          }
        </div>
        <div className="flex-1 min-w-0 relative z-50">
          <div className={`${isFocused ? 'toolbar-visible' : ''} flex flex-col transition-all duration-200 w-full min-w-0`}>
            <ReactQuill
              theme="snow"
              value={comment}
              placeholder={comment ? '' : 'Leave a comment here...'}
              onChange={setComment}
              modules={modules}
              className="w-full"
              onFocus={() => setIsFocused(true)}
            />
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="default"
            onClick={handlePost}
            className="h-8 w-8 sm:h-10 sm:w-10 p-0 transition-all duration-200 hover:scale-105"
            disabled={!comment.trim() || isPending}
          >
            {isPending ? (
              <LoaderCircle className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <SendHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentBox;