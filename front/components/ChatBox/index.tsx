import React, { useCallback, useEffect, useRef } from 'react'
import { Form } from 'react-router-dom';
import { ChatArea, MentionsTextarea, SendButton, Toolbox } from './styles';
import autosize from 'autosize'

interface Props {
    chat: string;
    onSubmitForm: (e: any) => void;
    onChangeChat: (e: any) => void;
    placeholder?: string;
}

// ChatBox를 사용하는 쪽에서 구체적인 작업을 할 수 있게 props
// 재사용 되는데 서로 다른 데이터는 Props로 빼준다.
const ChatBox: React.FC<Props> = ({ chat, onSubmitForm, onChangeChat, placeholder }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (textareaRef.current) {
            autosize(textareaRef.current);
        }
    }, [])

    const onKeydownChat = useCallback((e: any) => {
        if (e.key === 'Enter') {
            if (!e.shiftKey) {
                e.preventDefatul();
                onSubmitForm(e)
            }
        }
    }, [])

    return (
        <ChatArea>
            <Form onSubmit={onSubmitForm}>
                <MentionsTextarea
                    id="editor-chat"
                    value={chat}
                    onChange={onChangeChat} onKeyDown={onKeydownChat}
                    placeholder={placeholder}
                    ref={textareaRef}
                />
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