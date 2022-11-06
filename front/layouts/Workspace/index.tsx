import {
    AddButton, Channels, Chats, Header, LogOutButton, MenuScroll, ProfileImg,
    ProfileModal, RightMenu, WorkspaceButton, WorkspaceModal, WorkspaceName, Workspaces, WorkspaceWrapper
} from '@layouts/Workspace/styles'
import fetcher from '@utils/fetcher';
import React, { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import axios from 'axios'
import gravatar from 'gravatar'
import loadable from '@loadable/component';
import { useParams } from 'react-router';
import { Link, Route, Routes, Navigate } from 'react-router-dom';

import { toast } from 'react-toastify';

import Menu from '@components/Menu';
import useInput from '@hooks/useInput';
import Modal from '@components/Modal';
import CreateChannelModal from '@components/CreateChannelModal';
import { IChannel, IUser } from '@typings/db';
import { Button, Input, Label } from '@pages/SignUp/styles';
import InviteWorkspaceModal from '@components/InviteWorkspaceModal';
import InviteChannelModal from '@components/InviteChannelModal';
import ChannelList from '@components/ChannelList';
import DMList from '@components/DMList';
import useSocket from '@hooks/useSocket';

const Channel = loadable(() => import('@pages/Ch'));
const DirectMessage = loadable(() => import('@pages/DirectMessage'));

// type Props = {
//     children: React.ReactNode;
// };

// Children 필요없는 컴포넌트는 VFC (리액트 17)
const Workspace = () => {
    // const Workspace: React.FC<Props> = ({ children }) => {
    // const { data: userData, mutate: revalidateUser } = useSWR<IUser | false>('http://localhost:3095/api/users', fetcher);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
    const [showInviteWorkspaceModal, setShowInviteWorkspaceModal] = useState(false);
    const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
    const [newWorkspace, onChangeNewWorkspace, setNewWorkpsace] = useInput('');
    const [newUrl, onChangeNewUrl, setNewUrl] = useInput('');

    const { workspace } = useParams<{ workspace: string }>();
    // 변수 명 바꾸기
    // 다른곳에 복붙해도 SWR이 전역으로 공유 될 것
    const { data: userData, error, mutate: revalidateUser } = useSWR<IUser | false>('/api/users', fetcher, {
        dedupingInterval: 2000, // 2초안에 같은게 호출 되면 캐시 된 것들 그대로 가져다 씀
    });
    // useParams로 주소창에서 따옴
    // 조건부로 만들어서 내가 로그인 했을 때 채널 가져오고 안했을 때 안가져오게
    const { data: channelData } = useSWR<IChannel[]>(
        userData ? `/api/workspaces/${workspace}/channels` : null, fetcher);

    // const { data: memberData } = useSWR<IUser[]>(userData ? `/api/workspaces/${workspace}/members` : null, fetcher);
    const [socket, disconnect] = useSocket(workspace); // hook의 return은 맘대로

    useEffect(() => {
        if (channelData && userData && socket) {
            console.log(socket);
            socket.emit('login', { id: userData.id, channels: channelData.map((v) => v.id) });
        }
    }, [socket, channelData, userData]);
    useEffect(() => {
        return () => {
            disconnect();
        };
        // useEffect에 쓰이지 않은 변수도 넣어줘야 하는 경우
        // workspace가 바뀔 때
    }, [workspace, disconnect]);

    const onLogout = useCallback(() => {
        console.log(userData)
        axios.post(
            '/api/users/logout', null, { withCredentials: true, })
            .then(() => {
                // mutate(false, false);
                revalidateUser(false, false);
            })
            .catch((err) => {
                console.log(err)
            })
    }, [revalidateUser])

    // toggle 이렇게 가능
    const onClickUserProfile = useCallback(() => {
        setShowUserMenu((prev) => !prev);
    }, [])
    // 프로필 닫기
    const onCloseUserProfile = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
        // console.trace('click')
        e.stopPropagation();
        setShowUserMenu((prev) => !prev);
    }, [])

    const onClickCreateWorkspace = useCallback(() => {
        setShowCreateWorkspaceModal(true);
    }, [])

    // 메뉴창에 채널생성
    const onCreateWorkspace = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        //trim을 넣어야 띄어쓰기 막아진다.
        if (!newWorkspace || !newWorkspace.trim()) return;
        if (!newUrl || !newUrl.trim()) return;
        axios.post('/api/workspaces', {
            workspace: newWorkspace,
            url: newUrl,
        }, {
            // 내가 로그인 된 상태라는걸 쿠키를 전달해서 안다
            withCredentials: true,
        }).then(() => {
            revalidateUser();
            // 초기화
            setShowCreateWorkspaceModal(false);
            setNewWorkpsace('');
            setNewUrl('');
        }).catch((error) => {
            console.dir(error);
            // toastify npm으로 에러 메세지
            toast.error(error.response?.data, { position: 'bottom-center' })
        })
    }, [newWorkspace, newUrl])

    // 모달닫기
    const onCloseModal = useCallback(() => {
        setShowCreateWorkspaceModal(false);
        setShowCreateChannelModal(false);
        setShowInviteWorkspaceModal(false);
        setShowInviteChannelModal(false);
    }, [])

    const toggleWorkspaceModal = useCallback(() => {
        setShowWorkspaceModal((prev) => !prev);
    }, [])

    const onClickAddChannel = useCallback(() => {
        setShowCreateChannelModal(true);
    }, [])

    const onClickInviteWorkspace = useCallback(() => {
        setShowInviteWorkspaceModal(true);
    }, []);
    // return 아래에 hooks가 있으면 Invalid hook call 에러가 뜬다
    // if, 반복문 아래에도 안되나?

    if (userData === undefined) return null;

    if (userData === false) {
        return <Routes><Route path="/*" element={<Navigate replace to="/login" />} /></Routes>
    }

    return (
        <div>
            <Header>
                <RightMenu>
                    <span onClick={onClickUserProfile}>
                        {/* gravatar설치 후 랜덤 아이콘 */}
                        <ProfileImg src={gravatar.url(userData.email, { s: '28px', d: 'retro' })} alt={userData.nickname} />
                        {/* toggle */}
                        {showUserMenu && (<Menu style={{ right: 0, top: 38 }} show={showUserMenu} onCloseModal={onCloseUserProfile}>
                            <ProfileModal>
                                <img src={gravatar.url(userData.nickname, { s: '28px', d: 'retro' })} alt={userData.nickname} />
                                <div>
                                    <span id="profile-name">{userData.nickname}</span>
                                    <span id="profile-active">Active</span>
                                </div>
                            </ProfileModal>
                            <LogOutButton onClick={onLogout}>로그아웃</LogOutButton>
                        </Menu>
                        )}
                    </span>
                </RightMenu>
            </Header>
            <WorkspaceWrapper>
                <Workspaces>
                    {userData?.Workspaces && userData?.Workspaces.map((ws: any) => {
                        return (
                            <Link key={ws.id} to={`/workspace/${ws.url}/channel/일반`}>
                                <WorkspaceButton>{ws.name.slice(0, 1).toUpperCase()}</WorkspaceButton>
                            </Link>
                        );
                    })}
                    <AddButton onClick={onClickCreateWorkspace}>+</AddButton>
                </Workspaces>
                <Channels>
                    <WorkspaceName onClick={toggleWorkspaceModal}>Sleact</WorkspaceName>
                    <MenuScroll>
                        {/* Menu에서 div옆에 style을 받았기 때문에 style사용가능 */}
                        <Menu show={showWorkspaceModal} onCloseModal={toggleWorkspaceModal} style={{ top: 95, left: 80 }}>
                            <WorkspaceModal>
                                <h2>Sleact</h2>
                                <button onClick={onClickInviteWorkspace}>워크스페이스에 사용자 초대</button>
                                <button onClick={onClickAddChannel}>채널 만들기</button>
                                <button onClick={onLogout}>로그아웃</button>
                            </WorkspaceModal>
                        </Menu>
                        <ChannelList />
                        <DMList />
                    </MenuScroll>
                </Channels>
                <Chats>
                    <Routes>
                        <Route path='/channel/:channel' element={<Channel />} />
                        <Route path='/dm/:id' element={<DirectMessage />} />
                    </Routes>
                </Chats>
            </WorkspaceWrapper>
            <Modal show={showCreateWorkspaceModal} onCloseModal={onCloseModal}>
                <form onSubmit={onCreateWorkspace}>
                    <Label id="workspace-label">
                        <span>워크스페이스 이름</span>
                        <Input id="workspace" value={newWorkspace} onChange={onChangeNewWorkspace} />
                    </Label>
                    <Label id="workspace-url-label">
                        <span>워크스페이스 url</span>
                        <Input id="workspace" value={newUrl} onChange={onChangeNewUrl} />
                    </Label>
                    <Button type="submit">생성하기</Button>
                </form>
            </Modal>
            <CreateChannelModal show={showCreateChannelModal} onCloseModal={onCloseModal}
                setShowCreateChannelModal={setShowCreateChannelModal} />
            <InviteWorkspaceModal show={showInviteWorkspaceModal} onCloseModal={onCloseModal} setShowInviteWorkspaceModal={setShowInviteWorkspaceModal} />
            <InviteChannelModal show={showInviteChannelModal} onCloseModal={onCloseModal} setShowInviteChannelModal={setShowInviteChannelModal} />
        </div>
    )
}

export default Workspace;