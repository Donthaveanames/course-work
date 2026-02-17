import HomePage from './Page/HomePage.jsx'
import User from './Page/User.jsx'
import checkLogin from './logic/login.jsx'
import SingIn from './Page/SingIn.jsx'
import Create_lesson from './Page/CreateLesson.jsx'
import Mail from './Page/Mail.jsx'
import VideoList from './Page/VideoList.jsx'

import PrivateRoute from './Page/contexts/PriviteRoute';
import { Routes, Route, Link } from 'react-router-dom';

function Personal(){
    if (checkLogin()) {
        return (<li>
            <NavLink
                to="/personal_account"
                className={({ isActive }) => isActive ? 'active' : ''}
            >
                <span>Personal account</span>
            </NavLink>
        </li>);
    }
    return (<NavLink
        to="/login"
        className={({ isActive }) => isActive ? 'active' : ''}
    >
        <span>Sing In</span>
    </NavLink>);
}

function Createlesson() {
    if (checkLogin()) {
        return (
            <li>
                <NavLink
                    to="/create_lesson"
                    className={({ isActive }) => isActive ? 'active' : ''}
                >
                    <span>Create lesson</span>
                </NavLink>
            </li>
        );
    }
}

function LetterSend(){
    if (checkLogin()) {
        return (<li>
            <NavLink
                to="/mail"
                className={({ isActive }) => isActive ? 'active' : ''}
            >
                <span>Messeg</span>
            </NavLink>
        </li>);
    }
}


function Video() {
    if (checkLogin()) {
        return (<li>
            <NavLink
                to="/video_lesson"
                className={({ isActive }) => isActive ? 'active' : ''}
            >
                <span>Video</span>
            </NavLink>
        </li>);
    }
}


import './Style/menu.components.modul.css';
import { NavLink } from 'react-router-dom';

export default function Menu() {
    return (
        <>
            <div className="Menu">
                <header className="Menu-header">
                    <div className="menu-logo">
                        <h2>DWFU</h2>
                        <p>Digital world</p>
                    </div>

                    <nav>
                        <ul>
                            <li>
                                <NavLink
                                    to="/"
                                    className={({ isActive }) => isActive ? 'active' : ''}
                                >
                                    <span>Welcome</span>
                                </NavLink>
                            </li>
                            <Personal />
                            <LetterSend />
                            <Video />
                            <Createlesson />
                        </ul>
                    </nav>

                    <div className="menu-footer">
                        <p>© 2026 ÄÂÔÓ</p>
                    </div>
                </header>
            </div>
            <div className="content">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/personal_account" element={<PrivateRoute><User /></PrivateRoute>} />
                    <Route path="/login" element={<SingIn />} />
                    <Route path="/video_lesson" element={<PrivateRoute><VideoList /></PrivateRoute> } />
                    <Route path="/create_lesson" element={<PrivateRoute><Create_lesson /></PrivateRoute>} />
                    <Route path="/mail" element={<PrivateRoute><Mail /></PrivateRoute>} />
                </Routes>
            </div> 
        </>
    );
}