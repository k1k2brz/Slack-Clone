import useInput from '@hooks/useInput';
import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { Form, Error, Success, Label, Input, LinkContainer, Button, Header } from './styles'
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import useSWR from 'swr';
import fetcher from '@utils/fetcher';

const SignUp = () => {
    const { data: userData } = useSWR('/api/users', fetcher);
    // 중복을 ustInput hooks로 처리
    // useInput과 같은 자리에 들어가야함 (handler)
    const [email, onChangeEmail] = useInput('');
    const [nickname, onChangeNickname] = useInput('');
    const [password, setPassword] = useState('');
    const [passwordCheck, setPasswordCheck] = useState('');
    const [mismatchError, setMismatchError] = useState(false);
    const [signUpError, setSignUpError] = useState('')
    const [signUpSuccess, setSignUpSuccess] = useState(false)

    // 성능 최적화를 위한 useCallback
    // useCallback으로 감싸지 않으면 다른 함수 실행될 때도 계속 렌더링 되기 때문
    // const onChangeEmail = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    //     setEmail(e.target.value);
    // }, []);
    // const onChangeNickname = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    //     setNickname(e.target.value);
    // }, []);
    const onChangePassword = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setMismatchError(e.target.value !== passwordCheck)
        // 함수 기준 외부 변수만 deps에 넣음 (내부는 괜찮다)
        // setPassword, setMismatchError는 변하지 않기에 안적어도 됨 (공식문서 참조)
    }, [passwordCheck]);

    const onChangePasswordCheck = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordCheck(e.target.value);
        setMismatchError(e.target.value !== password)
    }, [password]);

    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!mismatchError && nickname) {
            console.log('서버로 회원가입하기');
            // 초기화를 시켜주지 않으면 연달아 클릭시 두개가 다 보일수도 있다.
            setSignUpError('');
            setSignUpSuccess(false);
            axios.post('/api/users', {
                email,
                nickname,
                password,
            }).then((response) => {
                console.log(response);
                setSignUpSuccess(true);
            })
                .catch((err) => {
                    console.error(err)
                    setSignUpError(err.response.data)
                })
                .finally(() => { })
        }
        console.log(email, nickname, password, passwordCheck)
        // 바뀌는 부분(deps)에 state들을 다 넣어줘야 값이 업데이트 된다.
        // useCallback은 하나라도 값이 바뀔 때 까지 기존 값을 캐싱하기 때문
    }, [email, nickname, password, passwordCheck, mismatchError]);

    if (userData) {
        return <Routes><Route path="/" element={<Navigate replace to="/workspace/sleact/channel/일반" />} /></Routes>
    }

    return (
        <div id="container">
            <Header>Sleact</Header>
            <Form onSubmit={onSubmit}>
                <Label id="email-label">
                    <span>이메일 주소</span>
                    <div>
                        <Input type="email" id="email" name="email" value={email} onChange={onChangeEmail} />
                    </div>
                </Label>
                <Label id="nickname-label">
                    <span>닉네임</span>
                    <div>
                        <Input type="text" id="nickname" name="nickname" value={nickname} onChange={onChangeNickname} />
                    </div>
                </Label>
                <Label id="password-label">
                    <span>비밀번호</span>
                    <div>
                        <Input type="password" id="password" name="password" value={password} onChange={onChangePassword} />
                    </div>
                </Label>
                <Label id="password-check-label">
                    <span>비밀번호 확인</span>
                    <div>
                        <Input
                            type="password"
                            id="password-check"
                            name="password-check"
                            value={passwordCheck}
                            onChange={onChangePasswordCheck}
                        />
                    </div>
                    {mismatchError && <Error>비밀번호가 일치하지 않습니다.</Error>}
                    {!nickname && <Error>닉네임을 입력해주세요.</Error>}
                    {/* 이 방법을 쓰려면 백에서 넘겨줘야할듯..? */}
                    {signUpError && <Error>{signUpError}</Error>}
                    {signUpSuccess && <Success>회원가입되었습니다! 로그인해주세요.</Success>}
                </Label>
                <Button type="submit">회원가입</Button>
            </Form>
            <LinkContainer>
                이미 회원이신가요?&nbsp;
                {/* 새로고침이 됨 */}
                {/* <a href="/login">로그인 하러가기</a> */}
                <Link to="/login">로그인 하러가기</Link>
            </LinkContainer>
        </div>
    );

}

export default SignUp;