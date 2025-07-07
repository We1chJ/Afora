import Link from "next/link";
import React from "react";
import { Mail } from "lucide-react";

function ContactUs() {
    return (
        // More functionality is needed
        // Add an actual contact us that can refer emails to the afora.connect@gmail.com
        <Link href={"/contact"}>
            {" "}
            <Mail className="text-white hover:translate-y-[-2px] transition-transform duration-300" />
        </Link>
    );
}

export default ContactUs;
