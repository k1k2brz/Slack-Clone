// import useSocket from '@hooks/useSocket';
import { CollapseButton } from '@components/DMList/styles';
import useSocket from '@hooks/useSocket';
// import useSocket from '@hooks/useSocket';
import { IUser, IUserWithOnline } from '@typings/db';
import fetcher from '@utils/fetcher';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { NavLink } from 'react-router-dom';
import useSWR from 'swr';

const DMList = () => {
    const { workspace } = useParams<{ workspace?: string }>();
    // hooks로 컴포넌트 자체에서 바로 데이터를 가져올 수 있게 되었다.
    const { data: userData, error, mutate } = useSWR<IUser>('/api/users', fetcher, {
        dedupingInterval: 2000,
    });
    const { data: memberData } = useSWR<IUserWithOnline[]>(
        userData ? `/api/workspaces/${workspace}/members` : null,
        fetcher,
    );
    const [socket] = useSocket(workspace);
    const [channelCollapse, setChannelCollapse] = useState(false);
    const [onlineList, setOnlineList] = useState<number[]>([]);

    const toggleChannelCollapse = useCallback(() => {
        setChannelCollapse((prev) => !prev);
    }, []);

    useEffect(() => {
        console.log('DMList: workspace 바꼈다', workspace);
        setOnlineList([]);
    }, [workspace]);

    useEffect(() => {
        // on
        socket?.on('onlineList', (data: number[]) => {
            setOnlineList(data);
        });
        // socket?.on('dm', onMessage);
        // console.log('socket on dm', socket?.hasListeners('dm'), socket);
        return () => {
            // socket?.off('dm', onMessage);
            // console.log('socket off dm', socket?.hasListeners('dm'));
            // off (on을 꺼줘야 정리)
            socket?.off('onlineList');
        };
    }, [socket]);

    return (
        <>
            <h2>
                <CollapseButton collapse={channelCollapse} onClick={toggleChannelCollapse}>
                    <i
                        className="c-icon p-channel_sidebar__section_heading_expand p-channel_sidebar__section_heading_expand--show_more_feature 
                        c-icon--caret-right c-icon--inherit c-icon--inline"
                        data-qa="channel-section-collapse"
                        aria-hidden="true"
                    />
                </CollapseButton>
                <span>Direct Messages</span>
            </h2>
            <div>
                {/* 로그인 불 들어오는 부분 */}
                {!channelCollapse &&
                    memberData?.map((member) => {
                        const isOnline = onlineList.includes(member.id);
                        return (
                            // 클릭시 흰색
                            <NavLink key={member.id} className={({ isActive }) => (isActive ? "selected" : "")}
                                to={`/workspace/${workspace}/dm/${member.id}`}>
                                <i
                                    className={`c-icon p-channel_sidebar__presence_icon p-channel_sidebar__presence_icon--dim_enabled c-presence
                                    ${isOnline ? 'c-presence--active c-icon--presence-online' : 'c-icon--presence-offline'
                                        }`}
                                    aria-hidden="true"
                                    data-qa="presence_indicator"
                                    data-qa-presence-self="false"
                                    data-qa-presence-active="false"
                                    data-qa-presence-dnd="false"
                                />
                                <span>{member.nickname}</span>
                                {member.id === userData?.id && <span> (나)</span>}
                            </NavLink>
                        );
                    })}
            </div>
        </>
    );
};

export default DMList;