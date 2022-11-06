import React from 'react';
import loadable from '@loadable/component'
import { Routes, Route, Navigate, createBrowserRouter } from 'react-router-dom';

const LogIn = loadable(() => import('@pages/LogIn'))
const SignUp = loadable(() => import('@pages/SignUp'));
// const Channel = loadable(() => import('@pages/Ch'));
// const DirectMessage = loadable(() => import('@pages/DirectMessage'));
const Workspace = loadable(() => import('@layouts/Workspace'));

const App = () => {

    return (
        // Switch - 하나 누르면 다른쪽이 꺼지듯 여러개중에서 하나만 선택
        // Routes로 이름 바뀜
        <Routes>
            {/* Redirect가 Navigate로 바뀌었다. */}
            {/* <Route
                path="/*"
                element={<Navigate to="/login" replace />}
            /> */}
            <Route path="/" element={<LogIn />} />
            <Route path='/login/*' element={<LogIn />} />
            <Route path='/signup' element={<SignUp />} />
            {/* 라우트 파라미터 */}
            <Route path='/workspace/:workspace/*' element={<Workspace />} />
        </Routes>
    )
}

export default App;