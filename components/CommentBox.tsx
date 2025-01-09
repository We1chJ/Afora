'use client';

import { useState } from 'react';
import { CircleUser, SendHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function CommentBox() {
  const [comment, setComment] = useState('');

  const handlePost = () => {
    console.log('Posted comment:', comment);
    setComment('');
  };

  return (
    <div className="flex items-center w-full space-x-2 p-3 bg-white rounded-lg shadow">
      <CircleUser className="w-10 h-10 text-gray-400" />
      <div className="h-full w-full">
        <div className="flex mb-2"></div>
        <div className="w-full rounded-md overflow-hidden flex items-end">
          <div className="w-full flex flex-col h-fit">
            <ReactQuill theme="snow" value={comment} onChange={setComment} className="w-full h-full" />
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
  );
}

export default CommentBox;