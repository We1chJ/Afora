import { useState, useRef, useEffect } from 'react';
import { CircleUser, SendHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface CommentBoxProps {
  className?: string;
}

const CommentBox: React.FC<CommentBoxProps> = ({ className }) => {
  const [comment, setComment] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const quillRef = useRef<HTMLDivElement>(null);

  const handlePost = () => {
    console.log('Posted comment:', comment);
    setComment('');
    setIsFocused(false);
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
    <div className={`relative w-full max-w-full`} ref={quillRef}>
      <style jsx global>{`
        .quill {
          position: relative;
          z-index: 50;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
          width: 100%;
          min-width: 0; /* Add this to handle text overflow */
        }
        
        .ql-toolbar {
          position: sticky;
          top: 0;
          z-index: 51;
          background-color: white;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          padding: 4px !important;
          border: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          opacity: 0;
          height: 0;
          padding: 0 !important;
          overflow: hidden;
          transition: all 0.2s ease;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          width: 100%;
        }
        
        .toolbar-visible .ql-toolbar {
          opacity: 1;
          height: auto;
          min-height: 36px;
          padding: 4px !important;
        }
        
        .ql-toolbar .ql-formats {
          margin-right: 4px !important;
          margin-bottom: 4px !important;
          display: flex;
          flex-wrap: wrap;
        }
        
        .ql-toolbar button {
          width: 28px;
          height: 28px;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 480px) {
          .ql-toolbar button {
            width: 24px;
            height: 24px;
            padding: 2px;
          }
        }
        
        .ql-container {
          z-index: 50;
          height: auto !important;
          min-height: 40px;
          max-height: none;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb !important;
          transition: all 0.2s ease;
          width: 100%;
          min-width: 0; /* Add this to handle text overflow */
        }
        
        .toolbar-visible .ql-container {
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
        }
        
        .ql-editor {
          min-height: 40px;
          max-height: ${isFocused ? '300px' : '40px'};
          height: auto;
          overflow-y: auto;
          overflow-x: hidden; /* Prevent horizontal scroll */
          padding: 8px !important;
          word-break: break-word;
          word-wrap: break-word;
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.5;
          width: 100%;
        }

        /* Handle placeholder text */
        .ql-editor.ql-blank::before {
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
          .ql-editor {
            font-size: 16px;
            padding: 6px !important;
            max-height: ${isFocused ? '200px' : '40px'};
          }
          
          .ql-editor.ql-blank::before {
            font-size: 16px;
            left: 6px;
            right: 6px;
          }
        }
        
        .ql-tooltip {
          z-index: 52 !important;
          position: fixed !important;
          left: 50% !important;
          top: 50% !important;
          transform: translate(-50%, -50%) !important;
          max-width: 90vw;
          width: auto;
          white-space: normal;
        }

        .ql-tooltip input[type="text"] {
          width: 100%;
          max-width: 200px;
        }
        
        .ql-tooltip[data-mode="link"]::before {
          content: "Enter link URL:";
        }

        @media (max-width: 480px) {
          .ql-tooltip {
            font-size: 14px;
          }
          
          .ql-tooltip input[type="text"] {
            max-width: 160px;
          }
        }
      `}</style>

      <div className={`flex items-start w-full space-x-2 p-2 sm:p-3 bg-white rounded-lg shadow ${className}`}>
        <div className="hidden sm:block shrink-0">
          <CircleUser className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0"> {/* Add min-width: 0 to handle text overflow */}
          <div className={isFocused ? 'toolbar-visible' : ''}>
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
        <div className="shrink-0">
          <Button
            variant="default"
            onClick={handlePost}
            className="h-8 w-8 sm:h-10 sm:w-10 p-0"
            disabled={!comment.trim()}
          >
            <SendHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentBox;