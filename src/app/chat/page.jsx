import DefaultItems from "@/components/layout/main/defaultItems/DefaultItems";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";

const Page = async () => {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    return (
        <div className="chatbox-main">
            <div className="chatbox-wrapper">
                <div className="chatbox-default fade-in-up">
                    <div className="greeting">
                        <h2>Hey {user?.name}</h2>
                    </div>

                    <DefaultItems />
                </div>
            </div>
        </div>
    );
};

export default Page;
