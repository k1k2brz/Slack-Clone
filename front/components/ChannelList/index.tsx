import { CollapseButton } from '@components/DMList/styles';
import EachChannel from '@components/EachChannel';
// import EachChannel from '@components/EachChannel';
import { IChannel, IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router';
import { NavLink } from 'react-router-dom';
import useSWR from 'swr';

const ChannelList: React.FC = () => {
    const { workspace } = useParams<{ workspace?: string }>();
    const [channelCollapse, setChannelCollapse] = useState(false);
    const { data: userData, error, mutate } = useSWR<IUser>('/api/users', fetcher, {
        dedupingInterval: 2000,
    });
    // 캐싱된 데이터를 쓰기 때문에
    const { data: channelData } = useSWR<IChannel[]>(
        userData ? `/api/workspaces/${workspace}/channels` : null, fetcher);

    const toggleChannelCollapse = useCallback(() => {
        setChannelCollapse((prev) => !prev);
    }, []);

    return (
        <>
            <h2>
                <CollapseButton collapse={channelCollapse} onClick={toggleChannelCollapse}>
                    <i
                        className="c-icon p-channel_sidebar__section_heading_expand p-channel_sidebar__section_heading_expand--show_more_feature c-icon--caret-right c-icon--inherit c-icon--inline"
                        data-qa="channel-section-collapse"
                        aria-hidden="true"
                    />
                </CollapseButton>
                <span>Channels</span>
            </h2>
            <div>
                {!channelCollapse &&
                    channelData?.map((channel) => {
                        // 별도 컴포넌트로 분리하는게 최적화 할 때 좀 더 편리
                        return <EachChannel key={channel.id} channel={channel} />;
                    })}
            </div>
        </>
    );
};

export default ChannelList;