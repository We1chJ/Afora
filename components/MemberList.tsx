'use client'
import React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import InviteUserToOrganization from './InviteUserToOrganization';
import { useEffect, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';

const MemberList = ({ admins, members, userRole }: { admins: string[]; members: string[]; userRole: string }) => {
    const [adminsPfp, setAdminsPfp] = useState<{ [email: string]: string }>({});
    const [membersPfp, setMembersPfp] = useState<{ [email: string]: string }>({});
    const myQuery = query(
        collection(db, "users"),
        where("__name__", "in", [...admins, ...members])
    );
    const [results, loading, error] = useCollection(myQuery);
    useEffect(() => {
        if (!loading && results) {
            const adminsPfpData: { [email: string]: string } = {};
            const membersPfpData: { [email: string]: string } = {};

            results.docs.forEach((doc) => {
                const data = doc.data();
                if (admins.includes(doc.id)) {
                    adminsPfpData[doc.id] = data.userImage;
                } else if (members.includes(doc.id)) {
                    membersPfpData[doc.id] = data.userImage;
                }
            });

            setAdminsPfp(adminsPfpData);
            setMembersPfp(membersPfpData);
        }
    }, [results, loading, error]);

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px] text-xl font-bold">Admins</TableHead>
                        {userRole === 'admin' && (
                            <TableHead className="text-right">
                                <InviteUserToOrganization />
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {admins.length > 0 ? (
                        admins.map((admin, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium flex items-center">
                                    <img src={adminsPfp[admin] || "https://static.vecteezy.com/system/resources/previews/024/983/914/non_2x/simple-user-default-icon-free-png.png"} alt="profile icon" className="w-8 h-8 mr-2 rounded-full" />
                                    {admin}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center">No admins currently</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px] text-xl font-bold">Members</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.length > 0 ? (
                        members.map((member, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium flex items-center">
                                    <img src={membersPfp[member] || "https://static.vecteezy.com/system/resources/previews/024/983/914/non_2x/simple-user-default-icon-free-png.png"} alt="profile icon" className="w-8 h-8 mr-2 rounded-full" />
                                    {member}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center">No members currently</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export default MemberList