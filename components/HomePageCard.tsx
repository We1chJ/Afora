import { db } from '@/firebase';
import { UserOrgData } from '@/types/types';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import React from 'react';
import { useDocumentData } from 'react-firebase-hooks/firestore';


interface HomePageCardProps {
    org: UserOrgData;
}

function HomePageCard({ org }: HomePageCardProps) {
    const [data] = useDocumentData(doc(db, "organizations", org.orgId));
    const basePath = `/org/${org.orgId}`;

    return (
        <Link href={basePath}>
            <div className="group-card flex flex-col shadow-md mb-4 rounded-xl overflow-hidden bg-white dark:bg-gray-800 w-64 h-64 md:w-96 md:h-96 hover:translate-y-[-4px] transition-transform duration-300">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold">
                        {data?.title}
                    </h1>

                    <div className='gap-1'>
                        {/* <p className="text-sm">{org.orgId}</p> */}
                        <h3 className="dark:text-gray-100 text-sm">
                            Admin: {data?.admins[0]}
                        </h3>
                    </div>

                </div>
                <div className="flex-grow bg-white dark:bg-gray-800 p-4">

                    <h3>Description: {data?.description} </h3>
                </div>
            </div>
        </Link>
    );
}

export default HomePageCard;
