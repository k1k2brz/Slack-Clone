import React, { useCallback, useEffect, useRef, useState } from 'react';
import gravatar from 'gravatar';
import { Container, DragOver, Header } from './styles';
import { useParams } from 'react-router';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite'
import fetcher from '@utils/fetcher';
import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import useInput from '@hooks/useInput';
import axios from 'axios';
import { IDM } from '@typings/db';
import makeSection from '@utils/makeSection';
import Scrollbars from 'react-custom-scrollbars-2';
import useSocket from '@hooks/useSocket';

const DirectMessage = () => {
    const { workspace, id } = useParams<{ workspace: string; id: string; }>();
    const { data: userData } = useSWR(`/api/workspaces/${workspace}/users/${1}`, fetcher);
    const { data: myData } = useSWR('/api/users', fetcher);
    const [chat, onChangeChat, setChat] = useInput('')
    const { data: chatData, mutate, setSize } = useSWRInfinite<IDM[]>((index: number) =>
        `/api/workspaces/${workspace}/dms/${id}/chats?perPage=20&page=${index + 1}`, fetcher,
    )
    // infiniteScroll 스크롤 페이지 넘기기

    const [socket] = useSocket(workspace);
    const isEmpty = chatData?.[0]?.length === 0; // 데이터가 비어있다
    const isReachingEnd = isEmpty || (chatData && chatData[chatData.length - 1]?.length < 20) || false;
    // is empty가 20개씩 가져온다 할 때 20 + 20 + 5면 5일 때 isEmpty는 false지만 5개가 있어서 isReachingEnd는 true
    const scrollbarRef = useRef<Scrollbars>(null);
    const [dragOver, setDragOver] = useState(false);

    const onSubmitForm = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // 채팅이 존재하면
        // console.log(chat);
        if (chat?.trim() && chatData) {
            const savedChat = chat;
            mutate((prevChatData) => {
                prevChatData?.[0].unshift({
                    // DM에 들어갈 개체들 (SWR안에 들어갈 가짜 데이터)
                    id: (chatData[0][0]?.id || 0) + 1,
                    content: savedChat,
                    SenderId: myData.id,
                    Sender: myData,
                    ReceiverId: userData.id,
                    Receiver: userData,
                    createdAt: new Date(),
                })
                return prevChatData;
            }, false)
                // optimistic ui는 false를 넣어줘야 함
                .then(() => {
                    // 시간 기록
                    localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
                    setChat('');
                    scrollbarRef.current?.scrollToBottom();
                })
            // 워크 스페이스의 어떤 사람한테 챗을 보내라
            axios.post(`/api/workspaces/${workspace}/dms/${id}/chats`, {
                content: chat,
            }).then(() => {
                // 채팅 input 초기화
                mutate();
                // 채팅 칠 때 제일 밑으로 내려감
            })
                .catch((error) => {
                    console.log(error)
                })
        }
        // 바뀐 부분 써주지 않았기 때문에 Chat이 안보였던것
    }, [chat, chatData, myData, userData, workspace, id])

    const onMessage = useCallback((data: IDM) => {
        // id는 상대방 id
        if (data.SenderId === Number(id) && myData.id !== Number(id)) {
            // 내 id까지 mutate를 해버리면 위에 mutate랑 중복 두번 됨
            mutate((chatData) => {
                // 가장 최신글을 최신 데이터
                chatData?.[0].unshift(data);
                return chatData
            }, false).then(() => {
                if (scrollbarRef.current) {
                    // 내가 150px 이상 올렸을 때 다른사람이 채팅을 쳐도 스크롤바 내려가지 않음
                    if (
                        scrollbarRef.current.getScrollHeight() <
                        scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150
                    ) {
                        console.log('scrollToBottom!', scrollbarRef.current?.getValues());
                        // 약간 시간차 둬야 스크롤 내려간다.
                        setTimeout(() => {
                            scrollbarRef.current?.scrollToBottom();
                        }, 50);
                    }
                }
            })
        }
    }, [])

    useEffect(() => {
        socket?.on('dm', onMessage);
        return () => {
            // on 했으면 무조건 off
            socket?.off('dm', onMessage)
        }
    }, [socket, onMessage])

    // 페이지가 로딩될 때 현재시간 기록 (내가 여기까지 읽었다)
    // 내가 계속 읽으니까 시간을 계속 업데이트 해줘야함
    useEffect(() => {
        localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
    }, [workspace, id]);

    // 로딩 시 스크롤바 제일 아래로
    useEffect(() => {
        if (chatData?.length === 1) {
            setTimeout(() => {
                scrollbarRef.current?.scrollToBottom();
            }, 100);
        }
    }, [chatData])

    const onDrop = useCallback(
        (e: any) => {
            e.preventDefault();
            console.log(e);
            const formData = new FormData();
            if (e.dataTransfer.items) {
                // Use DataTransferItemList interface to access the file(s)
                for (let i = 0; i < e.dataTransfer.items.length; i++) {
                    // If dropped items aren't files, reject them
                    if (e.dataTransfer.items[i].kind === 'file') {
                        const file = e.dataTransfer.items[i].getAsFile();
                        console.log('... file[' + i + '].name = ' + file.name);
                        formData.append('image', file);
                    }
                }
            } else {
                // Use DataTransfer interface to access the file(s)
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    console.log('... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
                    formData.append('image', e.dataTransfer.files[i]);
                }
            }
            axios.post(`/api/workspaces/${workspace}/dms/${id}/images`, formData).then(() => {
                setDragOver(false);
                localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
                mutate();
            });
        },
        [mutate, workspace, id],
    );

    const onDragOver = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        e.preventDefault();
        console.log(e);
        setDragOver(true);
    }, []);

    if (userData === undefined) return null

    // 데이터 없으면 반환 || 내 정보 없으면 (로딩중이거나 에러면 화면 띄우지 않기)
    if (!userData || !myData) {
        return null
    }

    // 기존 배열 남기고 새 배열에 재배치
    const chatSections = makeSection(chatData ? [...chatData].flat().reverse() : [])
    // 2차원 배열(chatData는 2차원 배열이 됨 (swr이 알아서 처리))을 1차원 배열로 만들면서

    return (
        <Container onDrop={onDrop} onDragOver={onDragOver}>
            <Header>
                <img src={gravatar.url(userData.email, { s: '24px', d: 'retro' })} alt={userData.nickname} />
                <span>{userData.nickname}</span>
            </Header>
            <ChatList
                chatSections={chatSections}
                ref={scrollbarRef}
                setSize={setSize}
                isEmpty={isEmpty}
                isReachingEnd={isReachingEnd} />
            <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitForm} />
            {dragOver && <DragOver>업로드!</DragOver>}
        </Container>
    )
}

export default DirectMessage;