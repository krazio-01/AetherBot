"use client";
import "./toggleButton.css";
import {
    TbLayoutSidebarLeftExpand,
    TbLayoutSidebarLeftCollapse,
} from "react-icons/tb";
import useAppStore from "@/store/store";

const ToggleButton = () => {
    const setSidebarIsOpen = useAppStore((state) => state.setSidebarIsOpen);
    const sidebarIsOpen = useAppStore((state) => state.sidebarIsOpen);

    return (
        <div>
            <button
                className="sidebar-toggle"
                onClick={() => setSidebarIsOpen(setSidebarIsOpen)}
            >
                {sidebarIsOpen ? (
                    <TbLayoutSidebarLeftExpand />
                ) : (
                    <TbLayoutSidebarLeftCollapse />
                )}
            </button>
        </div>
    );
};

export default ToggleButton;
