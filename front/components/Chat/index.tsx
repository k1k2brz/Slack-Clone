import React, { memo, useMemo } from 'react'
import { ChatWrapper } from './styles';
import gravatar from 'gravatar'
import { IChat, IDM } from '@typings/db';
import { useParams } from 'react-router';
import dayjs from 'dayjs';
import regexifyString from 'regexify-string';
import { Link } from 'react-router-dom';

interface Props {
    data: IDM | IChat;
}

const BACK_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3095' : 'https://sleact.nodebird.com';
const Chat: React.FC<Props> = ({ data }) => {
    const { workspace } = useParams<{ workspace: string; channel: string }>();
    // Sender가 있는가를 판별해서 DM인지 채널인지 분류 (Sender는 DM에만 있음)
    const user = 'Sender' in data ? data.Sender : data.User;

    /** 정규표현식
     //g - 모두 찾겠다 // 하나만 찾겠다
     \ 문자 무력화 (escape)
     . 모든글자
     \d 숫자    +는 1개 이상   ?는 0개나 1개   * 0개이상
     +? 한개 이상이면서 최대한 조금
     |또는 \n 줄바꿈
     */

    // 컴포넌트는 memo 개별 함수 useMemo (렌더링 막기)
    const result = useMemo(
        () =>
            // uploads\\서버주소
            data.content.startsWith('uploads\\') || data.content.startsWith('uploads/') ? (
                <img src={`${BACK_URL}/${data.content}`} style={{ maxHeight: 200 }} />
            ) :
                (
                    regexifyString({
                        input: data.content,
                        // 아이디와 줄바꿈
                        pattern: /@\[(.+?)]\((\d+?)\)|\n/g,
                        // id와 매칭이 같은게 된다면
                        decorator(match, index) {
                            // 아이디만
                            const arr: string[] | null = match.match(/@\[(.+?)]\((\d+?)\)/)!;
                            if (arr) {
                                return (
                                    <Link key={match + index} to={`/workspace/${workspace}/dm/${arr[2]}`}>
                                        @{arr[1]}
                                    </Link>
                                );
                            }
                            // 위에 해당하지 않는다면 줄바꿈
                            return <br key={index} />;
                        },
                    })
                ),
        [workspace, data.content],
    );

    return (
        <ChatWrapper>
            <div className="chat-img">
                <img src={gravatar.url(user.email, { s: '36px', d: 'retro' })} alt={user.nickname} />
            </div>
            <div className="chat-text">
                <div className="chat-user">
                    <b>{user.nickname}</b>
                    <span>{dayjs(data.createdAt).format('h:mm A')}</span>
                </div>
                <p>{result}</p>
            </div>
        </ChatWrapper>
    )
}

export default memo(Chat);