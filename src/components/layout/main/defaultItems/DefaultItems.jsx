"use client";
import { TiWeatherCloudy } from "react-icons/ti";
import { FaCode } from "react-icons/fa";
import { MdOutlineFastfood, MdEmail } from "react-icons/md";
import useAppStore from "@/store/store";
import "./defaultItems.css";

const SampleQuestions = () => {
    const setInput = useAppStore((state) => state.setInput);

    const handleClick = (text) => {
        setInput(text);
    };

    return (
        <div className="sample-questions">
            <div className="sample-questions-container">
                <SampleQuestion
                    icon={<TiWeatherCloudy style={{ color: "blue" }} />}
                    text="How's today's weather?"
                    handleClick={handleClick}
                />
                <SampleQuestion
                    icon={<FaCode style={{ color: "green" }} />}
                    text="Write a Python script for web scraping"
                    handleClick={handleClick}
                />
            </div>
            <div className="sample-questions-container">
                <SampleQuestion
                    icon={<MdOutlineFastfood style={{ color: "orange" }} />}
                    text="Give me some tasty recipe ideas"
                    handleClick={handleClick}
                />
                <SampleQuestion
                    icon={<MdEmail style={{ color: "#ff9900" }} />}
                    text="Write an email regarding leave"
                    handleClick={handleClick}
                />
            </div>
        </div>
    );
};

const SampleQuestion = ({ icon, text, handleClick }) => (
    <div id="sample-item" onClick={() => handleClick(text)}>
        <p>{icon}</p>
        <span>{text}</span>
    </div>
);

export default SampleQuestions;
