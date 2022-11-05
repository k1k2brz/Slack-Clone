import useInput from '@hooks/useInput';
import { Button, Error, Form, Header, Input, Label, LinkContainer } from '@pages/SignUp/styles';
import { IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import useSWR from 'swr';
// swr은 자동으로 새로 호출을 해주기 때문에 항상 최신 화면이 보인다.

const LogIn = () => {
    // swr - 로그인 후에 데이터를 전해줄 API
    // fetcher - 이 함수를 어떻게 처리할지
    // fetcher.ts의 res.data가 맨 앞
    const { data: userData, error, mutate } = useSWR<IUser | false>('/api/users', fetcher);
    // revalidateUser
    // const { data: userData, error, revalidate } = useSWR('http://localhost:3095/api/users', fetcher);
    const [logInError, setLogInError] = useState(false);
    const [email, onChangeEmail] = useInput('');
    const [password, onChangePassword] = useInput('');
    const onSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setLogInError(false);
            // withCredentials: true는 3번째자리
            axios
                .post(
                    '/api/users/login',
                    { email, password },
                    {
                        withCredentials: true,
                    },
                )
                .then((response) => {
                    // 2번째 자리(shouldRevalidate)에 false를 넣어주어야 요청이 안간다
                    mutate(response.data, false); // true일경우 OPTIMISTIC UI
                    // revalidateUser();
                })
                .catch((error) => {
                    setLogInError(error.response?.data?.code === 401);
                });
        },
        [email, password, mutate],
    );

    // if (data === undefined) {
    //     reutnr <div> 로딩중...</div >;
    // }

    // console.log(error, userData);
    // 로그인시 workspace로 보내기
    if (!error && userData) {
        console.log('로그인됨', userData);
        return <Routes><Route path="/*" element={<Navigate replace to="/workspace/sleact/channel/일반" />} /></Routes>
        // return <Redirect to="/workspace/channel" />;
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
                <Label id="password-label">
                    <span>비밀번호</span>
                    <div>
                        <Input type="password" id="password" name="password" value={password} onChange={onChangePassword} />
                    </div>
                    {logInError && <Error>이메일과 비밀번호 조합이 일치하지 않습니다.</Error>}
                </Label>
                <Button type="submit">로그인</Button>
            </Form>
            <LinkContainer>
                아직 회원이 아니신가요?&nbsp;
                <Link to="/signup">회원가입 하러가기</Link>
            </LinkContainer>
        </div>
    );
};

export default LogIn;