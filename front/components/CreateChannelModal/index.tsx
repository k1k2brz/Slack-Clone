import Modal from '@components/Modal';
import useInput from '@hooks/useInput';
import { Button, Input, Label } from '@pages/SignUp/styles';
import { IChannel } from '@typings/db';
import fetcher from '@utils/fetcher';
import axios from 'axios';
import React, { useCallback } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import useSWR from 'swr';

interface Props {
    show: boolean;
    onCloseModal: () => void;
    setShowCreateChannelModal: (flag: boolean) => void;
}

const CreateChannelModal: React.FC<Props> = ({ show, onCloseModal, setShowCreateChannelModal }) => {
    const [newChannel, onChangeNewChannel, setNewChannel] = useInput('');
    const { workspace, channel } = useParams<{ workspace: string; channel: string }>();
    const { data: userData, error, mutate: revalidateUser } = useSWR('/api/users', fetcher, {
        dedupingInterval: 2000,
    });
    // useParams로 주소창에서 따옴
    // 조건부로 만들어서 내가 로그인 했을 때 채널 가져오고 안했을 때 안가져오게
    const { data: channelData, mutate: revalidateChannel } = useSWR<IChannel[]>(
        userData ? `/api/workspaces/${workspace}/channels` : null, fetcher);


    // 채널 새로 만들기
    const onCreateChannel = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!newChannel || !newChannel.trim()) {
                return;
            }
            axios
                .post(`/api/workspaces/${workspace}/channels`, {
                    name: newChannel,
                })
                .then(() => {
                    revalidateChannel();
                    setShowCreateChannelModal(false);
                    setNewChannel('');
                })
                .catch((error) => {
                    console.dir(error);
                    toast.error(error.response?.data, { position: 'bottom-center' });
                });
        },
        [newChannel, revalidateChannel, setNewChannel, setShowCreateChannelModal, workspace],
    );

    return (
        <Modal show={show} onCloseModal={onCloseModal}>
            <form onSubmit={onCreateChannel}>
                <Label id="channel-label">
                    <span>채널</span>
                    <Input id="channel" value={newChannel} onChange={onChangeNewChannel} />
                </Label>
                <Button type="submit">생성하기</Button>
            </form>
        </Modal>
    );
}

export default CreateChannelModal;