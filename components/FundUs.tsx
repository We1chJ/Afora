import React from "react";

function FundUs() {
    return (
        // ADD Venmo or paypal in the future
        <a
            href="https://afora.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:translate-y-[-2px] transition-transform duration-300"
        >
            {" "}
            Fund Us!
        </a>
    );
}

export default FundUs;
