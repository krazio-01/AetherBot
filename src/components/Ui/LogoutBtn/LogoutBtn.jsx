"use client";
import { signOut } from "next-auth/react";
import { MdLogout } from "react-icons/md";

const LogoutBtn = () => {
    return (
        <div>
            <button onClick={() => signOut()}>
                <MdLogout />
                <span>Logout</span>
            </button>
        </div>
    );
};

export default LogoutBtn;