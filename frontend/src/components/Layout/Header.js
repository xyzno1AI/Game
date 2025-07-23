import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space } from 'antd';
import { UserOutlined, LogoutOutlined, TrophyOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const { Header: AntHeader } = Layout;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
        个人资料
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const menuItems = [
    {
      key: '/dashboard',
      label: '首页',
    },
    {
      key: '/lobby',
      label: '游戏大厅',
    },
    {
      key: '/learning',
      label: '学习中心',
      icon: <BookOutlined />,
    },
    {
      key: '/leaderboard',
      label: '排行榜',
      icon: <TrophyOutlined />,
    },
  ];

  if (!isAuthenticated) {
    return (
      <AntHeader style={{ 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
          围棋游戏平台
        </div>
        <Space>
          <Button type="text" onClick={() => navigate('/login')}>
            登录
          </Button>
          <Button type="primary" onClick={() => navigate('/register')}>
            注册
          </Button>
        </Space>
      </AntHeader>
    );
  }

  return (
    <AntHeader style={{ 
      background: '#fff', 
      borderBottom: '1px solid #f0f0f0',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div 
          style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1890ff',
            marginRight: '32px',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/dashboard')}
        >
          围棋游戏平台
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ border: 'none', flex: 1 }}
          onClick={({ key }) => navigate(key)}
        />
      </div>
      
      <Space>
        <span>欢迎, {user?.username}</span>
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Avatar 
            icon={<UserOutlined />} 
            src={user?.profile?.avatar}
            style={{ cursor: 'pointer' }}
          />
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
