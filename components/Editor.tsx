'use client'; // taking input from client

    // import { useState } from "react";
// import { MoonIcon, SunIcon } from "lucide-react";
// import Kanban from "./Kanban";
import DeleteDocument from "./DeleteDocument";
import InviteUser from "./InviteUser";
import { doc } from 'firebase/firestore';
import { db } from '@/firebase'; // Adjust this import path
import React from 'react';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import LoadingSpinner from "./LoadingSpinner";


function Editor({ id }: { id: string }) {

    // const [darkMode, setDarkMode] = useState(false); // THIS DOES NOT WORK FOR NOW
    // const style = `hover:text-white ${darkMode
    //     ? "text-gray-300 bg-gray-700 hover:bg-gray-100 hover:text-gray-700"
    //     : "text-gray-700 bg-gray-200 hover:bg-gray-300 hover:text-gray-700"
    // }`

    const [data, dataLoading, dataError] = useDocumentData(doc(db, "documents", id));
    console.log(data)
  
    //console.log(tasks)
    if (dataLoading) return <div className='flex justify-center items-center'><LoadingSpinner/></div>;
    if (dataError) return <div>Error loading document: {dataError.message}</div>;


    return (
        <div >
            <div className="flex items-center gap-2 justify-end mb-10">

                <div className="mr-10">
                    {/* Dark Mode */}
                    {/* <Button className={style} onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? <SunIcon /> : <MoonIcon />}
                    </Button> */}
                </div>

                <DeleteDocument />
                <InviteUser />

            </div>

            {/* <Kanban id = {id}/> */}

        </div>
    )
}
export default Editor