import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/auth';

const AuthForm = ({ defaultIsSignUp = false }) => {
  const [isSignUp, setIsSignUp] = useState(defaultIsSignUp);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Kiểm tra nếu người dùng đã đăng nhập, chuyển hướng đến dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear field error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors = {};
    
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Tên là bắt buộc';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    setLoading(true);
    setGeneralError('');
    
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    setLoading(true);
    setGeneralError('');
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };
      
      await register(userData);
      // Tự động chuyển sang form đăng nhập sau khi đăng ký thành công
      setIsSignUp(false);
      setFormData({
        ...formData,
        confirmPassword: ''
      });
      setGeneralError('Đăng ký thành công. Vui lòng đăng nhập.');
    } catch (error) {
      const errorMessage = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = () => {
    setIsSignUp(!isSignUp);
    setGeneralError('');
    setErrors({});
  };

  return (
    <StyledWrapper>
      <div className="wrapper">
        <div className="toggle-container">
          <div className="toggle-labels">
            <span className={isSignUp ? "" : "active"}>Đăng nhập</span>
            <label className="switch">
              <input 
                className="toggle" 
                type="checkbox"
                checked={isSignUp}
                onChange={handleToggleChange}
              />
              <span className="slider"></span>
            </label>
            <span className={isSignUp ? "active" : ""}>Đăng ký</span>
          </div>
        </div>

        <div className="card-container">
          <div className={`card ${isSignUp ? "flipped" : ""}`}>
            <div className="card-side front">
              <div className="title">Đăng nhập</div>
              {generalError && !isSignUp && (
                <div className="error-message">{generalError}</div>
              )}
              <form className="card-form" onSubmit={handleLogin}>
                <input 
                  type="email" 
                  placeholder="Email" 
                  name="email" 
                  className={`card-input ${errors.email ? 'input-error' : ''}`} 
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
                
                <input 
                  type="password" 
                  placeholder="Mật khẩu" 
                  name="password" 
                  className={`card-input ${errors.password ? 'input-error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
                
                <button 
                  type="submit"
                  className="card-btn flex justify-center items-center"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
              </form>
            </div>
            <div className="card-side back">
              <div className="title">Đăng ký</div>
              {generalError && isSignUp && (
                <div className="error-message">{generalError}</div>
              )}
              <form className="card-form" onSubmit={handleRegister}>
                <input 
                  type="text"
                  placeholder="Họ tên" 
                  name="name"
                  className={`card-input ${errors.name ? 'input-error' : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
                
                <input 
                  type="email" 
                  placeholder="Email" 
                  name="email" 
                  className={`card-input ${errors.email ? 'input-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
                
                <input 
                  type="password" 
                  placeholder="Mật khẩu" 
                  name="password" 
                  className={`card-input ${errors.password ? 'input-error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
                
                <input 
                  type="password" 
                  placeholder="Xác nhận mật khẩu" 
                  name="confirmPassword" 
                  className={`card-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                
                <button 
                  type="submit"
                  className="card-btn"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đăng ký'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f3f4f6;

  .wrapper {
    --input-focus: #2d8cf0;
    --font-color: #323232;
    --font-color-sub: #666;
    --bg-color: #fff;
    --bg-color-alt: #666;
    --main-color: #323232;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Toggle container */
  .toggle-container {
    margin-bottom: 40px;
  }
  
  .toggle-labels {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .toggle-labels span {
    font-weight: 600;
    color: var(--font-color-sub);
    cursor: pointer;
  }
  
  .toggle-labels span.active {
    color: var(--main-color);
    text-decoration: underline;
  }

  /* Switch styles */
  .switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }

  .toggle {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    box-sizing: border-box;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px var(--main-color);
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-color);
    transition: 0.3s;
  }

  .slider:before {
    box-sizing: border-box;
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    border: 2px solid var(--main-color);
    border-radius: 4px;
    left: 2px;
    bottom: 2px;
    background-color: var(--bg-color);
    box-shadow: 0 2px 0 var(--main-color);
    transition: 0.3s;
  }

  .toggle:checked + .slider {
    background-color: var(--input-focus);
  }

  .toggle:checked + .slider:before {
    transform: translateX(26px);
  }

  /* Card container */
  .card-container {
    perspective: 1000px;
    width: 320px;
  }

  .card {
    position: relative;
    width: 100%;
    height: 400px;
    transition: transform 0.8s;
    transform-style: preserve-3d;
  }

  .card.flipped {
    transform: rotateY(180deg);
  }

  .card-side {
    padding: 20px;
    position: absolute;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    background: lightgrey;
    border-radius: 8px;
    border: 2px solid var(--main-color);
    box-shadow: 4px 4px var(--main-color);
    display: flex;
    flex-direction: column;
  }

  .front {
    z-index: 2;
  }

  .back {
    transform: rotateY(180deg);
  }

  .title {
    margin: 10px 0 20px;
    font-size: 25px;
    font-weight: 900;
    text-align: center;
    color: var(--main-color);
  }

  .card-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .card-input {
    width: 250px;
    height: 40px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    font-size: 15px;
    font-weight: 600;
    color: var(--font-color);
    padding: 5px 10px;
    outline: none;
  }

  .card-input::placeholder {
    color: var(--font-color-sub);
    opacity: 0.8;
  }

  .card-input:focus {
    border: 2px solid var(--input-focus);
  }

  .card-btn {
    margin: 15px 0 0;
    width: 140px;
    height: 40px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    font-size: 16px;
    font-weight: 600;
    color: var(--font-color);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
    display: inline-block;
    text-align: center;
    line-height: 36px;
  }

  .card-btn:active {
    box-shadow: 0px 0px var(--main-color);
    transform: translate(3px, 3px);
  }

  .error-message {
    background-color: #fee2e2;
    border: 1px solid #ef4444;
    color: #b91c1c;
    padding: 8px;
    border-radius: 5px;
    font-size: 14px;
    margin-bottom: 10px;
  }

  .input-error {
    border-color: #ef4444;
  }

  .error-text {
    color: #b91c1c;
    font-size: 12px;
    margin-top: -10px;
    text-align: left;
    width: 250px;
  }
`;

export default AuthForm; 