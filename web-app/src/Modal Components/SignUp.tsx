import React, { useEffect, useState } from 'react';
import './SignUp.css';

const SignUpModal: React.FC<{ isOpen: boolean; onClose: () => void; onSwitchToSignIn: () => void }> = ({
  isOpen,
  onClose,
  onSwitchToSignIn,
}) => {
    const handleSwitchToSignIn = (e: React.MouseEvent) => {
        e.preventDefault();  // Prevent the default behavior
        e.stopPropagation();  // Stop the event from propagating and closing the modal
        onSwitchToSignIn();
        };
    
  const [firstname, setFirstname] = useState('');    
  const [lastname, setLastname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false); // New state

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign-in attempt', { email, password });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (isOpen) {
      // Push new history state when modal opens
      window.history.pushState(null, '', window.location.href);

      // Listen for "Back" button presses
      const handlePopState = () => {
        onClose();
      };

      // Add the event listener
      window.addEventListener('popstate', handlePopState);

      // Clean up event listener on unmount
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="signup-modal-content">
        <form onSubmit={handleSignIn} className="sign-in-form">
          <h3 className="sign-in-title">Create an account</h3>

          <button type="button" className="google-sign-in-button">
            <img
              src="/icon-images/signUp-with-google.png"
              alt="Sign in with Google"
              className="google-sign-in-img"
            />
          </button>

          <div className="or-text">or</div>

          <div className="form-name">
            <input
              type="firstname"
              id="firstname"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              required
              placeholder="First name"
            />
            <input
              type="lastname"
              id="lastname"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              required
              placeholder="Last name"
            />            
          </div>

          <div className="form-email">
            <input
              type="username"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Username"
            />
          </div>

          <div className="form-email">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email address"
            />
          </div>

          <div className="form-password">
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}                
                required
                placeholder="Password"
                maxLength={40} 
              />
              <span
                className="material-icons icon visibility-icon"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </div>

            {isPasswordFocused && (
              <div className="password-requirements">
                • At least 1 uppercase letter (A-Z)<br />
                • At least 1 number (0-9)<br />
                • Minimum of 8 characters
              </div>
            )}

          </div>

          <button type="submit" className="signIn-button">Create account</button>

          <div className="new-to-safepath">
            Already have an account? <a href="#" onClick={handleSwitchToSignIn} className="create-account-link">Sign in</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpModal;
