import Chat from '@components/Chat';
import { IChat, IDM } from '@typings/db';
import React, { useCallback, useRef } from 'react';
import { ChatZone, Section, StickyHeader } from './styles';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface Props {
    chatSections: { [key: string]: (IDM | IChat)[] };
}

const ChatList: React.FC<Props> = ({ chatSections }) => {
    const scrollbarRef = useRef(null);
    // 과거의 채팅 불러와지게
    const onScroll = useCallback(() => {

    }, [])

    return (
        <ChatZone>
            <Scrollbars autoHide ref={scrollbarRef} onScrollFrame={onScroll}>
                {Object.entries(chatSections).map(([date, chats]) => {
                    return (
                        <Section className={`section-${date}`} key={date}>
                            <StickyHeader>
                                <button>{date}</button>
                            </StickyHeader>
                            {chats.map((chat) => (
                                <Chat key={chat.id} data={chat} />
                            ))}
                        </Section>
                    );
                })}
            </Scrollbars>
        </ChatZone>
    )
}

export default ChatList;