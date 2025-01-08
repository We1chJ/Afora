"use client";

import '@mdxeditor/editor/style.css';
import { MDXEditor, MDXEditorMethods, headingsPlugin, listsPlugin, linkDialogPlugin, linkPlugin, quotePlugin, thematicBreakPlugin, UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin, BlockTypeSelect, CodeToggle, CreateLink } from "@mdxeditor/editor";
import { FC } from "react";

interface EditorProps {
    markdown: string;
    editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
}

/**
 * Extend this Component further with the necessary plugins or props you need.
 * proxying the ref is necessary. Next.js dynamically imported components don't support refs.
 */
const Editor: FC<EditorProps> = ({ markdown, editorRef }) => {
    return (
        <MDXEditor
            onChange={(e) => console.log(e)}
            ref={editorRef}
            markdown={markdown}
            plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                linkPlugin(),
                linkDialogPlugin(),
                thematicBreakPlugin(),
                toolbarPlugin({
                    toolbarClassName: 'my-classname',
                    toolbarContents: () => (
                        <>
                            <UndoRedo />
                            <BlockTypeSelect/>
                            <BoldItalicUnderlineToggles />
                            <CodeToggle/>
                            <CreateLink/>
                        </>
                    )
                })
            ]}
        />
    );
};

export default Editor;