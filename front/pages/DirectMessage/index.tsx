import React, { useCallback } from 'react';
import gravatar from 'gravatar';
import { Container, Header } from './styles';
import { useParams } from 'react-router';
import useSWR from 'swr';
import fetcher from '@utils/fetcher';
import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import useInput from '@hooks/useInput';
import axios from 'axios';
import { IDM } from '@typings/db';

const DirectMessage = () => {
    const { workspace, id } = useParams<{ workspace: string; id: string }>();
    const { data: userData } = useSWR(`/api/workspaces/${workspace}/users/${id}`, fetcher);
    const { data: myData } = useSWR('/api/users', fetcher);
    const [chat, onChangeChat, setChat] = useInput('');
    const { data: chatData, mutate: mutateChat } = useSWR<IDM[]>(
        `/api/workspaces/${workspace}/dms/${id}/chats?perPage=20&page=1`, fetcher,
    )

    const onSubmitForm = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // 채팅이 존재하면
        if (chat?.trim()) {
            // 워크 스페이스의 어떤 사람한테 챗을 보내라
            axios.post(`/api/workspaces/${workspace}/dms/${id}/chats`, {
                content: chat,
            }).then(() => {
                // 채팅 input 초기화
                mutateChat();
                setChat('')
            })
                .catch((error) => {
                    console.log(error)
                })
        }
    }, []);

    // 데이터 없으면 반환 || 내 정보 없으면 (로딩중이거나 에러면 화면 띄우지 않기)
    if (!userData || !myData) {
        return null
    }

    return (
        <Container>
            <Header>
                <img src={gravatar.url(userData.email, { s: '24px', d: 'retro' })} alt={userData.nickname} />
                <span>{userData.nickname}</span>
            </Header>
            <ChatList />
            <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitForm} />
        </Container>
    )
}

export default DirectMessage;