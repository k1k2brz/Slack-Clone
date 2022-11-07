import Chat from '@components/Chat';
import { IChat, IDM } from '@typings/db';
import React, { forwardRef, MutableRefObject, useCallback, useRef } from 'react';
import { ChatZone, Section, StickyHeader } from './styles';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface Props {
    chatSections: { [key: string]: (IDM | IChat)[] };
    setSize: (f: (size: number) => number) => Promise<(IDM | IChat)[][] | undefined>;
    isEmpty: boolean;
    isReachingEnd: boolean;
}

// infinite scroll
const ChatList = forwardRef<Scrollbars, Props>(({ chatSections, setSize, isReachingEnd },
    scrollRef) => {
    // 과거의 채팅 불러와지게
    const onScroll = useCallback((values: any) => {
        if (values.scrollTop === 0 && !isReachingEnd) {
            // 끝에 도달하면 더이상 새로 불러올 필요가 없다
            // console.log('top')

            setSize((prevSize) => prevSize + 1).then(() => {
                // 스크롤 위치 유지
                const current = (scrollRef as MutableRefObject<Scrollbars>)?.current;
                if (current) {
                    current.scrollTop(current.getScrollHeight() - values.scrollHeight);
                }
            });
        }
    },
        [scrollRef, isReachingEnd, setSize])

    return (
        <ChatZone>
            <Scrollbars autoHide ref={scrollRef} onScrollFrame={onScroll}>
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
})

export default ChatList;