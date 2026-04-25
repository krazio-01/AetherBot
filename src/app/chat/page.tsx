import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import ChatContainer from '@/components/layout/main/ChatContainer/ChatContainer';

const Page = async () => {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    return (
        <div className="chatbox-main">
            <div className="chatbox-wrapper only/chat">
                <ChatContainer user={user} isPending={false} />
            </div>
        </div>
    );
};

export default Page;
