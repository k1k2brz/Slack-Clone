import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import InviteChannelModal from '@components/InviteChannelModal';
import useInput from '@hooks/useInput';
import useSocket from '@hooks/useSocket';
import { IChannel, IChat, IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import makeSection from '@utils/makeSection';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Scrollbars from 'react-custom-scrollbars-2';
import { useParams } from 'react-router';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { Container, DragOver, Header } from './styles';

const PAGE_SIZE = 20;
const Channel = () => {
    const { workspace, channel } = useParams<{ workspace: string; channel: string }>();
    const { data: myData } = useSWR('/api/users', fetcher);
    const [chat, onChangeChat, setChat] = useInput('');
    const { data: channelData } = useSWR<IChannel>(`/api/workspaces/${workspace}/channels/${channel}`, fetcher);
    const { data: chatData, mutate: mutateChat, setSize } = useSWRInfinite<IChat[]>(
        (index) => `/api/workspaces/${workspace}/channels/${channel}/chats?perPage=20&page=${index + 1}`,
        fetcher,
    );
    const { data: channelMembersData } = useSWR<IUser[]>(
        myData ? `/api/workspaces/${workspace}/channels/${channel}/members` : null,
        fetcher,
    );
    const [socket] = useSocket(workspace);
    const isEmpty = chatData?.[0]?.length === 0;
    const isReachingEnd = isEmpty || (chatData && chatData[chatData.length - 1]?.length < 20) || false;
    const scrollbarRef = useRef<Scrollbars>(null);
    const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
    // false 일 때 dragOver 컴포넌트가 보이지 않음
    const [dragOver, setDragOver] = useState(false);

    /**  
     예를들어
     0초 A: 안녕~(optimistic UI)
     1초 B: 안녕~
     2초 A: 안녕~(실제 서버)
     라고 할 때 mutate를 안해주면 B다음 A가 보여질 수 있음 (Optimistic ui의 경우)
     화면에서 꼭 제거를 해줄 것
    */

    const onSubmitForm = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            // console.log(chat);
            if (chat?.trim() && chatData && channelData && myData) {
                const savedChat = chat;
                mutateChat((prevChatData) => {
                    prevChatData?.[0].unshift({
                        id: (chatData[0][0]?.id || 0) + 1,
                        content: savedChat,
                        // 보내는 사람만 존재
                        UserId: myData.id,
                        User: myData,
                        ChannelId: channelData.id,
                        Channel: channelData,
                        createdAt: new Date(),
                    });
                    return prevChatData;
                }, false).then(() => {
                    localStorage.setItem(`${workspace}-${channel}`, new Date().getTime().toString());
                    setChat('');
                    scrollbarRef.current?.scrollToBottom();
                });
                axios
                    .post(`/api/workspaces/${workspace}/channels/${channel}/chats`, {
                        content: chat,
                    })
                    .then(() => {
                        mutateChat();
                    })
                    .catch(console.error);
            }
        },
        [chat, chatData, myData, channelData, workspace, channel],
    );

    const onMessage = useCallback(
        (data: IChat) => {
            // id는 상대방 아이디
            // 이름이 내 채널명과 같은가?
            // 내 채팅은 socket.io를 통해서 오면 안됨, optimistic ui를 통해 넣었기 때문에 내가 입력한건 걸러줘야
            // 하지만 이미지는 onDrop에서 업로드 하기 때문에 optimistic ui의 적용을 안받으므로 허용해줘야
            if (data.Channel.name === channel && (data.content.startsWith('uploads\\') || data.UserId !== myData?.id)) {
                mutateChat((chatData) => {
                    chatData?.[0].unshift(data);
                    return chatData;
                }, false).then(() => {
                    if (scrollbarRef.current) {
                        if (
                            scrollbarRef.current.getScrollHeight() <
                            scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150
                        ) {
                            // console.log('scrollToBottom!', scrollbarRef.current?.getValues());
                            setTimeout(() => {
                                scrollbarRef.current?.scrollToBottom();
                            }, 50);
                        }
                    }
                });
            }
        },
        [channel, myData],
    );

    useEffect(() => {
        socket?.on('message', onMessage);
        return () => {
            socket?.off('message', onMessage);
        };
    }, [socket, onMessage]);

    // 페이지가 로딩될 때 현재시간 기록 (내가 여기까지 읽었다)
    useEffect(() => {
        localStorage.setItem(`${workspace}-${channel}`, new Date().getTime().toString());
    }, [workspace, channel]);

    // 로딩 시 스크롤바 제일 아래로
    useEffect(() => {
        if (chatData?.length === 1) {
            // console.log('toBottomWhenLoaded', scrollbarRef.current);
            setTimeout(() => {
                // console.log('scrollbar', scrollbarRef.current);
                scrollbarRef.current?.scrollToBottom();
            }, 100);
        }
    }, [chatData]);

    const onClickInviteChannel = useCallback(() => {
        setShowInviteChannelModal(true);
    }, []);

    const onCloseModal = useCallback(() => {
        setShowInviteChannelModal(false);
    }, []);

    // const onChangeFile = useCallback((e: React.ChangeEvent<HTMLFormElement>) => {
    //     const formData = new FormData();
    //     if (e.target.files) {
    //         for (let i = 0; i < e.target.files.length; i++) {
    //             const file = e.target.files[i].getAsFile();
    //             console.log('... file[' + i + '].name = ' + file.name);
    //             formData.append('image', file);
    //         }
    //     }
    //     axios.post(`/api/workspaces/${workspace}/channels/${channel}/images`, formData).then(() => { });
    // }, []);

    // 코드 출처 MDN
    const onDrop = useCallback(
        (e: any) => {
            e.preventDefault();
            // console.log(e);
            const formData = new FormData();
            if (e.dataTransfer.items) {
                // 파일 여러개 동시에 올릴 경우
                for (let i = 0; i < e.dataTransfer.items.length; i++) {
                    // 하나씩 append
                    if (e.dataTransfer.items[i].kind === 'file') {
                        const file = e.dataTransfer.items[i].getAsFile();
                        // console.log(e, '.... file[' + i + '].name = ' + file.name);
                        formData.append('image', file);
                    }
                }
            } else {
                // Use DataTransfer interface to access the file(s)
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    // console.log(e, '... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
                    formData.append('image', e.dataTransfer.files[i]);
                }
            }
            axios.post(`/api/workspaces/${workspace}/channels/${channel}/images`, formData).then(() => {
                setDragOver(false);
                localStorage.setItem(`${workspace}-${channel}`, new Date().getTime().toString());
                mutateChat();
            });
        },
        [workspace, channel],
    );

    // 드래그 하는동안 true
    const onDragOver = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        e.preventDefault();
        // console.log(e);
        setDragOver(true);
    }, []);

    if (!myData || !myData) {
        return null;
    }

    const chatSections = makeSection(chatData ? chatData.flat().reverse() : []);

    return (
        <Container onDrop={onDrop} onDragOver={onDragOver}>
            <Header>
                {/* 채널명 */}
                <span>#{channel}</span>
                <div className="header-right">
                    {/* 이 채널에 몇명이 있나 */}
                    <span>{channelMembersData?.length}</span>
                    {/* 사람 초대 */}
                    <button
                        onClick={onClickInviteChannel}
                        className="c-button-unstyled p-ia__view_header__button"
                        aria-label="Add people to #react-native"
                        data-sk="tooltip_parent"
                        type="button"
                    >
                        <i className="c-icon p-ia__view_header__button_icon c-icon--add-user" aria-hidden="true" />
                    </button>
                </div>
            </Header>
            <ChatList chatSections={chatSections} ref={scrollbarRef} setSize={setSize} isEmpty={isEmpty} isReachingEnd={isReachingEnd} />
            <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitForm} />
            <InviteChannelModal
                show={showInviteChannelModal}
                onCloseModal={onCloseModal}
                setShowInviteChannelModal={setShowInviteChannelModal}
            />
            {/* dragOver가 True가 되는 순간 업로드!가 뜬다 */}
            {/* <input type="file" multiple onChange={onChangeFil} /> */}
            {dragOver && <DragOver>업로드!</DragOver>}
        </Container>
    );
};


export default Channel;