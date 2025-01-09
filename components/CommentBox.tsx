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
  const quillRef = useRef<any>(null);

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
    const handleFocus = () => setIsFocused(true);
    const handleClickOutside = (event: MouseEvent) => {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = comment;
      if (tempElement.textContent?.trim() === '') {
        setComment('');
        setIsFocused(false);
      }
      if (quillRef.current && !quillRef.current.contains(event.target)) {
        if (!comment.trim() || comment.trim() === '') {
          setIsFocused(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [comment]);

  return (
    <div className={`relative`} ref={quillRef}>
      <style jsx global>{`
        .quill {
          position: relative;
          z-index: 50;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
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
        }
        
        .toolbar-visible .ql-toolbar {
          opacity: 1;
          height: 36px;
          padding: 4px !important;
        }
        
        .ql-toolbar .ql-formats {
          margin-right: 8px !important;
        }
        
        .ql-toolbar button {
          width: 24px;
          height: 24px;
          padding: 2px;
        }
        
        .ql-container {
          z-index: 50;
          height: auto !important;
          min-height: 40px;
          max-height: ${isFocused ? '200px' : '40px'};
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb !important;
          transition: all 0.2s ease;
        }
        
        .toolbar-visible .ql-container {
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
        }
        
        .ql-editor {
          min-height: 40px;
          max-height: ${isFocused ? '200px' : '40px'};
          overflow-y: auto;
          padding: 8px !important;
        }
        
        .ql-editor.ql-blank::before {
          font-style: normal !important;
          color: #9ca3af !important;
        }
        
        .ql-tooltip {
          z-index: 52 !important;
          position: absolute !important;
          left: unset !important;
          top: unset !important;
          transform: none !important;
        }
        
        .ql-tooltip[data-mode="link"]::before {
          content: "Enter link URL:";
        }
      `}</style>

      <div className={`flex items-center w-full space-x-2 p-3 bg-white rounded-lg shadow ${className}`}>
        {/* Hide CircleUser on small screens (< 640px) */}
        <div className="hidden sm:block">
          <CircleUser className="w-10 h-10 text-gray-400" />
        </div>
        <div className="flex-1">
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
        <Button
          variant="default"
          onClick={handlePost}
          className="h-10"
          disabled={!comment.trim()}
        >
          <SendHorizontal />
        </Button>
      </div>
    </div>
  );
};

export default CommentBox;