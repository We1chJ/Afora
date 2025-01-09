import { useState } from 'react';
import { CircleUser, SendHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CommentBox = () => {
  const [comment, setComment] = useState('');

  const handlePost = () => {
    console.log('Posted comment:', comment);
    setComment('');
  };

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['link'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }]
    ]
  };

  return (
    <div className="relative">
      <style jsx global>{`
        .quill {
          position: relative;
          z-index: 50;
          display: flex;
          flex-direction: column;
        }
        
        .ql-toolbar {
          position: sticky;
          top: 0;
          z-index: 51;
          background-color: white;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
        
        .ql-container {
          z-index: 50;
          height: auto !important;
          min-height: 50px;
          max-height: 100px;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
        }
        
        .ql-editor {
          min-height: 50px;
          max-height: 100px;
          overflow-y: auto;
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

      <div className="flex items-center w-full space-x-2 p-3 bg-white rounded-lg shadow">
        <CircleUser className="w-10 h-10 text-gray-400" />
        <div className="flex-1">
          <ReactQuill
            theme="snow"
            value={comment}
            onChange={setComment}
            modules={modules}
            className="w-full"
          />
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