import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import useInput from '@hooks/useInput';
import React, { useCallback } from 'react';
import { Container, Header } from './styles';

const Channel = () => {
    const [chat, onChangeChat, setChat] = useInput('')
    const onSubmitForm = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault
        setChat('');
    }, [])
    return (
        <Container>
            <Header>채널</Header>
            <ChatList />
            <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitForm} />
        </Container>
        // workspace로 감싸면 Workspace의 Children이 된다.
    )
}

export default Channel;