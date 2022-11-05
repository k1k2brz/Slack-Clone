import React, { CSSProperties, useCallback } from 'react';
import { CloseModalButton, CreateMenu } from './styles';

// props의 타입들을 직접 적어주어야 한다
interface Props {
    children: React.ReactNode;
    show: boolean;
    onCloseModal: (e: any) => void;
    // 인라인 스타일 사용
    style: CSSProperties;
    closeButton?: boolean;
}

const Menu: React.FC<Props> = ({ children, style, show, onCloseModal, closeButton }) => {
    const stopPropagation = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
        e.stopPropagation()
    }, [])

    if (!show) return null;

    return (
        <CreateMenu onClick={onCloseModal}>
            {/* 자식 태그만 버블링을 막아서 바깥 / 안 클릭 분리 (메뉴 밖 클릭시 닫히게) */}
            {/* type: style사용가능하게 */}
            <div style={style} onClick={stopPropagation}>
                {closeButton && <CloseModalButton onClick={onCloseModal}>&times;</CloseModalButton>}
                {children}
            </div>
        </CreateMenu>
    )
}

// props의 기본값 설정
Menu.defaultProps = {
    closeButton: true,
}

export default Menu;