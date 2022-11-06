import React, { useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom';
import { ChatArea, EachMention, Form, MentionsTextarea, SendButton, Toolbox } from './styles';
import autosize from 'autosize'
import useSWR from 'swr';
import { IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import { Mention, SuggestionDataItem } from 'react-mentions';
import gravatar from 'gravatar'

interface Props {
    chat?: string;
    onSubmitForm: (e: any) => void;
    onChangeChat: (e: any) => void;
    placeholder?: string;
}

// ChatBox를 사용하는 쪽에서 구체적인 작업을 할 수 있게 props
// 재사용 되는데 서로 다른 데이터는 Props로 빼준다.
const ChatBox: React.FC<Props> = ({ chat, onSubmitForm, onChangeChat, placeholder }) => {
    const { workspace } = useParams<{ workspace: string }>();
    const { data: userData, error, mutate } = useSWR<IUser | false>('/api/users', fetcher, {
        dedupingInterval: 2000, // 2초
    });

    const { data: memberData } = useSWR<IUser[]>(userData ? `/api/workspaces/${workspace}/members` : null, fetcher);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (textareaRef.current) {
            autosize(textareaRef.current);
        }
    }, []);

    const onKeydownChat = useCallback(
        (e: any) => {
            if (e.key === 'Enter') {
                if (!e.shiftKey) {
                    e.preventDefault();
                    onSubmitForm(e);
                }
            }
        },
        [onSubmitForm],
    );

    const renderSuggestion = useCallback(
        (
            suggestion: SuggestionDataItem,
            search: string,
            highlightedDisplay: React.ReactNode,
            index: number,
            focus: boolean,
        ): React.ReactNode => {
            if (!memberData) return;
            return (
                <EachMention focus={focus}>
                    <img
                        src={gravatar.url(memberData[index].email, { s: '20px', d: 'retro' })}
                        alt={memberData[index].nickname}
                    />
                    <span>{highlightedDisplay}</span>
                </EachMention>
            );
        },
        [memberData],
    );


    return (
        <ChatArea>
            <Form onSubmit={onSubmitForm}>
                {/* <MentionsTextarea
                    id="editor-chat"
                    value={chat}
                    onKeyPress={onKeydownChat}
                    onChange={onChangeChat} onKeyDown={onKeydownChat}
                    placeholder={placeholder}
                    ref={textareaRef}
                /> */}
                <MentionsTextarea
                    id="editor-chat"
                    value={chat}
                    onChange={onChangeChat}
                    onKeyPress={onKeydownChat}
                    onKeyDown={onKeydownChat}
                    placeholder={placeholder}
                    inputRef={textareaRef}
                    allowSuggestionsAboveCursor
                >
                    {/* appendSpaceOnAdd 친 다음 한칸 띄어주기 */}
                    {/* 공식문에서 있는 data 형식대로 쓸 것 */}
                    {/* renderSuggestion같은 경우는 f12눌러서 타입 확인 가능 */}
                    <Mention
                        appendSpaceOnAdd
                        trigger="@"
                        data={memberData?.map((v) => ({ id: v.id, display: v.nickname })) || []}
                        renderSuggestion={renderSuggestion}
                    />
                </MentionsTextarea>
                <Toolbox>
                    <SendButton
                        className={
                            'c-button-unstyled c-icon_button c-icon_button--light c-icon_button--size_medium c-texty_input__button c-texty_input__button--send' +
                            (chat?.trim() ? '' : ' c-texty_input__button--disabled')
                        }
                        data-qa="texty_send_button"
                        aria-label="Send message"
                        data-sk="tooltip_parent"
                        type="submit"
                        disabled={!chat?.trim()}
                    >
                        <i className="c-icon c-icon--paperplane-filled" aria-hidden="true" />
                    </SendButton>
                </Toolbox>
            </Form>
        </ChatArea>
    )
}

export default ChatBox;