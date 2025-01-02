'use server'

import { adminDb } from "@/firebase-admin";
import { Organization } from "@/types/types";

export async function getOrg(id: string): Promise<Organization> {
    const doc = await adminDb.collection('organizations').doc(id).get();
    if (!doc.exists) {
        throw new Error('Organization not found');
    }
    const organization = doc.data() as Organization;
    return organization;
}