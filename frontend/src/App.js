import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth, clearJustLoggedIn } from './store/slices/authSlice';
import { connectSocket, disconnectSocket } from './store/slices/socketSlice';
import Header from './components/Layout/Header';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import GameLobby from './pages/Game/GameLobby';
import GameRoom from './pages/Game/GameRoom';
import Learning from './pages/Learning/Learning';
import TutorialRoom from './pages/Learning/TutorialRoom';
import Profile from './pages/Profile/Profile';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import ProtectedRoute from './components/Auth/ProtectedRoute';

const { Content } = Layout;

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token, justLoggedIn } = useSelector(state => state.auth);
  const { error } = useSelector(state => state.socket);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (justLoggedIn) {
        const timer = setTimeout(() => {
          dispatch(checkAuth());
        }, 500);
        return () => clearTimeout(timer);
      } else {
        dispatch(checkAuth());
      }
    }
  }, [dispatch, justLoggedIn]);

  useEffect(() => {
    if (isAuthenticated && token) {
      dispatch(connectSocket(token));
    } else {
      dispatch(disconnectSocket());
    }

    return () => {
      dispatch(disconnectSocket());
    };
  }, [dispatch, isAuthenticated, token]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (justLoggedIn && isAuthenticated) {
      const timer = setTimeout(() => {
        dispatch(clearJustLoggedIn());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [justLoggedIn, isAuthenticated, dispatch]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '0' }}>
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lobby" 
            element={
              <ProtectedRoute>
                <GameLobby />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/game/:gameId" 
            element={
              <ProtectedRoute>
                <GameRoom />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learning" 
            element={
              <ProtectedRoute>
                <Learning />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tutorial/:tutorialId" 
            element={
              <ProtectedRoute>
                <TutorialRoom />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leaderboard" 
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;
