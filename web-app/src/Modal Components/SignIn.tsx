import React, { useEffect, useState } from 'react';
import './SignIn.css';

const SignInModal: React.FC<{ isOpen: boolean; onClose: () => void; onSwitchToSignUp: () => void }> = ({
  isOpen,
  onClose,
  onSwitchToSignUp,
}) => {

  const handleSwitchToSignUp = (e: React.MouseEvent) => {
    e.preventDefault();  // Prevent the default behavior
    e.stopPropagation();  // Stop the event from propagating and closing the modal
    onSwitchToSignUp();
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="modal-content">
        <form onSubmit={handleSignIn} className="sign-in-form">
          <h3 className="sign-in-title">Sign in</h3>

          <button type="button" className="google-sign-in-button">
            <img
              src="/icon-images/signIn-with-google.png"
              alt="Sign in with Google"
              className="google-sign-in-img"
            />
          </button>

          <div className="or-text">or</div>

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
            <div className="forgot-password">
              <a href="#" onClick={() => {/* Handle forgot password logic */}}>Forgot password?</a>
            </div>
          </div>

          <button type="submit" className="signIn-button">Sign In</button>

          <div className="new-to-safepath">
            New to SafePATH? <a href="#" onClick={handleSwitchToSignUp} className="create-account-link">Create an account</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInModal;
