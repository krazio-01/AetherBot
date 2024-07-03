import Header from "@/components/layout/header/Header";
import Footer from "@/components/layout/footer/Footer";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import "./chat.css";

const ChatLayout = ({ children }) => {
    return (
        <div>
            <div className="chat-main">
                <Sidebar />

                <div className="chatbox">
                    <div className="chatbox-container">
                        <Header />
                        {children}
                        <Footer />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatLayout;
